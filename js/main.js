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

// ============ CHAT IA WELLNESS 21PM 3.0 ============
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
  let lastOptimalPlan = "";

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
    if (/relaj|estr[eé]s|descansar|ansiedad|insomnio/.test(t)) return "relajación / manejo de estrés";
    if (/deport|rendimiento|gym|gimnasio|entrenamiento|competencia|marat[oó]n/.test(t))
      return "rendimiento deportivo / recuperación";
    if (/circulaci[oó]n|piernas pesadas|retenci[oó]n|hinchaz[oó]n|varices/.test(t))
      return "mejorar circulación / piernas ligeras";
    if (/dolor|contractura|nudo|tort[ií]colis|lumbalgia/.test(t))
      return "aliviar dolor específico";
    if (/emocional|estado de [aá]nimo|hormonal|estr[eé]s emocional/.test(t)) return "equilibrio emocional";
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

    function add(service, reason, prioridad) {
      recs.push({ service, reason, prioridad });
    }

    // Base según síntomas
    if (/(deport|gym|gimnasio|correr|marat[oó]n|entreno|entrenamiento|partido|f[úu]tbol)/.test(t)) {
      add(
        "Masaje atlético deportivo",
        "Recuperación post-entrenamiento, prevención de lesiones y descarga muscular.",
        1
      );
    }

    if (/(estr[eé]s|ansiedad|cansancio mental|agotad[oa]|no puedo dormir|insomnio)/.test(t)) {
      add(
        "Masaje antiestrés",
        "Liberar tensión general, mejorar sueño y bajar la carga del sistema nervioso.",
        1
      );
    }

    if (/(contractura|nudo|tort[ií]colis|rigidez|espalda alta|espalda baja|lumbalgia|cuello|hombro)/.test(
      t
    )) {
      add(
        "Masaje descontracturante",
        "Trabajo específico sobre puntos de dolor, rigidez y contracturas.",
        1
      );
    }

    if (/(piernas pesadas|retenci[oó]n de l[ií]quidos|circulaci[oó]n|hinchaz[oó]n|edema|varices)/.test(
      t
    )) {
      add(
        "Presoterapia",
        "Mejorar retorno venoso, aliviar pesadez y favorecer drenaje.",
        1
      );
    }

    if (/(cr[oó]nico|migra[ñn]a|cefalea|nervio ci[aá]tico|ci[aá]tica|emocional|ansiedad fuerte|hormonal)/.test(
      t
    )) {
      add(
        "Acupuntura y electroacupuntura",
        "Apoyo en dolor crónico, migrañas, ciática y regulación emocional.",
        2
      );
    }

    if (/(dolor agudo|punzante|postoperatorio|post-operatorio)/.test(t)) {
      add("TENS", "Modulación de dolor agudo localizado y procesos postoperatorios.", 2);
    }

    if (/(muy rigido|muy r[ií]gido|espalda trabada|espalda hecha nudo|no me puedo mover)/.test(t)) {
      add("Ventosas", "Liberación de fascia y descarga profunda de zonas muy cargadas.", 2);
    }

    if (/(punto gatillo|trigger point|punto muy específico|bolita de dolor)/.test(t)) {
      add(
        "Pistola de infrarrojo y de percusión",
        "Trabajo localizado en puntos gatillo y tejidos profundos.",
        2
      );
    }

    if (/(inflamaci[oó]n|esguince|tendinitis|fascitis|tend[oó]n|ligamento)/.test(t)) {
      add(
        "Láser 808 y 650 nm",
        "Apoyo a reparación tisular y procesos inflamatorios en tejidos blandos.",
        2
      );
    }

    if (/(mucho tiempo|a[ñn]os|recae|reca[ií]da|varias zonas|todo el cuerpo)/.test(t)) {
      add(
        "Planes de seguimiento",
        "Trabajar tu caso en varias sesiones con ajustes progresivos.",
        3
      );
    }

    // Complementos según objetivo
    if (profile.goal === "relajación / manejo de estrés" && !recs.find(r => r.service === "Masaje antiestrés")) {
      add(
        "Masaje antiestrés",
        "Base para relajar sistema nervioso y mejorar calidad de descanso.",
        1
      );
    }

    if (
      profile.goal === "rendimiento deportivo / recuperación" &&
      !recs.find(r => r.service === "Masaje atlético deportivo")
    ) {
      add(
        "Masaje atlético deportivo",
        "Descarga muscular y recuperación entre entrenamientos.",
        1
      );
    }

    if (
      profile.goal === "mejorar circulación / piernas ligeras" &&
      !recs.find(r => r.service === "Presoterapia")
    ) {
      add(
        "Presoterapia",
        "Apoyo circulatorio y sensación de ligereza en piernas.",
        1
      );
    }

    if (
      profile.goal === "equilibrio emocional" &&
      !recs.find(r => r.service === "Acupuntura y electroacupuntura")
    ) {
      add(
        "Acupuntura y electroacupuntura",
        "Regulación del sistema nervioso y del estado emocional.",
        2
      );
    }

    if (!recs.length) {
      add(
        "Masaje antiestrés",
        "Primera opción para liberar tensión general y observar respuesta de tu cuerpo.",
        1
      );
    }

    // Ordenar por prioridad
    recs.sort((a, b) => a.prioridad - b.prioridad);

    // Planes según intensidad y duración
    let sesionesSugeridas = "1 a 3 sesiones";
    let frecuencia = "1 vez por semana";
    let planOptimo = "";
    const intensidad = parseInt(profile.intensity || "5", 10);
    const tLower = (profile.duration || "").toLowerCase();

    if (intensidad >= 8 || /mucho tiempo|meses|a[ñn]os|cr[oó]nico/.test(tLower)) {
      sesionesSugeridas = "4 a 8 sesiones";
      frecuencia = "1 a 2 veces por semana";
      planOptimo =
        "Plan intensivo: iniciar con 1 a 2 sesiones por semana y después espaciar según cómo respondas.";
    } else if (intensidad <= 3 && /d[ií]as|reciente|poco tiempo|hace poco/.test(tLower)) {
      sesionesSugeridas = "1 a 2 sesiones";
      frecuencia = "según evolución de tus síntomas";
      planOptimo =
        "Plan preventivo: 1 sesión puntual y después mantenimiento ocasional para evitar que se vuelva crónico.";
    } else {
      planOptimo =
        "Plan equilibrado: comenzar con una sesión semanal y reajustar según disminuya el dolor y la tensión.";
    }

    // Complementos generales
    const complementos = [];
    if (/estr[eé]s|ansiedad|insomnio/.test(t)) {
      complementos.push("pequeñas pausas de respiración profunda durante el día");
    }
    if (/deport|gym|entreno/.test(t)) {
      complementos.push("trabajo de estiramientos específicos después de entrenar");
    }
    if (/piernas pesadas|circulaci[oó]n/.test(t)) {
      complementos.push("elevar piernas algunos minutos al final del día");
    }

    const listaHtml = recs
      .map(
        (s, index) =>
          "<li><strong>" +
          (index === 0 ? "Principal: " : "") +
          s.service +
          "</strong>: " +
          s.reason +
          "</li>"
      )
      .join("");

    const complementosHtml = complementos.length
      ? "<p><strong>Recomendaciones complementarias:</strong></p><ul>" +
        complementos.map(c => "<li>" + c + "</li>").join("") +
        "</ul>"
      : "";

    const replyHtml =
      "<p>Gracias por contarme lo que sientes.</p>" +
      (profile.zone
        ? "<p><strong>ZONA PRINCIPAL:</strong> " + escapeHtml(profile.zone) + ".</p>"
        : "") +
      (profile.goal
        ? "<p><strong>OBJETIVO PRINCIPAL:</strong> " + escapeHtml(profile.goal) + ".</p>"
        : "") +
      "<p>Según lo que me describes, los servicios que más pueden ayudarte son:</p>" +
      "<ul>" + listaHtml + "</ul>" +
      "<p><strong>Plan sugerido:</strong> " + sesionesSugeridas + ", con una frecuencia aproximada de " + frecuencia + ".</p>" +
      (planOptimo
        ? "<p><strong>Plan óptimo para tu caso:</strong> " + planOptimo + "</p>"
        : "") +
      complementosHtml +
      "<p>En cabina se ajusta todo según cómo llegues ese día y cómo vaya respondiendo tu cuerpo.</p>" +
      "<p><strong>¿Quieres que te ayude a agendar por WhatsApp?</strong></p>" +
      '<button class="ai-chat-whatsapp-btn" type="button">' +
      '<i class="fa-brands fa-whatsapp"></i> Sí, agendar por WhatsApp' +
      "</button>";

    const resumen = recs.map(s => s.service).join(", ");

    return {
      html: replyHtml,
      resumen,
      planOptimo
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
      const { html, resumen, planOptimo } = getRecommendations(userProfile);
      lastRecommendationSummary = resumen;
      lastOptimalPlan = planOptimo || "";
      addAssistantMessage(html);
      return;
    }

    // Si ya tenemos todo y la persona vuelve a escribir,
    // usamos lo que ponga como nuevo detalle y recapitulamos.
    userProfile.rawText += " | " + value;
    const { html, resumen, planOptimo } = getRecommendations(userProfile);
    lastRecommendationSummary = resumen;
    lastOptimalPlan = planOptimo || "";
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
      "Servicios recomendados: " + (lastRecommendationSummary || "(por definir)") + ". " +
      (lastOptimalPlan ? "Plan óptimo sugerido: " + lastOptimalPlan + ". " : "") +
      "¿Me ayudas a agendar una sesión?";

    const texto = encodeURIComponent(textoPlano);
    const url = "https://wa.me/" + WHATSAPP_PHONE + "?text=" + texto;
    window.open(url, "_blank");
  });
});


