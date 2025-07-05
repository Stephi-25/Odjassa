import React from 'react';
import { Link } from 'react-router-dom';

const HomePage = () => {
  return (
    <div>
      <h1>Welcome to Odjassa-Net!</h1>
      <p>Your one-stop platform for amazing products and services.</p>
      <p>
        Browse our <Link to="/products">products</Link> (coming soon!),
        or <Link to="/login">login</Link> to your account.
      </p>
      <p>
        New here? <Link to="/register">Create an account</Link> to get started.
      </p>
    </div>
  );
};

export default HomePage;
