import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import generateInvoice from './generateInvoice';
import './Checkout.css';
import './Home.css'; // Import Home.css for header and footer styles
import LoadingAnimation from './LoadingAnimation';

function Checkout() {
  const [cart, setCart] = useState(null);
  const [shipping, setShipping] = useState({
    name: '',
    address: '',
    city: '',
    postalCode: '',
    country: ''
  });
  const [payment, setPayment] = useState({
    cardNumber: '',
    expiry: '',
    cvv: ''
  });
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [navbarOpaque, setNavbarOpaque] = useState(false);
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const navigate = useNavigate();

  const token = localStorage.getItem('token');
  const isAuthenticated = !!token;

  // Categories for dropdown
  const categories = [
    'Fiction', 'Non-Fiction', 'Sci-Fi', 'Fantasy', 'Biography',
    'Mystery', 'Romance', 'History', 'Self-Help', 'Children'
  ];

  // Category to Open Library subject mapping
  const categoryToSubject = {
    Fiction: 'fiction',
    'Non-Fiction': 'nonfiction',
    'Sci-Fi': 'science_fiction',
    Fantasy: 'fantasy',
    Biography: 'biography',
    Mystery: 'mystery',
    Romance: 'romance',
    History: 'history',
    'Self-Help': 'self_help',
    Children: 'juvenile'
  };

  // Fetch cart items
  useEffect(() => {
    const fetchCart = async () => {
      try {
        if (!token) {
          navigate('/login', { state: { from: '/checkout' } });
          return;
        }
        const response = await axios.get('http://localhost:5000/api/cart', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCart(response.data);
        setLoading(false);
      } catch (err) {
        setErrors({ general: 'Failed to fetch cart' });
        setLoading(false);
      }
    };
    fetchCart();
  }, [navigate, token]);

  // Navbar opacity on scroll
  useEffect(() => {
    const handleScroll = () => {
      setNavbarOpaque(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch suggestions for search
  useEffect(() => {
    if (!searchInput.trim()) {
      setSuggestions([]);
      return;
    }
    const fetchSuggestions = async () => {
      try {
        const response = await fetch(
          `https://openlibrary.org/search.json?q=${encodeURIComponent(searchInput)}&limit=5`
        );
        if (!response.ok) throw new Error('Failed to fetch suggestions');
        const data = await response.json();
        const filteredSuggestions = data.docs.map((book) => ({
          id: book.key,
          title: book.title || 'Untitled',
          authors: book.author_name || ['Unknown'],
          thumbnail: book.cover_i
            ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`
            : 'https://via.placeholder.com/150'
        }));
        setSuggestions(filteredSuggestions);
      } catch (err) {
        console.error('Fetch suggestions error:', err);
      }
    };
    fetchSuggestions();
  }, [searchInput]);

  const validateForm = () => {
    const newErrors = {};
    if (!shipping.name.trim()) newErrors.name = 'Name is required';
    if (!shipping.address.trim()) newErrors.address = 'Address is required';
    if (!shipping.city.trim()) newErrors.city = 'City is required';
    if (!shipping.postalCode.trim()) newErrors.postalCode = 'Postal code is required';
    if (!shipping.country.trim()) newErrors.country = 'Country is required';
    if (!payment.cardNumber.match(/^\d{16}$/)) newErrors.cardNumber = 'Enter a valid 16-digit card number';
    if (!payment.expiry.match(/^(0[1-9]|1[0-2])\/\d{2}$/)) newErrors.expiry = 'Enter expiry in MM/YY format';
    if (!payment.cvv.match(/^\d{3}$/)) newErrors.cvv = 'Enter a valid 3-digit CVV';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleShippingChange = (e) => {
    setShipping({ ...shipping, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: null });
  };

  const handlePaymentChange = (e) => {
    setPayment({ ...payment, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: null });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const total = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const shippingCost = total > 5000 ? 0 : 500;
      const invoiceNumber = `INV-${Date.now()}`;
      const response = await axios.post('http://localhost:5000/api/orders', {
        items: cart.items,
        total: total + shippingCost,
        status: 'paid',
        shippingAddress: `${shipping.name}, ${shipping.address}, ${shipping.city}, ${shipping.postalCode}, ${shipping.country}`,
        paymentMethod: 'Credit Card'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Generate and download invoice
      generateInvoice({
        invoiceNumber,
        date: new Date().toLocaleDateString(),
        customerName: shipping.name,
        shippingAddress: `${shipping.address}, ${shipping.city}, ${shipping.postalCode}, ${shipping.country}`,
        items: cart.items,
        total
      });

      await axios.delete('http://localhost:5000/api/cart/all', {
        headers: { Authorization: `Bearer ${token}` },
      });

      setSuccess('Order placed successfully! Invoice downloaded.');
      setTimeout(() => {
        setSuccess(null);
        navigate('/orders');
      }, 3000);
    } catch (err) {
      setErrors({ general: 'Failed to place order: ' + (err.response?.data?.message || err.message) });
    } finally {
      setLoading(false);
    }
  };

  const handleSearchInputChange = (e) => {
    setSearchInput(e.target.value);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const query = searchInput.trim();
    if (!query) {
      setErrors({ general: 'Please enter a search term' });
      return;
    }
    setSearchQuery(query);
    setSuggestions([]);
    navigate(`/books?query=${encodeURIComponent(query)}`);
  };

  const clearSearch = () => {
    setSearchInput('');
    setSearchQuery('');
    setSuggestions([]);
  };

  const handleSuggestionClick = (suggestion) => {
    setSearchInput(suggestion.title);
    setSearchQuery(suggestion.title);
    setSuggestions([]);
    navigate(`/books?query=${encodeURIComponent(suggestion.title)}`);
  };

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    setSearchQuery('');
    setSearchInput('');
    setSuggestions([]);
    setIsDropdownOpen(false);
    navigate(`/books?category=${encodeURIComponent(category)}`);
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleLogoClick = () => {
    setSearchQuery('');
    setSearchInput('');
    setSelectedCategory(null);
    setSuggestions([]);
    navigate('/');
  };

  const handleSignOut = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    if (!email.includes('@')) {
      setEmailError('Please enter a valid email address');
      return;
    }
    setEmailError('');
    toast.success('Subscribed successfully!', {
      position: 'top-right',
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
    setEmail('');
  };

  if (loading) return <LoadingAnimation />;

  const total = cart?.items.reduce((sum, item) => sum + item.price * item.quantity, 0) || 0;

  return (
    <div className="home-container">
      {!isAuthenticated && (
        <div className="auth-buttons animate-fade-in">
          <Link to="/login" className="login-button animate-scale-up">Login</Link>
          <Link to="/signup" className="signup-button animate-scale-up">Sign Up</Link>
        </div>
      )}
      <nav className={`navbar ${navbarOpaque ? 'opaque' : ''} animate-slide-down`}>
        <div className="navbar-brand">
          <Link to="/" className="navbar-logo animate-fade-in" onClick={handleLogoClick}>
            <span className="logo-text">BookNest</span>
          </Link>
        </div>
        <div className="navbar-center">
          <form onSubmit={handleSearchSubmit} className={`navbar-search ${isSearchFocused ? 'focused' : ''} animate-fade-in`}>
          </form>
            <div className="search-input-container">
              <span className="search-icon"></span>
              <input
                type="text"
                name="search"
                placeholder="Search books by title, author, or genre..."
                className="search-input"
                value={searchInput}
                onChange={handleSearchInputChange}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
              />
              {searchInput && (
                <button type="button" className="clear-search-button animate-scale-up" onClick={clearSearch}>
                  ✕
                </button>
              )}
            </div>
            {suggestions.length > 0 && isSearchFocused && (
              <div className="search-suggestions open animate-slide-down">
                {suggestions.map((suggestion) => (
                  <div
                    key={suggestion.id}
                    className="suggestion-item animate-fade-in"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    <img
                      src={suggestion.thumbnail}
                      alt={suggestion.title}
                      className="suggestion-thumbnail"
                      onError={(e) => (e.target.src = 'https://via.placeholder.com/150')}
                    />
                    <div>
                      <div className="suggestion-title">{suggestion.title}</div>
                      <div className="suggestion-author">{suggestion.authors.join(', ')}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        <div className="navbar-links">
          <NavLink to="/orders" className="navbar-link animate-fade-in" activeClassName="active">
            Orders
          </NavLink>
          <div className="dropdown">
            <button className="navbar-link dropdown-toggle animate-fade-in" onClick={toggleDropdown}>
              Categories
            </button>
            {isDropdownOpen && (
              <ul className="dropdown-menu animate-slide-down">
                {categories.map((category) => (
                  <li key={category}>
                    <button
                      className="dropdown-item animate-fade-in"
                      onClick={() => handleCategorySelect(category)}
                    >
                      {category}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <NavLink to="/reviews" className="navbar-link animate-fade-in" activeClassName="active">
            Reviews
          </NavLink>
          <NavLink to="/about" className="navbar-link animate-fade-in" activeClassName="active">
            About Us
          </NavLink>
          <NavLink to="/cart" className="navbar-link animate-fade-in" activeClassName="active">
            Cart
          </NavLink>
          {isAuthenticated ? (
            <>
              <NavLink to="/account" className="navbar-link animate-fade-in" activeClassName="active">
                Account
              </NavLink>
              <button onClick={handleSignOut} className="navbar-link animate-fade-in">
                Sign Out
              </button>
            </>
          ) : (
            <NavLink to="/login" className="navbar-link animate-fade-in" activeClassName="active">
              Login / Signup
            </NavLink>
          )}
        </div>
      </nav>
      <section className="secondary-nav-section animate-fade-in-up">
        <nav className="secondary-navbar">
          <button className="secondary-nav-button animate-scale-up" onClick={() => navigate('/')}>
            All Products
          </button>
          <button className="secondary-nav-button animate-scale-up" onClick={() => toast.info('This feature is coming soon!')}>
            Bestsellers
          </button>
          <button className="secondary-nav-button animate-scale-up" onClick={() => toast.info('This feature is coming soon!')}>
            New Arrivals
          </button>
          <button className="secondary-nav-button animate-scale-up" onClick={() => toast.info('This feature is coming soon!')}>
            Bundles
          </button>
          <button className="secondary-nav-button animate-scale-up" onClick={() => toast.info('This feature is coming soon!')}>
            Gift Cards
          </button>
        </nav>
      </section>
      <div className="checkout-container">
        {(!cart || cart.items.length === 0) ? (
          <>
            <p>Your cart is empty.</p>
            <button
              onClick={() => navigate('/')}
              className="place-order-btn"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              Continue Shopping
            </button>
          </>
        ) : (
          <>
            <h2>Checkout</h2>
            {success && (
              <div className="alert alert-success">
                {success}
              </div>
            )}
            {errors.general && (
              <div className="alert alert-error">
                {errors.general}
              </div>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <form onSubmit={handleSubmit} className="checkout-form">
                  <h3>Shipping Information</h3>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Name</label>
                      <input
                        type="text"
                        name="name"
                        value={shipping.name}
                        onChange={handleShippingChange}
                        className={errors.name ? 'error' : ''}
                        required
                      />
                      {errors.name && <p>{errors.name}</p>}
                    </div>
                    <div className="form-group">
                      <label>Address</label>
                      <input
                        type="text"
                        name="address"
                        value={shipping.address}
                        onChange={handleShippingChange}
                        className={errors.address ? 'error' : ''}
                        required
                      />
                      {errors.address && <p>{errors.address}</p>}
                    </div>
                    <div className="form-group">
                      <label>City</label>
                      <input
                        type="text"
                        name="city"
                        value={shipping.city}
                        onChange={handleShippingChange}
                        className={errors.city ? 'error' : ''}
                        required
                      />
                      {errors.city && <p>{errors.city}</p>}
                    </div>
                    <div className="form-group">
                      <label>Postal Code</label>
                      <input
                        type="text"
                        name="postalCode"
                        value={shipping.postalCode}
                        onChange={handleShippingChange}
                        className={errors.postalCode ? 'error' : ''}
                        required
                      />
                      {errors.postalCode && <p>{errors.postalCode}</p>}
                    </div>
                    <div className="form-group full-width">
                      <label>Country</label>
                      <input
                        type="text"
                        name="country"
                        value={shipping.country}
                        onChange={handleShippingChange}
                        className={errors.country ? 'error' : ''}
                        required
                      />
                      {errors.country && <p>{errors.country}</p>}
                    </div>
                  </div>
                  <h3>Payment Information</h3>
                  <div className="form-grid">
                    <div className="form-group full-width">
                      <label>Card Number</label>
                      <input
                        type="text"
                        name="cardNumber"
                        value={payment.cardNumber}
                        onChange={handlePaymentChange}
                        placeholder="1234 5678 9012 3456"
                        className={errors.cardNumber ? 'error' : ''}
                        required
                      />
                      {errors.cardNumber && <p>{errors.cardNumber}</p>}
                    </div>
                    <div className="form-group">
                      <label>Expiry Date</label>
                      <input
                        type="text"
                        name="expiry"
                        value={payment.expiry}
                        onChange={handlePaymentChange}
                        placeholder="MM/YY"
                        className={errors.expiry ? 'error' : ''}
                        required
                      />
                      {errors.expiry && <p>{errors.expiry}</p>}
                    </div>
                    <div className="form-group">
                      <label>CVV</label>
                      <input
                        type="text"
                        name="cvv"
                        value={payment.cvv}
                        onChange={handlePaymentChange}
                        placeholder="123"
                        className={errors.cvv ? 'error' : ''}
                        required
                      />
                      {errors.cvv && <p>{errors.cvv}</p>}
                    </div>
                  </div>
                  <button type="submit" className="place-order-btn">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Place Order
                  </button>
                </form>
              </div>
              <div className="lg:col-span-1">
                <div className="order-summary">
                  <h3>Order Summary</h3>
                  {cart.items.map((item) => (
                    <div key={item.bookId}>
                      <span>{item.title} x {item.quantity}</span>
                      <span>Rs.{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                  <div>
                    <span>Shipping</span>
                    <span>{total > 5000 ? 'Free' : 'Rs.500.00'}</span>
                  </div>
                  <div>
                    <span>Total</span>
                    <span>Rs.{(total > 5000 ? total : total + 500).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      <footer className="footer animate-fade-in-up">
        <div className="footer-content">
          <div className="footer-section animate-fade-in">
            <h3>About BookNest</h3>
            <p>BookNest is more than just a bookstore — it's a cozy nest where readers and stories come together.</p>
          </div>
          <div className="footer-section animate-fade-in">
            <h3>Quick Links</h3>
            <ul className="footer-links">
              <li><Link to="/" className="animate-scale-up">Home</Link></li>
              <li><Link to="/books" className="animate-scale-up">Books</Link></li>
              <li><Link to="/about" className="animate-scale-up">About Us</Link></li>
              <li><Link to="/contact" className="animate-scale-up">Contact</Link></li>
            </ul>
          </div>
          <div className="footer-section animate-fade-in">
            <h3>Connect With Us</h3>
            <ul className="social-links">
              <li><a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="animate-scale-up">Facebook</a></li>
              <li><a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="animate-scale-up">Twitter</a></li>
              <li><a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="animate-scale-up">Instagram</a></li>
            </ul>
          </div>
          <div className="footer-section animate-fade-in">
            <h3>Newsletter</h3>
            <form className="newsletter-form" onSubmit={handleNewsletterSubmit}>
              <label htmlFor="newsletter-email" className="newsletter-label">Subscribe to our newsletter</label>
              <input
                id="newsletter-email"
                type="email"
                placeholder="Your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={emailError ? 'input-error' : ''}
              />
              {emailError && <p className="newsletter-error">{emailError}</p>}
              <button type="submit" className="animate-scale-up">Subscribe</button>
            </form>
          </div>
        </div>
        <div className="footer-payment animate-fade-in">
          <p>We Accept:</p>
          <img
            src="/images/visa.png"
            alt="Visa"
            className="payment-icon animate-scale-up"
            onError={(e) => (e.target.src = 'https://via.placeholder.com/30')}
          />
          <img
            src="/images/mastercard.png"
            alt="Mastercard"
            className="payment-icon animate-scale-up"
            onError={(e) => (e.target.src = 'https://via.placeholder.com/30')}
          />
          <img
            src="/images/amex.png"
            alt="Amex"
            className="payment-icon animate-scale-up"
            onError={(e) => (e.target.src = 'https://via.placeholder.com/30')}
          />
        </div>
        <div className="footer-bottom animate-fade-in">
          <p>© {new Date().getFullYear()} BookNest. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default Checkout;