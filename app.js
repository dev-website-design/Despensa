// 1. IMPORTAR MÓDULOS DE FIREBASE
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, onSnapshot, addDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// 2. CONFIGURACIÓN DE TU PROYECTO FIREBASE
// (Pega aquí tus datos reales copiados de Firebase Console)
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

// onSnapshot escucha los cambios en la nube al instante
onSnapshot(collection(db, "categorias"), (snapshot) => {
  if (!categoriasContainer) return;

  categoriasContainer.innerHTML = ''; // Limpiar pantalla

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
  // Eventos para abrir/cerrar modal
  const btnAbrir = document.getElementById('btn-abrir-modal');
  if (btnAbrir) btnAbrir.addEventListener('click', window.mostrarModal);

  const btnCerrar = document.getElementById('btn-cerrar-modal');
  if (btnCerrar) btnCerrar.addEventListener('click', window.cerrarModal);

  // Formulario de agregar categoría
  const form = document.getElementById('form-categoria');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const nombreInput = document.getElementById('nombre-categoria');
      const imagenInput = document.getElementById('imagen-categoria');

      const nombre = nombreInput ? nombreInput.value.trim() : '';
      const imagen = imagenInput ? imagenInput.value.trim() : '';

      if (nombre) {
        try {
          // Guardar directamente en la colección de Firebase
          await addDoc(collection(db, "categorias"), {
            nombre: nombre,
            imagen: imagen,
            fecha: new Date()
          });

          window.cerrarModal();
          form.reset();
        } catch (err) {
          console.error("Error al guardar en Firebase:", err);
          alert("Error al guardar en la nube: " + err.message);
        }
      }
    });
  }
});
