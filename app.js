// 1. IMPORTAR FIREBASE
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, onSnapshot, addDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// 2. CONFIGURACIÓN (REEMPLAZA CON TUS DATOS REALES DE FIREBASE)
const firebaseConfig = {
  apiKey: "TU_API_KEY_REAL",
  authDomain: "TU_PROYECTO.firebaseapp.com",
  projectId: "TU_PROYECTO_ID",
  storageBucket: "TU_PROYECTO.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

// 3. INICIALIZAR BASE DE DATOS
let db;
try {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  console.log("Conectado a Firebase correctamente");
} catch (error) {
  alert("Error al conectar con Firebase: " + error.message);
}

// 4. ESCUCHAR CAMBIOS EN TIEMPO REAL
const categoriasContainer = document.getElementById('categorias');

if (db && categoriasContainer) {
  onSnapshot(collection(db, "categorias"), (snapshot) => {
    categoriasContainer.innerHTML = ''; // Limpiar contenedor

    if (snapshot.empty) {
      categoriasContainer.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #8d99ae;">No hay categorías aún.</p>';
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
    alert("Error de lectura en Firestore: " + error.message);
  });
}

// 5. GUARDAR NUEVA CATEGORÍA EN LA NUBE
document.addEventListener('DOMContentLoaded', () => {
  const formCategoria = document.getElementById('form-categoria');

  if (formCategoria) {
    formCategoria.addEventListener('submit', async function (e) {
      e.preventDefault();

      const nombre = document.getElementById('nombre-categoria').value.trim();
      const imagen = document.getElementById('imagen-categoria').value.trim();

      if (!db) {
        alert("La base de datos no está inicializada. Revisa firebaseConfig.");
        return;
      }

      if (nombre) {
        try {
          // Intentar guardar en Firestore
          await addDoc(collection(db, "categorias"), {
            nombre: nombre,
            imagen: imagen,
            fecha: new Date()
          });

          // Si llega aquí, se guardó en la nube con éxito
          window.cerrarModal();
          formCategoria.reset();
        } catch (err) {
          // Si Firebase rechaza el guardado, te dirá el motivo en una alerta
          alert("Error al guardar en Firebase: " + err.message);
        }
      }
    });
  }
});

// Funciones globales del Modal
window.mostrarModal = function() {
  const modal = document.getElementById('modal');
  if (modal) modal.classList.remove('hidden');
};

window.cerrarModal = function() {
  const modal = document.getElementById('modal');
  if (modal) modal.classList.add('hidden');
};

// Registro de Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(err => console.log('SW error:', err));
  });
}
