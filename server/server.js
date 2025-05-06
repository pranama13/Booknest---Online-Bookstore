import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import nodemailer from 'nodemailer';
import { body, validationResult } from 'express-validator';
import axios from 'axios';
import Redis from 'ioredis';
import dns from 'dns/promises';

// Validate critical environment variables
const requiredEnvVars = ['JWT_SECRET', 'MONGO_URI'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
if (missingEnvVars.length > 0) {
  console.error(`Missing critical environment variables: ${missingEnvVars.join(', ')}`);
  process.exit(1);
}

// Warn about optional environment variables
const optionalEnvVars = ['EMAIL_USER', 'EMAIL_PASS', 'GOOGLE_BOOKS_API_KEY', 'REDIS_URL'];
const missingOptionalVars = optionalEnvVars.filter(envVar => !process.env[envVar]);
if (missingOptionalVars.length > 0) {
  console.warn(`Missing optional environment variables: ${missingOptionalVars.join(', ')}. Some features (email, book search, caching) may be limited.`);
}

// Initialize Express and middleware
const app = express();
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

// Redis for caching (optional)
let redis;
try {
  redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  redis.on('error', (error) => {
    console.warn('Redis connection error:', error.message, 'Caching disabled.');
    redis = null;
  });
  redis.on('connect', () => console.log('Connected to Redis'));
} catch (error) {
  console.warn('Redis initialization failed:', error.message, 'Caching disabled.');
  redis = null;
}

// MongoDB connection with retry logic and explicit TLS settings
const connectMongoDB = async () => {
  let retries = 5;
  // Check DNS resolution
  try {
    const srvRecords = await dns.resolveSrv('_mongodb._tcp.cluster0.lyuqg7s.mongodb.net');
    console.log('DNS resolution successful:', srvRecords);
  } catch (dnsError) {
    console.error('DNS resolution failed:', dnsError.message);
    return;
  }

  while (retries > 0) {
    try {
      await mongoose.connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        tls: true,
        tlsAllowInvalidCertificates: false, // Ensure valid certificates
        minDHSize: 2048, // Ensure strong DH parameters
        ssl: true, // Explicitly enable SSL
      });
      console.log('Connected to MongoDB successfully');
      return;
    } catch (error) {
      console.error('MongoDB connection error:', {
        message: error.message,
        code: error.code,
        stack: error.stack,
      }, `Retries left: ${retries}`);
      retries -= 1;
      if (retries === 0) {
        console.error('MongoDB connection failed after all retries. Some endpoints may be unavailable.');
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
};

connectMongoDB();

// Check MongoDB connection status
const isMongoConnected = () => mongoose.connection.readyState === 1;

// Schemas
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  fullName: String,
  address: String,
  phoneNumber: String,
  birthday: Date,
  isVerified: { type: Boolean, default: false },
  verificationToken: String
});

const cartSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [{
    bookId: { type: String, required: true },
    title: { type: String, required: true },
    authors: [{ type: String }],
    price: { type: Number, required: true },
    quantity: { type: Number, default: 1 },
    thumbnail: { type: String }
  }],
  updatedAt: { type: Date, default: Date.now }
});

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [{
    bookId: { type: String, required: true },
    title: { type: String, required: true },
    authors: [{ type: String }],
    price: { type: Number, required: true },
    quantity: { type: Number, default: 1 }
  }],
  total: { type: Number, required: true },
  shippingAddress: String,
  status: { type: String, enum: ['pending', 'paid'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Cart = mongoose.model('Cart', cartSchema);
const Order = mongoose.model('Order', orderSchema);

// Nodemailer setup (optional)
let transporter;
if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  transporter.verify((error, success) => {
    if (error) console.error('Nodemailer configuration error:', error.message);
    else console.log('Nodemailer ready to send emails');
  });
} else {
  console.warn('Nodemailer not configured. Email features disabled.');
}

// Google Books API
const GOOGLE_BOOKS_API = 'https://www.googleapis.com/books/v1/volumes';
const API_KEY = process.env.GOOGLE_BOOKS_API_KEY || '';

// Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ message: 'Authentication required' });
  
  try {
    console.log('Verifying token with JWT_SECRET:', process.env.JWT_SECRET);
    console.log('Token:', token);
    const user = jwt.verify(token, process.env.JWT_SECRET);
    req.user = user;
    next();
  } catch (error) {
    console.error('Token verification error:', error.message);
    res.status(403).json({ message: `Invalid token: ${error.message}` });
  }
};

