// Configuración fija del repositorio y archivo de productos
const REPO_OWNER = "jess90202";
const REPO_NAME = "luzcreaciones";
const BRANCH = "main";
const PRODUCTOS_PATH = "data/productos.json";

// Config Cloudinary
const CLOUD_NAME = "dexcfzwlm";
const UPLOAD_PRESET = "luzcreaciones_unsigned";

let githubToken = null;
let productos = [];
let productosSha = null; // SHA del archivo productos.json en GitHub

// ---------- Utilidades UI ----------

function showToast(message, type = "success") {
    const container = document.getElementById("toastContainer");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.innerHTML = `
    <span>${type === "success" ? "✅" : "❌"}</span>
    <span>${message}</span>
  `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateX(100%)";
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// ---------- Utilidades GitHub ----------

async function githubFetch(url, options = {}) {
    if (!githubToken) {
        throw new Error("No hay clave de acceso configurada");
    }
    const headers = options.headers || {};
    headers["Authorization"] = "token " + githubToken;
    headers["Accept"] = "application/vnd.github.v3+json";
    return fetch(url, { ...options, headers });
}

async function cargarProductosDesdeGitHub() {
    const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${PRODUCTOS_PATH}?ref=${BRANCH}`;
    const res = await githubFetch(url);
    if (!res.ok) {
        throw new Error("No se pudo leer el catálogo. Verifica tu clave.");
    }
    const data = await res.json();
    productosSha = data.sha;

    const contenido = atob(data.content.replace(/\n/g, ""));
    let json;
    try {
        json = JSON.parse(contenido);
    } catch (e) {
        console.error("Error parseando productos.json", e);
        json = { productos: [] };
    }
    productos = Array.isArray(json.productos) ? json.productos : [];
    renderListaProductos();
}

async function guardarProductosEnGitHub(mensaje = "Actualizar catálogo") {
    const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${PRODUCTOS_PATH}`;

    const nuevoContenido = JSON.stringify({ productos }, null, 2);
    const base64Content = btoa(unescape(encodeURIComponent(nuevoContenido)));

    const body = {
        message: mensaje,
        content: base64Content,
        branch: BRANCH,
    };
    if (productosSha) {
        body.sha = productosSha;
    }

    const res = await githubFetch(url, {
        method: "PUT",
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        console.error("Error al guardar productos.json", await res.text());
        throw new Error("No se pudo guardar en GitHub");
    }

    const data = await res.json();
    productosSha = data.content.sha;
}

// ---------- Cloudinary ----------

async function subirImagenACloudinary(file) {
    const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);

    const res = await fetch(url, {
        method: "POST",
        body: formData,
    });

    if (!res.ok) {
        console.error("Error al subir a Cloudinary", res.status, await res.text());
        throw new Error("Error subiendo imagen");
    }

    const data = await res.json();
    return data.secure_url;
}

// ---------- Renderizar lista de productos ----------

function renderListaProductos() {
    const cont = document.getElementById("listaProductos");
    const totalEl = document.getElementById("totalProductos");
    if (!cont) return;

    cont.innerHTML = "";
    if (totalEl) totalEl.textContent = productos.length;

    if (!productos.length) {
        cont.innerHTML = '<p style="grid-column: 1/-1; text-align:center; color:var(--text-light);">No hay productos aún. ¡Agrega el primero!</p>';
        return;
    }

    productos.forEach((p, index) => {
        const div = document.createElement("div");
        div.className = "admin-item";

        const imgHtml = p.imagen
            ? `<img src="${p.imagen}" alt="${p.nombre || ""}" loading="lazy" />`
            : `<div style="width:100%; aspect-ratio:1; background:#f3e8ff; display:flex; align-items:center; justify-content:center; color:#6a5acd; border-radius:12px;">Sin foto</div>`;

        div.innerHTML = `
      ${imgHtml}
      <div style="flex-grow:1;">
        <strong style="display:block; margin-bottom:4px;">${p.nombre || "Sin nombre"}</strong>
        <span style="font-size:0.85rem; color:var(--text-light);">${p.categoria === "madera" ? "Madera" : "Bisutería"} · $${p.precio}</span>
      </div>
      <div class="admin-actions">
        <button type="button" data-idx="${index}" class="btn-sm btn-edit">Editar</button>
        <button type="button" data-idx="${index}" class="btn-sm btn-delete">Borrar</button>
      </div>
    `;

        cont.appendChild(div);
    });

    // Listeners
    cont.querySelectorAll(".btn-edit").forEach(btn => {
        btn.addEventListener("click", () => {
            const idx = parseInt(btn.getAttribute("data-idx"), 10);
            cargarProductoEnFormulario(idx);
            window.scrollTo({ top: 0, behavior: "smooth" });
        });
    });

    cont.querySelectorAll(".btn-delete").forEach(btn => {
        btn.addEventListener("click", async () => {
            const idx = parseInt(btn.getAttribute("data-idx"), 10);
            const p = productos[idx];
            if (!confirm(`¿Seguro que quieres borrar "${p.nombre}"?`)) return;

            try {
                productos.splice(idx, 1);
                await guardarProductosEnGitHub("Eliminar producto");
                renderListaProductos();
                showToast("Producto eliminado", "success");
            } catch (e) {
                showToast("Error al eliminar", "error");
            }
        });
    });
}

// ---------- Formulario ----------

function limpiarFormulario() {
    document.getElementById("nombre").value = "";
    document.getElementById("precio").value = "";
    document.getElementById("descripcion").value = "";
    document.getElementById("categoria").value = "bisuteria";
    document.getElementById("imagenInput").value = "";
    document.getElementById("productoIndex").value = "";

    const prev = document.getElementById("previewImagen");
    if (prev) prev.innerHTML = "";

    document.getElementById("formTitle").textContent = "Nuevo Producto";
    document.getElementById("cancelarEditBtn").style.display = "none";
}

function cargarProductoEnFormulario(index) {
    const p = productos[index];
    document.getElementById("nombre").value = p.nombre || "";
    document.getElementById("precio").value = p.precio || "";
    document.getElementById("descripcion").value = p.descripcion || "";
    document.getElementById("categoria").value = p.categoria || "bisuteria";
    document.getElementById("productoIndex").value = index;

    document.getElementById("formTitle").textContent = "Editar Producto";
    document.getElementById("cancelarEditBtn").style.display = "inline-block";

    const prev = document.getElementById("previewImagen");
    if (prev && p.imagen) {
        prev.innerHTML = `<img src="${p.imagen}" style="max-height:100px; border-radius:8px; box-shadow:0 4px 10px rgba(0,0,0,0.1);" />`;
    }
}

function initFormulario() {
    const form = document.getElementById("formProducto");
    const cancelBtn = document.getElementById("cancelarEditBtn");
    const fileInput = document.getElementById("imagenInput");
    const preview = document.getElementById("previewImagen");

    if (!form) return;

    // Preview de imagen local
    fileInput.addEventListener("change", () => {
        if (fileInput.files && fileInput.files[0]) {
            const reader = new FileReader();
            reader.onload = (e) => {
                preview.innerHTML = `<img src="${e.target.result}" style="max-height:100px; border-radius:8px; box-shadow:0 4px 10px rgba(0,0,0,0.1);" />`;
            };
            reader.readAsDataURL(fileInput.files[0]);
        }
    });

    if (cancelBtn) {
        cancelBtn.addEventListener("click", limpiarFormulario);
    }

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const btn = form.querySelector("button[type='submit']");
        const originalText = btn.textContent;
        btn.disabled = true;
        btn.textContent = "Guardando...";

        const nombre = document.getElementById("nombre").value.trim();
        const precio = parseFloat(document.getElementById("precio").value);
        const descripcion = document.getElementById("descripcion").value.trim();
        const categoria = document.getElementById("categoria").value;
        const idxHidden = document.getElementById("productoIndex").value;

        try {
            let imagenUrl = null;
            if (fileInput.files && fileInput.files[0]) {
                imagenUrl = await subirImagenACloudinary(fileInput.files[0]);
            }

            const estaEditando = idxHidden !== "";

            if (estaEditando) {
                const idx = parseInt(idxHidden, 10);
                const producto = productos[idx];
                producto.nombre = nombre;
                producto.precio = precio;
                producto.descripcion = descripcion;
                producto.categoria = categoria;
                if (imagenUrl) {
                    producto.imagen = imagenUrl;
                }
            } else {
                const nuevo = {
                    nombre,
                    precio,
                    descripcion,
                    categoria,
                    imagen: imagenUrl || "",
                };
                productos.push(nuevo);
            }

            await guardarProductosEnGitHub(estaEditando ? "Editar producto" : "Agregar producto");
            renderListaProductos();
            limpiarFormulario();

            if (window.location.protocol === 'file:') {
                alert("⚠️ AVISO: Estás en modo local (archivo). Los cambios se guardaron en GitHub, pero NO los verás aquí hasta que actualices tu archivo local 'productos.json'.\n\nPara ver los cambios, visita tu página web pública.");
            } else {
                showToast("Guardado. Los cambios tardan 1-2 min en aparecer en la web.", "success");
            }
        } catch (err) {
            console.error(err);
            showToast("Error al guardar. Revisa tu conexión o clave.", "error");
        } finally {
            btn.disabled = false;
            btn.textContent = originalText;
        }
    });
}

