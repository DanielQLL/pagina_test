// --- 1. Importar las librerías ---
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');

// --- 2. Configurar el servidor ---
const app = express();
app.use(express.json()); // Permite que el servidor entienda JSON
app.use(cors());         // Permite conexiones de otros dominios (el frontend)
// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, 'cafeteria-frontend')));
const PORT = process.env.PORT || 15203;       // El puerto donde correrá el backend (usa PORT de env en la nube)

// --- 3. Configurar la conexión a la Base de Datos ---
const db = mysql.createConnection({
    host: 'mysql-f96f28f-josuedaniel701-82d1.l.aivencloud.com',
    port: 15203,
    user: 'avnadmin',         // Usuario por defecto de XAMPP/MySQL
    password: 'AVNS_PBCS4ponsFSxz8qSUNQ',         // Contraseña por defecto de XAMPP es vacía
    database: 'defaultdb'
});

db.connect(err => {
    if (err) {
        console.error('Error al conectar a la DB:', err);
        return;
    }
    console.log('Conectado exitosamente a la base de datos defaultdb');
});

// --- 4. Crear las Rutas (Endpoints) ---

// Esta es tu primera ruta, basada en tu "Diagrama de caso de uso para Autenticación"
app.post('/api/login', (req, res) => {
    const { usuario, contrasena } = req.body;

    console.log('Intento de login con:', usuario);

    // --- PASO 1: Buscar en Administrador ---
    const queryAdmin = 'SELECT * FROM Administrador WHERE usuario = ?';
    db.query(queryAdmin, [usuario], (err, adminResults) => {
        if (err) {
            console.error('Error en query Admin:', err);
            return res.status(500).send('Error en el servidor');
        }

        if (adminResults.length > 0) {
            // Usuario encontrado en Admin
            const admin = adminResults[0];
            if (contrasena === admin.contrasena_hash) { // (Seguimos con texto plano por ahora)
                console.log('Login exitoso para admin:', usuario);
                return res.status(200).json({ mensaje: 'Login exitoso', rol: 'Administrador' });
            } else {
                return res.status(401).send('Usuario o contraseña incorrectos');
            }
        }

        // --- PASO 2: Si no es Admin, buscar en Cajero ---
 const queryCajero = 'SELECT * FROM Cajero WHERE usuario = ?';
        db.query(queryCajero, [usuario], (err, cajeroResults) => {
            if (err) { /* ... tu error ... */ }

            if (cajeroResults.length > 0) {
                // Usuario encontrado en Cajero
                const cajero = cajeroResults[0];
                if (contrasena === cajero.contrasena_hash) {
                    console.log('Login exitoso para cajero:', usuario);
                    // --- ESTA ES LA LÍNEA MODIFICADA ---
                    return res.status(200).json({ 
                        mensaje: 'Login exitoso', 
                        rol: 'Cajero',
                        id: cajero.id_cajero, // Enviamos el ID del cajero
                        usuario: cajero.usuario
                    });
                } else {
                    return res.status(401).send('Usuario o contraseña incorrectos');
                }
            }
            
            // --- PASO 3: Si no es Admin ni Cajero, buscar en Cliente ---
            // (Aún no implementamos el login de cliente, pero dejamos la lógica)
const queryCliente = 'SELECT * FROM Cliente WHERE usuario = ?';
            db.query(queryCliente, [usuario], (err, clienteResults) => {
                if (err) {
                    // ... (tu código de error)
                }

                if (clienteResults.length > 0) {
                    // Usuario encontrado en Cliente
                    const cliente = clienteResults[0];
                    if (contrasena === cliente.contrasena_hash) {
                        console.log('Login exitoso para cliente:', usuario);
                        // --- ESTA ES LA LÍNEA MODIFICADA ---
                        return res.status(200).json({ 
                            mensaje: 'Login exitoso', 
                            rol: 'Cliente',
                            id: cliente.id_cliente, // Enviamos el ID
                            usuario: cliente.usuario // Enviamos el nombre de usuario
                        });
                    } else {
                        return res.status(401).send('Usuario o contraseña incorrectos');
                    }
                }

                // --- PASO 4: Si no está en ninguna tabla ---
                console.log('Usuario no encontrado en ninguna tabla:', usuario);
                return res.status(401).send('Usuario o contraseña incorrectos');
            });
        });
    });
});


