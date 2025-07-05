const { Pool } = require('pg'); // Using the mocked 'pg' module

// PostgreSQL connection pool configuration
// The Pool will automatically use environment variables if they are set:
// PGUSER, PGHOST, PGDATABASE, PGPASSWORD, PGPORT
// Or you can provide a connectionString: process.env.DATABASE_URL

let pool;

try {
  pool = new Pool({
    // Example of explicit configuration if DATABASE_URL is not set or for more control:
    // user: process.env.DB_USER || 'odjassauser',
    // host: process.env.DB_HOST || 'db', // 'db' is the service name in docker-compose.yml
    // database: process.env.DB_NAME || 'odjassanet_dev',
    // password: process.env.DB_PASSWORD || 'odjassapassword',
    // port: process.env.DB_PORT || 5432,
    // max: 20, // Max number of clients in the pool
    // idleTimeoutMillis: 30000, // How long a client is allowed to remain idle before being closed
    // connectionTimeoutMillis: 2000, // How long to wait for a client connection to be established
    // Allow self-signed certificates in development if necessary (not recommended for production)
    // ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: true } : { rejectUnauthorized: false },
  });

  console.log('Database pool configured. It will use environment variables for connection.');
  if (process.env.DATABASE_URL) {
    console.log('DATABASE_URL is set, pg Pool will use it.');
  } else {
    console.log('DATABASE_URL is not set. pg Pool will attempt to use individual PG* environment variables (PGHOST, PGUSER, etc.).');
    console.log(`PGHOST: ${process.env.PGHOST}, PGUSER: ${process.env.PGUSER}, PGDATABASE: ${process.env.PGDATABASE}`);
  }

} catch (error) {
  console.error("Error configuring the database pool:", error);
  // Exit or handle critical failure if pool cannot be configured
  process.exit(1);
}


/**
 * Executes a SQL query using the connection pool.
 * @param {string} text The SQL query text.
 * @param {Array<any>} params The parameters for the SQL query.
 * @returns {Promise<object>} The query result object.
 * @throws {Error} If the query fails.
 */
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration: `${duration}ms`, rows: res.rowCount });
    return res;
  } catch (err) {
    console.error('Error executing query', { text, params });
    console.error(err); // Log the full error
    // Rethrow the error or handle it as per application's error handling strategy
    // It's often good to throw a more specific error or an error with a clear message
    const queryError = new Error(`Database query failed: ${err.message}`);
    // queryError.detail = err.detail; // if available
    // queryError.code = err.code; // if available
    throw queryError;
  }
};

/**
 * Tests the database connection by executing a simple query.
 * @returns {Promise<boolean>} True if connection is successful, false otherwise.
 */
const testConnection = async () => {
  try {
    await pool.query('SELECT NOW()'); // A simple query to test connection
    console.log('Database connection successful.');
    return true;
  } catch (err) {
    console.error('Database connection failed:', err.message);
    // console.error('Full error details:', err); // For more detailed debugging
    return false;
  }
};

// Optional: Test connection on module load (can be noisy, or moved to an init script)
// (async () => {
//   if (pool) { // ensure pool was initialized
//     await testConnection();
//   }
// })();

module.exports = {
  query,
  testConnection,
  pool // Exporting pool directly can be useful for transactions or specific pg features
};
