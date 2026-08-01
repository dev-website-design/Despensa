// =====================================================
// app.js - Editar Categorías (Lápiz ✏️) + Botón Eliminar
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

// DOM ELEMENTS - FRUTAS
const btnBackCategorias = document.getElementById('btn-back-categorias');
const fvSearchInput = document.getElementById('search-input-frutas');
const fvGrid = document.getElementById('product-grid-frutas');
const fvModal = document.getElementById('purchase-modal-fv');
const fvModalProductName = document.getElementById('modal-product-name-fv');
const fvModalQuantity = document.getElementById('modal-quantity-fv');
const fvBtnConfirm = document.getElementById('btn-confirm-purchase-fv');
const fvBtnClose = document.getElementById('btn-close-modal-fv');
const fvBtnInc = document.getElementById('btn-increment-fv');
const fvBtnDec = document.getElementById('btn-decrement-fv');

// DOM ELEMENTS - FRUTAS ADD
const modalFruta = document.getElementById('modalFruta');
const formFruta = document.getElementById('formFruta');
const nombreFruta = document.getElementById('nombreFruta');
const precioFruta = document.getElementById('precioFruta');
const imagenFruta = document.getElementById('imagenFruta');
const modalFrutaCancel = document.getElementById('modalFrutaCancel');

// DOM ELEMENTS - EDITAR CATEGORÍA
const modalEditarCategoria = document.getElementById('modalEditarCategoria');
const formEditarCategoria = document.getElementById('formEditarCategoria');
const nombreEditarCategoria = document.getElementById('nombreEditarCategoria');
const imagenEditarCategoria = document.getElementById('imagenEditarCategoria');
const modalEditarCancel = document.getElementById('modalEditarCancel');
const btnEditarEliminar = document.getElementById('btnEditarEliminar'); // Nuevo botón Eliminar
let currentEditCategoryId = null; // Guarda el ID de la categoría que se está editando

// Variables de Configuración y Toggles
const darkModeToggle = document.getElementById('darkModeToggle');
const notifToggle = document.getElementById('notificationsToggle');

// Variables de Estado Globales
let isLogin = true;
let currentUser = null;
let unsubscribeCategorias = null;
let unsubscribeFrutas = null;
let unsubscribeUser = null;
let unsubscribeNotif = null;
let currentNickname = null; 
let userNotificationsEnabled = true;
let settingsListenersAttached = false;
const processedToastIds = new Set();

