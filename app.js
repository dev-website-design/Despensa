import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  onSnapshot, 
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// --- CONFIGURACIÓN DE FIREBASE ---
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

// Usuario Activo
const usuarioActivo = localStorage.getItem('usuarioActivo') || 'MARÍA';

// Inicialización de la interfaz
window.addEventListener('DOMContentLoaded', () => {
  const userGreeting = document.getElementById('user-greeting');
  if (userGreeting) userGreeting.textContent = `Hola, ${usuarioActivo}`;

  inicializarModal();
  cargarCategorias();
});

// --- LÓGICA DEL MODAL ---
function inicializarModal() {
  const modal = document.getElementById('modal-categoria') || document.getElementById('modal');
  const btnAbrir = document.getElementById('btn-open-modal') || document.getElementById('btn-abrir-modal');
  const btnCerrar = document.getElementById('btn-cancelar') || document.getElementById('btn-cerrar-modal');
  const form = document.getElementById('form-nueva-categoria') || document.getElementById('form-categoria');

  function abrir() {
    if (!modal) return;
    modal.classList.remove('hidden');
    modal.style.display = 'flex'; // Forzado por script
  }

  function cerrar() {
    if (!modal) return;
    modal.classList.add('hidden');
    modal.style.display = 'none'; // Forzado por script
    if (form) form.reset();
  }

  if (btnAbrir) btnAbrir.addEventListener('click', abrir);
  if (btnCerrar) btnCerrar.addEventListener('click', cerrar);

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) cerrar();
    });
  }

  // GUARDAR EN FIREBASE AL ENVIAR FORMULARIO
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const nombreInput = document.getElementById('nombre-categoria');
      const fileInput = document.getElementById('imagen-categoria');

      const nombre = nombreInput ? nombreInput.value.trim() : '';
      const archivo = fileInput && fileInput.files ? fileInput.files[0] : null;

      if (!nombre) return;

      try {
        const imagenBase64 = archivo ? await obtenerBase64(archivo) : '';

        await addDoc(collection(db, "categorias"), {
          nombre: nombre,
          imagen: imagenBase64,
          creadoPor: usuarioActivo,
          creadoEn: serverTimestamp()
        });

        cerrar();
      } catch (err) {
        console.error("Error al guardar categoría:", err);
        alert("Error al guardar en Firebase: " + err.message);
      }
    });
  }
}

// --- LECTURA EN TIEMPO REAL ---
function cargarCategorias() {
  const contenedor = document.getElementById('contenedor-categorias') || document.getElementById('categorias');
  if (!contenedor) return;

  onSnapshot(collection(db, "categorias"), (snapshot) => {
    contenedor.innerHTML = '';

    if (snapshot.empty) {
      contenedor.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--perfect-rose);">No hay categorías aún. Toca + para crear una.</p>';
      return;
    }

    snapshot.forEach((doc) => {
      const cat = doc.data();
      const div = document.createElement('div');
      div.className = `categoria ${cat.imagen ? 'con-imagen' : ''}`;

      if (cat.imagen && cat.imagen.trim() !== '') {
        div.style.backgroundImage = `url('${cat.imagen}')`;
      }

      div.innerHTML = `
        <div class="categoria-footer">
          <span>${cat.nombre}</span>
        </div>
      `;

      contenedor.appendChild(div);
    });
  }, (err) => {
    console.error("Error al leer categorías:", err);
  });
}

// Transformar imagen a string base64
function obtenerBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (err) => reject(err);
  });
}