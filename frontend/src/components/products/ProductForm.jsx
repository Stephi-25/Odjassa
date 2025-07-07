import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../../services/apiService'; // Assuming this path is correct
// import { useAuth } from '../../contexts/AuthContext'; // If needed for vendor_id, but usually passed by parent

const ProductForm = ({ productToEdit, onFormSubmit }) => {
  const [product, setProduct] = useState({
    name: '',
    description: '',
    price: '',
    stock_quantity: '',
    sku: '',
    category_id: '', // For now, a simple input; could be a select later
    images: [], // Array of image URLs/paths from server
  });
  const [currentImageFile, setCurrentImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const navigate = useNavigate();
  // const { user } = useAuth(); // Not directly using user.id here, parent should pass vendor_id if needed or API handles it

  useEffect(() => {
    if (productToEdit) {
      setProduct({
        name: productToEdit.name || '',
        description: productToEdit.description || '',
        price: productToEdit.price || '',
        stock_quantity: productToEdit.stock_quantity || '',
        sku: productToEdit.sku || '',
        category_id: productToEdit.category_id || '',
        images: productToEdit.images || [], // Expecting an array of URLs
      });
      // If there are existing images, preview the first one
      if (productToEdit.images && productToEdit.images.length > 0) {
        // Assuming the URLs are full URLs or can be resolved by browser
        // If they are relative paths like '/uploads/products/image.jpg', prepend base URL if needed for preview
        // For now, assuming they are directly usable or the backend serves them correctly relative to frontend origin
        setImagePreview(productToEdit.images[0]);
      }
    } else {
      // Reset form for new product
      setProduct({ name: '', description: '', price: '', stock_quantity: '', sku: '', category_id: '', images: [] });
      setImagePreview('');
    }
  }, [productToEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProduct(prev => ({ ...prev, [name]: value }));
  };

  const handleImageFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCurrentImageFile(file);
      // Create a preview URL for the selected file
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setCurrentImageFile(null);
      // If productToEdit had an image, revert to its first image on file removal
      setImagePreview(productToEdit && productToEdit.images && productToEdit.images.length > 0 ? productToEdit.images[0] : '');
    }
  };

  const handleImageUpload = async () => {
    if (!currentImageFile) {
      setError('Please select an image file to upload.');
      return null;
    }
    setIsUploading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('productImage', currentImageFile);
      const response = await apiService.uploadProductImage(formData); // From your apiService
      setIsUploading(false);
      if (response && response.data && response.data.publicUrl) {
        setSuccessMessage('Image uploaded successfully!');
        // Add this new image URL to the product's images array
        // For simplicity, this form currently handles one main image.
        // To handle multiple images, product.images would be an array of URLs.
        // This example replaces existing images with the new one.
        setProduct(prev => ({ ...prev, images: [response.data.publicUrl] }));
        setCurrentImageFile(null); // Clear the file input after successful upload
        return response.data.publicUrl;
      } else {
        throw new Error('Image URL not found in upload response.');
      }
    } catch (uploadError) {
      console.error('Image upload error:', uploadError);
      setError(uploadError.message || 'Failed to upload image.');
      setIsUploading(false);
      return null;
    }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    let finalProductData = { ...product };

    // Handle image upload if a new file is selected
    if (currentImageFile) {
      const uploadedImageUrl = await handleImageUpload();
      if (uploadedImageUrl) {
        // This form currently only supports one primary image.
        // If multiple images are supported, logic here would be to add to an array.
        finalProductData.images = [uploadedImageUrl];
      } else {
        // Image upload failed, stop form submission
        setIsLoading(false);
        // Error is already set by handleImageUpload
        return;
      }
    }
    // If no new file is selected, product.images (from state, potentially from productToEdit) will be used.

    // Basic validation
    if (!finalProductData.name || !finalProductData.price) {
      setError('Name and Price are required.');
      setIsLoading(false);
      return;
    }

    finalProductData.price = parseFloat(finalProductData.price);
    finalProductData.stock_quantity = parseInt(finalProductData.stock_quantity) || 0;
    finalProductData.category_id = finalProductData.category_id ? parseInt(finalProductData.category_id) : null;


    try {
      if (productToEdit && productToEdit.id) {
        // Update existing product
        // The vendor_id check is done on the backend
        await onFormSubmit(productToEdit.id, finalProductData); // Pass to parent for actual API call
        setSuccessMessage('Product updated successfully!');
      } else {
        // Create new product
        // The vendor_id will be set on the backend from req.user
        await onFormSubmit(finalProductData); // Pass to parent for actual API call
        setSuccessMessage('Product created successfully! It is pending approval.');
        // Optionally reset form after creation
        // setProduct({ name: '', description: '', price: '', stock_quantity: '', sku: '', category_id: '', images: [] });
        // setImagePreview('');
      }
      // Optionally navigate away or let parent handle it
      // navigate('/vendor/dashboard');
    } catch (apiError) {
      console.error('Product form submission error:', apiError);
      setError(apiError.message || 'An error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <p className="error-message">{error}</p>}
      {successMessage && <p className="success-message">{successMessage}</p>}

      <div>
        <label htmlFor="name">Product Name*:</label>
        <input type="text" id="name" name="name" value={product.name} onChange={handleChange} required disabled={isLoading} />
      </div>
      <div>
        <label htmlFor="description">Description:</label>
        <textarea id="description" name="description" value={product.description} onChange={handleChange} disabled={isLoading} />
      </div>
      <div>
        <label htmlFor="price">Price*:</label>
        <input type="number" id="price" name="price" step="0.01" value={product.price} onChange={handleChange} required disabled={isLoading} />
      </div>
      <div>
        <label htmlFor="stock_quantity">Stock Quantity:</label>
        <input type="number" id="stock_quantity" name="stock_quantity" value={product.stock_quantity} onChange={handleChange} disabled={isLoading} />
      </div>
      <div>
        <label htmlFor="sku">SKU:</label>
        <input type="text" id="sku" name="sku" value={product.sku} onChange={handleChange} disabled={isLoading} />
      </div>
      <div>
        <label htmlFor="category_id">Category ID (Numeric, Optional):</label>
        <input type="number" id="category_id" name="category_id" value={product.category_id} onChange={handleChange} disabled={isLoading} />
        {/* TODO: Replace with a category selector component later */}
      </div>

      <div>
        <label htmlFor="productImageFile">Product Image:</label>
        <input type="file" id="productImageFile" onChange={handleImageFileChange} accept="image/png, image/jpeg, image/gif, image/webp" disabled={isUploading || isLoading} />
        {isUploading && <p>Uploading image...</p>}
      </div>

      {imagePreview && (
        <div style={{ marginTop: '10px', marginBottom: '10px' }}>
          <p>Image Preview:</p>
          <img src={imagePreview} alt="Product Preview" style={{ maxWidth: '200px', maxHeight: '200px', border: '1px solid #ddd' }} />
        </div>
      )}
      {!imagePreview && product.images && product.images.length > 0 && (
         <div style={{ marginTop: '10px', marginBottom: '10px' }}>
            <p>Current Image(s):</p>
            {/* This form currently supports one primary image for simplicity in preview and upload logic */}
            {/* If multiple images, map through product.images here */}
            <img src={product.images[0]} alt="Current Product" style={{ maxWidth: '200px', maxHeight: '200px', border: '1px solid #ddd' }} />
         </div>
      )}


      <button type="submit" disabled={isLoading || isUploading}>
        {isLoading ? 'Saving...' : (productToEdit ? 'Update Product' : 'Create Product')}
      </button>
    </form>
  );
};

export default ProductForm;