// --- 4. Crear las Rutas (Endpoints) ---


// --- LEER TODOS los productos (READ) ---
app.get('/api/productos', (req, res) => {
    const query = 'SELECT * FROM Producto';
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error al obtener productos:', err);
            return res.status(500).send('Error en el servidor');
        }
        res.status(200).json(results);
    });
});

// --- LEER UN SOLO producto por ID (Para el botón Editar) ---
app.get('/api/productos/:id', (req, res) => {
    const { id } = req.params;
    const query = 'SELECT * FROM Producto WHERE id_producto = ?';
    
    db.query(query, [id], (err, results) => {
        if (err) {
            console.error('Error al obtener producto:', err);
            return res.status(500).send('Error en el servidor');
        }
        if (results.length === 0) {
            return res.status(404).send('Producto no encontrado');
        }
        res.status(200).json(results[0]);
    });
});

// --- CREAR un nuevo producto (CREATE - RF02) ---
app.post('/api/productos', (req, res) => {
    const { nombre, categoria, precio, stock } = req.body;
    
    const query = 'INSERT INTO Producto (nombre, categoria, precio, stock) VALUES (?, ?, ?, ?)';
    
    db.query(query, [nombre, categoria, precio, stock], (err, result) => {
        if (err) {
            console.error('Error al registrar producto:', err);
            return res.status(500).send('Error en el servidor');
        }
        res.status(201).json({ 
            mensaje: 'Producto registrado', 
            id: result.insertId 
        });
    });
});

// --- ACTUALIZAR un producto (UPDATE - RF03) ---
// (No lo conectamos en el JS de arriba, pero la ruta ya está lista para cuando la necesites)
app.put('/api/productos/:id', (req, res) => {
    const { id } = req.params;
    const { nombre, categoria, precio, stock } = req.body;
    
    const query = 'UPDATE Producto SET nombre = ?, categoria = ?, precio = ?, stock = ? WHERE id_producto = ?';
    
    db.query(query, [nombre, categoria, precio, stock, id], (err, result) => {
        if (err) {
            console.error('Error al actualizar producto:', err);
            return res.status(500).send('Error en el servidor');
        }
        if (result.affectedRows === 0) {
            return res.status(404).send('Producto no encontrado');
        }
        res.status(200).send('Producto actualizado correctamente');
    });
});

// --- ELIMINAR un producto (DELETE - RF03) ---
app.delete('/api/productos/:id', (req, res) => {
    const { id } = req.params;
    
    const query = 'DELETE FROM Producto WHERE id_producto = ?';
    
    db.query(query, [id], (err, result) => {
        if (err) {
            console.error('Error al eliminar producto:', err);
            return res.status(500).send('Error en el servidor');
        }
        if (result.affectedRows === 0) {
            return res.status(404).send('Producto no encontrado');
        }
        res.status(200).send('Producto eliminado correctamente');
    });
});



