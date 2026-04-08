const oracledb = require('oracledb');

const dbConfig = {
  user: process.env.DB_USER || 'batangas_user',
  password: process.env.DB_PASS || 'yourpassword',
  connectString: process.env.DB_STRING || 'localhost/XEPDB1'
};

async function getConnection() {
  return await oracledb.getConnection(dbConfig);
}

module.exports = { getConnection };