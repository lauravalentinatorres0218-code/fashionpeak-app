/**
 * middleware/auth.js
 * Middleware de autenticacion JWT — Fashion Peak
 * Protege rutas que requieren sesion iniciada
 */

const jwt = require('jsonwebtoken');

/**
 * requireAuth
 * Verifica que el request tenga un token JWT valido
 * El token puede venir en cookie o en header Authorization
 */
function requireAuth(req, res, next) {
  try {
    // Buscar token en cookie o en header
    const token = req.cookies.token ||
      (req.headers.authorization && req.headers.authorization.split(' ')[1]);

    if (!token)
      return res.status(401).json({ ok: false, msg: 'No autorizado — inicia sesion' });

    // Verificar y decodificar el token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Guardar datos del usuario en el request
    next();

  } catch (err) {
    return res.status(401).json({ ok: false, msg: 'Token invalido o expirado' });
  }
}

/**
 * requireAdmin
 * Verifica que el usuario autenticado tenga rol de admin
 * Debe usarse despues de requireAuth
 */
function requireAdmin(req, res, next) {
  if (!req.user || req.user.rol !== 'admin')
    return res.status(403).json({ ok: false, msg: 'Acceso denegado — se requiere rol admin' });
  next();
}

/**
 * optionalAuth
 * Intenta autenticar pero no bloquea si no hay token
 * Util para rutas que funcionan con o sin sesion
 */
function optionalAuth(req, res, next) {
  try {
    const token = req.cookies.token ||
      (req.headers.authorization && req.headers.authorization.split(' ')[1]);
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
    }
  } catch {}
  next();
}

module.exports = { requireAuth, requireAdmin, optionalAuth };