app.get('/api/reportes/ventas', (req, res) => {
    
    // Esta consulta es compleja: une Pedidos, Detalles, Productos y Cajeros
    // para dar un reporte completo de qué se vendió y quién lo vendió.
    const query = `
        SELECT 
            p.id_pedido,
            p.fecha,
            pr.nombre AS producto_nombre,
            dp.cantidad,
            dp.subtotal,
            c.usuario AS cajero_usuario
        FROM Pedido p
        JOIN DetallePedido dp ON p.id_pedido = dp.id_pedido
        JOIN Producto pr ON dp.id_producto = pr.id_producto
        LEFT JOIN Cajero c ON p.id_cajero = c.id_cajero
        ORDER BY p.fecha DESC;
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error('Error al generar reporte de ventas:', err);
            return res.status(500).send('Error en el servidor');
        }
        res.status(200).json(results);
    });
});


app.post('/api/pedidos', (req, res) => {
    // AHORA ACEPTAMOS 'id_cliente'
    const { total, id_cajero, id_cliente, items } = req.body; 

    if (!items || items.length === 0) {
        return res.status(400).send('No se puede registrar un pedido vacío.');
    }

    db.beginTransaction(err => {
        if (err) { /* ... (manejo de error) ... */ }

        // --- PASO 1: Insertar en la tabla Pedido ---
        // La query ahora incluye los dos campos de ID
        const queryPedido = 'INSERT INTO Pedido (fecha, estado, total, id_cajero, id_cliente) VALUES (NOW(), ?, ?, ?, ?)';
        const estadoPedido = id_cajero ? 'Completado' : 'Pendiente'; // Pedidos de cajero se completan, de cliente quedan pendientes

        // Pasamos 'null' si el ID no viene
        db.query(queryPedido, [estadoPedido, total, id_cajero || null, id_cliente || null], (err, resultPedido) => {
            if (err) {
                console.error('Error en PASO 1 (Insertar Pedido):', err);
                return db.rollback(() => {
                    res.status(500).send('Error al registrar el pedido');
                });
            }

            const idPedidoNuevo = resultPedido.insertId;

            // --- PASO 2: Preparar los inserts para DetallePedido ---
            const queryDetalle = 'INSERT INTO DetallePedido (id_pedido, id_producto, cantidad, subtotal) VALUES ?';
            const valoresDetalle = items.map(item => [
                idPedidoNuevo,
                item.id,
                item.cantidad,
                item.precio * item.cantidad
            ]);

            db.query(queryDetalle, [valoresDetalle], (err, resultDetalle) => {
                if (err) {
                    console.error('Error en PASO 2 (Insertar Detalle):', err);
                    return db.rollback(() => {
                        res.status(500).send('Error al registrar los detalles del pedido');
                    });
                }

                // --- PASO 3: Actualizar el Stock de cada producto ---
                // (Este es el paso más complejo, lo hacemos con un bucle)
                
                let stockError = false;
                const updatePromises = items.map(item => {
                    return new Promise((resolve, reject) => {
                        const queryStock = 'UPDATE Producto SET stock = stock - ? WHERE id_producto = ? AND stock >= ?';
                        db.query(queryStock, [item.cantidad, item.id, item.cantidad], (err, resultStock) => {
                            if (err) {
                                reject(err); // Error de SQL
                            } else if (resultStock.affectedRows === 0) {
                                // ¡Importante! Si affectedRows es 0, significa que no había stock suficiente
                                reject(new Error(`Stock insuficiente para el producto ID ${item.id}`));
                            } else {
                                resolve();
                            }
                        });
                    });
                });

                Promise.all(updatePromises)
                    .then(() => {
                        // --- PASO 4: ¡ÉXITO! Confirmar la transacción ---
                        db.commit(err => {
                            if (err) {
                                console.error('Error al hacer COMMIT:', err);
                                return db.rollback(() => {
                                    res.status(500).send('Error al confirmar la transacción');
                                });
                            }
                            // RF08 (Emitir comprobante) se manejaría aquí.
                            // Por ahora, solo enviamos éxito.
                            res.status(201).json({ 
                                mensaje: 'Venta registrada exitosamente', 
                                id_pedido: idPedidoNuevo 
                            });
                        });
                    })
                    .catch(error => {
                        // Si algo falló en el Promise.all (ej: falta de stock)
                        console.error('Error en PASO 3 (Actualizar Stock):', error.message);
                        return db.rollback(() => {
                            res.status(400).send(error.message); // Enviar el mensaje de error (ej: "Stock insuficiente")
                        });
                    });
            });
        });
    });
});


app.post('/api/clientes/registro', (req, res) => {
    const { nombre, apellido, correo, telefono, usuario, contrasena } = req.body;

    // *** NOTA DE SEGURIDAD ***
    // ¡Aquí es donde deberías "hashear" la contraseña!
    // const hash = bcrypt.hashSync(contrasena, 10);
    // Y guardar el 'hash', no la 'contrasena'.
    // Por ahora, seguimos con texto plano para mantenerlo simple.
    const contrasena_hash_plana = contrasena; 

    const query = `
        INSERT INTO Cliente 
        (nombre, apellido, correo, telefono, usuario, contrasena_hash) 
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    db.query(query, [nombre, apellido, correo, telefono, usuario, contrasena_hash_plana], (err, result) => {
        if (err) {
            console.error('Error al registrar cliente:', err);
            // Manejar error de "ya existe" (UNIQUE)
            if (err.code === 'ER_DUP_ENTRY') {
                if (err.message.includes('correo')) {
                    return res.status(400).send('El correo electrónico ya está registrado.');
                }
                if (err.message.includes('usuario')) {
                    return res.status(400).send('El nombre de usuario ya existe.');
                }
            }
            return res.status(500).send('Error en el servidor al crear la cuenta.');
        }

        // Éxito
        res.status(201).json({ mensaje: 'Cliente registrado con éxito', id: result.insertId });
    });
});


