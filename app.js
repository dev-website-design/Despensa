// =====================================================
// app.js - Arquitectura DINÁMICA (Modal Editar Producto)
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
  if (!firebase.apps.length) { firebase.initializeApp(firebaseConfig); }
  auth = firebase.auth();
  db = firebase.firestore();
  messaging = firebase.messaging();
  console.log("✅ Firebase inicializado correctamente.");
} catch (err) { console.error("❌ ERROR CRÍTICO AL INICIALIZAR FIREBASE:", err); }

// DOM ELEMENTS
const pageAuth = document.getElementById('page-auth');
const pageCategorias = document.getElementById('page-categorias');
const pageConfig = document.getElementById('page-config');
const pageTienda = document.getElementById('page-tienda-dinamica');
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

// DOM ELEMENTS - TIENDA DINÁMICA
const tiendaNombre = document.getElementById('tienda-dinamica-nombre');
const btnBackDinamico = document.getElementById('btn-back-dinamica');
const productGridDinamico = document.getElementById('product-grid-dinamico');
const searchInputDinamico = document.getElementById('search-input-dinamico');
const btnOpenCartDinamico = document.getElementById('btnOpenCartDinamico');
const cartBadgeDinamico = document.getElementById('cartBadgeDinamico');
const modalCompraDinamico = document.getElementById('purchase-modal-dinamico');
const modalProductNameDinamico = document.getElementById('modal-product-name-dinamico');
const modalQuantityDinamico = document.getElementById('modal-quantity-dinamico');
const btnConfirmPurchaseDinamico = document.getElementById('btn-confirm-purchase-dinamico');
const btnIncrementDinamico = document.getElementById('btn-increment-dinamico');
const btnDecrementDinamico = document.getElementById('btn-decrement-dinamico');
const modalCarritoDinamico = document.getElementById('modalCarritoDinamico');
const cartListDinamico = document.getElementById('cartListDinamico');
const cartTotalDinamico = document.getElementById('cartTotalDinamico');

// DOM ELEMENTS - MODAL AGREGAR PRODUCTO
const modalAddProducto = document.getElementById('modalAddProducto');
const formAddProducto = document.getElementById('formAddProducto');
const nombreAddProducto = document.getElementById('nombreAddProducto');
const precioAddProducto = document.getElementById('precioAddProducto');
const imagenAddProducto = document.getElementById('imagenAddProducto');
const modalAddProductoCancel = document.getElementById('modalAddProductoCancel');

// DOM ELEMENTS - MODAL EDITAR PRODUCTO (NUEVO)
const modalEditarItem = document.getElementById('modalEditarItem');
const formEditarItem = document.getElementById('formEditarItem');
const nombreEditarItem = document.getElementById('nombreEditarItem');
const precioEditarItem = document.getElementById('precioEditarItem');
const imagenEditarItem = document.getElementById('imagenEditarItem');
const modalEditarItemCancel = document.getElementById('modalEditarItemCancel');
const btnEditarItemEliminar = document.getElementById('btnEditarItemEliminar');

// DOM ELEMENTS - MODAL EDITAR CATEGORÍA
const modalEditarCategoria = document.getElementById('modalEditarCategoria');
const formEditarCategoria = document.getElementById('formEditarCategoria');
const nombreEditarCategoria = document.getElementById('nombreEditarCategoria');
const imagenEditarCategoria = document.getElementById('imagenEditarCategoria');
const modalEditarCancel = document.getElementById('modalEditarCancel');
const btnEditarEliminar = document.getElementById('btnEditarEliminar');

// Variables de Estado Globales
let isLogin = true;
let currentUser = null;
let currentTiendaId = null;      
let currentTiendaNombre = null;  
let userNotificationsEnabled = true;
let settingsListenersAttached = false;
const processedToastIds = new Set();

let unsubscribeCategorias = null;
let unsubscribeTienda = null;
let unsubscribeCarritoTienda = null;
let unsubscribeUser = null;
let unsubscribeNotif = null;
let currentNickname = null; 
let currentProduct = null;       
let currentQuantity = 1;
let currentEditCategoryId = null; 

// Variables para gestionar la edición de un producto (NUEVO)
let currentEditItemData = { tienda: null, id: null };

// ==========================================
// NAVEGACIÓN DINÁMICA
// ==========================================
let isNavigating = false;

