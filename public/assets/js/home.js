// Animación del botón al cargar
document.addEventListener('DOMContentLoaded', ()=>{
  const btn = document.querySelector('.cta-hero');
  if(btn){
    setTimeout(()=>{
      btn.style.transition = 'transform 600ms cubic-bezier(.2,.9,.2,1), opacity 600ms';
      btn.style.transform = 'translateY(0)';
      btn.style.opacity = '1';
    },200);

    // Add click handler to check authentication before allowing reservation access
    btn.addEventListener('click', async function(e) {
      e.preventDefault(); // Prevent default navigation

      const token = localStorage.getItem('token');
      if (!token) {
        // No token, redirect to user creation/login page
        window.location.href = '/iniciar_sesion';
        return;
      }

      // Validate token by making a test request
      try {
        const response = await fetch('/api/reservas', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          // Token is valid, proceed to reservation page
          window.location.href = '/crear_reserva';
        } else {
          // Token invalid/expired, redirect to login
          localStorage.removeItem('token');
          window.location.href = '/iniciar_sesion';
        }
      } catch (error) {
        console.error('Token validation failed:', error);
        localStorage.removeItem('token');
        window.location.href = '/iniciar_sesion';
      }
    });
  }
});