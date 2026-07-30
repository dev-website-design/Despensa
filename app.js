// =====================================================
// app.js - Modo COLABORATIVO con APODOS y Configuración
// =====================================================

const firebaseConfig = {
  apiKey: "AIzaSyDfIQXFFDGoBMvTIOT52nZGVUc-pFJGFs4",
  authDomain: "hogar-e266a.firebaseapp.com",
  projectId: "hogar-e266a",
  storageBucket: "hogar-e266a.firebasestorage.app",
  messagingSenderId: "534168977173",
  appId: "1:534168977173:web:f3900fae93c7dd520b331c"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();
const db = firebase.firestore();

// DOM ELEMENTS (Páginas y Dock)
const pageAuth = document.getElementById('page-auth');
const pageCategorias = document.getElementById('page-categorias');
const pageConfig = document.getElementById('page-config');
const dock = document.getElementById('mainDock');
const dockItems = document.querySelectorAll('.dock-item');

// DOM ELEMENTS (Formularios y demás)
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

// DOM ELEMENTS (Modal de Apodo)
const modalNickname = document.getElementById('modalNickname');
const formNickname = document.getElementById('formNickname');
const inputNickname = document.getElementById('inputNickname');
const modalNickCancel = document.getElementById('modalNickCancel');
const btnOpenNicknameModal = document.getElementById('btnOpenNicknameModal');

let isLogin = true;
let currentUser = null;
let unsubscribeCategorias = null;
let unsubscribeUser = null;
let currentNickname = null; 
let settingsListenersAttached = false; // Flag para no duplicar listeners

// ==========================================
// LÓGICA DE NAVEGACIÓN (Categorías / Configuración)
// ==========================================
function switchPage(pageId) {
  if (pageCategorias) pageCategorias.classList.add('hidden-page');
  if (pageConfig) pageConfig.classList.add('hidden-page');
  
  if (pageId === 'categorias' && pageCategorias) {
    pageCategorias.classList.remove('hidden-page');
  } else if (pageId === 'config' && pageConfig) {
    pageConfig.classList.remove('hidden-page');
    // Al entrar a Configuración, actualizamos el estado de los toggles
    initSettings();
  }

  dockItems.forEach(item => item.classList.remove('active'));
  const activeDock = document.querySelector(`.dock-item[data-page="${pageId}"]`);
  if (activeDock) activeDock.classList.add('active');
}

dockItems.forEach(item => {
  item.addEventListener('click', function() {
    const page = this.dataset.page;
    if (page) switchPage(page);
  });
});

// ==========================================
// CONFIGURACIÓN (MODO OSCURO y NOTIFICACIONES)
// ==========================================
function initSettings() {
    const darkToggle = document.getElementById('darkModeToggle');
    const notifToggle = document.getElementById('notificationsToggle');
    
    // Si los elementos no existen (no estamos en Configuración), salimos
    if(!darkToggle || !notifToggle) return;

    const savedDark = localStorage.getItem('darkMode');
    const savedNotif = localStorage.getItem('notifications');

    // Cargar el estado del Modo Oscuro
    if (savedDark === 'true') {
        darkToggle.checked = true;
        document.body.classList.add('dark-mode');
    } else {
        darkToggle.checked = false;
        document.body.classList.remove('dark-mode');
    }

    // Cargar el estado de Notificaciones
    if (savedNotif === 'false') {
        notifToggle.checked = false;
    } else {
        notifToggle.checked = true;
    }

    // Asignar los listeners solo la primera vez que se carga la página
    if (!settingsListenersAttached) {
        darkToggle.addEventListener('change', () => {
            localStorage.setItem('darkMode', darkToggle.checked);
            document.body.classList.toggle('dark-mode', darkToggle.checked);
        });
        
        notifToggle.addEventListener('change', () => {
            localStorage.setItem('notifications', notifToggle.checked);
        });
        
        settingsListenersAttached = true;
    }
}

// ==========================================
// AUTENTICACIÓN
// ==========================================
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

  if (!email || !password) {
    authError.textContent = 'Por favor, completa el correo y la contraseña.';
    return;
  }

  authError.textContent = 'Cargando...';
  try {
    if (isLogin) {
      await auth.signInWithEmailAndPassword(email, password);
    } else {
      await auth.createUserWithEmailAndPassword(email, password);
    }
  } catch (error) {
    console.error(error);
    if (error.code === 'auth/email-already-in-use') authError.textContent = 'Este correo ya está registrado.';
    else if (error.code === 'auth/user-not-found') authError.textContent = 'Usuario no encontrado.';
    else if (error.code === 'auth/wrong-password') authError.textContent = 'Contraseña incorrecta.';
    else authError.textContent = error.message;
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

function logout() { auth.signOut(); }

// ==========================================
// CATEGORÍAS (ESTRUCTURA COMPARTIDA)
// ==========================================
function getCategoriasRef() {
  return db.collection('categorias_compartidas');
}

function suscribirCategorias() {
  if (unsubscribeCategorias) { unsubscribeCategorias(); unsubscribeCategorias = null; }
  const ref = getCategoriasRef();
  
  unsubscribeCategorias = ref.orderBy('fechaCreacion', 'asc').onSnapshot((snapshot) => {
    if (snapshot.empty) {
      contenedor.innerHTML = `<p style="grid-column: 1 / -1; text-align: center; color: var(--perfect-rose);">No hay categorías compartidas. ¡Añade la primera!</p>`;
      return;
    }
    let html = '';
    snapshot.forEach(doc => {
      const data = doc.data();
      const id = doc.id;
      const tieneImagen = data.imagen && data.imagen.startsWith('data:image');
      const estiloFondo = tieneImagen ? `background-image: url('${data.imagen}');` : '';
      const claseImagen = tieneImagen ? 'con-imagen' : '';
      
      const agregadoPor = data.agregadoPor ? ` (por ${data.agregadoPor})` : '';

      html += `
        <div class="categoria ${claseImagen}" style="${estiloFondo}" data-id="${id}">
          <div class="categoria-footer">
            <span>${data.nombre}${agregadoPor}</span>
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
    contenedor.innerHTML = `<p style="color:red;">Error de conexión (Revisa reglas de Firestore): ${error.message}</p>`;
  });
}

function agregarCategoria(nombre, imagenBase64) {
  const ref = getCategoriasRef();
  const nombreMostrar = currentNickname || (currentUser ? currentUser.email : 'Invitado');

  ref.add({
    nombre: nombre.trim(),
    imagen: imagenBase64 || '',
    agregadoPor: nombreMostrar, 
    fechaCreacion: firebase.firestore.FieldValue.serverTimestamp()
  }).catch(error => {
    console.error('Error al agregar:', error);
    if (error.code === 'permission-denied') {
      alert("⚠️ ERROR DE PERMISOS. Ve a Firebase > Firestore > Reglas y pega las reglas de seguridad colaborativas.");
    } else {
      alert('Error al guardar: ' + error.message);
    }
  });
}

// ==========================================
// MANEJO DE APODO EN FIRESTORE
// ==========================================
function suscribirApodo(user) {
  if (unsubscribeUser) {
    unsubscribeUser();
    unsubscribeUser = null;
  }

  const userRef = db.collection('usuarios').doc(user.uid);
  
  unsubscribeUser = userRef.onSnapshot((doc) => {
    if (doc.exists) {
      const data = doc.data();
      if (data.apodo && data.apodo.trim() !== '') {
        currentNickname = data.apodo;
        userNameSpan.textContent = data.apodo; 
      } else {
        currentNickname = user.displayName || user.email;
        userNameSpan.textContent = currentNickname;
      }
    } else {
      currentNickname = user.displayName || user.email;
      userNameSpan.textContent = currentNickname;
    }
  }, (error) => {
    console.error("Error al obtener el apodo:", error);
    userNameSpan.textContent = user.displayName || user.email;
  });
}

function guardarApodo(nuevoApodo) {
  if (!currentUser) return;
  const userRef = db.collection('usuarios').doc(currentUser.uid);
  
  userRef.set({
    apodo: nuevoApodo.trim()
  }, { merge: true })
  .then(() => {
    cerrarModalNickname();
  })
  .catch((error) => {
    console.error("Error al guardar apodo:", error);
    alert("Hubo un error al guardar tu apodo: " + error.message);
  });
}

// ==========================================
// MODAL DE CATEGORÍAS
// ==========================================
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
modalCategoria.addEventListener('click', (e) => { if (e.target === modalCategoria) cerrarModal(); });
dockAddBtn.addEventListener('click', abrirModal);

// ==========================================
// MODAL DE APODO
// ==========================================
function abrirModalNickname() {
  modalNickname.classList.remove('hidden');
  inputNickname.value = currentNickname || '';
  setTimeout(() => inputNickname.focus(), 100);
}
function cerrarModalNickname() {
  modalNickname.classList.add('hidden');
  formNickname.reset();
}
formNickname.addEventListener('submit', function(e) {
  e.preventDefault();
  const nuevoApodo = inputNickname.value.trim();
  if (!nuevoApodo) { alert('El apodo no puede estar vacío'); return; }
  guardarApodo(nuevoApodo);
});
btnOpenNicknameModal.addEventListener('click', abrirModalNickname);
modalNickCancel.addEventListener('click', cerrarModalNickname);
modalNickname.addEventListener('click', (e) => { if (e.target === modalNickname) cerrarModalNickname(); });


// ==========================================
// ESTADO DE SESIÓN
// ==========================================
auth.onAuthStateChanged(user => {
  if (unsubscribeCategorias) { unsubscribeCategorias(); unsubscribeCategorias = null; }
  if (unsubscribeUser) { unsubscribeUser(); unsubscribeUser = null; }
  
  currentUser = user;
  if (user) {
    pageAuth.classList.add('hidden-page');
    pageCategorias.classList.remove('hidden-page');
    if (pageConfig) pageConfig.classList.add('hidden-page');
    
    suscribirApodo(user);
    suscribirCategorias();
    
    if (dock) dock.classList.remove('hidden-page');
    dockItems.forEach(item => item.classList.remove('active'));
    const activeItem = document.querySelector('.dock-item[data-page="categorias"]');
    if (activeItem) activeItem.classList.add('active');
    
    // Inicializar configuraciones al hacer login por si el usuario ya tenía el modo oscuro activado
    initSettings();

  } else {
    pageAuth.classList.remove('hidden-page');
    pageCategorias.classList.add('hidden-page');
    if (pageConfig) pageConfig.classList.add('hidden-page');
    contenedor.innerHTML = '';
    userNameSpan.textContent = 'Invitado';
    currentNickname = null;
    authError.textContent = '';

    if (dock) dock.classList.add('hidden-page');
  }
});

// ==========================================
// EVENTOS UI
// ==========================================
authForm.addEventListener('submit', handleAuthSubmit);
authSwitchLink.addEventListener('click', toggleAuthMode);
btnGoogle.addEventListener('click', loginWithGoogle);
btnLogout.addEventListener('click', logout);

// Inicializamos el modo oscuro apenas carga la página para que no parpadee
document.addEventListener('DOMContentLoaded', () => {
    initSettings();
});

console.log('FINDORA Colaborativo con Apodos y Configuración cargado.');