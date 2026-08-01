// =====================================================
// app.js - Navegación Robusta y Depuración de Clicks
// =====================================================

console.log("🚀 Cargando FINDORA...");

const firebaseConfig = {
  apiKey: "AIzaSyDfIQXFFDGoBMvTIOT52nZGVUc-pFJGFs4",
  authDomain: "hogar-e266a.firebaseapp.com",
  projectId: "hogar-e266a",
  storageBucket: "hogar-e266a.firebasestorage.app",
  messagingSenderId: "534168977173",
  appId: "1:534168977173:web:f3900fae93c7dd520b331c"
};

let app, auth, db, messaging;

try {
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
  auth = firebase.auth();
  db = firebase.firestore();
  messaging = firebase.messaging();
  console.log("✅ Firebase inicializado correctamente.");
} catch (err) {
  console.error("❌ ERROR CRÍTICO AL INICIALIZAR FIREBASE:", err);
}

// DOM ELEMENTS
const pageAuth = document.getElementById('page-auth');
const pageCategorias = document.getElementById('page-categorias');
const pageConfig = document.getElementById('page-config');
const pageFrutas = document.getElementById('page-frutas-verduras');
const pageCocina = document.getElementById('page-cocina');
const pageSalon = document.getElementById('page-salon');
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
const modalCategoria = document.getElementById('modalCategoria');
const formCategoria = document.getElementById('formCategoria');
const nombreCategoria = document.getElementById('nombreCategoria');
const imagenCategoria = document.getElementById('imagenCategoria');
const modalCancel = document.getElementById('modalCancel');
const dockAddBtn = document.getElementById('dockAddBtn');
const modalNickname = document.getElementById('modalNickname');
const formNickname = document.getElementById('formNickname');
const inputNickname = document.getElementById('inputNickname');
const modalNickCancel = document.getElementById('modalNickCancel');
const btnOpenNicknameModal = document.getElementById('btnOpenNicknameModal');
const btnOpenNotif = document.getElementById('btnOpenNotifications');
const modalNotif = document.getElementById('modalNotificaciones');
const notifList = document.getElementById('notifList');
const modalNotifClose = document.getElementById('modalNotifClose');
const btnClearNotifications = document.getElementById('btnClearNotifications');
const notifBadge = document.getElementById('notifBadge');
const toastContainer = document.getElementById('toastContainer');

// DOM ELEMENTS - EDITAR CATEGORÍA
const modalEditarCategoria = document.getElementById('modalEditarCategoria');
const formEditarCategoria = document.getElementById('formEditarCategoria');
const nombreEditarCategoria = document.getElementById('nombreEditarCategoria');
const imagenEditarCategoria = document.getElementById('imagenEditarCategoria');
const modalEditarCancel = document.getElementById('modalEditarCancel');
const btnEditarEliminar = document.getElementById('btnEditarEliminar');
let currentEditCategoryId = null;

// Variables de Configuración y Toggles
const darkModeToggle = document.getElementById('darkModeToggle');
const notifToggle = document.getElementById('notificationsToggle');

// Variables de Estado Globales
let isLogin = true;
let currentUser = null;
let unsubscribeCategorias = null;
let unsubscribeUser = null;
let unsubscribeNotif = null;
let currentNickname = null; 
let userNotificationsEnabled = true;
let settingsListenersAttached = false;
const processedToastIds = new Set();

// ==========================================
// 🆕 LÓGICA DE NAVEGACIÓN SPA (A PRUEBA DE FALLOS)
// ==========================================
let isNavigating = false; // Evita bucles

function switchPage(pageId, updateHistory = true) {
    // Si ya estamos navegando, salimos para evitar bucles
    if (isNavigating) return;
    isNavigating = true;
    
    console.log(`🔄 [SwitchPage] Cambiando a: ${pageId}`);

    // 1. Ocultar todas las páginas
    if (pageCategorias) pageCategorias.classList.add('hidden-page');
    if (pageConfig) pageConfig.classList.add('hidden-page');
    if (pageFrutas) pageFrutas.classList.add('hidden-page');
    if (pageCocina) pageCocina.classList.add('hidden-page');
    if (pageSalon) pageSalon.classList.add('hidden-page');
    
    // 2. Mostrar la página seleccionada y CARGAR SUS DATOS
    if (pageId === 'categorias' && pageCategorias) {
        pageCategorias.classList.remove('hidden-page');
    } else if (pageId === 'config' && pageConfig) {
        pageConfig.classList.remove('hidden-page');
        sincronizarTogglesUI();
    } else if (pageId === 'frutas-verduras' && pageFrutas) {
        pageFrutas.classList.remove('hidden-page');
        suscribirFrutas(); 
    } else if (pageId === 'cocina' && pageCocina) {
        pageCocina.classList.remove('hidden-page');
        suscribirCocinas(); 
    } else if (pageId === 'salon' && pageSalon) {
        pageSalon.classList.remove('hidden-page');
        suscribirSalones(); 
    }
    
    // 3. Actualizar el Dock visualmente
    dockItems.forEach(item => item.classList.remove('active'));
    const activeDock = document.querySelector(`.dock-item[data-page="${pageId}"]`);
    if (activeDock) activeDock.classList.add('active');

    // 4. Actualizar el hash de la URL (para que el botón de atrás funcione)
    if (updateHistory && pageId) {
        window.location.hash = pageId;
    }

    // Desbloquear navegación tras un pequeño retraso para que el DOM se estabilice
    setTimeout(() => {
        isNavigating = false;
    }, 100);
}

// Detectar el botón de "Atrás" del navegador
window.addEventListener('hashchange', () => {
    if (isNavigating) return;
    if (window.location.hash) {
        const pageId = window.location.hash.replace('#', '');
        if (pageId && document.getElementById('page-' + pageId)) {
            switchPage(pageId, false);
        }
    } else {
        // Si se borra el hash, vuelve a categorías
        if (pageCategorias && pageCategorias.classList.contains('hidden-page')) {
            switchPage('categorias', false);
        }
    }
});

// ==========================================
// EVENTOS DEL DOCK (CON DEPURACIÓN)
// ==========================================
dockItems.forEach(item => {
    item.addEventListener('click', function() {
        const page = this.dataset.page;
        console.log(`👆 [Dock Click] Botón presionado: ${page}`);
        if (page) {
            switchPage(page);
        } else {
            console.error("El botón del dock no tiene atributo data-page");
        }
    });
});

