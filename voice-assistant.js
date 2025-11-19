// किसान हिंदी सहायक – Hindi voice assistant (rule‑based, draggable)
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

  if (!openBtn || !box || !sendBtn || !inputField || !output) {
    console.log('Hindi assistant: elements missing');
    return;
  }

  // ---------------- ड्रैग / drag behaviour ----------------
  (function makeDraggable() {
    let offsetX = 0, offsetY = 0, isDown = false;

    header.addEventListener('mousedown', (e) => {
      isDown = true;
      offsetX = e.clientX - box.offsetLeft;
      offsetY = e.clientY - box.offsetTop;
      document.body.style.userSelect = 'none';
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      let x = e.clientX - offsetX;
      let y = e.clientY - offsetY;
      // keep on screen
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

  // ---------------- crop + pH data ----------------
  const cropPH = {
    'धान (Rice)':   { min: 5.5, max: 7.0,  note: 'धान को हल्का अम्लीय से न्यूट्रल पानी पसंद है और खेत में पानी खड़ा रह सकता है।' },
    'गेहूं (Wheat)':{ min: 6.0, max: 7.5,  note: 'गेहूं को हल्का अम्लीय से न्यूट्रल pH और अच्छी जल‑निकासी वाली मिट्टी चाहिए।' },
    'मक्का (Maize)':{ min: 5.5, max: 7.5,  note: 'मक्का कई pH पर चल जाता है, लेकिन न्यूट्रल के आसपास बेहतर रहता है।' },
    'गन्ना (Sugarcane)':{ min: 6.0, max: 7.5, note: 'गन्ने को नम मिट्टी और हल्का अम्लीय से न्यूट्रल pH पसंद है।' },
    'कपास (Cotton)':{ min: 5.8, max: 7.5,  note: 'कपास को गर्म मौसम और हल्का अम्लीय से न्यूट्रल pH अच्छा लगता है।' },
    'सोयाबीन (Soybean)':{ min: 6.0, max: 7.5, note: 'सोयाबीन नाइट्रोजन बनाती है, न्यूट्रल pH के पास अच्छा प्रदर्शन देती है।' },
    'सरसों (Mustard)':{ min: 5.5, max: 7.5, note: 'सरसों हल्का अम्लीय और न्यूट्रल दोनों मिट्टी में चल जाती है।' },
    'टमाटर (Tomato)':{ min: 6.0, max: 7.0, note: 'टमाटर को हल्का अम्लीय मिट्टी और बिल्कुल भी जलभराव पसंद नहीं।' },
    'मिर्च (Chilli)':{ min: 6.0, max: 7.0, note: 'मिर्च को गर्म मौसम और हल्का अम्लीय जमीन, अच्छी निकासी के साथ चाहिए।' },
    'केला (Banana)': { min: 5.5, max: 7.0, note: 'केले को भरपूर नमी और हल्का अम्लीय से न्यूट्रल pH वाली मिट्टी चाहिए।' },
    'आम (Mango)':    { min: 5.5, max: 7.5, note: 'आम का पेड़ pH की बड़ी रेंज सह लेता है, लेकिन न्यूट्रल के पास ज्यादा अच्छा बढ़ता है।' },
    'दालें (Pulses)':{ min: 6.0, max: 7.5, note: 'चने, मसूर, अरहर जैसी दालों को हल्का अम्लीय से न्यूट्रल pH अच्छा लगता है।' }
  };

  const cropKeywords = {
    'धान': 'धान (Rice)', 'paddy': 'धान (Rice)', 'rice': 'धान (Rice)',
    'गेहूं': 'गेहूं (Wheat)', 'wheat': 'गेहूं (Wheat)',
    'मक्का': 'मक्का (Maize)', 'corn': 'मक्का (Maize)', 'maize': 'मक्का (Maize)',
    'गन्ना': 'गन्ना (Sugarcane)', 'sugarcane':'गन्ना (Sugarcane)',
    'कपास': 'कपास (Cotton)', 'cotton':'कपास (Cotton)',
    'सोयाबीन':'सोयाबीन (Soybean)', 'soybean':'सोयाबीन (Soybean)',
    'सरसों':'सरसों (Mustard)', 'mustard':'सरसों (Mustard)',
    'टमाटर':'टमाटर (Tomato)', 'tomato':'टमाटर (Tomato)',
    'मिर्च':'मिर्च (Chilli)', 'chilli':'मिर्च (Chilli)', 'chili':'मिर्च (Chilli)',
    'केला':'केला (Banana)', 'banana':'केला (Banana)',
    'आम':'आम (Mango)', 'mango':'आम (Mango)',
    'दाल':'दालें (Pulses)', 'दालें':'दालें (Pulses)', 'pulses':'दालें (Pulses)'
  };

  // --------------- helpers ---------------

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

  function phStatusHindi(ph) {
    if (ph < 5.0) return 'काफी ज़्यादा अम्लीय है, ज़्यादातर फसलों के लिये जोखिम भरा स्तर है।';
    if (ph < 5.5) return 'अम्लीय है, कुछ फसलें चल जाएँगी पर ज़्यादातर को सुधार की ज़रूरत होगी।';
    if (ph < 6.0) return 'हल्का अम्लीय है, कई फसलें आराम से चल सकती हैं।';
    if (ph < 7.5) return 'लगभग न्यूट्रल है, ज़्यादातर सामान्य फसलों के लिये अच्छा स्तर है।';
    if (ph < 8.5) return 'हल्का क्षारीय है, कुछ फसलें दिक्कत में पड़ सकती हैं।';
    return 'काफी ज़्यादा क्षारीय है, प्रबंधन और सुधार बहुत ज़रूरी है।';
  }

  function findCrop(text) {
    for (const key in cropKeywords) {
      if (text.includes(key)) return cropKeywords[key];
    }
    return null;
  }

  // --------------- Hindi logic ---------------

  function websiteAnswer() {
    return 'यह Water Health Index वेबसाइट आपको पानी की सेहत जाँचने, उसका स्कोर देखने और खेती से जोड़ने में मदद करती है। "Measure" में आप टेस्ट का डाटा भरते हैं, "Map" पर जगह दिखती है, "Farmers Assistance" में pH और फसल के आधार पर सलाह मिलती है, "Care" में पानी बचाने और गंदगी रोकने की बातें हैं, "Chart" में आपके रीडिंग के ग्राफ हैं और "Details" में पूरा विज्ञान समझाया गया है।';
  }

  function irrigationAnswer() {
    return 'सिंचाई सलाह: सुबह जल्दी या शाम को पानी दें ताकि पानी कम वाष्पित हो। खेत में लगातार पानी खड़ा न रहने दें, जड़ों को हवा भी चाहिए। रेतीली मिट्टी में थोड़ी‑थोड़ी बार‑बार सिंचाई करें, चिकनी मिट्टी में कम बार लेकिन गहरी सिंचाई करें। फसल की अवस्था के हिसाब से सिंचाई बदलें—अंकुरण और फूल आते समय पानी की कमी बहुत नुकसान करती है।';
  }

  function fertiliserAnswer() {
    return 'उर्वरक सलाह: कोशिश करें कि मिट्टी की जाँच रिपोर्ट के हिसाब से NPK दें। सिर्फ यूरिया पर निर्भर न रहें, संतुलित NPK और जैविक खाद दोनों इस्तेमाल करें। नाइट्रोजन को दो‑तीन किस्तों में बाँटकर दें। गोबर, कम्पोस्ट जैसी जैविक खाद मिट्टी की सेहत और pH दोनों को बेहतर बनाती है। उर्वरक और रसायन कुएँ, नदी, तालाब के पास न डालें ताकि पानी की सेहत खराब न हो।';
  }

  function savedReadingAnswer() {
    return 'सबसे पहले Measure पेज पर जाकर अपने पानी की जाँच के वैल्यू भरें और रीडिंग सेव करें। फिर Farmers Assistance पेज पर आइये, वही pH वैल्यू Smart pH helper में डालिये और दायीं तरफ फसल चुनकर देखिये कि यह pH उस फसल के लिये कितना सही है और क्या‑क्या सावधानी रखनी है।';
  }

  function phAdvice(ph) {
    let msg = `आपका pH ${ph.toFixed(2)} है, जो कि ${phStatusHindi(ph)}\n\n`;
    if (ph < 6.0) {
      msg += 'इसे थोड़ा बढ़ाने (कम अम्लीय करने) के लिये आप मिट्टी की जाँच के अनुसार चुना (lime) डाल सकते हैं, साथ में भरपूर कम्पोस्ट या गोबर खाद मिलाएँ और बहुत ज़्यादा अम्लीय उर्वरकों का इस्तेमाल कम करें।\n';
    } else if (ph > 7.5) {
      msg += 'इसे कम क्षारीय करने के लिये जैविक खाद ज़्यादा डालें, अच्छी निकासी रखें और जहाँ उपयुक्त हो वहाँ जिप्सम या सल्फर का प्रयोग करें। बहुत क्षारीय या खारे पानी से सिंचाई न करें।\n';
    } else {
      msg += 'यह pH पहले से ही कई फसलों के लिये अच्छा है, बस संतुलित उर्वरक और सही सिंचाई पर ध्यान रखें और पानी को गंदा होने से बचाएँ।\n';
    }
    return msg;
  }

  function cropsForPH(ph) {
    const good = [];
    for (const name in cropPH) {
      const r = cropPH[name];
      if (ph >= r.min && ph <= r.max) good.push(name);
    }
    if (!good.length) {
      return `pH ${ph.toFixed(2)} पर आम फसलों के लिये स्थिति मुश्किल है, पहले pH सुधार करना बेहतर रहेगा।`;
    }
    return `pH ${ph.toFixed(2)} (${phStatusHindi(ph)})\nइस स्तर पर सामान्यतः ये फसलें ठीक रहती हैं: ${good.join(', ')}।\nफिर भी जलवायु, मिट्टी की बनावट और स्थानीय सिफ़ारिश ज़रूर देखें।`;
  }

  function cropWithPHAnswer(cropName, ph) {
    const r = cropPH[cropName];
    if (!r) return `${cropName} के लिये मेरे पास अभी पूरी जानकारी नहीं है।`;
    let msg = `${cropName} के लिये सामान्य pH ${r.min} से ${r.max} के बीच अच्छा माना जाता है। ${r.note} `;
    if (ph < r.min - 0.3) {
      msg += `आपका pH ${ph.toFixed(2)} इससे कम (ज़्यादा अम्लीय) है, इसलिए उपज थोड़ी कम हो सकती है, pH सुधार की ज़रूरत पड़ेगी।`;
    } else if (ph > r.max + 0.3) {
      msg += `आपका pH ${ph.toFixed(2)} इससे ज़्यादा (ज़्यादा क्षारीय) है, इसलिए पोषक तत्वों की दिक्कत आ सकती है, मिट्टी सुधार पर ध्यान दें।`;
    } else {
      msg += `आपका pH ${ph.toFixed(2)} इस फसल के आरामदायक दायरे के क़रीब है, अगर बाकी हालत सही हों तो फसल ठीक रहनी चाहिए।`;
    }
    return msg;
  }

  function getHindiResponse(textRaw) {
    const t = textRaw.toLowerCase();

    if (t.includes('website') || t.includes('वेबसाइट') || t.includes('water health index')) {
      return websiteAnswer();
    }

    if (t.includes('सिंचाई') || t.includes('पानी देना') || t.includes('irrigation')) {
      return irrigationAnswer();
    }

    if (t.includes('उर्वरक') || t.includes('fertiliser') || t.includes('fertilizer') || t.includes('खाद')) {
      return fertiliserAnswer();
    }

    if (t.includes('saved reading') || t.includes('रीडिंग') || t.includes('measure')) {
      return savedReadingAnswer();
    }

    const ph = extractPH(t);
    const cropName = findCrop(t);

    if (cropName && ph !== null) {
      return cropWithPHAnswer(cropName, ph);
    }

    if (ph !== null && (t.includes('कौन सी फसल') || t.includes('कौनसा फसल') || t.includes('which crop') || t.includes('best crop'))) {
      return cropsForPH(ph);
    }

    if (t.includes('ph') || t.includes('पीएच') || t.includes('ph ')) {
      if (ph !== null) return phAdvice(ph);
      return 'pH यह बताता है कि पानी या मिट्टी कितनी अम्लीय (खट्टी) या क्षारीय (खारी) है। 7 न्यूट्रल, 7 से कम अम्लीय और 7 से ज़्यादा क्षारीय। ज़्यादातर फसलें 6 से 7.5 के बीच अच्छा महसूस करती हैं। आप पूछ सकते हैं, "pH 6.5 पर कौन सी फसलें अच्छी हैं?"';
    }

    if (t.includes('मदद') || t.includes('help')) {
      return 'आप मुझसे यह पूछ सकते हैं: "यह वेबसाइट क्या करती है?", "pH 6.5 पर कौन सी फसलें अच्छी हैं?", "धान pH 7.8 पर कैसा रहेगा?", "सिंचाई के लिये क्या टिप्स हैं?", "उर्वरक कैसे डालें?" वगैरह।';
    }

    return 'मैं अभी इस वेबसाइट, pH, फसल की पसंद, सिंचाई और उर्वरक जैसी बातों पर हिंदी में सलाह दे सकता हूँ। कोई pH और फसल के साथ सवाल पूछिए, जैसे "pH 6.5 पर कौन सी फसलें अच्छी हैं?" या "क्या गेहूं pH 5.5 पर ठीक है?"';
  }

  // --------------- Speech (Hindi) ---------------
  let preferredVoice = null;

  function chooseVoice() {
    if (!window.speechSynthesis) return;
    const voices = window.speechSynthesis.getVoices();
    if (!voices || !voices.length) return;

    // Try to pick Hindi voice
    preferredVoice = voices.find(v => v.lang === 'hi-IN') ||
                     voices.find(v => v.lang.startsWith('hi')) ||
                     voices.find(v => v.lang.startsWith('en-IN')) ||
                     voices[0];
  }

  if (window.speechSynthesis) {
    window.speechSynthesis.onvoiceschanged = chooseVoice;
    chooseVoice();
  }

  function speak(text) {
    if (!window.speechSynthesis) return;
    const u = new SpeechSynthesisUtterance(text);
    if (preferredVoice) u.voice = preferredVoice;
    else u.lang = 'hi-IN';
    u.rate = 1.0;
    u.pitch = 1.0;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  }

  // --------------- Send / events ---------------
  function sendQuery() {
    const q = inputField.value.trim();
    if (!q) return;
    addMessage('आप', q);
    inputField.value = '';
    const ans = getHindiResponse(q);
    addMessage('AI', ans);
    speak(ans);
  }

  sendBtn.onclick = sendQuery;
  inputField.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') sendQuery();
  });

  openBtn.onclick = () => {
    box.style.display = 'block';
    if (!output.innerText.trim()) {
      const welcome = 'नमस्ते किसान जी! मैं आपका हिंदी किसान सहायक हूँ। pH, फसल, सिंचाई, उर्वरक और इस वेबसाइट के बारे में सवाल पूछ सकते हैं।';
      addMessage('AI', welcome);
      speak(welcome);
    }
  };

  closeBtn.onclick = () => {
    box.style.display = 'none';
    if (window.speechSynthesis) window.speechSynthesis.cancel();
  };

  if (stopVoiceBtn && window.speechSynthesis) {
    stopVoiceBtn.onclick = () => {
      window.speechSynthesis.cancel();
    };
  }

  // --------------- Hindi speech input ---------------
  let recognition = null;
  try {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) {
      recognition = new SR();
      recognition.lang = 'hi-IN';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onresult = (e) => {
        const text = e.results[0][0].transcript;
        inputField.value = text;
        sendQuery();
      };
    }
  } catch (err) {
    console.log('Speech recognition init error', err);
  }

  if (voiceBtn) {
    if (!recognition) {
      voiceBtn.disabled = true;
      voiceBtn.title = 'यह ब्राउज़र हिंदी वॉइस इनपुट सपोर्ट नहीं करता';
    } else {
      voiceBtn.onclick = () => recognition.start();
    }
  }
});
