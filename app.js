// 1. IMPORTAR MÓDULOS DE FIREBASE
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, onSnapshot, addDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// 2. CONFIGURACIÓN DE TU PROYECTO FIREBASE
const firebaseConfig = {
  apiKey: "AIzaSyDfIQXFFDGoBMvTIOT52nZGVUc-pFJGFs4",
  authDomain: "hogar-e266a.firebaseapp.com",
  projectId: "hogar-e266a",
  storageBucket: "hogar-e266a.firebasestorage.app",
  messagingSenderId: "534168977173",
  appId: "1:534168977173:web:f3900fae93c7dd520b331c"
};

// Inicializar la base de datos en la nube
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- REGISTRO DE SERVICE WORKER (PWA) ---
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .catch(err => console.error('Error SW:', err));
  });
}

// --- CAMBIO DINÁMICO DEL INDICADOR EN LA BARRA FLOTANTE ---
const dockItems = document.querySelectorAll('.dock-item');

dockItems.forEach(item => {
  item.addEventListener('click', () => {
    // Quita la clase activa de todos los demás botones
    dockItems.forEach(btn => btn.classList.remove('active'));
    // Agrega el fondo rosado al botón presionado
    item.classList.add('active');
  });
});

// --- FUNCIONES DEL MODAL (GLOBALES) ---
window.mostrarModal = function() {
  const modal = document.getElementById('modal');
  if (modal) modal.classList.remove('hidden');
};

window.cerrarModal = function() {
  const modal = document.getElementById('modal');
  if (modal) modal.classList.add('hidden');
};

// --- LEER EN TIEMPO REAL DESDE FIREBASE ---
const categoriasContainer = document.getElementById('categorias');

onSnapshot(collection(db, "categorias"), (snapshot) => {
  if (!categoriasContainer) return;

  categoriasContainer.innerHTML = '';

  if (snapshot.empty) {
    categoriasContainer.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #888;">No hay categorías aún. ¡Agrega una con el botón +!</p>';
    return;
  }

  snapshot.forEach((doc) => {
    const cat = doc.data();
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

    categoriasContainer.appendChild(div);
  });
}, (error) => {
  console.error("Error al conectar con Firestore:", error);
  alert("Error de permisos o conexión en Firebase: " + error.message);
});

// --- GUARDAR NUEVA CATEGORÍA EN FIREBASE ---
document.addEventListener('DOMContentLoaded', () => {
  const btnAbrir = document.getElementById('btn-abrir-modal');
  if (btnAbrir) btnAbrir.addEventListener('click', window.mostrarModal);

  const btnCerrar = document.getElementById('btn-cerrar-modal');
  if (btnCerrar) btnCerrar.addEventListener('click', window.cerrarModal);

  const form = document.getElementById('form-categoria');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const nombreInput = document.getElementById('nombre-categoria');
      const imagenInput = document.getElementById('imagen-categoria');
      const btnSubmit = form.querySelector('.btn-primary');

      const nombre = nombreInput ? nombreInput.value.trim() : '';
      const imagen = imagenInput ? imagenInput.value.trim() : '';

      if (nombre) {
        try {
          if (btnSubmit) btnSubmit.style.transform = 'scale(0.92)';

          await addDoc(collection(db, "categorias"), {
            nombre: nombre,
            imagen: imagen,
            fecha: new Date()
          });

          // Cierre rápido en 200ms
          await new Promise(resolve => setTimeout(resolve, 200));

          if (btnSubmit) btnSubmit.style.transform = '';
          window.cerrarModal();
          form.reset();
        } catch (err) {
          if (btnSubmit) btnSubmit.style.transform = '';
          console.error("Error al guardar en Firebase:", err);
          alert("Error al guardar en la nube: " + err.message);
        }
      }
    });
  }
});
