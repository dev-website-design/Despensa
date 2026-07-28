import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, onSnapshot, addDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDfIQXFFDGoBMvTIOT52nZGVUc-pFJGFs4",
  authDomain: "hogar-e266a.firebaseapp.com",
  projectId: "hogar-e266a",
  storageBucket: "hogar-e266a.firebasestorage.app",
  messagingSenderId: "534168977173",
  appId: "1:534168977173:web:f3900fae93c7dd520b331c"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(err => console.error('SW Error:', err));
  });
}

// Modal Toggle
window.mostrarModal = () => document.getElementById('modal')?.classList.remove('hidden');
window.cerrarModal = () => document.getElementById('modal')?.classList.add('hidden');

// Carga en tiempo real
const categoriasContainer = document.getElementById('categorias');

onSnapshot(collection(db, "categorias"), (snapshot) => {
  if (!categoriasContainer) return;
  categoriasContainer.innerHTML = '';

  if (snapshot.empty) {
    categoriasContainer.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--perfect-rose);">Sin categorías aún. Toca + para crear una.</p>';
    return;
  }

  snapshot.forEach((doc) => {
    const cat = doc.data();
    const div = document.createElement('div');
    div.classList.add('categoria');

    if (cat.imagen && cat.imagen.trim() !== '') {
      div.classList.add('con-imagen');
      div.style.backgroundImage = `url('${cat.imagen.trim()}')`;
    }

    div.innerHTML = `
      <div class="categoria-footer">
        <span>${cat.nombre}</span>
      </div>
    `;

    categoriasContainer.appendChild(div);
  });
});

// Lógica de interfaz y animación del Dock
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('btn-abrir-modal')?.addEventListener('click', window.mostrarModal);
  document.getElementById('btn-cerrar-modal')?.addEventListener('click', window.cerrarModal);

  // --- TRANSICIÓN SUAVE DEL INDICADOR EN EL DOCK ---
  const dock = document.querySelector('.floating-dock');
  const indicator = document.getElementById('dock-indicator');
  const dockItems = document.querySelectorAll('.floating-dock .dock-item');

  function moverIndicador(elemento) {
    if (!elemento || !indicator || !dock) return;
    const dockRect = dock.getBoundingClientRect();
    const itemRect = elemento.getBoundingClientRect();

    const left = itemRect.left - dockRect.left;
    const top = itemRect.top - dockRect.top;

    indicator.style.width = `${itemRect.width}px`;
    indicator.style.height = `${itemRect.height}px`;
    indicator.style.transform = `translate(${left}px, ${top}px)`;
    indicator.style.opacity = '1';
  }

  // Inicializar indicador en la opción activa
  const activeInicial = document.querySelector('.floating-dock .dock-item.active');
  if (activeInicial) {
    setTimeout(() => moverIndicador(activeInicial), 50);
  }

  // Evento al tocar cada ícono
  dockItems.forEach(item => {
    item.addEventListener('click', (e) => {
      dockItems.forEach(i => i.classList.remove('active'));
      const target = e.currentTarget;
      target.classList.add('active');
      moverIndicador(target);
    });
  });

  // Re-ajustar si cambia la pantalla/orientación
  window.addEventListener('resize', () => {
    const itemActivo = document.querySelector('.floating-dock .dock-item.active');
    if (itemActivo) moverIndicador(itemActivo);
  });

  // Guardar categoría
  const form = document.getElementById('form-categoria');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const nombre = document.getElementById('nombre-categoria')?.value.trim();
      const imagen = document.getElementById('imagen-categoria')?.value.trim();

      if (nombre) {
        try {
          await addDoc(collection(db, "categorias"), {
            nombre: nombre,
            imagen: imagen || '',
            fecha: new Date()
          });

          window.cerrarModal();
          form.reset();
        } catch (err) {
          alert("Error al guardar: " + err.message);
        }
      }
    });
  }
});
