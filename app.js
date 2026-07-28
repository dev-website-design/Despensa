import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  onSnapshot, 
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// --- TUS CREDENCIALES REALES DE FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyDfIQXFFDGoBMvTIOT52nZGVUc-pFJGFs4",
  authDomain: "hogar-e266a.firebaseapp.com",
  projectId: "hogar-e266a",
  storageBucket: "hogar-e266a.firebasestorage.app",
  messagingSenderId: "534168977173",
  appId: "1:534168977173:web:f3900fae93c7dd520b331c"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Service Worker (para PWA)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(err => console.error('SW Error:', err));
  });
}

// Usuario actual del perfil
const usuarioActivo = localStorage.getItem('usuarioActivo') || 'MARÍA';

// Elementos DOM (busca por tus IDs antiguos o los nuevos)
const contenedor = document.getElementById('categorias') || document.getElementById('contenedor-categorias');
const modal = document.getElementById('modal') || document.getElementById('modal-categoria');
const btnAbrir = document.getElementById('btn-abrir-modal') || document.getElementById('btn-open-modal');
const btnCerrar = document.getElementById('btn-cerrar-modal') || document.getElementById('btn-cancelar');
const form = document.getElementById('form-categoria') || document.getElementById('form-nueva-categoria');
const userGreeting = document.getElementById('user-greeting');

// Saludo dinámico si existe la etiqueta
if (userGreeting) {
  userGreeting.textContent = `Hola, ${usuarioActivo}`;
}

// --- LECTURA EN TIEMPO REAL DESDE FIRESTORE ---
onSnapshot(collection(db, "categorias"), (snapshot) => {
  if (!contenedor) return;
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
}, (error) => {
  console.error("Error de conexión con Firestore:", error);
});

// Función para procesar imágenes locales a Base64
function obtenerBase64(file) {
  return new Promise((resolve, reject) => {
    if (!file) resolve('');
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (err) => reject(err);
  });
}

// --- GUARDAR NUEVA CATEGORÍA CON REGISTRO DE USUARIO ---
if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const nombreInput = document.getElementById('nombre-categoria');
    const fileInput = document.getElementById('imagen-categoria');

    const nombre = nombreInput ? nombreInput.value.trim() : '';
    const archivo = fileInput && fileInput.files ? fileInput.files[0] : null;

    if (!nombre) return;

    try {
      const imagenBase64 = await obtenerBase64(archivo);

      await addDoc(collection(db, "categorias"), {
        nombre: nombre,
        imagen: imagenBase64,
        creadoPor: usuarioActivo,
        creadoEn: serverTimestamp()
      });

      form.reset();
      if (modal) modal.classList.add('hidden');
    } catch (err) {
      console.error("Error al guardar categoría:", err);
      alert("Error al guardar: " + err.message);
    }
  });
}

// Control del Modal
if (btnAbrir && modal) {
  btnAbrir.addEventListener('click', () => modal.classList.remove('hidden'));
}

if (btnCerrar && modal) {
  btnCerrar.addEventListener('click', () => {
    if (form) form.reset();
    modal.classList.add('hidden');
  });
}

if (modal) {
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      if (form) form.reset();
      modal.classList.add('hidden');
    }
  });
}