// ==========================================
// CONFIGURACIÓN
// ==========================================
function sincronizarTogglesUI() {
  const savedDark = localStorage.getItem('darkMode');
  if (savedDark === 'true') { darkModeToggle.checked = true; document.body.classList.add('dark-mode'); } 
  else { darkModeToggle.checked = false; document.body.classList.remove('dark-mode'); }
  if (notifToggle) notifToggle.checked = userNotificationsEnabled;

  if (!settingsListenersAttached) {
    darkModeToggle.addEventListener('change', () => {
      localStorage.setItem('darkMode', darkModeToggle.checked);
      document.body.classList.toggle('dark-mode', darkModeToggle.checked);
    });
    notifToggle.addEventListener('change', () => {
      if (currentUser) {
        const userRef = db.collection('usuarios').doc(currentUser.uid);
        userRef.set({ notificationsEnabled: notifToggle.checked }, { merge: true }).catch(err => {
          console.error("Error al guardar preferencia de notificaciones:", err);
          notifToggle.checked = userNotificationsEnabled;
          alert("No se pudo guardar la preferencia. Revisa tu conexión.");
        });
      }
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
  if (!email || !password) { authError.textContent = 'Por favor, completa el correo y la contraseña.'; return; }
  authError.textContent = 'Cargando...';
  try {
    if (isLogin) { await auth.signInWithEmailAndPassword(email, password); } 
    else { await auth.createUserWithEmailAndPassword(email, password); }
  } catch (error) {
    console.error("❌ Error en handleAuthSubmit:", error);
    if (error.code === 'auth/email-already-in-use') authError.textContent = 'Este correo ya está registrado.';
    else if (error.code === 'auth/user-not-found') authError.textContent = 'Usuario no encontrado.';
    else if (error.code === 'auth/wrong-password') authError.textContent = 'Contraseña incorrecta.';
    else authError.textContent = error.message || "Error al conectar con Firebase.";
  }
}

async function loginWithGoogle() {
  try {
    const provider = new firebase.auth.GoogleAuthProvider();
    await auth.signInWithPopup(provider);
  } catch (error) {
    console.error("❌ Error en loginWithGoogle:", error);
    authError.textContent = error.message || "Error al iniciar con Google.";
  }
}

function logout() { auth.signOut(); }

// ==========================================
// SOLICITUD DE PERMISOS PARA NOTIFICACIONES PUSH
// ==========================================
async function requestNotificationPermission() {
  if (!('Notification' in window) || !currentUser) return;
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const token = await messaging.getToken({ vapidKey: 'TU_VAPID_KEY_AQUI' });
      const userRef = db.collection('usuarios').doc(currentUser.uid);
      await userRef.set({ fcmTokens: firebase.firestore.FieldValue.arrayUnion(token) }, { merge: true });
      console.log("📲 Token push guardado en Firestore:", token);
    } else { console.warn("⚠️ Permiso de notificaciones denegado por el usuario."); }
  } catch (error) { console.error("❌ Error al solicitar o guardar el token de notificaciones:", error); }
}

// ==========================================
// CATEGORÍAS (El resto del código se mantiene igual)
// ==========================================
function getCategoriasRef() { return db.collection('categorias_compartidas'); }

function suscribirCategorias() {
  if (unsubscribeCategorias) { unsubscribeCategorias(); unsubscribeCategorias = null; }
  const ref = getCategoriasRef();
  unsubscribeCategorias = ref.orderBy('fechaCreacion', 'asc').onSnapshot((snapshot) => {
    if (snapshot.empty) { contenedor.innerHTML = `<p style="grid-column: 1 / -1; text-align: center; color: var(--perfect-rose);">No hay categorías compartidas. ¡Añade la primera!</p>`; return; }
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

    document.querySelectorAll('.categoria').forEach(card => {
      card.addEventListener('click', function(e) {
        if (e.target.closest('.btn-editar')) return;
        const nombreCat = this.dataset.nombre.toLowerCase();
        if (nombreCat.includes('fruta') || nombreCat.includes('verdura')) {
          switchPage('frutas-verduras');
        } else if (nombreCat === 'cocina') {
          switchPage('cocina');
        } else if (nombreCat === 'salón' || nombreCat === 'salon') {
          switchPage('salon');
        } else {
            alert(`Próximamente: ${this.dataset.nombre}`);
        }
      });
    });

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

let isSavingCategory = false;
function agregarCategoria(nombre, imagenBase64) {
  if (isSavingCategory) return;
  isSavingCategory = true;
  const ref = getCategoriasRef();
  const nombreMostrar = currentNickname || (currentUser ? currentUser.email : 'Invitado');
  ref.add({
    nombre: nombre.trim(),
    imagen: imagenBase64 || '',
    agregadoPor: nombreMostrar, 
    fechaCreacion: firebase.firestore.FieldValue.serverTimestamp()
  }).then(() => {
    notificarNuevaCategoria(nombre, nombreMostrar);
    isSavingCategory = false;
  }).catch(error => {
    console.error('Error al agregar categoria:', error);
    if (error.code === 'permission-denied') alert("⚠️ ERROR DE PERMISOS. Revisa las reglas de Firestore.");
    else alert('Error al guardar: ' + error.message);
    isSavingCategory = false;
  });
}

// ==========================================
// LÓGICA PARA EDITAR CATEGORÍAS
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
  const submitBtn = this.querySelector('button[type="submit"]');
  if (submitBtn) submitBtn.disabled = true;
  const nombre = nombreEditarCategoria.value.trim();
  if (!nombre) { alert("El nombre no puede estar vacío."); if (submitBtn) submitBtn.disabled = false; return; }
  const file = imagenEditarCategoria.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (event) => { actualizarCategoria(currentEditCategoryId, nombre, event.target.result); if (submitBtn) submitBtn.disabled = false; };
    reader.readAsDataURL(file);
  } else { actualizarCategoria(currentEditCategoryId, nombre, null); if (submitBtn) submitBtn.disabled = false; }
});

modalEditarCancel.addEventListener('click', cerrarModalEditarCategoria);
modalEditarCategoria.addEventListener('click', (e) => { if (e.target === modalEditarCategoria) cerrarModalEditarCategoria(); });

// ==========================================
// 🛒 LÓGICA DE FRUTAS Y VERDURAS
// ==========================================
function getFrutasRef() { return db.collection('frutas_compartidas'); }
function getCarritoFrutasRef() { return db.collection('carrito_frutas'); }

let unsubscribeFrutas = null;
let unsubscribeCarritoFrutas = null;
let fvCurrentProduct = null;
let fvCurrentQuantity = 1;

function suscribirFrutas() {
  if (unsubscribeFrutas) { unsubscribeFrutas(); unsubscribeFrutas = null; }
  if (unsubscribeCarritoFrutas) { unsubscribeCarritoFrutas(); unsubscribeCarritoFrutas = null; }
  const ref = getFrutasRef();
  unsubscribeFrutas = ref.orderBy('fechaCreacion', 'asc').onSnapshot((snapshot) => {
    const grid = document.getElementById('product-grid-frutas');
    if (snapshot.empty) { grid.innerHTML = `<div class="empty-state-tienda">No hay productos aún. ¡Añade uno con el botón +!</div>`; return; }
    let html = '';
    snapshot.forEach(doc => {
      const data = doc.data();
      const id = doc.id;
      const tieneImagen = data.imagen && data.imagen.startsWith('data:image');
      const imgHtml = tieneImagen ? `<img src="${data.imagen}" alt="${data.nombre}" class="product-image" onerror="this.src='https://via.placeholder.com/100?text=Producto'">` : `<div style="height:90px; display:flex; align-items:center; justify-content:center; color:#888;">Sin imagen</div>`;
      html += `
        <div class="product-card-tienda">
          <span class="heart-icon">♡</span>
          ${imgHtml}
          <span class="product-name">${data.nombre}</span>
          <div class="card-footer">
            <span class="price">₹ ${data.precio}</span>
            <button class="btn-comprar-tienda" data-id="${id}">COMPRAR</button>
          </div>
        </div>
      `;
    });
    grid.innerHTML = html;
    
    document.querySelectorAll('#product-grid-frutas .btn-comprar-tienda').forEach(btn => {
      btn.addEventListener('click', function() {
        const id = this.dataset.id;
        getFrutasRef().doc(id).get().then((docSnap) => {
          if (docSnap.exists) {
            const product = docSnap.data();
            abrirModalCompra('frutas', { id: docSnap.id, name: product.nombre, price: product.precio, image: product.imagen });
          }
        });
      });
    });
  }, (error) => { console.error('Error en tiempo real de frutas:', error); });
}

// ==========================================
// 🛒 LÓGICA DE COCINA
// ==========================================
function getCocinasRef() { return db.collection('cocinas_compartidas'); }
function getCarritoCocinaRef() { return db.collection('carrito_cocina'); }

let unsubscribeCocinas = null;
let unsubscribeCarritoCocina = null;
let cocinaCurrentProduct = null;
let cocinaCurrentQuantity = 1;

function suscribirCocinas() {
  if (unsubscribeCocinas) { unsubscribeCocinas(); unsubscribeCocinas = null; }
  if (unsubscribeCarritoCocina) { unsubscribeCarritoCocina(); unsubscribeCarritoCocina = null; }
  const ref = getCocinasRef();
  unsubscribeCocinas = ref.orderBy('fechaCreacion', 'asc').onSnapshot((snapshot) => {
    const grid = document.getElementById('product-grid-cocina');
    if (snapshot.empty) { grid.innerHTML = `<div class="empty-state-tienda">No hay productos aún. ¡Añade uno con el botón +!</div>`; return; }
    let html = '';
    snapshot.forEach(doc => {
      const data = doc.data();
      const id = doc.id;
      const tieneImagen = data.imagen && data.imagen.startsWith('data:image');
      const imgHtml = tieneImagen ? `<img src="${data.imagen}" alt="${data.nombre}" class="product-image" onerror="this.src='https://via.placeholder.com/100?text=Producto'">` : `<div style="height:90px; display:flex; align-items:center; justify-content:center; color:#888;">Sin imagen</div>`;
      html += `
        <div class="product-card-tienda">
          <span class="heart-icon">♡</span>
          ${imgHtml}
          <span class="product-name">${data.nombre}</span>
          <div class="card-footer">
            <span class="price">₹ ${data.precio}</span>
            <button class="btn-comprar-tienda" data-id="${id}">COMPRAR</button>
          </div>
        </div>
      `;
    });
    grid.innerHTML = html;
    
    document.querySelectorAll('#product-grid-cocina .btn-comprar-tienda').forEach(btn => {
      btn.addEventListener('click', function() {
        const id = this.dataset.id;
        getCocinasRef().doc(id).get().then((docSnap) => {
          if (docSnap.exists) {
            const product = docSnap.data();
            abrirModalCompra('cocina', { id: docSnap.id, name: product.nombre, price: product.precio, image: product.imagen });
          }
        });
      });
    });
  }, (error) => { console.error('Error en tiempo real de cocina:', error); });
}

// ==========================================
// 🛒 LÓGICA DE SALÓN
// ==========================================
function getSalonesRef() { return db.collection('salones_compartidas'); }
function getCarritoSalonRef() { return db.collection('carrito_salon'); }

let unsubscribeSalones = null;
let unsubscribeCarritoSalon = null;
let salonCurrentProduct = null;
let salonCurrentQuantity = 1;

function suscribirSalones() {
  if (unsubscribeSalones) { unsubscribeSalones(); unsubscribeSalones = null; }
  if (unsubscribeCarritoSalon) { unsubscribeCarritoSalon(); unsubscribeCarritoSalon = null; }
  const ref = getSalonesRef();
  unsubscribeSalones = ref.orderBy('fechaCreacion', 'asc').onSnapshot((snapshot) => {
    const grid = document.getElementById('product-grid-salon');
    if (snapshot.empty) { grid.innerHTML = `<div class="empty-state-tienda">No hay productos aún. ¡Añade uno con el botón +!</div>`; return; }
    let html = '';
    snapshot.forEach(doc => {
      const data = doc.data();
      const id = doc.id;
      const tieneImagen = data.imagen && data.imagen.startsWith('data:image');
      const imgHtml = tieneImagen ? `<img src="${data.imagen}" alt="${data.nombre}" class="product-image" onerror="this.src='https://via.placeholder.com/100?text=Producto'">` : `<div style="height:90px; display:flex; align-items:center; justify-content:center; color:#888;">Sin imagen</div>`;
      html += `
        <div class="product-card-tienda">
          <span class="heart-icon">♡</span>
          ${imgHtml}
          <span class="product-name">${data.nombre}</span>
          <div class="card-footer">
            <span class="price">₹ ${data.precio}</span>
            <button class="btn-comprar-tienda" data-id="${id}">COMPRAR</button>
          </div>
        </div>
      `;
    });
    grid.innerHTML = html;
    
    document.querySelectorAll('#product-grid-salon .btn-comprar-tienda').forEach(btn => {
      btn.addEventListener('click', function() {
        const id = this.dataset.id;
        getSalonesRef().doc(id).get().then((docSnap) => {
          if (docSnap.exists) {
            const product = docSnap.data();
            abrirModalCompra('salon', { id: docSnap.id, name: product.nombre, price: product.precio, image: product.imagen });
          }
        });
      });
    });
  }, (error) => { console.error('Error en tiempo real de salón:', error); });
}

// ==========================================
// LÓGICA UNIFICADA DE COMPRA Y CARRITO (APLICADA A LAS 3 TIENDAS)
// ==========================================
function abrirModalCompra(tienda, product) {
  if (tienda === 'frutas') {
    fvCurrentProduct = product;
    fvCurrentQuantity = 1;
    document.getElementById('modal-product-name-frutas').textContent = product.name;
    document.getElementById('modal-quantity-frutas').textContent = fvCurrentQuantity;
    document.getElementById('purchase-modal-frutas').classList.remove('hidden');
  } else if (tienda === 'cocina') {
    cocinaCurrentProduct = product;
    cocinaCurrentQuantity = 1;
    document.getElementById('modal-product-name-cocina').textContent = product.name;
    document.getElementById('modal-quantity-cocina').textContent = cocinaCurrentQuantity;
    document.getElementById('purchase-modal-cocina').classList.remove('hidden');
  } else if (tienda === 'salon') {
    salonCurrentProduct = product;
    salonCurrentQuantity = 1;
    document.getElementById('modal-product-name-salon').textContent = product.name;
    document.getElementById('modal-quantity-salon').textContent = salonCurrentQuantity;
    document.getElementById('purchase-modal-salon').classList.remove('hidden');
  }
}

function cerrarModalCompra(tienda) {
  if (tienda === 'frutas') {
    document.getElementById('purchase-modal-frutas').classList.add('hidden');
    fvCurrentProduct = null;
  } else if (tienda === 'cocina') {
    document.getElementById('purchase-modal-cocina').classList.add('hidden');
    cocinaCurrentProduct = null;
  } else if (tienda === 'salon') {
    document.getElementById('purchase-modal-salon').classList.add('hidden');
    salonCurrentProduct = null;
  }
}

function suscribirCarritos() {
  // FRUTAS
  const refFrutas = getCarritoFrutasRef();
  unsubscribeCarritoFrutas = refFrutas.onSnapshot((snapshot) => {
    let html = '<p style="color: var(--perfect-rose); text-align: center; padding: 20px 0;">El carrito está vacío.</p>';
    let total = 0;
    let count = 0;
    snapshot.forEach(doc => {
      const data = doc.data();
      total += data.precio * data.cantidad;
      count += data.cantidad;
      html += `
        <div class="cart-item">
          <div class="cart-item-info"><span class="cart-item-name">${data.nombre}</span><span class="cart-item-price">₹ ${data.precio}</span><span class="cart-item-qty">Cantidad: ${data.cantidad}</span></div>
          <div class="cart-item-actions"><button class="btn-remove-cart" data-ref="carrito_frutas" data-id="${doc.id}">🗑️</button></div>
        </div>
      `;
    });
    document.getElementById('cartListFrutas').innerHTML = html;
    document.getElementById('cartTotalFrutas').textContent = `Total: ₹ ${total}`;
    const badge = document.getElementById('cartBadgeFrutas');
    if (count > 0) { badge.textContent = count > 9 ? '9+' : count; badge.classList.add('visible'); } else { badge.classList.remove('visible'); }
  });

  // COCINA
  const refCocina = getCarritoCocinaRef();
  unsubscribeCarritoCocina = refCocina.onSnapshot((snapshot) => {
    let html = '<p style="color: var(--perfect-rose); text-align: center; padding: 20px 0;">El carrito está vacío.</p>';
    let total = 0;
    let count = 0;
    snapshot.forEach(doc => {
      const data = doc.data();
      total += data.precio * data.cantidad;
      count += data.cantidad;
      html += `
        <div class="cart-item">
          <div class="cart-item-info"><span class="cart-item-name">${data.nombre}</span><span class="cart-item-price">₹ ${data.precio}</span><span class="cart-item-qty">Cantidad: ${data.cantidad}</span></div>
          <div class="cart-item-actions"><button class="btn-remove-cart" data-ref="carrito_cocina" data-id="${doc.id}">🗑️</button></div>
        </div>
      `;
    });
    document.getElementById('cartListCocina').innerHTML = html;
    document.getElementById('cartTotalCocina').textContent = `Total: ₹ ${total}`;
    const badge = document.getElementById('cartBadgeCocina');
    if (count > 0) { badge.textContent = count > 9 ? '9+' : count; badge.classList.add('visible'); } else { badge.classList.remove('visible'); }
  });

  // SALÓN
  const refSalon = getCarritoSalonRef();
  unsubscribeCarritoSalon = refSalon.onSnapshot((snapshot) => {
    let html = '<p style="color: var(--perfect-rose); text-align: center; padding: 20px 0;">El carrito está vacío.</p>';
    let total = 0;
    let count = 0;
    snapshot.forEach(doc => {
      const data = doc.data();
      total += data.precio * data.cantidad;
      count += data.cantidad;
      html += `
        <div class="cart-item">
          <div class="cart-item-info"><span class="cart-item-name">${data.nombre}</span><span class="cart-item-price">₹ ${data.precio}</span><span class="cart-item-qty">Cantidad: ${data.cantidad}</span></div>
          <div class="cart-item-actions"><button class="btn-remove-cart" data-ref="carrito_salon" data-id="${doc.id}">🗑️</button></div>
        </div>
      `;
    });
    document.getElementById('cartListSalon').innerHTML = html;
    document.getElementById('cartTotalSalon').textContent = `Total: ₹ ${total}`;
    const badge = document.getElementById('cartBadgeSalon');
    if (count > 0) { badge.textContent = count > 9 ? '9+' : count; badge.classList.add('visible'); } else { badge.classList.remove('visible'); }
  });

  // EVENTOS PARA ELIMINAR DEL CARRITO (se ejecuta cada vez que se renderiza el carrito)
  document.addEventListener('click', function(e) {
    if (e.target.classList.contains('btn-remove-cart')) {
      if (confirm('¿Quieres eliminar este producto del carrito?')) {
        const refName = e.target.dataset.ref;
        const id = e.target.dataset.id;
        let ref;
        if (refName === 'carrito_frutas') ref = getCarritoFrutasRef().doc(id);
        else if (refName === 'carrito_cocina') ref = getCarritoCocinaRef().doc(id);
        else if (refName === 'carrito_salon') ref = getCarritoSalonRef().doc(id);
        if (ref) ref.delete().catch(err => console.error("Error al eliminar del carrito:", err));
      }
    }
  });
}

function agregarAlCarrito(tienda, producto, cantidad) {
  let ref;
  if (tienda === 'frutas') ref = getCarritoFrutasRef();
  else if (tienda === 'cocina') ref = getCarritoCocinaRef();
  else if (tienda === 'salon') ref = getCarritoSalonRef();
  
  ref.where('nombre', '==', producto.name).get().then((snapshot) => {
    let batch = db.batch();
    let existe = false;
    snapshot.forEach(doc => {
      existe = true;
      batch.update(doc.ref, { cantidad: doc.data().cantidad + cantidad });
    });
    if (!existe) {
      const nuevoItemRef = ref.doc();
      batch.set(nuevoItemRef, {
        nombre: producto.name, precio: producto.price, imagen: producto.image || '', cantidad: cantidad,
        fechaCreacion: firebase.firestore.FieldValue.serverTimestamp()
      });
    }
    batch.commit().then(() => {
      cerrarModalCompra(tienda);
    }).catch(error => {
      console.error("Error al agregar al carrito:", error);
      alert("Hubo un error al agregar el producto al carrito.");
    });
  });
}

// CONFIGURACIÓN DE BOTONES DE COMPRA Y CARRITO
document.getElementById('btn-confirm-purchase-frutas').addEventListener('click', function() {
  if (fvCurrentProduct) agregarAlCarrito('frutas', fvCurrentProduct, fvCurrentQuantity);
});
document.getElementById('btn-confirm-purchase-cocina').addEventListener('click', function() {
  if (cocinaCurrentProduct) agregarAlCarrito('cocina', cocinaCurrentProduct, cocinaCurrentQuantity);
});
document.getElementById('btn-confirm-purchase-salon').addEventListener('click', function() {
  if (salonCurrentProduct) agregarAlCarrito('salon', salonCurrentProduct, salonCurrentQuantity);
});

// CERRAR MODALES DE COMPRA
document.querySelectorAll('#purchase-modal-frutas .btn-close-modal-frutas, #purchase-modal-frutas').forEach(el => {
  el.addEventListener('click', function(e) { if (e.target === this || e.target.classList.contains('btn-close-modal-frutas')) cerrarModalCompra('frutas'); });
});
document.querySelectorAll('#purchase-modal-cocina .btn-close-modal-cocina, #purchase-modal-cocina').forEach(el => {
  el.addEventListener('click', function(e) { if (e.target === this || e.target.classList.contains('btn-close-modal-cocina')) cerrarModalCompra('cocina'); });
});
document.querySelectorAll('#purchase-modal-salon .btn-close-modal-salon, #purchase-modal-salon').forEach(el => {
  el.addEventListener('click', function(e) { if (e.target === this || e.target.classList.contains('btn-close-modal-salon')) cerrarModalCompra('salon'); });
});

// INCREMENTAR Y DECREMENTAR CANTIDAD
document.getElementById('btn-increment-frutas').addEventListener('click', function() { fvCurrentQuantity++; document.getElementById('modal-quantity-frutas').textContent = fvCurrentQuantity; });
document.getElementById('btn-decrement-frutas').addEventListener('click', function() { if (fvCurrentQuantity > 1) { fvCurrentQuantity--; document.getElementById('modal-quantity-frutas').textContent = fvCurrentQuantity; } });
document.getElementById('btn-increment-cocina').addEventListener('click', function() { cocinaCurrentQuantity++; document.getElementById('modal-quantity-cocina').textContent = cocinaCurrentQuantity; });
document.getElementById('btn-decrement-cocina').addEventListener('click', function() { if (cocinaCurrentQuantity > 1) { cocinaCurrentQuantity--; document.getElementById('modal-quantity-cocina').textContent = cocinaCurrentQuantity; } });
document.getElementById('btn-increment-salon').addEventListener('click', function() { salonCurrentQuantity++; document.getElementById('modal-quantity-salon').textContent = salonCurrentQuantity; });
document.getElementById('btn-decrement-salon').addEventListener('click', function() { if (salonCurrentQuantity > 1) { salonCurrentQuantity--; document.getElementById('modal-quantity-salon').textContent = salonCurrentQuantity; } });

// ABRIR MODALES DE CARRITO
document.getElementById('btnOpenCartFrutas').addEventListener('click', () => { document.getElementById('modalCarritoFrutas').classList.remove('hidden'); });
document.getElementById('modalCarritoFrutasClose').addEventListener('click', () => { document.getElementById('modalCarritoFrutas').classList.add('hidden'); });
document.getElementById('modalCarritoFrutas').addEventListener('click', (e) => { if (e.target === e.currentTarget) e.currentTarget.classList.add('hidden'); });

document.getElementById('btnOpenCartCocina').addEventListener('click', () => { document.getElementById('modalCarritoCocina').classList.remove('hidden'); });
document.getElementById('modalCarritoCocinaClose').addEventListener('click', () => { document.getElementById('modalCarritoCocina').classList.add('hidden'); });
document.getElementById('modalCarritoCocina').addEventListener('click', (e) => { if (e.target === e.currentTarget) e.currentTarget.classList.add('hidden'); });

document.getElementById('btnOpenCartSalon').addEventListener('click', () => { document.getElementById('modalCarritoSalon').classList.remove('hidden'); });
document.getElementById('modalCarritoSalonClose').addEventListener('click', () => { document.getElementById('modalCarritoSalon').classList.add('hidden'); });
document.getElementById('modalCarritoSalon').addEventListener('click', (e) => { if (e.target === e.currentTarget) e.currentTarget.classList.add('hidden'); });

// VOLVER ATRÁS EN LAS TIENDAS
document.getElementById('btn-back-frutas').addEventListener('click', () => switchPage('categorias'));
document.getElementById('btn-back-cocina').addEventListener('click', () => switchPage('categorias'));
document.getElementById('btn-back-salon').addEventListener('click', () => switchPage('categorias'));

// ==========================================
// BÚSQUEDA EN TIENDAS
// ==========================================
function setupSearch(inputId, containerId) {
  document.getElementById(inputId).addEventListener('input', function() {
    const text = this.value.toLowerCase();
    const cards = document.querySelectorAll(`#${containerId} .product-card-tienda`);
    cards.forEach(card => {
      const name = card.querySelector('.product-name').textContent.toLowerCase();
      card.style.display = name.includes(text) ? 'flex' : 'none';
    });
  });
}
setupSearch('search-input-frutas', 'product-grid-frutas');
setupSearch('search-input-cocina', 'product-grid-cocina');
setupSearch('search-input-salon', 'product-grid-salon');

// ==========================================
// BOTÓN + INTELIGENTE
// ==========================================
dockAddBtn.addEventListener('click', function() {
    if (!pageFrutas.classList.contains('hidden-page')) {
        document.getElementById('modalAddFrutas').classList.remove('hidden');
    } else if (!pageCocina.classList.contains('hidden-page')) {
        document.getElementById('modalAddCocina').classList.remove('hidden');
    } else if (!pageSalon.classList.contains('hidden-page')) {
        document.getElementById('modalAddSalon').classList.remove('hidden');
    } else {
        abrirModal();
    }
});

// ==========================================
// MODALES DE AÑADIR PRODUCTOS
// ==========================================
function cerrarAddModal(modalId, formId) {
  document.getElementById(modalId).classList.add('hidden');
  document.getElementById(formId).reset();
}

// Añadir Fruta
document.getElementById('modalAddFrutasCancel').addEventListener('click', () => cerrarAddModal('modalAddFrutas', 'formAddFrutas'));
document.getElementById('modalAddFrutas').addEventListener('click', (e) => { if (e.target === e.currentTarget) cerrarAddModal('modalAddFrutas', 'formAddFrutas'); });
document.getElementById('formAddFrutas').addEventListener('submit', function(e) {
  e.preventDefault();
  const btn = this.querySelector('button[type="submit"]'); if (btn) btn.disabled = true;
  const nombre = document.getElementById('nombreAddFrutas').value.trim();
  const precio = document.getElementById('precioAddFrutas').value.trim();
  if (!nombre || !precio) { alert('El nombre y el precio son obligatorios.'); if (btn) btn.disabled = false; return; }
  const file = document.getElementById('imagenAddFrutas').files[0];
  const ref = getFrutasRef();
  const nombreMostrar = currentNickname || (currentUser ? currentUser.email : 'Invitado');
  const precioNumerico = parseFloat(precio);
  if (isNaN(precioNumerico)) { alert("Por favor, ingresa un precio válido."); if (btn) btn.disabled = false; return; }
  if (file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      ref.add({ nombre: nombre.trim(), precio: precioNumerico, imagen: event.target.result || '', agregadoPor: nombreMostrar, fechaCreacion: firebase.firestore.FieldValue.serverTimestamp() })
      .then(() => { cerrarAddModal('modalAddFrutas', 'formAddFrutas'); if (btn) btn.disabled = false; })
      .catch(error => { alert('Error al guardar: ' + error.message); if (btn) btn.disabled = false; });
    };
    reader.readAsDataURL(file);
  } else {
    ref.add({ nombre: nombre.trim(), precio: precioNumerico, imagen: '', agregadoPor: nombreMostrar, fechaCreacion: firebase.firestore.FieldValue.serverTimestamp() })
    .then(() => { cerrarAddModal('modalAddFrutas', 'formAddFrutas'); if (btn) btn.disabled = false; })
    .catch(error => { alert('Error al guardar: ' + error.message); if (btn) btn.disabled = false; });
  }
});