function switchPage(pageId, data = null) {
    if (isNavigating) return;
    isNavigating = true;

    if (pageCategorias) pageCategorias.classList.add('hidden-page');
    if (pageConfig) pageConfig.classList.add('hidden-page');
    if (pageTienda) pageTienda.classList.add('hidden-page');

    if (pageId === 'categorias' && pageCategorias) {
        pageCategorias.classList.remove('hidden-page');
    } else if (pageId === 'config' && pageConfig) {
        pageConfig.classList.remove('hidden-page');
        sincronizarTogglesUI();
    } else if (pageId === 'tienda' && pageTienda) {
        if (data && data.id && data.nombre) {
            currentTiendaId = data.id;
            currentTiendaNombre = data.nombre;
            tiendaNombre.textContent = `🛒 ${data.nombre}`;
            pageTienda.classList.remove('hidden-page');
            suscribirTienda(data.id);
        }
    }

    dockItems.forEach(item => item.classList.remove('active'));
    const activeDock = document.querySelector(`.dock-item[data-page="${pageId}"]`);
    if (activeDock) activeDock.classList.add('active');

    if (pageId === 'tienda') {
        window.location.hash = `tienda-${data.id}`;
    } else {
        window.location.hash = pageId;
    }
    setTimeout(() => { isNavigating = false; }, 100);
}

window.addEventListener('hashchange', () => {
    if (isNavigating) return;
    const hash = window.location.hash.replace('#', '');
    if (hash.startsWith('tienda-')) {
        const id = hash.replace('tienda-', '');
        if (id) {
            getCategoriasRef().doc(id).get().then((doc) => {
                if (doc.exists) {
                    const nombre = doc.data().nombre;
                    switchPage('tienda', { id: id, nombre: nombre }, false);
                } else {
                    switchPage('categorias', false);
                }
            }).catch(() => {
                switchPage('categorias', false);
            });
        } else {
            switchPage('categorias', false);
        }
    } else if (hash && document.getElementById('page-' + hash)) {
        if (hash !== 'tienda') switchPage(hash, false);
    } else {
        if (pageCategorias && pageCategorias.classList.contains('hidden-page')) {
            switchPage('categorias', false);
        }
    }
});

dockItems.forEach(item => {
    item.addEventListener('click', function() {
        const page = this.dataset.page;
        if (page) switchPage(page);
    });
});

// ==========================================
// CONFIGURACIÓN
// ==========================================
function sincronizarTogglesUI() {
  const darkToggle = document.getElementById('darkModeToggle');
  const notifToggle = document.getElementById('notificationsToggle');
  if(!darkToggle || !notifToggle) return;
  const savedDark = localStorage.getItem('darkMode');
  if (savedDark === 'true') { darkToggle.checked = true; document.body.classList.add('dark-mode'); } 
  else { darkToggle.checked = false; document.body.classList.remove('dark-mode'); }
  if (notifToggle) notifToggle.checked = userNotificationsEnabled;

  if (!settingsListenersAttached) {
    darkToggle.addEventListener('change', () => {
      localStorage.setItem('darkMode', darkToggle.checked);
      document.body.classList.toggle('dark-mode', darkToggle.checked);
    });
    notifToggle.addEventListener('change', () => {
      if (currentUser) {
        const userRef = db.collection('usuarios').doc(currentUser.uid);
        userRef.set({ notificationsEnabled: notifToggle.checked }, { merge: true }).catch(err => {
          console.error("Error al guardar preferencia:", err);
          notifToggle.checked = userNotificationsEnabled;
          alert("No se pudo guardar la preferencia.");
        });
      }
    });
    settingsListenersAttached = true;
  }
}

