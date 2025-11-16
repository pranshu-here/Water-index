// voice-assistant.js
document.addEventListener('DOMContentLoaded', () => {

  const openBtn    = document.getElementById('open-assistant-btn');
  const chatbox    = document.getElementById('assistant-chatbox');
  const sendBtn    = document.getElementById('send-btn');
  const inputField = document.getElementById('user-input');
  const chatOutput = document.getElementById('chat-output');
  const voiceBtn   = document.getElementById('voice-btn');
  const closeBtn   = document.getElementById('close-btn');

  if (!openBtn || !chatbox) return;   // if not on this page, do nothing

  // open / close
  openBtn.onclick  = () => { chatbox.style.display = 'block'; };
  closeBtn.onclick = () => { chatbox.style.display = 'none'; };

  function addMessage(sender, message) {
    const msgDiv = document.createElement('div');
    msgDiv.style.margin = '6px 0';
    msgDiv.textContent = sender + ': ' + message;
    msgDiv.style.whiteSpace = 'pre-wrap';
    if (sender === 'AI') msgDiv.style.color = '#55ebca';
    else msgDiv.style.color = '#e3fbfa';
    chatOutput.appendChild(msgDiv);
    chatOutput.scrollTop = chatOutput.scrollHeight;
  }

  // Simple offline rule-based replies for now
  function getAIResponse(userText) {
    const text = userText.toLowerCase();

    if (text.includes('ph') && text.includes('rice')) {
      return 'Rice usually prefers slightly acidic to neutral pH (about 5.5–7.0). Avoid very alkaline water.';
    } else if (text.includes('ph') && text.includes('wheat')) {
      return 'Wheat grows well around pH 6.0–7.5. Too acidic water or soil can reduce yield.';
    } else if (text.includes('irrigation')) {
      return 'Irrigate in early morning or late evening, avoid waterlogging, and adjust frequency to soil type.';
    } else if (text.includes('fertilizer') || text.includes('fertiliser')) {
      return 'Use balanced NPK based on soil testing. Avoid overusing urea; split doses and add organic manure.';
    } else if (text.includes('help')) {
      return 'You can ask about pH, crop choice, irrigation tips, and fertiliser basics. For example: "Which crop is good at pH 6.5?"';
    }

    return 'Right now I can answer basic questions about pH, crop choice, irrigation and fertiliser. Try asking: "Which crop is good at pH 6.5?"';
  }

  function speakText(text) {
    if (!window.speechSynthesis) return;
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'en-IN'; // later can change language based on your dropdown
    window.speechSynthesis.speak(utter);
  }

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

  // Voice input
  let recognition;
  try {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.lang = 'en-IN'; // can be changed later based on selected language
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      inputField.value = transcript;
      sendQuery();
    };
  } catch (e) {
    console.log('Speech recognition not supported in this browser');
    if (voiceBtn) voiceBtn.disabled = true;
  }

  if (voiceBtn && recognition) {
    voiceBtn.onclick = () => {
      recognition.start();
    };
  }

});