// ==========================================
// LÓGICA DE NAVEGACIÓN
// ==========================================
function switchPage(pageId) {
  if (pageCategorias) pageCategorias.classList.add('hidden-page');
  if (pageConfig) pageConfig.classList.add('hidden-page');
  if (pageFrutas) pageFrutas.classList.add('hidden-page');
  
  if (pageId === 'categorias' && pageCategorias) {
    pageCategorias.classList.remove('hidden-page');
  } else if (pageId === 'config' && pageConfig) {
    pageConfig.classList.remove('hidden-page');
    sincronizarTogglesUI();
  } else if (pageId === 'frutas-verduras' && pageFrutas) {
    pageFrutas.classList.remove('hidden-page');
    suscribirFrutas();
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

// BOTÓN + INTELIGENTE
dockAddBtn.addEventListener('click', function() {
    if (!pageFrutas.classList.contains('hidden-page')) {
        abrirModalFruta();
    } else {
        abrirModal();
    }
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
// CATEGORÍAS (Renderizado, Edición y Eliminación)
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

    // Click para entrar a la tienda (Frutas/Verduras)
    document.querySelectorAll('.categoria').forEach(card => {
      card.addEventListener('click', function(e) {
        // Evitar que el click en el botón de editar dispare la navegación
        if (e.target.closest('.btn-editar')) return;

        const nombreCat = this.dataset.nombre;
        if (nombreCat && (nombreCat.toLowerCase().includes('fruta') || nombreCat.toLowerCase().includes('verdura'))) {
          switchPage('frutas-verduras');
        } else {
            alert(`Próximamente: ${nombreCat}`);
        }
      });
    });

    // EVENTO PARA EDITAR (El lápiz)
    document.querySelectorAll('.btn-editar').forEach(btn => {
      btn.addEventListener('click', function(e) {
        e.stopPropagation(); // Evita que el clic en el lápiz entre a la categoría
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
  // Cargamos los datos actuales de la categoría
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
  // Solo actualizamos la imagen si el usuario seleccionó una nueva
  if (nuevaImagenBase64) {
    updateData.imagen = nuevaImagenBase64;
  }

  ref.update(updateData).then(() => {
    cerrarModalEditarCategoria();
  }).catch(error => {
    console.error("Error al actualizar categoría:", error);
    alert("Error al guardar los cambios: " + error.message);
  });
}

// 🔥 Lógica para el botón ELIMINAR dentro del modal de edición
btnEditarEliminar.addEventListener('click', function() {
    if (!currentEditCategoryId) return;

    if (confirm('¿Estás seguro de que quieres eliminar esta categoría?\nEsta acción no se puede deshacer.')) {
        const ref = getCategoriasRef().doc(currentEditCategoryId);
        ref.delete().then(() => {
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
  if (!nombre) {
    alert("El nombre no puede estar vacío.");
    if (submitBtn) submitBtn.disabled = false;
    return;
  }

  const file = imagenEditarCategoria.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      actualizarCategoria(currentEditCategoryId, nombre, event.target.result);
      if (submitBtn) submitBtn.disabled = false;
    };
    reader.readAsDataURL(file);
  } else {
    actualizarCategoria(currentEditCategoryId, nombre, null);
    if (submitBtn) submitBtn.disabled = false;
  }
});

modalEditarCancel.addEventListener('click', cerrarModalEditarCategoria);
modalEditarCategoria.addEventListener('click', (e) => { 
  if (e.target === modalEditarCategoria) cerrarModalEditarCategoria(); 
});

// ==========================================
// 🛒 LÓGICA DE FRUTAS
// ==========================================
function getFrutasRef() { return db.collection('frutas_compartidas'); }

function suscribirFrutas() {
  if (unsubscribeFrutas) { unsubscribeFrutas(); unsubscribeFrutas = null; }
  const ref = getFrutasRef();
  unsubscribeFrutas = ref.orderBy('fechaCreacion', 'asc').onSnapshot((snapshot) => {
    if (snapshot.empty) {
      fvGrid.innerHTML = `<div class="empty-state">No hay productos aún. ¡Añade uno con el botón +!</div>`;
      return;
    }
    let html = '';
    snapshot.forEach(doc => {
      const data = doc.data();
      const id = doc.id;
      const tieneImagen = data.imagen && data.imagen.startsWith('data:image');
      const imgHtml = tieneImagen ? `<img src="${data.imagen}" alt="${data.nombre}" class="product-image" onerror="this.src='https://via.placeholder.com/100?text=Producto'">` : `<div style="height:90px; display:flex; align-items:center; justify-content:center; color:#888;">Sin imagen</div>`;
      
      html += `
        <div class="product-card">
          <span class="heart-icon">♡</span>
          ${imgHtml}
          <span class="product-name">${data.nombre}</span>
          <div class="card-footer">
            <span class="price">₹ ${data.precio}</span>
            <button class="btn-comprar" data-id="${id}">COMPRAR</button>
          </div>
        </div>
      `;
    });
    fvGrid.innerHTML = html;
    
    document.querySelectorAll('.btn-comprar').forEach(btn => {
      btn.addEventListener('click', function() {
        const id = this.dataset.id;
        getFrutasRef().doc(id).get().then((docSnap) => {
          if (docSnap.exists) {
            const product = docSnap.data();
            fvOpenPurchaseModal({ id: docSnap.id, name: product.nombre, price: product.precio, image: product.imagen });
          }
        });
      });
    });

  }, (error) => {
    console.error('Error en tiempo real de frutas:', error);
    fvGrid.innerHTML = `<div class="empty-state" style="color:red;">Error al cargar frutas. Revisa la consola.</div>`;
  });
}

function agregarFruta(nombre, precio, imagenBase64) {
  const ref = getFrutasRef();
  const nombreMostrar = currentNickname || (currentUser ? currentUser.email : 'Invitado');
  const precioNumerico = parseFloat(precio);
  if (isNaN(precioNumerico)) { alert("Por favor, ingresa un precio válido."); return; }

  ref.add({
    nombre: nombre.trim(),
    precio: precioNumerico,
    imagen: imagenBase64 || '',
    agregadoPor: nombreMostrar, 
    fechaCreacion: firebase.firestore.FieldValue.serverTimestamp()
  }).then(() => {
    cerrarModalFruta();
  }).catch(error => {
    console.error('Error al agregar fruta:', error);
    if (error.code === 'permission-denied') alert("⚠️ ERROR DE PERMISOS. Revisa las reglas de Firestore.");
    else alert('Error al guardar: ' + error.message);
  });
}

let fvCurrentProduct = null;
let fvCurrentQuantity = 1;

function fvOpenPurchaseModal(product) {
  fvCurrentProduct = product;
  fvCurrentQuantity = 1;
  fvModalProductName.textContent = product.name;
  fvModalQuantity.textContent = fvCurrentQuantity;
  fvModal.classList.remove('hidden');
}

function fvCloseModal() {
  fvModal.classList.add('hidden');
  fvCurrentProduct = null;
}

fvModal.addEventListener('click', function(e) {
  if (e.target === this) fvCloseModal();
});
fvBtnClose.addEventListener('click', fvCloseModal);
fvBtnInc.addEventListener('click', function() {
  fvCurrentQuantity++;
  fvModalQuantity.textContent = fvCurrentQuantity;
});
fvBtnDec.addEventListener('click', function() {
  if (fvCurrentQuantity > 1) {
    fvCurrentQuantity--;
    fvModalQuantity.textContent = fvCurrentQuantity;
  }
});
fvBtnConfirm.addEventListener('click', function() {
  if (fvCurrentProduct) {
    const totalPrice = fvCurrentProduct.price * fvCurrentQuantity;
    alert(`¡Compra exitosa!\nHas agregado ${fvCurrentQuantity} ${fvCurrentProduct.name}(s) a tu carrito.\nTotal a pagar: ₹ ${totalPrice}`);
    fvCloseModal();
  }
});
fvSearchInput.addEventListener('input', function() {
  const text = this.value.toLowerCase();
  const cards = fvGrid.querySelectorAll('.product-card');
  cards.forEach(card => {
    const name = card.querySelector('.product-name').textContent.toLowerCase();
    if (name.includes(text)) {
      card.style.display = 'flex';
    } else {
      card.style.display = 'none';
    }
  });
});
btnBackCategorias.addEventListener('click', function() {
    switchPage('categorias');
});

// ==========================================
// MODAL AÑADIR FRUTA
// ==========================================
function abrirModalFruta() {
  modalFruta.classList.remove('hidden');
  nombreFruta.value = '';
  precioFruta.value = '';
  imagenFruta.value = '';
  setTimeout(() => nombreFruta.focus(), 100);
}

function cerrarModalFruta() {
  modalFruta.classList.add('hidden');
  formFruta.reset();
}

formFruta.addEventListener('submit', function(e) {
  e.preventDefault();
  const submitBtn = this.querySelector('button[type="submit"]');
  if (submitBtn) submitBtn.disabled = true;

  const nombre = nombreFruta.value.trim();
  const precio = precioFruta.value.trim();
  
  if (!nombre || !precio) { 
    alert('El nombre y el precio son obligatorios.'); 
    if (submitBtn) submitBtn.disabled = false; 
    return; 
  }

  const file = imagenFruta.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (event) => { 
      agregarFruta(nombre, precio, event.target.result); 
      if (submitBtn) submitBtn.disabled = false;
    };
    reader.readAsDataURL(file);
  } else { 
    agregarFruta(nombre, precio, ''); 
    if (submitBtn) submitBtn.disabled = false;
  }
});

modalFrutaCancel.addEventListener('click', cerrarModalFruta);
modalFruta.addEventListener('click', (e) => { if (e.target === modalFruta) cerrarModalFruta(); });

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
  }).catch((error) => {
    console.error("Error al registrar notificación en Firestore:", error);
  });
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
  toast.innerHTML = `
    <h4>🔔 Nueva actividad</h4>
    <p><strong>${data.emisor_nick || 'Alguien'}</strong> agregó la categoría <strong>"${data.nombre_categoria || 'sin nombre'}"</strong></p>
  `;
  toastContainer.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 100);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, 4000);
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
    if (contador > 0) {
      await batch.commit();
      console.log(`✅ ${contador} notificaciones marcadas como leídas.`);
      processedToastIds.clear();
      abrirModalNotificaciones();
    } else { abrirModalNotificaciones(); }
  } catch (error) {
    console.error("❌ Error al limpiar notificaciones:", error);
    alert("Hubo un error al intentar limpiar las notificaciones.");
  }
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
    if (notificacionesPendientes.length === 0) {
      notifList.innerHTML = '<p style="color: var(--perfect-rose); text-align: center; padding: 20px 0;">No hay notificaciones nuevas.</p>';
    } else {
      notificacionesPendientes.forEach(item => {
        const data = item.data;
        const div = document.createElement('div');
        div.className = 'notif-item unread';
        const fecha = data.timestamp ? data.timestamp.toDate().toLocaleString() : 'Recién';
        div.innerHTML = `
          <div>
            <div class="msg"><strong>${data.emisor_nick || 'Alguien'}</strong> agregó <strong>"${data.nombre_categoria || 'sin nombre'}"</strong></div>
            <div class="timestamp">${fecha}</div>
          </div>
        `;
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
      if (data.apodo && data.apodo.trim() !== '') {
        currentNickname = data.apodo;
        userNameSpan.textContent = data.apodo; 
      } else {
        currentNickname = user.displayName || user.email;
        userNameSpan.textContent = currentNickname;
      }
      userNotificationsEnabled = data.notificationsEnabled !== undefined ? data.notificationsEnabled : true;
      if (!pageConfig.classList.contains('hidden-page') && notifToggle) {
        notifToggle.checked = userNotificationsEnabled;
      }
    } else {
      currentNickname = user.displayName || user.email;
      userNameSpan.textContent = currentNickname;
      userNotificationsEnabled = true;
    }
  }, (error) => {
    console.error("Error al obtener el perfil:", error);
    userNameSpan.textContent = user.displayName || user.email;
  });
}

function guardarApodo(nuevoApodo) {
  if (!currentUser) return;
  const userRef = db.collection('usuarios').doc(currentUser.uid);
  userRef.set({ apodo: nuevoApodo.trim() }, { merge: true })
  .then(() => { cerrarModalNickname(); })
  .catch((error) => {
    console.error("Error al guardar apodo:", error);
    alert("Hubo un error al guardar tu apodo: " + error.message);
  });
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
  if (unsubscribeUser) { unsubscribeUser(); unsubscribeUser = null; }
  if (unsubscribeNotif) { unsubscribeNotif(); unsubscribeNotif = null; }
  
  currentUser = user;
  if (user) {
    console.log("✅ Usuario autenticado:", user.email);
    pageAuth.classList.add('hidden-page');
    pageCategorias.classList.remove('hidden-page');
    if (pageConfig) pageConfig.classList.add('hidden-page');
    if (pageFrutas) pageFrutas.classList.add('hidden-page');
    
    suscribirPerfil(user);
    suscribirCategorias();
    suscribirNotificaciones(user);
    requestNotificationPermission();
    
    if (dock) dock.classList.remove('hidden-page');
    dockItems.forEach(item => item.classList.remove('active'));
    const activeItem = document.querySelector('.dock-item[data-page="categorias"]');
    if (activeItem) activeItem.classList.add('active');
    
    sincronizarTogglesUI();
  } else {
    console.log("ℹ️ Usuario NO autenticado.");
    pageAuth.classList.remove('hidden-page');
    pageCategorias.classList.add('hidden-page');
    if (pageConfig) pageConfig.classList.add('hidden-page');
    if (pageFrutas) pageFrutas.classList.add('hidden-page');
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

console.log('✅ App cargada, edición y eliminación de categorías activadas.');