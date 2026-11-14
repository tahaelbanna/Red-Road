import { sound } from "../main";
import { cleanTextForSpeech } from "../utils/textUtils";

export function buildCopilotUI(
  navParent: HTMLElement,
  panelParent: HTMLElement,
  onChatMessage: (msg: string) => void,
) {
  const toggleBtn = document.createElement("button");
  toggleBtn.id = "btn-copilot-toggle";
  toggleBtn.className = "btn";
  toggleBtn.innerHTML = "AI COPILOT";
  toggleBtn.style.pointerEvents = "auto";
  navParent.appendChild(toggleBtn);

  const panel = document.createElement("div");
  panel.id = "copilot-panel";
  panel.className = "panel";
  panel.style.display = "none";
  panel.style.pointerEvents = "auto";
  panel.style.maxHeight = "400px";
  panel.style.display = "flex";
  panel.style.flexDirection = "column";
  panel.style.marginTop = "auto";

  let isOpen = false;
  toggleBtn.addEventListener("click", () => {
    sound.click();
    isOpen = !isOpen;
    panel.style.display = isOpen ? "flex" : "none";
    toggleBtn.className = isOpen ? "btn on" : "btn";
  });

  const header = document.createElement("div");
  header.className = "sec sec-h";
  header.innerHTML = `MISSION COPILOT`;
  header.style.marginBottom = "0";
  panel.appendChild(header);

  const chatArea = document.createElement("div");
  chatArea.id = "copilot-chat-area";
  chatArea.style.flex = "1";
  chatArea.style.overflowY = "auto";
  chatArea.style.padding = "10px";
  chatArea.style.fontSize = "13px";
  chatArea.style.display = "flex";
  chatArea.style.flexDirection = "column";
  chatArea.style.gap = "8px";
  panel.appendChild(chatArea);

  const inputArea = document.createElement("div");
  inputArea.style.display = "flex";
  inputArea.style.padding = "10px";
  inputArea.style.borderTop = "1px solid var(--line)";
  inputArea.style.gap = "5px";

  const inputField = document.createElement("input");
  inputField.type = "text";
  inputField.placeholder = "Ask copilot (e.g. prioritize safety)...";
  inputField.style.flex = "1";
  inputField.style.background = "rgba(0,0,0,0.5)";
  inputField.style.color = "var(--text)";
  inputField.style.border = "1px solid var(--line)";
  inputField.style.padding = "6px";

  inputField.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && inputField.value.trim() !== "") {
      const text = inputField.value.trim();
      appendChatMessage("USER", text);
      inputField.value = "";
      onChatMessage(text);
    }
  });

  const sendBtn = document.createElement("button");
  sendBtn.className = "btn ghost small";
  sendBtn.textContent = "SEND";
  sendBtn.onclick = () => {
    if (inputField.value.trim() !== "") {
      const text = inputField.value.trim();
      appendChatMessage("USER", text);
      inputField.value = "";
      onChatMessage(text);
    }
  };

  const btnGroup = document.createElement("div");
  btnGroup.style.display = "flex";
  btnGroup.style.gap = "5px";

  const voiceInputBtn = document.createElement("button");
  voiceInputBtn.className = "btn ghost small";
  voiceInputBtn.textContent = "🎤 MIC";
  voiceInputBtn.title = "Speak to Copilot";

  (window as any).isVoiceOutputEnabled = false;
  const voiceOutputBtn = document.createElement("button");
  voiceOutputBtn.className = "btn ghost small";
  voiceOutputBtn.textContent = "🔈 MUTE";
  voiceOutputBtn.title = "Toggle AI Voice Output";
  voiceOutputBtn.onclick = () => {
    (window as any).isVoiceOutputEnabled = !(window as any)
      .isVoiceOutputEnabled;
    if (!(window as any).isVoiceOutputEnabled) {
      window.speechSynthesis.cancel();
      voiceOutputBtn.textContent = "🔈 MUTE";
    } else {
      voiceOutputBtn.textContent = "🔊 SOUND ON";
    }
  };

  let recognition: any = null;
  const SpeechRecognition =
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition;
  if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    let isListening = false;

    recognition.onstart = () => {
      voiceInputBtn.style.color = "var(--critical)";
      voiceInputBtn.textContent = "🔴 LISTENING";
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      inputField.value = transcript;
      inputField.focus();
      voiceInputBtn.textContent = "🎤 MIC";
      voiceInputBtn.style.color = "var(--text)";
      isListening = false;
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      voiceInputBtn.style.color = "var(--text)";
      voiceInputBtn.textContent = "🎤 MIC";
      if (event.error !== "no-speech") {
        appendChatMessage("SYSTEM", `Speech recognition error: ${event.error}`);
      }
      isListening = false;
    };

    recognition.onend = () => {
      voiceInputBtn.style.color = "var(--text)";
      voiceInputBtn.textContent = "🎤 MIC";
      isListening = false;
    };

    voiceInputBtn.onclick = () => {
      if (isListening) {
        recognition.stop();
        isListening = false;
      } else {
        try {
          recognition.start();
          isListening = true;
        } catch {
          recognition.stop();
          isListening = false;
        }
      }
    };
  } else {
    voiceInputBtn.style.display = "none";
    console.warn("Speech Recognition API not supported in this browser.");
    appendChatMessage(
      "SYSTEM",
      "Speech Recognition is not supported in your browser.",
    );
  }

  btnGroup.appendChild(voiceOutputBtn);
  btnGroup.appendChild(voiceInputBtn);

  inputArea.appendChild(inputField);
  inputArea.appendChild(btnGroup);
  inputArea.appendChild(sendBtn);
  panel.appendChild(inputArea);

  navParent.appendChild(toggleBtn);
  panelParent.appendChild(panel);
  panel.style.display = "none";
}