// ==========================================
// AUTENTICACIÓN
// ==========================================
function toggleAuthMode() { isLogin = !isLogin; authTitle.textContent = isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'; authSubmitBtn.textContent = isLogin ? 'Iniciar sesión' : 'Registrarse'; authSwitchText.textContent = isLogin ? '¿No tienes cuenta? ' : '¿Ya tienes cuenta? '; authSwitchLink.textContent = isLogin ? 'Regístrate' : 'Inicia sesión'; authError.textContent = ''; }
async function handleAuthSubmit(e) { e.preventDefault(); const email = authEmail.value.trim(); const password = authPassword.value.trim(); if (!email || !password) { authError.textContent = 'Por favor, completa el correo y la contraseña.'; return; } authError.textContent = 'Cargando...'; try { if (isLogin) { await auth.signInWithEmailAndPassword(email, password); } else { await auth.createUserWithEmailAndPassword(email, password); } } catch (error) { console.error("❌ Error en handleAuthSubmit:", error); if (error.code === 'auth/email-already-in-use') authError.textContent = 'Este correo ya está registrado.'; else if (error.code === 'auth/user-not-found') authError.textContent = 'Usuario no encontrado.'; else if (error.code === 'auth/wrong-password') authError.textContent = 'Contraseña incorrecta.'; else authError.textContent = error.message || "Error al conectar con Firebase."; } }
async function loginWithGoogle() { try { const provider = new firebase.auth.GoogleAuthProvider(); await auth.signInWithPopup(provider); } catch (error) { console.error("❌ Error en loginWithGoogle:", error); authError.textContent = error.message || "Error al iniciar con Google."; } }
function logout() { auth.signOut(); }

async function requestNotificationPermission() {
  if (!('Notification' in window) || !currentUser) return;
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const token = await messaging.getToken({ vapidKey: 'TU_VAPID_KEY_AQUI' }); 
      const userRef = db.collection('usuarios').doc(currentUser.uid);
      await userRef.set({ fcmTokens: firebase.firestore.FieldValue.arrayUnion(token) }, { merge: true });
      console.log("📲 Token push guardado en Firestore:", token);
    }
  } catch (error) { console.error("❌ Error al solicitar o guardar el token de notificaciones:", error); }
}

// ==========================================
// CATEGORÍAS
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
        const id = this.dataset.id;
        const nombre = this.dataset.nombre;
        switchPage('tienda', { id: id, nombre: nombre });
      });
    });

    if (modalEditarCategoria) {
        document.querySelectorAll('.btn-editar').forEach(btn => {
          btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const id = this.dataset.id;
            abrirModalEditarCategoria(id);
          });
        });
    } else {
        console.warn("⚠️ modalEditarCategoria no encontrado en el HTML.");
    }

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
  }).then(() => {
    notificarNuevaCategoria(nombre, nombreMostrar);
  }).catch(error => {
    console.error('Error al agregar categoria:', error);
    if (error.code === 'permission-denied') alert("⚠️ ERROR DE PERMISOS. Revisa las reglas de Firestore.");
    else alert('Error al guardar: ' + error.message);
  });
}

// ==========================================
// 🛒 TIENDA DINÁMICA
// ==========================================
function getProductosRef(categoriaId) {
    return db.collection('categorias_compartidas').doc(categoriaId).collection('productos');
}
function getCarritoTiendaRef(categoriaId) {
    return db.collection('categorias_compartidas').doc(categoriaId).collection('carrito');
}

