// 1. Esperar a que todo el HTML esté cargado
document.addEventListener('DOMContentLoaded', () => {

    // 2. Obtener los elementos del formulario
    const loginForm = document.getElementById('login-form');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const errorMessage = document.getElementById('error-message');

    // 3. Escuchar cuando el usuario intente enviar el formulario
    loginForm.addEventListener('submit', async (event) => {
        // 4. Evitar que la página se recargue (comportamiento por defecto)
        event.preventDefault();

        // 5. Obtener los valores que el usuario escribió
        const usuario = usernameInput.value;
        const contrasena = passwordInput.value;

        // Limpiamos errores previos
        errorMessage.textContent = '';

        try {
            // 6. Enviar los datos al Backend
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    usuario: usuario,
                    contrasena: contrasena
                })
            });

            // 7. Analizar la respuesta del backend
if (response.ok) {
                // ¡Éxito! El servidor nos dio un 200 (OK)
                const data = await response.json();
                
                // 8. Redirigir según el ROL
                if (data.rol === 'Administrador') {
                    // Limpiamos cualquier dato de cliente que pudiera existir
                    localStorage.removeItem('cliente_id');
                    localStorage.removeItem('cliente_usuario');
                    window.location.href = 'admin.html';

                } else if (data.rol === 'Cajero') {
                    // ¡¡AQUÍ ESTÁ LA MAGIA NUEVA!!
                    localStorage.removeItem('cliente_id');
                    localStorage.removeItem('cliente_usuario');
                    // Guardamos quién es el cajero
                    localStorage.setItem('cajero_id', data.id);
                    localStorage.setItem('cajero_usuario', data.usuario);
                    window.location.href = 'cajero.html';

                } else if (data.rol === 'Cliente') {
                    // ¡¡AQUÍ ESTÁ LA MAGIA!!
                    // Guardamos quién es el cliente en la memoria del navegador.
                    localStorage.setItem('cliente_id', data.id);
                    localStorage.setItem('cliente_usuario', data.usuario);
                    window.location.href = 'cliente.html';
                }

            } else {
                // Error (ej: 401 - No autorizado)
                const errorData = await response.text();
                errorMessage.textContent = errorData;
            }
        } catch (error) {
            // Error de red (ej: el backend no está encendido)
            console.error('Error de conexión:', error);
            errorMessage.textContent = 'No se pudo conectar al servidor. ¿Está encendido?';
        }
    });
});