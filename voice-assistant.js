// voice-assistant.js – EN default, toggle to HI

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
    console.log('Voice assistant: elements missing.');
    return;
  }

  // ---------- Draggable ----------
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

  // ---------- Chat helpers ----------
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

  // ---------- Backend call ----------
  async function askLocalAI(question, langCode) {
    // add a small language hint that backend can read if needed
    const fullQuestion = `LANG:${langCode.toUpperCase()} | ${question}`;
    try {
      const res = await fetch('http://localhost:8000/api/farmers-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: fullQuestion })
      });
      if (!res.ok) {
        return `Local AI server error (status ${res.status}).`;
      }
      const data = await res.json();
      return data.answer || 'Local AI did not return any text.';
    } catch (err) {
      console.error('Error calling local AI:', err);
      return 'Could not reach local AI backend. Make sure Python server and Ollama are running.';
    }
  }

  // ---------- Speech ----------
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
    const lang = langSelect.value;  // 'en' or 'hi'
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

  // ---------- Send ----------
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

  // ---------- Open / close ----------
  openBtn.onclick = () => {
    box.style.display = 'block';
    if (!chatOutput.innerText.trim()) {
      const enWelcome = 'Hi! I am the local AI assistant for your Water Health Index website. Ask about pH, crops, irrigation, fertiliser, or how to use the pages.';
      const hiWelcome = 'नमस्ते किसान जी! यह स्थानीय AI आपकी Water Health Index वेबसाइट के लिये है। pH, फसल, सिंचाई और उर्वरक के बारे में पूछ सकते हैं।';
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

  // ---------- Voice input (use last selected lang, but recognition hi-IN only) ----------
  let recognition = null;
  try {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) {
      recognition = new SR();
      recognition.lang = 'hi-IN';        // better for Hindi; still works for Hinglish
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
