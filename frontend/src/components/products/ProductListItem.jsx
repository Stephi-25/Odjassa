import React from 'react';
import { Link } from 'react-router-dom';

const ProductListItem = ({ product, onDelete }) => {
  // Helper to construct image URL safely, assuming backend serves from root or a known base
  const getImageUrl = (imagePath) => {
    if (!imagePath) return 'https://via.placeholder.com/100'; // Default placeholder
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    // Assuming imagePath is like '/uploads/products/image.jpg' and API_BASE_URL is like 'http://localhost:4000'
    // We need to ensure that REACT_APP_API_BASE_URL does not include '/api/v1' for image paths.
    // Or, better, have a dedicated REACT_APP_ASSET_BASE_URL or construct it.
    // For simplicity, if it's a relative path, we prepend the current origin if no specific base URL for assets is set.
    // This might need adjustment based on how assets are served vs API.
    const apiBase = (process.env.REACT_APP_API_URL || 'http://localhost:4000/api/v1').replace('/api/v1', '');

    // Check if the imagePath already includes a base part of the URL if it's a full URL from backend.
    // This logic might need refinement based on actual `imagePath` format from backend.
    // If `imagePath` is already `/uploads/products/xyz.jpg`, then `${apiBase}${imagePath}` should work.
    return `${apiBase}${imagePath}`;
  };

  return (
    <div style={styles.container}>
      {product.images && product.images.length > 0 ? (
        <img
            src={getImageUrl(product.images[0])}
            alt={product.name}
            style={styles.image}
        />
      ) : (
        <div style={{...styles.image, ...styles.placeholderImage}}>No Image</div>
      )}
      <div style={styles.details}>
        <h3>{product.name}</h3>
        <p><strong>Status:</strong> <span style={styles.status(product.status)}>{product.status}</span></p>
        <p><strong>Price:</strong> ${parseFloat(product.price).toFixed(2)}</p>
        <p><strong>Stock:</strong> {product.stock_quantity}</p>
        {product.status === 'rejected' && product.moderation_notes && (
            <p style={styles.moderationNotes}><strong>Moderation Notes:</strong> {product.moderation_notes}</p>
        )}
      </div>
      <div style={styles.actions}>
        <Link to={`/vendor/products/edit/${product.id}`} style={styles.button}>Edit</Link>
        <button onClick={() => onDelete(product.id)} style={{...styles.button, ...styles.deleteButton}}>Delete</button>
      </div>
    </div>
  );
};

const styles = {
  container: {
    border: '1px solid #e0e0e0',
    padding: '15px',
    marginBottom: '15px',
    borderRadius: '8px',
    display: 'flex',
    gap: '15px',
    backgroundColor: '#fff',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  image: {
    width: '100px',
    height: '100px',
    objectFit: 'cover',
    borderRadius: '4px',
    border: '1px solid #eee',
  },
  placeholderImage: {
    backgroundColor: '#f0f0f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#aaa',
    fontSize: '0.9em',
  },
  details: {
    flexGrow: 1,
  },
  status: (statusValue) => {
    let color;
    switch (statusValue) {
      case 'active': color = 'green'; break;
      case 'pending_approval': color = 'orange'; break;
      case 'rejected': color = 'red'; break;
      case 'inactive': color = 'grey'; break;
      default: color = 'black';
    }
    return { fontWeight: 'bold', color };
  },
  moderationNotes: {
    color: 'red',
    fontStyle: 'italic',
    fontSize: '0.9em',
    marginTop: '5px',
    backgroundColor: '#ffeeee',
    padding: '5px',
    borderRadius: '3px',
  },
  actions: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    gap: '10px',
  },
  button: {
    padding: '8px 12px',
    textDecoration: 'none',
    border: '1px solid #ccc',
    borderRadius: '4px',
    backgroundColor: '#f8f8f8',
    color: '#333',
    textAlign: 'center',
    cursor: 'pointer',
    fontSize: '0.9em',
  },
  deleteButton: {
    backgroundColor: '#d9534f',
    color: 'white',
    borderColor: '#d43f3a',
  }
};

export default ProductListItem;