// ==============================
// Asistente Wellness 21PM · IA v6
// Recomendador de combos de servicios + paquete
// ==============================
document.addEventListener("DOMContentLoaded", () => {
  const chatRoot   = document.querySelector(".w21-chat");
  if (!chatRoot) return;

  const toggleBtn  = chatRoot.querySelector(".w21-chat-toggle");
  const windowEl   = chatRoot.querySelector(".w21-chat-window");
  const closeBtn   = chatRoot.querySelector(".w21-chat-close");
  const backdropEl = chatRoot.querySelector(".w21-chat-backdrop");
  const messagesEl = chatRoot.querySelector("#w21ChatMessages");
  const formEl     = chatRoot.querySelector("#w21ChatForm");
  const inputEl    = chatRoot.querySelector("#w21ChatInput");

  // Cambia este número a tu WhatsApp (formato internacional sin +, ej. 52 + 10 dígitos)
  const WHATSAPP_PHONE = "525585662464";

  let userName = "";
  let step = "askName"; // askName → askSymptoms → ready
  let typingNode = null;

  // ----- Base de conocimiento de servicios que ofrece Wellness 21PM -----
  const SERVICES = [
    {
      id: "relajante",
      name: "Masaje relajante / descontracturante",
      tags: ["estres", "ansiedad", "cabeza", "cuello", "espalda", "general", "sueno"],
      description: "Ideal para estrés, tensión en cuello y espalda, sobrecarga general y dificultad para descansar."
    },
    {
      id: "deportivo",
      name: "Masaje atlético deportivo",
      tags: ["deporte", "piernas", "maraton", "gym", "fatiga", "contracturas"],
      description: "Pensado para recuperación después de entrenamientos fuertes, maratones y sobrecarga por ejercicio."
    },
    {
      id: "bambu_piedras",
      name: "Masaje con bambuterapia y piedras volcánicas",
      tags: ["estres", "espalda", "lumbar", "relajacion_profunda"],
      description: "Ayuda a relajar musculatura profunda y liberar tensión acumulada, sobre todo en espalda y zona lumbar."
    },
    {
      id: "pistola_impacto",
      name: "Masaje con pistola de impacto e infrarrojo",
      tags: ["dolor_fuerte", "contracturas", "espalda", "lumbar", "deporte"],
      description: "Útil en contracturas marcadas y zonas muy cargadas donde se requiere un trabajo más intenso."
    },
    {
      id: "acupuntura",
      name: "Acupuntura y electroacupuntura",
      tags: ["cabeza", "migraña", "cronico", "dolor_fuerte", "emocional"],
      description: "Complemento cuando hay migrañas, dolor crónico o se busca un equilibrio más profundo."
    },
    {
      id: "presoterapia",
      name: "Presoterapia",
      tags: ["circulacion", "piernas", "pesadez", "retencion"],
      description: "Para mala circulación, piernas pesadas, hinchazón y retención de líquidos."
    }
  ];

  const PACKAGES = [
    {
      id: "esencial",
      name: "Paquete Esencial",
      tags: ["leve", "primera_vez", "relajacion"],
      description: "Para molestias leves, primera experiencia o cuando quieres iniciar tu cuidado en Wellness 21PM."
    },
    {
      id: "manual",
      name: "Masaje Manual de Cuerpo Completo",
      tags: ["estres", "general", "sueno", "ansiedad"],
      description: "Masaje manual de cuerpo completo cuando hay estrés generalizado y necesidad de desconexión global."
    },
    {
      id: "plus",
      name: "Paquete Plus",
      tags: ["circulacion", "piernas", "deporte", "lumbar", "tecnologia"],
      description: "Combina masaje profundo con tecnologías como presoterapia y pistola de impacto para zonas muy cargadas."
    },
    {
      id: "renacer",
      name: "Masaje Renacer",
      tags: ["cronico", "multiples_zonas", "dolor_fuerte"],
      description: "Pensado para dolor crónico, varias zonas afectadas o cuando necesitas un proceso de cambio más profundo."
    }
  ];

  // ----- Utilidades de UI -----
  function addMessage(sender, html) {
    const wrapper = document.createElement("div");
    wrapper.classList.add("w21-chat-message");
    wrapper.classList.add(sender === "user" ? "user" : "assistant");

    const bubble = document.createElement("div");
    bubble.classList.add("w21-chat-bubble");
    bubble.innerHTML = html;

    wrapper.appendChild(bubble);
    messagesEl.appendChild(wrapper);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function showTyping() {
    if (typingNode) return;
    const wrapper = document.createElement("div");
    wrapper.classList.add("w21-chat-message", "assistant");
    const bubble = document.createElement("div");
    bubble.classList.add("w21-chat-bubble");
    bubble.innerHTML = `
      <div class="w21-chat-typing">
        <span></span><span></span><span></span>
      </div>
    `;
    wrapper.appendChild(bubble);
    messagesEl.appendChild(wrapper);
    typingNode = wrapper;
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function hideTyping() {
    if (typingNode) {
      typingNode.remove();
      typingNode = null;
    }
  }

  function normalize(text) {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  // ----- Mapeo de texto → tags (tipo “IA simple”) -----
  function extractTags(raw) {
    const t = normalize(raw);
    const tags = new Set();

    // Zonas
    if (t.includes("cabeza") || t.includes("migra")) tags.add("cabeza");
    if (t.includes("cuello") || t.includes("nuca") || t.includes("trapecio")) {
      tags.add("cuello");
      tags.add("espalda");
    }
    if (t.includes("espalda baja") || t.includes("lumbar")) {
      tags.add("lumbar");
      tags.add("espalda");
    } else if (t.includes("espalda")) {
      tags.add("espalda");
    }
    if (t.includes("piernas") || t.includes("pantorrilla") || t.includes("muslo") || t.includes("rodilla")) {
      tags.add("piernas");
    }

    // Estado emocional / sueño
    if (t.includes("estres") || t.includes("estrés") || t.includes("ansiedad") || t.includes("ansiosa") || t.includes("ansioso") || t.includes("nervios")) {
      tags.add("estres");
      tags.add("ansiedad");
    }
    if (t.includes("sueno") || t.includes("sueño") || t.includes("no puedo dormir") ||
        t.includes("insomnio") || t.includes("duermo mal") || t.includes("no descanso")) {
      tags.add("sueno");
    }

    // Circulación
    if (t.includes("circulacion") || t.includes("circulación") || t.includes("mala circulacion") ||
        t.includes("hinchad") || t.includes("pesadas") || t.includes("pesadez") || t.includes("retencion")) {
      tags.add("circulacion");
      tags.add("piernas");
    }

    // Deporte
    if (t.includes("maraton") || t.includes("maratón") || t.includes("correr") || t.includes("corr") ||
        t.includes("gym") || t.includes("deporte") || t.includes("entrenamiento")) {
      tags.add("deporte");
    }

    // Intensidad / crónico
    if (t.includes("mucho dolor") || t.includes("no aguanto") || t.includes("intenso") ||
        t.includes("10/10") || t.includes("9/10")) {
      tags.add("dolor_fuerte");
    }
    if (t.includes("anos") || t.includes("años") || t.includes("cronico") || t.includes("crónico") ||
        t.includes("hace mucho tiempo") || t.includes("varios meses") || t.includes("varios años")) {
      tags.add("cronico");
    }
    if (t.includes("todo el cuerpo") || t.includes("varias partes") || t.includes("muchas zonas")) {
      tags.add("multiples_zonas");
    }

    // Si no detectamos nada concreto:
    if (tags.size === 0) {
      tags.add("general");
      tags.add("leve");
    } else if (![...tags].some(tg => ["cronico", "dolor_fuerte"].includes(tg))) {
      tags.add("leve");
    }

    return [...tags];
  }

  function scoreItem(itemTags, userTags) {
    let score = 0;
    for (const tag of itemTags) {
      if (userTags.includes(tag)) score += 2;
    }
    // Bonos
    if (userTags.includes("circulacion") && itemTags.includes("circulacion")) score += 2;
    if (userTags.includes("deporte") && itemTags.includes("deporte")) score += 2;
    if (userTags.includes("cronico") && itemTags.includes("cronico")) score += 2;
    if (userTags.includes("dolor_fuerte") && itemTags.includes("dolor_fuerte")) score += 2;
    return score;
  }

  function buildRecommendation(rawText) {
    const tags = extractTags(rawText);

    // Servicios recomendados (combo)
    const scoredServices = SERVICES
      .map(s => ({ ...s, score: scoreItem(s.tags, tags) }))
      .sort((a, b) => b.score - a.score);

    let combo = scoredServices.filter(s => s.score > 0).slice(0, 3);
    if (combo.length === 0) {
      combo = [SERVICES.find(s => s.id === "relajante")];
    } else if (combo.length === 1) {
      // Forzar combo mínimo de 2 servicios cuando tiene solo uno fuerte
      const extra = SERVICES.find(s => s.id !== combo[0].id && s.id === "relajante");
      if (extra) combo.push(extra);
    }

    // Paquete principal + alternativo
    const scoredPackages = PACKAGES
      .map(p => ({ ...p, score: scoreItem(p.tags, tags) }))
      .sort((a, b) => b.score - a.score);

    let mainPackage = scoredPackages[0];
    if (!mainPackage || mainPackage.score === 0) {
      if (tags.includes("circulacion") || tags.includes("piernas") || tags.includes("deporte") || tags.includes("lumbar")) {
        mainPackage = PACKAGES.find(p => p.id === "plus");
      } else if (tags.includes("cronico") || tags.includes("dolor_fuerte") || tags.includes("multiples_zonas")) {
        mainPackage = PACKAGES.find(p => p.id === "renacer");
      } else if (tags.includes("estres") || tags.includes("sueno")) {
        mainPackage = PACKAGES.find(p => p.id === "manual");
      } else {
        mainPackage = PACKAGES.find(p => p.id === "esencial");
      }
    }
    const altPackage = (scoredPackages.length > 1 && scoredPackages[1].score > 0) ? scoredPackages[1] : null;

    // Resumen para WhatsApp
    const resumenLines = [];
    resumenLines.push("Síntomas: " + rawText);
    resumenLines.push("Tags detectados: " + tags.join(", "));
    resumenLines.push("Servicios recomendados: " + combo.map(c => c.name).join(", "));
    resumenLines.push("Paquete recomendado: " + (mainPackage ? mainPackage.name : "por definir"));
    if (altPackage) resumenLines.push("Paquete alternativo sugerido: " + altPackage.name);
    const resumen = resumenLines.join("\n");

    // HTML
    let html = "";
    html += `<p><strong>${userName ? "Gracias por contarme lo que sientes, " + userName : "Gracias por contarme lo que sientes"}.</strong></p>`;
    html += `<p>Con lo que me compartes, estos son los <strong>servicios que mejor combinan para tu caso</strong> en Wellness 21PM:</p>`;
    html += "<ul>";
    combo.forEach(s => {
      html += `<li><strong>${s.name}</strong>: ${s.description}</li>`;
    });
    html += "</ul>";

    if (mainPackage) {
      html += `<p>Como <strong>paquete</strong>, el que más te conviene es: <strong>${mainPackage.name}</strong>.</p>`;
      html += `<p>${mainPackage.description}</p>`;
    }
    if (altPackage) {
      html += `<p>También podríamos valorar como alternativa: <strong>${altPackage.name}</strong>.</p>`;
    }

    html += `<p>Si quieres, te ayudo a <strong>agendar una sesión por WhatsApp</strong> con estas recomendaciones.</p>`;

    const waLines = [
      userName ? `Nombre: ${userName}` : "Nombre: (no indicado)",
      resumen
    ];
    const waParam = encodeURIComponent(waLines.join("\n"));
    const waUrl = "https://wa.me/" + WHATSAPP_PHONE + "?text=" + waParam;

    html += `
      <button class="w21-chat-wa-btn" data-wa="${waUrl}">
        <span>📲</span>
        <span>Agendar por WhatsApp</span>
      </button>
    `;

    return html;
  }

  // ----- Apertura / cierre fácil -----
  function openChat() {
    chatRoot.classList.add("open");
    windowEl.setAttribute("aria-hidden", "false");

    if (!messagesEl.dataset.greeted) {
      messagesEl.dataset.greeted = "true";
      addMessage(
        "assistant",
        "<p>Hola, soy <strong>Óscar</strong>, tu asistente virtual de Wellness 21PM.</p>" +
          "<p>Te voy a ayudar a elegir el mejor <strong>tipo de masaje</strong>, las <strong>tecnologías</strong> (presoterapia, pistola de impacto, acupuntura…) y el <strong>paquete</strong> adecuado para ti.</p>" +
          "<p>Para comenzar, ¿<strong>cómo te llamas</strong>?</p>"
      );
    }
  }

  function closeChat() {
    chatRoot.classList.remove("open");
    windowEl.setAttribute("aria-hidden", "true");
  }

  toggleBtn.addEventListener("click", () => {
    if (chatRoot.classList.contains("open")) {
      closeChat();
    } else {
      openChat();
    }
  });

  closeBtn.addEventListener("click", closeChat);
  backdropEl.addEventListener("click", closeChat);

  // ----- Manejo del formulario -----
  formEl.addEventListener("submit", (e) => {
    e.preventDefault();
    const value = inputEl.value.trim();
    if (!value) return;

    addMessage("user", value);
    inputEl.value = "";

    if (step === "askName") {
      const firstName = value.split(/\s+/)[0];
      userName = firstName;
      step = "askSymptoms";
      addMessage(
        "assistant",
        `<p>Mucho gusto, <strong>${firstName}</strong>.</p>` +
          `<p>Ahora cuéntame con tus palabras <strong>qué sientes</strong>: por ejemplo, ` +
          `"me duele la cabeza y tengo mala circulación", ` +
          `"me duele la espalda baja por estar sentado", ` +
          `"acabo de correr y siento las piernas muy pesadas"…</p>`
      );
      return;
    }

    // Interpretación de síntomas y recomendación
    showTyping();
    setTimeout(() => {
      hideTyping();
      const html = buildRecommendation(value);
      addMessage("assistant", html);
      step = "ready";
    }, 700);
  });

  // ----- Click en botón de WhatsApp -----
  messagesEl.addEventListener("click", (e) => {
    const btn = e.target.closest(".w21-chat-wa-btn");
    if (!btn) return;
    const url = btn.getAttribute("data-wa");
    if (url) {
      window.open(url, "_blank");
    }
  });
});
