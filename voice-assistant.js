// Bilingual Farmers Assistant (Hindi + English) with draggable box and Hindi‑preferred voice
document.addEventListener('DOMContentLoaded', () => {
  const openBtn      = document.getElementById('open-assistant-btn');
  const box          = document.getElementById('assistant-chatbox');
  const header       = document.getElementById('assistant-header');
  const sendBtn      = document.getElementById('send-btn');
  const inputField   = document.getElementById('user-input');
  const output       = document.getElementById('chat-output');
  const voiceBtn     = document.getElementById('voice-btn');
  const stopVoiceBtn = document.getElementById('stop-voice-btn');
  const closeBtn     = document.getElementById('close-btn');
  const langSelect   = document.getElementById('assistant-lang');

  if (!openBtn || !box || !header || !sendBtn || !inputField || !output || !langSelect) {
    console.log('Assistant: elements missing');
    return;
  }

  // ---------------- Drag behaviour ----------------
  (function makeDraggable() {
    let offsetX = 0, offsetY = 0, isDown = false;
    header.addEventListener('mousedown', e => {
      isDown = true;
      offsetX = e.clientX - box.offsetLeft;
      offsetY = e.clientY - box.offsetTop;
      document.body.style.userSelect = 'none';
    });
    document.addEventListener('mousemove', e => {
      if (!isDown) return;
      let x = e.clientX - offsetX;
      let y = e.clientY - offsetY;
      const maxX = window.innerWidth - box.offsetWidth;
      const maxY = window.innerHeight - box.offsetHeight;
      x = Math.max(0, Math.min(maxX, x));
      y = Math.max(0, Math.min(maxY, y));
      box.style.left = x + 'px';
      box.style.top  = y + 'px';
      box.style.bottom = 'auto';
      box.style.right  = 'auto';
    });
    document.addEventListener('mouseup', () => {
      isDown = false;
      document.body.style.userSelect = '';
    });
  })();

  // ---------------- Common utilities ----------------
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
    output.appendChild(row);
    output.scrollTop = output.scrollHeight;
  }

  function extractPH(text) {
    const m = text.match(/(\d+(\.\d+)?)/);
    if (!m) return null;
    const v = parseFloat(m[1]);
    if (isNaN(v) || v < 0 || v > 14) return null;
    return v;
  }

  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  // ---------------- Data: crops & pH ----------------
  const crops = {
    rice:      { hi:'धान',      en:'rice',      min:5.5, max:7.0 },
    wheat:     { hi:'गेहूं',    en:'wheat',     min:6.0, max:7.5 },
    maize:     { hi:'मक्का',    en:'maize',     min:5.5, max:7.5 },
    sugarcane: { hi:'गन्ना',    en:'sugarcane', min:6.0, max:7.5 },
    cotton:    { hi:'कपास',     en:'cotton',    min:5.8, max:7.5 },
    soybean:   { hi:'सोयाबीन',  en:'soybean',   min:6.0, max:7.5 },
    mustard:   { hi:'सरसों',    en:'mustard',   min:5.5, max:7.5 },
    tomato:    { hi:'टमाटर',    en:'tomato',    min:6.0, max:7.0 },
    chilli:    { hi:'मिर्च',    en:'chilli',    min:6.0, max:7.0 },
    banana:    { hi:'केला',     en:'banana',    min:5.5, max:7.0 },
    mango:     { hi:'आम',       en:'mango',     min:5.5, max:7.5 },
    pulses:    { hi:'दालें',    en:'pulses',    min:6.0, max:7.5 }
  };

  const cropKeywords = {};
  Object.keys(crops).forEach(key => {
    const c = crops[key];
    cropKeywords[c.hi] = key;
    cropKeywords[c.en] = key;
  });
  cropKeywords['paddy'] = 'rice';
  cropKeywords['corn']  = 'maize';

  function findCrop(text) {
    const t = text.toLowerCase();
    for (const word in cropKeywords) {
      if (t.includes(word.toLowerCase())) return cropKeywords[word];
    }
    return null;
  }

  // ---------------- Hindi logic ----------------
  function phStatusHi(ph) {
    if (ph < 5.0) return 'बहुत अम्लीय (ज़्यादा खट्टा) है, ज़्यादातर फसलों के लिये जोखिम भरा स्तर।';
    if (ph < 5.5) return 'अम्लीय है, कुछ फसलें चल जाएँगी पर कई को दिक्कत हो सकती है।';
    if (ph < 6.0) return 'हल्का अम्लीय है, कई फसलें आराम से चल सकती हैं।';
    if (ph < 7.5) return 'लगभग न्यूट्रल है, ज़्यादातर आम फसलों के लिये अच्छा स्तर।';
    if (ph < 8.5) return 'हल्का क्षारीय है, कुछ फसलें कमजोर पड़ सकती हैं।';
    return 'बहुत ज़्यादा क्षारीय है, मिट्टी सुधार ज़रूरी है।';
  }

  function phAdviceHi(ph) {
    let msg = `आपका pH ${ph.toFixed(2)} है, जो कि ${phStatusHi(ph)}\n\n`;
    if (ph < 6.0) {
      msg += 'इसे बढ़ाने (कम अम्लीय करने) के लिये मिट्टी की जाँच के अनुसार चुना (lime) डालें, भरपूर जैविक खाद मिलाएँ और बहुत अम्लीय उर्वरकों को कम करें।\n';
    } else if (ph > 7.5) {
      msg += 'इसे कम क्षारीय करने के लिये जैविक खाद बढ़ाएँ, अच्छी निकासी रखें और जहाँ उपयुक्त हो वहाँ जिप्सम / सल्फर का उपयोग करें।\n';
    } else {
      msg += 'यह pH पहले से ही अच्छी रेंज में है, बस संतुलित उर्वरक, सही सिंचाई और पानी की सुरक्षा पर ध्यान रखें।\n';
    }
    return msg;
  }

  function cropsForPHHi(ph) {
    const good = [];
    for (const key in crops) {
      const c = crops[key];
      if (ph >= c.min && ph <= c.max) good.push(c.hi);
    }
    if (!good.length) return `pH ${ph.toFixed(2)} पर सामान्य फसलों के लिये स्थिति मुश्किल है, पहले pH सुधार करना बेहतर होगा।`;
    return `pH ${ph.toFixed(2)} (${phStatusHi(ph)})\nइस स्तर पर ये फसलें सामान्यतः ठीक रहती हैं: ${good.join(', ')}।`;
  }

  function cropPHHi(key, ph) {
    const c = crops[key];
    let msg = `${c.hi} के लिये सामान्य pH लगभग ${c.min} से ${c.max} अच्छा रहता है। `;
    if (ph < c.min - 0.3) msg += `आपका pH ${ph.toFixed(2)} इससे कम है, यानी मिट्टी ज़्यादा अम्लीय है, उपज कम हो सकती है।`;
    else if (ph > c.max + 0.3) msg += `आपका pH ${ph.toFixed(2)} इससे ऊपर है, यानी मिट्टी ज़्यादा क्षारीय है, पोषक तत्वों की दिक्कत आ सकती है।`;
    else msg += `आपका pH ${ph.toFixed(2)} इसी रेंज के क़रीब है, अगर बाकी चीज़ें ठीक हों तो फसल अच्छा प्रदर्शन कर सकती है।`;
    return msg;
  }

  function websiteHi() {
    return 'यह Water Health Index वेबसाइट पानी की सेहत (क्वालिटी) दिखाती है, स्कोर देती है और उसे खेती से जोड़ती है। "Measure" में टेस्ट डाटा भरते हैं, "Map" पर जगह देख सकते हैं, "Farmers Assistance" में pH और फसल के आधार पर सलाह मिलती है, "Care" में पानी बचाने और गंदगी रोकने की टिप्स हैं, "Chart" में आपके रीडिंग के ग्राफ और "Details" में पूरा विज्ञान लिखा है।';
  }

  function irrigationHi() {
    return 'सिंचाई सलाह: सुबह जल्दी या शाम को पानी दें, दोपहर की तेज धूप में नहीं। खेत में लगातार पानी खड़ा न रहने दें। रेतीली मिट्टी में थोड़ी‑थोड़ी बार‑बार सिंचाई, चिकनी मिट्टी में कम बार लेकिन गहराई से सिंचाई करें। फसल के अंकुरण और फूल आने के समय पानी की कमी बिलकुल न होने दें।';
  }

  function fertiliserHi() {
    return 'उर्वरक सलाह: मिट्टी की जाँच रिपोर्ट के हिसाब से NPK दें, सिर्फ यूरिया पर निर्भर न रहें। नाइट्रोजन को 2‑3 किस्तों में दें, साथ में गोबर खाद / कम्पोस्ट मिलाएँ। उर्वरक और कीटनाशक का बहाव कुएँ, तालाब, नहर जैसी जगहों में न जाने दें ताकि पानी की सेहत खराब न हो।';
  }

  function savedHi() {
    return 'Measure पेज पर पानी के टेस्ट वैल्यू भरकर रीडिंग सेव करें। फिर Farmers Assistance पेज पर वही pH Smart pH helper में डालें और दायीं तरफ फसल चुनकर देखें कि वह pH उस फसल के लिये कितना सही है।';
  }

  function replyHi(q) {
    const t = q.toLowerCase();
    const ph = extractPH(t);
    const cropKey = findCrop(t);

    if (t.includes('वेबसाइट') || t.includes('website') || t.includes('water health index')) return websiteHi();
    if (t.includes('सिंचाई') || t.includes('irrigation') || t.includes('पानी देना')) return irrigationHi();
    if (t.includes('उर्वरक') || t.includes('fertiliser') || t.includes('fertilizer') || t.includes('खाद')) return fertiliserHi();
    if (t.includes('रीडिंग') || t.includes('saved reading') || t.includes('measure')) return savedHi();

    if (cropKey && ph !== null) return cropPHHi(cropKey, ph);
    if (ph !== null && (t.includes('कौन') || t.includes('which crop') || t.includes('best crop')))
      return cropsForPHHi(ph);

    if (t.includes('ph') || t.includes('पीएच')) {
      if (ph !== null) return phAdviceHi(ph);
      return 'pH यह दिखाता है कि पानी या मिट्टी कितनी अम्लीय (खट्टी) या क्षारीय (खारी) है। 7 न्यूट्रल, 7 से कम अम्लीय और 7 से ज़्यादा क्षारीय। ज़्यादातर फसलें 6 से 7.5 के बीच अच्छा महसूस करती हैं।';
    }

    if (t.includes('मदद') || t.includes('help'))
      return 'आप पूछ सकते हैं: "यह वेबसाइट क्या करती है?", "pH 6.5 पर कौन सी फसलें अच्छी हैं?", "क्या धान pH 7.8 पर ठीक है?", "सिंचाई के लिये क्या टिप्स हैं?", "उर्वरक कैसे डालें?" वगैरह।';

    return 'मैं इस वेबसाइट, pH, फसलों की पसंद, सिंचाई और उर्वरक जैसी बातों पर हिंदी में सलाह दे सकता हूँ। कोई pH और फसल के साथ सवाल पूछिए, जैसे "pH 6.5 पर कौन सी फसलें अच्छी हैं?" या "क्या गेहूं pH 5.5 पर ठीक है?"';
  }

  // ---------------- English logic ----------------
  function phStatusEn(ph) {
    if (ph < 5.0) return 'strongly acidic and risky for many crops.';
    if (ph < 5.5) return 'acidic; some crops grow but many prefer higher pH.';
    if (ph < 6.0) return 'slightly acidic and okay for acid‑loving crops.';
    if (ph < 7.5) return 'near neutral and friendly for most common crops.';
    if (ph < 8.5) return 'slightly alkaline; some crops may struggle.';
    return 'strongly alkaline; careful management is needed.';
  }

  function phAdviceEn(ph) {
    let msg = `Your pH ${ph.toFixed(2)} is ${phStatusEn(ph)}\n\n`;
    if (ph < 6.0) msg += 'To reduce acidity, apply lime as per soil test and add organic manure; avoid very acidic fertilisers.\n';
    else if (ph > 7.5) msg += 'To reduce alkalinity, add lots of organic matter, improve drainage and use gypsum/sulphur where suitable.\n';
    else msg += 'This pH is already good for many crops; focus on balanced fertiliser and proper irrigation.\n';
    return msg;
  }

  function cropsForPHEn(ph) {
    const good = [];
    for (const key in crops) {
      const c = crops[key];
      if (ph >= c.min && ph <= c.max) good.push(c.en);
    }
    if (!good.length) return `At pH ${ph.toFixed(2)}, very few common crops are comfortable; improve pH towards 6.0–7.5 first.`;
    return `At pH ${ph.toFixed(2)} (${phStatusEn(ph)}) good matching crops include: ${good.map(cap).join(', ')}.`;
  }

  function cropPHEn(key, ph) {
    const c = crops[key];
    let msg = `${cap(c.en)} usually prefers pH about ${c.min}–${c.max}. `;
    if (ph < c.min - 0.3) msg += `Your pH ${ph.toFixed(2)} is more acidic than this range; yield may reduce unless acidity is corrected.`;
    else if (ph > c.max + 0.3) msg += `Your pH ${ph.toFixed(2)} is more alkaline than this range; nutrient problems may appear.`;
    else msg += `Your pH ${ph.toFixed(2)} is inside or near the good range, so this crop is generally suitable.`;
    return msg;
  }

  function websiteEn() {
    return 'This Water Health Index website lets you test water, see a simple health score, and connect it with farming. Measure is for entering test values, Map shows where samples were taken, Farmers Assistance gives pH‑based crop advice, Care explains how to protect water, Chart shows graphs, and Details explains the science.';
  }

  function irrigationEn() {
    return 'Irrigation tips: water early morning or evening, avoid waterlogging, match frequency to soil type (sandy = more often, clay = less often but deeper), and never let seedlings or flowering crops suffer from water stress.';
  }

  function fertiliserEn() {
    return 'Fertiliser basics: follow soil test, use balanced NPK instead of only urea, split nitrogen into 2–3 doses, add organic manure, and keep fertilisers away from wells and rivers to protect water quality.';
  }

  function savedEn() {
    return 'On the Measure page, enter and save your water reading. Then on Farmers Assistance, type that pH in the Smart pH helper and choose crops on the right to see how well they match.';
  }

  function replyEn(q) {
    const t = q.toLowerCase();
    const ph = extractPH(t);
    const cropKey = findCrop(t);

    if (t.includes('website') || t.includes('water health index')) return websiteEn();
    if (t.includes('irrigation') || t.includes('watering')) return irrigationEn();
    if (t.includes('fertiliser') || t.includes('fertilizer') || t.includes('npk') || t.includes('manure')) return fertiliserEn();
    if (t.includes('saved reading') || t.includes('measure page')) return savedEn();

    if (cropKey && ph !== null) return cropPHEn(cropKey, ph);
    if (ph !== null && (t.includes('which crop') || t.includes('best crop')))
      return cropsForPHEn(ph);

    if (t.includes('ph')) {
      if (ph !== null) return phAdviceEn(ph);
      return 'pH shows if water or soil is acidic or alkaline. 7 is neutral, lower is acidic, higher is alkaline. Most crops prefer around 6.0–7.5.';
    }

    if (t.includes('help')) return 'You can ask: "Explain this website", "Which crops are good at pH 6.5?", "Is rice ok at pH 7.5?", "Give irrigation tips", or "Fertiliser basics".';

    return 'I answer questions about this website, pH, crop suitability, irrigation and fertiliser. Try: "Which crops are good at pH 6.5?" or "Is wheat okay at pH 5.5?".';
  }

  // ---------------- Speech (voices) ----------------
  let hiVoice = null;
  let enVoice = null;

  function chooseVoices() {
    if (!window.speechSynthesis) return;
    const voices = window.speechSynthesis.getVoices();
    if (!voices || !voices.length) return;

    hiVoice = voices.find(v => v.lang === 'hi-IN') ||
              voices.find(v => v.lang.startsWith('hi')) ||
              voices.find(v => v.lang === 'en-IN') || null;

    enVoice = voices.find(v => v.lang === 'en-IN') ||
              voices.find(v => v.lang === 'en-GB') ||
              voices.find(v => v.lang === 'en-US') ||
              voices.find(v => v.lang.startsWith('en')) || null;
  }

  if (window.speechSynthesis) {
    window.speechSynthesis.onvoiceschanged = chooseVoices;
    chooseVoices();
  }

  function speak(text) {
    if (!window.speechSynthesis) return;
    const lang = langSelect.value; // 'hi' or 'en'
    const u = new SpeechSynthesisUtterance(text);

    if (lang === 'hi' && hiVoice) {
      u.voice = hiVoice;
    } else if (lang === 'en' && enVoice) {
      u.voice = enVoice;
    } else {
      u.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
    }

    u.rate = 1.0;
    u.pitch = 1.0;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  }

  // ---------------- Sending & events ----------------
  function generateReply(q) {
    return langSelect.value === 'hi' ? replyHi(q) : replyEn(q);
  }

  function sendQuery() {
    const q = inputField.value.trim();
    if (!q) return;
    addMessage(langSelect.value === 'hi' ? 'आप' : 'You', q);
    inputField.value = '';
    const ans = generateReply(q);
    addMessage('AI', ans);
    speak(ans);
  }

  sendBtn.onclick = sendQuery;
  inputField.addEventListener('keyup', e => { if (e.key === 'Enter') sendQuery(); });

  openBtn.onclick = () => {
    box.style.display = 'block';
    if (!output.innerText.trim()) {
      const hiWelcome = 'नमस्ते किसान जी! मैं आपका किसान सहायक हूँ। pH, फसल, सिंचाई, उर्वरक और इस वेबसाइट के बारे में सवाल पूछ सकते हैं।';
      const enWelcome = 'Namaste farmer! I am your assistant for this website. You can ask about pH, crops, irrigation, fertiliser and how to use the site.';
      const start = langSelect.value === 'hi' ? hiWelcome : enWelcome;
      addMessage('AI', start);
      speak(start);
    }
  };

  closeBtn.onclick = () => {
    box.style.display = 'none';
    if (window.speechSynthesis) window.speechSynthesis.cancel();
  };

  if (stopVoiceBtn && window.speechSynthesis) {
    stopVoiceBtn.onclick = () => window.speechSynthesis.cancel();
  }

  // ------------- Voice input (Hindi only) -------------
  let recognition = null;
  try {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) {
      recognition = new SR();
      recognition.lang = 'hi-IN';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.onresult = e => {
        const text = e.results[0][0].transcript;
        inputField.value = text;
        sendQuery();
      };
    }
  } catch (err) {
    console.log('Speech recog error', err);
  }

  if (voiceBtn) {
    if (!recognition) {
      voiceBtn.disabled = true;
      voiceBtn.title = 'Browser does not support Hindi voice input';
    } else {
      voiceBtn.onclick = () => recognition.start();
    }
  }
});
