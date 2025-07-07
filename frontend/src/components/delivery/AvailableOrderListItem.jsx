import React from 'react';

const AvailableOrderListItem = ({ order, onClaimOrder, isLoading }) => {
  const { id, shipping_address, total_amount, currency, items } = order;

  // Helper to render a simplified address
  const renderSimplifiedAddress = (address) => {
    if (!address) return 'N/A';
    return `${address.street || ''}, ${address.city || ''}, ${address.postal_code || ''}`;
  };

  // Calculate total items for display (optional)
  // const totalItems = items ? items.reduce((sum, item) => sum + item.quantity, 0) : 'N/A';

  return (
    <div style={styles.itemContainer}>
      <h4>Order #{id}</h4>
      <p><strong>Address:</strong> {renderSimplifiedAddress(shipping_address)}</p>
      {/* <p><strong>Total Items:</strong> {totalItems}</p> */}
      <p><strong>Order Total:</strong> {currency} {parseFloat(total_amount).toFixed(2)}</p>
      {/* Could add more info like distance if available, or specific vendor notes */}
      <button
        onClick={() => onClaimOrder(id)}
        disabled={isLoading}
        style={styles.claimButton}
      >
        {isLoading ? 'Claiming...' : 'Claim This Delivery'}
      </button>
    </div>
  );
};

const styles = {
  itemContainer: {
    border: '1px solid #b2dfdb', // Teal border
    padding: '15px',
    marginBottom: '10px',
    borderRadius: '8px',
    backgroundColor: '#e0f2f1', // Light teal background
  },
  claimButton: {
    backgroundColor: '#00796b', // Darker teal
    color: 'white',
    padding: '10px 15px',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '0.9em',
    marginTop: '10px',
  }
};

export default AvailableOrderListItem;
