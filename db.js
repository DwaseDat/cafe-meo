// db.js - shared SQL Server connection pool used by BOTH websites
const sql = require('mssql');

const config = {
  server: 'DWASE\\CE201135',          // <-- e.g. 'localhost' or 'DWASE\\CE201135' for a named instance
  database: 'coffee_cat_shop',
  user: 'Dat',                   // <-- change to your SQL Server login
  password: '123456zZ@',     // <-- change to your SQL Server password
  options: {
    encrypt: false,              // true if using Azure
    trustServerCertificate: true // needed for local dev
  },
  port: 1433
};

// If you're using Windows Authentication instead of SQL login, replace the
// config above with:
//
// const config = {
//   server: 'localhost\\CE201135',
//   database: 'coffee_cat_shop',
//   options: { encrypt: false, trustServerCertificate: true, trustedConnection: true },
//   driver: 'msnodesqlv8'
// };
// (also run: npm install msnodesqlv8)

const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then(pool => {
    console.log('Connected to SQL Server');
    return pool;
  })
  .catch(err => console.error('Database connection failed:', err));

module.exports = { sql, poolPromise };
