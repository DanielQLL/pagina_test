// Espera a que el HTML esté listo
document.addEventListener('DOMContentLoaded', () => {

    // --- Declaración global de jsPDF ---
    const { jsPDF } = window.jspdf;

    // --- Referencias a elementos de NAVEGACIÓN ---
    const navLinks = document.querySelectorAll('.nav-link');
    const pageSections = document.querySelectorAll('.page-section');
    const navInventario = document.getElementById('nav-inventario');
    const navReportes = document.getElementById('nav-reportes');

    // --- Referencias a elementos de INVENTARIO (CRUD) ---
    const productForm = document.getElementById('product-form');
    const productsTableBody = document.querySelector('#products-table tbody');
    const formTitle = document.getElementById('form-title');
    const productIdInput = document.getElementById('product-id');
    const nombreInput = document.getElementById('nombre');
    const categoriaInput = document.getElementById('categoria');
    const precioInput = document.getElementById('precio');
    const stockInput = document.getElementById('stock');
    const saveBtn = document.getElementById('save-btn');
    const cancelBtn = document.getElementById('cancel-edit-btn');
    const API_PRODUCTOS_URL = '/api/productos';

    // --- Referencias a elementos de REPORTES ---
    const reportesTableBody = document.querySelector('#reportes-table tbody');
    const generatePdfBtn = document.getElementById('generate-pdf-btn');
    const API_REPORTES_URL = '/api/reportes/ventas';


    // =======================================================
    // --- LÓGICA DE NAVEGACIÓN ---
    // =======================================================

    function showPage(pageId) {
        // Ocultar todas las secciones
        pageSections.forEach(section => {
            section.classList.remove('active');
        });
        // Quitar 'active' de todos los links
        navLinks.forEach(link => {
            link.classList.remove('active');
        });

        // Mostrar la sección correcta
        const activePage = document.getElementById(pageId);
        activePage.classList.add('active');

        // Resaltar el link correcto
        const activeLink = document.getElementById(`nav-${pageId.split('-')[0]}`);
        activeLink.classList.add('active');
        
        // Cargar datos si es la página de reportes
        if (pageId === 'reportes-section') {
            cargarReporteDeVentas();
        }
    }

    navInventario.addEventListener('click', (e) => {
        e.preventDefault();
        showPage('inventario-section');
    });

    navReportes.addEventListener('click', (e) => {
        e.preventDefault();
        showPage('reportes-section');
    });


    // =======================================================
    // --- LÓGICA DE INVENTARIO (CRUD de Productos) ---
    // (Este código es el que ya tenías, solo está re-ordenado)
    // =======================================================

    function resetForm() {
        productForm.reset();
        productIdInput.value = '';
        formTitle.textContent = 'Registrar Nuevo Producto';
        saveBtn.textContent = 'Guardar Producto';
        cancelBtn.style.display = 'none';
    }

    async function cargarProductos() {
        try {
            const response = await fetch(API_PRODUCTOS_URL);
            if (!response.ok) throw new Error('Error en la respuesta de la red');
            const productos = await response.json();
            productsTableBody.innerHTML = '';
            productos.forEach(producto => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${producto.id_producto}</td>
                    <td>${producto.nombre}</td>
                    <td>${producto.categoria || ''}</td>
                    <td>S/ ${parseFloat(producto.precio).toFixed(2)}</td>
                    <td>${producto.stock}</td>
                    <td class="actions">
                        <button class="btn-edit" data-id="${producto.id_producto}">Editar</button>
                        <button class="btn-delete" data-id="${producto.id_producto}">Eliminar</button>
                    </td>
                `;
                productsTableBody.appendChild(tr);
            });
        } catch (error) { console.error('Error al cargar productos:', error); }
    }

    productForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const id = productIdInput.value;
        const productoData = {
            nombre: nombreInput.value,
            categoria: categoriaInput.value,
            precio: parseFloat(precioInput.value),
            stock: parseInt(stockInput.value)
        };
        let url = API_PRODUCTOS_URL;
        let method = 'POST';
        if (id) {
            url = `${API_PRODUCTOS_URL}/${id}`;
            method = 'PUT';
        }
        try {
            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(productoData)
            });
            if (response.ok) {
                alert((method === 'POST') ? 'Producto registrado.' : 'Producto actualizado.');
                resetForm();
                cargarProductos();
            } else {
                alert(`Error: ${await response.text()}`);
            }
        } catch (error) { console.error('Error al guardar el producto:', error); }
    });

    productsTableBody.addEventListener('click', async (event) => {
        const target = event.target;
        const id = target.getAttribute('data-id');
        if (!id) return;

        if (target.classList.contains('btn-delete')) {
            if (!confirm(`¿Seguro que quieres eliminar el producto con ID ${id}?`)) return;
            try {
                const response = await fetch(`${API_PRODUCTOS_URL}/${id}`, { method: 'DELETE' });
                if (response.ok) {
                    alert('Producto eliminado.');
                    cargarProductos();
                    resetForm();
                } else { alert('Error al eliminar el producto.'); }
            } catch (error) { console.error('Error al eliminar:', error); }
        }

        if (target.classList.contains('btn-edit')) {
            try {
                const response = await fetch(`${API_PRODUCTOS_URL}/${id}`);
                if (!response.ok) throw new Error('Producto no encontrado');
                const producto = await response.json();
                productIdInput.value = producto.id_producto;
                nombreInput.value = producto.nombre;
                categoriaInput.value = producto.categoria || '';
                precioInput.value = producto.precio;
                stockInput.value = producto.stock;
                formTitle.textContent = `Editando Producto: ${producto.nombre} (ID: ${id})`;
                saveBtn.textContent = 'Actualizar Producto';
                cancelBtn.style.display = 'block';
                formTitle.scrollIntoView({ behavior: 'smooth' });
            } catch(error) { console.error('Error al cargar datos para editar:', error); }
        }
    });

    cancelBtn.addEventListener('click', () => { resetForm(); });

    // =======================================================
    // --- LÓGICA DE REPORTES (CON LOGGING EN BD) ---
    // =======================================================

    let datosDelReporte = []; // Guardamos los datos para el PDF

    async function cargarReporteDeVentas() {
        try {
            const response = await fetch(API_REPORTES_URL);
            if (!response.ok) throw new Error('Error al cargar reporte');
            const data = await response.json();
            
            datosDelReporte = data; // Guardamos los datos
            reportesTableBody.innerHTML = ''; // Limpiamos la tabla

            if(data.length === 0) {
                reportesTableBody.innerHTML = '<tr><td colspan="6">No hay ventas registradas todavía.</td></tr>';
                return;
            }

            data.forEach(item => {
                const tr = document.createElement('tr');
                const fecha = new Date(item.fecha).toLocaleString('es-PE');
                tr.innerHTML = `
                    <td>${item.id_pedido}</td>
                    <td>${fecha}</td>
                    <td>${item.producto_nombre}</td>
                    <td>${item.cantidad}</td>
                    <td>S/ ${parseFloat(item.subtotal).toFixed(2)}</td>
                    <td>${item.cajero_usuario || 'N/A'}</td>
                `;
                reportesTableBody.appendChild(tr);
            });

        } catch (error) {
            console.error('Error al cargar reporte:', error);
            reportesTableBody.innerHTML = '<tr><td colspan="6">Error al cargar el reporte.</td></tr>';
        }
    }

    // --- (NUEVA FUNCIÓN ASÍNCRONA para loggear el reporte) ---
    async function logReportGeneration(fileName) {
        const reporteData = {
            tipo: 'Ventas',
            formato: 'PDF',
            ruta_archivo: fileName // Guardamos el nombre del archivo
        };

        try {
            // No necesitamos esperar (await) a que esto termine
            // Lo mandamos y seguimos con lo nuestro
            fetch('/api/reportes/log', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(reporteData)
            });
            console.log('Solicitud de registro de reporte enviada a la BD.');
        } catch (error) {
            // Si esto falla, no es crítico. 
            // El usuario igual quiere su PDF.
            console.error('Error al enviar el log del reporte:', error);
        }
    }

    // --- (FUNCIÓN MODIFICADA del botón PDF) ---
    generatePdfBtn.addEventListener('click', () => {
        if (datosDelReporte.length === 0) {
            alert('No hay datos para generar un PDF.');
            return;
        }

        // --- 1. Primero, se genera el PDF en la memoria ---
        const doc = new jsPDF();
        
        doc.text("Reporte de Ventas - Cafetería", 14, 20);
        doc.setFontSize(12);
        const fechaGeneracion = new Date().toLocaleString('es-PE');
        doc.text(`Generado el: ${fechaGeneracion}`, 14, 28);
        
        const headers = [["ID Pedido", "Fecha", "Producto", "Cantidad", "Subtotal", "Cajero"]];
        
        const body = datosDelReporte.map(item => [
            item.id_pedido,
            new Date(item.fecha).toLocaleString('es-PE'),
            item.producto_nombre,
            item.cantidad,
            `S/ ${parseFloat(item.subtotal).toFixed(2)}`,
            item.cajero_usuario || 'N/A'
        ]);

        doc.autoTable({
            startY: 35,
            head: headers,
            body: body,
        });

        // --- 2. Se define el nombre del archivo ---
        const fileName = `Reporte_Ventas_${new Date().getTime()}.pdf`;
        doc.save(fileName); // El navegador lo descarga

        // --- 3. (NUEVO) Se manda a guardar el registro en la BD ---
        // Lo llamamos *después* de que el PDF se genera.
        logReportGeneration(fileName);
    });

    // --- Carga inicial ---
    showPage('inventario-section'); // Muestra la página de inventario al cargar
    cargarProductos(); // Carga los productos al iniciar
});