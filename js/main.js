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
  // Ejemplo: 52 (México) + número a 10 dígitos.
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
    // Normalizar: minusculas + quitar acentos
    const text = rawText
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    // Caso general por defecto
    const context = {
      profile: "general",
      packageName: "Sesion de masaje personalizado",
      services: ["Evaluacion inicial", "Masaje relajante / descontracturante"],
      rationale: "Voy a personalizar la sesion segun tu caso para ayudarte a reducir dolor y tension."
    };

    // -----------------------------
    // PALABRAS CLAVE GENERALES
    // -----------------------------
    const hayEspalda      = text.includes("espalda");
    const hayEspaldaBaja  = text.includes("espalda baja") || text.includes("zona lumbar") || text.includes("lumba");
    const haySentado      = text.includes("sentad") || text.includes("oficina") || text.includes("escritorio") || text.includes("silla") || text.includes("computadora") || text.includes("pc");

    const hayPiernas      = text.includes("pierna") || text.includes("pantorrilla") || text.includes("muslo");
    const hayPesadas      = text.includes("pesad") || text.includes("cansad") || text.includes("agotad") || text.includes("fatiga");
    const hayCirculacion  = text.includes("circulacion") ||
                            text.includes("hinchad") ||
                            text.includes("retencion de liquidos") ||
                            text.includes("liquidos");

    const hayMaraton      = text.includes("maraton") || text.includes("medio maraton") || text.includes("triatlon");
    const hayCorrer       = text.includes("acabo de correr") || text.includes("corri ") || text.includes("corriendo") || text.includes("correr");

    const hayCuello       = text.includes("cuello") || text.includes("cervical");
    const hayHombros      = text.includes("hombro") || text.includes("hombros") || text.includes("trapecio");
    const hayEstres       = text.includes("estres") || text.includes("ansiedad") || text.includes("nervios") ||
                            text.includes("nervioso") || text.includes("nerviosa") ||
                            text.includes("tenso") || text.includes("tension") ||
                            text.includes("estresado") || text.includes("estresada");

    const hayDolorFuerte  = text.includes("mucho dolor") ||
                            text.includes("dolor muy fuerte") ||
                            text.includes("no aguanto") ||
                            text.includes("intenso") ||
                            text.includes("intensidad 9") ||
                            text.includes("intensidad 10");

    // Embarazo
    const hayEmbarazo     = text.includes("embarazo") || text.includes("embarazada") || text.includes("gestacion") ||
                            text.includes("estoy embarazada") || text.includes("meses de embarazo");

    const riesgoEmbarazo  = text.includes("alto riesgo") || text.includes("amenaza de aborto") ||
                            text.includes("placenta previa") || text.includes("sangrado");

    // Migrañas / cabeza
    const hayCabeza       = text.includes("dolor de cabeza") || text.includes("cabeza") || text.includes("cefalea");
    const hayMigraña      = text.includes("migra") || text.includes("jaqueca");

    // Ansiedad / sueño
    const haySuenoMalo    = text.includes("no puedo dormir") || text.includes("insomnio") ||
                            text.includes("duermo mal") || text.includes("no descanso") || text.includes("desvelo");

    // Ciática
    const hayCiatica      = text.includes("ciatica") || text.includes("ciatico") || text.includes("nervio ciatico") ||
                            (hayEspaldaBaja && hayPiernas && text.includes("baja por la pierna"));

    // Bruxismo / mandíbula
    const hayBruxismo     = text.includes("bruxismo") || text.includes("aprieto los dientes") ||
                            text.includes("rechinar los dientes") || text.includes("mandibula") || text.includes("maxilar");

    // Red flags médicos
    const hayPecho        = text.includes("dolor en el pecho") || text.includes("pecho apretado") || text.includes("opresion en el pecho");
    const hayBrazoIzq     = text.includes("brazo izquierdo dormido") || text.includes("dolor en el brazo izquierdo");
    const hayFaltaAire    = text.includes("falta de aire") || text.includes("me cuesta respirar") || text.includes("dificultad para respirar");
    const hayMareoFuerte  = text.includes("mareo muy fuerte") || text.includes("me voy a desmayar") || text.includes("desmayo");
    const hayVision       = text.includes("vision borrosa") || text.includes("veo borroso") || text.includes("veo doble");

    const hayRedFlag = hayPecho || hayBrazoIzq || hayFaltaAire || hayMareoFuerte || hayVision;

    // -----------------------------------------
    // PRIORIDAD 0: RED FLAGS -> sugerir medico
    // -----------------------------------------
    if (hayRedFlag) {
      context.profile     = "red-flag-medica";
      context.packageName = "Valoracion medica previa";
      context.services    = [
        "Sugerencia de valoracion medica antes de cualquier masaje"
      ];
      context.rationale   = "Por algunos sintomas que mencionas, lo mas prudente es que primero te valore un medico. El masaje puede ser un complemento despues, pero la prioridad es descartar algo mas serio.";
      return context;
    }

    // -----------------------------------------
    // PRIORIDAD 1: EMBARAZO
    // -----------------------------------------
    if (hayEmbarazo) {
      if (riesgoEmbarazo) {
        // Embarazo de alto riesgo
        context.profile     = "embarazo-riesgo";
        context.packageName = "Consulta medica previa";
        context.services    = [
          "Consulta con tu ginecologo/a tratante",
          "Evaluar si es posible recibir masaje y en que condiciones"
        ];
        context.rationale   = "Al mencionar embarazo de alto riesgo o antecedentes delicados, es indispensable que tu medico tratante autorice y detalle si puedes recibir masaje, y en que zonas.";
        return context;
      }

      // Embarazo sin palabras de alto riesgo
      context.profile     = "embarazo";
      context.packageName = "Masaje prenatal seguro y adaptado";
      context.services    = [
        "Posicion lateral comoda",
        "Masaje suave en espalda y caderas (segun trimestre)",
        "Masaje en piernas para aliviar pesadez"
      ];
      context.rationale   = "Durante el embarazo, un masaje especifico y adaptado puede ayudar a aliviar la carga en espalda, caderas y piernas, siempre respetando las recomendaciones de tu medico.";
      return context;
    }

    // -----------------------------------------
    // PRIORIDAD 2: MIGRAÑAS / CABEZA
    // -----------------------------------------
    if (hayMigraña || (hayCabeza && hayEstres)) {
      context.profile     = "migraña-cabeza";
      context.packageName = "Masaje craneofacial + cuello y hombros";
      context.services    = [
        "Masaje suave en cuero cabelludo y rostro",
        "Trabajo delicado en cuello y trapecios",
        "Tecnicas de relajacion enfocadas"
      ];
      context.rationale   = "Cuando el dolor se concentra en cabeza y cuello, un masaje craneofacial con trabajo en trapecios ayuda a disminuir la tension y favorecer descanso.";
      return context;
    }

    // -----------------------------------------
    // PRIORIDAD 3: ANSIEDAD / NO DORMIR BIEN
    // -----------------------------------------
    if (hayEstres && haySuenoMalo) {
      context.profile     = "ansiedad-sueno";
      context.packageName = "Masaje relajante profundo + ritual de descanso";
      context.services    = [
        "Masaje relajante de cuerpo completo",
        "Enfasis en espalda, cuello y pies",
        "Ambiente con musica suave y respiracion guiada"
      ];
      context.rationale   = "Si sientes ansiedad y te cuesta dormir, un masaje relajante profundo acompañado de tecnicas de respiracion y ambiente tranquilo puede ayudar a que tu cuerpo active la respuesta de descanso.";
      return context;
    }

    // -----------------------------------------
    // PRIORIDAD 4: CIATICA / DOLOR QUE BAJA POR LA PIERNA
    // -----------------------------------------
    if (hayCiatica) {
      context.profile     = "ciatica";
      context.packageName = "Sesion enfocada en zona lumbar, gluteo y pierna";
      context.services    = [
        "Trabajo especifico en zona lumbar y gluteo",
        "Masaje en trayecto de la pierna afectada (sin invadir dolor agudo)",
        "Recomendaciones de posturas y estiramientos suaves"
      ];
      context.rationale   = "Cuando el dolor recorre desde la zona lumbar hacia la pierna, se suele trabajar con mucho cuidado la zona del nervio ciatico, gluteos y musculatura asociada, respetando siempre tu umbral de dolor.";
      return context;
    }

    // -----------------------------------------
    // PRIORIDAD 5: BRUXISMO / MANDIBULA
    // -----------------------------------------
    if (hayBruxismo) {
      context.profile     = "bruxismo-mandibula";
      context.packageName = "Masaje mandibular y cervical suave";
      context.services    = [
        "Masaje externo en zona de mandibula y maseteros",
        "Trabajo suave en cuello y base del craneo",
        "Recomendaciones posturales y de higiene del sueno"
      ];
      context.rationale   = "Cuando hay bruxismo o mucha tension en la mandibula, se puede trabajar suavemente la musculatura externa y descargar cervicales para disminuir la sensacion de rigidez.";
      return context;
    }

    // -----------------------------------------
    // CONTEXTOS ORIGINALES
    // -----------------------------------------

    // Espalda baja + trabajo sentado -> Paquete Plus
    if ((hayEspaldaBaja || (hayEspalda && text.includes("baja"))) && haySentado) {
      context.profile     = "sedentario-oficina";
      context.packageName = "Paquete Plus";
      context.services    = [
        "Masaje descontracturante en espalda",
        "Pistola de impacto en puntos clave",
        "Presoterapia para mejorar circulacion"
      ];
      context.rationale   = "Por el dolor en la espalda baja asociado a estar mucho tiempo sentado, este paquete combina masaje profundo, pistola de impacto y presoterapia para liberar tension y mejorar la circulacion.";
      return context;
    }

    // Deportista / maraton + piernas pesadas -> Masaje Deportivo + Presoterapia
    if ((hayMaraton || hayCorrer) && hayPiernas && hayPesadas) {
      context.profile     = "deportista";
      context.packageName = "Masaje Deportivo + Presoterapia";
      context.services    = [
        "Masaje deportivo en piernas",
        "Descarga muscular focalizada",
        "Presoterapia para recuperacion y drenaje"
      ];
      context.rationale   = "Despues de un maraton o entrenamientos intensos, este combo ayuda a descargar la musculatura, reducir la pesadez y acelerar la recuperacion de tus piernas.";
      return context;
    }

    // Cuello / hombros + estres -> Masaje Antiestres
    if ((hayCuello || hayHombros) && hayEstres) {
      context.profile     = "estres-cuello-hombros";
      context.packageName = "Masaje Antiestres + Espalda y Cervical";
      context.services    = [
        "Masaje antiestres",
        "Trabajo especifico en cuello y hombros",
        "Tecnicas de relajacion profunda"
      ];
      context.rationale   = "El estres acumulado suele fijarse en cuello y hombros. Este tratamiento ayuda a soltar la tension y a que tu cuerpo y mente descansen mejor.";
      return context;
    }

    // Piernas pesadas / circulacion -> Presoterapia + masaje piernas
    if (hayPiernas && (hayPesadas || hayCirculacion)) {
      context.profile     = "piernas-circulacion";
      context.packageName = "Sesion de Presoterapia + Masaje en Piernas";
      context.services    = [
        "Presoterapia enfocada en piernas",
        "Masaje circulatorio / drenante"
      ];
      context.rationale   = "La presoterapia y el masaje circulatorio ayudan a aliviar la pesadez, mejorar la circulacion y disminuir la retencion de liquidos en las piernas.";
      return context;
    }

    // Dolor muy fuerte en espalda / cuello / hombros -> Valoracion + masaje terapeutico
    if (hayDolorFuerte && (hayEspalda || hayCuello || hayHombros)) {
      context.profile     = "dolor-intenso";
      context.packageName = "Sesion de Valoracion + Masaje Terapeutico";
      context.services    = [
        "Evaluacion inicial",
        "Masaje terapeutico enfocado",
        "Recomendaciones de cuidado en casa"
      ];
      context.rationale   = "Por la intensidad del dolor, es importante valorar bien el origen y trabajar de forma puntual con masaje terapeutico.";
      return context;
    }

    // Si nada coincide, se queda el contexto general
    return context;
  }

  // ---------- Mensaje y URL de WhatsApp ----------

  function buildWhatsAppMessage(userText, context) {
    const base = [
      "Hola, mi asistente virtual Oscar en la pagina Wellness 21PM me recomendo el " + context.packageName + ".",
      "",
      "Esto fue lo que le conte:",
      `"` + userText.trim() + `"`,
      "",
      "Servicios sugeridos: " + context.services.join(", ") + ".",
      "",
      "¿Me ayudas a agendar una sesion con esa recomendacion?"
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
      <p>Por lo que me cuentas, lo mas adecuado para ti es: <strong>${context.packageName}</strong>.</p>
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
