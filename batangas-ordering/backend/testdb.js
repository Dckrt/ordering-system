const { getConnection } = require('./db');

async function test() {
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute('SELECT 1+1 AS result FROM dual');
    console.log('✅ Oracle connected! Result:', result.rows);
  } catch (err) {
    console.error('❌ Connection failed:', err.message);
  } finally {
    if (conn) await conn.close();
  }
}

test();