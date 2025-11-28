/* --- ARCHIVO: js/main.js --- */

document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. MENÚ MÓVIL Y AÑO COPYRIGHT ---
    const navToggle = document.querySelector('.nav-toggle');
    const siteNav = document.querySelector('.site-nav');
    
    if(navToggle && siteNav) {
        navToggle.addEventListener('click', () => {
            siteNav.classList.toggle('show');
            const iconSpan = navToggle.querySelectorAll('span');
            // Animación simple del icono hamburguesa (opcional)
            navToggle.classList.toggle('active');
        });
    }

    const yearSpan = document.getElementById('year');
    if(yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }

    // --- 2. LÓGICA DEL ASISTENTE INTELIGENTE ---
    initAIChat();
});

function initAIChat() {
    const toggleBtn = document.querySelector('.ai-chat-toggle');
    const closeBtn = document.querySelector('.ai-chat-close');
    const chatWindow = document.querySelector('.ai-chat-window');
    const chatForm = document.getElementById('aiChatForm');
    const chatInput = document.getElementById('aiChatText');
    const messagesContainer = document.getElementById('aiChatMessages');

    // Estado del chat
    let isChatOpen = false;

    // --- BASE DE CONOCIMIENTO (Reglas del experto) ---
    const knowledgeBase = [
        {
            keywords: ['espalda baja', 'lumbar', 'cintura', 'sentado', 'oficina', 'silla'],
            response: "El dolor en espalda baja es muy común por posturas prolongadas. Para esto, la combinación de calor profundo y masaje es vital.",
            recommendation: {
                name: "Paquete Plus ($650)",
                reason: "Incluye pistola de infrarrojo para ablandar el tejido profundo y presoterapia si pasas mucho tiempo sentado.",
                link: "Hola, mi asistente me recomendó el Paquete Plus para dolor de espalda baja."
            }
        },
        {
            keywords: ['cuello', 'hombro', 'trapecio', 'cabeza', 'migraña', 'tensión', 'dormir mal'],
            response: "Esa tensión en cuello y hombros suele acumularse por estrés o mala postura al dormir. Necesitamos soltar los 'nudos' específicos.",
            recommendation: {
                name: "Paquete Esencial ($300) o Masaje Descontracturante",
                reason: "Si es una zona muy específica (ej. tortícolis), el Esencial es perfecto. Si es tensión general, el Plus ayuda a relajar todo el tren superior.",
                link: "Hola, tengo dolor en cuello/hombros y me interesa el Paquete Esencial o Plus."
            }
        },
        {
            keywords: ['piernas', 'correr', 'futbol', 'bici', 'caminar', 'cansadas', 'varices', 'circulación', 'hinchazón'],
            response: "Para piernas cansadas o cargadas por deporte/actividad, lo mejor es ayudar al retorno venoso y descargar el músculo.",
            recommendation: {
                name: "Paquete Plus ($650) con Presoterapia",
                reason: "La presoterapia es la estrella aquí: comprime y descomprime para reactivar la circulación, sumado al masaje manual.",
                link: "Hola, me interesa el Paquete Plus con énfasis en presoterapia para piernas."
            }
        },
        {
            keywords: ['estrés', 'ansiedad', 'relajar', 'descanso', 'paz', 'tranquilo', 'desconectar'],
            response: "Si tu objetivo principal es desconectar la mente y soltar el cuerpo, evitemos el dolor intenso y busquemos fluidez.",
            recommendation: {
                name: "Masaje Manual de Cuerpo Completo ($500)",
                reason: "50-70 minutos dedicados puramente a bajar las revoluciones de tu sistema nervioso.",
                link: "Hola, busco un Masaje de Cuerpo Completo para relajarme."
            }
        },
        {
            keywords: ['lesión', 'esguince', 'torcedura', 'golpe', 'crónico', 'mucho tiempo', 'duele mucho', 'fuerte'],
            response: "Cuando hay dolor agudo, lesiones o molestias crónicas rebeldes, necesitamos usar toda la tecnología disponible.",
            recommendation: {
                name: "Masaje Renacer ($850)",
                reason: "Incluye láser para regeneración celular, acupuntura para el dolor y todo el protocolo manual. Es el tratamiento más completo.",
                link: "Hola, tengo una lesión/dolor crónico y me interesa el Masaje Renacer."
            }
        },
        {
            keywords: ['precio', 'costo', 'cuesta', 'paquetes', 'valor'],
            response: "Manejamos paquetes desde $300 MXN (zona específica) hasta $850 MXN (experiencia completa con toda la tecnología).",
            recommendation: {
                name: "Ver sección de Precios",
                reason: "Depende de qué tanto tiempo y tecnología necesite tu cuerpo hoy.",
                link: "Hola, quisiera más información sobre los precios."
            }
        },
        {
            keywords: ['ubicación', 'donde', 'lugar', 'dirección', 'cdmx'],
            response: "Estamos ubicados en CDMX. Damos servicio en consultorio y también a domicilio (con costo extra).",
            recommendation: {
                name: "Agendar Cita",
                reason: "Mándame un WhatsApp para enviarte la ubicación exacta.",
                link: "Hola, ¿me podrías compartir la ubicación exacta?"
            }
        }
    ];

    // Respuesta por defecto
    const defaultResponse = "Entiendo. Cada cuerpo es distinto. Basado en lo que me cuentas, lo ideal es evaluar si es tensión muscular o algo más profundo.";
    const defaultRec = {
        name: "Consulta Personalizada",
        reason: "Escríbeme por WhatsApp para contarme tu caso y decirte qué te conviene.",
        link: "Hola, tengo una duda específica sobre mi dolor, ¿podemos hablar?"
    };

    // --- FUNCIONES DE UI ---

    function toggleChat() {
        isChatOpen = !isChatOpen;
        chatWindow.classList.toggle('open', isChatOpen);
        if (isChatOpen) {
            chatInput.focus();
            // Mensaje de bienvenida si está vacío
            if (messagesContainer.children.length === 0) {
                addMessage("¡Hola! Soy el asistente virtual de Wellness 21PM. 🤖<br>Cuéntame, ¿qué dolor o molestia sientes hoy? (Ej: 'Me duele la espalda baja' o 'Corrí un maratón')", 'ai');
            }
        }
    }

    // Agregar mensaje al DOM
    function addMessage(htmlContent, sender) {
        const msgDiv = document.createElement('div');
        msgDiv.classList.add('ai-chat-message');
        msgDiv.classList.add(sender === 'user' ? 'ai-chat-user' : 'ai-chat-assistant');
        msgDiv.innerHTML = htmlContent;
        messagesContainer.appendChild(msgDiv);
        scrollToBottom();
    }

    // Indicador de "Escribiendo..."
    function showTyping() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'typing-indicator';
        typingDiv.id = 'typingIndicator';
        typingDiv.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';
        messagesContainer.appendChild(typingDiv);
        scrollToBottom();
    }

    function removeTyping() {
        const typingDiv = document.getElementById('typingIndicator');
        if(typingDiv) typingDiv.remove();
    }

    function scrollToBottom() {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // --- CEREBRO: Analizar texto ---
    function analyzeText(text) {
        const lowerText = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // Quitar acentos
        
        // Buscar coincidencia en la base de conocimientos
        let bestMatch = null;
        let maxScore = 0;

        knowledgeBase.forEach(item => {
            let score = 0;
            item.keywords.forEach(word => {
                if (lowerText.includes(word)) score++;
            });

            if (score > maxScore) {
                maxScore = score;
                bestMatch = item;
            }
        });

        if (maxScore > 0) {
            return bestMatch;
        }
        return null;
    }

    // --- EVENTOS ---

    toggleBtn.addEventListener('click', toggleChat);
    closeBtn.addEventListener('click', toggleChat);

    chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const userText = chatInput.value.trim();
        if (!userText) return;

        // 1. Mostrar mensaje usuario
        addMessage(`<p>${userText}</p>`, 'user');
        chatInput.value = '';

        // 2. Simular pensar (Escribiendo...)
        showTyping();

        // 3. Procesar respuesta (con delay para realismo)
        setTimeout(() => {
            removeTyping();
            
            const result = analyzeText(userText);
            
            if (result) {
                const responseHTML = `
                    <p>${result.response}</p>
                    <p><strong>Te recomiendo:</strong> ${result.recommendation.name}</p>
                    <p style="font-size:0.8rem; opacity:0.8;"><em>¿Por qué? ${result.recommendation.reason}</em></p>
                    <a href="https://wa.me/5585662464?text=${encodeURIComponent(result.recommendation.link)}" target="_blank" class="chat-cta-btn">
                        <i class="fa-brands fa-whatsapp"></i> Agendar este paquete
                    </a>
                `;
                addMessage(responseHTML, 'ai');
            } else {
                const defaultHTML = `
                    <p>${defaultResponse}</p>
                    <a href="https://wa.me/5585662464?text=${encodeURIComponent(defaultRec.link)}" target="_blank" class="chat-cta-btn">
                        <i class="fa-brands fa-whatsapp"></i> Consultar por WhatsApp
                    </a>
                `;
                addMessage(defaultHTML, 'ai');
            }

        }, 1200); // 1.2 segundos de delay
    });
}
