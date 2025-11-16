// voice-assistant.js
document.addEventListener('DOMContentLoaded', () => {
  const openBtn    = document.getElementById('open-assistant-btn');
  const chatbox    = document.getElementById('assistant-chatbox');
  const sendBtn    = document.getElementById('send-btn');
  const inputField = document.getElementById('user-input');
  const chatOutput = document.getElementById('chat-output');
  const voiceBtn   = document.getElementById('voice-btn');
  const closeBtn   = document.getElementById('close-btn');

  if (!openBtn || !chatbox || !sendBtn || !inputField || !chatOutput) {
    console.log('AI assistant elements not found.');
    return;
  }

  // ========== Open / close ==========
  openBtn.onclick = () => {
    chatbox.style.display = 'block';
    if (chatOutput.childElementCount === 0) {
      addMessage('AI', 'Namaste! I am your Farmers AI Assistant for the Water Health Index website. Ask me about the website, pH, crops, irrigation or fertiliser.');
      addMessage('AI', 'Example questions: "Explain this website", "Which crops are good at pH 6.5?", "Is rice okay at pH 7.5?".');
    }
  };

  closeBtn.onclick = () => {
    chatbox.style.display = 'none';
  };

  // ========== Messages ==========
  function addMessage(sender, message) {
    const row = document.createElement('div');
    row.style.margin = '6px 0';
    row.style.whiteSpace = 'pre-wrap';

    const label = document.createElement('span');
    label.style.fontWeight = 'bold';
    label.textContent = sender + ': ';
    label.style.color = sender === 'AI' ? '#55ebca' : '#ffd27f';

    const text = document.createElement('span');
    text.textContent = message;
    text.style.color = '#e3fbfa';

    row.appendChild(label);
    row.appendChild(text);
    chatOutput.appendChild(row);
    chatOutput.scrollTop = chatOutput.scrollHeight;
  }

  // ========== Knowledge: crops & pH ==========
  const cropPHRanges = {
    rice:      { min: 5.5, max: 7.0,  note: 'Rice (paddy) likes slightly acidic to neutral water and can stand flooding.' },
    wheat:     { min: 6.0, max: 7.5,  note: 'Wheat prefers mild acidity to neutral pH and well‑drained soil.' },
    maize:     { min: 5.5, max: 7.5,  note: 'Maize adapts to a wide pH but likes near‑neutral the most.' },
    sugarcane: { min: 6.0, max: 7.5,  note: 'Sugarcane needs moist soil and slightly acidic to neutral pH.' },
    cotton:    { min: 5.8, max: 7.5,  note: 'Cotton prefers warm climate and slightly acidic to neutral pH.' },
    soybean:   { min: 6.0, max: 7.5,  note: 'Soybean fixes nitrogen and prefers near‑neutral pH.' },
    mustard:   { min: 5.5, max: 7.5,  note: 'Mustard tolerates mild acidity and neutral soils.' },
    tomato:    { min: 6.0, max: 7.0,  note: 'Tomato likes slightly acidic soil and good drainage.' },
    chilli:    { min: 6.0, max: 7.0,  note: 'Chilli likes warm weather and slightly acidic soils.' },
    banana:    { min: 5.5, max: 7.0,  note: 'Banana needs plenty of water and slightly acidic to neutral soil.' },
    mango:     { min: 5.5, max: 7.5,  note: 'Mango trees tolerate a wide pH range, best near neutral.' },
    pulses:    { min: 6.0, max: 7.5,  note: 'Many pulses like gram and lentil prefer mild acidity to neutral pH.' }
  };

  function extractPH(text) {
    const m = text.match(/(\d+(\.\d+)?)/);
    if (!m) return null;
    const v = parseFloat(m[1]);
    if (isNaN(v) || v < 0 || v > 14) return null;
    return v;
  }

  function phStatus(ph) {
    if (ph < 5.0) return 'strongly acidic and risky for many crops.';
    if (ph < 5.5) return 'acidic; some crops grow but many prefer higher pH.';
    if (ph < 6.0) return 'slightly acidic; good for many crops that like acidity.';
    if (ph < 7.5) return 'near neutral and friendly for most crops.';
    if (ph < 8.5) return 'slightly to moderately alkaline; some crops may struggle.';
    return 'strongly alkaline; careful management is needed.';
  }

  function genericPHAdvice(ph) {
    let msg = `Your pH ${ph.toFixed(2)} is ${phStatus(ph)}\n\n`;
    if (ph < 6.0) {
      msg += 'To raise pH (reduce acidity), farmers often apply agricultural lime, add compost or organic manure, and avoid overuse of very acidic fertilisers. Always follow local soil‑test advice.\n';
    } else if (ph > 7.5) {
      msg += 'To reduce alkalinity, add a lot of organic matter, improve drainage, and use gypsum or sulphur in suitable soils. Try to avoid very salty or alkaline irrigation water.\n';
    } else {
      msg += 'This pH is already good for many crops. Focus on balanced fertiliser, proper irrigation, and protecting water from pollution.\n';
    }
    msg += 'You can also use the Smart pH helper and crop advice panels on this page for more details.';
    return msg;
  }

  function cropsForPH(ph) {
    const good = [];
    for (const name in cropPHRanges) {
      const r = cropPHRanges[name];
      if (ph >= r.min && ph <= r.max) good.push(name);
    }
    if (good.length === 0) {
      return `At pH ${ph.toFixed(2)}, very few common crops are comfortable. Try to correct pH closer to 6.0–7.5 using amendments and better water sources if possible.`;
    }
    return `At pH ${ph.toFixed(2)}, water/soil is ${phStatus(ph)}\nGood matching crops include: ${good.map(capitalize).join(', ')}.\nAlways also check climate, soil type, and local variety recommendations.`;
  }

  function evaluateCropPH(crop, ph) {
    const r = cropPHRanges[crop];
    const base = `${capitalize(crop)} likes pH about ${r.min} to ${r.max}. ${r.note} `;
    if (ph < r.min - 0.3) {
      return base + `Your pH ${ph.toFixed(2)} is more acidic than ideal, so growth may reduce unless you correct acidity.`;
    }
    if (ph > r.max + 0.3) {
      return base + `Your pH ${ph.toFixed(2)} is more alkaline than ideal, so watch for nutrient problems and consider amendments.`;
    }
    return base + `Your pH ${ph.toFixed(2)} is inside or very close to the best range, so this crop is generally suitable.`;
  }

  function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  // ========== Brain: answer generator ==========
  function getAIResponse(userText) {
    const text = userText.toLowerCase();

    // Website explanation
    if (text.includes('website') || text.includes('this site') || text.includes('water health index')) {
      return 'This Water Health Index website helps you test water quality, see a simple health score, and connect it to farming. The Measure page lets you enter test values. The Map page links readings to locations. The Farmers Assistance page (where you are now) uses pH and crops to give advice. The Care page teaches how to protect water, the Chart page shows graphs of your readings over time, and the Details page explains the science behind the index.';
    }

    // crops + pH general question
    if (text.includes('which crop') || text.includes('what crop') || text.includes('best crop')) {
      const ph = extractPH(text);
      if (ph !== null) {
        return cropsForPH(ph);
      }
      return 'To suggest crops, tell me your pH. For example: "Which crop is good at pH 6.5?" or "Best crops near pH 7."';
    }

    // specific crop questions
    for (const crop in cropPHRanges) {
      if (text.includes(crop)) {
        const ph = extractPH(text);
        if (ph !== null) {
          return evaluateCropPH(crop, ph);
        }
        const r = cropPHRanges[crop];
        return `${capitalize(crop)} usually grows well between pH ${r.min} and ${r.max}. ${r.note}`;
      }
    }

    // generic pH questions
    if (text.includes('ph')) {
      const ph = extractPH(text);
      if (ph !== null) return genericPHAdvice(ph);
      return 'pH shows if water or soil is acidic or alkaline. 7.0 is neutral. Most crops like around 6.0–7.5. You can ask: "What does pH 5.5 mean?" or "Which crops at pH 7?".';
    }

    // irrigation
    if (text.includes('irrigation') || text.includes('watering')) {
      return 'Basic irrigation tips: water in morning or evening to reduce evaporation; avoid waterlogging; sandy soils need more frequent, smaller irrigations; clay soils need less frequent but deeper irrigation; and adjust schedule based on crop stage—young plants are more sensitive to water stress.';
    }

    // fertiliser
    if (text.includes('fertilizer') || text.includes('fertiliser') || text.includes('npk') || text.includes('manure')) {
      return 'For fertiliser: follow soil test recommendations when possible. Use balanced NPK, not only urea. Split nitrogen into 2–3 splits. Mix organic manure or compost to improve soil health. Keep fertiliser and chemicals away from wells, ponds and rivers to protect water quality and your Water Health Index.';
    }

    // saved reading / using measure
    if (text.includes('saved reading') || text.includes('latest reading') || text.includes('measure page')) {
      return 'On the Measure page, enter your water test and save the reading. Then, on the Farmers Assistance page, type that pH value in the Smart pH helper. You can then click on crops to see how well they match that pH and what management tips to follow.';
    }

    // help
    if (text.includes('help')) {
      return 'You can ask about this website, pH meaning, which crops fit a pH value, irrigation tips, basic fertiliser advice, or how to use your saved readings. Example: "Explain this website", "Which crop is good at pH 6.5?", "Is rice good at pH 7.5?", "Give me irrigation tips".';
    }

    // default
    return 'I answer questions about the Water Health Index website, pH, crops, irrigation and fertiliser. Try: "Explain this website", "Which crops are good at pH 6.5?", or "Is wheat okay at pH 5.5?".';
  }

  // ========== Speech (voice out) ==========
  function speakText(text) {
    if (!window.speechSynthesis) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-IN';
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  }

  // ========== Send handling ==========
  async function sendQuery() {
    const userText = inputField.value.trim();
    if (!userText) return;
    addMessage('You', userText);
    inputField.value = '';
    const reply = getAIResponse(userText);
    addMessage('AI', reply);
    speakText(reply);
  }

  sendBtn.onclick = sendQuery;
  inputField.addEventListener('keyup', e => {
    if (e.key === 'Enter') sendQuery();
  });

  // ========== Voice input ==========
  let recognition = null;
  try {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) {
      recognition = new SR();
      recognition.lang = 'en-IN';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.onresult = evt => {
        const transcript = evt.results[0][0].transcript;
        inputField.value = transcript;
        sendQuery();
      };
    }
  } catch (err) {
    console.log('Speech recognition error:', err);
  }

  if (voiceBtn) {
    if (!recognition) {
      voiceBtn.disabled = true;
      voiceBtn.title = 'Voice recognition not supported in this browser';
    } else {
      voiceBtn.onclick = () => recognition.start();
    }
  }
});
