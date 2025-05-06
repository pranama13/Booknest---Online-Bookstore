import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

function BookDetails() {
  const { id } = useParams();
  const [book, setBook] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBook = async () => {
      try {
        const response = await axios.get(`/api/books/${id}`);
        setBook(response.data);
        setError('');
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch book');
      }
    };
    fetchBook();
  }, [id]);

  const handleAddToCart = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      await axios.post('/api/cart', {
        bookId: book.id,
        title: book.title,
        authors: book.authors,
        price: book.price,
        quantity
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      navigate('/cart');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add to cart');
    }
  };

  if (!book) return <div className="container"><div className="card">Loading...</div></div>;

  return (
    <div className="container">
      <div classn="card card-wide">
        <h2>{book.title}</h2>
        {error && <p className="error">{error}</p>}
        <div style={{ display: 'flex', gap: '2rem' }}>
          <img src={book.thumbnail} alt={book.title} style={{ width: '200px', height: '300px', objectFit: 'cover' }} />
          <div>
            <p><strong>Authors:</strong> {book.authors.join(', ')}</p>
            <p><strong>Price:</strong> ${book.price.toFixed(2)} {book.currency}</p>
            <p><strong>Stock:</strong> {book.stock}</p>
            <p><strong>Description:</strong> {book.description}</p>
            <div className="quantity-control">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
              <input type="number" value={quantity} onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))} />
              <button onClick={() => setQuantity(quantity + 1)}>+</button>
            </div>
            <button className="green" onClick={handleAddToCart} disabled={book.stock < quantity}>
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BookDetails;