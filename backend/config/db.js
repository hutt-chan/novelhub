const mysql = require("mysql2/promise");
require("dotenv").config();

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

let cachedConnection = null;

async function connectDB() {
  // if (cachedConnection && cachedConnection.connection && cachedConnection.connection.state !== 'disconnected') {
  //     return cachedConnection;
  // }
  cachedConnection = await mysql.createConnection(dbConfig);
  return cachedConnection;
}

module.exports = { connectDB };