// Añadir Producto Cocina
document.getElementById('modalAddCocinaCancel').addEventListener('click', () => cerrarAddModal('modalAddCocina', 'formAddCocina'));
document.getElementById('modalAddCocina').addEventListener('click', (e) => { if (e.target === e.currentTarget) cerrarAddModal('modalAddCocina', 'formAddCocina'); });
document.getElementById('formAddCocina').addEventListener('submit', function(e) {
  e.preventDefault();
  const btn = this.querySelector('button[type="submit"]'); if (btn) btn.disabled = true;
  const nombre = document.getElementById('nombreAddCocina').value.trim();
  const precio = document.getElementById('precioAddCocina').value.trim();
  if (!nombre || !precio) { alert('El nombre y el precio son obligatorios.'); if (btn) btn.disabled = false; return; }
  const file = document.getElementById('imagenAddCocina').files[0];
  const ref = getCocinasRef();
  const nombreMostrar = currentNickname || (currentUser ? currentUser.email : 'Invitado');
  const precioNumerico = parseFloat(precio);
  if (isNaN(precioNumerico)) { alert("Por favor, ingresa un precio válido."); if (btn) btn.disabled = false; return; }
  if (file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      ref.add({ nombre: nombre.trim(), precio: precioNumerico, imagen: event.target.result || '', agregadoPor: nombreMostrar, fechaCreacion: firebase.firestore.FieldValue.serverTimestamp() })
      .then(() => { cerrarAddModal('modalAddCocina', 'formAddCocina'); if (btn) btn.disabled = false; })
      .catch(error => { alert('Error al guardar: ' + error.message); if (btn) btn.disabled = false; });
    };
    reader.readAsDataURL(file);
  } else {
    ref.add({ nombre: nombre.trim(), precio: precioNumerico, imagen: '', agregadoPor: nombreMostrar, fechaCreacion: firebase.firestore.FieldValue.serverTimestamp() })
    .then(() => { cerrarAddModal('modalAddCocina', 'formAddCocina'); if (btn) btn.disabled = false; })
    .catch(error => { alert('Error al guardar: ' + error.message); if (btn) btn.disabled = false; });
  }
});

