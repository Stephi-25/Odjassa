import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ProductForm from '../../components/products/ProductForm';
import apiService from '../../services/apiService';
// import { useAuth } from '../../contexts/AuthContext'; // For permission checks if needed, though backend handles it

const ProductEditPage = () => {
  const { productId } = useParams(); // Get productId from URL
  const navigate = useNavigate();
  // const { user } = useAuth(); // For potential frontend permission display, backend enforces actual rules

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await apiService.getProductById(productId);
        if (response && response.status === 'success' && response.data.product) {
          setProduct(response.data.product);
        } else {
          throw new Error('Product not found or invalid response.');
        }
      } catch (err) {
        console.error('Failed to fetch product for editing:', err);
        setError(err.message || 'Could not load product details.');
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchProduct();
    } else {
      setError('No product ID provided.');
      setLoading(false);
    }
  }, [productId]);

  const handleUpdateProduct = async (id, productData) => {
    // productData from ProductForm includes image URL if changed/uploaded.
    // Backend will verify ownership.
    try {
      const response = await apiService.updateProduct(id, productData);
      if (response && response.status === 'success') {
        // console.log('Product updated:', response.data.product);
        // Success message is handled in ProductForm or can be handled here.
        navigate('/vendor/dashboard'); // Or back to product details page
        return Promise.resolve(response.data.product); // For ProductForm success handling
      } else {
        throw new Error(response.message || 'Failed to update product.');
      }
    } catch (error) {
      console.error("Update product error in Page:", error);
      // Error is displayed by ProductForm, we re-throw to indicate failure to ProductForm
      throw error;
    }
  };

  if (loading) return <p>Loading product details...</p>;
  if (error) return <p className="error-message">Error: {error}</p>;
  if (!product) return <p>Product not found.</p>;

  // Basic frontend check to ensure only the product owner (or admin) can see the edit form.
  // The actual update operation is protected on the backend.
  // This is a UI hint, not the primary security measure.
  // if (user && user.role !== 'admin' && product.vendor_id !== user.id) {
  //   return <p className="error-message">You are not authorized to edit this product.</p>;
  // }

  return (
    <div>
      <h1>Edit Product</h1>
      <p>Update the details for: <strong>{product.name}</strong></p>
      <ProductForm productToEdit={product} onFormSubmit={handleUpdateProduct} />
    </div>
  );
};

export default ProductEditPage;
