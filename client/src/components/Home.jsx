import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { toast } from 'react-toastify';
import { FaFacebook, FaTwitter, FaInstagram } from 'react-icons/fa';
import './Home.css';
import LoadingAnimation from './LoadingAnimation';
import NavBar from './NavBar';

function Home() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [showBookModal, setShowBookModal] = useState(false);
  const [selectedBookDetails, setSelectedBookDetails] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [isLoadingPage, setIsLoadingPage] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [navbarOpaque, setNavbarOpaque] = useState(false);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [cartItemCount, setCartItemCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortOption, setSortOption] = useState("new"); // New state for sorting
  const navigate = useNavigate();
  const location = useLocation();
  const abortControllerRef = useRef(null);

  const token = localStorage.getItem('token');
  const isAuthenticated = !!token;

  const categories = [
    "Fiction", "Non-Fiction", "Sci-Fi", "Fantasy", "Biography",
    "Mystery", "Romance", "History", "Self-Help", "Children",
  ];

  const categoryToSubject = {
    Fiction: "fiction", "Non-Fiction": "nonfiction", "Sci-Fi": "science_fiction",
    Fantasy: "fantasy", Biography: "biography", Mystery: "mystery",
    Romance: "romance", History: "history", "Self-Help": "self_help",
    Children: "juvenile",
  };

  const sortOptions = [
    { value: "new", label: "Newest First" },
    { value: "price_asc", label: "Price: Low to High" },
    { value: "price_desc", label: "Price: High to Low" },
    { value: "title_asc", label: "Title: A to Z" },
    { value: "title_desc", label: "Title: Z to A" },
  ];

  const slideshowImages = [
    '/images/slideshow1.jpg', '/images/slideshow2.jpg', '/images/slideshow3.jpg',
    '/images/slideshow4.jpg', '/images/slideshow5.jpg', '/images/slideshow6.jpg',
    '/images/slideshow7.jpg', '/images/slideshow8.jpg', '/images/slideshow9.jpg',
    '/images/slideshow10.jpg',
  ];

  const fakeReviews = [
    { id: 1, user: "Pranama", rating: 5, text: "Fast delivery and great selection! Love to buy books from here...<3", image: "/images/reviewer1.jpg" },
    { id: 2, user: "Taro Sampath", rating: 4, text: "Loved the bookmarks included! come within 2 days. fast delivery", image: "/images/reviewer2.jpg" },
    { id: 3, user: "Ponseka Sri", rating: 5, text: "Best online bookstore! have big collection of political books", image: "/images/reviewer3.jpg" },
    { id: 4, user: "Harsha Mastermind", rating: 4, text: "Quality books, quick shipping. Recommended for everyone", image: "/images/reviewer4.jpg" },
    { id: 5, user: "Rotract Minidu", rating: 5, text: "Amazing customer service! have books all that I love.", image: "/images/reviewer5.jpg" },
    { id: 6, user: "P Laksika", rating: 4, text: "Easy to navigate and find books. best website for buy a book.", image: "/images/reviewer6.jpg" },
    { id: 7, user: "Nipuna DM", rating: 5, text: "Free delivery was a bonus for some books. great service.", image: "/images/reviewer7.jpg" },
    { id: 8, user: "Nowty Eshan", rating: 3, text: "Good but could improve stock. some of books are not available in site.", image: "/images/reviewer8.jpg" },
    { id: 9, user: "Mr. Handsome", rating: 5, text: "Authentic books, highly recommend! good for authentic buyers.", image: "/images/reviewer9.jpg" },
    { id: 10, user: "Shyaam", rating: 4, text: "Quick pickup option is great. fast shipping", image: "/images/reviewer10.jpg" },
    { id: 11, user: "Janidu Arnold", rating: 5, text: "Loved the variety of genres! easy to find and buy books.", image: "/images/reviewer11.jpg" },
    { id: 12, user: "Chamuditha Chamuditha", rating: 4, text: "COD payment was convenient. it is a very helpful feature.", image: "/images/reviewer12.jpg" },
    { id: 13, user: "Saman Saman", rating: 5, text: "Books arrived in perfect condition! also fast shipping , got within 2 days.", image: "/images/reviewer13.jpg" },
    { id: 14, user: "Nipuna Rex", rating: 4, text: "Supiri poth tika mekanm. hondama koliti poth gnnwnm meka tamai palace eka", image: "/images/reviewer14.jpg" },
    { id: 15, user: "Kamsun Sry", rating: 5, text: "Will shop here again! worth to buy a book in booknest", image: "/images/reviewer15.jpg" },
  ];

  const isValidJwt = (token) => {
    if (!token || typeof token !== 'string') return false;
    const parts = token.split('.');
    return parts.length === 3 && parts.every(part => part.length > 0);
  };

  const refreshToken = async () => {
    try {
      let token = localStorage.getItem('token');
      if (!isValidJwt(token)) throw new Error('Invalid token format');
      const response = await fetch('http://localhost:5000/api/auth/refresh', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to refresh token');
      }
      const data = await response.json();
      if (!isValidJwt(data.token)) throw new Error('Received invalid token from server');
      localStorage.setItem('token', data.token);
      return data.token;
    } catch (error) {
      console.error('Token refresh error:', error.message);
      toast.error(error.message.includes('invalid signature') ? 'Invalid authentication token. Please log in again.' : 'Session invalid. Please log in again.');
      localStorage.removeItem('token');
      navigate('/login');
      return null;
    }
  };

  const fetchCart = async () => {
    if (!isAuthenticated) {
      setCartItemCount(0);
      return;
    }

    let token = localStorage.getItem('token');
    if (!isValidJwt(token)) {
      setCartItemCount(0);
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/cart', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` },
        signal: AbortSignal.timeout(5000),
      });

      if (response.status === 403) {
        const errorData = await response.json();
        if (errorData.message.includes('jwt expired') || errorData.message.includes('invalid signature')) {
          token = await refreshToken();
          if (!token) {
            setCartItemCount(0);
            return;
          }
          const retryResponse = await fetch('http://localhost:5000/api/cart', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` },
            signal: AbortSignal.timeout(5000),
          });
          if (!retryResponse.ok) throw new Error('Failed to fetch cart after token refresh');
          const cart = await retryResponse.json();
          const totalItems = Array.isArray(cart) ? cart.reduce((sum, item) => sum + (item.quantity || 1), 0) : 0;
          setCartItemCount(totalItems);
          return;
        }
      }

      if (!response.ok) throw new Error('Failed to fetch cart');
      const cart = await response.json();
      const totalItems = Array.isArray(cart) ? cart.reduce((sum, item) => sum + (item.quantity || 1), 0) : 0;
      setCartItemCount(totalItems);
    } catch (err) {
      console.error('Fetch cart error:', err);
      setCartItemCount(0);
      toast.error('Unable to load cart. Please try again.');
    }
  };

  const fetchBooks = async ({ query = "", subject = "", page = 1, limit = 100, sort = "", signal }) => {
    setLoading(true);
    setError(null);

    let uniqueBooks = [];
    const seenIds = new Set();
    const booksPerPage = 24;

    try {
      // Construct query with fields to ensure relevance and efficiency
      let url = query
        ? `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=${limit}&page=${page}&fields=key,title,author_name,cover_i,first_publish_year${sort && sort === "new" ? `&sort=${sort}` : ''}`
        : subject
          ? `https://openlibrary.org/search.json?q=subject:${subject}&limit=${limit}&page=${page}&fields=key,title,author_name,cover_i,first_publish_year${sort && sort === "new" ? `&sort=${sort}` : ''}`
          : `https://openlibrary.org/search.json?q=*&limit=${limit}&page=${page}&fields=key,title,author_name,cover_i,first_publish_year&sort=new`;

      const response = await fetch(url, { signal });
      if (!response.ok) throw new Error(`Failed to fetch books: ${response.status}`);
      const data = await response.json();

      // Calculate total pages based on numFound
      const totalBooks = data.numFound || 0;
      setTotalPages(Math.ceil(totalBooks / booksPerPage));

      uniqueBooks = data.docs
        .filter((book) => book.key && book.title && book.cover_i && !seenIds.has(book.key)) // Only books with cover_i
        .map((book) => {
          seenIds.add(book.key);
          return {
            id: book.key,
            title: book.title || "Untitled",
            authors: book.author_name || ["Unknown"],
            thumbnail: `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`,
            price: (Math.random() * 1000 + 1000).toFixed(2),
            category: selectedCategory || "Fiction",
            firstPublishYear: book.first_publish_year || 0,
          };
        });

      // Fetch additional pages if fewer than 24 books with cover images
      let currentPageFetch = page;
      while (uniqueBooks.length < booksPerPage && currentPageFetch < page + 3) {
        currentPageFetch++;
        const nextUrl = query
          ? `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=${limit}&page=${currentPageFetch}&fields=key,title,author_name,cover_i,first_publish_year${sort && sort === "new" ? `&sort=${sort}` : ''}`
          : subject
            ? `https://openlibrary.org/search.json?q=subject:${subject}&limit=${limit}&page=${currentPageFetch}&fields=key,title,author_name,cover_i,first_publish_year${sort && sort === "new" ? `&sort=${sort}` : ''}`
            : `https://openlibrary.org/search.json?q=*&limit=${limit}&page=${currentPageFetch}&fields=key,title,author_name,cover_i,first_publish_year&sort=new`;
        const nextResponse = await fetch(nextUrl, { signal });
        if (!nextResponse.ok) continue;
        const nextData = await nextResponse.json();
        const newBooks = nextData.docs
          .filter((book) => book.key && book.title && book.cover_i && !seenIds.has(book.key))
          .map((book) => {
            seenIds.add(book.key);
            return {
              id: book.key,
              title: book.title || "Untitled",
              authors: book.author_name || ["Unknown"],
              thumbnail: `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`,
              price: (Math.random() * 1000 + 1000).toFixed(2),
              category: selectedCategory || "Fiction",
              firstPublishYear: book.first_publish_year || 0,
            };
          });
        uniqueBooks = [...uniqueBooks, ...newBooks];
      }

      // Client-side sorting for non-API supported sort options
      let sortedBooks = uniqueBooks;
      if (sort === "price_asc") {
        sortedBooks = uniqueBooks.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
      } else if (sort === "price_desc") {
        sortedBooks = uniqueBooks.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
      } else if (sort === "title_asc") {
        sortedBooks = uniqueBooks.sort((a, b) => a.title.localeCompare(b.title));
      } else if (sort === "title_desc") {
        sortedBooks = uniqueBooks.sort((a, b) => b.title.localeCompare(a.title));
      }

      const booksToSet = sortedBooks.slice(0, booksPerPage);
      setBooks(booksToSet);
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Fetch books error:', err);
        setError("Unable to load books. Please try again later.");
        setBooks([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchBooksWithRetry = async (params, retries = 3) => {
    for (let i = 0; i < retries; i++) {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;
      try {
        await fetchBooks({ ...params, signal: AbortSignal.timeout(30000) });
        return;
      } catch (err) {
        if (err.name === 'TimeoutError' && i < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000 * (i + 1)));
        } else if (err.name !== 'AbortError') {
          throw err;
        }
      } finally {
        abortControllerRef.current = null;
      }
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoadingPage(true);
      await Promise.all([
        fetchBooksWithRetry({ subject: selectedCategory ? categoryToSubject[selectedCategory] : "", page: currentPage, limit: 100, sort: sortOption }),
        fetchCart()
      ]);
      setIsLoadingPage(false);
    };
    loadInitialData();
  }, [selectedCategory, isAuthenticated, currentPage, sortOption]);

  useEffect(() => {
    const handlePopstate = () => {
      setSearchQuery("");
      setSearchInput("");
      setSelectedCategory(null);
      setSuggestions([]);
      setSortOption("new");
      setCurrentPage(1);
      setIsLoadingPage(true);
      navigate('/?reload=true');
      fetchBooksWithRetry({ subject: "", page: 1, limit: 100, sort: 'new' });
    };
    window.addEventListener('popstate', handlePopstate);
    return () => window.removeEventListener('popstate', handlePopstate);
  }, [navigate]);

  useEffect(() => {
    if (!searchInput.trim()) {
      setSuggestions([]);
      return;
    }
    const filteredSuggestions = books.filter(
      (book) =>
        book.title.toLowerCase().includes(searchInput.toLowerCase()) ||
        book.authors.some((author) => author.toLowerCase().includes(searchInput.toLowerCase()))
    ).slice(0, 5);
    setSuggestions(filteredSuggestions);
  }, [searchInput, books]);

  useEffect(() => {
    const handleScroll = () => {
      setNavbarOpaque(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const query = searchInput.trim();
    if (!query) {
      setError('Please enter a search term');
      return;
    }
    setSearchQuery(query);
    setShowComingSoon(false);
    setError(null);
    setSuggestions([]);
    setSelectedCategory(null);
    setCurrentPage(1);
    fetchBooksWithRetry({ query, page: 1, limit: 100, sort: sortOption });
  };

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    setSearchQuery("");
    setSearchInput("");
    setSuggestions([]);
    setIsDropdownOpen(false);
    setCurrentPage(1);
    fetchBooksWithRetry({ subject: categoryToSubject[category], page: 1, limit: 100, sort: sortOption });
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleNavigationClick = (type) => {
    setSearchQuery("");
    setSearchInput("");
    setSuggestions([]);
    setShowComingSoon(false);
    setError(null);
    setSelectedCategory(null);
    setCurrentPage(1);
    setLoading(true);

    switch (type) {
      case 'all':
        fetchBooksWithRetry({ subject: "", page: 1, limit: 100, sort: sortOption });
        break;
      case 'bestsellers':
        fetchBooksWithRetry({ query: "bestseller", page: 1, limit: 100, sort: 'relevance' });
        break;
      case 'new':
        fetchBooksWithRetry({ query: "", page: 1, limit: 100, sort: 'new' });
        break;
      case 'bundles':
      case 'giftcards':
        toast.info('This feature is coming soon!');
        setShowComingSoon(true);
        setLoading(false);
        break;
      default:
        break;
    }
  };

  const handleSortChange = (e) => {
    const newSortOption = e.target.value;
    setSortOption(newSortOption);
    setCurrentPage(1);
    fetchBooksWithRetry({
      query: searchQuery,
      subject: selectedCategory ? categoryToSubject[selectedCategory] : "",
      page: 1,
      limit: 100,
      sort: newSortOption
    });
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
    fetchBooksWithRetry({
      query: searchQuery,
      subject: selectedCategory ? categoryToSubject[selectedCategory] : "",
      page: newPage,
      limit: 100,
      sort: sortOption
    });
  };

  const fetchBookDetails = (book) => {
    setSelectedBookDetails(book);
    setShowBookModal(true);
  };

  const handleAddToCart = async (book, e) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      setSelectedBook(book);
      setShowAuthModal(true);
      toast.warn('Please log in to add items to your cart.');
      return;
    }

    let token = localStorage.getItem('token');
    if (!isValidJwt(token)) {
      toast.error('Invalid authentication token. Please log in again.');
      localStorage.removeItem('token');
      navigate('/login');
      return;
    }

    try {
      setCartItemCount(prev => prev + 1);
      let response = await fetch('http://localhost:5000/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          bookId: book.id,
          title: book.title,
          authors: book.authors,
          price: parseFloat(book.price),
          quantity: 1,
          thumbnail: book.thumbnail
        }),
        signal: AbortSignal.timeout(5000),
      });

      if (response.status === 403) {
        const errorData = await response.json();
        if (errorData.message.includes('jwt expired') || errorData.message.includes('invalid signature')) {
          token = await refreshToken();
          if (!token) {
            setCartItemCount(prev => prev - 1);
            return;
          }
          response = await fetch('http://localhost:5000/api/cart', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              bookId: book.id,
              title: book.title,
              authors: book.authors,
              price: parseFloat(book.price),
              quantity: 1,
              thumbnail: book.thumbnail
            }),
            signal: AbortSignal.timeout(5000),
          });
        }
      }

      if (response.status === 503) {
        setCartItemCount(prev => prev - 1);
        throw new Error('Database unavailable. Please try again later.');
      }

      if (!response.ok) {
        setCartItemCount(prev => prev - 1);
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Server responded with status ${response.status}`);
      }

      await fetchCart();
      toast.success(`${book.title} added to cart!`);
    } catch (err) {
      setCartItemCount(prev => prev - 1);
      console.error('Add to cart error:', err);
      let errorMessage = 'Failed to add to cart';
      if (err.message.includes('Failed to fetch')) errorMessage = 'Unable to connect to the server.';
      else if (err.message.includes('Database unavailable')) errorMessage = 'Database is currently unavailable.';
      else errorMessage = err.message;
      toast.error(errorMessage);
    }
  };

  const handleBuyNow = async (book, e) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      setSelectedBook(book);
      setShowAuthModal(true);
      toast.warn('Please log in to buy items.');
      return;
    }
    await handleAddToCart(book, e);
    navigate('/cart');
  };

  const handleSignOut = () => {
    localStorage.removeItem('token');
    setCartItemCount(0);
    navigate('/login');
  };

  const closeModal = () => {
    setShowAuthModal(false);
    setSelectedBook(null);
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

  return (
    <div className="home-container">
      {!isAuthenticated && (
        <div className="auth-buttons animate-fade-in">
          <Link to="/login" className="login-button">Login</Link>
          <Link to="/signup" className="signup-button">Sign Up</Link>
        </div>
      )}
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
      <br /> <br />
      <section className="secondary-nav-section animate-fade-in">
        <nav className="secondary-navbar">
          <button className="secondary-nav-button" onClick={() => handleNavigationClick('all')}>
            All Products
          </button>
          <button className="secondary-nav-button" onClick={() => handleNavigationClick('bestsellers')}>
            Bestsellers
          </button>
          <button className="secondary-nav-button" onClick={() => handleNavigationClick('new')}>
            New Arrivals
          </button>
          <button className="secondary-nav-button" onClick={() => handleNavigationClick('bundles')}>
            Bundles
          </button>
          <button className="secondary-nav-button" onClick={() => handleNavigationClick('giftcards')}>
            Gift Cards
          </button>
        </nav>
      </section>
      <br /> <br />
      <div className="main-content">
        {error && <p className="error animate-fade-in">{error}</p>}
        <section className="intro-section animate-fade-in">
          <div className="intro-container">
            {slideshowImages.map((image, index) => (
              <img
                key={index}
                src={image}
                alt={`Slide ${index + 1}`}
                className={`slideshow-image ${index === 0 ? 'active' : ''}`}
                loading="lazy"
                onError={(e) => (e.target.src = 'https://placehold.co/1200x400')}
              />
            ))}
            <div className="intro-caption">
              <h2>Discover Your Next Read</h2>
              <Link to="/books" className="intro-cta">Shop Now</Link>
            </div>
          </div>
          <h1 className="home-title animate-fade-in">Welcome to BookNest 📚</h1>
          <p className="tagline">"Discover stories that move your heart, spark your imagination, and stay with you forever — only at BookNest."</p>
        </section>
        <br /> <br />
        <section className="books-section animate-fade-in">
          <div className="book-list">
            <div className="category-buttons animate-fade-in">
              {categories.map((category) => (
                <button
                  key={category}
                  className={`category-button ${selectedCategory === category ? 'active' : ''}`}
                  onClick={() => handleCategorySelect(category)}
                >
                  {category}
                </button>
              ))}
              <button
                className={`category-button ${!selectedCategory ? 'active' : ''}`}
                onClick={() => setSelectedCategory(null)}
              >
                All
              </button>
            </div>
            <div className="sort-controls animate-fade-in" style={{ marginBottom: '1rem' }}>
              <label htmlFor="sort-select" className="sort-label" style={{ marginRight: '0.5rem', fontSize: '1rem', color: 'var(--text-color)' }}>
                Sort by:
              </label>
              <select
                id="sort-select"
                value={sortOption}
                onChange={handleSortChange}
                className="sort-select"
                style={{
                  padding: '0.5rem',
                  borderRadius: 'var(--border-radius)',
                  border: '2px solid var(--primary-color)',
                  fontSize: '1rem',
                  backgroundColor: 'var(--background-color)',
                  color: 'var(--text-color)',
                  cursor: 'pointer',
                  width: '200px',
                }}
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <h2 className="animate-fade-in">
              {searchQuery ? `Results for "${searchQuery}"` : selectedCategory ? `${selectedCategory} Books` : "Featured Books"}
            </h2>
            {searchQuery && !loading && !error && books.length > 0 && (
              <p className="search-results-count animate-fade-in">
                Found {books.length} results
              </p>
            )}
            {error && (
              <div className="error-container animate-fade-in">
                <p className="error">{error}</p>
                <button
                  onClick={() => fetchBooksWithRetry({ subject: selectedCategory ? categoryToSubject[selectedCategory] : "", query: searchQuery, page: currentPage, limit: 100, sort: sortOption })}
                  className="retry-button"
                >
                  Retry
                </button>
              </div>
            )}
            {showComingSoon && (
              <p className="coming-soon animate-fade-in">This feature is coming soon!</p>
            )}
            {!loading && !error && !showComingSoon && books.length === 0 && (
              <p className="no-books animate-fade-in">No books with cover images found. Try a different search or category.</p>
            )}
            {!loading && !error && !showComingSoon && books.length > 0 && (
              <>
                <div className="book-grid">
                  {books.map((book) => (
                    <div
                      key={book.id}
                      className="book-card animate-fade-in"
                      onClick={() => fetchBookDetails(book)}
                    >
                      <img
                        src={book.thumbnail}
                        alt={book.title}
                        className="book-thumbnail"
                        loading="lazy"
                        onError={(e) => (e.target.src = 'https://placehold.co/150x200')}
                      />
                      <h3 className="book-title">{book.title}</h3>
                      <p className="book-authors">{book.authors.join(', ')}</p>
                      <p className="book-price">Rs.{book.price}</p>
                      <div className="book-buttons">
                        <button
                          onClick={(e) => handleAddToCart(book, e)}
                          className="buy-button add-to-cart"
                        >
                          Add to Cart
                        </button>
                        <button
                          onClick={(e) => handleBuyNow(book, e)}
                          className="buy-button buy-now"
                        >
                          Buy Now
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="pagination-controls modern-pagination animate-fade-in">
                  <button
                    className="pagination-button prev-button"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </button>
                  <span className="pagination-info">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    className="pagination-button next-button"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </button>
                </div>
              </>
            )}
          </div>
        </section>
        <br /> <br /> <br /> <br />
        <section className="reviews-section animate-fade-in">
          <h2 className="animate-fade-in">What Our Customers Say</h2>
          <div className="reviews-grid">
            {fakeReviews.map((review) => (
              <div key={review.id} className="review-card animate-fade-in">
                <img
                  src={review.image}
                  alt={review.user}
                  className="reviewer-image"
                  loading="lazy"
                  onError={(e) => (e.target.src = 'https://placehold.co/80x80')}
                />
                <p className="review-user">{review.user}</p>
                <p className="review-rating">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</p>
                <p className="review-text">{review.text}</p>
              </div>
            ))}
          </div>
        </section>
        <br /> <br /> <br /> <br />
        <section className="features-section animate-fade-in">
          <h2 className="animate-fade-in">Why Shop with BookNest?</h2>
          <div className="features-grid">
            {[
              { icon: 'pickup.png', title: 'Pick-up In-store', text: 'Order online and collect from our warehouse on the same day!' },
              { icon: 'delivery.png', title: 'Free Delivery', text: 'If your order value is above Rs.5,000, delivery is free throughout Sri Lanka.' },
              { icon: 'payments.png', title: 'COD & Online Payments', text: 'From Cash-on-delivery to online payments, we accept all popular payment methods.' },
              { icon: 'authentic.png', title: '100% Authentic', text: 'We only sell authentic products that are directly sourced from publishers.' }
            ].map((feature, index) => (
              <div key={index} className="feature-card animate-fade-in">
                <img
                  src={`/images/${feature.icon}`}
                  alt={feature.title}
                  className="feature-icon"
                  loading="lazy"
                  onError={(e) => (e.target.src = 'https://placehold.co/50x50')}
                />
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
              </div>
            ))}
          </div>
        </section>
        <br /> <br /> <br /> <br /> <br /> <br />
        <footer className="footer animate-fade-in">
          <div className="footer-content">
            <div className="footer-section animate-fade-in">
              <h3>About BookNest</h3>
              <p>BookNest is a warm and welcoming space for readers to explore new stories, connect with fellow book lovers, and share their passion for reading. We offer a handpicked selection of books across genres, personalized recommendations, and a vibrant community where every reader feels at home.

.</p>
            </div>
            <div className="footer-section animate-fade-in">
              <h3>Quick Links</h3>
              <ul className="footer-links">
                <li><Link to="/" className="animate-fade-in">Home</Link></li>
                <li><Link to="/books" className="animate-fade-in">Books</Link></li>
                <li><Link to="/about" className="animate-fade-in">About Us</Link></li>
                <li><Link to="/contact" className="animate-fade-in">Contact</Link></li>
              </ul>
            </div>
            <div className="footer-section animate-fade-in">
              <h3>Connect With Us</h3>
              <ul className="social-links">
                <li><a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="animate-fade-in"><FaFacebook size={24} /></a></li>
                <li><a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="animate-fade-in"><FaTwitter size={24} /></a></li>
                <li><a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="animate-fade-in"><FaInstagram size={24} /></a></li>
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
                <button type="submit" className="animate-fade-in">Subscribe</button>
              </form>
            </div>
          </div>
          <div className="footer-payment animate-fade-in">
            <p>We Accept:</p>
            <img src="/images/visa.png" alt="Visa" className="payment-icon" loading="lazy" onError={(e) => (e.target.src = 'https://placehold.co/30x20')} />
            <img src="/images/mastercard.png" alt="Mastercard" className="payment-icon" loading="lazy" onError={(e) => (e.target.src = 'https://placehold.co/30x20')} />
            <img src="/images/amex.png" alt="American Express" className="payment-icon" loading="lazy" onError={(e) => (e.target.src = 'https://placehold.co/30x20')} />
          </div>
          <div className="footer-bottom animate-fade-in">
            <p>© {new Date().getFullYear()} BookNest. All rights reserved.</p>
          </div>
        </footer>
      </div>
      {(isLoadingPage || loading) && <LoadingAnimation />}
      {showAuthModal && (
        <div className="auth-modal animate-fade-in">
          <div className="auth-modal-content">
            <h2 className="animate-fade-in">Please Log In or Sign Up</h2>
            <p className="animate-fade-in">You need an account to add "{selectedBook?.title}" to your cart.</p>
            <div className="auth-modal-buttons">
              <Link to="/login" state={{ from: '/cart', book: selectedBook }} className="modal-button signup-button animate-fade-in" onClick={closeModal}>Login</Link>
              <Link to="/signup" state={{ from: '/cart', book: selectedBook }} className="modal-button signup-button animate-fade-in" onClick={closeModal}>Sign Up</Link>
              <button onClick={closeModal} className="modal-button close-button animate-fade-in">Cancel</button>
            </div>
          </div>
        </div>
      )}
      {showBookModal && selectedBookDetails && (
        <div className="auth-modal animate-fade-in">
          <div className="auth-modal-content" style={{ maxWidth: '500px', padding: '1.5rem' }}>
            <h2 className="animate-fade-in">{selectedBookDetails.title}</h2>
            <img
              src={selectedBookDetails.thumbnail}
              alt={selectedBookDetails.title}
              style={{ width: '200px', height: '300px', objectFit: 'cover', margin: '0 auto' }}
              loading="lazy"
              onError={(e) => (e.target.src = 'https://placehold.co/200x300')}
            />
            <p className="animate-fade-in"><strong>Authors:</strong> {selectedBookDetails.authors.join(', ')}</p>
            <p className="animate-fade-in"><strong>Price:</strong> Rs.{selectedBookDetails.price}</p>
            <p className="animate-fade-in"><strong>Description:</strong> {selectedBookDetails.description || 'No description available'}</p>
            <div className="auth-modal-buttons">
              <button onClick={(e) => handleAddToCart(selectedBookDetails, e)} className="modal-button add-to-cart animate-fade-in">Add to Cart</button>
              <button onClick={(e) => handleBuyNow(selectedBookDetails, e)} className="modal-button buy-now animate-fade-in">Buy Now</button>
              <button onClick={() => setShowBookModal(false)} className="modal-button close-button animate-fade-in">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;