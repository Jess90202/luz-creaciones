// ========== NAVEGACIÓN Y HEADER ==========
document.addEventListener("DOMContentLoaded", () => {
  // Año dinámico en el footer
  const yearEl = document.getElementById("year");
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  const navToggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".site-nav");

  // Menú móvil
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

  // Scroll suave para anclas internas (#inicio, #servicios, etc.)
  const internalLinks = document.querySelectorAll('a[href^="#"]');
  internalLinks.forEach(anchor => {
    anchor.addEventListener("click", function (e) {
      const targetId = this.getAttribute("href").slice(1);
      const target = document.getElementById(targetId);
      if (target) {
        e.preventDefault();
        const offset = 72; // altura aproximada del header
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({
          top,
          behavior: "smooth"
        });
      }
    });
  });
});

// ============ ASISTENTE VIRTUAL "ÓSCAR" ============
document.addEventListener("DOMContentLoaded", () => {
  const chatWidget   = document.querySelector(".ai-chat-widget");
  if (!chatWidget) return;

  const chatToggle   = chatWidget.querySelector(".ai-chat-toggle");
  const chatWindow   = chatWidget.querySelector(".ai-chat-window");
  const chatClose    = chatWidget.querySelector(".ai-chat-close");
  const chatMessages = document.getElementById("aiChatMessages");
  const chatForm     = document.getElementById("aiChatForm");
  const chatInput    = document.getElementById("aiChatText");

  // Cambia este número a tu WhatsApp (formato internacional sin + ni espacios)
  // Ejemplo: 52 (México) + 1 (si aplica) + número a 10 dígitos.
  const WHATSAPP_PHONE = "525585662464";

  if (!chatToggle || !chatWindow || !chatClose || !chatMessages || !chatForm || !chatInput) {
    console.warn("No se encontraron todos los elementos del asistente Óscar. Revisa los selectores.");
    return;
  }

  let hasGreeted = false;
  let isTyping   = false;

  // ---------- Utilidades de UI ----------

  function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function createMessageElement(sender, htmlContent, isTypingMsg = false) {
    const wrapper = document.createElement("div");
    wrapper.classList.add("ai-chat-message");
    wrapper.classList.add(sender === "user" ? "ai-chat-user" : "ai-chat-assistant");
    if (isTypingMsg) wrapper.classList.add("typing");

    const bubble = document.createElement("div");
    bubble.classList.add("ai-chat-bubble");
    bubble.innerHTML = htmlContent;

    wrapper.appendChild(bubble);
    return wrapper;
  }

  function addUserMessage(text) {
    const safeText = text.trim();
    if (!safeText) return;
    const msg = createMessageElement("user", safeText);
    chatMessages.appendChild(msg);
    scrollToBottom();
  }

  function addBotMessage(htmlContent) {
    const msg = createMessageElement("bot", htmlContent);
    chatMessages.appendChild(msg);
    scrollToBottom();
  }

  // ---------- Indicador "escribiendo..." ----------

  function showTyping() {
    if (isTyping) return;
    isTyping = true;
    const dotsHTML = `
      <span class="typing-dots">
        <span>.</span><span>.</span><span>.</span>
      </span>
    `;
    const typingMsg = createMessageElement("bot", dotsHTML, true);
    chatMessages.appendChild(typingMsg);
    scrollToBottom();
  }

  function hideTyping() {
    isTyping = false;
    const typingMsg = chatMessages.querySelector(".ai-chat-message.typing");
    if (typingMsg) typingMsg.remove();
  }

  // ---------- Detección de contexto / lógica de recomendación ----------

  function analyzeContext(rawText) {
    const text = rawText.toLowerCase();

    // Caso general por defecto
    const context = {
      profile: "general",
      packageName: "Sesión de masaje personalizado",
      services: ["Evaluación inicial", "Masaje relajante / descontracturante"],
      rationale: "Voy a personalizar la sesión según tu caso para ayudarte a reducir dolor y tensión."
    };

    // Caso 1: Espalda baja + trabajo sentado → Paquete Plus
    const espaldaBaja = text.includes("espalda baja") || text.includes("zona lumbar") || text.includes("lumbalgia");
    const sentado     = text.includes("sentado") || text.includes("oficina") || text.includes("silla") || text.includes("computadora") || text.includes("pc");

    if (espaldaBaja && sentado) {
      context.profile     = "sedentario-oficina";
      context.packageName = "Paquete Plus";
      context.services    = [
        "Masaje descontracturante en espalda",
        "Pistola de impacto en puntos clave",
        "Presoterapia para mejorar circulación"
      ];
      context.rationale   = "Por el dolor en la espalda baja asociado a estar mucho tiempo sentado, este paquete combina masaje profundo, pistola de impacto y presoterapia para liberar tensión y mejorar la circulación.";
      return context;
    }

    // Caso 2: Deportista / maratón / piernas pesadas → Masaje Deportivo + Presoterapia
    const maraton  = text.includes("maratón") || text.includes("maraton");
    const correr   = text.includes("corr") || text.includes("running") || text.includes("trote");
    const piernas  = text.includes("piernas") || text.includes("pantorrillas") || text.includes("pantorrilla") || text.includes("muslos") || text.includes("muslo");
    const pesadas  = text.includes("pesadas") || text.includes("cansadas") || text.includes("fatiga");

    if ((maraton || correr) && piernas && pesadas) {
      context.profile     = "deportista";
      context.packageName = "Masaje Deportivo + Presoterapia";
      context.services    = [
        "Masaje deportivo en piernas",
        "Descarga muscular focalizada",
        "Presoterapia para recuperación y drenaje"
      ];
      context.rationale   = "Después de un maratón o entrenamientos intensos, este combo ayuda a descargar la musculatura, reducir la pesadez y acelerar la recuperación de tus piernas.";
      return context;
    }

    // Caso 3: Dolor en cuello/hombros asociado a estrés
    const cuello   = text.includes("cuello") || text.includes("cervical");
    const hombros  = text.includes("hombro") || text.includes("hombros") || text.includes("trapecio");
    const estres   = text.includes("estrés") || text.includes("estres") || text.includes("ansiedad") || text.includes("tenso") || text.includes("tensión") || text.includes("tension");

    if ((cuello || hombros) && estres) {
      context.profile     = "estrés-cuello-hombros";
      context.packageName = "Masaje Antiestrés + Espalda y Cervical";
      context.services    = [
        "Masaje antiestrés",
        "Trabajo específico en cuello y hombros",
        "Técnicas de relajación profunda"
      ];
      context.rationale   = "El estrés acumulado suele fijarse en cuello y hombros. Este tratamiento ayuda a soltar la tensión y a que tu cuerpo y mente descansen mejor.";
      return context;
    }

    // Caso 4: Pesadez de piernas / circulación sin deporte claro
    const circulacion = text.includes("circulación") || text.includes("circulacion") ||
                        text.includes("hinchadas") || text.includes("hinchazón") || text.includes("hinchazon") ||
                        text.includes("retención de líquidos") || text.includes("retencion de liquidos");

    if (piernas && (pesadas || circulacion)) {
      context.profile     = "piernas-circulacion";
      context.packageName = "Sesión de Presoterapia + Masaje en Piernas";
      context.services    = [
        "Presoterapia enfocada en piernas",
        "Masaje circulatorio / drenante"
      ];
      context.rationale   = "La presoterapia y el masaje circulatorio ayudan a aliviar la pesadez, mejorar la circulación y disminuir la retención de líquidos en las piernas.";
      return context;
    }

    // Caso 5: dolor muy fuerte en zona espalda/cuello/hombros → valoración + masaje terapéutico
    const dolorFuerte = text.includes("mucho dolor") || text.includes("dolor muy fuerte") ||
                        text.includes("no aguanto") || text.includes("intenso");

    if (dolorFuerte && (espaldaBaja || cuello || hombros)) {
      context.profile     = "dolor-intenso";
      context.packageName = "Sesión de Valoración + Masaje Terapéutico";
      context.services    = [
        "Evaluación inicial",
        "Masaje terapéutico enfocado",
        "Recomendaciones de cuidado en casa"
      ];
      context.rationale   = "Por la intensidad del dolor, es importante valorar bien el origen y trabajar de forma puntual con masaje terapéutico.";
      return context;
    }

    // Default (ya definido arriba)
    return context;
  }

  // ---------- Mensaje y URL de WhatsApp ----------

  function buildWhatsAppMessage(userText, context) {
    const base = [
      "Hola, mi asistente virtual Óscar en la página Wellness 21PM me recomendó el " + context.packageName + ".",
      "",
      "Esto fue lo que le conté:",
      `"` + userText.trim() + `"`,
      "",
      "Servicios sugeridos: " + context.services.join(", ") + ".",
      "",
      "¿Me ayudas a agendar una sesión con esa recomendación?"
    ].join("\n");

    return base;
  }

  function buildWhatsAppUrl(userText, context) {
    const message = buildWhatsAppMessage(userText, context);
    const encoded = encodeURIComponent(message);
    return "https://wa.me/" + WHATSAPP_PHONE + "?text=" + encoded;
  }

  // ---------- Respuesta de Óscar ----------

  function respondAsOscar(userText) {
    const context = analyzeContext(userText);
    const waUrl   = buildWhatsAppUrl(userText, context);

    const html = `
      <p><strong>Hola, soy Óscar, tu asistente virtual.</strong></p>
      <p>Por lo que me cuentas, lo más adecuado para ti es: <strong>${context.packageName}</strong>.</p>
      <p>${context.rationale}</p>
      <p><strong>Incluye:</strong> ${context.services.join(" · ")}.</p>
      <p>Si quieres, puedo ayudarte a agendar ahora mismo:</p>
      <button class="ai-chat-whatsapp-button" data-wa="${waUrl}">
        Agendar por WhatsApp
      </button>
    `;

    hideTyping();
    addBotMessage(html);
  }

  // ---------- Eventos de apertura / cierre del chat ----------

  chatToggle.addEventListener("click", () => {
    const isOpen = chatWindow.classList.contains("open");

    if (isOpen) {
      chatWindow.classList.remove("open");
      chatWindow.setAttribute("aria-hidden", "true");
      return;
    }

    chatWindow.classList.add("open");
    chatWindow.setAttribute("aria-hidden", "false");

    if (!hasGreeted) {
      const introHtml = `
        <p><strong>Hola, soy Óscar 👋</strong></p>
        <p>Cuéntame con tus palabras qué sientes: por ejemplo,</p>
        <ul>
          <li>"Me duele mucho la espalda baja porque trabajo sentado todo el día".</li>
          <li>"Acabo de correr un maratón y siento las piernas pesadas".</li>
        </ul>
        <p>Con eso te recomiendo el mejor tratamiento y te dejo un botón directo para agendar por WhatsApp.</p>
      `;
      addBotMessage(introHtml);
      hasGreeted = true;
    }
  });

  chatClose.addEventListener("click", () => {
    chatWindow.classList.remove("open");
    chatWindow.setAttribute("aria-hidden", "true");
  });

  // ---------- Envío de mensaje del usuario ----------

  chatForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const text = chatInput.value.trim();
    if (!text) return;

    addUserMessage(text);
    chatInput.value = "";

    showTyping();

    // Pequeño retraso para simular que "piensa"
    setTimeout(() => {
      respondAsOscar(text);
    }, 900);
  });

  // ---------- Click en el botón verde de WhatsApp dentro del chat ----------

  chatMessages.addEventListener("click", (event) => {
    const btn = event.target.closest(".ai-chat-whatsapp-button");
    if (!btn) return;

    const url = btn.dataset.wa;
    if (url) {
      window.open(url, "_blank");
    }
  });
});
