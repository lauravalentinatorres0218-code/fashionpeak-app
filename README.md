# 👗 Fashion Peak — Tienda de Moda Online

> Proyecto de desarrollo web full stack — SENA Ficha 2977463  
> Análisis y Desarrollo de Software

---

## 📋 Descripción

Fashion Peak es una tienda de moda online completa con backend en Node.js y frontend en HTML/CSS/JS vanilla. Permite a los clientes explorar productos, agregar al carrito, realizar compras y gestionar su perfil. Los administradores pueden gestionar productos y pedidos desde un panel dedicado.

---

## 🚀 Tecnologías

| Capa | Tecnología |
|------|-----------|
| Backend | Node.js + Express.js |
| Base de datos | MySQL 8.0 |
| Autenticación | JWT + bcryptjs |
| Frontend | HTML5 + CSS3 + JavaScript vanilla |
| Tipografía | Cormorant Garamond + Outfit (Google Fonts) |
| Servidor dev | Nodemon |

---

## 📁 Estructura del proyecto

```
Fashionpeak-app/
├── server.js                  # Servidor Express principal
├── .env                       # Variables de entorno
├── package.json
├── fashionpeak_db.sql         # Script de base de datos
├── routes/
│   ├── auth.js                # Rutas de autenticación
│   ├── productos.js           # Rutas de productos
│   └── pedidos.js             # Rutas de pedidos
├── controllers/
│   ├── authController.js      # Lógica de autenticación
│   ├── productosController.js # Lógica de productos
│   └── pedidosController.js   # Lógica de pedidos
├── middleware/
│   └── auth.js                # Middleware JWT
├── config/
│   └── db.js                  # Conexión MySQL
└── frontend/
    ├── fashionpeak.html        # SPA principal
    └── assets/
        ├── css/
        │   └── main.css        # Estilos globales
        └── js/
            └── app.js          # Lógica del frontend
```

---

## ⚙️ Instalación y configuración

### 1. Requisitos previos
- Node.js v18 o superior
- MySQL 8.0
- npm

### 2. Clonar o descargar el proyecto
```bash
cd C:\Users\tu-usuario\Desktop
# Descomprimir o clonar el proyecto en Fashionpeak-app
```

### 3. Instalar dependencias
```bash
cd Fashionpeak-app
npm install
```

### 4. Configurar variables de entorno
Crear archivo `.env` en la raíz con:
```env
PORT=3000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_contraseña
DB_NAME=fashionpeak
JWT_SECRET=fashionpeak_secret_2025_jwt
JWT_EXPIRES=24h
SESSION_SECRET=fashionpeak_session_secret_2025
```

### 5. Crear la base de datos
Abrir MySQL Workbench y ejecutar el archivo `fashionpeak_db.sql` o correr el script SQL incluido en el proyecto.

### 6. Iniciar el servidor
```bash
npm run dev
```

Abrir en el navegador: `http://localhost:3000/fashionpeak.html`

---

## 🔐 Credenciales de prueba

| Rol | Email | Contraseña |
|-----|-------|------------|
| Administrador | admin@fashionpeak.com | password |
| Cliente | carlos@gmail.com | password |
| Cliente | laura@gmail.com | password |

---

## 🌐 API Endpoints

### Autenticación
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/login` | Iniciar sesión |
| POST | `/api/auth/logout` | Cerrar sesión |
| POST | `/api/auth/register` | Registrar usuario |
| GET | `/api/auth/me` | Usuario actual |
| PUT | `/api/auth/perfil` | Actualizar perfil |
| PUT | `/api/auth/password` | Cambiar contraseña |

### Productos
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/productos` | Listar productos |
| POST | `/api/productos` | Crear producto (admin) |
| PUT | `/api/productos/:id` | Actualizar producto (admin) |
| DELETE | `/api/productos/:id` | Eliminar producto (admin) |

### Pedidos
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/pedidos` | Crear pedido |
| GET | `/api/pedidos` | Listar todos (admin) |
| GET | `/api/pedidos/mis-pedidos` | Mis pedidos (cliente) |
| PUT | `/api/pedidos/:id/estado` | Actualizar estado (admin) |

---

## ✨ Funcionalidades

### Cliente
- ✅ Registro e inicio de sesión con JWT
- ✅ Catálogo con filtros por categoría y búsqueda
- ✅ Carrito de compras con envío gratis desde $200.000
- ✅ Confirmar compra con descuento de stock en tiempo real
- ✅ Historial de pedidos
- ✅ Favoritos (guardados en localStorage)
- ✅ Perfil — editar datos y cambiar contraseña

### Administrador
- ✅ CRUD completo de productos
- ✅ Gestión de pedidos con cambio de estado
- ✅ Dashboard con estadísticas

### General
- ✅ Diseño responsive (móvil y escritorio)
- ✅ Validaciones en todos los formularios
- ✅ Skeleton loading en catálogo
- ✅ Toast notifications
- ✅ Footer con información de contacto

---

## 👩‍💻 Desarrolladora

**Laura Valentina Torres Chaparro**  
Aprendiz SENA — Análisis y Desarrollo de Software  
Ficha: 2977463  

---

## 📄 Licencia

Proyecto académico — SENA 2025
