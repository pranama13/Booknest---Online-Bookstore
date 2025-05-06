import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { FaFacebook, FaTwitter, FaInstagram } from 'react-icons/fa';
import { toast } from 'react-toastify';
import axios from 'axios';
import './Account.css';
import LoadingAnimation from './LoadingAnimation';

function Account() {
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    fullName: '',
    address: '',
    phoneNumber: '',
    birthday: '',
  });
  const [tempProfilePicture, setTempProfilePicture] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchInput, setSearchInput] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem('token');
  const isAuthenticated = !!token;

  const categories = [
    'Fiction', 'Non-Fiction', 'Sci-Fi', 'Fantasy', 'Biography',
    'Mystery', 'Romance', 'History', 'Self-Help', 'Children',
  ];

  useEffect(() => {
    if (!token) {
      navigate('/login', { state: { from: '/account' } });
      return;
    }

    const fetchUser = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/users/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(response.data);
        setFormData({
          fullName: response.data.fullName || '',
          address: response.data.address || '',
          phoneNumber: response.data.phoneNumber || '',
          birthday: response.data.birthday ? response.data.birthday.split('T')[0] : '',
        });
        setLoading(false);
      } catch (err) {
        setError('Failed to load account details. Please try again.');
        setLoading(false);
        console.error('Fetch user error:', err.response?.data || err.message);
      }
    };

    fetchUser();
  }, [token, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (tempProfilePicture) {
        URL.revokeObjectURL(tempProfilePicture);
      }
      const newUrl = URL.createObjectURL(file);
      setTempProfilePicture(newUrl);
      setSuccess('Profile picture updated temporarily!');
      setTimeout(() => setSuccess(null), 3000);
    } else {
      setError('Please select an image.');
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      await axios.patch(
        'http://localhost:5000/api/users/me',
        formData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setUser((prev) => ({ ...prev, ...formData }));
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to update profile. Please try again.');
      console.error('Update profile error:', err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    if (tempProfilePicture) {
      URL.revokeObjectURL(tempProfilePicture);
      setTempProfilePicture(null);
    }
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleDismissAlert = () => {
    setError(null);
    setSuccess(null);
  };

  const handleSearchInputChange = (e) => {
    setSearchInput(e.target.value);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      navigate(`/books?query=${encodeURIComponent(searchInput)}`);
    }
  };

  const clearSearch = () => {
    setSearchInput('');
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleCategorySelect = (category) => {
    setIsDropdownOpen(false);
    navigate(`/books?category=${encodeURIComponent(category)}`);
  };

  const handleLogoClick = () => {
    navigate('/');
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

  return (
    <div className="home-container">
      {!isAuthenticated && (
        <div className="auth-buttons animate-fade-in">
          <Link to="/login" className="login-button animate-scale-up">Login</Link>
          <Link to="/signup" className="signup-button animate-scale-up">Sign Up</Link>
        </div>
      )}
      <nav className="navbar animate-slide-down">
        <div className="navbar-brand">
          <Link to="/" className="navbar-logo animate-fade-in" onClick={handleLogoClick}>
            <img
              src="/images/logo.png"
              alt="BookNest Logo"
              className="navbar-logo-img"
              onError={(e) => (e.target.src = 'https://placehold.co/30x30')}
            />
            <span className="logo-text">Book<span className="nest">Nest</span></span>
          </Link>
        </div>
        <div className="navbar-center">
          <form onSubmit={handleSearchSubmit} className={`navbar-search ${isSearchFocused ? 'focused' : ''} animate-fade-in`}>
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
          </form>
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
              <NavLink to="/account" className="navbar-link animate-fade-in active">
                Account
              </NavLink>
              <button onClick={handleSignOut} className="navbar-link animate-fade-in">
                Sign Out
              </button>
            </>
          ) : (
            <NavLink to="/login" className="navbar-link animate-fade-in" activeClassName="active">
              Login / SignUp
            </NavLink>
          )}
        </div>
      </nav>
      <div className="main-content">
        {loading && <LoadingAnimation />}
        <div className="account-container">
          <div className="profile-section">
            <div className="profile-picture-container">
              <img
                src={tempProfilePicture || user?.profilePicture || 'https://via.placeholder.com/150'}
                alt="Profile"
                className="profile-picture"
              />
              <input
                type="file"
                id="profilePicture"
                accept="image/*"
                onChange={handleProfilePictureChange}
                className="hidden"
              />
              <label htmlFor="profilePicture" className="profile-picture-overlay">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="upload-icon"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" />
                </svg>
              </label>
            </div>
            <h2 className="profile-name">{formData.fullName || 'User'}</h2>
          </div>
          <div className="details-section">
            <h1 className="section-title">Account Settings</h1>
            {error && (
              <div className="alert error">
                <span>{error}</span>
                <button onClick={handleDismissAlert} className="alert-close">
                  ✕
                </button>
              </div>
            )}
            {success && (
              <div className="alert success">
                <span>{success}</span>
                <button onClick={handleDismissAlert} className="alert-close">
                  ✕
                </button>
              </div>
            )}
            <div className="details-list">
              <div className="detail-bar">
                <label className="detail-label">Full Name</label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder="Enter full name"
                  className="detail-input"
                />
              </div>
              <div className="detail-bar">
                <label className="detail-label">Email</label>
                <input
                  type="email"
                  value={user?.email || ''}
                  readOnly
                  className="detail-input disabled"
                />
              </div>
              <div className="detail-bar">
                <label className="detail-label">Username</label>
                <input
                  type="text"
                  value={user?.username || ''}
                  readOnly
                  className="detail-input disabled"
                />
              </div>
              <div className="detail-bar">
                <label className="detail-label">Address</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Enter address"
                  className="detail-input"
                />
              </div>
              <div className="detail-bar">
                <label className="detail-label">Phone Number</label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  placeholder="Enter phone number"
                  className="detail-input"
                />
              </div>
              <div className="detail-bar">
                <label className="detail-label">Birthday</label>
                <input
                  type="date"
                  name="birthday"
                  value={formData.birthday}
                  onChange={handleInputChange}
                  className="detail-input"
                />
              </div>
            </div>
            <div className="action-buttons">
              <button onClick={handleSave} className="save-button">
                Save Changes
              </button>
              <button onClick={handleSignOut} className="sign-out-button">
                Sign Out
              </button>
            </div>
          </div>
        </div>
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
              <li>
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="animate-scale-up">
                  <FaFacebook size={24} />
                </a>
              </li>
              <li>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="animate-scale-up">
                  <FaTwitter size={24} />
                </a>
              </li>
              <li>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="animate-scale-up">
                  <FaInstagram size={24} />
                </a>
              </li>
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
            onError={(e) => (e.target.src = 'https://placehold.co/30x30')}
          />
          <img
            src="/images/mastercard.png"
            alt="Mastercard"
            className="payment-icon animate-scale-up"
            onError={(e) => (e.target.src = 'https://placehold.co/30x30')}
          />
          <img
            src="/images/amex.png"
            alt="Amex"
            className="payment-icon animate-scale-up"
            onError={(e) => (e.target.src = 'https://placehold.co/30x30')}
          />
        </div>
        <div className="footer-bottom animate-fade-in">
          <p>© {new Date().getFullYear()} BookNest. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default Account;