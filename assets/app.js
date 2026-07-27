// --- REGISTRO Y GESTIÓN DE PWA ---
let diferirInstalacion;
const btnInstalar = document.getElementById('btn-instalar');

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('./sw.js')
      .then(reg => console.log('Service Worker registrado con éxito:', reg))
      .catch(err => console.error('Error registrando Service Worker:', err));
  });
}

// Captura el evento del navegador que permite instalar la app
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  diferirInstalacion = e;
  if (btnInstalar) {
    btnInstalar.classList.remove('hidden');
  }
});

if (btnInstalar) {
  btnInstalar.addEventListener('click', async () => {
    if (diferirInstalacion) {
      diferirInstalacion.prompt();
      const { outcome } = await diferirInstalacion.userChoice;
      if (outcome === 'accepted') {
        console.log('El usuario aceptó la instalación.');
      }
      diferirInstalacion = null;
      btnInstalar.classList.add('hidden');
    }
  });
}

// --- LÓGICA DEL MODAL Y CATEGORÍAS ---
function mostrarModal() {
  const modal = document.getElementById('modal');
  if (modal) {
    modal.classList.remove('hidden');
  }
}

function cerrarModal() {
  const modal = document.getElementById('modal');
  if (modal) {
    modal.classList.add('hidden');
  }
}

// Evento submit para agregar nueva categoría
document.addEventListener('DOMContentLoaded', () => {
  const formCategoria = document.getElementById('form-categoria');
  
  if (formCategoria) {
    formCategoria.addEventListener('submit', function (e) {
      e.preventDefault();

      const nombreInput = document.getElementById('nombre-categoria');
      const imagenInput = document.getElementById('imagen-categoria');
      
      const nombre = nombreInput ? nombreInput.value.trim() : '';
      const imagen = imagenInput ? imagenInput.value.trim() : '';

      if (nombre) {
        const categoriasContainer = document.getElementById('categorias');

        if (categoriasContainer) {
          const nuevaCategoria = document.createElement('div');
          nuevaCategoria.classList.add('categoria');
          
          if (imagen) {
            nuevaCategoria.innerHTML = `
              <img src="${imagen}" alt="${nombre}" style="width: 40px; height: 40px; margin-bottom: 8px; object-fit: contain;">
              <span>${nombre}</span>
            `;
          } else {
            nuevaCategoria.innerHTML = `<span>${nombre}</span>`;
          }

          categoriasContainer.appendChild(nuevaCategoria);
        }

        cerrarModal();
        formCategoria.reset();
      }
    });
  }
});
