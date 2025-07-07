import React from 'react';
import { Link } from 'react-router-dom'; // If product name should link to product page

const OrderItemCard = ({ item, currency = 'USD' }) => {

  const getImageUrl = (imagePath) => {
    if (!imagePath) return 'https://via.placeholder.com/80'; // Default placeholder
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    const apiBase = (process.env.REACT_APP_API_URL || 'http://localhost:4000/api/v1').replace('/api/v1', '');
    return `${apiBase}${imagePath}`;
  };

  return (
    <div style={styles.card}>
      <img
        src={getImageUrl(item.product_image_url)}
        alt={item.product_name}
        style={styles.image}
      />
      <div style={styles.itemDetails}>
        {/* Assuming product_id is available and you have a route for product details */}
        <h4>
          {item.product_id ? (
            <Link to={`/products/${item.product_id}`} style={styles.productNameLink}>
              {item.product_name}
            </Link>
          ) : (
            item.product_name
          )}
        </h4>
        {item.product_sku && <p style={styles.sku}>SKU: {item.product_sku}</p>}
        <p>Quantity: {item.quantity}</p>
        <p>Price per unit: {currency} {parseFloat(item.price_at_purchase).toFixed(2)}</p>
        <p>Subtotal: {currency} {(item.quantity * parseFloat(item.price_at_purchase)).toFixed(2)}</p>
        {item.item_status && <p>Item Status: <span style={styles.itemStatus(item.item_status)}>{item.item_status.replace('_',' ').toUpperCase()}</span></p>}
      </div>
    </div>
  );
};

const styles = {
  card: {
    border: '1px solid #eee',
    padding: '15px',
    marginBottom: '10px',
    borderRadius: '8px',
    display: 'flex',
    gap: '15px',
    backgroundColor: '#f9f9f9',
  },
  image: {
    width: '80px',
    height: '80px',
    objectFit: 'cover',
    borderRadius: '4px',
    border: '1px solid #e0e0e0',
  },
  itemDetails: {
    flexGrow: 1,
    fontSize: '0.9em',
  },
  productNameLink: {
    textDecoration: 'none',
    color: '#2980b9', // Blue link
    fontWeight: 'bold',
  },
  sku: {
    fontSize: '0.85em',
    color: '#777',
  },
  itemStatus: (statusValue) => { // Similar to order status styling
    let color;
    switch (statusValue) {
        case 'pending': color = 'orange'; break;
        case 'processing': color = '#3498DB'; break; // Blue
        case 'shipped': color = '#2ECC71'; break; // Green
        case 'delivered': color = '#1ABC9C'; break; // Turquoise
        case 'cancelled_by_customer':
        case 'cancelled_by_vendor': color = '#E74C3C'; break; // Red
        case 'returned': color = '#9B59B6'; break; // Purple
        default: color = 'grey';
    }
    return {
        fontWeight: 'bold',
        color: 'white',
        backgroundColor: color,
        padding: '2px 6px',
        borderRadius: '10px',
        fontSize: '0.8em',
        display: 'inline-block',
        textTransform: 'capitalize'
    };
  }
};

export default OrderItemCard;
