import React from 'react';
import { Link } from 'react-router-dom';

const OrderListItem = ({ order }) => {
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR', { // Example: French locale
      year: 'numeric', month: 'long', day: 'numeric',
      // hour: '2-digit', minute: '2-digit' // Optional: include time
    });
  };

  return (
    <div style={styles.container}>
      <div style={styles.orderDetails}>
        <p><strong>Order ID:</strong> #{order.id}</p>
        <p><strong>Date:</strong> {formatDate(order.created_at)}</p>
        <p><strong>Total:</strong> {order.currency} {parseFloat(order.total_amount).toFixed(2)}</p>
        <p><strong>Status:</strong> <span style={styles.status(order.status)}>{order.status.replace('_', ' ').toUpperCase()}</span></p>
        {order.payment_status && <p><strong>Payment:</strong> <span style={styles.status(order.payment_status, true)}>{order.payment_status.toUpperCase()}</span></p>}
      </div>
      <div style={styles.actions}>
        <Link to={`/orders/${order.id}`} style={styles.button}>View Details</Link>
      </div>
    </div>
  );
};

const styles = {
  container: {
    border: '1px solid #e0e0e0',
    padding: '15px 20px',
    marginBottom: '15px',
    borderRadius: '8px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  orderDetails: {
    fontSize: '0.95em',
  },
  status: (statusValue, isPayment = false) => {
    let color;
    if (isPayment) {
        switch (statusValue) {
            case 'paid': color = 'green'; break;
            case 'pending': color = 'orange'; break;
            case 'failed': color = 'red'; break;
            case 'refunded': color = 'purple'; break;
            default: color = 'grey';
        }
    } else { // Order status
        switch (statusValue) {
            case 'pending_payment': color = '#E67E22'; break; // Darker Orange
            case 'processing': color = '#3498DB'; break; // Blue
            case 'awaiting_shipment': color = '#F1C40F'; break; // Yellow
            case 'shipped': color = '#2ECC71'; break; // Green
            case 'delivered': color = '#1ABC9C'; break; // Turquoise
            case 'completed': color = '#27AE60'; break; // Darker Green
            case 'cancelled': color = '#E74C3C'; break; // Red
            case 'refunded': color = '#9B59B6'; break; // Purple
            case 'failed': color = '#C0392B'; break; // Darker Red
            default: color = '#7F8C8D'; // Grey
        }
    }
    return {
        fontWeight: 'bold',
        color: 'white', // Text color
        backgroundColor: color, // Background color for the badge
        padding: '3px 8px',
        borderRadius: '12px', // Pill shape
        fontSize: '0.85em',
        display: 'inline-block',
        textTransform: 'capitalize'
    };
  },
  actions: {},
  button: {
    padding: '10px 15px',
    textDecoration: 'none',
    border: 'none',
    borderRadius: '5px',
    backgroundColor: '#3498db', // Blue
    color: 'white',
    textAlign: 'center',
    cursor: 'pointer',
    fontSize: '0.9em',
    transition: 'background-color 0.2s ease',
  },
  // buttonHover: { // Would need onMouseEnter/Leave or CSS class for this
  //   backgroundColor: '#2980b9',
  // }
};

export default OrderListItem;
