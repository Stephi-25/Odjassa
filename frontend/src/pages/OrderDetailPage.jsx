import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import apiService from '../services/apiService';
import { useAuth } from '../contexts/AuthContext'; // To ensure user is logged in & for auth checks
import OrderItemCard from '../components/orders/OrderItemCard'; // To display each item

const OrderDetailPage = () => {
  const { orderId } = useParams();
  const { user, isLoading: authLoading } = useAuth(); // For potential authorization checks client-side

  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && user && orderId) { // Fetch only if user is loaded, exists, and orderId is present
      fetchOrderDetails();
    } else if (!authLoading && !user) {
      setError("Please login to view order details.");
      setLoading(false);
    }
  }, [orderId, user, authLoading]);

  const fetchOrderDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await apiService.getOrderDetails(orderId);
      if (response && response.status === 'success' && response.data.order && Array.isArray(response.data.items)) {
        // Client-side check: although backend does this, ensure this user owns the order
        // This is more of a UI consistency check; backend is the source of truth for auth.
        if (user.role !== 'admin' && response.data.order.user_id !== user.id) {
            setError("You are not authorized to view this order.");
            setOrder(null);
            setItems([]);
        } else {
            setOrder(response.data.order);
            setItems(response.data.items);
        }
      } else {
        throw new Error('Could not fetch order details or invalid response format.');
      }
    } catch (err) {
      console.error('Failed to fetch order details:', err);
      setError(err.message || 'An error occurred while fetching order details.');
      setOrder(null);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('fr-FR', { // Example: French locale with time
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const renderAddress = (address) => {
    if (!address) return <p>N/A</p>;
    // Assuming address is a JSON object like:
    // {"name": "John Doe", "street": "123 Main St", "city": "Anytown", "postal_code": "12345", "country": "US", "phone": "555-1234"}
    return (
      <>
        {address.name && <p>{address.name}</p>}
        <p>{address.street}</p>
        {address.street2 && <p>{address.street2}</p>}
        <p>{address.city}, {address.state || ''} {address.postal_code}</p>
        <p>{address.country}</p>
        {address.phone && <p>Phone: {address.phone}</p>}
      </>
    );
  };


  if (authLoading || loading) {
    return <p>Loading order details...</p>;
  }

  if (error) {
    return <p className="error-message">{error} <Link to="/orders">Back to Order History</Link></p>;
  }

  if (!user) { // Should be caught by ProtectedRoute
      return <p>You must be logged in to view order details. <Link to="/login">Login</Link></p>;
  }

  if (!order) {
    return <p>Order not found. <Link to="/orders">Back to Order History</Link></p>;
  }

  return (
    <div style={styles.pageContainer}>
      <h1>Order Details</h1>
      <Link to="/orders" style={styles.backLink}>&larr; Back to Order History</Link>

      <div style={styles.section}>
        <h2>Order Summary</h2>
        <p><strong>Order ID:</strong> #{order.id}</p>
        <p><strong>Date Placed:</strong> {formatDate(order.created_at)}</p>
        <p><strong>Order Status:</strong> <span style={styles.statusBadge(order.status)}>{order.status.replace('_',' ').toUpperCase()}</span></p>
        <p><strong>Payment Status:</strong> <span style={styles.statusBadge(order.payment_status, true)}>{order.payment_status.toUpperCase()}</span></p>
        <p><strong>Total Amount:</strong> {order.currency} {parseFloat(order.total_amount).toFixed(2)}</p>
        {order.payment_method && <p><strong>Payment Method:</strong> {order.payment_method}</p>}
        {order.transaction_id && <p><strong>Transaction ID:</strong> {order.transaction_id}</p>}
      </div>

      <div style={styles.section}>
        <h2>Shipping Information</h2>
        <p><strong>Shipping Method:</strong> {order.shipping_method || 'N/A'}</p>
        <p><strong>Shipping Cost:</strong> {order.currency} {parseFloat(order.shipping_cost).toFixed(2)}</p>
        {order.tracking_number && <p><strong>Tracking Number:</strong> {order.tracking_number}</p>}
        {order.estimated_delivery_date && <p><strong>Estimated Delivery:</strong> {new Date(order.estimated_delivery_date).toLocaleDateString('fr-FR')}</p>}
        {order.delivered_at && <p><strong>Delivered On:</strong> {formatDate(order.delivered_at)}</p>}
        <h3>Shipping Address:</h3>
        {renderAddress(order.shipping_address)}
      </div>

      {order.billing_address && (
        <div style={styles.section}>
          <h3>Billing Address:</h3>
          {renderAddress(order.billing_address)}
        </div>
      )}

      {order.notes_to_vendor && (
          <div style={styles.section}>
              <h3>Notes for Vendor:</h3>
              <p>{order.notes_to_vendor}</p>
          </div>
      )}

      <div style={styles.section}>
        <h2>Items Ordered ({items.length})</h2>
        {items.length > 0 ? (
          items.map(item => (
            <OrderItemCard key={item.id} item={item} currency={order.currency} />
          ))
        ) : (
          <p>No items found for this order.</p>
        )}
      </div>
    </div>
  );
};

const styles = {
  pageContainer: {
    maxWidth: '900px',
    margin: '0 auto',
    padding: '20px',
  },
  backLink: {
    display: 'inline-block',
    marginBottom: '20px',
    color: '#3498db',
    textDecoration: 'none',
  },
  section: {
    backgroundColor: '#fff',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
    marginBottom: '25px',
  },
  statusBadge: (statusValue, isPayment = false) => { // Copied from OrderListItem, should be centralized
    let color;
    if (isPayment) {
        switch (statusValue) {
            case 'paid': color = 'green'; break;
            case 'pending': color = 'orange'; break;
            case 'failed': color = 'red'; break;
            case 'refunded': color = 'purple'; break;
            default: color = 'grey';
        }
    } else {
        switch (statusValue) {
            case 'pending_payment': color = '#E67E22'; break;
            case 'processing': color = '#3498DB'; break;
            case 'awaiting_shipment': color = '#F1C40F'; break;
            case 'shipped': color = '#2ECC71'; break;
            case 'delivered': color = '#1ABC9C'; break;
            case 'completed': color = '#27AE60'; break;
            case 'cancelled': color = '#E74C3C'; break;
            case 'refunded': color = '#9B59B6'; break;
            case 'failed': color = '#C0392B'; break;
            default: color = '#7F8C8D';
        }
    }
    return {
        fontWeight: 'bold',
        color: 'white',
        backgroundColor: color,
        padding: '3px 8px',
        borderRadius: '12px',
        fontSize: '0.9em',
        display: 'inline-block',
        textTransform: 'capitalize'
    };
  }
};

export default OrderDetailPage;
