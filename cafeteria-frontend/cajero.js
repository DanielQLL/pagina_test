document.addEventListener('DOMContentLoaded', () => {

    // --- AUTENTICACIÓN: Verificar si el cajero está logueado ---
    const cajeroId = localStorage.getItem('cajero_id');
    const cajeroUsuario = localStorage.getItem('cajero_usuario');

    if (!cajeroId) {
        alert('Debes iniciar sesión como Cajero para ver esta página.');
        window.location.href = 'index.html';
        return; // Detiene la ejecución
    }
    
    document.getElementById('username-display').textContent = cajeroUsuario;

    // --- URLs del API ---
    const API_PRODUCTOS_URL = '/api/productos';
    const API_PEDIDOS_URL = '/api/pedidos';
    const API_PENDIENTES_URL = '/api/pedidos/pendientes';
    const API_COMPLETAR_URL = '/api/pedidos/completar'; // Base URL

    // --- Estado de la aplicación ---
    let carrito = []; 
    let productosDisponibles = [];

    // --- Referencias de Navegación ---
    const navTpv = document.getElementById('nav-tpv');
    const navPendientes = document.getElementById('nav-pendientes');
    const pageTpv = document.getElementById('tpv-section');
    const pagePendientes = document.getElementById('pendientes-section');
    const logoutLink = document.getElementById('logout-link');

    // --- Referencias TPV ---
    const productGrid = document.getElementById('product-list');
    const cartItemsList = document.getElementById('cart-items');
    const emptyCartMsg = document.getElementById('empty-cart-msg');
    const totalPriceEl = document.getElementById('total-price');
    const processPaymentBtn = document.getElementById('process-payment-btn');
    const clearCartBtn = document.getElementById('clear-cart-btn');

    // --- Referencias Pedidos Pendientes ---
    const pendientesTableBody = document.getElementById('pendientes-table-body');

    // =======================================================
    // --- LÓGICA DE NAVEGACIÓN Y CERRAR SESIÓN ---
    // =======================================================
    navTpv.addEventListener('click', () => showPage('tpv'));
    navPendientes.addEventListener('click', () => showPage('pendientes'));

    logoutLink.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('cajero_id');
        localStorage.removeItem('cajero_usuario');
        window.location.href = 'index.html';
    });

    function showPage(pageName) {
        if (pageName === 'tpv') {
            pageTpv.classList.add('active');
            pagePendientes.classList.remove('active');
            navTpv.classList.add('active');
            navPendientes.classList.remove('active');
        } else if (pageName === 'pendientes') {
            pageTpv.classList.remove('active');
            pagePendientes.classList.add('active');
            navTpv.classList.remove('active');
            navPendientes.classList.add('active');
            cargarPedidosPendientes(); // Carga los pedidos al visitar la pestaña
        }
    }

    // =======================================================
    // --- LÓGICA DE TPV (Venta Rápida) ---
    // (Tu código anterior, con el bug de id_cajero arreglado)
    // =======================================================

    async function cargarProductos() {
        try {
            const response = await fetch(API_PRODUCTOS_URL);
            productosDisponibles = await response.json();
            renderizarProductos();
        } catch (error) { console.error(error); }
    }
    function renderizarProductos() {
        productGrid.innerHTML = '';
        productosDisponibles.forEach(producto => {
            if (producto.stock <= 0) return;
            const card = document.createElement('div');
            card.className = 'product-card';
            card.setAttribute('data-id', producto.id_producto);
            card.innerHTML = `<h4>${producto.nombre}</h4><span class="price">S/ ${parseFloat(producto.precio).toFixed(2)}</span><br><span class="stock">Stock: ${producto.stock}</span>`;
            card.addEventListener('click', () => agregarAlCarrito(producto));
            productGrid.appendChild(card);
        });
    }
    function agregarAlCarrito(producto) {
        const itemExistente = carrito.find(item => item.id === producto.id_producto);
        if (itemExistente) {
            const stockProducto = productosDisponibles.find(p => p.id_producto === producto.id_producto).stock;
            if(itemExistente.cantidad < stockProducto) itemExistente.cantidad++;
            else alert('No hay más stock disponible.');
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
        if (carrito.length === 0) {
            cartItemsList.innerHTML = '';
            cartItemsList.appendChild(emptyCartMsg);
            totalPriceEl.textContent = 'S/ 0.00';
            return;
        }
        cartItemsList.innerHTML = '';
        let totalGeneral = 0;
        carrito.forEach(item => {
            const li = document.createElement('li');
            const subtotal = item.precio * item.cantidad;
            totalGeneral += subtotal;
            li.innerHTML = `<span class="item-details">${item.nombre}</span><span class="item-qty">x${item.cantidad}</span><span class="item-price">S/ ${subtotal.toFixed(2)}</span><button class="remove-item-btn" data-id="${item.id}">X</button>`;
            cartItemsList.appendChild(li);
        });
        totalPriceEl.textContent = `S/ ${totalGeneral.toFixed(2)}`;
    }
    async function registrarVenta() {
        if (carrito.length === 0) { /* ... */ return; }
        const total = carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
        
        // --- ¡ARREGLO IMPORTANTE! ---
        // Ahora usa el ID del cajero logueado, no el '1' de prueba.
        const pedido = {
            total: total,
            id_cajero: cajeroId, 
            items: carrito
        };
        try {
            const response = await fetch(API_PEDIDOS_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(pedido)
            });
            if (response.ok) {
                alert('¡Venta registrada exitosamente!');
                carrito = [];
                renderizarCarrito();
                cargarProductos();
            } else {
                alert(`Error al registrar la venta: ${await response.text()}`);
            }
        } catch (error) { console.error('Error de red:', error); }
    }
    // Listeners TPV
    cartItemsList.addEventListener('click', (event) => {
        if (event.target.classList.contains('remove-item-btn')) {
            const id = parseInt(event.target.getAttribute('data-id'));
            quitarDelCarrito(id);
        }
    });
    clearCartBtn.addEventListener('click', limpiarCarrito);
    processPaymentBtn.addEventListener('click', registrarVenta);

    // =======================================================
    // --- LÓGICA DE PEDIDOS PENDIENTES (NUEVA) ---
    // =======================================================
    
    async function cargarPedidosPendientes() {
        pendientesTableBody.innerHTML = '<tr><td colspan="5">Cargando pedidos...</td></tr>';
        try {
            const response = await fetch(API_PENDIENTES_URL);
            const data = await response.json();
            
            if (data.length === 0) {
                pendientesTableBody.innerHTML = '<tr><td colspan="5">No hay pedidos pendientes.</td></tr>';
                return;
            }

            pendientesTableBody.innerHTML = '';
            data.forEach(pedido => {
                const tr = document.createElement('tr');
                const fecha = new Date(pedido.fecha).toLocaleString('es-PE');
                tr.innerHTML = `
                    <td>${pedido.id_pedido}</td>
                    <td>${fecha}</td>
                    <td>${pedido.nombre} ${pedido.apellido}</td>
                    <td>S/ ${parseFloat(pedido.total).toFixed(2)}</td>
                    <td>
                        <button class="btn-completar" data-id="${pedido.id_pedido}">Marcar como Completado</button>
                    </td>
                `;
                pendientesTableBody.appendChild(tr);
            });

        } catch (error) {
            console.error('Error al cargar pedidos pendientes:', error);
            pendientesTableBody.innerHTML = '<tr><td colspan="5">Error al cargar pedidos.</td></tr>';
        }
    }
    
    // Listener para los botones "Completar"
    pendientesTableBody.addEventListener('click', async (event) => {
        if (event.target.classList.contains('btn-completar')) {
            const id = event.target.getAttribute('data-id');
            if (!confirm(`¿Marcar el pedido ID ${id} como completado?`)) return;

            try {
                const response = await fetch(`${API_COMPLETAR_URL}/${id}`, {
                    method: 'PUT'
                });
                
                if (response.ok) {
                    alert('Pedido completado.');
                    cargarPedidosPendientes(); // Recarga la lista
                } else {
                    alert('Error al actualizar el pedido.');
                }
            } catch (error) {
                console.error('Error al completar:', error);
            }
        }
    });

    // --- Carga Inicial ---
    showPage('tpv'); // Muestra la TPV al iniciar
    cargarProductos();
    renderizarCarrito();
});