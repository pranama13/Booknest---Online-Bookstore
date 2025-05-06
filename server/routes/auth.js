// server/routes/auth.js (or wherever your route is defined)
import express from 'express';
import bcrypt from 'bcrypt';
import User from '../models/User.js'; // 👈 Add `.js` extension!

const router = express.Router();;

router.post('/signup', async (req, res) => {
    console.log('Received request with body:', JSON.stringify(req.body, null, 2));
  
    try {
      if (!('name' in req.body) || typeof req.body.name !== 'string' || req.body.name.trim() === '') {
        console.log('Validation failed: Name is missing or invalid');
        return res.status(400).json({ error: 'Name is required and must not be empty' });
      }
      if (!('email' in req.body) || typeof req.body.email !== 'string' || req.body.email.trim() === '') {
        console.log('Validation failed: Email is missing or invalid');
        return res.status(400).json({ error: 'Email is required and must not be empty' });
      }
      if (!('password' in req.body) || typeof req.body.password !== 'string' || req.body.password.trim() === '') {
        console.log('Validation failed: Password is missing or invalid');
        return res.status(400).json({ error: 'Password is required and must not be empty' });
      }
  
      const { name, email, password } = req.body;
      console.log('Extracted data:', { name, email, password });
  
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        console.log('User already exists');
        return res.status(400).json({ error: 'User already exists' });
      }
  
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = new User({ name, email, password: hashedPassword });
      console.log('Attempting to save user:', newUser);
      await newUser.save();
      console.log('User saved successfully');
      res.status(201).json({ message: 'Registration successful!' });
    } catch (err) {
      console.error('Error during signup:', err);
      if (err.name === 'ValidationError') {
        return res.status(400).json({ error: err.message });
      }
      res.status(500).json({ error: 'Server error' });
    }
  });
  export default router;