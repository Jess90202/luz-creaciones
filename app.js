let productosData = [];
let categoriaActual = "todas";

function coincideFiltro(producto, categoria, texto) {
    const catOk = categoria === "todas" || producto.categoria === categoria;
    if (!catOk) return false;
    if (!texto) return true;
    const t = texto.toLowerCase();
    return (
        (producto.nombre || "").toLowerCase().includes(t) ||
        (producto.descripcion || "").toLowerCase().includes(t)
    );
}

function renderCatalogo() {
    const contenedor = document.getElementById("productos");
    const sinResultados = document.getElementById("sinResultados");
    if (!contenedor) return;

    const buscador = document.getElementById("buscador");
    const texto = buscador ? buscador.value.trim() : "";

    contenedor.innerHTML = "";

    const filtrados = productosData.filter(p => coincideFiltro(p, categoriaActual, texto));

    if (filtrados.length === 0) {
        if (sinResultados) sinResultados.style.display = "block";
        return;
    } else if (sinResultados) {
        sinResultados.style.display = "none";
    }

    filtrados.forEach(p => {
        const card = document.createElement("article");
        card.className = "card";

        card.innerHTML = `
      <div class="card-image-wrapper">
        <span class="card-badge">${p.categoria === "madera" ? "Madera" : "Bisutería"}</span>
        <img src="${p.imagen}" alt="${p.nombre || ""}" class="zoomable-img" loading="lazy">
      </div>
      <div class="card-content">
        <h3>${p.nombre || ""}</h3>
        <p class="card-desc">${p.descripcion || ""}</p>
        <div class="card-footer">
          <span class="price">$${p.precio}</span>
          <a class="btn-icon"
             href="https://wa.me/525548270460?text=${encodeURIComponent("Hola, me interesa: " + (p.nombre || ""))}"
             target="_blank" title="Pedir por WhatsApp">
            💬
          </a>
        </div>
      </div>
    `;

        contenedor.appendChild(card);
    });
}

async function cargarCatalogo() {
    try {
        const res = await fetch("data/productos.json?cache=" + Date.now());
        if (!res.ok) {
            console.error("No se pudo cargar productos.json");
            return;
        }
        const data = await res.json();
        productosData = (data && data.productos) ? data.productos : [];
        renderCatalogo();
    } catch (e) {
        console.error("Error cargando catálogo", e);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    // Disable right-click on images
    document.addEventListener('contextmenu', (e) => {
        if (e.target.tagName === 'IMG') {
            e.preventDefault();
        }
    });

    const buscador = document.getElementById("buscador");
    const pills = document.querySelectorAll(".cat-pill");

    // Manejo de pills de categoría
    pills.forEach(pill => {
        pill.addEventListener("click", () => {
            // Remover active de todos
            pills.forEach(p => p.classList.remove("active"));
            // Activar el clickeado
            pill.classList.add("active");
            // Actualizar estado y renderizar
            categoriaActual = pill.dataset.cat;
            renderCatalogo();
        });
    });

    if (buscador) {
        buscador.addEventListener("input", () => {
            renderCatalogo();
        });
    }

    cargarCatalogo();

    // Navegación Inicio / Contacto
    const navInicio = document.getElementById("navInicio");
    const navContacto = document.getElementById("navContacto");
    const contactoSection = document.getElementById("contacto");
    const productosSection = document.getElementById("productos");
    const filtersBar = document.querySelector(".filters-bar");

    function mostrarInicio() {
        if (contactoSection) contactoSection.style.display = "none";
        if (productosSection) productosSection.style.display = "grid";
        if (filtersBar) filtersBar.style.display = "block";
        if (navInicio) navInicio.classList.add("active");
        if (navContacto) navContacto.classList.remove("active");
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function mostrarContacto() {
        if (contactoSection) contactoSection.style.display = "block";
        if (productosSection) productosSection.style.display = "none";
        if (filtersBar) filtersBar.style.display = "none";
        if (navInicio) navInicio.classList.remove("active");
        if (navContacto) navContacto.classList.add("active");
    }

    if (navInicio) {
        navInicio.addEventListener("click", (e) => {
            e.preventDefault();
            mostrarInicio();
        });
    }

    if (navContacto) {
        navContacto.addEventListener("click", (e) => {
            e.preventDefault();
            mostrarContacto();
        });
    }

    // ZOOM DE IMÁGENES
    const overlay = document.getElementById("imageOverlay");
    const overlayImg = document.getElementById("overlayImg");
    const overlayClose = document.getElementById("overlayClose");

    function cerrarOverlay() {
        if (!overlay) return;
        overlay.classList.remove("active");
        setTimeout(() => {
            if (overlayImg) overlayImg.src = "";
        }, 300);
    }

    document.body.addEventListener("click", (e) => {
        if (e.target.classList.contains("zoomable-img")) {
            if (overlayImg) overlayImg.src = e.target.src;
            if (overlay) overlay.classList.add("active");
        }
        if (e.target === overlay) {
            cerrarOverlay();
        }
    });

    if (overlayClose) {
        overlayClose.addEventListener("click", cerrarOverlay);
    }
});
