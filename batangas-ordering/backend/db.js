const oracledb = require('oracledb');
require('dotenv').config();

// Initialize Oracle Instant Client
oracledb.initOracleClient({
  libDir: 'C:\\Users\\Lito\\Downloads\\instantclient-basic-windows.x64-23.26.1.0.0\\instantclient_23_26'
});

const dbConfig = {
  user: process.env.DB_USER || 'batangas',
  password: process.env.DB_PASS || 'batangas123',
  connectString: process.env.DB_STRING || 'localhost:1521/xe'
};

async function getConnection() {
  return await oracledb.getConnection(dbConfig);
}

module.exports = { getConnection };