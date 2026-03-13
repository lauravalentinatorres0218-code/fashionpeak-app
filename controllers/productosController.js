/**
 * productosController.js
 * Controlador de productos — Fashion Peak
 * Maneja: listar, crear, actualizar y eliminar productos
 */

const db = require('../config/db');

/**
 * LISTAR PRODUCTOS — GET /api/productos
 * Publico — soporta filtros por categoria y busqueda por nombre
 */
async function listarProductos(req, res) {
  try {
    const { categoria, q } = req.query;
    let sql = 'SELECT * FROM productos WHERE activo = 1';
    const params = [];

    // Filtrar por categoria si se envia
    if (categoria) {
      sql += ' AND categoria = ?';
      params.push(categoria);
    }

    // Buscar por nombre si se envia termino de busqueda
    if (q) {
      sql += ' AND nombre LIKE ?';
      params.push('%' + q + '%');
    }

    sql += ' ORDER BY created_at DESC';
    const [rows] = await db.execute(sql, params);
    res.json({ ok: true, data: rows });

  } catch (err) {
    console.error('Error al listar productos:', err);
    res.status(500).json({ ok: false, msg: 'Error al obtener productos' });
  }
}

/**
 * CREAR PRODUCTO — POST /api/productos
 * Solo admin — agrega un nuevo producto al catalogo
 */
async function crearProducto(req, res) {
  try {
    const { nombre, descripcion, categoria, precio, stock, emoji } = req.body;

    // Validar campos requeridos
    if (!nombre || !categoria || !precio)
      return res.status(400).json({ ok: false, msg: 'Nombre, categoria y precio son requeridos' });

    if (precio <= 0)
      return res.status(400).json({ ok: false, msg: 'El precio debe ser mayor a 0' });

    if (stock < 0)
      return res.status(400).json({ ok: false, msg: 'El stock no puede ser negativo' });

    await db.execute(
      'INSERT INTO productos (nombre, descripcion, categoria, precio, stock, emoji) VALUES (?, ?, ?, ?, ?, ?)',
      [nombre, descripcion || '', categoria, precio, stock || 0, emoji || '👕']
    );

    res.status(201).json({ ok: true, msg: 'Producto creado' });

  } catch (err) {
    console.error('Error al crear producto:', err);
    res.status(500).json({ ok: false, msg: 'Error al crear producto' });
  }
}

/**
 * ACTUALIZAR PRODUCTO — PUT /api/productos/:id
 * Solo admin — modifica los datos de un producto existente
 */
async function actualizarProducto(req, res) {
  try {
    const { nombre, descripcion, categoria, precio, stock, emoji } = req.body;

    // Validar que el producto exista
    const [exists] = await db.execute('SELECT id FROM productos WHERE id = ? AND activo = 1', [req.params.id]);
    if (!exists.length)
      return res.status(404).json({ ok: false, msg: 'Producto no encontrado' });

    await db.execute(
      'UPDATE productos SET nombre=?, descripcion=?, categoria=?, precio=?, stock=?, emoji=?, updated_at=NOW() WHERE id=?',
      [nombre, descripcion || '', categoria, precio, stock, emoji || '👕', req.params.id]
    );

    res.json({ ok: true, msg: 'Producto actualizado' });

  } catch (err) {
    console.error('Error al actualizar producto:', err);
    res.status(500).json({ ok: false, msg: 'Error al actualizar producto' });
  }
}

/**
 * ELIMINAR PRODUCTO — DELETE /api/productos/:id
 * Solo admin — hace soft delete (activo = 0), no borra fisicamente
 */
async function eliminarProducto(req, res) {
  try {
    const [exists] = await db.execute('SELECT id FROM productos WHERE id = ? AND activo = 1', [req.params.id]);
    if (!exists.length)
      return res.status(404).json({ ok: false, msg: 'Producto no encontrado' });

    // Soft delete: marcar como inactivo en vez de borrar
    await db.execute('UPDATE productos SET activo = 0 WHERE id = ?', [req.params.id]);
    res.json({ ok: true, msg: 'Producto eliminado' });

  } catch (err) {
    console.error('Error al eliminar producto:', err);
    res.status(500).json({ ok: false, msg: 'Error al eliminar producto' });
  }
}

module.exports = { listarProductos, crearProducto, actualizarProducto, eliminarProducto };