function suscribirTienda(categoriaId) {
  if (unsubscribeTienda) { unsubscribeTienda(); unsubscribeTienda = null; }
  if (unsubscribeCarritoTienda) { unsubscribeCarritoTienda(); unsubscribeCarritoTienda = null; }

  const refProductos = getProductosRef(categoriaId);
  unsubscribeTienda = refProductos.orderBy('fechaCreacion', 'asc').onSnapshot((snapshot) => {
    const grid = productGridDinamico;
    if (snapshot.empty) { grid.innerHTML = `<div class="empty-state-tienda" style="grid-column:1/-1; text-align:center; color:var(--perfect-rose); padding:20px;">No hay productos en esta categoría. ¡Añade uno con el botón +!</div>`; return; }
    let html = '';
    snapshot.forEach(doc => {
      const data = doc.data();
      const id = doc.id;
      const tieneImagen = data.imagen && data.imagen.startsWith('data:image');
      const imgHtml = tieneImagen ? `<img src="${data.imagen}" alt="${data.nombre}" class="product-image" onerror="this.src='https://via.placeholder.com/100?text=Producto'">` : `<div style="height:90px; display:flex; align-items:center; justify-content:center; color:#888; background:#f9f2f4; border-radius:12px;">Sin imagen</div>`;

      html += `
        <div class="product-card-tienda">
          <span class="heart-icon">♡</span>
          <button class="btn-editar-item" data-id="${id}" data-categoria="${categoriaId}">✏️</button>
          ${imgHtml}
          <span class="product-name">${data.nombre}</span>
          <div class="card-footer">
            <span class="price">₹ ${data.precio}</span>
            <button class="btn-comprar-tienda" data-id="${id}" data-categoria="${categoriaId}">COMPRAR</button>
          </div>
        </div>
      `;
    });
    grid.innerHTML = html;

    document.querySelectorAll(`#${grid.id} .btn-comprar-tienda`).forEach(btn => {
      btn.addEventListener('click', function() {
        const id = this.dataset.id;
        const catId = this.dataset.categoria;
        getProductosRef(catId).doc(id).get().then((docSnap) => {
          if (docSnap.exists) {
            const product = docSnap.data();
            abrirModalCompraDinamico(catId, { id: docSnap.id, name: product.nombre, price: product.precio, image: product.imagen });
          }
        });
      });
    });

    // 🔥 CORREGIDO: El lápiz de editar producto ahora abre el modal real, no un alert
    document.querySelectorAll(`#${grid.id} .btn-editar-item`).forEach(btn => {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        const id = this.dataset.id;
        const catId = this.dataset.categoria;
        abrirModalEditarItem(catId, id);
      });
    });
  }, (error) => { console.error('Error en tiempo real de productos dinámicos:', error); });

  const refCarrito = getCarritoTiendaRef(categoriaId);
  unsubscribeCarritoTienda = refCarrito.onSnapshot((snapshot) => {
    let html = '';
    let total = 0;
    let count = 0;
    snapshot.forEach(doc => {
      const data = doc.data();
      total += data.precio * data.cantidad;
      count += data.cantidad;
      html += `
        <div class="cart-item">
          <div class="cart-item-info"><span class="cart-item-name">${data.nombre}</span><span class="cart-item-price">₹ ${data.precio}</span><span class="cart-item-qty">Cantidad: ${data.cantidad}</span></div>
          <div class="cart-item-actions"><button class="btn-remove-cart" data-ref="carrito_dinamico" data-id="${doc.id}">🗑️</button></div>
        </div>
      `;
    });
    if (count === 0) {
        html = '<p style="color: var(--perfect-rose); text-align: center; padding: 20px 0;">El carrito está vacío.</p>';
    }
    cartListDinamico.innerHTML = html;
    cartTotalDinamico.textContent = `Total: ₹ ${total}`;
    if (count > 0) { cartBadgeDinamico.textContent = count > 9 ? '9+' : count; cartBadgeDinamico.classList.add('visible'); } else { cartBadgeDinamico.classList.remove('visible'); }
  });
}

// ==========================================
// COMPRAS DINÁMICAS
// ==========================================
function abrirModalCompraDinamico(categoriaId, product) {
    currentProduct = product;
    currentQuantity = 1;
    modalProductNameDinamico.textContent = product.name;
    modalQuantityDinamico.textContent = currentQuantity;
    modalCompraDinamico.classList.remove('hidden');
}
function cerrarModalCompraDinamico() {
    modalCompraDinamico.classList.add('hidden');
    currentProduct = null;
}

function agregarAlCarritoDinamico(categoriaId, producto, cantidad) {
  const ref = getCarritoTiendaRef(categoriaId);
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
      cerrarModalCompraDinamico();
    }).catch(error => {
      console.error("Error al agregar al carrito:", error);
      alert("Hubo un error al agregar el producto al carrito.");
    });
  });
}

// Botones del modal de compra
document.getElementById('purchase-modal-dinamico-close').addEventListener('click', cerrarModalCompraDinamico);
modalCompraDinamico.addEventListener('click', (e) => { if (e.target === modalCompraDinamico) cerrarModalCompraDinamico(); });
btnIncrementDinamico.addEventListener('click', function() { currentQuantity++; modalQuantityDinamico.textContent = currentQuantity; });
btnDecrementDinamico.addEventListener('click', function() { if (currentQuantity > 1) { currentQuantity--; modalQuantityDinamico.textContent = currentQuantity; } });
btnConfirmPurchaseDinamico.addEventListener('click', function() {
    if (currentProduct && currentTiendaId) {
        agregarAlCarritoDinamico(currentTiendaId, currentProduct, currentQuantity);
    }
});

btnOpenCartDinamico.addEventListener('click', () => { modalCarritoDinamico.classList.remove('hidden'); });
document.getElementById('modalCarritoDinamicoClose').addEventListener('click', () => { modalCarritoDinamico.classList.add('hidden'); });
modalCarritoDinamico.addEventListener('click', (e) => { if (e.target === modalCarritoDinamico) modalCarritoDinamico.classList.add('hidden'); });

