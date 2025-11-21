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

// ---------- Utilidades GitHub ----------

async function githubFetch(url, options = {}) {
  if (!githubToken) {
    throw new Error("No hay token de GitHub configurado");
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
    throw new Error("No se pudo leer productos.json desde GitHub");
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
    throw new Error("No se pudo guardar productos.json en GitHub");
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
    throw new Error("Error subiendo a Cloudinary");
  }

  const data = await res.json();
  return data.secure_url;
}

// ---------- Renderizar lista de productos ----------

function renderListaProductos() {
  const cont = document.getElementById("listaProductos");
  if (!cont) return;
  cont.innerHTML = "";

  if (!productos.length) {
    cont.innerHTML = '<p class="small">Aún no hay productos. Agrega el primero en el formulario.</p>';
    return;
  }

  productos.forEach((p, index) => {
    const div = document.createElement("div");
    div.className = "admin-card";

    const imgHtml = p.imagen
      ? `<img src="${p.imagen}" alt="${p.nombre || ""}" />`
      : `<div style="width:60px;height:60px;border-radius:10px;background:#f3e8ff;display:flex;align-items:center;justify-content:center;font-size:12px;color:#6a5acd;">Sin foto</div>`;

    div.innerHTML = `
      ${imgHtml}
      <div>
        <strong>${p.nombre || ""}</strong>
        <span class="small">${p.categoria === "madera" ? "Madera" : "Bisutería"} · $${p.precio}</span>
        <p class="small" style="margin-top:4px;">${p.descripcion || ""}</p>
      </div>
      <div style="display:flex;flex-direction:column;gap:6px;">
        <button type="button" data-idx="${index}" class="btn btn-editar">Editar</button>
        <button type="button" data-idx="${index}" class="btn btn-eliminar">Eliminar</button>
      </div>
    `;

    cont.appendChild(div);
  });

  cont.querySelectorAll(".btn-editar").forEach(btn => {
    btn.addEventListener("click", () => {
      const idx = parseInt(btn.getAttribute("data-idx"), 10);
      cargarProductoEnFormulario(idx);
    });
  });

  cont.querySelectorAll(".btn-eliminar").forEach(btn => {
    btn.addEventListener("click", async () => {
      const idx = parseInt(btn.getAttribute("data-idx"), 10);
      const p = productos[idx];
      if (!confirm(`¿Eliminar el producto "${p.nombre}"?`)) return;
      productos.splice(idx, 1);
      await guardarProductosEnGitHub("Eliminar producto");
      renderListaProductos();
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
}

function cargarProductoEnFormulario(index) {
  const p = productos[index];
  document.getElementById("nombre").value = p.nombre || "";
  document.getElementById("precio").value = p.precio || "";
  document.getElementById("descripcion").value = p.descripcion || "";
  document.getElementById("categoria").value = p.categoria || "bisuteria";
  document.getElementById("productoIndex").value = index;
  const prev = document.getElementById("previewImagen");
  if (prev) {
    prev.innerHTML = p.imagen
      ? `<span class="small">Imagen actual:</span><br><img src="${p.imagen}" alt="" style="max-width:100%;max-height:120px;border-radius:10px;margin-top:4px;" />`
      : `<span class="small">Sin imagen actual.</span>`;
  }
}

function initFormulario() {
  const form = document.getElementById("formProducto");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nombre = document.getElementById("nombre").value.trim();
    const precio = parseFloat(document.getElementById("precio").value);
    const descripcion = document.getElementById("descripcion").value.trim();
    const categoria = document.getElementById("categoria").value;
    const fileInput = document.getElementById("imagenInput");
    const idxHidden = document.getElementById("productoIndex").value;

    if (!nombre || isNaN(precio)) {
      alert("Nombre y precio son obligatorios.");
      return;
    }

    let imagenUrl = null;

    const estaEditando = idxHidden !== "";

    try {
      if (fileInput.files && fileInput.files[0]) {
        imagenUrl = await subirImagenACloudinary(fileInput.files[0]);
      }

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
      alert("Producto guardado correctamente.");
    } catch (err) {
      console.error(err);
      alert("Hubo un problema al guardar el producto. Revisa la consola para más detalles.");
    }
  });
}

// ---------- Login / Logout ----------

function mostrarAdmin() {
  const loginSection = document.getElementById("loginSection");
  const adminSection = document.getElementById("adminSection");
  if (loginSection) loginSection.style.display = "none";
  if (adminSection) adminSection.style.display = "block";
}

function mostrarLogin() {
  const loginSection = document.getElementById("loginSection");
  const adminSection = document.getElementById("adminSection");
  if (loginSection) loginSection.style.display = "block";
  if (adminSection) adminSection.style.display = "none";
}

function initLogin() {
  const tokenGuardado = localStorage.getItem("lc_github_token");
  if (tokenGuardado) {
    githubToken = tokenGuardado;
    mostrarAdmin();
    cargarProductosDesdeGitHub().catch(err => {
      console.error(err);
      alert("No se pudieron cargar los productos. Verifica tu token.");
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
        alert("Ingresa un token de GitHub válido.");
        return;
      }
      githubToken = token;
      localStorage.setItem("lc_github_token", token);
      mostrarAdmin();
      cargarProductosDesdeGitHub().catch(err => {
        console.error(err);
        alert("No se pudieron cargar los productos. Verifica tu token.");
        mostrarLogin();
      });
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("lc_github_token");
      githubToken = null;
      mostrarLogin();
    });
  }
}

// ---------- Init ----------

document.addEventListener("DOMContentLoaded", () => {
  initLogin();
  initFormulario();
});