// Añadir Producto Salón
document.getElementById('modalAddSalonCancel').addEventListener('click', () => cerrarAddModal('modalAddSalon', 'formAddSalon'));
document.getElementById('modalAddSalon').addEventListener('click', (e) => { if (e.target === e.currentTarget) cerrarAddModal('modalAddSalon', 'formAddSalon'); });
document.getElementById('formAddSalon').addEventListener('submit', function(e) {
  e.preventDefault();
  const btn = this.querySelector('button[type="submit"]'); if (btn) btn.disabled = true;
  const nombre = document.getElementById('nombreAddSalon').value.trim();
  const precio = document.getElementById('precioAddSalon').value.trim();
  if (!nombre || !precio) { alert('El nombre y el precio son obligatorios.'); if (btn) btn.disabled = false; return; }
  const file = document.getElementById('imagenAddSalon').files[0];
  const ref = getSalonesRef();
  const nombreMostrar = currentNickname || (currentUser ? currentUser.email : 'Invitado');
  const precioNumerico = parseFloat(precio);
  if (isNaN(precioNumerico)) { alert("Por favor, ingresa un precio válido."); if (btn) btn.disabled = false; return; }
  if (file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      ref.add({ nombre: nombre.trim(), precio: precioNumerico, imagen: event.target.result || '', agregadoPor: nombreMostrar, fechaCreacion: firebase.firestore.FieldValue.serverTimestamp() })
      .then(() => { cerrarAddModal('modalAddSalon', 'formAddSalon'); if (btn) btn.disabled = false; })
      .catch(error => { alert('Error al guardar: ' + error.message); if (btn) btn.disabled = false; });
    };
    reader.readAsDataURL(file);
  } else {
    ref.add({ nombre: nombre.trim(), precio: precioNumerico, imagen: '', agregadoPor: nombreMostrar, fechaCreacion: firebase.firestore.FieldValue.serverTimestamp() })
    .then(() => { cerrarAddModal('modalAddSalon', 'formAddSalon'); if (btn) btn.disabled = false; })
    .catch(error => { alert('Error al guardar: ' + error.message); if (btn) btn.disabled = false; });
  }
});

