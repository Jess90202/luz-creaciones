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
  let conversationStage = "askName"; // askName → askSymptoms → ready
  let lastRecommendationSummary = "";
  let lastOptimalPlan = "";
  let lastPackage = "";

  const userProfile = {
    name: "",
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

    // Selección de paquete según síntomas, intensidad y duración
    const intensidad = parseInt(profile.intensity || "5", 10);
    const tLower = (profile.duration || "").toLowerCase();

    const sintomasPiernasCirculacion = /piernas pesadas|circulaci[oó]n|retenci[oó]n de l[ií]quidos|hinchaz[oó]n|varices/.test(t);
    const mencionaEstres = /estr[eé]s|ansiedad|no puedo dormir|insomnio|cansancio mental/.test(t);
    const posibleCronico = intensidad >= 8 || /mucho tiempo|meses|a[ñn]os|cr[oó]nico/.test(tLower);
    const tienePresoterapia = recs.some(r => r.service === "Presoterapia");

    let paquete = "Paquete Esencial";
    let paqueteDetalle = "Enfoque en una zona específica (cuello, espalda baja, hombro, rodilla, ciática, etc.).";

    if (posibleCronico) {
      paquete = "Masaje Renacer";
      paqueteDetalle =
        "Paquete integral con masaje de cuerpo completo, presoterapia, pistola de infrarrojo, láser, acupuntura y ventosas. Ideal para dolor crónico, lesiones deportivas o estrés muy acumulado.";
    } else if (tienePresoterapia || sintomasPiernasCirculacion) {
      paquete = "Paquete Plus";
      paqueteDetalle =
        "Masaje profundo combinado con presoterapia, pistola de infrarrojo y acupuntura en puntos estratégicos. Ideal para piernas cansadas, mala circulación, dolor lumbar o cervical moderado.";
    } else if (mencionaEstres) {
      paquete = "Masaje Manual de Cuerpo Completo";
      paqueteDetalle =
        "Sesión de masaje de cuerpo completo sin aparatos, enfocada en estrés generalizado, tensión acumulada y descanso profundo.";
    } else if (intensidad <= 3 && /d[ií]as|reciente|poco tiempo|hace poco/.test(tLower)) {
      paquete = "Paquete Esencial";
      paqueteDetalle =
        "Masaje profundo focalizado y técnicas como acupuntura y láser en una zona puntual. Ideal para molestias recientes o localizadas.";
    } else {
      paquete = "Paquete Plus";
      paqueteDetalle =
        "Combinación de masaje manual y tecnología para sobrecarga por ejercicio o trabajo físico intenso.";
    }

    const replyHtml =
      "<p>Gracias por contarme lo que sientes" +
      (profile.name ? ", <strong>" + escapeHtml(profile.name) + "</strong>" : "") +
      ".</p>" +
      (profile.zone
        ? "<p><strong>ZONA PRINCIPAL:</strong> " + escapeHtml(profile.zone) + ".</p>"
        : "") +
      (profile.goal
        ? "<p><strong>OBJETIVO PRINCIPAL:</strong> " + escapeHtml(profile.goal) + ".</p>"
        : "") +
      "<p>Según lo que me describes, los servicios que más pueden ayudarte son:</p>" +
      "<ul>" +
      listaHtml +
      "</ul>" +
      "<p><strong>Plan sugerido:</strong> " +
      sesionesSugeridas +
      ", con una frecuencia aproximada de " +
      frecuencia +
      ".</p>" +
      (planOptimo
        ? "<p><strong>Plan óptimo para tu caso:</strong> " + planOptimo + "</p>"
        : "") +
      "<p><strong>Paquete recomendado:</strong> " +
      paquete +
      ".</p>" +
      "<p>" +
      paqueteDetalle +
      "</p>" +
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
      planOptimo,
      paquete
    };
  }

  function openChat() {
    chatWindow.classList.add("open");
    if (!chatOpenedOnce) {
      chatOpenedOnce = true;
      addAssistantMessage(
        "<p>Hola, soy tu asistente de <strong>Wellness 21PM</strong>.</p>" +
        "<p>Quiero ayudarte a elegir el mejor masaje, las técnicas adecuadas y el paquete ideal para ti.</p>" +
        "<p>Para empezar, <strong>¿cómo te llamas?</strong></p>"
      );
      conversationStage = "askName";
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
        "<p>Te recomiendo acudir de inmediato a un servicio de urgencias o con un médico de confianza antes de considerar cualquier tipo de masaje o terapia.</p>" +
        "<p>Si es una emergencia, no esperes una cita, busca ayuda presencial cuanto antes.</p>"
      );
      return;
    }

    // Paso 1: pedir y guardar el nombre
    if (!userProfile.name && conversationStage === "askName") {
      const firstName = value.split(/\s+/)[0];
      userProfile.name = firstName;
      addAssistantMessage(
        "<p>Mucho gusto, <strong>" + escapeHtml(firstName) + "</strong>.</p>" +
        "<p>Ahora cuéntame con tus palabras <strong>qué sientes</strong>: " +
        "en qué parte del cuerpo, desde cuándo, si haces ejercicio, si sientes mala circulación, si el dolor es leve o fuerte...</p>" +
        "<p>Con esa información te diré qué servicios de Wellness 21PM encajan mejor contigo y qué paquete te conviene más.</p>"
      );
      conversationStage = "askSymptoms";
      return;
    }

    // Paso 2: descripción libre de síntomas
    if (conversationStage === "askSymptoms" || conversationStage === "ready") {
      if (!userProfile.rawText) {
        userProfile.rawText = value;
      } else {
        userProfile.rawText += " | " + value;
      }

      if (!userProfile.zone) {
        userProfile.zone = detectZone(value) || "";
      }
      if (!userProfile.goal) {
        userProfile.goal = normalizeGoal(value) || "";
      }

      const { html, resumen, planOptimo, paquete } = getRecommendations(userProfile);
      lastRecommendationSummary = resumen;
      lastOptimalPlan = planOptimo || "";
      lastPackage = paquete || "";
      addAssistantMessage(html);
      conversationStage = "ready";
      return;
    }

    // Si por cualquier motivo se desconfigura el flujo, volvemos a pedir síntomas
    addAssistantMessage(
      "<p>Voy a retomar la conversación.</p>" +
      "<p>Cuéntame nuevamente qué sientes y dónde, y te ayudo a elegir el mejor masaje y paquete.</p>"
    );
    conversationStage = "askSymptoms";
  });
