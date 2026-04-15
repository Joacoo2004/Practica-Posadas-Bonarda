document.addEventListener('DOMContentLoaded', function() {
  const token = localStorage.getItem('token');
  const desktopBtn = document.getElementById('auth-btn');
  const mobileBtn = document.getElementById('auth-btn-mobile');
  const reservasLink = document.getElementById('reservas-link');
  const reservasMobileLink = document.getElementById('reservas-link-mobile');

  if (token) {
    if (desktopBtn) {
      desktopBtn.innerHTML = 'Cerrar Sesión';
      desktopBtn.classList.remove('hover:bg-[#3d4632]');
      desktopBtn.classList.add('hover:bg-red-600');
      desktopBtn.onclick = function() {
        localStorage.removeItem('token');
        window.location.href = '/';
      };
    }
    if (mobileBtn) {
      mobileBtn.innerHTML = 'Cerrar Sesión';
      mobileBtn.classList.remove('text-[#2a3222]');
      mobileBtn.classList.add('text-red-600', 'hover:text-red-700');
      mobileBtn.onclick = function() {
        localStorage.removeItem('token');
        window.location.href = '/';
      };
    }
    if (reservasLink) {
      reservasLink.classList.remove('hidden');
    }
    if (reservasMobileLink) {
      reservasMobileLink.classList.remove('hidden');
    }
  } else {
    if (desktopBtn) {
      desktopBtn.href = '/iniciar_sesion';
    }
    if (mobileBtn) {
      mobileBtn.href = '/iniciar_sesion';
    }
  }
});