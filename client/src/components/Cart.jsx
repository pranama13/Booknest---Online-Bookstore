import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import './Cart.css';
import LoadingAnimation from './LoadingAnimation';
import NavBar from './NavBar';

function Cart() {
  const [cartItems, setCartItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [cartItemCount, setCartItemCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const isAuthenticated = !!token;

  const categories = [
    'Fiction', 'Non-Fiction', 'Sci-Fi', 'Fantasy', 'Biography',
    'Mystery', 'Romance', 'History', 'Self-Help', 'Children'
  ];

  useEffect(() => {
    if (!token) {
      navigate('/login', { state: { from: '/cart' } });
      return;
    }

    const fetchCart = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/cart', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const items = response.data.items || [];
        setCartItems(items);
        setSelectedItems(items.map(item => item.bookId));
        const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
        setCartItemCount(totalItems);
        setLoading(false);
      } catch (err) {
        setError('Failed to load cart. Please try again.');
        setLoading(false);
        console.error('Fetch cart error:', err.response?.data || err.message);
      }
    };

    fetchCart();
  }, [token, navigate]);

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
          thumbnail: book.cover_i ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg` : 'https://via.placeholder.com/150'
        }));
        setSuggestions(filteredSuggestions);
      } catch (err) {
        console.error('Fetch suggestions error:', err);
      }
    };
    fetchSuggestions();
  }, [searchInput]);

  const handleSelectItem = (bookId) => {
    setSelectedItems(prev =>
      prev.includes(bookId)
        ? prev.filter(id => id !== bookId)
        : [...prev, bookId]
    );
  };

  const handleQuantityChange = async (bookId, newQuantity) => {
    if (newQuantity < 1) return;
    try {
      const item = cartItems.find((item) => item.bookId === bookId);
      const response = await axios.post('http://localhost:5000/api/cart', {
        bookId,
        title: item.title,
        authors: item.authors,
        price: item.price,
        quantity: newQuantity,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCartItems(response.data.items);
      const totalItems = response.data.items.reduce((sum, item) => sum + item.quantity, 0);
      setCartItemCount(totalItems);
    } catch (err) {
      setError('Failed to update quantity.');
      console.error('Update quantity error:', err.response?.data || err.message);
    }
  };

  const handleRemove = async (bookId) => {
    try {
      await axios.delete('http://localhost:5000/api/cart', {
        headers: { Authorization: `Bearer ${token}` },
        data: { bookId },
      });
      const updatedItems = cartItems.filter((item) => item.bookId !== bookId);
      setCartItems(updatedItems);
      setSelectedItems(selectedItems.filter(id => id !== bookId));
      const totalItems = updatedItems.reduce((sum, item) => sum + item.quantity, 0);
      setCartItemCount(totalItems);
      setSuccess('Item removed from cart.');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to remove item from cart.');
      console.error('Remove item error:', err.response?.data || err.message);
    }
  };

  const handlePay = async () => {
    if (selectedItems.length === 0) {
      setError('Please select at least one item to proceed.');
      return;
    }
    const itemsToCheckout = cartItems.filter(item => selectedItems.includes(item.bookId));
    if (itemsToCheckout.length === 0) {
      setError('No items selected for checkout.');
      return;
    }
    navigate('/checkout', { state: { items: itemsToCheckout } });
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const query = searchInput.trim();
    if (!query) {
      setError('Please enter a search term');
      return;
    }
    setSearchQuery(query);
    setSuggestions([]);
    navigate(`/books?query=${encodeURIComponent(query)}`);
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
    toast.success('Subscribed successfully!');
    setEmail('');
  };

  if (loading) return <LoadingAnimation />;

  const selectedCartItems = cartItems.filter(item => selectedItems.includes(item.bookId));
  const subtotal = selectedCartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = subtotal > 5000 ? 0 : 500;
  const total = subtotal + shipping;

  return (
    <div className="cart-container">
      <NavBar
        cartItemCount={cartItemCount}
        onSearchSubmit={handleSearchSubmit}
        onCategorySelect={handleCategorySelect}
        onSignOut={handleSignOut}
        isAuthenticated={isAuthenticated}
        searchInput={searchInput}
        setSearchInput={setSearchInput}
        suggestions={suggestions}
        setSuggestions={setSuggestions}
        isSearchFocused={isSearchFocused}
        setIsSearchFocused={setIsSearchFocused}
        toggleDropdown={toggleDropdown}
        isDropdownOpen={isDropdownOpen}
        categories={categories}
      />
      <h2>Your Cart</h2>
      {success && <div className="alert alert-success">{success}</div>}
      {error && <div className="alert alert-error">{error}</div>}
      {cartItems.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        <div className="cart-content">
          <div className="cart-items-container">
            {cartItems.map((item) => (
              <div
                key={item.bookId}
                className={`cart-item ${selectedItems.includes(item.bookId) ? 'selected' : ''}`}
              >
                <div className="cart-item-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(item.bookId)}
                    onChange={() => handleSelectItem(item.bookId)}
                  />
                </div>
                <img
                  src={item.thumbnail || 'https://via.placeholder.com/100'}
                  alt={item.title}
                  className="cart-item-img"
                />
                <div className="cart-item-details">
                  <h3>{item.title}</h3>
                  <p>{item.authors.join(', ')}</p>
                  <p>Rs.{item.price.toFixed(2)}</p>
                  <div className="quantity-control">
                    <button
                      className="quantity-btn"
                      onClick={() => handleQuantityChange(item.bookId, item.quantity - 1)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                      </svg>
                    </button>
                    <span className="quantity-display">{item.quantity}</span>
                    <button
                      className="quantity-btn"
                      onClick={() => handleQuantityChange(item.bookId, item.quantity + 1)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                  <button
                    className="remove-btn"
                    onClick={() => handleRemove(item.bookId)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="order-summary">
            <h3>Order Summary</h3>
            <div>
              <span>Subtotal</span>
              <span>Rs.{subtotal.toFixed(2)}</span>
            </div>
            <div>
              <span>Shipping</span>
              <span>{shipping === 0 ? 'Free' : `Rs.${shipping.toFixed(2)}`}</span>
            </div>
            <div>
              <span>Total</span>
              <span>Rs.{total.toFixed(2)}</span>
            </div>
            <br /><br /><br /><br />
            <button className="checkout-btn" onClick={handlePay}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              Proceed to Checkout
            </button>
          </div>
        </div>
      )}
      <br /><br /><br />
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-section">
            <h3>About BookNest</h3>
            <p>BookNest is more than just a bookstore — it's a cozy nest where readers and stories come together.</p>
          </div>
          <div className="footer-section">
            <h3>Quick Links</h3>
            <ul className="footer-links">
              <li><Link to="/">Home</Link></li>
              <li><Link to="/books">Books</Link></li>
              <li><Link to="/about">About Us</Link></li>
              <li><Link to="/contact">Contact</Link></li>
            </ul>
          </div>
          <div className="footer-section">
            <h3>Connect With Us</h3>
            <ul className="social-links">
              <li><a href="https://facebook.com" target="_blank" rel="noopener noreferrer">Facebook</a></li>
              <li><a href="https://twitter.com" target="_blank" rel="noopener noreferrer">Twitter</a></li>
              <li><a href="https://instagram.com" target="_blank" rel="noopener noreferrer">Instagram</a></li>
            </ul>
          </div>
          <div className="footer-section">
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
              <button type="submit">Subscribe</button>
            </form>
          </div>
        </div>
        <div className="footer-payment">
          <p>We Accept:</p>
          <img src="/images/visa.png" alt="Visa" className="payment-icon" onError={(e) => (e.target.src = 'https://via.placeholder.com/30')} />
          <img src="/images/mastercard.png" alt="Mastercard" className="payment-icon" onError={(e) => (e.target.src = 'https://via.placeholder.com/30')} />
          <img src="/images/amex.png" alt="Amex" className="payment-icon" onError={(e) => (e.target.src = 'https://via.placeholder.com/30')} />
        </div>
        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} BookNest. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default Cart;