// voice-assistant.js
document.addEventListener('DOMContentLoaded', () => {
  // ====== Grab elements from farmers.html ======
  const openBtn     = document.getElementById('open-assistant-btn');
  const chatbox     = document.getElementById('assistant-chatbox');
  const sendBtn     = document.getElementById('send-btn');
  const inputField  = document.getElementById('user-input');
  const chatOutput  = document.getElementById('chat-output');
  const voiceBtn    = document.getElementById('voice-btn');
  const closeBtn    = document.getElementById('close-btn');

  // If this page doesn’t have the assistant, stop
  if (!openBtn || !chatbox || !sendBtn || !inputField || !chatOutput) {
    console.log('AI assistant elements not found on this page.');
    return;
  }

  // ====== Extra area for quick question buttons ======
  // Create a small bar at the bottom of the chat for suggested questions
  const quickBar = document.createElement('div');
  quickBar.style.marginTop = '6px';
  quickBar.style.display = 'flex';
  quickBar.style.flexWrap = 'wrap';
  quickBar.style.gap = '4px';

  function makeQuickButton(label, question) {
    const btn = document.createElement('button');
    btn.textContent = label;
    btn.style.borderRadius = '10px';
    btn.style.border = '1px solid #55ebca';
    btn.style.background = '#15313e';
    btn.style.color = '#e3fbfa';
    btn.style.fontSize = '11px';
    btn.style.padding = '3px 6px';
    btn.style.cursor = 'pointer';
    btn.onclick = () => {
      inputField.value = question;
      sendQuery();
    };
    return btn;
  }

  quickBar.appendChild(makeQuickButton('Best crops at pH 6.5', 'Which crops are good at pH 6.5?'));
  quickBar.appendChild(makeQuickButton('Improve pH', 'How can I improve my water pH?'));
  quickBar.appendChild(makeQuickButton('Irrigation tips', 'Give me basic irrigation tips.'));
  quickBar.appendChild(makeQuickButton('Fertiliser basics', 'Tell me basic fertiliser tips.'));
  quickBar.appendChild(makeQuickButton('Site help', 'Explain what this Water Health Index website does for farmers.'));
  quickBar.appendChild(makeQuickButton('Saved reading', 'How do I use my saved water reading with crops?'));

  // Attach quickBar below the input area (inside chatbox)
  chatbox.appendChild(quickBar);

  // ====== Open / Close behaviour ======
  openBtn.onclick = () => {
    chatbox.style.display = 'block';
    // First time open: show welcome if empty
    if (chatOutput.childElementCount === 0) {
      addMessage('AI', 'Namaste! I am your Farmers AI Assistant. You can ask about pH, crops, irrigation, fertiliser, or how to use this Water Health Index website.');
      addMessage('AI', 'Try typing your question, clicking one of the quick buttons, or press the mic button and speak.');
    }
  };

  closeBtn.onclick = () => {
    chatbox.style.display = 'none';
  };

  // ====== Utility: add messages ======
  function addMessage(sender, message) {
    const wrapper = document.createElement('div');
    wrapper.style.margin = '6px 0';

    const labelSpan = document.createElement('span');
    labelSpan.style.fontWeight = 'bold';
    labelSpan.textContent = sender + ': ';

    const textSpan = document.createElement('span');
    textSpan.textContent = message;

    if (sender === 'AI') {
      labelSpan.style.color = '#55ebca';
      textSpan.style.color = '#c8f7f2';
    } else {
      labelSpan.style.color = '#ffd27f';
      textSpan.style.color = '#e3fbfa';
    }

    wrapper.appendChild(labelSpan);
    wrapper.appendChild(textSpan);
    wrapper.style.whiteSpace = 'pre-wrap';

    chatOutput.appendChild(wrapper);
    chatOutput.scrollTop = chatOutput.scrollHeight;
  }

  // ====== Knowledge: crops and pH ranges ======
  const cropPHRanges = {
    rice:        { min: 5.5, max: 7.0,  note: 'Rice (paddy) likes slightly acidic to neutral conditions and can tolerate standing water.' },
    wheat:       { min: 6.0, max: 7.5,  note: 'Wheat performs best in well-drained soil with mild acidity to neutral pH.' },
    maize:       { min: 5.5, max: 7.5,  note: 'Maize adapts to a wide pH range but prefers near-neutral conditions.' },
    sugarcane:   { min: 6.0, max: 7.5,  note: 'Sugarcane prefers slightly acidic to neutral soils with good moisture.' },
    cotton:      { min: 5.8, max: 7.5,  note: 'Cotton likes warm climates and slightly acidic to neutral soils.' },
    soybean:     { min: 6.0, max: 7.5,  note: 'Soybean fixes nitrogen and prefers near-neutral pH for best nodulation.' },
    mustard:     { min: 5.5, max: 7.5,  note: 'Mustard grows well in cool seasons and can handle mild acidity.' },
    tomato:      { min: 6.0, max: 7.0,  note: 'Tomato prefers slightly acidic soil and good drainage.' },
    chilli:      { min: 6.0, max: 7.0,  note: 'Chilli likes warm weather and slightly acidic soils.' },
    capsicum:    { min: 6.0, max: 7.0,  note: 'Capsicum is similar to chilli, needs fertile, well-drained soil.' },
    banana:      { min: 5.5, max: 7.0,  note: 'Banana needs plenty of water and slightly acidic to neutral soil.' },
    mango:       { min: 5.5, max: 7.5,  note: 'Mango trees tolerate a wide pH range but prefer near-neutral.' },
    pulses:      { min: 6.0, max: 7.5,  note: 'Many pulses like gram, lentil, and pigeon pea prefer mild acidity to neutral pH.' },
    groundnut:   { min: 5.5, max: 7.0,  note: 'Groundnut needs loose, well-drained soil and does well in slightly acidic pH.' },
    potato:      { min: 5.2, max: 6.5,  note: 'Potato prefers more acidic soil compared to many other crops.' }
  };

  // Small helper: parse pH value if mentioned
  function extractPH(text) {
    // Look for numbers like 6, 6.5, 7.0 etc.
    const match = text.match(/(\d+(\.\d+)?)/);
    if (!match) return null;
    const value = parseFloat(match[1]);
    if (isNaN(value) || value < 0 || value > 14) return null;
    return value;
  }

  // ====== Main rule-based brain ======
  function getAIResponse(userText) {
    const text = userText.toLowerCase();

    // Greeting / intro
    if (/(hello|hi|namaste|namaskar)/.test(text)) {
      return 'Namaste! I am the Farmers AI Assistant for the Water Health Index website. You can ask about water pH, which crops match your pH, how to improve pH, irrigation tips, fertiliser basics, or how to use the different pages like Measure, Map, and Farmers Assistance.';
    }

    // Explain site features
    if (text.includes('what this website') ||
        text.includes('what does this website') ||
        text.includes('explain this website') ||
        text.includes('water health index website')) {
      return 'This Water Health Index website helps you test your water, see a simple health rating, save readings, and connect them to crops. The Home page explains the idea, the Measure page lets you enter water test values, the Map page shows locations on a map, the Farmers Assistance page gives crop and pH advice, the Care page teaches how to protect water, the Chart page shows graphs of your readings, and the Details page explains the science behind the index.';
    }

    // Saved reading / using Measure with Farmers Assistance
    if (text.includes('saved reading') || text.includes('latest reading') || text.includes('measure page')) {
      return 'First, go to the Measure page and enter your water test values. Save the reading. Then come to the Farmers Assistance page and either type the same pH or use any feature you built to pull the latest saved pH. Once you have the pH, click on a crop to see if it matches well and what management tips you should follow.';
    }

    // Basic "what should I grow" type questions
    if (text.includes('what should i grow') || text.includes('which crop should i grow') || text.includes('best crop')) {
      const ph = extractPH(text);
      if (ph !== null) {
        return cropsForPH(ph);
      } else {
        return 'To suggest crops, tell me your approximate water or soil pH. For example: "Which crop should I grow at pH 6.5?" or "Best crops near pH 7."';
      }
    }

    // Direct pH + crop questions (e.g., "Is rice good at pH 8?" or "Can I grow wheat at pH 5.5?")
    for (const cropName in cropPHRanges) {
      if (text.includes(cropName)) {
        const ph = extractPH(text);
        if (ph !== null) {
          return evaluateCropPH(cropName, ph);
        } else {
          const info = cropPHRanges[cropName];
          return `${capitalize(cropName)} usually does well between pH ${info.min} and ${info.max}. ${info.note}`;
        }
      }
    }

    // Generic pH questions
    if (text.includes('ph')) {
      const ph = extractPH(text);
      if (ph !== null) {
        return genericPHAdvice(ph);
      } else {
        return 'pH is a scale from 0 to 14 that tells you if water or soil is acidic or alkaline. Around 7.0 is neutral. Most crops prefer pH roughly between 6.0 and 7.5. You can ask: "What does pH 5.5 mean?" or "Which crops are good at pH 7?"';
      }
    }

    // Irrigation tips
    if (text.includes('irrigation') || text.includes('watering')) {
      return 'Some basic irrigation tips: irrigate in early morning or late evening to reduce evaporation loss; avoid waterlogging by matching water amount to soil type; light sandy soil needs more frequent but smaller irrigation; clay soil needs less frequent but deeper irrigation; and always consider crop stage – young plants are more sensitive to water stress.';
    }

    // Fertiliser / soil fertility
    if (text.includes('fertilizer') || text.includes('fertiliser') || text.includes('npk') || text.includes('manure')) {
      return 'For fertiliser: always try to follow a soil test recommendation. Use balanced NPK instead of only urea. Split nitrogen into 2–3 doses during the season. Mix organic manures or compost to improve soil structure. Avoid dumping fertiliser near wells or water bodies because it can pollute water and harm the Water Health Index.';
    }

    // Questions about Care page / saving water
    if (text.includes('save water') || text.includes('care page') || text.includes('protect water')) {
      return 'The Care section of this website explains how to protect and improve water quality: avoid throwing waste or chemicals into rivers and ponds, fix leaking taps and pipes, use drip or sprinkler irrigation where possible, and plant trees and grasses near water bodies to reduce erosion and filter pollution before it enters the water.';
    }

    // Questions about charts / graphs
    if (text.includes('chart') || text.includes('graph') || text.includes('trend')) {
      return 'On the Chart page, you can see your Water Health Index readings as graphs over time or across places. This helps you notice if water quality is improving or getting worse. For an exhibition, you can show how your actions, like reducing pollution or changing irrigation, affect the index values on the charts.';
    }

    // Help keyword
    if (text.includes('help')) {
      return 'You can ask me things like: "Explain this website", "Which crops are good at pH 6.5?", "Is wheat okay at pH 5.5?", "How can I improve my water pH?", "Give irrigation tips", or "Tell basic fertiliser advice". You can also use the quick buttons below the chat box.';
    }

    // Default fallback
    return 'Right now I answer questions about your Water Health Index website, pH, crop choice, irrigation, fertiliser, saving water, and charts. Try asking: "Which crops are good at pH 6.5?", or "Explain this website for farmers", or "How do I use my saved reading?"';
  }

  // ====== Helper: build crop recommendation text based on pH ======
  function cropsForPH(ph) {
    const suitable = [];
    const caution  = [];

    for (const cropName in cropPHRanges) {
      const range = cropPHRanges[cropName];
      if (ph >= range.min && ph <= range.max) {
        suitable.push(cropName);
      } else if (ph >= range.min - 0.5 && ph <= range.max + 0.5) {
        caution.push(cropName);
      }
    }

    let msg = `At pH ${ph.toFixed(2)}, water/soil is `;
    msg += genericPHStatus(ph) + '\n\n';

    if (suitable.length > 0) {
      msg += 'Crops that generally match this pH quite well include: ' +
             suitable.map(capitalize).join(', ') + '.\n';
    }
    if (caution.length > 0) {
      msg += 'These crops might still grow but may need extra care, amendments, or proper variety choice: ' +
             caution.map(capitalize).join(', ') + '.\n';
    }

    msg += 'Always also consider climate, soil type, and local variety recommendations from your agriculture department.';
    return msg;
  }

  function evaluateCropPH(cropName, ph) {
    const info = cropPHRanges[cropName];
    const rangeText = `For ${capitalize(cropName)}, a typical comfortable pH range is ${info.min} to ${info.max}.`;

    if (ph < info.min - 0.3) {
      return `${rangeText} Your pH ${ph.toFixed(2)} is more acidic than ideal. You may need liming or mixing less acidic water/soil. ${info.note}`;
    } else if (ph > info.max + 0.3) {
      return `${rangeText} Your pH ${ph.toFixed(2)} is more alkaline than ideal. Consider adding organic matter, gypsum in some soils, or mixing with better-quality water if available. ${info.note}`;
    } else {
      return `${rangeText} Your pH ${ph.toFixed(2)} is within or very close to the good range, so this crop should generally be comfortable if other conditions like climate and nutrients are okay. ${info.note}`;
    }
  }

  function genericPHStatus(ph) {
    if (ph < 5.0) return 'strongly acidic and risky for many common crops.';
    if (ph < 5.5) return 'acidic; some crops tolerate it but many will need correction towards 6.0–7.0.';
    if (ph < 6.0) return 'slightly acidic; good for many crops, especially those that like acidity.';
    if (ph < 7.5) return 'near neutral and friendly for most crops.';
    if (ph < 8.5) return 'slightly to moderately alkaline; some crops may struggle, especially those that like acidity.';
    return 'strongly alkaline; careful management and amendments are usually needed.';
  }

  function genericPHAdvice(ph) {
    const status = genericPHStatus(ph);
    let msg = `Your pH value of ${ph.toFixed(2)} is ${status}\n\n`;

    if (ph < 6.0) {
      msg += 'To raise pH (reduce acidity), common practices include applying agricultural lime, using compost and organic matter, and avoiding overuse of acidic fertilisers like ammonium sulphate. Always follow local soil test recommendations.\n';
    } else if (ph > 7.5) {
      msg += 'To reduce alkalinity, practices include adding large amounts of organic manure, using sulphur or gypsum in some soil types, improving drainage, and avoiding high-sodium irrigation water where possible.\n';
    } else {
      msg += 'This pH is already quite favorable for many crops. Focus on balanced fertiliser use, good irrigation practice, and protecting water from pollution so that this pH stays stable.\n';
    }

    msg += 'For more detailed advice, you can also check the Smart pH helper and crop advice sections on this Farmers Assistance page.';
    return msg;
  }

  function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  // ====== Text-to-speech ======
  function speakText(text) {
    if (!window.speechSynthesis) {
      console.log('Speech synthesis not supported in this browser.');
      return;
    }
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'en-IN';
    window.speechSynthesis.cancel();  // stop any previous speech
    window.speechSynthesis.speak(utter);
  }

  // ====== Sending query ======
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
  inputField.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') sendQuery();
  });

  // ====== Voice input (speech recognition) ======
  let recognition = null;
  try {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognition = new SpeechRecognition();
      recognition.lang = 'en-IN';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        inputField.value = transcript;
        sendQuery();
      };

      recognition.onerror = (event) => {
        console.log('Speech recognition error:', event.error);
      };
    } else {
      console.log('SpeechRecognition API not available in this browser.');
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
});
