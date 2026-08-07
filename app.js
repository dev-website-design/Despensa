// =====================================================
// app.js - Versión 100% Estable con Edición Restaurada
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

// DOM ELEMENTS PRINCIPALES
const pageAuth = document.getElementById('page-auth');
const pageCategorias = document.getElementById('page-categorias');
const pageConfig = document.getElementById('page-config');
const dock = document.getElementById('mainDock');
const dockItems = document.querySelectorAll('.dock-item');
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
const dockAddBtn = document.getElementById('dockAddBtn');

// MODAL CATEGORÍA
const modalCategoria = document.getElementById('modalCategoria');
const formCategoria = document.getElementById('formCategoria');
const nombreCategoria = document.getElementById('nombreCategoria');
const imagenCategoria = document.getElementById('imagenCategoria');
const modalCancel = document.getElementById('modalCancel');

// MODAL EDITAR CATEGORÍA (El que estaba roto)
const modalEditarCategoria = document.getElementById('modalEditarCategoria');
const formEditarCategoria = document.getElementById('formEditarCategoria');
const nombreEditarCategoria = document.getElementById('nombreEditarCategoria');
const imagenEditarCategoria = document.getElementById('imagenEditarCategoria');
const modalEditarCancel = document.getElementById('modalEditarCancel');
const btnEditarEliminar = document.getElementById('btnEditarEliminar');
let currentEditCategoryId = null;

// MODALES DE CONFIGURACIÓN (Apodo, Notificaciones, etc.)
const modalNickname = document.getElementById('modalNickname');
const formNickname = document.getElementById('formNickname');
const inputNickname = document.getElementById('inputNickname');
const modalNickCancel = document.getElementById('modalNickCancel');
const btnOpenNicknameModal = document.getElementById('btnOpenNicknameModal');

