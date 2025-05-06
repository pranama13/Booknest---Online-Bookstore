import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Auth.css';
import LoadingAnimation from './LoadingAnimation';

function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) {
      navigate('/login', { state: { from: '/orders' } });
      return;
    }

    const fetchOrders = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/orders', {
          headers: { Authorization: `Bearer ${token}` },
        });
        // Filter for paid orders only
        setOrders(response.data.filter(order => order.status === 'paid'));
        setLoading(false);
      } catch (err) {
        setError('Failed to load orders. Please try again.');
        setLoading(false);
        console.error('Fetch orders error:', err.response?.data || err.message);
      }
    };

    fetchOrders();
  }, [token, navigate]);

  if (loading) return <LoadingAnimation />;
  if (error) {
    return (
      <div className="auth-container">
        <p className="error">{error}</p>
        <button className="auth-button" onClick={() => navigate('/login')}>
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <h2>Your Orders</h2>
      <div className="orders-list">
        {orders.length === 0 ? (
          <p>No paid orders found.</p>
        ) : (
          orders.map((order) => (
            <div key={order._id} className="card order-card">
              <h4>Order ID: {order._id}</h4>
              <p><strong>Status:</strong> {order.status}</p>
              <p><strong>Total:</strong> ${order.total.toFixed(2)}</p>
              <p><strong>Date:</strong> {new Date(order.createdAt).toLocaleDateString()}</p>
              <h4>Items:</h4>
              <ul>
                {order.items.map((item, index) => (
                  <li key={index}>
                    {item.title} by {item.authors.join(', ')} - {item.quantity} x ${item.price.toFixed(2)}
                  </li>
                ))}
              </ul>
              <h4>Shipping:</h4>
              <p>{order.shippingAddress || 'Not provided'}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Orders;