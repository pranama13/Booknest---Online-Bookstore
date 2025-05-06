import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

function BookList() {
  const [books, setBooks] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [sort, setSort] = useState('');
  const [error, setError] = useState('');

  const fetchBooks = async () => {
    try {
      const response = await axios.get('/api/books', {
        params: { q: search, filter, sort }
      });
      setBooks(response.data.items);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch books');
    }
  };

  useEffect(() => {
    fetchBooks();
  }, [search, filter, sort]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchBooks();
  };

  return (
    <div className="container">
      <div className="card card-wide">
        <h2>Book Store</h2>
        {error && <p className="error">{error}</p>}
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search books..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="">All</option>
            <option value="free-ebooks">Free eBooks</option>
            <option value="paid-ebooks">Paid eBooks</option>
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="">Default</option>
            <option value="relevance">Relevance</option>
            <option value="newest">Newest</option>
          </select>
          <button className="blue" onClick={handleSearch}>Search</button>
        </div>
        <div className="book-grid">
          {books.map(book => (
            <Link to={`/books/${book.id}`} key={book.id} className="book-card">
              <img src={book.thumbnail} alt={book.title} />
              <h4>{book.title}</h4>
              <p>{book.authors.join(', ')}</p>
              <p>${book.price.toFixed(2)} {book.currency}</p>
              <p>Stock: {book.stock}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default BookList;