// =====================================================
// app.js - Compat con Firebase Auth + Firestore (Validado)
// =====================================================

// =====================================================
// 1. CONFIGURACIÓN DE FIREBASE (TUS CREDENCIALES)
// =====================================================
const firebaseConfig = {
  apiKey: "AIzaSyDfIQXFFDGoBMvTIOT52nZGVUc-pFJGFs4",
  authDomain: "hogar-e266a.firebaseapp.com",
  projectId: "hogar-e266a",
  storageBucket: "hogar-e266a.firebasestorage.app",
  messagingSenderId: "534168977173",
  appId: "1:534168977173:web:f3900fae93c7dd520b331c"
};

// =====================================================
// 2. INICIALIZAR FIREBASE (usamos Firestore y Auth)
// =====================================================
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();
const db = firebase.firestore();

// =====================================================
// 3. DOM ELEMENTS
// =====================================================
const pageAuth = document.getElementById('page-auth');
const pageCategorias = document.getElementById('page-categorias');
const authForm = document.getElementById('authForm');
const authEmail = document.getElementById('authEmail');
const authPassword = document.getElementById('authPassword');
const authSubmitBtn = document.getElementById('authSubmitBtn');
const authTitle = document.getElementById('authTitle');
const authSwitchLink = document.getElementById('authSwitchLink');
const authSwitchText = document.getElementById('authSwitchText');
const authError = document.getElementById('authError');
const btnGoogle = document.getElementById('btnGoogle');
const btnLogout = document.getElementById('btnLogout');
const userNameSpan = document.getElementById('user-name');
const contenedor = document.getElementById('contenedor-categorias');
const modalCategoria = document.getElementById('modalCategoria');
const formCategoria = document.getElementById('formCategoria');
const nombreCategoria = document.getElementById('nombreCategoria');
const imagenCategoria = document.getElementById('imagenCategoria');
const modalCancel = document.getElementById('modalCancel');
const dockAddBtn = document.getElementById('dockAddBtn');

// =====================================================
// 4. ESTADO GLOBAL
// =====================================================
let isLogin = true; // true = login, false = registro
let currentUser = null;
let unsubscribeCategorias = null; // Para cancelar la escucha al hacer logout

// =====================================================
// 5. LÓGICA DE AUTENTICACIÓN (¡CON VALIDACIÓN!)
// =====================================================
function toggleAuthMode() {
  isLogin = !isLogin;
  authTitle.textContent = isLogin ? 'Iniciar Sesión' : 'Crear Cuenta';
  authSubmitBtn.textContent = isLogin ? 'Iniciar sesión' : 'Registrarse';
  authSwitchText.textContent = isLogin ? '¿No tienes cuenta? ' : '¿Ya tienes cuenta? ';
  authSwitchLink.textContent = isLogin ? 'Regístrate' : 'Inicia sesión';
  authError.textContent = '';
}

async function handleAuthSubmit(e) {
  e.preventDefault();
  const email = authEmail.value.trim();
  const password = authPassword.value.trim();

  // ---------- ESTA VALIDACIÓN EVITA EL ERROR 400 ----------
  if (!email || !password) {
    authError.textContent = 'Por favor, completa el correo y la contraseña.';
    return; // Corta la ejecución aquí
  }
  // --------------------------------------------------------

  authError.textContent = 'Cargando...';
  try {
    if (isLogin) {
      await auth.signInWithEmailAndPassword(email, password);
    } else {
      await auth.createUserWithEmailAndPassword(email, password);
    }
  } catch (error) {
    console.error(error);
    // Mensajes de error más amigables
    if (error.code === 'auth/email-already-in-use') {
      authError.textContent = 'Este correo ya está registrado.';
    } else if (error.code === 'auth/user-not-found') {
      authError.textContent = 'Usuario no encontrado.';
    } else if (error.code === 'auth/wrong-password') {
      authError.textContent = 'Contraseña incorrecta.';
    } else {
      authError.textContent = error.message;
    }
  }
}

async function loginWithGoogle() {
  try {
    const provider = new firebase.auth.GoogleAuthProvider();
    await auth.signInWithPopup(provider);
  } catch (error) {
    console.error(error);
    authError.textContent = error.message;
  }
}

function logout() {
  auth.signOut();
}

// =====================================================
// 6. FUNCIONES DE CATEGORÍAS (Firestore + tiempo real)
// =====================================================
function getCategoriasRef() {
  if (!currentUser) return null;
  return db.collection('categorias').doc(currentUser.uid).collection('items');
}

