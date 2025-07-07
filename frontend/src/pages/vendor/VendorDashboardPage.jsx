import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiService from '../../services/apiService';
import { useAuth } from '../../contexts/AuthContext'; // To get current vendor's ID
import ProductListItem from '../../components/products/ProductListItem'; // Import the extracted component


const VendorDashboardPage = () => {
  const { user } = useAuth(); // Get the logged-in user (vendor)
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user && user.id) {
      fetchVendorProducts(user.id);
    } else if (!user) {
        // This case should ideally be handled by ProtectedRoute if user is null after loading
        setError("User not authenticated. Please login.");
        setLoading(false);
    }
    // If user is defined but user.id is somehow missing, it's an issue with auth context or user object
  }, [user]);

  const fetchVendorProducts = async (vendorId) => {
    setLoading(true);
    setError('');
    try {
      // Fetch all statuses for the vendor's view
      const response = await apiService.getVendorProducts(vendorId, { /* no status filter to see all */ });
      if (response && response.status === 'success' && Array.isArray(response.data.products)) {
        setProducts(response.data.products);
      } else {
        throw new Error('Could not fetch products or invalid response format.');
      }
    } catch (err) {
      console.error('Failed to fetch vendor products:', err);
      setError(err.message || 'An error occurred while fetching your products.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      try {
        await apiService.deleteProduct(productId);
        // Refetch products after deletion
        if (user && user.id) {
          fetchVendorProducts(user.id);
        }
         alert('Product deleted successfully.'); // Or use a more sophisticated notification
      } catch (err) {
        console.error('Failed to delete product:', err);
        alert(err.message || 'Failed to delete product.');
      }
    }
  };

  if (loading && !user) { // Only show initial loading if user is not yet determined
    return <p>Loading user information...</p>;
  }

  if (!user) { // After loading, if user is still null (e.g. token expired before page load)
    // This should be rare if ProtectedRoute works, but as a fallback
    return <p>Please <Link to="/login">login</Link> to view your dashboard.</p>;
  }

  if (user.role !== 'vendor') {
      // This check is a fallback; primary protection via ProtectedRoute with roles
      return <p className="error-message">Access Denied: This page is for vendors only.</p>;
  }

  return (
    <div>
      <h1>Vendor Dashboard - My Products</h1>
      <Link to="/vendor/products/new" style={{ display: 'inline-block', marginBottom: '20px', padding: '10px 15px', backgroundColor: '#5cb85c', color: 'white', textDecoration: 'none', borderRadius: '5px' }}>
        + Add New Product
      </Link>

      {loading && <p>Loading your products...</p>}
      {error && <p className="error-message">{error}</p>}

      {!loading && !error && products.length === 0 && (
        <p>You haven't added any products yet. <Link to="/vendor/products/new">Add your first product!</Link></p>
      )}

      {!loading && !error && products.length > 0 && (
        <div>
          {products.map(product => (
            <ProductListItem key={product.id} product={product} onDelete={handleDeleteProduct} />
          ))}
        </div>
      )}
    </div>
  );
};

export default VendorDashboardPage;
