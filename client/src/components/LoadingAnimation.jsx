import React from 'react';
import './LoadingAnimation.css';

function LoadingAnimation() {
  return (
    <div className="loading-container">
      <div className="book">
        <div className="book-cover front"></div>
        <div className="book-spine"></div>
        <div className="book-page page-1"></div>
        <div className="book-page page-2"></div>
        <div className="book-page page-3"></div>
        <div className="book-page page-4"></div>
        <div className="book-page page-5"></div>
        <div className="book-page page-6"></div>
        <div className="book-cover back"></div>
      </div>
      <p>Loading your favourite book store...</p>
    </div>
  );
}

export default LoadingAnimation;