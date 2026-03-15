const express = require('express');
const router = express.Router();
const { listarProductos, crearProducto, actualizarProducto, eliminarProducto } = require('../controllers/productosController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

router.get('/', listarProductos);
router.post('/', requireAuth, requireAdmin, crearProducto);
router.put('/:id', requireAuth, requireAdmin, actualizarProducto);
router.delete('/:id', requireAuth, requireAdmin, eliminarProducto);

module.exports = router;
