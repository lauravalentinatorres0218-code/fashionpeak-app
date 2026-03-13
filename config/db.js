/**
 * config/db.js
 * Configuracion de conexion a MySQL — Fashion Peak
 * Usa pool de conexiones para mejor rendimiento
 */

const mysql = require('mysql2/promise');

// Crear pool de conexiones con variables de entorno
const pool = mysql.createPool({
  host:     process.env.DB_HOST || 'localhost',
  port:     process.env.DB_PORT || 3306,
  user:     process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'fashionpeak',
  waitForConnections: true,
  connectionLimit: 10,    // Maximo 10 conexiones simultaneas
  queueLimit: 0
});

// Verificar conexion al iniciar el servidor
pool.getConnection()
  .then(conn => {
    console.log('✅  MySQL conectado —', process.env.DB_NAME);
    conn.release();
  })
  .catch(err => {
    console.error('❌  Error conectando a MySQL:', err.message);
  });

module.exports = pool;