// ---------- Login / Logout ----------

function mostrarAdmin() {
    const loginSection = document.getElementById("loginSection");
    const adminSection = document.getElementById("adminSection");
    const logoutBtn = document.getElementById("logoutBtn");

    if (loginSection) loginSection.style.display = "none";
    if (adminSection) adminSection.style.display = "block";
    if (logoutBtn) logoutBtn.style.display = "inline-block";
}

function mostrarLogin() {
    const loginSection = document.getElementById("loginSection");
    const adminSection = document.getElementById("adminSection");
    const logoutBtn = document.getElementById("logoutBtn");

    if (loginSection) loginSection.style.display = "block";
    if (adminSection) adminSection.style.display = "none";
    if (logoutBtn) logoutBtn.style.display = "none";
}

function initLogin() {
    const tokenGuardado = localStorage.getItem("lc_github_token");

    if (tokenGuardado) {
        githubToken = tokenGuardado;
        mostrarAdmin();
        cargarProductosDesdeGitHub().catch(err => {
            console.error(err);
            showToast("Sesión expirada o inválida", "error");
            mostrarLogin();
        });
    } else {
        mostrarLogin();
    }

    const guardarTokenBtn = document.getElementById("guardarTokenBtn");
    const tokenInput = document.getElementById("githubTokenInput");
    const logoutBtn = document.getElementById("logoutBtn");

    if (guardarTokenBtn && tokenInput) {
        guardarTokenBtn.addEventListener("click", () => {
            const token = tokenInput.value.trim();
            if (!token) {
                showToast("Por favor ingresa la clave", "error");
                return;
            }

            guardarTokenBtn.disabled = true;
            guardarTokenBtn.textContent = "Verificando...";

            githubToken = token;

            cargarProductosDesdeGitHub()
                .then(() => {
                    localStorage.setItem("lc_github_token", token);
                    mostrarAdmin();
                    showToast("¡Bienvenido!", "success");
                })
                .catch(err => {
                    console.error(err);
                    showToast("Clave incorrecta o problema de conexión", "error");
                    githubToken = null;
                })
                .finally(() => {
                    guardarTokenBtn.disabled = false;
                    guardarTokenBtn.textContent = "Entrar al Panel";
                });
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            if (confirm("¿Cerrar sesión?")) {
                localStorage.removeItem("lc_github_token");
                githubToken = null;
                mostrarLogin();
                showToast("Sesión cerrada", "success");
            }
        });
    }
}

// ---------- Init ----------

document.addEventListener("DOMContentLoaded", () => {
    initLogin();
    initFormulario();
});
