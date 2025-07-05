import React from 'react';
import LoginForm from '../components/auth/LoginForm';

const LoginPage = () => {
  return (
    <div>
      <h1>Login</h1>
      <p>Please enter your credentials to log in.</p>
      <LoginForm />
    </div>
  );
};

export default LoginPage;
