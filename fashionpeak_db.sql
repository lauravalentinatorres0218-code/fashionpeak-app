-- ============================================================
-- FASHION PEAK — Base de datos completa
-- MySQL 8.0+
-- ============================================================

DROP DATABASE IF EXISTS fashionpeak;
CREATE DATABASE fashionpeak CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE fashionpeak;

-- ── USUARIOS ──────────────────────────────────────────────
CREATE TABLE usuarios (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  nombre     VARCHAR(100) NOT NULL,
  email      VARCHAR(150) NOT NULL UNIQUE,
  password   VARCHAR(255) NOT NULL,
  rol        ENUM('admin','cliente') DEFAULT 'cliente',
  activo     TINYINT(1) DEFAULT 1,
  creado_en  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── PRODUCTOS ─────────────────────────────────────────────
CREATE TABLE productos (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  nombre      VARCHAR(200) NOT NULL,
  descripcion TEXT,
  categoria   ENUM('MUJER','HOMBRE','ACCESORIOS') NOT NULL,
  precio      DECIMAL(10,2) NOT NULL,
  stock       INT NOT NULL DEFAULT 0,
  emoji       VARCHAR(10) DEFAULT '👕',
  imagen_url  VARCHAR(300),
  activo      TINYINT(1) DEFAULT 1,
  creado_en   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ── CARRITO ───────────────────────────────────────────────
CREATE TABLE carrito (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id  INT NOT NULL,
  producto_id INT NOT NULL,
  cantidad    INT NOT NULL DEFAULT 1,
  agregado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id)  REFERENCES usuarios(id)  ON DELETE CASCADE,
  FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE,
  UNIQUE KEY uk_carrito (usuario_id, producto_id)
);

-- ── PEDIDOS ───────────────────────────────────────────────
CREATE TABLE pedidos (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id   INT NOT NULL,
  total        DECIMAL(10,2) NOT NULL,
  estado       ENUM('pendiente','procesando','enviado','entregado','cancelado') DEFAULT 'pendiente',
  creado_en    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

CREATE TABLE pedido_items (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  pedido_id   INT NOT NULL,
  producto_id INT NOT NULL,
  cantidad    INT NOT NULL,
  precio_unit DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (pedido_id)   REFERENCES pedidos(id)  ON DELETE CASCADE,
  FOREIGN KEY (producto_id) REFERENCES productos(id)
);

-- ============================================================
-- DATOS INICIALES
-- ============================================================

-- Usuarios (password = bcrypt de "admin123" y "cliente123")
INSERT INTO usuarios (nombre, email, password, rol) VALUES
  ('Administrador',     'admin@fashionpeak.com',  '$2a$10$abcdefghijklmnopqrstuuVwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ12', 'admin'),
  ('Carlos Martínez',   'carlos@gmail.com',        '$2a$10$abcdefghijklmnopqrstuuVwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ34', 'cliente'),
  ('Laura Torres',      'laura@gmail.com',         '$2a$10$abcdefghijklmnopqrstuuVwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ56', 'cliente');

-- Productos
INSERT INTO productos (nombre, descripcion, categoria, precio, stock, emoji) VALUES
  ('Camiseta en punto Slim Fit',   'Camiseta ajustada de punto premium, perfecta para el día a día.',          'MUJER',  32005.00, 13, '👕'),
  ('Jean Skinny Azul',             'Jean de corte skinny en denim azul lavado, tiro medio.',                   'MUJER',  82000.00,  8, '👖'),
  ('Vestido verano floral',        'Vestido ligero con estampado floral, ideal para temporada cálida.',        'MUJER',  46000.00,  5, '👗'),
  ('Camiseta base cuello redondo', 'Básica de algodón peinado, cuello redondo, múltiples colores.',            'MUJER',  32005.00, 20, '👕'),
  ('Camiseta recta de lino',       'Camiseta holgada en lino natural, fresca y transpirable.',                 'HOMBRE', 33005.00, 10, '👕'),
  ('Camiseta larga de algodón',    'Camiseta de manga larga en algodón suave, corte regular.',                 'HOMBRE', 57905.00,  7, '👕'),
  ('Pantalón cargo',               'Pantalón cargo con múltiples bolsillos, tela resistente.',                 'HOMBRE', 88900.00, 15, '👖'),
  ('Hoodie cuello redondo',        'Sudadera con capucha en felpa suave, bolsillo canguro.',                   'HOMBRE', 59900.00,  9, '🧥'),
  ('Blazer Estructurado',          'Blazer de corte moderno en tela texturizada, forro interior.',             'MUJER', 145000.00,  6, '🧥'),
  ('Pantalón en Sarga',            'Pantalón clásico en sarga, corte recto, muy versátil.',                   'MUJER',  99900.00,  8, '👖'),
  ('Camiseta loose fit',           'Camiseta oversized de algodón, estilo urbano y cómodo.',                  'HOMBRE', 35900.00, 12, '👕'),
  ('Camiseta mezcla de lino',      'Camiseta en mezcla lino-algodón, textura premium.',                       'HOMBRE', 89500.00,  5, '👕');