btnBackDinamico.addEventListener('click', () => { switchPage('categorias'); });

// ==========================================
// 🔥 BOTÓN + INTELIGENTE
// ==========================================
dockAddBtn.addEventListener('click', function() {
    if (!pageTienda.classList.contains('hidden-page') && currentTiendaId) {
        modalAddProducto.classList.remove('hidden');
        nombreAddProducto.value = '';
        precioAddProducto.value = '';
        imagenAddProducto.value = '';
        setTimeout(() => nombreAddProducto.focus(), 100);
    } else {
        modalCategoria.classList.remove('hidden');
        nombreCategoria.value = '';
        imagenCategoria.value = '';
        setTimeout(() => nombreCategoria.focus(), 100);
    }
});

// ==========================================
// 🔥 LÓGICA PARA AGREGAR PRODUCTOS
// ==========================================
modalAddProductoCancel.addEventListener('click', function() {
    modalAddProducto.classList.add('hidden');
    formAddProducto.reset();
});
modalAddProducto.addEventListener('click', function(e) {
    if (e.target === modalAddProducto) {
        modalAddProducto.classList.add('hidden');
        formAddProducto.reset();
    }
});
formAddProducto.addEventListener('submit', function(e) {
    e.preventDefault();
    if (!currentTiendaId) {
        alert("Error: No se detectó la tienda actual.");
        return;
    }
    const nombre = nombreAddProducto.value.trim();
    const precio = parseFloat(precioAddProducto.value.trim());
    if (!nombre || isNaN(precio)) {
        alert("Por favor, completa el nombre y el precio correctamente.");
        return;
    }
    const file = imagenAddProducto.files[0];
    const nombreMostrar = currentNickname || (currentUser ? currentUser.email : 'Invitado');

    const guardarProducto = (imagenBase64 = '') => {
        getProductosRef(currentTiendaId).add({
            nombre: nombre,
            precio: precio,
            imagen: imagenBase64,
            agregadoPor: nombreMostrar,
            fechaCreacion: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => {
            modalAddProducto.classList.add('hidden');
            formAddProducto.reset();
        }).catch(error => {
            console.error("Error al agregar producto:", error);
            alert("Error al guardar el producto: " + error.message);
        });
    };

    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => { guardarProducto(event.target.result); };
        reader.readAsDataURL(file);
    } else {
        guardarProducto('');
    }
});

// ==========================================
// 🔥 LÓGICA PARA EDITAR PRODUCTOS (ELIMINA EL ALERT)
// ==========================================
function abrirModalEditarItem(tienda, id) {
    currentEditItemData.tienda = tienda;
    currentEditItemData.id = id;
    const ref = getProductosRef(tienda).doc(id);
    
    ref.get().then((doc) => {
        if (doc.exists) {
            const data = doc.data();
            nombreEditarItem.value = data.nombre || '';
            precioEditarItem.value = data.precio || '';
            imagenEditarItem.value = '';
            modalEditarItem.classList.remove('hidden');
            setTimeout(() => nombreEditarItem.focus(), 100);
        }
    }).catch(error => {
        console.error("Error al cargar el producto para editar:", error);
        alert("No se pudo cargar el producto.");
    });
}

function cerrarModalEditarItem() {
    modalEditarItem.classList.add('hidden');
    formEditarItem.reset();
    currentEditItemData = { tienda: null, id: null };
}

function actualizarItem(tienda, id, nuevoNombre, nuevoPrecio, nuevaImagenBase64) {
    const ref = getProductosRef(tienda).doc(id);
    const updateData = {
        nombre: nuevoNombre.trim(),
        precio: parseFloat(nuevoPrecio)
    };
    if (nuevaImagenBase64) { updateData.imagen = nuevaImagenBase64; }
    
    ref.update(updateData).then(() => {
        cerrarModalEditarItem();
    }).catch(error => {
        console.error("Error al actualizar producto:", error);
        alert("Error al guardar los cambios: " + error.message);
    });
}

function eliminarItem(tienda, id) {
    const ref = getProductosRef(tienda).doc(id);
    if (confirm('¿Estás seguro de que quieres eliminar este producto?\nEsta acción no se puede deshacer.')) {
        ref.delete().then(() => {
            cerrarModalEditarItem();
        }).catch(error => {
            console.error('Error al eliminar el producto:', error);
            alert('Error al eliminar: ' + error.message);
        });
    }
}

