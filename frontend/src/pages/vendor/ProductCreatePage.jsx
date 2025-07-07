import React from 'react';
import { useNavigate } from 'react-router-dom';
import ProductForm from '../../components/products/ProductForm';
import apiService from '../../services/apiService'; // For the actual API call
// import { useAuth } from '../../contexts/AuthContext'; // To get vendor_id if needed on frontend

const ProductCreatePage = () => {
  const navigate = useNavigate();
  // const { user } = useAuth(); // The backend will use req.user.id as vendor_id

  const handleCreateProduct = async (productData) => {
    // The productData from ProductForm already includes the image URL if uploaded.
    // vendor_id is handled by the backend using the authenticated user's token.
    try {
      const response = await apiService.createProduct(productData);
      if (response && response.status === 'success') {
        // console.log('Product created:', response.data.product);
        // Success message is handled in ProductForm, or can be handled here.
        // Redirect to vendor dashboard or the new product's page (if we have one)
        navigate('/vendor/dashboard'); // Or `/products/${response.data.product.id}`
        return Promise.resolve(response.data.product); // For ProductForm success handling
      } else {
        // This case should ideally be caught by apiService and thrown as an error
        throw new Error(response.message || 'Failed to create product.');
      }
    } catch (error) {
      console.error("Create product error in Page:", error);
      // Error is displayed by ProductForm, but we re-throw to indicate failure to ProductForm
      throw error;
    }
  };

  return (
    <div>
      <h1>Create New Product</h1>
      <p>Fill in the details below to add a new product to your store.</p>
      <ProductForm onFormSubmit={handleCreateProduct} />
    </div>
  );
};

export default ProductCreatePage;
