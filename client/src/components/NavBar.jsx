import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import './Nav.css';

function NavBar({ cartItemCount, onSearchSubmit, onCategorySelect, onSignOut, isAuthenticated, searchInput, setSearchInput, suggestions, setSuggestions, isSearchFocused, setIsSearchFocused, toggleDropdown, isDropdownOpen, categories }) {
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);

  const toggleCategoryDropdown = () => {
    setIsCategoryDropdownOpen(!isCategoryDropdownOpen);
  };

  const handleSearchInputChange = (e) => {
    setSearchInput(e.target.value);
  };

  const handleSuggestionClick = (suggestion) => {
    setSearchInput(suggestion.title);
    setSuggestions([]);
    setIsSearchFocused(false);
    onSearchSubmit({ preventDefault: () => {}, searchQuery: suggestion.title });
  };

  const handleSearchSubmit = () => {
    if (searchInput.trim()) {
      setSuggestions([]);
      setIsSearchFocused(false);
      onSearchSubmit({ preventDefault: () => {}, searchQuery: searchInput });
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearchSubmit();
    }
  };

  return (
    <nav className={`navbar ${window.scrollY > 50 ? 'opaque' : ''} animate-fade-in`}>
      <div className="navbar-brand">
        <Link to="/" className="navbar-logo animate-fade-in" onClick={() => { setSearchInput(''); setSuggestions([]); }}>
          <img
            src="/images/logo.png"
            alt="BookNest Logo"
            className="navbar-logo-img"
            onError={(e) => (e.target.src = 'https://placehold.co/30x30')}
          />
          <span className="logo-text">Book<span className="nest">Nest</span></span>
        </Link>
      </div>
      <button className="hamburger animate-fade-in" onClick={toggleDropdown}>
        ☰
      </button>
      <div className="search-container">
        <input
          type="text"
          name="search"
          placeholder="Search books..."
          className="modern-search-input"
          value={searchInput}
          onChange={handleSearchInputChange}
          onFocus={() => setIsSearchFocused(true)}
          onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
          onKeyDown={handleKeyDown}
        />
        <button type="button" className="modern-search-button" onClick={handleSearchSubmit}>
          🔍
        </button>
        {suggestions.length > 0 && isSearchFocused && (
          <div className="search-suggestions">
            {suggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className="suggestion-item"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                <img
                  src={suggestion.thumbnail}
                  alt={suggestion.title}
                  className="suggestion-thumbnail"
                  loading="lazy"
                  onError={(e) => (e.target.src = 'https://placehold.co/50x75')}
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
          <button className="navbar-link dropdown-toggle animate-fade-in" onClick={toggleCategoryDropdown}>
            Categories
          </button>
          {isCategoryDropdownOpen && (
            <ul className="dropdown-menu animate-fade-in">
              {categories.map((category) => (
                <li key={category}>
                  <button
                    className="dropdown-item animate-fade-in"
                    onClick={() => {
                      onCategorySelect(category);
                      setIsCategoryDropdownOpen(false);
                    }}
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
          Cart {cartItemCount > 0 && <span className="cart-badge">{cartItemCount}</span>}
        </NavLink>
        {isAuthenticated ? (
          <>
            <NavLink to="/account" className="navbar-link animate-fade-in" activeClassName="active">
              Account
            </NavLink>
            <button onClick={onSignOut} className="navbar-link sign-out-button animate-fade-in">
              Sign Out
            </button>
          </>
        ) : (
          <NavLink to="/login" className="navbar-link animate-fade-in" activeClassName="active">
            Login / SignUp
          </NavLink>
        )}
      </div>
      <div className={`sidebar ${isDropdownOpen ? 'open' : ''} animate-slide-in-left`}>
        <button className="sidebar-close" onClick={toggleDropdown}>✕</button>
        <div className="search-container">
          <input
            type="text"
            name="search"
            placeholder="Search books..."
            className="modern-search-input"
            value={searchInput}
            onChange={handleSearchInputChange}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
            onKeyDown={handleKeyDown}
          />
          <button type="button" className="modern-search-button" onClick={handleSearchSubmit}>
            🔍
          </button>
          {suggestions.length > 0 && isSearchFocused && (
            <div className="search-suggestions">
              {suggestions.map((suggestion) => (
                <div
                  key={suggestion.id}
                  className="suggestion-item"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  <img
                    src={suggestion.thumbnail}
                    alt={suggestion.title}
                    className="suggestion-thumbnail"
                    loading="lazy"
                    onError={(e) => (e.target.src = 'https://placehold.co/50x75')}
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
          <NavLink to="/orders" className="navbar-link animate-fade-in" activeClassName="active" onClick={toggleDropdown}>
            Orders
          </NavLink>
          <div className="dropdown">
            <button className="navbar-link dropdown-toggle animate-fade-in" onClick={toggleCategoryDropdown}>
              Categories
            </button>
            {isCategoryDropdownOpen && (
              <ul className="dropdown-menu animate-fade-in">
                {categories.map((category) => (
                  <li key={category}>
                    <button
                      className="dropdown-item animate-fade-in"
                      onClick={() => {
                        onCategorySelect(category);
                        setIsCategoryDropdownOpen(false);
                        toggleDropdown();
                      }}
                    >
                      {category}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <NavLink to="/reviews" className="navbar-link animate-fade-in" activeClassName="active" onClick={toggleDropdown}>
            Reviews
          </NavLink>
          <NavLink to="/about" className="navbar-link animate-fade-in" activeClassName="active" onClick={toggleDropdown}>
            About Us
          </NavLink>
          <NavLink to="/cart" className="navbar-link animate-fade-in" activeClassName="active" onClick={toggleDropdown}>
            Cart {cartItemCount > 0 && <span className="cart-badge">{cartItemCount}</span>}
          </NavLink>
          {isAuthenticated ? (
            <>
              <NavLink to="/account" className="navbar-link animate-fade-in" activeClassName="active" onClick={toggleDropdown}>
                Account
              </NavLink>
              <button onClick={() => { onSignOut(); toggleDropdown(); }} className="navbar-link sign-out-button animate-fade-in">
                Sign Out
              </button>
            </>
          ) : (
            <NavLink to="/login" className="navbar-link animate-fade-in" activeClassName="active" onClick={toggleDropdown}>
              Login / SignUp
            </NavLink>
          )}
        </div>
      </div>
    </nav>
  );
}

export default NavBar;