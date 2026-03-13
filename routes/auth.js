const express = require('express');
const router = express.Router();
const { login, logout, me, register, actualizarPerfil, cambiarPassword } = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');

router.post('/login', login);
router.post('/logout', logout);
router.post('/register', register);
router.get('/me', requireAuth, me);
router.put('/perfil', requireAuth, actualizarPerfil);
router.put('/password', requireAuth, cambiarPassword);

module.exports = router;
