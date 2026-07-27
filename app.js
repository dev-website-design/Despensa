// --- REGISTRO DE SERVICE WORKER ---
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('./sw.js')
      .then(reg => console.log('Service Worker registrado:', reg))
      .catch(err => console.error('Error al registrar Service Worker:', err));
  });
}

// --- BOTÓN DE INSTALACIÓN PWA ---
let diferirInstalacion;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  diferirInstalacion = e;
  const btnInstalar = document.getElementById('btn-instalar');
  if (btnInstalar) btnInstalar.classList.remove('hidden');
});

// --- FUNCIONES DEL MODAL (GLOBALES PARA EVITAR ERRORES DE ALCANCE) ---
window.mostrarModal = function() {
  const modal = document.getElementById('modal');
  if (modal) {
    modal.classList.remove('hidden');
  } else {
    alert("Error: No se encontró el modal en el HTML.");
  }
};

window.cerrarModal = function() {
  const modal = document.getElementById('modal');
  if (modal) {
    modal.classList.add('hidden');
  }
};

// --- ALMACENAMIENTO DE CATEGORÍAS (LOCALSTORAGE) ---
let categorias = JSON.parse(localStorage.getItem('mis-categorias')) || [
  { nombre: 'Cocina', imagen: '' },
  { nombre: 'Habitación', imagen: '' },
  { nombre: 'Baño', imagen: '' },
  { nombre: 'Sala', imagen: '' },
  { nombre: 'Comedor', imagen: '' }
];

function renderCategorias() {
  const container = document.getElementById('categorias');
  if (!container) return;

  container.innerHTML = '';

  categorias.forEach(cat => {
    const div = document.createElement('div');
    div.classList.add('categoria');

    if (cat.imagen) {
      div.innerHTML = `
        <img src="${cat.imagen}" alt="${cat.nombre}" style="width: 40px; height: 40px; margin-bottom: 8px; object-fit: contain;">
        <span>${cat.nombre}</span>
      `;
    } else {
      div.innerHTML = `<span>${cat.nombre}</span>`;
    }

    container.appendChild(div);
  });
}

// --- INICIALIZACIÓN Y EVENTOS ---
document.addEventListener('DOMContentLoaded', () => {
  renderCategorias();

  // Escuchar el botón de instalar
  const btnInstalar = document.getElementById('btn-instalar');
  if (btnInstalar) {
    btnInstalar.addEventListener('click', async () => {
      if (diferirInstalacion) {
        diferirInstalacion.prompt();
        diferirInstalacion = null;
        btnInstalar.classList.add('hidden');
      }
    });
  }

  // Vincular eventos del modal
  const btnAbrir = document.getElementById('btn-abrir-modal');
  if (btnAbrir) btnAbrir.addEventListener('click', window.mostrarModal);

  const btnCerrar = document.getElementById('btn-cerrar-modal');
  if (btnCerrar) btnCerrar.addEventListener('click', window.cerrarModal);

  // Formulario para guardar categoría
  const form = document.getElementById('form-categoria');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const nombreInput = document.getElementById('nombre-categoria');
      const imagenInput = document.getElementById('imagen-categoria');

      const nombre = nombreInput ? nombreInput.value.trim() : '';
      const imagen = imagenInput ? imagenInput.value.trim() : '';

      if (nombre) {
        categorias.push({ nombre, imagen });
        localStorage.setItem('mis-categorias', JSON.stringify(categorias));
        renderCategorias();
        window.cerrarModal();
        form.reset();
      }
    });
  }
});
