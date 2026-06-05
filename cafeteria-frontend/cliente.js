// Función global de navegación visual (UI) para que funcione con los onclick del HTML
window.switchSection = function(sectionId, btnElement) {
    document.querySelectorAll('.page-section').forEach(sec => sec.classList.remove('active'));
    document.getElementById(sectionId + '-section').classList.add('active');
    
    if(btnElement) {
        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
        btnElement.classList.add('active');
    }
};

document.addEventListener('DOMContentLoaded', () => {
    // --- AUTENTICACIÓN ---
    const clienteId = localStorage.getItem('cliente_id');
    const clienteUsuario = localStorage.getItem('cliente_usuario');

    if (!clienteId) {
        alert('Debes iniciar sesión para ver esta página.');
        window.location.href = 'index.html'; // Redirige al login si no hay sesión
        return;
    }
    
    const userDisplay = document.getElementById('username-display');
    if(userDisplay) userDisplay.textContent = clienteUsuario;

    // --- REFERENCIAS DOM ---
    const productGrid = document.getElementById('product-list');
    const cartItemsList = document.getElementById('cart-items');
    const emptyCartMsg = document.getElementById('empty-cart-msg');
    const totalPriceEl = document.getElementById('total-price');
    const processPaymentBtn = document.getElementById('process-payment-btn');
    const clearCartBtn = document.getElementById('clear-cart-btn');
    const historyTableBody = document.getElementById('history-table-body');
    const logoutLink = document.getElementById('logout-link');

    const navPedido = document.getElementById('nav-pedido');
    const navHistorial = document.getElementById('nav-historial');

    // --- URLs API ---
    // Asegúrate de que tu backend esté corriendo en este puerto
    const API_PRODUCTOS_URL = 'http://localhost:3001/api/productos';
    const API_PEDIDOS_URL = 'http://localhost:3001/api/pedidos';
    const API_HISTORIAL_URL = `http://localhost:3001/api/pedidos/historial/${clienteId}`;

    // --- ESTADO ---
    let carrito = []; 
    let productosDisponibles = [];

    // --- EVENT LISTENERS ESPECÍFICOS DE TU LÓGICA ---
    if(navHistorial) navHistorial.addEventListener('click', cargarHistorial);

    if(logoutLink) logoutLink.addEventListener('click', (e) => {
        e.preventDefault();
        if(confirm("¿Cerrar sesión?")) {
            localStorage.removeItem('cliente_id');
            localStorage.removeItem('cliente_usuario');
            window.location.href = 'index.html'; // Redirigir al login
        }
    });

    // --- CARGAR PRODUCTOS ---
    async function cargarProductos() {
        try {
            const response = await fetch(API_PRODUCTOS_URL);
            if (!response.ok) throw new Error("Error API");
            productosDisponibles = await response.json();
            renderizarProductos();
        } catch (error) { 
            console.error("Error al conectar con el servidor:", error);
            // Mensaje visual de error si falla la API
            if(productGrid) {
                productGrid.innerHTML = `
                    <div style="grid-column: 1/-1; text-align: center; color: #ff7675;">
                        <i class="fas fa-exclamation-triangle"></i> No se pudieron cargar los productos.
                        <br><small>Verifica que el servidor (puerto 3001) esté encendido.</small>
                    </div>`;
            }
        }
    }

    function renderizarProductos() {
        if(!productGrid) return;
        productGrid.innerHTML = '';
        
        productosDisponibles.forEach(producto => {
            if (producto.stock <= 0) return;
            
            const card = document.createElement('div');
            card.className = 'product-card';
            card.setAttribute('data-id', producto.id_producto);
            
            // Renderizado HTML adaptado al diseño Moderno
            card.innerHTML = `
                <div class="product-icon"><i class="fas fa-mug-hot"></i></div>
                <h4 style="font-size: 1.1rem; margin-bottom: 0.5rem;">${producto.nombre}</h4>
                <span style="color: var(--primary-orange); font-weight: bold; font-size: 1.2rem;">S/ ${parseFloat(producto.precio).toFixed(2)}</span>
                <div style="font-size:0.8rem; color:#aaa; margin:5px 0;">Stock: ${producto.stock}</div>
                <button class="add-btn">Agregar</button>
            `;
            
            card.addEventListener('click', () => agregarAlCarrito(producto));
            productGrid.appendChild(card);
        });
    }

    // --- LÓGICA CARRITO ---
    function agregarAlCarrito(producto) {
        const itemExistente = carrito.find(item => item.id === producto.id_producto);
        if (itemExistente) {
            const stockProducto = productosDisponibles.find(p => p.id_producto === producto.id_producto).stock;
            if(itemExistente.cantidad < stockProducto) itemExistente.cantidad++;
            else return alert('No hay más stock disponible.');
        } else {
            carrito.push({ id: producto.id_producto, nombre: producto.nombre, precio: producto.precio, cantidad: 1 });
        }
        renderizarCarrito();
    }

    function quitarDelCarrito(id) {
        const itemIndex = carrito.findIndex(item => item.id === id);
        if (itemIndex > -1) {
            if (carrito[itemIndex].cantidad > 1) carrito[itemIndex].cantidad--;
            else carrito.splice(itemIndex, 1);
        }
        renderizarCarrito();
    }

    function limpiarCarrito() {
        if (carrito.length > 0 && confirm("¿Vaciar el carrito?")) {
            carrito = [];
            renderizarCarrito();
        }
    }

    function renderizarCarrito() {
        if(!cartItemsList) return;
        cartItemsList.innerHTML = '';
        
        if (carrito.length === 0) {
            if(emptyCartMsg) {
                cartItemsList.appendChild(emptyCartMsg);
                emptyCartMsg.style.display = 'block';
            }
            totalPriceEl.textContent = 'S/ 0.00';
            return;
        }

        if(emptyCartMsg) emptyCartMsg.style.display = 'none';
        
        let totalGeneral = 0;
        carrito.forEach(item => {
            const li = document.createElement('li');
            const subtotal = item.precio * item.cantidad;
            totalGeneral += subtotal;
            
            li.style.display = 'flex';
            li.style.justifyContent = 'space-between';
            li.style.alignItems = 'center';
            li.style.marginBottom = '0.8rem';
            li.style.fontSize = '0.95rem';
            
            li.innerHTML = `
                <div>
                    <div style="font-weight: 500;">${item.nombre} <span style="font-size:0.8rem; color:#aaa;">x${item.cantidad}</span></div>
                    <div style="font-size: 0.8rem; color: #a0a0a0;">S/ ${subtotal.toFixed(2)}</div>
                </div>
                <i class="fas fa-trash-alt remove-item-btn" data-id="${item.id}" style="color: #ff7675; cursor: pointer;"></i>
            `;
            cartItemsList.appendChild(li);
        });
        totalPriceEl.textContent = `S/ ${totalGeneral.toFixed(2)}`;
    }

    if(cartItemsList) {
        cartItemsList.addEventListener('click', (event) => {
            if (event.target.classList.contains('remove-item-btn')) {
                const id = parseInt(event.target.getAttribute('data-id'));
                quitarDelCarrito(id);
            }
        });
    }

    if(clearCartBtn) clearCartBtn.addEventListener('click', limpiarCarrito);

    // --- PROCESAR PAGO ---
    if(processPaymentBtn) {
        processPaymentBtn.addEventListener('click', async () => {
            if (carrito.length === 0) return alert('El carrito está vacío.');
            
            const total = carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
            const pedido = {
                total: total,
                id_cliente: clienteId,
                items: carrito
            };

            try {
                const response = await fetch(API_PEDIDOS_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(pedido)
                });
                
                if (response.ok) {
                    alert('¡Pedido registrado exitosamente!');
                    carrito = [];
                    renderizarCarrito();
                    cargarProductos(); // Actualizar stock visualmente
                    // Navegar al historial visualmente
                    document.getElementById('nav-historial').click();
                } else {
                    const errorTxt = await response.text();
                    alert(`Error al registrar el pedido: ${errorTxt}`);
                }
            } catch (error) {
                console.error('Error de red:', error);
                alert('No se pudo conectar con el servidor.');
            }
        });
    }

    // --- HISTORIAL ---
    async function cargarHistorial() {
        if(!historyTableBody) return;
        historyTableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:1rem;">Cargando historial...</td></tr>';
        
        try {
            const response = await fetch(API_HISTORIAL_URL);
            if(!response.ok) throw new Error("Error API");
            const data = await response.json();
            
            if (data.length === 0) {
                historyTableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:1rem;">No has realizado ningún pedido todavía.</td></tr>';
                return;
            }

            historyTableBody.innerHTML = '';
            data.forEach(pedido => {
                const tr = document.createElement('tr');
                const fecha = new Date(pedido.fecha).toLocaleString('es-PE');
                const estadoColor = pedido.estado === 'Completado' ? '#00b894' : '#fdcb6e';
                const estadoBg = pedido.estado === 'Completado' ? '#e1fcec' : '#fff3cd';
                
                tr.innerHTML = `
                    <td style="padding: 1.5rem; font-weight: bold;">#${pedido.id_pedido}</td>
                    <td style="padding: 1.5rem;">${fecha}</td>
                    <td style="padding: 1.5rem;">${pedido.productos || 'Varios'}</td>
                    <td style="padding: 1.5rem;"><span style="background: ${estadoBg}; color: ${estadoColor}; padding: 5px 12px; border-radius: 15px; font-size: 0.85rem; font-weight: 600;">${pedido.estado}</span></td>
                    <td style="padding: 1.5rem;">S/ ${parseFloat(pedido.total).toFixed(2)}</td>
                `;
                historyTableBody.appendChild(tr);
            });

        } catch (error) {
            console.error('Error al cargar historial:', error);
            historyTableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; color: #ff7675; padding:1rem;">Error al cargar el historial. Revisa la conexión.</td></tr>';
        }
    }

    // --- INICIALIZACIÓN ---
    cargarProductos();
    renderizarCarrito();
});