// app.js - Módulo principal para gestión de categorías

// Clave para localStorage
const STORAGE_KEY = 'categorias';

// Estado inicial (si no hay datos)
let categorias = [];

// Elementos DOM
const contenedor = document.getElementById('contenedor-categorias');
const modal = document.getElementById('modal-categoria');
const form = document.getElementById('form-nueva-categoria');
const nombreInput = document.getElementById('nombre-categoria');
const imagenInput = document.getElementById('imagen-categoria');

// --- Funciones de persistencia ---
function cargarCategorias() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try { categorias = JSON.parse(stored); } catch (e) { categorias = []; }
  } else {
    // Datos de ejemplo (opcional)
    categorias = [
      { id: Date.now() + 1, nombre: 'Frutas', imagen: '' },
      { id: Date.now() + 2, nombre: 'Verduras', imagen: '' },
      { id: Date.now() + 3, nombre: 'Lácteos', imagen: '' }
    ];
    guardarCategorias();
  }
}

function guardarCategorias() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(categorias));
}

// --- Renderizado ---
function renderizarCategorias() {
  if (!contenedor) return;
  if (categorias.length === 0) {
    contenedor.innerHTML = `<p style="grid-column: 1 / -1; text-align: center; color: var(--perfect-rose);">No hay categorías. ¡Añade una!</p>`;
    return;
  }
  let html = '';
  categorias.forEach(cat => {
    const tieneImagen = cat.imagen && cat.imagen.startsWith('data:image');
    const estiloFondo = tieneImagen ? `background-image: url('${cat.imagen}');` : '';
    const claseImagen = tieneImagen ? 'con-imagen' : '';
    html += `
      <div class="categoria ${claseImagen}" style="${estiloFondo}" data-id="${cat.id}">
        <div class="categoria-footer">
          <span>${cat.nombre}</span>
          <button class="btn-eliminar" data-id="${cat.id}" aria-label="Eliminar categoría" style="background: none; border: none; color: var(--perfect-rose); font-size: 0.8rem; margin-top: 6px; cursor: pointer;">✕</button>
        </div>
      </div>
    `;
  });
  contenedor.innerHTML = html;

  // Eventos de eliminación
  document.querySelectorAll('.btn-eliminar').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = Number(btn.dataset.id);
      if (confirm('¿Eliminar esta categoría?')) {
        eliminarCategoria(id);
      }
    });
  });
}

// --- CRUD ---
function agregarCategoria(nombre, imagenBase64) {
  const nueva = {
    id: Date.now(),
    nombre: nombre.trim(),
    imagen: imagenBase64 || ''
  };
  categorias.push(nueva);
  guardarCategorias();
  renderizarCategorias();
}

function eliminarCategoria(id) {
  categorias = categorias.filter(c => c.id !== id);
  guardarCategorias();
  renderizarCategorias();
}

// --- Manejo del formulario ---
function handleSubmit(e) {
  e.preventDefault();
  const nombre = nombreInput.value.trim();
  if (!nombre) { alert('El nombre es obligatorio'); return; }

  const file = imagenInput.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      agregarCategoria(nombre, event.target.result);
      cerrarModal();
    };
    reader.readAsDataURL(file);
  } else {
    agregarCategoria(nombre, '');
    cerrarModal();
  }
}

function cerrarModal() {
  if (modal) modal.classList.add('hidden');
  form.reset();
}

// --- Inicialización ---
function init() {
  cargarCategorias();
  renderizarCategorias();

  // Eventos del formulario
  if (form) {
    form.addEventListener('submit', handleSubmit);
  }

  // Cerrar modal con botón cancelar (ya existe en el HTML)
  const cancelBtn = document.getElementById('btn-cerrar-modal');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', cerrarModal);
  }

  // Cerrar al hacer clic fuera
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) cerrarModal();
    });
  }
}

// Ejecutar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}