// Health check
app.get('/api/health', async (req, res) => {
  try {
    if (isMongoConnected()) {
      await mongoose.connection.db.admin().ping();
    }
    const redisStatus = redis ? 'connected' : 'disabled';
    const nodemailerStatus = transporter ? 'configured' : 'disabled';
    res.json({ 
      status: 'ok', 
      mongodb: isMongoConnected() ? 'connected' : 'disconnected', 
      redis: redisStatus, 
      nodemailer: nodemailerStatus 
    });
  } catch (error) {
    console.error('Health check error:', error.message);
    res.status(500).json({ status: 'error', message: 'MongoDB connection failed' });
  }
});

// Book management (Google Books API)
app.get('/api/books', async (req, res) => {
  try {
    const { q = 'fiction', maxResults = 25, startIndex = 0 } = req.query;

    if (!q || typeof q !== 'string') {
      return res.status(400).json({ message: 'Invalid search query' });
    }

    if (!API_KEY) {
      console.warn('Google Books API key missing. Using limited functionality.');
    }

    const cacheKey = `books:${q}:${startIndex}:${maxResults}`;
    if (redis) {
      const cachedData = await redis.get(cacheKey);
      if (cachedData) {
        return res.json(JSON.parse(cachedData));
      }
    }

    const query = `q=${encodeURIComponent(q)}&maxResults=${maxResults}&startIndex=${startIndex}${API_KEY ? `&key=${API_KEY}` : ''}`;
    const url = `${GOOGLE_BOOKS_API}?${query}`;
    const response = await axios.get(url);

    const books = (response.data.items || []).map(item => ({
      id: item.id || `book_${Math.random().toString(36).substr(2, 9)}`,
      title: item.volumeInfo?.title || 'Untitled Book',
      authors: Array.isArray(item.volumeInfo?.authors) ? item.volumeInfo.authors : ['Unknown Author'],
      description: item.volumeInfo?.description || 'No description available',
      price: item.saleInfo?.listPrice?.amount ? parseFloat(item.saleInfo.listPrice.amount.toFixed(2)) : 10.99,
      currency: item.saleInfo?.listPrice?.currencyCode || 'USD',
      thumbnail: item.volumeInfo?.imageLinks?.thumbnail?.replace('http://', 'https://') || 'https://via.placeholder.com/150?text=No+Image',
      stock: Math.floor(Math.random() * 100) + 1
    }));

    const result = {
      items: books,
      totalItems: response.data.totalItems || 0
    };

    if (redis) {
      await redis.setex(cacheKey, 3600, JSON.stringify(result));
    }

    res.json(result);
  } catch (error) {
    console.error('Books API error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    res.status(500).json({ message: `Failed to fetch books: ${error.message}` });
  }
});

app.get('/api/books/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const url = `${GOOGLE_BOOKS_API}/${id}${API_KEY ? `?key=${API_KEY}` : ''}`;
    const response = await axios.get(url);
    const item = response.data;
    const book = {
      id: item.id || `book_${Math.random().toString(36).substr(2, 9)}`,
      title: item.volumeInfo?.title || 'Untitled Book',
      authors: Array.isArray(item.volumeInfo?.authors) ? item.volumeInfo.authors : ['Unknown Author'],
      description: item.volumeInfo?.description || 'No description available',
      price: item.saleInfo?.listPrice?.amount ? parseFloat(item.saleInfo.listPrice.amount.toFixed(2)) : 10.99,
      currency: item.saleInfo?.listPrice?.currencyCode || 'USD',
      thumbnail: item.volumeInfo?.imageLinks?.thumbnail?.replace('http://', 'https://') || 'https://via.placeholder.com/150?text=No+Image',
      stock: Math.floor(Math.random() * 100) + 1
    };
    res.json(book);
  } catch (error) {
    console.error('Book details error:', error.message);
    res.status(500).json({ message: `Failed to fetch book: ${error.message}` });
  }
});

