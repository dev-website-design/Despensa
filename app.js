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

// Renderizado en tiempo real sin numeración
const categoriasContainer = document.getElementById('categorias');

onSnapshot(collection(db, "categorias"), (snapshot) => {
  if (!categoriasContainer) return;
  categoriasContainer.innerHTML = '';

  if (snapshot.empty) {
    categoriasContainer.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--perfect-rose);">No hay categorías aún. Toca + para crear una.</p>';
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

// Guardar nueva categoría
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('btn-abrir-modal')?.addEventListener('click', window.mostrarModal);
  document.getElementById('btn-cerrar-modal')?.addEventListener('click', window.cerrarModal);

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
            imagen: imagen,
            fecha: new Date()
          });
          window.cerrarModal();
          form.reset();
        } catch (err) {
          alert("Error de conexión: " + err.message);
        }
      }
    });
  }
});