// ==========================================
// NOTIFICACIONES INTERNAS
// ==========================================
function notificarNuevaCategoria(nombreCategoria, usuarioEmisor) {
  if (!currentUser) return; 
  const notifRef = db.collection('notificaciones_globales');
  notifRef.add({
    tipo: 'categoria_nueva',
    emisor_nick: usuarioEmisor,
    nombre_categoria: nombreCategoria,
    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    leido_por: [] 
  }).catch((error) => { console.error("Error al registrar notificación en Firestore:", error); });
}

function suscribirNotificaciones(user) {
  if (unsubscribeNotif) { unsubscribeNotif(); unsubscribeNotif = null; }
  const ref = db.collection('notificaciones_globales').orderBy('timestamp', 'desc');
  try {
    unsubscribeNotif = ref.onSnapshot((snapshot) => {
      try {
        let notificacionesPendientes = 0;
        let ultimaNotif = null;
        snapshot.forEach(doc => {
          const data = doc.data();
          if (!data.leido_por || !data.leido_por.includes(user.uid)) {
            notificacionesPendientes++;
            if (!ultimaNotif) ultimaNotif = { id: doc.id, data: data };
          }
        });
        if (userNotificationsEnabled) {
          if (notificacionesPendientes > 0) {
            notifBadge.textContent = notificacionesPendientes > 9 ? '9+' : notificacionesPendientes;
            notifBadge.classList.add('visible');
          } else { notifBadge.classList.remove('visible'); }
          if (ultimaNotif && notificacionesPendientes > 0) {
            if (!processedToastIds.has(ultimaNotif.id)) {
              mostrarToast(ultimaNotif.data);
              processedToastIds.add(ultimaNotif.id);
              if (processedToastIds.size > 50) processedToastIds.clear();
            }
          }
        } else { notifBadge.classList.remove('visible'); }
      } catch (innerError) { console.error("Error en el bucle de notificaciones:", innerError); }
    }, (error) => { console.error("Error al escuchar notificaciones internas:", error); });
  } catch (outerError) { console.error("Error al iniciar el listener de notificaciones internas:", outerError); }
}

