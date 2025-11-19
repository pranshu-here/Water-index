// voice-assistant.js
// Bilingual (EN default, HI option) + local backend + voice

document.addEventListener('DOMContentLoaded', () => {
  const openBtn      = document.getElementById('open-assistant-btn');
  const box          = document.getElementById('assistant-chatbox');
  const header       = document.getElementById('assistant-header');
  const closeBtn     = document.getElementById('close-btn');
  const chatOutput   = document.getElementById('chat-output');
  const inputField   = document.getElementById('user-input');
  const sendBtn      = document.getElementById('send-btn');
  const voiceBtn     = document.getElementById('voice-btn');
  const stopVoiceBtn = document.getElementById('stop-voice-btn');
  const langSelect   = document.getElementById('assistant-lang');

  if (!openBtn || !box || !header || !chatOutput || !inputField || !sendBtn || !langSelect) {
    console.log('Farmers voice assistant: elements missing.');
    return;
  }

  // ---------- 1. Draggable box ----------
  (function makeDraggable() {
    let isDown = false, offsetX = 0, offsetY = 0;
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
      box.style.right = 'auto';
      box.style.bottom = 'auto';
    });
    document.addEventListener('mouseup', () => {
      isDown = false;
      document.body.style.userSelect = '';
    });
  })();

  // ---------- 2. Chat UI helpers ----------
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

  // ---------- 3. Call local backend ----------
  async function askLocalAI(question, langCode) {
    const fullQuestion = `LANG:${langCode.toUpperCase()} | ${question}`;
    try {
      const res = await fetch('http://localhost:8001/api/farmers-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: fullQuestion })
      });
      if (!res.ok) {
        return langCode === 'hi'
          ? `लोकल AI server में समस्या है (status ${res.status}).`
          : `Local AI server error (status ${res.status}).`;
      }
      const data = await res.json();
      return data.answer || (langCode === 'hi'
        ? 'Local AI ने कोई टेक्स्ट नहीं लौटाया।'
        : 'Local AI did not return any text.');
    } catch (err) {
      console.error('Error calling local AI:', err);
      return langCode === 'hi'
        ? 'Local AI backend नहीं मिल रहा है। कृपया देखें कि Python server और Ollama दोनों चालू हैं।'
        : 'Local AI backend could not be reached. Please check that the Python server and Ollama are both running.';
    }
  }

  // ---------- 4. Speech output ----------
  let hiVoice = null;
  let enVoice = null;

  function chooseVoices() {
    if (!window.speechSynthesis) return;
    const voices = window.speechSynthesis.getVoices();
    if (!voices.length) return;

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
    const lang = langSelect.value; // 'en' or 'hi'
    const u = new SpeechSynthesisUtterance(text);

    if (lang === 'hi' && hiVoice) {
      u.voice = hiVoice;
    } else if (enVoice) {
      u.voice = enVoice;
    } else {
      u.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
    }

    u.rate = 1.0;
    u.pitch = 1.0;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  }

  // ---------- 5. Send logic ----------
  async function sendQuery() {
    const q = inputField.value.trim();
    if (!q) return;

    const lang = langSelect.value; // 'en' or 'hi'
    addMessage(lang === 'hi' ? 'आप' : 'You', q);
    inputField.value = '';

    const reply = await askLocalAI(q, lang);
    addMessage('AI', reply);
    speak(reply);
  }

  sendBtn.onclick = sendQuery;
  inputField.addEventListener('keyup', e => {
    if (e.key === 'Enter') sendQuery();
  });

  // ---------- 6. Open / close / stop ----------
  openBtn.onclick = () => {
    box.style.display = 'block';
    if (!chatOutput.innerText.trim()) {
      const enWelcome =
        'Hi! I am the local AI assistant for your Water Health Index website. Ask about pH, crops, irrigation, fertiliser, or how to use the pages.';
      const hiWelcome =
        'नमस्ते किसान जी! यह स्थानीय AI आपकी Water Health Index वेबसाइट के लिये है। pH, फसल, सिंचाई और उर्वरक के बारे में पूछ सकते हैं।';
      const msg = langSelect.value === 'hi' ? hiWelcome : enWelcome;
      addMessage('AI', msg);
      speak(msg);
    }
  };

  closeBtn.onclick = () => {
    box.style.display = 'none';
    if (window.speechSynthesis) window.speechSynthesis.cancel();
  };

  if (stopVoiceBtn && window.speechSynthesis) {
    stopVoiceBtn.onclick = () => window.speechSynthesis.cancel();
  }

  // ---------- 7. Voice input (Hindi recognition) ----------
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
    console.log('Speech recognition init error:', err);
  }

  if (voiceBtn) {
    if (!recognition) {
      voiceBtn.disabled = true;
      voiceBtn.title = 'Browser does not support voice input';
    } else {
      voiceBtn.onclick = () => recognition.start();
    }
  }
});
