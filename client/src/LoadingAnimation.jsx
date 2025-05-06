import React from 'react';
import './LoadingAnimation.css';

function LoadingAnimation() {
  return (
    <div className="loading-container">
      <div className="book">
        <div className="book-page"></div>
        <div className="book-page"></div>
        <div className="book-page"></div>
      </div>
      <p>Loading...</p>
    </div>
  );
}

export default LoadingAnimation;