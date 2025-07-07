import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Header = () => {
  const { isAuthenticated, logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout(); // This will clear context state and localStorage
    navigate('/login'); // Redirect to login page after logout
  };

  return (
    <header style={styles.header}>
      <div style={styles.logoContainer}>
        <Link to="/" style={styles.logo}>Odjassa-Net</Link>
      </div>
      <nav style={styles.nav}>
        <ul style={styles.navList}>
          <li style={styles.navItem}>
            <Link to="/" style={styles.navLink}>Home</Link>
          </li>
          {/* We will add more links like Products, Cart later */}
          {/* <li style={styles.navItem}>
            <Link to="/products" style={styles.navLink}>Products</Link>
          </li> */}
          {isAuthenticated ? (
            <>
              <li style={styles.navItem}>
                <Link to="/profile" style={styles.navLink}>
                  {user ? user.username : 'Profile'} {/* Display username if available */}
                </Link>
              </li>
              {user && user.role === 'vendor' && (
                <li style={styles.navItem}>
                  <Link to="/vendor/dashboard" style={styles.navLink}>Vendor Dashboard</Link>
                </li>
              )}
              <li style={styles.navItem}>
                <Link to="/orders" style={styles.navLink}>My Orders</Link>
              </li>
              <li style={styles.navItem}>
                <button onClick={handleLogout} style={{...styles.navLink, ...styles.buttonLink}}>Logout</button>
              </li>
            </>
          ) : (
            <>
              <li style={styles.navItem}>
                <Link to="/login" style={styles.navLink}>Login</Link>
              </li>
              <li style={styles.navItem}>
                <Link to="/register" style={styles.navLink}>Register</Link>
              </li>
            </>
          )}
        </ul>
      </nav>
    </header>
  );
};

// Basic inline styles (can be moved to a CSS file or module later)
const styles = {
  header: {
    backgroundColor: '#2c3e50', // Dark blue/grey
    padding: '1rem 2rem',
    color: 'white',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  logoContainer: {
    // flexGrow: 1,
  },
  logo: {
    color: 'white',
    textDecoration: 'none',
    fontSize: '1.5rem',
    fontWeight: 'bold',
  },
  nav: {
    // flexGrow: 2,
    // display: 'flex',
    // justifyContent: 'flex-end',
  },
  navList: {
    listStyle: 'none',
    margin: 0,
    padding: 0,
    display: 'flex',
  },
  navItem: {
    marginLeft: '20px',
  },
  navLink: {
    color: 'white',
    textDecoration: 'none',
    fontSize: '1rem',
    padding: '0.5rem',
  },
  buttonLink: {
    background: 'none',
    border: 'none',
    color: 'white',
    cursor: 'pointer',
    fontSize: '1rem',
    fontFamily: 'inherit',
    padding: '0.5rem', // Match navLink padding
  }
};

export default Header;
