let productosData = [];

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
  const activeChip = document.querySelector(".chip-button.active");

  const categoria = activeChip ? activeChip.dataset.categoria : "todas";
  const texto = buscador ? buscador.value.trim() : "";

  contenedor.innerHTML = "";

  const filtrados = productosData.filter(p => coincideFiltro(p, categoria, texto));

  if (filtrados.length === 0) {
    if (sinResultados) sinResultados.style.display = "block";
    return;
  } else if (sinResultados) {
    sinResultados.style.display = "none";
  }

  filtrados.forEach(p => {
    const chipClass = p.categoria === "madera" ? "chip-categoria madera" : "chip-categoria";
    const card = document.createElement("article");
    card.className = "card";

    card.innerHTML = `
      <span class="${chipClass}">
        ${p.categoria === "madera" ? "Madera" : "Bisutería"}
      </span>
      <div class="image-frame">
        <img src="${p.imagen}" alt="${p.nombre || ""}" class="zoomable-img" draggable="false" oncontextmenu="return false;">
      </div>
      <h3>${p.nombre || ""}</h3>
      <p class="precio">$${p.precio}</p>
      <p>${p.descripcion || ""}</p>
      <a class="btn btn-whatsapp"
         href="https://wa.me/525548270460?text=${encodeURIComponent("Hola, me interesa el producto: " + (p.nombre || ""))}"
         target="_blank">
        <span class="icon-circle">💬</span>
        <span>Pedir por WhatsApp</span>
      </a>
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
  const buscador = document.getElementById("buscador");
  const categoriaChips = document.querySelectorAll(".chip-button");

  if (categoriaChips.length > 0) {
    categoriaChips.forEach((btn) => {
      btn.addEventListener("click", () => {
        categoriaChips.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        renderCatalogo();
      });
    });
  }

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

  function setActive(link) {
    if (!navInicio || !navContacto) return;
    navInicio.classList.remove("active");
    navContacto.classList.remove("active");
    link.classList.add("active");
  }

  if (navInicio && contactoSection) {
    navInicio.addEventListener("click", (e) => {
      e.preventDefault();
      contactoSection.style.display = "none";
      window.scrollTo({ top: 0, behavior: "smooth" });
      setActive(navInicio);
      if (window.location.hash) {
        history.replaceState(null, "", window.location.pathname);
      }
    });
  }

  // Hacer clic en el logo o en "Luz Creaciones" lleva al inicio
  const brand = document.querySelector(".brand");
  if (brand && navInicio && contactoSection) {
    brand.addEventListener("click", (e) => {
      e.preventDefault();
      contactoSection.style.display = "none";
      window.scrollTo({ top: 0, behavior: "smooth" });
      setActive(navInicio);
      if (window.location.hash) {
        history.replaceState(null, "", window.location.pathname);
      }
    });
  }

  if (navContacto && contactoSection) {
    navContacto.addEventListener("click", (e) => {
      e.preventDefault();
      contactoSection.style.display = "block";
      contactoSection.scrollIntoView({ behavior: "smooth" });
      setActive(navContacto);
      history.replaceState(null, "", "#contacto");
    });

    if (window.location.hash === "#contacto") {
      contactoSection.style.display = "block";
      setTimeout(() => {
        contactoSection.scrollIntoView({ behavior: "smooth" });
      }, 100);
      setActive(navContacto);
    }
  }

  // ZOOM DE IMÁGENES
  const overlay = document.getElementById("imageOverlay");
  const overlayImg = document.getElementById("overlayImg");
  const overlayClose = document.getElementById("overlayClose");

  function cerrarOverlay() {
    if (!overlay || !overlayImg) return;
    overlay.classList.remove("open");
    overlay.setAttribute("aria-hidden", "true");
    setTimeout(() => {
      overlayImg.src = "";
    }, 180);
  }

  if (overlay && overlayImg) {
    document.body.addEventListener("click", (e) => {
      const img = e.target.closest(".zoomable-img");
      if (img) {
        overlayImg.src = img.src;
        overlay.classList.add("open");
        overlay.setAttribute("aria-hidden", "false");
        return;
      }
      if (e.target === overlay || e.target.classList.contains("image-overlay-backdrop")) {
        cerrarOverlay();
      }
    });
  }

  if (overlayClose) {
    overlayClose.addEventListener("click", (e) => {
      e.stopPropagation();
      cerrarOverlay();
    });
  }

  // Desactivar clic derecho y arrastrar en imágenes
  document.addEventListener("contextmenu", (e) => {
    if (e.target.tagName === "IMG") {
      e.preventDefault();
    }
  });

  document.addEventListener("dragstart", (e) => {
    if (e.target.tagName === "IMG") {
      e.preventDefault();
    }
  });
});
