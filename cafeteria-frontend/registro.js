document.addEventListener('DOMContentLoaded', () => {

    // --- Referencias a elementos ---
    const registroForm = document.getElementById('registro-form');
    const errorMessage = document.getElementById('error-message');
    
    // Inputs
    const nombreInput = document.getElementById('nombre');
    const apellidoInput = document.getElementById('apellido');
    const correoInput = document.getElementById('correo');
    const telefonoInput = document.getElementById('telefono');
    const usuarioInput = document.getElementById('usuario');
    const contrasenaInput = document.getElementById('contrasena');

    // --- Evento de envío ---
    registroForm.addEventListener('submit', async (event) => {
        event.preventDefault(); // Evitar recarga
        errorMessage.textContent = ''; // Limpiar errores

        // 1. Recoger los datos del formulario
        const datosCliente = {
            nombre: nombreInput.value,
            apellido: apellidoInput.value,
            correo: correoInput.value,
            telefono: telefonoInput.value || null, // Enviar null si está vacío
            usuario: usuarioInput.value,
            contrasena: contrasenaInput.value 
        };

        // 2. Enviar al nuevo endpoint del backend
        try {
            const response = await fetch('/api/clientes/registro', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(datosCliente)
            });

            if (response.ok) {
                // ¡Éxito!
                alert('¡Cuenta creada exitosamente! \nAhora puedes iniciar sesión.');
                // Redirigir al login
                window.location.href = 'index.html'; 
            } else {
                // Mostrar error (ej: "Usuario ya existe")
                const errorTexto = await response.text();
                errorMessage.textContent = errorTexto;
            }

        } catch (error) {
            console.error('Error de red:', error);
            errorMessage.textContent = 'Error de conexión. Inténtalo de nuevo.';
        }
    });
});