messagesEl.addEventListener("click", (e) => {
    const btn = e.target.closest(".ai-chat-whatsapp-btn");
    if (!btn) return;

    const textoPlano =
      "Hola, vengo de la página web de Wellness 21PM. " +
      (userProfile.name ? "Mi nombre es " + userProfile.name + ". " : "") +
      (userProfile.zone ? "Zona principal: " + userProfile.zone + ". " : "") +
      (userProfile.goal ? "Objetivo: " + userProfile.goal + ". " : "") +
      (userProfile.intensity ? "Intensidad (0-10): " + userProfile.intensity + ". " : "") +
      (userProfile.duration ? "Tiempo con la molestia: " + userProfile.duration + ". " : "") +
      "Mis síntomas/dolores descritos: " + (userProfile.rawText || "(no especificado)") + ". " +
      "Servicios recomendados: " + (lastRecommendationSummary || "(por definir)") + ". " +
      (lastPackage ? "Paquete recomendado: " + lastPackage + ". " : "") +
      (lastOptimalPlan ? "Plan óptimo sugerido: " + lastOptimalPlan + ". " : "") +
      "¿Me ayudas a agendar una sesión?";

    const texto = encodeURIComponent(textoPlano);
extoPlano);
    const url = "https://wa.me/" + WHATSAPP_PHONE + "?text=" + texto;
    window.open(url, "_blank");
  });
});