// Authentication endpoints
app.post('/api/auth/signup', [
  body('username').notEmpty().trim().escape(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('fullName').notEmpty().trim().escape()
], async (req, res) => {
  if (!isMongoConnected()) {
    return res.status(503).json({ message: 'Database unavailable. Please try again later.' });
  }
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Invalid input', errors: errors.array() });
    }

    const { username, email, password, fullName } = req.body;
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ 
        message: existingUser.email === email 
          ? 'Email already exists' 
          : 'Username already exists'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '100d' });
    
    const user = new User({
      username,
      email,
      password: hashedPassword,
      fullName,
      verificationToken
    });
    
    await user.save();

    if (transporter) {
      try {
        const verificationUrl = `http://localhost:5000/api/auth/verify/${verificationToken}`;
        await transporter.sendMail({
          from: `"BookNest" <${process.env.EMAIL_USER}>`,
          to: email,
          subject: 'Verify Your Email',
          html: `
            <h3>Please verify your email</h3>
            <p>Click <a href="${verificationUrl}">here</a> to verify your email address.</p>
            <p>This link will expire in 7 days.</p>
          `
        });
      } catch (emailError) {
        console.error('Email sending error:', emailError.message);
        return res.status(201).json({ 
          message: 'User created successfully, but failed to send verification email. Please try verifying manually or contact support.',
          error: emailError.message
        });
      }
    }

    res.status(201).json({ message: 'User created successfully. Please verify your email.' });
  } catch (error) {
    console.error('Signup error:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      res.status(400).json({ message: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists` });
    } else {
      res.status(500).json({ message: `Signup failed: ${error.message}` });
    }
  }
});

app.get('/api/auth/verify/:token', async (req, res) => {
  if (!isMongoConnected()) {
    return res.status(503).json({ message: 'Database unavailable. Please try again later.' });
  }
  try {
    const { token } = req.params;
    const { email } = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await User.findOneAndUpdate(
      { email, verificationToken: token },
      { isVerified: true, verificationToken: null },
      { new: true }
    );
    
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired verification token' });
    }
    
    res.json({ message: 'Email verified successfully. You can now log in.' });
  } catch (error) {
    console.error('Verification error:', error.message);
    res.status(400).json({ message: `Invalid or expired verification token: ${error.message}` });
  }
});

app.post('/api/auth/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], async (req, res) => {
  if (!isMongoConnected()) {
    return res.status(503).json({ message: 'Database unavailable. Please try again later.' });
  }
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Invalid input', errors: errors.array() });
    }

    const { email, password, rememberMe } = req.body;
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    if (!user.isVerified) {
      return res.status(400).json({ message: 'Please verify your email before logging in' });
    }
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: rememberMe ? '7d' : '24h' }
    );
    console.log('Generated token:', token);
    
    res.json({ token });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ message: `Login failed: ${error.message}` });
  }
});

app.post('/api/auth/refresh', authenticateToken, async (req, res) => {
  try {
    if (!isMongoConnected()) {
      return res.status(503).json({ message: 'Database unavailable. Please try again later.' });
    }
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const newToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    console.log('Refreshed token:', newToken);
    res.json({ token: newToken });
  } catch (error) {
    console.error('Token refresh error:', error.message);
    res.status(500).json({ message: `Failed to refresh token: ${error.message}` });
  }
});

// User profile endpoints
app.get('/api/users/me', authenticateToken, async (req, res) => {
  try {
    if (!isMongoConnected()) {
      return res.status(503).json({ message: 'Database unavailable. Please try again later.' });
    }
    const user = await User.findById(req.user.userId).select('-password -verificationToken');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    console.error('Profile fetch error:', error.message);
    res.status(500).json({ message: `Failed to fetch user: ${error.message}` });
  }
});

app.patch('/api/users/me', authenticateToken, [
  body('fullName').optional().trim().escape(),
  body('address').optional().trim().escape(),
  body('phoneNumber').optional().trim().escape(),
  body('birthday').optional().isISO8601().toDate()
], async (req, res) => {
  try {
    if (!isMongoConnected()) {
      return res.status(503).json({ message: 'Database unavailable. Please try again later.' });
    }
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Invalid input', errors: errors.array() });
    }

    const updates = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password -verificationToken');
    
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    console.error('Profile update error:', error.message);
    res.status(500).json({ message: `Failed to update user: ${error.message}` });
  }
});

// Cart management
app.get('/api/cart', authenticateToken, async (req, res) => {
  try {
    if (!isMongoConnected()) {
      return res.status(503).json({ message: 'Database unavailable. Please try again later.' });
    }
    let cart = await Cart.findOne({ userId: req.user.userId });
    if (!cart) {
      cart = new Cart({ userId: req.user.userId, items: [] });
      await cart.save();
    }
    res.json(cart);
  } catch (error) {
    console.error('Cart fetch error:', error.message);
    res.status(500).json({ message: `Failed to fetch cart: ${error.message}` });
  }
});