app.get('/api/pedidos/historial/:id', (req, res) => {
    const idCliente = req.params.id;

    // Esta consulta busca todos los pedidos y sus detalles para un cliente
    const query = `
        SELECT 
            p.id_pedido,
            p.fecha,
            p.estado,
            p.total,
            GROUP_CONCAT(pr.nombre SEPARATOR ', ') AS productos
        FROM Pedido p
        JOIN DetallePedido dp ON p.id_pedido = dp.id_pedido
        JOIN Producto pr ON dp.id_producto = pr.id_producto
        WHERE p.id_cliente = ?
        GROUP BY p.id_pedido
        ORDER BY p.fecha DESC;
    `;

    db.query(query, [idCliente], (err, results) => {
        if (err) {
            console.error('Error al obtener historial:', err);
            return res.status(500).send('Error en el servidor');
        }
        res.status(200).json(results);
    });
});



app.get('/api/pedidos/pendientes', (req, res) => {
    
    // Unimos Pedido con Cliente para saber quién lo hizo
    const query = `
        SELECT 
            p.id_pedido,
            p.fecha,
            p.total,
            p.estado,
            c.nombre,
            c.apellido
        FROM Pedido p
        JOIN Cliente c ON p.id_cliente = c.id_cliente
        WHERE p.estado = 'Pendiente'
        ORDER BY p.fecha ASC;
    `; // ASC = Los más antiguos primero

    db.query(query, (err, results) => {
        if (err) {
            console.error('Error al obtener pedidos pendientes:', err);
            return res.status(500).send('Error en el servidor');
        }
        res.status(200).json(results);
    });
});

// --- ACTUALIZAR un pedido a 'Completado' ---
app.put('/api/pedidos/completar/:id', (req, res) => {
    const idPedido = req.params.id;

    const query = "UPDATE Pedido SET estado = 'Completado' WHERE id_pedido = ?";
    
    db.query(query, [idPedido], (err, result) => {
        if (err) {
            console.error('Error al completar pedido:', err);
            return res.status(500).send('Error en el servidor');
        }
        if (result.affectedRows === 0) {
            return res.status(404).send('Pedido no encontrado');
        }
        res.status(200).send('Pedido marcado como completado');
    });
});


app.post('/api/reportes/log', (req, res) => {
    // Recibimos los datos que nos manda el frontend
    const { tipo, formato, ruta_archivo } = req.body;

    const query = `
        INSERT INTO Reporte 
        (tipo, fecha_generacion, formato, ruta_archivo) 
        VALUES (?, NOW(), ?, ?)
    `;

    db.query(query, [tipo, formato, ruta_archivo], (err, result) => {
        if (err) {
            console.error('Error al loggear el reporte:', err);
            // No detenemos al usuario por esto, solo loggeamos el error
            return res.status(500).send('Error al guardar registro del reporte');
        }
        
        // Enviamos éxito, pero el frontend no necesita esperar por esto
        res.status(201).json({ mensaje: 'Reporte loggeado', id: result.insertId });
    });
});

// --- 5. Iniciar el servidor ---
// Fallback para rutas del frontend (Single Page App)
app.get('*', (req, res) => {
    const indexPath = path.join(__dirname, 'cafeteria-frontend', 'index.html');
    res.sendFile(indexPath, err => {
        if (err) res.status(404).send('Not found');
    });
});
app.listen(PORT, () => {
    console.log(`Servidor backend corriendo en el puerto ${PORT}`);
});
