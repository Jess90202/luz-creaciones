document.addEventListener("DOMContentLoaded", () => {
  const yearEl = document.getElementById("year");
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  const navToggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".site-nav");

  if (navToggle && nav) {
    navToggle.addEventListener("click", () => {
      nav.classList.toggle("show");
    });

    nav.querySelectorAll("a").forEach(link => {
      link.addEventListener("click", () => {
        nav.classList.remove("show");
      });
    });
  }

  // Scroll suave
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener("click", function(e) {
      const targetId = this.getAttribute("href").slice(1);
      const target = document.getElementById(targetId);
      if (target) {
        e.preventDefault();
        window.scrollTo({
          top: target.offsetTop - 72,
          behavior: "smooth"
        });
      }
    });
  });
});


// ============ CHAT IA WELLNESS 21PM ============ 
document.addEventListener("DOMContentLoaded", () => {
  const chatWidget = document.querySelector(".ai-chat-widget");
  if (!chatWidget) return;

  const chatToggle = chatWidget.querySelector(".ai-chat-toggle");
  const chatWindow = chatWidget.querySelector(".ai-chat-window");
  const chatClose = chatWidget.querySelector(".ai-chat-close");
  const messagesEl = document.getElementById("aiChatMessages");
  const formEl = document.getElementById("aiChatForm");
  const inputEl = document.getElementById("aiChatText");

  const WHATSAPP_PHONE = "5585662464"; // número proporcionado

  let chatOpenedOnce = false;
  let lastUserInput = "";
  let lastRecommendationSummary = "";

  function escapeHtml(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function addMessage(html, type) {
    const wrapper = document.createElement("div");
    wrapper.classList.add("ai-chat-message");
    wrapper.classList.add(type === "user" ? "ai-chat-user" : "ai-chat-assistant");
    wrapper.innerHTML = html;
    messagesEl.appendChild(wrapper);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function addAssistantMessage(html) {
    addMessage(html, "assistant");
  }

  function addUserMessage(text) {
    addMessage("<p>" + escapeHtml(text) + "</p>", "user");
  }

  function openChat() {
    chatWindow.classList.add("open");
    if (!chatOpenedOnce) {
      chatOpenedOnce = true;
      addAssistantMessage(
        "<p>Hola, soy tu asistente de <strong>Wellness 21PM</strong>.</p>" +
        "<p>Cuéntame en qué zona sientes dolor, desde cuándo y qué actividades haces normalmente. " +
        "Con eso te sugiero el tipo de masaje o combinación de servicios que puede ayudarte mejor.</p>"
      );
    }
  }

  function closeChat() {
    chatWindow.classList.remove("open");
  }

  function getRecommendations(text) {
    const t = text.toLowerCase();
    const sugerencias = [];

    function add(service, reason) {
      sugerencias.push({ service, reason });
    }

    // Deportistas / entrenamiento
    if (/(deport|gym|gimnasio|correr|marat[oó]n|entreno|entrenamiento|partido|f[úu]tbol)/.test(t)) {
      add(
        "Masaje atlético deportivo",
        "para recuperación post-entrenamiento, prevenir lesiones y mejorar rendimiento."
      );
    }

    // Estrés general
    if (/(estr[eé]s|ansiedad|cansancio mental|agotad[oa]|no puedo dormir|insomnio)/.test(t)) {
      add(
        "Masaje antiestrés",
        "para soltar tensión general en cuello, hombros y espalda y mejorar el descanso."
      );
    }

    // Contracturas / rigidez
    if (/(contractura|nudo|tort[ií]colis|rigidez|espalda alta|espalda baja|lumbalgia|cuello|hombro)/.test(t)) {
      add(
        "Masaje descontracturante",
        "para trabajar puntos de dolor, rigidez y contracturas específicas."
      );
    }

    // Piernas pesadas / circulación
    if (/(piernas pesadas|retenci[oó]n de l[ií]quidos|circulaci[oó]n|hinchaz[oó]n|edema|varices)/.test(t)) {
      add(
        "Presoterapia",
        "para ayudar a la circulación, aliviar sensación de pesadez y favorecer el drenaje."
      );
    }

    // Dolor crónico / emocional / migrañas / sueño
    if (/(cr[oó]nico|migra[ñn]a|cefalea|nervio ci[aá]tico|ci[aá]tica|emocional|ansiedad fuerte|hormonal)/.test(t)) {
      add(
        "Acupuntura y electroacupuntura",
        "como apoyo en dolor crónico, migrañas, ciática y regulación emocional."
      );
    }

    // Dolor agudo localizado
    if (/(dolor agudo|punzante|postoperatorio|post-operatorio)/.test(t)) {
      add(
        "TENS",
        "para modular dolor agudo localizado y apoyar en procesos post-operatorios."
      );
    }

    // Mucha rigidez en espalda
    if (/(muy rigido|muy r[ií]gido|espalda trabada|espalda hecha nudo|no me puedo mover)/.test(t)) {
      add(
        "Ventosas",
        "para liberar fascia y ayudar a soltar zonas muy cargadas en espalda."
      );
    }

    // Puntos muy específicos / trigger points
    if (/(punto gatillo|trigger point|punto muy específico|bolita de dolor)/.test(t)) {
      add(
        "Pistola de infrarrojo y de percusión",
        "para trabajar puntos muy específicos y zonas profundas."
      );
    }

    // Inflamación / lesiones de tejido blando
    if (/(inflamaci[oó]n|esguince|tendinitis|fascitis|tend[oó]n|ligamento)/.test(t)) {
      add(
        "Láser 808 y 650 nm",
        "como apoyo para acelerar reparación celular y procesos inflamatorios."
      );
    }

    // Procesos más largos / varias zonas
    if (/(mucho tiempo|a[ñn]os|recae|reca[ií]da|varias zonas|todo el cuerpo)/.test(t)) {
      add(
        "Planes de seguimiento",
        "para trabajar tu caso a mediano plazo con sesiones y recomendaciones estructuradas."
      );
    }

    // Si no detecta nada concreto, propone algo general
    if (!sugerencias.length) {
      add(
        "Masaje antiestrés",
        "como primera opción para liberar tensión general y ver cómo responde tu cuerpo."
      );
    }

    const listaHtml = sugerencias
      .map(
        (s) =>
          "<li><strong>" + s.service + "</strong>: " + s.reason + "</li>"
      )
      .join("");

    const replyHtml =
      "<p>Gracias por contarme lo que sientes. Con lo que me describes, podríamos trabajar:</p>" +
      "<ul>" + listaHtml + "</ul>" +
      "<p>En cabina se puede ajustar la combinación exacta según cómo llegues ese día.</p>" +
      "<p><strong>¿Quieres que te ayude a agendar por WhatsApp?</strong></p>" +
      '<button class="ai-chat-whatsapp-btn" type="button">' +
      '<i class="fa-brands fa-whatsapp"></i> Sí, agendar por WhatsApp' +
      "</button>";

    const resumen = sugerencias.map((s) => s.service).join(", ");

    return {
      html: replyHtml,
      resumen
    };
  }

  // Eventos UI
  chatToggle.addEventListener("click", () => {
    if (chatWindow.classList.contains("open")) {
      closeChat();
    } else {
      openChat();
    }
  });

  chatClose.addEventListener("click", closeChat);

  formEl.addEventListener("submit", (e) => {
    e.preventDefault();
    const value = inputEl.value.trim();
    if (!value) return;

    lastUserInput = value;
    addUserMessage(value);
    inputEl.value = "";

    const { html, resumen } = getRecommendations(value);
    lastRecommendationSummary = resumen;
    addAssistantMessage(html);
  });

  // Click en el botón de WhatsApp dentro de los mensajes
  messagesEl.addEventListener("click", (e) => {
    const btn = e.target.closest(".ai-chat-whatsapp-btn");
    if (!btn) return;

    const texto = encodeURIComponent(
      "Hola, vengo de la página web de Wellness 21PM.%0A%0A" +
      "Mis síntomas/dolores: " + (lastUserInput || "(no especificado)") + ".%0A%0A" +
      "El asistente me recomendó: " + (lastRecommendationSummary || "(por definir)") + ".%0A%0A" +
      "¿Me ayudas a agendar una sesión?"
    );

    const url = "https://wa.me/" + WHATSAPP_PHONE + "?text=" + texto;
    window.open(url, "_blank");
  });
});

