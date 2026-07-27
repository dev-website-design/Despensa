// --- REGISTRO DE SERVICE WORKER Y PWA ---
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('./sw.js')
      .then(reg => console.log('Service Worker registrado:', reg))
      .catch(err => console.error('Error registrando Service Worker:', err));
  });
}

let diferirInstalacion;
const btnInstalar = document.getElementById('btn-instalar');

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  diferirInstalacion = e;
  if (btnInstalar) btnInstalar.classList.remove('hidden');
});

if (btnInstalar) {
  btnInstalar.addEventListener('click', async () => {
    if (diferirInstalacion) {
      diferirInstalacion.prompt();
      diferirInstalacion = null;
      btnInstalar.classList.add('hidden');
    }
  });
}

// --- ALMACENAMIENTO Y LÓGICA DE CATEGORÍAS ---

// Obtener categorías guardadas o usar las predeterminadas
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

// --- EVENTOS DEL MODAL (EVENT LISTENERS DIRECTOS) ---
document.addEventListener('DOMContentLoaded', () => {
  renderCategorias();

  const modal = document.getElementById('modal');
  const btnAbrirModal = document.getElementById('btn-abrir-modal');
  const btnCerrarModal = document.getElementById('btn-cerrar-modal');
  const formCategoria = document.getElementById('form-categoria');

  function abrirModal() {
    if (modal) modal.classList.remove('hidden');
  }

  function cerrarModal() {
    if (modal) modal.classList.add('hidden');
  }

  // Abrir al presionar +
  if (btnAbrirModal) {
    btnAbrirModal.addEventListener('click', abrirModal);
  }

  // Cerrar al presionar Cancelar
  if (btnCerrarModal) {
    btnCerrarModal.addEventListener('click', cerrarModal);
  }

  // Cerrar si hace clic fuera del recuadro del modal
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) cerrarModal();
    });
  }

  // Guardar nueva categoría en localStorage
  if (formCategoria) {
    formCategoria.addEventListener('submit', (e) => {
      e.preventDefault();

      const nombre = document.getElementById('nombre-categoria').value.trim();
      const imagen = document.getElementById('imagen-categoria').value.trim();

      if (nombre) {
        categorias.push({ nombre, imagen });
        localStorage.setItem('mis-categorias', JSON.stringify(categorias));

        renderCategorias();
        cerrarModal();
        formCategoria.reset();
      }
    });
  }
});