function mostrarToast(data) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<h4>🔔 Nueva actividad</h4><p><strong>${data.emisor_nick || 'Alguien'}</strong> agregó la categoría <strong>"${data.nombre_categoria || 'sin nombre'}"</strong></p>`;
  toastContainer.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 100);
  setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 400); }, 4000);
}

async function limpiarTodasLasNotificaciones() {
  if (!currentUser) return;
  const ref = db.collection('notificaciones_globales');
  try {
    const snapshot = await ref.get();
    const batch = db.batch();
    let contador = 0;
    snapshot.forEach(doc => {
      const data = doc.data();
      if (!data.leido_por || !data.leido_por.includes(currentUser.uid)) {
        batch.update(doc.ref, { leido_por: firebase.firestore.FieldValue.arrayUnion(currentUser.uid) });
        contador++;
      }
    });
    if (contador > 0) { await batch.commit(); processedToastIds.clear(); abrirModalNotificaciones(); } else { abrirModalNotificaciones(); }
  } catch (error) { console.error("❌ Error al limpiar notificaciones:", error); alert("Hubo un error al intentar limpiar las notificaciones."); }
}

function abrirModalNotificaciones() {
  if (!currentUser) return;
  const ref = db.collection('notificaciones_globales').orderBy('timestamp', 'desc').limit(50);
  ref.get().then((snapshot) => {
    notifList.innerHTML = '';
    const notificacionesPendientes = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      if (!data.leido_por || !data.leido_por.includes(currentUser.uid)) {
        notificacionesPendientes.push({ id: doc.id, data: data });
      }
    });
    if (notificacionesPendientes.length === 0) { notifList.innerHTML = '<p style="color: var(--perfect-rose); text-align: center; padding: 20px 0;">No hay notificaciones nuevas.</p>'; } else {
      notificacionesPendientes.forEach(item => {
        const data = item.data;
        const div = document.createElement('div');
        div.className = 'notif-item unread';
        const fecha = data.timestamp ? data.timestamp.toDate().toLocaleString() : 'Recién';
        div.innerHTML = `<div><div class="msg"><strong>${data.emisor_nick || 'Alguien'}</strong> agregó <strong>"${data.nombre_categoria || 'sin nombre'}"</strong></div><div class="timestamp">${fecha}</div></div>`;
        notifList.appendChild(div);
      });
    }
    modalNotif.classList.remove('hidden');
  }).catch(error => { console.error("Error al cargar la lista de notificaciones:", error); });
}

// ==========================================
// PERFIL Y APODO
// ==========================================
function suscribirPerfil(user) {
  if (unsubscribeUser) { unsubscribeUser(); unsubscribeUser = null; }
  const userRef = db.collection('usuarios').doc(user.uid);
  unsubscribeUser = userRef.onSnapshot((doc) => {
    if (doc.exists) {
      const data = doc.data();
      if (data.apodo && data.apodo.trim() !== '') { currentNickname = data.apodo; userNameSpan.textContent = data.apodo; } 
      else { currentNickname = user.displayName || user.email; userNameSpan.textContent = currentNickname; }
      userNotificationsEnabled = data.notificationsEnabled !== undefined ? data.notificationsEnabled : true;
      if (!pageConfig.classList.contains('hidden-page') && notifToggle) { notifToggle.checked = userNotificationsEnabled; }
    } else { currentNickname = user.displayName || user.email; userNameSpan.textContent = currentNickname; userNotificationsEnabled = true; }
  }, (error) => { console.error("Error al obtener el perfil:", error); userNameSpan.textContent = user.displayName || user.email; });
}

function guardarApodo(nuevoApodo) {
  if (!currentUser) return;
  const userRef = db.collection('usuarios').doc(currentUser.uid);
  userRef.set({ apodo: nuevoApodo.trim() }, { merge: true })
  .then(() => { cerrarModalNickname(); })
  .catch((error) => { console.error("Error al guardar apodo:", error); alert("Hubo un error al guardar tu apodo: " + error.message); });
}

// ==========================================
// MODALES DE LA APP (Nueva, Apodo, Notificaciones)
// ==========================================
function abrirModal() { modalCategoria.classList.remove('hidden'); nombreCategoria.value = ''; imagenCategoria.value = ''; setTimeout(() => nombreCategoria.focus(), 100); }
function cerrarModal() { modalCategoria.classList.add('hidden'); formCategoria.reset(); }

formCategoria.addEventListener('submit', function(e) {
  e.preventDefault();
  const submitBtn = this.querySelector('button[type="submit"]');
  if (submitBtn) submitBtn.disabled = true;
  const nombre = nombreCategoria.value.trim();
  if (!nombre) { alert('El nombre es obligatorio'); if (submitBtn) submitBtn.disabled = false; return; }
  const file = imagenCategoria.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (event) => { agregarCategoria(nombre, event.target.result); cerrarModal(); if (submitBtn) submitBtn.disabled = false; };
    reader.readAsDataURL(file);
  } else { agregarCategoria(nombre, ''); cerrarModal(); if (submitBtn) submitBtn.disabled = false; }
});
modalCancel.addEventListener('click', cerrarModal);
modalCategoria.addEventListener('click', (e) => { if (e.target === modalCategoria) cerrarModal(); });

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

btnOpenNotif.addEventListener('click', abrirModalNotificaciones);
modalNotifClose.addEventListener('click', () => { modalNotif.classList.add('hidden'); });
modalNotif.addEventListener('click', (e) => { if (e.target === modalNotif) modalNotif.classList.add('hidden'); });
btnClearNotifications.addEventListener('click', limpiarTodasLasNotificaciones);

// ==========================================
// ESTADO DE SESIÓN
// ==========================================
auth.onAuthStateChanged(user => {
  if (unsubscribeCategorias) { unsubscribeCategorias(); unsubscribeCategorias = null; }
  if (unsubscribeFrutas) { unsubscribeFrutas(); unsubscribeFrutas = null; }
  if (unsubscribeCocinas) { unsubscribeCocinas(); unsubscribeCocinas = null; }
  if (unsubscribeSalones) { unsubscribeSalones(); unsubscribeSalones = null; }
  if (unsubscribeUser) { unsubscribeUser(); unsubscribeUser = null; }
  if (unsubscribeNotif) { unsubscribeNotif(); unsubscribeNotif = null; }
  
  currentUser = user;
  if (user) {
    console.log("✅ Usuario autenticado:", user.email);
    pageAuth.classList.add('hidden-page');
    
    // 🔥 Utilizamos el sistema de navegación por hash para la carga inicial
    const currentHash = window.location.hash.replace('#', '');
    const targetPage = (currentHash && document.getElementById('page-' + currentHash)) ? currentHash : 'categorias';
    switchPage(targetPage, true);
    
    suscribirPerfil(user);
    suscribirCategorias();
    suscribirNotificaciones(user);
    suscribirCarritos();
    requestNotificationPermission();
    
    if (dock) dock.classList.remove('hidden-page');
    sincronizarTogglesUI();
  } else {
    console.log("ℹ️ Usuario NO autenticado.");
    pageAuth.classList.remove('hidden-page');
    
    // Ocultar todas las secciones internas manualmente
    if (pageCategorias) pageCategorias.classList.add('hidden-page');
    if (pageConfig) pageConfig.classList.add('hidden-page');
    if (pageFrutas) pageFrutas.classList.add('hidden-page');
    if (pageCocina) pageCocina.classList.add('hidden-page');
    if (pageSalon) pageSalon.classList.add('hidden-page');
    
    contenedor.innerHTML = '';
    userNameSpan.textContent = 'Invitado';
    currentNickname = null;
    userNotificationsEnabled = true;
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

console.log('✅ App cargada. ¡Listo para pruebas!');