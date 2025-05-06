import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import './Signup.css';

function Signup() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    fullName: ""
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Handle browser back button
  useEffect(() => {
    const handlePopstate = () => {
      navigate('/');
    };
    window.addEventListener('popstate', handlePopstate);
    return () => window.removeEventListener('popstate', handlePopstate);
  }, [navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      const response = await axios.post('http://localhost:5000/api/auth/signup', {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName
      }, { timeout: 10000 });

      setSuccess(response.data.message || 'User created successfully. Please verify your email.');
      setFormData({ username: "", email: "", password: "", fullName: "" });

      setTimeout(() => {
        const { from, book } = location.state || {};
        if (from === '/checkout' && book) {
          navigate('/login', { state: { from, book } });
        } else {
          navigate('/login');
        }
      }, 2000);
    } catch (err) {
      console.error('Signup error:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      const errorMsg = err.response?.data?.message || 'Signup failed. Please try again.';
      setError(errorMsg);
    }
  };

  return (
    <div className="signup-page">
      <div className="signup-image">
        <img src="/images/login.png" alt="Signup Illustration" />
      </div>
      <div className="signup-content">
        <div className="signup-card">
          <h2 className="portal-title">Sign Up for BookNest</h2>
          {error && <p className="error-message">{error}</p>}
          {success && <p className="success-message">{success}</p>}
          <form onSubmit={handleSubmit} className="signup-form">
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                required
                placeholder="Enter username"
              />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                placeholder="Enter email"
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                placeholder="Enter password (min 6 characters)"
                minLength={6}
              />
            </div>
            <div className="form-group">
              <label htmlFor="fullName">Full Name</label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                required
                placeholder="Enter full name"
              />
            </div>
            <button type="submit" className="signup-button">Sign Up</button>
          </form>
          <p className="login-link">
            Already have an account? <Link to="/login">Login</Link>
          </p>
          <Link to="/" className="home-button">Go to Home</Link>
        </div>
      </div>
    </div>
  );
}

export default Signup;