modalEditarItemCancel.addEventListener('click', cerrarModalEditarItem);
modalEditarItem.addEventListener('click', (e) => { if (e.target === modalEditarItem) cerrarModalEditarItem(); });
btnEditarItemEliminar.addEventListener('click', function() {
    if (currentEditItemData.tienda && currentEditItemData.id) {
        eliminarItem(currentEditItemData.tienda, currentEditItemData.id);
    }
});
formEditarItem.addEventListener('submit', function(e) {
    e.preventDefault();
    if (!currentEditItemData.tienda || !currentEditItemData.id) return;
    const nombre = nombreEditarItem.value.trim();
    const precio = precioEditarItem.value.trim();
    if (!nombre || !precio) { alert("El nombre y el precio no pueden estar vacíos."); return; }
    const file = imagenEditarItem.files[0];
    const { tienda, id } = currentEditItemData;
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => { actualizarItem(tienda, id, nombre, precio, event.target.result); };
        reader.readAsDataURL(file);
    } else {
        actualizarItem(tienda, id, nombre, precio, null);
    }
});

// ==========================================
// 🔥 LÓGICA DE EDICIÓN DE CATEGORÍAS
// ==========================================
if (modalEditarCategoria) {
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
        alert("No se pudo cargar la categoría.");
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
      ref.update(updateData).then(() => {
        cerrarModalEditarCategoria();
      }).catch(error => {
        console.error("Error al actualizar categoría:", error);
        alert("Error al guardar los cambios: " + error.message);
      });
    }

    btnEditarEliminar.addEventListener('click', function() {
      if (!currentEditCategoryId) return;
      if (confirm('¿Estás seguro de que quieres eliminar esta categoría?\nEsta acción no se puede deshacer.')) {
        getCategoriasRef().doc(currentEditCategoryId).delete().then(() => {
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
}

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
  }).catch((error) => { console.error("Error al registrar notificación:", error); });
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
    }, (error) => { console.error("Error al escuchar notificaciones:", error); });
  } catch (outerError) { console.error("Error al iniciar listener:", outerError); }
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
// MODALES DE LA APP
// ==========================================
function abrirModal() { modalCategoria.classList.remove('hidden'); nombreCategoria.value = ''; imagenCategoria.value = ''; setTimeout(() => nombreCategoria.focus(), 100); }
function cerrarModal() { modalCategoria.classList.add('hidden'); formCategoria.reset(); }
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
  if (unsubscribeTienda) { unsubscribeTienda(); unsubscribeTienda = null; }
  if (unsubscribeCarritoTienda) { unsubscribeCarritoTienda(); unsubscribeCarritoTienda = null; }
  if (unsubscribeUser) { unsubscribeUser(); unsubscribeUser = null; }
  if (unsubscribeNotif) { unsubscribeNotif(); unsubscribeNotif = null; }

  currentUser = user;
  if (user) {
    console.log("✅ Usuario autenticado:", user.email);
    pageAuth.classList.add('hidden-page');
    
    const currentHash = window.location.hash.replace('#', '');
    if (currentHash.startsWith('tienda-')) {
        const id = currentHash.replace('tienda-', '');
        getCategoriasRef().doc(id).get().then((doc) => {
            if (doc.exists) {
                const nombre = doc.data().nombre;
                switchPage('tienda', { id: id, nombre: nombre }, true);
            } else { switchPage('categorias', true); }
        }).catch(() => { switchPage('categorias', true); });
    } else {
        const targetPage = (currentHash && document.getElementById('page-' + currentHash)) ? currentHash : 'categorias';
        switchPage(targetPage, true);
    }

    suscribirPerfil(user);
    suscribirCategorias();
    suscribirNotificaciones(user);
    requestNotificationPermission();

    if (dock) dock.classList.remove('hidden-page');
    sincronizarTogglesUI();
  } else {
    console.log("ℹ️ Usuario NO autenticado.");
    pageAuth.classList.remove('hidden-page');
    if (pageCategorias) pageCategorias.classList.add('hidden-page');
    if (pageConfig) pageConfig.classList.add('hidden-page');
    if (pageTienda) pageTienda.classList.add('hidden-page');
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

console.log('✅ App cargada. Modales de añadir y editar productos activados.');