function suscribirCategorias() {
  if (unsubscribeCategorias) {
    unsubscribeCategorias();
    unsubscribeCategorias = null;
  }
  const ref = getCategoriasRef();
  if (!ref) {
    contenedor.innerHTML = '<p style="text-align:center; color:var(--perfect-rose);">Usuario no autenticado</p>';
    return;
  }

  unsubscribeCategorias = ref.orderBy('fechaCreacion', 'asc').onSnapshot((snapshot) => {
    if (snapshot.empty) {
      contenedor.innerHTML = `<p style="grid-column: 1 / -1; text-align: center; color: var(--perfect-rose);">No hay categorías. ¡Añade una!</p>`;
      return;
    }
    let html = '';
    snapshot.forEach(doc => {
      const data = doc.data();
      const id = doc.id;
      const tieneImagen = data.imagen && data.imagen.startsWith('data:image');
      const estiloFondo = tieneImagen ? `background-image: url('${data.imagen}');` : '';
      const claseImagen = tieneImagen ? 'con-imagen' : '';
      html += `
        <div class="categoria ${claseImagen}" style="${estiloFondo}" data-id="${id}">
          <div class="categoria-footer">
            <span>${data.nombre}</span>
            <button class="btn-eliminar" data-id="${id}" aria-label="Eliminar">✕</button>
          </div>
        </div>
      `;
    });
    contenedor.innerHTML = html;

    document.querySelectorAll('.btn-eliminar').forEach(btn => {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        const id = this.dataset.id;
        if (confirm('¿Eliminar esta categoría?')) {
          getCategoriasRef().doc(id).delete().catch(error => {
            console.error('Error al eliminar:', error);
            alert('Error al eliminar: ' + error.message);
          });
        }
      });
    });
  }, (error) => {
    console.error('Error en tiempo real:', error);
    contenedor.innerHTML = `<p style="color:red;">Error de conexión: ${error.message}</p>`;
  });
}

function agregarCategoria(nombre, imagenBase64) {
  const ref = getCategoriasRef();
  if (!ref) return;
  ref.add({
    nombre: nombre.trim(),
    imagen: imagenBase64 || '',
    fechaCreacion: firebase.firestore.FieldValue.serverTimestamp()
  }).catch(error => {
    console.error('Error al agregar:', error);
    alert('Error al guardar: ' + error.message);
  });
}

// =====================================================
// 7. MANEJO DEL MODAL
// =====================================================
function abrirModal() {
  modalCategoria.classList.remove('hidden');
  nombreCategoria.value = '';
  imagenCategoria.value = '';
  setTimeout(() => nombreCategoria.focus(), 100);
}

function cerrarModal() {
  modalCategoria.classList.add('hidden');
  formCategoria.reset();
}

formCategoria.addEventListener('submit', function(e) {
  e.preventDefault();
  const nombre = nombreCategoria.value.trim();
  if (!nombre) { alert('El nombre es obligatorio'); return; }
  const file = imagenCategoria.files[0];
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
});

modalCancel.addEventListener('click', cerrarModal);
modalCategoria.addEventListener('click', (e) => {
  if (e.target === modalCategoria) cerrarModal();
});
dockAddBtn.addEventListener('click', abrirModal);

// =====================================================
// 8. CONTROL DE SESIÓN (onAuthStateChanged)
// =====================================================
auth.onAuthStateChanged(user => {
  if (unsubscribeCategorias) {
    unsubscribeCategorias();
    unsubscribeCategorias = null;
  }
  currentUser = user;
  if (user) {
    pageAuth.classList.add('hidden-page');
    pageCategorias.classList.remove('hidden-page');
    userNameSpan.textContent = user.displayName || user.email || 'Usuario';
    suscribirCategorias();
  } else {
    pageAuth.classList.remove('hidden-page');
    pageCategorias.classList.add('hidden-page');
    contenedor.innerHTML = '';
    userNameSpan.textContent = 'Invitado';
    authError.textContent = '';
  }
});

// =====================================================
// 9. EVENTOS DE LA UI (autenticación)
// =====================================================
authForm.addEventListener('submit', handleAuthSubmit);
authSwitchLink.addEventListener('click', toggleAuthMode);
btnGoogle.addEventListener('click', loginWithGoogle);
btnLogout.addEventListener('click', logout);

console.log('FINDORA con Firebase Auth y sincronización en tiempo real cargado.');