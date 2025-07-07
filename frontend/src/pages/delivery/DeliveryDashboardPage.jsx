import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom'; // If needed for navigation
import apiService from '../../services/apiService';
import { useAuth } from '../../contexts/AuthContext';
import AvailableOrderListItem from '../../components/delivery/AvailableOrderListItem';
import AssignedOrderListItem from '../../components/delivery/AssignedOrderListItem';

const DeliveryDashboardPage = () => {
  const { user, isLoading: authLoading } = useAuth();

  const [availableOrders, setAvailableOrders] = useState([]);
  const [assignedOrders, setAssignedOrders] = useState([]);

  const [loadingAvailable, setLoadingAvailable] = useState(true);
  const [loadingAssigned, setLoadingAssigned] = useState(true);

  const [errorAvailable, setErrorAvailable] = useState('');
  const [errorAssigned, setErrorAssigned] = useState('');

  // useCallback to memoize fetch functions to prevent re-fetching on every render unless dependencies change
  const fetchAvailableOrders = useCallback(async () => {
    setLoadingAvailable(true);
    setErrorAvailable('');
    try {
      const response = await apiService.getAvailableOrdersForDelivery({ limit: 20 }); // Example limit
      if (response && response.status === 'success' && Array.isArray(response.data.orders)) {
        setAvailableOrders(response.data.orders);
      } else {
        setAvailableOrders([]);
        console.warn('Could not fetch available orders or invalid format.');
      }
    } catch (err) {
      setErrorAvailable(err.message || 'Failed to fetch available orders.');
      setAvailableOrders([]);
    } finally {
      setLoadingAvailable(false);
    }
  }, []); // No dependencies other than apiService which is stable

  const fetchAssignedOrders = useCallback(async () => {
    if (!user || !user.id) return; // Should not happen if route is protected and user loaded
    setLoadingAssigned(true);
    setErrorAssigned('');
    try {
      // Fetch active assignments: 'awaiting_pickup', 'out_for_delivery', 'delivery_attempted'
      const response = await apiService.getMyAssignedDeliveries({
          status: 'awaiting_pickup,out_for_delivery,delivery_attempted',
          limit: 20
      });
      if (response && response.status === 'success' && Array.isArray(response.data.orders)) {
        setAssignedOrders(response.data.orders);
      } else {
        setAssignedOrders([]);
        console.warn('Could not fetch assigned orders or invalid format.');
      }
    } catch (err) {
      setErrorAssigned(err.message || 'Failed to fetch assigned orders.');
      setAssignedOrders([]);
    } finally {
      setLoadingAssigned(false);
    }
  }, [user]); // Dependency on user to ensure user.id is available

  useEffect(() => {
    if (!authLoading && user && user.role === 'delivery_person') {
      fetchAvailableOrders();
      fetchAssignedOrders();
    } else if (!authLoading && (!user || user.role !== 'delivery_person')) {
        // Should be handled by ProtectedRoute, but as a safeguard
        setErrorAvailable("Access denied.");
        setErrorAssigned("Access denied.");
        setLoadingAvailable(false);
        setLoadingAssigned(false);
    }
  }, [user, authLoading, fetchAvailableOrders, fetchAssignedOrders]);


  const handleClaimOrder = async (orderId) => {
    // Optimistic UI update could remove from available and add to assigned with 'claiming...' state
    try {
      await apiService.claimOrderForDelivery(orderId);
      // Refetch both lists to ensure consistency
      fetchAvailableOrders();
      fetchAssignedOrders();
      alert(`Order #${orderId} claimed successfully!`); // Replace with better notification
    } catch (err) {
      alert(`Failed to claim order #${orderId}: ${err.message}`);
    }
  };

  const handleUpdateStatus = async (orderId, newStatus, notes = '') => {
    try {
      await apiService.updateDeliveryOrderStatus(orderId, { status: newStatus, notes }); // Pass notes if your API handles it
      // Refetch assigned orders to show updated status
      fetchAssignedOrders();
      alert(`Order #${orderId} status updated to ${newStatus}.`); // Replace with better notification
    } catch (err) {
      alert(`Failed to update status for order #${orderId}: ${err.message}`);
    }
  };

  if (authLoading) {
      return <p>Loading user session...</p>;
  }

  if (!user || user.role !== 'delivery_person') {
      // This should ideally be caught by ProtectedRoute, but good to have a fallback.
      return <p className="error-message">Access Denied. This dashboard is for delivery personnel only. <Link to="/">Go Home</Link></p>;
  }

  return (
    <div style={styles.dashboardContainer}>
      <h1>Delivery Dashboard</h1>

      <section style={styles.section}>
        <h2>Available Orders for Pickup</h2>
        {loadingAvailable && <p>Loading available orders...</p>}
        {errorAvailable && <p className="error-message">{errorAvailable}</p>}
        {!loadingAvailable && !errorAvailable && availableOrders.length === 0 && (
          <p>No orders currently available for pickup.</p>
        )}
        {!loadingAvailable && availableOrders.length > 0 && (
          <div style={styles.listContainer}>
            {availableOrders.map(order => (
              <AvailableOrderListItem
                key={order.id}
                order={order}
                onClaimOrder={handleClaimOrder}
                // isLoading={/* pass individual item loading state if needed */}
              />
            ))}
          </div>
        )}
      </section>

      <section style={styles.section}>
        <h2>My Active Deliveries</h2>
        {loadingAssigned && <p>Loading your assigned deliveries...</p>}
        {errorAssigned && <p className="error-message">{errorAssigned}</p>}
        {!loadingAssigned && !errorAssigned && assignedOrders.length === 0 && (
          <p>You have no active deliveries assigned.</p>
        )}
        {!loadingAssigned && assignedOrders.length > 0 && (
          <div style={styles.listContainer}>
            {assignedOrders.map(order => (
              <AssignedOrderListItem
                key={order.id}
                order={order}
                onUpdateStatus={handleUpdateStatus}
                // isLoading={/* pass individual item loading state if needed */}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

const styles = {
  dashboardContainer: {
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  section: {
    marginBottom: '30px',
    padding: '20px',
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  listContainer: {
    // Max height and scroll can be added if lists get very long
    // maxHeight: '400px',
    // overflowY: 'auto',
  }
};

export default DeliveryDashboardPage;