// VARIABLES GLOBALES
let isLogin = true;
let currentUser = null;
let unsubscribeCategorias = null;
let currentNickname = null;

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
// CATEGORÍAS
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
        <div class="categoria ${claseImagen}" style="${estiloFondo}" data-id="${id}" data-nombre="${data.nombre}">
          <div class="categoria-footer">
            <span>${data.nombre}${agregadoPor}</span>
            <br>
            <button class="btn-editar" data-id="${id}" aria-label="Editar" style="background:none; border:none; color:var(--perfect-rose); cursor:pointer; font-size:1.1rem; margin-top:5px;">✏️</button>
          </div>
        </div>
      `;
    });
    contenedor.innerHTML = html;

    // 🚀 Clic en la categoría (para ir a tienda o lo que tengas configurado)
    document.querySelectorAll('.categoria').forEach(card => {
      card.addEventListener('click', function(e) {
        if (e.target.closest('.btn-editar')) return;
        const nombreCat = this.dataset.nombre.toLowerCase();
        alert(`Cargando tienda para: ${this.dataset.nombre}`);
      });
    });

    // 🚀 ESTO ES LO QUE ARREGLÉ: El botón de editar abre el modal real
    document.querySelectorAll('.btn-editar').forEach(btn => {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        const id = this.dataset.id;
        abrirModalEditarCategoria(id);
      });
    });
  }, (error) => {
    console.error('Error en tiempo real de categorías:', error);
    contenedor.innerHTML = `<p style="color:red;">Error de conexión. Revisa la consola (F12).</p>`;
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
    console.error('Error al agregar categoria:', error);
    if (error.code === 'permission-denied') {
      alert("⚠️ ERROR DE PERMISOS. Ve a Firebase > Firestore > Reglas y pega las reglas de seguridad colaborativas.");
    } else {
      alert('Error al guardar: ' + error.message);
    }
  });
}

// ==========================================
// LÓGICA RESTAURADA DE EDITAR CATEGORÍA
// ==========================================
function abrirModalEditarCategoria(id) {
  currentEditCategoryId = id;
  getCategoriasRef().doc(id).get().then((doc) => {
    if (doc.exists) {
      const data = doc.data();
      nombreEditarCategoria.value = data.nombre || '';
      imagenEditarCategoria.value = '';
      modalEditarCategoria.classList.remove('hidden');
      setTimeout(() => nombreEditarCategoria.focus(), 100);
    }
  }).catch(error => {
    console.error("Error al cargar la categoría para editar:", error);
    alert("No se pudo cargar la categoría para editar.");
  });
}

function cerrarModalEditarCategoria() {
  modalEditarCategoria.classList.add('hidden');
  formEditarCategoria.reset();
  currentEditCategoryId = null;
}

function actualizarCategoria(id, nuevoNombre, nuevaImagenBase64) {
  const ref = getCategoriasRef().doc(id);
  const updateData = {
    nombre: nuevoNombre.trim(),
    editadoPor: currentNickname || currentUser.email,
    editadoEn: firebase.firestore.FieldValue.serverTimestamp()
  };
  if (nuevaImagenBase64) { updateData.imagen = nuevaImagenBase64; }
  ref.update(updateData).then(() => { cerrarModalEditarCategoria(); }).catch(error => {
    console.error("Error al actualizar categoría:", error);
    alert("Error al guardar los cambios: " + error.message);
  });
}

btnEditarEliminar.addEventListener('click', function() {
  if (!currentEditCategoryId) return;
  if (confirm('¿Estás seguro de que quieres eliminar esta categoría?\nEsta acción no se puede deshacer.')) {
    getCategoriasRef().doc(currentEditCategoryId).delete().then(() => {
      console.log("🗑️ Categoría eliminada correctamente.");
      cerrarModalEditarCategoria();
    }).catch(error => {
      console.error('Error al eliminar la categoría:', error);
      alert('Error al eliminar: ' + error.message);
    });
  }
});

formEditarCategoria.addEventListener('submit', function(e) {
  e.preventDefault();
  if (!currentEditCategoryId) return;
  const nombre = nombreEditarCategoria.value.trim();
  if (!nombre) { alert("El nombre no puede estar vacío."); return; }
  const file = imagenEditarCategoria.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (event) => { actualizarCategoria(currentEditCategoryId, nombre, event.target.result); };
    reader.readAsDataURL(file);
  } else {
    actualizarCategoria(currentEditCategoryId, nombre, null);
  }
});
modalEditarCancel.addEventListener('click', cerrarModalEditarCategoria);
modalEditarCategoria.addEventListener('click', (e) => { if (e.target === modalEditarCategoria) cerrarModalEditarCategoria(); });

// ==========================================
// MODALES DE LA APP (Nueva, Apodo)
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
    reader.onload = (event) => { agregarCategoria(nombre, event.target.result); cerrarModal(); };
    reader.readAsDataURL(file);
  } else { agregarCategoria(nombre, ''); cerrarModal(); }
});
modalCancel.addEventListener('click', cerrarModal);
modalCategoria.addEventListener('click', (e) => { if (e.target === modalCategoria) cerrarModal(); });
dockAddBtn.addEventListener('click', abrirModal);

function abrirModalNickname() { modalNickname.classList.remove('hidden'); inputNickname.value = currentNickname || ''; setTimeout(() => inputNickname.focus(), 100); }
function cerrarModalNickname() { modalNickname.classList.add('hidden'); formNickname.reset(); }
formNickname.addEventListener('submit', function(e) {
  e.preventDefault();
  const nuevoApodo = inputNickname.value.trim();
  if (!nuevoApodo) { alert('El apodo no puede estar vacío'); return; }
  guardarApodo(nuevoApodo);
});
btnOpenNicknameModal.addEventListener('click', abrirModalNickname);
modalNickCancel.addEventListener('click', cerrarModalNickname);
modalNickname.addEventListener('click', (e) => { if (e.target === modalNickname) cerrarModalNickname(); });

function guardarApodo(nuevoApodo) {
  if (!currentUser) return;
  const userRef = db.collection('usuarios').doc(currentUser.uid);
  userRef.set({ apodo: nuevoApodo.trim() }, { merge: true })
  .then(() => { cerrarModalNickname(); })
  .catch((error) => { console.error("Error al guardar apodo:", error); alert("Hubo un error al guardar tu apodo: " + error.message); });
}

// ==========================================
// ESTADO DE SESIÓN
// ==========================================
auth.onAuthStateChanged(user => {
  if (unsubscribeCategorias) { unsubscribeCategorias(); unsubscribeCategorias = null; }

  currentUser = user;
  if (user) {
    pageAuth.classList.add('hidden-page');
    pageCategorias.classList.remove('hidden-page');
    // Cargar el nombre/apodo
    const userRef = db.collection('usuarios').doc(user.uid);
    userRef.get().then((doc) => {
      if (doc.exists && doc.data().apodo) {
        currentNickname = doc.data().apodo;
        userNameSpan.textContent = currentNickname;
      } else {
        currentNickname = user.displayName || user.email;
        userNameSpan.textContent = currentNickname;
      }
    }).catch((error) => {
      console.error("Error al obtener apodo:", error);
      userNameSpan.textContent = user.displayName || user.email;
    });

    if (dock) dock.classList.remove('hidden-page');
    suscribirCategorias();
  } else {
    pageAuth.classList.remove('hidden-page');
    pageCategorias.classList.add('hidden-page');
    contenedor.innerHTML = '';
    userNameSpan.textContent = 'Invitado';
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

console.log('✅ FINDORA cargado correctamente. Botón de editar restaurado.');