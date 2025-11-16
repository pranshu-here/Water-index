// =======================
// voice-assistant.js
// Farmers AI Assistant for Water Health Index
// =======================
document.addEventListener('DOMContentLoaded', () => {

  // -----------------------
  // 1. Get all DOM elements
  // -----------------------
  const openBtn      = document.getElementById('open-assistant-btn');
  const chatbox      = document.getElementById('assistant-chatbox');
  const sendBtn      = document.getElementById('send-btn');
  const inputField   = document.getElementById('user-input');
  const chatOutput   = document.getElementById('chat-output');
  const voiceBtn     = document.getElementById('voice-btn');
  const stopVoiceBtn = document.getElementById('stop-voice-btn');
  const closeBtn     = document.getElementById('close-btn');

  if (!openBtn || !chatbox || !sendBtn || !inputField || !chatOutput) {
    console.log('Farmers AI Assistant: elements not found, stopping.');
    return;
  }

  // -----------------------
  // 2. Data for crops & pH
  // -----------------------
  const cropPHRanges = {
    rice:      { min: 5.5, max: 7.0,  note: 'Rice (paddy) likes slightly acidic to neutral water and can stand standing water in fields.' },
    wheat:     { min: 6.0, max: 7.5,  note: 'Wheat prefers mild acidity to neutral pH and well‑drained soil.' },
    maize:     { min: 5.5, max: 7.5,  note: 'Maize adapts well but prefers near‑neutral pH with good fertility.' },
    sugarcane: { min: 6.0, max: 7.5,  note: 'Sugarcane needs moist soil and slightly acidic to neutral pH.' },
    cotton:    { min: 5.8, max: 7.5,  note: 'Cotton prefers warm climate and slightly acidic to neutral pH.' },
    soybean:   { min: 6.0, max: 7.5,  note: 'Soybean fixes nitrogen and prefers near‑neutral pH for good nodulation.' },
    mustard:   { min: 5.5, max: 7.5,  note: 'Mustard tolerates mild acidity and neutral soils; good for rabi season.' },
    tomato:    { min: 6.0, max: 7.0,  note: 'Tomato likes slightly acidic soil and hates waterlogging.' },
    chilli:    { min: 6.0, max: 7.0,  note: 'Chilli likes warm climate, slightly acidic soils, and good drainage.' },
    capsicum:  { min: 6.0, max: 7.0,  note: 'Capsicum behaves similar to chilli and prefers fertile, well‑drained soil.' },
    banana:    { min: 5.5, max: 7.0,  note: 'Banana needs plenty of moisture and slightly acidic to neutral soil.' },
    mango:     { min: 5.5, max: 7.5,  note: 'Mango trees tolerate a wide pH, but best near neutral with good drainage.' },
    pulses:    { min: 6.0, max: 7.5,  note: 'Pulses like gram, lentil, pigeon pea prefer mild acidity to neutral pH.' },
    groundnut: { min: 5.5, max: 7.0,  note: 'Groundnut loves loose, sandy soil and slightly acidic pH.' },
    potato:    { min: 5.2, max: 6.5,  note: 'Potato prefers more acidic soil compared to many field crops.' }
  };

  const cropSynonyms = {
    paddy: 'rice',
    rice: 'rice',
    wheat: 'wheat',
    corn: 'maize',
    maize: 'maize',
    sugarcane: 'sugarcane',
    cotton: 'cotton',
    soybean: 'soybean',
    soya: 'soybean',
    soyabean: 'soybean',
    mustard: 'mustard',
    tomato: 'tomato',
    chilli: 'chilli',
    chili: 'chilli',
    capsicum: 'capsicum',
    banana: 'banana',
    mango: 'mango',
    pulses: 'pulses',
    dal: 'pulses',
    lentil: 'pulses',
    gram: 'pulses',
    groundnut: 'groundnut',
    peanut: 'groundnut',
    potato: 'potato'
  };

  // -----------------------
  // 3. Utility functions
  // -----------------------
  function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  function addMessage(sender, message) {
    const row = document.createElement('div');
    row.style.margin = '6px 0';
    row.style.whiteSpace = 'pre-wrap';

    const label = document.createElement('span');
    label.textContent = sender + ': ';
    label.style.fontWeight = 'bold';
    label.style.color = sender === 'AI' ? '#55ebca' : '#ffd27f';

    const text = document.createElement('span');
    text.textContent = message;
    text.style.color = '#e3fbfa';

    row.appendChild(label);
    row.appendChild(text);

    chatOutput.appendChild(row);
    chatOutput.scrollTop = chatOutput.scrollHeight;
  }

  function extractPH(text) {
    const match = text.match(/(\d+(\.\d+)?)/);
    if (!match) return null;
    const value = parseFloat(match[1]);
    if (isNaN(value) || value < 0 || value > 14) return null;
    return value;
  }

  function phStatus(ph) {
    if (ph < 5.0) return 'strongly acidic and risky for many crops.';
    if (ph < 5.5) return 'acidic; some crops grow but many prefer higher pH.';
    if (ph < 6.0) return 'slightly acidic; good for some crops that like acidity.';
    if (ph < 7.5) return 'near neutral and friendly for most common crops.';
    if (ph < 8.5) return 'slightly to moderately alkaline; some crops may struggle.';
    return 'strongly alkaline; careful management and amendments are needed.';
  }

  function genericPHAdvice(ph) {
    let msg = `Your pH value ${ph.toFixed(2)} is ${phStatus(ph)}\n\n`;
    if (ph < 6.0) {
      msg += 'To raise pH (reduce acidity), farmers usually apply agricultural lime, add compost or farmyard manure, and avoid very acidic nitrogen fertilisers. Always follow soil‑test advice for correct quantity.\n';
    } else if (ph > 7.5) {
      msg += 'To reduce alkalinity, they add plenty of organic matter, improve drainage, and sometimes use gypsum or sulphur where suitable. Avoid highly alkaline or salty irrigation water when possible.\n';
    } else {
      msg += 'This pH is already suitable for many crops. Focus on balanced fertiliser, crop rotation, and careful irrigation to keep it stable.\n';
    }
    msg += 'You can also see the Smart pH helper and crop advice panels beside this assistant for more detail.';
    return msg;
  }

  function cropsForPH(ph) {
    const good = [];
    const okay = [];
    for (const crop in cropPHRanges) {
      const r = cropPHRanges[crop];
      if (ph >= r.min && ph <= r.max) {
        good.push(crop);
      } else if (ph >= r.min - 0.5 && ph <= r.max + 0.5) {
        okay.push(crop);
      }
    }

    let msg = `At pH ${ph.toFixed(2)}, water/soil is ${phStatus(ph)}\n\n`;
    if (good.length) {
      msg += 'Crops that usually match this pH well: ' +
             good.map(capitalize).join(', ') + '.\n';
    }
    if (okay.length) {
      msg += 'These crops may still grow but need variety choice or careful management: ' +
             okay.map(capitalize).join(', ') + '.\n';
    }
    msg += 'Always combine pH information with climate, soil type, and local agriculture‑department advice.';
    return msg;
  }

  function evaluateCropPH(cropKey, ph) {
    const r = cropPHRanges[cropKey];
    const base = `${capitalize(cropKey)} prefers pH about ${r.min} to ${r.max}. ${r.note} `;
    if (ph < r.min - 0.3) {
      return base + `Your pH ${ph.toFixed(2)} is more acidic than its comfort zone, so growth and yield may reduce unless you correct acidity.`;
    } else if (ph > r.max + 0.3) {
      return base + `Your pH ${ph.toFixed(2)} is more alkaline than ideal, so you may see nutrient problems and need amendments.`;
    }
    return base + `Your pH ${ph.toFixed(2)} is inside or close to the good range, so this crop is generally suitable if other factors are okay.`;
  }

  function findCropInText(text) {
    for (const word in cropSynonyms) {
      if (text.includes(word)) {
        return cropSynonyms[word];
      }
    }
    return null;
  }

  // -----------------------
  // 4. Brain: answer logic
  // -----------------------
  function answerWebsite() {
    return 'This Water Health Index website helps you check how healthy your water is and how it affects farming. The Home page explains the concept. The Measure page lets you enter water test values and see a health rating. The Map page links readings to real locations. The Farmers Assistance page, where we are now, uses pH and crops to give simple farming tips. The Care page tells you how to protect and save water. The Chart page shows graphs of your readings, and the Details page explains the science behind the index.';
  }

  function answerIrrigation() {
    return 'Irrigation tips: water in early morning or late evening to reduce evaporation. Avoid waterlogging; roots need air as well as water. Sandy soils need more frequent but lighter irrigation, while clay soils need less frequent but deeper irrigation. Adjust schedule depending on crop stage—seedlings and flowering stages are very sensitive to water stress. Whenever possible, use methods like drip or sprinkler to save water and protect your Water Health Index.';
  }

  function answerFertiliser() {
    return 'Fertiliser basics: always try to follow a soil test recommendation. Use balanced NPK instead of only urea. Split nitrogen into 2–3 doses during the season instead of one big dose. Mix organic manures or compost to improve soil structure and microbial life. Keep fertiliser away from wells, ponds and rivers to avoid polluting water, because that will lower the Water Health Index and harm people and ecosystems.';
  }

  function answerSavedReading() {
    return 'To use a saved reading: first go to the Measure page and enter your water test values. Save that reading. Then visit the Farmers Assistance page and either type the same pH value into the Smart pH helper or use your own button to pull the latest reading. After you have the pH, choose a crop in the Crop‑based advice section to see how well it fits and what management tips to follow.';
  }

  function getAIResponse(userText) {
    const text = userText.toLowerCase();

    if (/(hello|hi|hey|namaste|namaskar)/.test(text)) {
      return 'Namaste! I am the Farmers AI Assistant for the Water Health Index website. You can ask about the website, water pH, which crops are suitable for a pH value, irrigation tips, fertiliser basics, and how to use your saved readings.';
    }

    if (text.includes('website') || text.includes('this site') || text.includes('water health index')) {
      return answerWebsite();
    }

    if (text.includes('saved reading') || text.includes('latest reading') || text.includes('measure page')) {
      return answerSavedReading();
    }

    if (text.includes('irrigation') || text.includes('watering')) {
      return answerIrrigation();
    }

    if (text.includes('fertiliser') || text.includes('fertilizer') || text.includes('npk') || text.includes('manure')) {
      return answerFertiliser();
    }

    const cropKey = findCropInText(text);
    const ph = extractPH(text);

    if (cropKey && ph !== null) {
      return evaluateCropPH(cropKey, ph);
    }

    if ((text.includes('which crop') || text.includes('what crop') || text.includes('best crop')) && ph !== null) {
      return cropsForPH(ph);
    }

    if (text.includes('ph')) {
      if (ph !== null) return genericPHAdvice(ph);
      return 'pH tells you if water or soil is acidic or alkaline. 7.0 is neutral, lower is acidic, higher is alkaline. Most crops like around 6.0–7.5. You can ask things like: "What does pH 5.5 mean for crops?" or "Which crops are good at pH 7?".';
    }

    if (text.includes('help') || text.includes('what can you do')) {
      return 'I can explain this website, give pH meaning, suggest crops for a pH value, comment on whether a crop will fit your pH, share irrigation tips, basic fertiliser advice and how to use saved readings. Example: "Explain this website", "Which crops are good at pH 6.5?", "Is wheat ok at pH 5.5?", or "Give irrigation tips".';
    }

    if (text.includes('which crop') || text.includes('what crop') || text.includes('best crop')) {
      return 'Tell me your water or soil pH so I can suggest crops. For example: "Which crop is good at pH 6.5?" or "Best crops at pH 7".';
    }

    return 'Right now I answer questions about the Water Health Index website, pH, crops, irrigation and fertiliser. Try asking: "Explain this website", "Which crops are good at pH 6.5?", "Is rice ok at pH 7.5?", or "How do I use my saved reading?".';
  }

  // -----------------------
  // 5. Voice output (with stop control)
  // -----------------------
  let preferredVoice = null;

  function chooseVoice() {
    if (!window.speechSynthesis) return;
    const voices = window.speechSynthesis.getVoices();
    if (!voices || !voices.length) return;

    const targets = ['en-IN', 'en-GB', 'en-US'];
    for (const target of targets) {
      const v = voices.find(voice =>
        voice.lang === target && /female|zira|neural/i.test(voice.name)
      );
      if (v) {
        preferredVoice = v;
        break;
      }
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
    if (preferredVoice) {
      u.voice = preferredVoice;
    } else {
      u.lang = 'en-IN';
    }
    u.rate = 1.0;
    u.pitch = 1.0;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  }

  // -----------------------
  // 6. Send + events
  // -----------------------
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

  // Open / close behaviour
  openBtn.onclick = () => {
    chatbox.style.display = 'block';
    if (chatOutput.childElementCount === 0) {
      addMessage('AI', 'Namaste! I am your Farmers AI Assistant for the Water Health Index website. Ask me about the website, pH, crops, irrigation or fertiliser.');
      addMessage('AI', 'Example questions: "Explain this website", "Which crops are good at pH 6.5?", "Is rice okay at pH 7.5?".');
    }
  };

  closeBtn.onclick = () => {
    chatbox.style.display = 'none';
    if (window.speechSynthesis) window.speechSynthesis.cancel();
  };

  // Stop voice button
  if (stopVoiceBtn && window.speechSynthesis) {
    stopVoiceBtn.onclick = () => {
      window.speechSynthesis.cancel();
    };
  }

  // -----------------------
  // 7. Voice input (speech recognition)
  // -----------------------
  let recognition = null;
  try {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) {
      recognition = new SR();
      recognition.lang = 'en-IN';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onresult = event => {
        const transcript = event.results[0][0].transcript;
        inputField.value = transcript;
        sendQuery();
      };

      recognition.onerror = event => {
        console.log('Speech recognition error:', event.error);
      };
    } else {
      console.log('SpeechRecognition API not supported in this browser.');
    }
  } catch (err) {
    console.log('Error initialising speech recognition:', err);
  }

  if (voiceBtn) {
    if (!recognition) {
      voiceBtn.disabled = true;
      voiceBtn.title = 'Voice recognition not supported in this browser';
    } else {
      voiceBtn.onclick = () => {
        recognition.start();
      };
    }
  }

  // -----------------------
  // 8. Quick question buttons
  // -----------------------
  const quickBar = document.createElement('div');
  quickBar.style.marginTop = '6px';
  quickBar.style.display = 'flex';
  quickBar.style.flexWrap = 'wrap';
  quickBar.style.gap = '4px';

  function makeQuickButton(label, q) {
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

  quickBar.appendChild(makeQuickButton('Best crops at pH 6.5', 'Which crops are good at pH 6.5?'));
  quickBar.appendChild(makeQuickButton('Improve pH', 'How can I improve my water pH? My pH is 5.5.'));
  quickBar.appendChild(makeQuickButton('Irrigation tips', 'Give me irrigation tips.'));
  quickBar.appendChild(makeQuickButton('Fertiliser basics', 'Tell me fertiliser basics.'));
  quickBar.appendChild(makeQuickButton('Explain website', 'Explain this website for farmers.'));
  quickBar.appendChild(makeQuickButton('Saved reading help', 'How do I use my saved reading from the Measure page?'));

  chatbox.appendChild(quickBar);
});