app.post('/api/cart', authenticateToken, [
  body('bookId').notEmpty().trim().escape(),
  body('title').notEmpty().trim().escape(),
  body('authors').isArray(),
  body('price').isFloat({ min: 0 }),
  body('quantity').isInt({ min: 1 }).toInt(),
  body('thumbnail').optional().isString().trim()
], async (req, res) => {
  try {
    if (!isMongoConnected()) {
      return res.status(503).json({ message: 'Database unavailable. Please try again later.' });
    }
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error('Cart validation errors:', errors.array());
      return res.status(400).json({ message: 'Invalid input', errors: errors.array() });
    }

    const { bookId, title, authors, price, quantity, thumbnail } = req.body;
    console.log('Adding to cart:', { bookId, title, authors, price, quantity, thumbnail });
    let cart = await Cart.findOne({ userId: req.user.userId });

    if (!cart) {
      cart = new Cart({ userId: req.user.userId, items: [] });
    }

    const itemIndex = cart.items.findIndex(item => item.bookId === bookId);
    if (itemIndex >= 0) {
      cart.items[itemIndex].quantity += quantity;
      if (thumbnail) cart.items[itemIndex].thumbnail = thumbnail;
    } else {
      cart.items.push({ bookId, title, authors, price, quantity, thumbnail });
    }

    cart.updatedAt = Date.now();
    await cart.save();
    console.log('Cart updated:', cart);
    res.json(cart);
  } catch (error) {
    console.error('Cart update error:', error.message);
    res.status(500).json({ message: `Failed to update cart: ${error.message}` });
  }
});

app.delete('/api/cart', authenticateToken, async (req, res) => {
  try {
    if (!isMongoConnected()) {
      return res.status(503).json({ message: 'Database unavailable. Please try again later.' });
    }
    const { bookId } = req.body;
    const cart = await Cart.findOne({ userId: req.user.userId });
    
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    cart.items = cart.items.filter(item => item.bookId !== bookId);
    cart.updatedAt = Date.now();
    await cart.save();
    res.json(cart);
  } catch (error) {
    console.error('Cart delete error:', error.message);
    res.status(500).json({ message: `Failed to delete item: ${error.message}` });
  }
});

app.delete('/api/cart/all', authenticateToken, async (req, res) => {
  try {
    if (!isMongoConnected()) {
      return res.status(503).json({ message: 'Database unavailable. Please try again later.' });
    }
    const cart = await Cart.findOne({ userId: req.user.userId });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });
    cart.items = [];
    cart.updatedAt = Date.now();
    await cart.save();
    res.json(cart);
  } catch (error) {
    console.error('Cart clear error:', error.message);
    res.status(500).json({ message: `Failed to clear cart: ${error.message}` });
  }
});

// Order management
app.get('/api/orders', authenticateToken, async (req, res) => {
  try {
    if (!isMongoConnected()) {
      return res.status(503).json({ message: 'Database unavailable. Please try again later.' });
    }
    const orders = await Order.find({ userId: req.user.userId, status: 'paid' });
    res.json(orders);
  } catch (error) {
    console.error('Orders fetch error:', error.message);
    res.status(500).json({ message: `Failed to fetch orders: ${error.message}` });
  }
});

app.post('/api/orders', authenticateToken, async (req, res) => {
  try {
    if (!isMongoConnected()) {
      return res.status(503).json({ message: 'Database unavailable. Please try again later.' });
    }
    const { items, total, status, shippingAddress } = req.body;
    
    if (!items?.length || !total) {
      return res.status(400).json({ message: 'Invalid order data' });
    }

    const order = new Order({
      userId: req.user.userId,
      items,
      total,
      status,
      shippingAddress
    });

    await order.save();
    if (status === 'paid') {
      await Cart.findOneAndUpdate(
        { userId: req.user.userId },
        { $set: { items: [], updatedAt: Date.now() } }
      );
    }
    
    res.status(201).json({ message: 'Order placed successfully', order });
  } catch (error) {
    console.error('Order creation error:', error.message);
    res.status(500).json({ message: `Failed to create order: ${error.message}` });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));