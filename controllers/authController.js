/**
 * authController.js
 * Controlador de autenticacion — Fashion Peak
 * Maneja: login, registro, logout, perfil y cambio de contrasena
 */

const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/**
 * LOGIN — POST /api/auth/login
 * Verifica credenciales y retorna token JWT
 */
async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ ok: false, msg: 'Email y contrasena son requeridos' });
    const [rows] = await db.execute('SELECT * FROM usuarios WHERE email = ? AND activo = 1', [email]);
    if (!rows.length)
      return res.status(401).json({ ok: false, msg: 'Credenciales incorrectas' });
    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid)
      return res.status(401).json({ ok: false, msg: 'Credenciales incorrectas' });
    const token = jwt.sign(
      { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES }
    );
    res.cookie('token', token, { httpOnly: true, maxAge: 24*60*60*1000, sameSite: 'lax' });
    res.json({ ok: true, user: { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol }, token });
  } catch (err) {
    console.error('Error en login:', err);
    res.status(500).json({ ok: false, msg: 'Error del servidor' });
  }
}

/**
 * REGISTRO — POST /api/auth/register
 * Crea un nuevo usuario con contrasena encriptada
 */
async function register(req, res) {
  try {
    const { nombre, email, password } = req.body;
    if (!nombre || !email || !password)
      return res.status(400).json({ ok: false, msg: 'Todos los campos son requeridos' });
    const [exists] = await db.execute('SELECT id FROM usuarios WHERE email = ?', [email]);
    if (exists.length)
      return res.status(400).json({ ok: false, msg: 'Este correo ya esta registrado' });
    const hash = await bcrypt.hash(password, 10);
    await db.execute('INSERT INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, ?)', [nombre, email, hash, 'cliente']);
    res.status(201).json({ ok: true, msg: 'Cuenta creada exitosamente' });
  } catch (err) {
    console.error('Error en registro:', err);
    res.status(500).json({ ok: false, msg: 'Error al crear cuenta' });
  }
}

/**
 * LOGOUT — POST /api/auth/logout
 * Elimina la cookie del token
 */
function logout(req, res) {
  res.clearCookie('token');
  res.json({ ok: true });
}

/**
 * ME — GET /api/auth/me
 * Retorna los datos del usuario autenticado
 */
async function me(req, res) {
  try {
    const [rows] = await db.execute('SELECT id, nombre, email, rol FROM usuarios WHERE id = ?', [req.user.id]);
    if (!rows.length)
      return res.status(404).json({ ok: false, msg: 'Usuario no encontrado' });
    res.json({ ok: true, user: rows[0] });
  } catch (err) {
    res.status(500).json({ ok: false, msg: 'Error del servidor' });
  }
}

/**
 * ACTUALIZAR PERFIL — PUT /api/auth/perfil
 * Actualiza nombre y correo del usuario autenticado
 */
async function actualizarPerfil(req, res) {
  try {
    const { nombre, email } = req.body;
    if (!nombre || !email)
      return res.status(400).json({ ok: false, msg: 'Nombre y email requeridos' });
    const [exists] = await db.execute('SELECT id FROM usuarios WHERE email = ? AND id != ?', [email, req.user.id]);
    if (exists.length)
      return res.status(400).json({ ok: false, msg: 'Este correo ya esta en uso' });
    await db.execute('UPDATE usuarios SET nombre = ?, email = ? WHERE id = ?', [nombre, email, req.user.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, msg: 'Error al actualizar perfil' });
  }
}

/**
 * CAMBIAR CONTRASENA — PUT /api/auth/password
 * Valida contrasena actual y actualiza con la nueva encriptada
 */
async function cambiarPassword(req, res) {
  try {
    const { passwordActual, passwordNueva } = req.body;
    const [rows] = await db.execute('SELECT password FROM usuarios WHERE id = ?', [req.user.id]);
    if (!rows.length)
      return res.status(404).json({ ok: false, msg: 'Usuario no encontrado' });
    const valid = await bcrypt.compare(passwordActual, rows[0].password);
    if (!valid)
      return res.status(400).json({ ok: false, msg: 'La contrasena actual es incorrecta' });
    const hash = await bcrypt.hash(passwordNueva, 10);
    await db.execute('UPDATE usuarios SET password = ? WHERE id = ?', [hash, req.user.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, msg: 'Error al cambiar contrasena' });
  }
}

module.exports = { login, logout, me, register, actualizarPerfil, cambiarPassword };
