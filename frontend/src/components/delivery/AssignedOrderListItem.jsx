import React, { useState } from 'react';

const AssignedOrderListItem = ({ order, onUpdateStatus, isLoading }) => {
  const { id, shipping_address, status, total_amount, currency } = order;
  const [showStatusOptions, setShowStatusOptions] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  // const [deliveryNotes, setDeliveryNotes] = useState(''); // For future use if notes are added

  const renderSimplifiedAddress = (address) => {
    if (!address) return 'N/A';
    return `${address.street || ''}, ${address.city || ''}, ${address.postal_code || ''}`;
  };

  const handleStatusButtonClick = (newStatus) => {
    // If a more complex form for status update is needed (e.g., for notes, proof of delivery),
    // this could open a modal or expand a section.
    // For now, directly call onUpdateStatus or prepare for it.
    if (newStatus === status) { // No change
        setShowStatusOptions(false);
        return;
    }
    onUpdateStatus(id, newStatus /*, deliveryNotes */); // Pass notes if implemented
    setShowStatusOptions(false); // Close options after action
    // setDeliveryNotes(''); // Reset notes
  };

  // Determine which buttons to show based on current status
  const getStatusActionButtons = () => {
    switch (status) {
      case 'awaiting_pickup':
        return (
          <button onClick={() => handleStatusButtonClick('out_for_delivery')} disabled={isLoading} style={styles.actionButton}>
            Mark as Out for Delivery
          </button>
        );
      case 'out_for_delivery':
      case 'delivery_attempted': // Can attempt again or mark delivered/failed
        return (
          <>
            <button onClick={() => handleStatusButtonClick('delivered')} disabled={isLoading} style={{...styles.actionButton, ...styles.deliveredButton}}>
              Mark as Delivered
            </button>
            <button onClick={() => handleStatusButtonClick('delivery_failed')} disabled={isLoading} style={{...styles.actionButton, ...styles.failedButton}}>
              Mark as Delivery Failed
            </button>
            {status === 'out_for_delivery' && // Only show re-attempt if it wasn't already an attempt
              <button onClick={() => handleStatusButtonClick('delivery_attempted')} disabled={isLoading} style={{...styles.actionButton, ...styles.attemptedButton}}>
                Delivery Attempted
              </button>
            }
          </>
        );
      // For 'delivered', 'delivery_failed', 'cancelled', 'completed' - usually no more actions for delivery person
      default:
        return null;
    }
  };


  return (
    <div style={styles.itemContainer}>
      <h4>Order #{id} - Status: <span style={styles.statusBadge(status)}>{status.replace('_', ' ').toUpperCase()}</span></h4>
      <p><strong>Address:</strong> {renderSimplifiedAddress(shipping_address)}</p>
      <p><strong>Order Total:</strong> {currency} {parseFloat(total_amount).toFixed(2)}</p>

      <div style={styles.actionsContainer}>
        {getStatusActionButtons()}
      </div>

      {/* Alternative: A dropdown to select status and then a confirm button */}
      {/*
      <button onClick={() => setShowStatusOptions(!showStatusOptions)} disabled={isLoading}>
        Update Status
      </button>
      {showStatusOptions && (
        <div style={{marginTop: '10px'}}>
          <select onChange={(e) => setSelectedStatus(e.target.value)} value={selectedStatus}>
            <option value="">Select new status</option>
            {status === 'awaiting_pickup' && <option value="out_for_delivery">Out for Delivery</option>}
            {(status === 'out_for_delivery' || status === 'delivery_attempted') && <>
              <option value="delivered">Delivered</option>
              <option value="delivery_failed">Delivery Failed</option>
              {status === 'out_for_delivery' && <option value="delivery_attempted">Delivery Attempted</option>}
            </>}
          </select>
          <button onClick={() => handleStatusButtonClick(selectedStatus)} disabled={!selectedStatus || isLoading} style={{marginLeft: '10px'}}>
            Confirm Update
          </button>
        </div>
      )}
      */}
    </div>
  );
};

const styles = {
  itemContainer: {
    border: '1px solid #c8e6c9', // Green border
    padding: '15px',
    marginBottom: '10px',
    borderRadius: '8px',
    backgroundColor: '#e8f5e9', // Light green background
  },
  actionsContainer: {
    marginTop: '10px',
    display: 'flex',
    flexWrap: 'wrap', // Allow buttons to wrap on smaller screens
    gap: '10px', // Space between buttons
  },
  actionButton: {
    padding: '8px 12px',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '0.9em',
    color: 'white',
  },
  deliveredButton: {
    backgroundColor: '#4CAF50', // Green
  },
  failedButton: {
    backgroundColor: '#f44336', // Red
  },
  attemptedButton: {
    backgroundColor: '#ff9800', // Orange
  },
  statusBadge: (statusValue) => { // Copied from OrderListItem, should be centralized
    let color;
    switch (statusValue) {
        case 'pending_payment': color = '#E67E22'; break;
        case 'processing': color = '#3498DB'; break;
        case 'ready_for_delivery': color = '#5DADE2'; break; // Lighter Blue
        case 'awaiting_pickup': color = '#F1C40F'; break; // Yellow
        case 'out_for_delivery': color = '#2ECC71'; break; // Green
        case 'delivered': color = '#1ABC9C'; break; // Turquoise
        case 'delivery_attempted': color = '#FF9800'; break; // Orange for attempted
        case 'delivery_failed': color = '#E74C3C'; break; // Red
        case 'completed': color = '#27AE60'; break;
        case 'cancelled': color = '#C0392B'; break;
        case 'refunded': color = '#9B59B6'; break;
        default: color = '#7F8C8D';
    }
    return {
        fontWeight: 'bold',
        color: 'white',
        backgroundColor: color,
        padding: '3px 8px',
        borderRadius: '12px',
        fontSize: '0.85em',
        display: 'inline-block',
        textTransform: 'capitalize'
    };
  }
};

export default AssignedOrderListItem;
