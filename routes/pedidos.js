const express = require('express');
const router = express.Router();
const { crearPedido, listarPedidos, misPedidos, actualizarEstado } = require('../controllers/pedidosController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

router.post('/', requireAuth, crearPedido);
router.get('/', requireAuth, requireAdmin, listarPedidos);
router.get('/mis-pedidos', requireAuth, misPedidos);
router.put('/:id/estado', requireAuth, requireAdmin, actualizarEstado);

module.exports = router;
