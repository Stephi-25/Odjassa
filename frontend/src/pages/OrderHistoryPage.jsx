import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiService from '../services/apiService';
import { useAuth } from '../contexts/AuthContext'; // To ensure user is logged in
import OrderListItem from '../components/orders/OrderListItem'; // Optional, but good for structure

const OrderHistoryPage = () => {
  const { user, isLoading: authLoading } = useAuth(); // Use isLoading from auth to wait for user
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, totalPages: 1 }); // Basic pagination state

  useEffect(() => {
    if (!authLoading && user) { // Fetch orders only when user is loaded and exists
      fetchOrders(pagination.page);
    } else if (!authLoading && !user) {
      // This case should be handled by ProtectedRoute, but as a safeguard:
      setError("Please login to view your order history.");
      setLoading(false);
    }
  }, [user, authLoading, pagination.page]); // Re-fetch if user changes or page changes

  const fetchOrders = async (page) => {
    setLoading(true);
    setError('');
    try {
      // Assuming getUserOrders can take pagination params like { page, limit }
      const response = await apiService.getUserOrders({ page, limit: pagination.limit });
      if (response && response.status === 'success' && Array.isArray(response.data.orders)) {
        setOrders(response.data.orders);
        // Assuming backend might send total count or total pages for pagination
        // For now, just setting based on if results are less than limit
        // const total = response.total || (response.data.orders.length < pagination.limit ? page : page + 1);
        // setPagination(prev => ({ ...prev, totalPages: Math.ceil(total / pagination.limit) }));
      } else {
        setOrders([]); // Clear orders if response is not as expected
        // throw new Error('Could not fetch order history or invalid response format.');
        console.warn('Could not fetch order history or invalid response format.', response);
      }
    } catch (err) {
      console.error('Failed to fetch order history:', err);
      setError(err.message || 'An error occurred while fetching your order history.');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // Basic pagination handlers (can be improved)
  const handleNextPage = () => {
    // if (pagination.page < pagination.totalPages) { // If we had totalPages
    //   setPagination(prev => ({ ...prev, page: prev.page + 1 }));
    // }
    // For now, allow next if current page has full limit of items, crude
    if (orders.length === pagination.limit) {
       setPagination(prev => ({ ...prev, page: prev.page + 1 }));
    }
  };

  const handlePreviousPage = () => {
    if (pagination.page > 1) {
      setPagination(prev => ({ ...prev, page: prev.page - 1 }));
    }
  };


  if (authLoading || (loading && orders.length === 0 && !error)) { // Show loading if auth is loading OR if orders are loading & no error yet
    return <p>Loading order history...</p>;
  }

  if (error) {
    return <p className="error-message">{error}</p>;
  }

  if (!user) { // Should be caught by ProtectedRoute, but as a failsafe
      return <p>You must be logged in to view your order history. <Link to="/login">Login</Link></p>;
  }

  return (
    <div>
      <h1>My Order History</h1>
      {orders.length === 0 && !loading && (
        <p>You have not placed any orders yet.</p>
      )}
      {orders.length > 0 && (
        <>
          <div>
            {orders.map(order => (
              <OrderListItem key={order.id} order={order} />
            ))}
          </div>
          {/* Basic Pagination Controls */}
          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <button onClick={handlePreviousPage} disabled={pagination.page === 1 || loading}>
              Previous
            </button>
            <span style={{ margin: '0 10px' }}>Page {pagination.page}</span>
            <button onClick={handleNextPage} disabled={orders.length < pagination.limit || loading}>
              {/* Disabled if not a full page of results, crude */}
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default OrderHistoryPage;
