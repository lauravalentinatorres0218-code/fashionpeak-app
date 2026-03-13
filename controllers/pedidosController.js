/**
 * pedidosController.js
 * Controlador de pedidos — Fashion Peak
 * Maneja: crear pedido, listar todos, mis pedidos, actualizar estado
 */

const db = require('../config/db');

/**
 * CREAR PEDIDO — POST /api/pedidos
 * Crea un pedido y descuenta stock con transaccion MySQL
 */
async function crearPedido(req, res) {
  const conn = await db.getConnection();
  try {
    const { items } = req.body;
    if (!items || !items.length)
      return res.status(400).json({ ok: false, msg: 'Sin items' });

    // Calcular total del pedido
    const total = items.reduce((s, i) => s + Number(i.precio_unit) * i.cantidad, 0);
    const usuario_id = req.user ? req.user.id : null;

    // Iniciar transaccion para garantizar consistencia
    await conn.beginTransaction();

    // Insertar cabecera del pedido
    const [r] = await conn.execute(
      'INSERT INTO pedidos (usuario_id, total, estado) VALUES (?, ?, ?)',
      [usuario_id, total, 'confirmado']
    );
    const pedido_id = r.insertId;

    // Insertar items y descontar stock de cada producto
    for (const item of items) {
      await conn.execute(
        'INSERT INTO pedido_items (pedido_id, producto_id, cantidad, precio_unit) VALUES (?, ?, ?, ?)',
        [pedido_id, item.producto_id, item.cantidad, item.precio_unit]
      );
      await conn.execute(
        'UPDATE productos SET stock = stock - ? WHERE id = ? AND stock >= ?',
        [item.cantidad, item.producto_id, item.cantidad]
      );
    }

    await conn.commit();
    res.status(201).json({ ok: true, pedido_id });

  } catch (err) {
    // Si algo falla, revertir todos los cambios
    await conn.rollback();
    console.error('Error al crear pedido:', err);
    res.status(500).json({ ok: false, msg: 'Error al crear pedido' });
  } finally {
    conn.release();
  }
}

/**
 * LISTAR PEDIDOS — GET /api/pedidos
 * Solo admin — retorna todos los pedidos con info del cliente
 */
async function listarPedidos(req, res) {
  try {
    const sql = 'SELECT p.id, p.total, p.estado, p.created_at, u.nombre as cliente, u.email, COUNT(pi.id) as num_items FROM pedidos p LEFT JOIN usuarios u ON p.usuario_id = u.id LEFT JOIN pedido_items pi ON p.id = pi.pedido_id GROUP BY p.id ORDER BY p.created_at DESC';
    const [rows] = await db.execute(sql);
    res.json({ ok: true, data: rows });
  } catch (err) {
    res.status(500).json({ ok: false, msg: 'Error' });
  }
}

/**
 * MIS PEDIDOS — GET /api/pedidos/mis-pedidos
 * Cliente autenticado — retorna sus pedidos con detalle de items
 */
async function misPedidos(req, res) {
  try {
    const sql = 'SELECT p.id, p.total, p.estado, p.created_at, COUNT(pi.id) as num_items FROM pedidos p LEFT JOIN pedido_items pi ON p.id = pi.pedido_id WHERE p.usuario_id = ? GROUP BY p.id ORDER BY p.created_at DESC';
    const [rows] = await db.execute(sql, [req.user.id]);

    // Para cada pedido, obtener el detalle de sus items
    const pedidos = await Promise.all(rows.map(async ped => {
      const [items] = await db.execute(
        'SELECT pi.cantidad, pi.precio_unit, pr.nombre, pr.emoji FROM pedido_items pi LEFT JOIN productos pr ON pi.producto_id = pr.id WHERE pi.pedido_id = ?',
        [ped.id]
      );
      return { ...ped, items };
    }));

    res.json({ ok: true, data: pedidos });
  } catch (err) {
    res.status(500).json({ ok: false, msg: 'Error' });
  }
}

/**
 * ACTUALIZAR ESTADO — PUT /api/pedidos/:id/estado
 * Solo admin — cambia el estado de un pedido
 */
async function actualizarEstado(req, res) {
  try {
    const { estado } = req.body;
    const estados = ['pendiente', 'confirmado', 'enviado', 'entregado', 'cancelado'];

    if (!estados.includes(estado))
      return res.status(400).json({ ok: false, msg: 'Estado invalido' });

    await db.execute('UPDATE pedidos SET estado = ? WHERE id = ?', [estado, req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, msg: 'Error' });
  }
}

module.exports = { crearPedido, listarPedidos, misPedidos, actualizarEstado };
