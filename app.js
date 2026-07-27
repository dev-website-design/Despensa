// --- IMPORTAMOS FIREBASE DESDE LA NUBE ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// 👇👇👇 PEGA AQUÍ TU firebaseConfig QUE COPIASTE DE FIREBASE 👇👇👇
const firebaseConfig = {
const firebaseConfig = {
  apiKey: "AIzaSyDfIQXFFDGoBMvTIOT52nZGVUc-pFJGFs4",
  authDomain: "hogar-e266a.firebaseapp.com",
  projectId: "hogar-e266a",
  storageBucket: "hogar-e266a.firebasestorage.app",
  messagingSenderId: "534168977173",
  appId: "1:534168977173:web:f3900fae93c7dd520b331c"
};
// 👆👆👆 ======================================================== 👆👆👆

// Inicializamos Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- REGISTRO Y GESTIÓN DE PWA ---
let diferirInstalacion;
const btnInstalar = document.getElementById('btn-instalar');

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .catch(err => console.error('Error SW:', err));
  });
}

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

// --- LÓGICA DE CATEGORÍAS (EN TIEMPO REAL CON FIREBASE) ---

// Funciones del Modal
window.mostrarModal = function() { // Usamos window para que el HTML la encuentre
  document.getElementById('modal').classList.remove('hidden');
}
window.cerrarModal = function() {
  document.getElementById('modal').classList.add('hidden');
}

// Escuchar cambios en la base de datos EN TIEMPO REAL
const categoriasRef = collection(db, "categorias");

onSnapshot(categoriasRef, (snapshot) => {
  const categoriasContainer = document.getElementById('categorias');
  if (!categoriasContainer) return;
  
  categoriasContainer.innerHTML = ''; // Limpiamos la pantalla

  snapshot.forEach((doc) => {
    const cat = doc.data(); // Aquí vienen los datos de Firebase
    
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
});

// Guardar nueva categoría en Firebase
document.addEventListener('DOMContentLoaded', () => {
  const formCategoria = document.getElementById('form-categoria');
  
  if (formCategoria) {
    formCategoria.addEventListener('submit', async function (e) {
      e.preventDefault();

      const nombre = document.getElementById('nombre-categoria').value.trim();
      const imagen = document.getElementById('imagen-categoria').value.trim();

      if (nombre) {
        // Subimos la categoría a Firebase
        await addDoc(collection(db, "categorias"), {
          nombre: nombre,
          imagen: imagen,
          fecha: new Date() // Guardamos la fecha por si luego queremos ordenarlas
        });

        cerrarModal();
        formCategoria.reset();
      }
    });
  }
});