export function appendChatMessage(
  role: "USER" | "AI" | "SYSTEM",
  text: string,
) {
  const chatArea = document.getElementById("copilot-chat-area");
  if (!chatArea) return;

  const msg = document.createElement("div");
  msg.style.padding = "8px";
  msg.style.borderRadius = "4px";

  if (role === "USER") {
    msg.style.background = "rgba(255, 255, 255, 0.05)";
    msg.style.color = "#c7b8aa";
    msg.style.borderLeft = "none";
  } else if (role === "SYSTEM") {
    msg.style.background = "rgba(255, 0, 0, 0.05)";
    msg.style.color = "var(--critical)";
    msg.style.borderLeft = "2px solid var(--critical)";
  } else {
    msg.style.background = "rgba(255, 154, 60, 0.1)";
    msg.style.color = "var(--data)";
    msg.style.borderLeft = "2px solid var(--data)";
  }

  msg.innerHTML = `<strong>${role}:</strong> <span style="white-space: pre-wrap;">${text}</span>`;

  chatArea.appendChild(msg);
  chatArea.scrollTop = chatArea.scrollHeight;

  if (
    role === "AI" &&
    "speechSynthesis" in window &&
    (window as any).isVoiceOutputEnabled
  ) {
    window.speechSynthesis.cancel();

    const speak = () => {
      const voices = window.speechSynthesis.getVoices();
      const englishVoices = voices.filter((v) => v.lang.startsWith("en"));

      if (englishVoices.length === 0 && voices.length > 0) {
        appendChatMessage(
          "SYSTEM",
          "Warning: No English voice available on your system. Speech output skipped.",
        );
        return;
      }

      const utterance = new SpeechSynthesisUtterance(cleanTextForSpeech(text));
      utterance.lang = "en-US";
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      const preferredVoice =
        englishVoices.find(
          (v) => v.name.includes("Google") || v.name.includes("Microsoft"),
        ) || englishVoices[0];
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      window.speechSynthesis.speak(utterance);
    };

    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = () => {
        speak();
        window.speechSynthesis.onvoiceschanged = null;
      };
    } else {
      speak();
    }
  }
}
