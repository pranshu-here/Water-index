// Farmers AI Assistant – simplified & fixed
document.addEventListener('DOMContentLoaded', () => {
  const openBtn      = document.getElementById('open-assistant-btn');
  const chatbox      = document.getElementById('assistant-chatbox');
  const sendBtn      = document.getElementById('send-btn');
  const inputField   = document.getElementById('user-input');
  const chatOutput   = document.getElementById('chat-output');
  const voiceBtn     = document.getElementById('voice-btn');
  const stopVoiceBtn = document.getElementById('stop-voice-btn');
  const closeBtn     = document.getElementById('close-btn');

  if (!openBtn || !chatbox || !sendBtn || !inputField || !chatOutput) {
    console.log('Farmers AI Assistant: elements not found.');
    return;
  }

  // ---------- Crop pH data ----------
  const cropPHRanges = {
    rice:      { min: 5.5, max: 7.0, note: 'Rice (paddy) likes slightly acidic to neutral water and can tolerate flooded fields.' },
    wheat:     { min: 6.0, max: 7.5, note: 'Wheat prefers mild acidity to neutral pH with good drainage.' },
    maize:     { min: 5.5, max: 7.5, note: 'Maize adapts well but prefers near‑neutral pH and fertile soil.' },
    sugarcane: { min: 6.0, max: 7.5, note: 'Sugarcane needs moist soil and slightly acidic to neutral pH.' },
    cotton:    { min: 5.8, max: 7.5, note: 'Cotton likes warm climate and slightly acidic to neutral pH.' },
    soybean:   { min: 6.0, max: 7.5, note: 'Soybean fixes nitrogen and prefers near‑neutral pH.' },
    mustard:   { min: 5.5, max: 7.5, note: 'Mustard tolerates mild acidity and neutral soils.' },
    tomato:    { min: 6.0, max: 7.0, note: 'Tomato likes slightly acidic soil and hates waterlogging.' },
    chilli:    { min: 6.0, max: 7.0, note: 'Chilli likes warm climate, slightly acidic soils, and good drainage.' },
    banana:    { min: 5.5, max: 7.0, note: 'Banana needs plenty of moisture and slightly acidic to neutral soil.' },
    mango:     { min: 5.5, max: 7.5, note: 'Mango trees tolerate a wide pH but prefer near‑neutral.' },
    pulses:    { min: 6.0, max: 7.5, note: 'Many pulses like gram and lentil prefer mild acidity to neutral pH.' }
  };

  const cropSynonyms = {
    rice: 'rice', paddy: 'rice',
    wheat: 'wheat',
    maize: 'maize', corn: 'maize',
    sugarcane: 'sugarcane',
    cotton: 'cotton',
    soybean: 'soybean', soya: 'soybean', soyabean: 'soybean',
    mustard: 'mustard',
    tomato: 'tomato',
    chilli: 'chilli', chili: 'chilli',
    banana: 'banana',
    mango: 'mango',
    pulses: 'pulses', dal: 'pulses', lentil: 'pulses', gram: 'pulses'
  };

  // ---------- Small helpers ----------
  function addMessage(sender, text) {
    const row = document.createElement('div');
    row.style.margin = '6px 0';
    row.style.whiteSpace = 'pre-wrap';

    const label = document.createElement('span');
    label.textContent = sender + ': ';
    label.style.fontWeight = 'bold';
    label.style.color = sender === 'AI' ? '#55ebca' : '#ffd27f';

    const body = document.createElement('span');
    body.textContent = text;
    body.style.color = '#e3fbfa';

    row.appendChild(label);
    row.appendChild(body);
    chatOutput.appendChild(row);
    chatOutput.scrollTop = chatOutput.scrollHeight;
  }

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
    if (ph < 6.0) return 'slightly acidic; good for crops that like acidity.';
    if (ph < 7.5) return 'near neutral and friendly for most crops.';
    if (ph < 8.5) return 'slightly to moderately alkaline; some crops may struggle.';
    return 'strongly alkaline; careful management is needed.';
  }

  function capitalize(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  function findCrop(text) {
    for (const word in cropSynonyms) {
      if (text.includes(word)) return cropSynonyms[word];
    }
    return null;
  }

  // ---------- Knowledge replies ----------

  function websiteAnswer() {
    return 'This Water Health Index website helps you test water, see a health score, and connect it to farming. "Measure" lets you enter test values. "Map" shows where readings were taken. "Farmers Assistance" (here) uses pH and crops to give practical advice. "Care" teaches how to protect water, "Chart" shows graphs of your readings, and "Details" explains the science behind the index.';
  }

  function irrigationAnswer() {
    return 'Irrigation tips: water in early morning or late evening to reduce evaporation; avoid waterlogging; sandy soils need more frequent but smaller irrigations, clay soils need fewer but deeper irrigations; adjust water based on crop stage—seedlings and flowering are very sensitive. Use drip or sprinkler where possible to save water.';
  }

  function fertiliserAnswer() {
    return 'Fertiliser basics: follow soil‑test recommendations, use balanced NPK instead of only urea, split nitrogen into 2–3 doses, and always mix organic manure or compost to improve soil health. Keep fertiliser and chemicals away from wells, ponds and rivers to protect water quality and your Water Health Index.';
  }

  function savedReadingAnswer() {
    return 'To use a saved reading: go to the Measure page, enter your test values, and save. Then come to Farmers Assistance, type that pH into the Smart pH helper, and click on different crops to see how well they match and what management tips to follow.';
  }

  function genericPHAdvice(ph) {
    let msg = `Your pH ${ph.toFixed(2)} is ${phStatus(ph)}\n\n`;
    if (ph < 6.0) {
      msg += 'To raise pH (reduce acidity), apply agricultural lime as per soil test, add compost or farmyard manure, and avoid overuse of very acidic fertilisers.\n';
    } else if (ph > 7.5) {
      msg += 'To lower alkalinity, add plenty of organic matter, improve drainage, and where suitable use gypsum or sulphur. Also avoid highly alkaline or salty irrigation water.\n';
    } else {
      msg += 'This pH is already suitable for many crops. Focus on good fertiliser balance, crop rotation, and proper irrigation to keep it stable.\n';
    }
    msg += 'You can also use the Smart pH helper and crop advice boxes next to this assistant.';
    return msg;
  }

  function cropsForPH(ph) {
    const good = [];
    for (const crop in cropPHRanges) {
      const r = cropPHRanges[crop];
      if (ph >= r.min && ph <= r.max) good.push(crop);
    }
    if (!good.length) {
      return `At pH ${ph.toFixed(2)}, very few common crops are comfortable. Try to correct pH closer to 6.0–7.5 using amendments and better quality water.`;
    }
    return `At pH ${ph.toFixed(2)}, water/soil is ${phStatus(ph)}\nGood matching crops include: ${good.map(capitalize).join(', ')}.\nAlways also check climate, soil type and local variety recommendations.`;
  }

  function evaluateCropPH(cropKey, ph) {
    const r = cropPHRanges[cropKey];
    const base = `${capitalize(cropKey)} usually likes pH about ${r.min} to ${r.max}. ${r.note} `;
    if (ph < r.min - 0.3) {
      return base + `Your pH ${ph.toFixed(2)} is more acidic than this, so growth may reduce unless acidity is corrected.`;
    }
    if (ph > r.max + 0.3) {
      return base + `Your pH ${ph.toFixed(2)} is more alkaline than ideal, so watch for nutrient problems and consider amendments.`;
    }
    return base + `Your pH ${ph.toFixed(2)} is inside or close to the good range, so this crop is generally suitable if climate and nutrients are okay.`;
  }

  function getAIResponse(userText) {
    const t = userText.toLowerCase();

    if (/(hello|hi|hey|namaste)/.test(t)) {
      return 'Namaste! You can ask about this website, pH meaning, which crops fit a pH value, irrigation tips, fertiliser basics, or how to use your saved readings.';
    }

    if (t.includes('website') || t.includes('this site') || t.includes('water health index')) {
      return websiteAnswer();
    }

    if (t.includes('saved reading') || t.includes('latest reading') || t.includes('measure page')) {
      return savedReadingAnswer();
    }

    if (t.includes('irrigation') || t.includes('watering')) {
      return irrigationAnswer();
    }

    if (t.includes('fertiliser') || t.includes('fertilizer') || t.includes('npk') || t.includes('manure')) {
      return fertiliserAnswer();
    }

    const cropKey = findCrop(t);
    const ph = extractPH(t);

    if (cropKey && ph !== null) {
      return evaluateCropPH(cropKey, ph);
    }

    if ((t.includes('which crop') || t.includes('what crop') || t.includes('best crop')) && ph !== null) {
      return cropsForPH(ph);
    }

    if (t.includes('ph')) {
      if (ph !== null) return genericPHAdvice(ph);
      return 'pH shows if water/soil is acidic or alkaline. 7 is neutral, lower is acidic, higher is alkaline. Most crops like around 6.0–7.5. You can ask: "What does pH 5.5 mean?" or "Which crops are good at pH 7?".';
    }

    if (t.includes('help') || t.includes('what can you do')) {
      return 'I can explain this website, tell pH meaning, suggest crops for a pH value, check if a crop fits your pH, give irrigation tips, fertiliser basics, and how to use your saved readings. Example: "Explain this website", "Which crops are good at pH 6.5?", "Is rice ok at pH 7.5?".';
    }

    return 'I answer questions about this website, pH, crops, irrigation and fertiliser. Try: "Explain this website", "Which crops are good at pH 6.5?", or "Is wheat ok at pH 5.5?".';
  }

  // ---------- Voice output ----------
  let preferredVoice = null;

  function chooseVoice() {
    if (!window.speechSynthesis) return;
    const voices = window.speechSynthesis.getVoices();
    if (!voices || !voices.length) return;

    const targets = ['en-IN', 'en-GB', 'en-US'];
    for (const t of targets) {
      const v = voices.find(voice => voice.lang === t && /female|zira|neural/i.test(voice.name));
      if (v) { preferredVoice = v; break; }
    }
    if (!preferredVoice) {
      preferredVoice = voices.find(v => v.lang.startsWith('en')) || voices[0];
    }
  }

  if (window.speechSynthesis) {
    window.speechSynthesis.onvoiceschanged = chooseVoice;
    chooseVoice();
  }

  function speakText(text) {
    if (!window.speechSynthesis) return;
    const u = new SpeechSynthesisUtterance(text);
    if (preferredVoice) u.voice = preferredVoice;
    else u.lang = 'en-IN';
    u.rate = 1.0;
    u.pitch = 1.0;
    window.speechSynthesis.cancel();   // stop anything still talking
    window.speechSynthesis.speak(u);
  }

  // ---------- Send + events ----------
  function sendQuery() {
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

  openBtn.onclick = () => {
    chatbox.style.display = 'block';
    if (chatOutput.childElementCount === 0) {
      addMessage('AI', 'Namaste! I am your Farmers AI Assistant for the Water Health Index website. Ask me about the website, pH, crops, irrigation or fertiliser.');
      addMessage('AI', 'Example questions: "Explain this website", "Which crops are good at pH 6.5?", "Is rice ok at pH 7.5?".');
    }
  };

  closeBtn.onclick = () => {
    chatbox.style.display = 'none';
    if (window.speechSynthesis) window.speechSynthesis.cancel();
  };

  if (stopVoiceBtn && window.speechSynthesis) {
    stopVoiceBtn.onclick = () => {
      window.speechSynthesis.cancel();
    };
  }

  // ---------- Voice input ----------
  let recognition = null;
  try {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) {
      recognition = new SR();
      recognition.lang = 'en-IN';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onresult = e => {
        const transcript = e.results[0][0].transcript;
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

  // ---------- Quick question buttons ----------
  const quickBar = document.createElement('div');
  quickBar.style.marginTop = '6px';
  quickBar.style.display = 'flex';
  quickBar.style.flexWrap = 'wrap';
  quickBar.style.gap = '4px';

  function quick(label, q) {
    const b = document.createElement('button');
    b.textContent = label;
    b.style.borderRadius = '10px';
    b.style.border = '1px solid #55ebca';
    b.style.background = '#15313e';
    b.style.color = '#e3fbfa';
    b.style.fontSize = '11px';
    b.style.padding = '3px 6px';
    b.style.cursor = 'pointer';
    b.onclick = () => {
      inputField.value = q;
      sendQuery();
    };
    return b;
  }

  quickBar.appendChild(quick('Best crops at pH 6.5', 'Which crops are good at pH 6.5?'));
  quickBar.appendChild(quick('Improve pH', 'How can I improve my water pH? My pH is 5.5.'));
  quickBar.appendChild(quick('Irrigation tips', 'Give me irrigation tips.'));
  quickBar.appendChild(quick('Fertiliser basics', 'Tell me fertiliser basics.'));
  quickBar.appendChild(quick('Explain website', 'Explain this website for farmers.'));
  quickBar.appendChild(quick('Saved reading help', 'How do I use my saved reading from the Measure page?'));

  chatbox.appendChild(quickBar);
});
