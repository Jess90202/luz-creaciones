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

// ============ CHAT IA WELLNESS 21PM 2.0 ============
document.addEventListener("DOMContentLoaded", () => {
  const chatWidget = document.querySelector(".ai-chat-widget");
  if (!chatWidget) return;

  const chatToggle = chatWidget.querySelector(".ai-chat-toggle");
  const chatWindow = chatWidget.querySelector(".ai-chat-window");
  const chatClose = chatWidget.querySelector(".ai-chat-close");
  const messagesEl = document.getElementById("aiChatMessages");
  const formEl = document.getElementById("aiChatForm");
  const inputEl = document.getElementById("aiChatText");

  const WHATSAPP_PHONE = "5585662464";

  // Estado de la conversación
  let chatOpenedOnce = false;
  let conversationStage = "intro"; // intro → askGoal → askIntensity → askDuration → ready
  let lastRecommendationSummary = "";

  const userProfile = {
    rawText: "",
    zone: "",
    goal: "",
    intensity: "",
    duration: ""
  };

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

  function hasRedFlags(text) {
    const t = text.toLowerCase();
    return /dolor en el pecho|pecho apretado|falta de aire|no puedo respirar|desmayo|p[eé]rdida de conciencia|par[aá]lisis|cara chueca|hablo raro|embarazo de riesgo|sangrado abundante/.test(
      t
    );
  }

  function detectZone(text) {
    const t = text.toLowerCase();
    if (/espalda baja|lumba|lumbar/.test(t)) return "espalda baja / zona lumbar";
    if (/espalda alta|dorsal|om[oó]platos/.test(t)) return "espalda alta";
    if (/cuello|nuca/.test(t)) return "cuello / nuca";
    if (/hombro/.test(t)) return "hombros";
    if (/pierna|muslo|pantorrilla|pantorrillas|rodilla|rodillas/.test(t)) return "piernas";
    if (/pie|pies|planta/.test(t)) return "pies";
    if (/cabeza|migra[ñn]a|cefalea/.test(t)) return "cabeza";
    return "";
  }

  function normalizeGoal(text) {
    const t = text.toLowerCase();
    if (/relaj|estr[eé]s|descansar|ansiedad/.test(t)) return "relajación / manejo de estrés";
    if (/deport|rendimiento|gym|gimnasio|entrenamiento|competencia|marat[oó]n/.test(t))
      return "rendimiento deportivo / recuperación";
    if (/circulaci[oó]n|piernas pesadas|retenci[oó]n|hinchaz[oó]n|varices/.test(t))
      return "mejorar circulación / piernas ligeras";
    if (/dolor|contractura|nudo|tort[ií]colis|lumbalgia/.test(t))
      return "aliviar dolor específico";
    if (/emocional|estado de [aá]nimo|hormonal/.test(t)) return "equilibrio emocional";
    return "";
  }

  function parseIntensity(text) {
    const match = text.match(/(\d{1,2})/);
    if (!match) return "";
    const value = parseInt(match[1], 10);
    if (isNaN(value)) return "";
    if (value < 0) return "0";
    if (value > 10) return "10";
    return String(value);
  }

  function getRecommendations(profile) {
    const t = profile.rawText.toLowerCase();
    const recs = [];

    function add(service, reason) {
      recs.push({ service, reason });
    }

    // Base según síntomas
    if (/(deport|gym|gimnasio|correr|marat[oó]n|entreno|entrenamiento|partido|f[úu]tbol)/.test(t)) {
      add(
        "Masaje atlético deportivo",
        "para recuperación post-entrenamiento, prevenir lesiones y mejorar rendimiento."
      );
    }

    if (/(estr[eé]s|ansiedad|cansancio mental|agotad[oa]|no puedo dormir|insomnio)/.test(t)) {
      add(
        "Masaje antiestrés",
        "para soltar tensión general en cuello, hombros y espalda y mejorar el descanso."
      );
    }

    if (/(contractura|nudo|tort[ií]colis|rigidez|espalda alta|espalda baja|lumbalgia|cuello|hombro)/.test(
      t
    )) {
      add(
        "Masaje descontracturante",
        "para trabajar puntos de dolor, rigidez y contracturas específicas."
      );
    }

    if (/(piernas pesadas|retenci[oó]n de l[ií]quidos|circulaci[oó]n|hinchaz[oó]n|edema|varices)/.test(
      t
    )) {
      add(
        "Presoterapia",
        "para ayudar a la circulación, aliviar sensación de pesadez y favorecer el drenaje."
      );
    }

    if (/(cr[oó]nico|migra[ñn]a|cefalea|nervio ci[aá]tico|ci[aá]tica|emocional|ansiedad fuerte|hormonal)/.test(
      t
    )) {
      add(
        "Acupuntura y electroacupuntura",
        "como apoyo en dolor crónico, migrañas, ciática y regulación emocional."
      );
    }

    if (/(dolor agudo|punzante|postoperatorio|post-operatorio)/.test(t)) {
      add("TENS", "para modular dolor agudo localizado y apoyar en procesos post-operatorios.");
    }

    if (/(muy rigido|muy r[ií]gido|espalda trabada|espalda hecha nudo|no me puedo mover)/.test(t)) {
      add("Ventosas", "para liberar fascia y ayudar a soltar zonas muy cargadas en espalda.");
    }

    if (/(punto gatillo|trigger point|punto muy específico|bolita de dolor)/.test(t)) {
      add(
        "Pistola de infrarrojo y de percusión",
        "para trabajar puntos muy específicos y zonas profundas."
      );
    }

    if (/(inflamaci[oó]n|esguince|tendinitis|fascitis|tend[oó]n|ligamento)/.test(t)) {
      add(
        "Láser 808 y 650 nm",
        "como apoyo para acelerar reparación celular y procesos inflamatorios."
      );
    }

    if (/(mucho tiempo|a[ñn]os|recae|reca[ií]da|varias zonas|todo el cuerpo)/.test(t)) {
      add(
        "Planes de seguimiento",
        "para trabajar tu caso a mediano plazo con sesiones y recomendaciones estructuradas."
      );
    }

    // Complementos según objetivo
    if (profile.goal === "relajación / manejo de estrés" && !recs.find(r => r.service === "Masaje antiestrés")) {
      add(
        "Masaje antiestrés",
        "como base para relajar sistema nervioso y mejorar calidad de sueño."
      );
    }

    if (
      profile.goal === "rendimiento deportivo / recuperación" &&
      !recs.find(r => r.service === "Masaje atlético deportivo")
    ) {
      add(
        "Masaje atlético deportivo",
        "para liberar carga muscular y mejorar recuperación entre entrenamientos."
      );
    }

    if (
      profile.goal === "mejorar circulación / piernas ligeras" &&
      !recs.find(r => r.service === "Presoterapia")
    ) {
      add(
        "Presoterapia",
        "para apoyar retorno venoso y sensación de ligereza en piernas."
      );
    }

    if (
      profile.goal === "equilibrio emocional" &&
      !recs.find(r => r.service === "Acupuntura y electroacupuntura")
    ) {
      add(
        "Acupuntura y electroacupuntura",
        "como apoyo a la regulación emocional y del sistema nervioso."
      );
    }

    if (!recs.length) {
      add(
        "Masaje antiestrés",
        "como primera opción para liberar tensión general y observar cómo responde tu cuerpo."
      );
    }

    // Plan de sesiones sugerido
    let sesionesSugeridas = "1 a 3 sesiones";
    let frecuencia = "1 vez por semana";

    const intensidad = parseInt(profile.intensity || "5", 10);
    const tLower = profile.duration.toLowerCase();

    if (intensidad >= 8 || /mucho tiempo|meses|a[ñn]os/.test(tLower)) {
      sesionesSugeridas = "4 a 8 sesiones";
      frecuencia = "1 a 2 veces por semana";
    } else if (intensidad <= 3 && /d[ií]as|reciente|poco tiempo/.test(tLower)) {
      sesionesSugeridas = "1 a 2 sesiones";
      frecuencia = "según evolución de tus síntomas";
    }

    const listaHtml = recs
      .map(
        s =>
          "<li><strong>" + s.service + "</strong>: " + s.reason + "</li>"
      )
      .join("");

    const replyHtml =
      "<p>Gracias por contarme lo que sientes.</p>" +
      (profile.zone
        ? "<p><strong>ZONA PRINCIPAL:</strong> " + escapeHtml(profile.zone) + ".</p>"
        : "") +
      (profile.goal
        ? "<p><strong>OBJETIVO PRINCIPAL:</strong> " + escapeHtml(profile.goal) + ".</p>"
        : "") +
      "<p>Con eso en mente, podríamos trabajar con:</p>" +
      "<ul>" + listaHtml + "</ul>" +
      "<p><strong>Plan sugerido:</strong> " + sesionesSugeridas + ", con una frecuencia aproximada de " + frecuencia + ".</p>" +
      "<p>En cabina se ajusta todo según cómo llegues ese día y lo que vaya necesitando tu cuerpo.</p>" +
      "<p><strong>¿Quieres que te ayude a agendar por WhatsApp?</strong></p>" +
      '<button class="ai-chat-whatsapp-btn" type="button">' +
      '<i class="fa-brands fa-whatsapp"></i> Sí, agendar por WhatsApp' +
      "</button>";

    const resumen = recs.map(s => s.service).join(", ");

    return {
      html: replyHtml,
      resumen
    };
  }

  function openChat() {
    chatWindow.classList.add("open");
    if (!chatOpenedOnce) {
      chatOpenedOnce = true;
      addAssistantMessage(
        "<p>Hola, soy tu asistente de <strong>Wellness 21PM</strong>.</p>" +
        "<p>Para orientarte mejor necesito hacerte unas preguntitas rápidas:</p>" +
        "<ol>" +
        "<li>¿En qué parte del cuerpo sientes más la molestia?</li>" +
        "<li>¿Qué te gustaría lograr: relajarte, mejorar rendimiento, circulación, aliviar dolor específico o equilibrio emocional?</li>" +
        "<li>Del 0 al 10, ¿qué tan intenso es el dolor/molestia?</li>" +
        "<li>¿Desde hace cuánto tiempo lo sientes?</li>" +
        "</ol>" +
        "<p>Cuéntame primero <strong>dónde se siente más</strong> (por ejemplo: espalda baja, cuello, hombros, piernas...).</p>"
      );
      conversationStage = "askGoal";
    }
  }

  function closeChat() {
    chatWindow.classList.remove("open");
  }

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

    addUserMessage(value);
    inputEl.value = "";

    const textLower = value.toLowerCase();

    // Seguridad básica
    if (hasRedFlags(textLower)) {
      addAssistantMessage(
        "<p>Lo que me describes puede ser un <strong>signo de alarma</strong>.</p>" +
        "<p>Te recomiendo acudir de inmediato a un servicio de urgencias o contactar a tu médico de confianza antes de considerar cualquier tipo de masaje o terapia.</p>" +
        "<p>Si es una emergencia, no esperes una cita, busca ayuda presencial cuanto antes.</p>"
      );
      return;
    }

    if (!userProfile.rawText) {
      userProfile.rawText = value;
    } else {
      userProfile.rawText += " | " + value;
    }

    if (!userProfile.zone) {
      const zoneDetected = detectZone(value);
      userProfile.zone = zoneDetected || value;
      addAssistantMessage(
        "<p>Perfecto, gracias.</p>" +
        "<p>Ahora dime: <strong>¿qué te gustaría lograr principalmente?</strong> " +
        "(por ejemplo: relajarte, aliviar un dolor en específico, mejorar rendimiento deportivo, mejorar circulación, equilibrio emocional...)</p>"
      );
      conversationStage = "askIntensity";
      return;
    }

    if (!userProfile.goal && conversationStage === "askIntensity") {
      const goalNorm = normalizeGoal(value);
      userProfile.goal = goalNorm || value;
      addAssistantMessage(
        "<p>Listo.</p>" +
        "<p>Del <strong>0 al 10</strong>, donde 0 es nada de dolor y 10 es el dolor más fuerte que puedas imaginar, " +
        "¿<strong>qué número</strong> describe mejor lo que sientes?</p>"
      );
      conversationStage = "askDuration";
      return;
    }

    if (!userProfile.intensity && conversationStage === "askDuration") {
      const intensity = parseIntensity(value);
      userProfile.intensity = intensity || value;
      addAssistantMessage(
        "<p>Gracias.</p>" +
        "<p>Por último, <strong>¿desde hace cuánto</strong> sientes esto? (por ejemplo: desde hace 3 días, 2 semanas, varios meses, años...)</p>"
      );
      conversationStage = "ready";
      return;
    }

    if (!userProfile.duration && conversationStage === "ready") {
      userProfile.duration = value;
      const { html, resumen } = getRecommendations(userProfile);
      lastRecommendationSummary = resumen;
      addAssistantMessage(html);
      return;
    }

    // Si ya tenemos todo y la persona vuelve a escribir,
    // usamos lo que ponga como nuevo detalle y recapitulamos.
    userProfile.rawText += " | " + value;
    const { html, resumen } = getRecommendations(userProfile);
    lastRecommendationSummary = resumen;
    addAssistantMessage(html);
  });

  messagesEl.addEventListener("click", (e) => {
    const btn = e.target.closest(".ai-chat-whatsapp-btn");
    if (!btn) return;

    const textoPlano =
      "Hola, vengo de la página web de Wellness 21PM. " +
      (userProfile.zone ? "Zona principal: " + userProfile.zone + ". " : "") +
      (userProfile.goal ? "Objetivo: " + userProfile.goal + ". " : "") +
      (userProfile.intensity ? "Intensidad (0-10): " + userProfile.intensity + ". " : "") +
      (userProfile.duration ? "Tiempo con la molestia: " + userProfile.duration + ". " : "") +
      "Mis síntomas/dolores descritos: " + (userProfile.rawText || "(no especificado)") + ". " +
      "El asistente me recomendó: " + (lastRecommendationSummary || "(por definir)") + ". " +
      "¿Me ayudas a agendar una sesión?";

    const texto = encodeURIComponent(textoPlano);
    const url = "https://wa.me/" + WHATSAPP_PHONE + "?text=" + texto;
    window.open(url, "_blank");
  });
});
