import { useRef, useEffect, useState } from "react";
import ChatbotIcon from "./components/ChatbotIcon";
import Chatform from "./components/Chatform";
import ChatMessage from "./components/ChatMessage";

const apiVersion = "gemini-flash-latest";
const apiKey = import.meta.env.VITE_API_KEY;
const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${apiVersion}:streamGenerateContent?alt=sse`;

const App = () => {
  const [chatHistory, setChatHistory] = useState([]);
  const [showChatbot, setShowChatbot] = useState(false);
  const chatBodyRef = useRef();

  const generateBotResponse = async (history) => {
    let accumulatedText = "";

    // Helper function to update chat history (handles streaming and errors)
    const updateHistory = (text, isError = false) => {
      setChatHistory((prev) => {
        const lastMsgIndex = prev.length - 1;

        // If it's a regular streaming update (not an error) and last message is from model
        if (!isError && lastMsgIndex >= 0 && prev[lastMsgIndex].role === "model" && !prev[lastMsgIndex].isError) {
          const newHistory = [...prev];
          newHistory[lastMsgIndex] = { ...newHistory[lastMsgIndex], text };
          return newHistory;
        }

        // For errors or the very first chunk: remove "Thinking..." and add new message
        const filtered = prev.filter((msg) => msg.text !== "Myślę...");
        return [...filtered, { role: "model", text, isError }];
      });
    };

    // Format chat history for the API
    const formattedHistory = history.map(({ role, text }) => ({ role, parts: [{ text }] }));

    const requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey
      },
      body: JSON.stringify({ contents: formattedHistory })
    };

    try {
      const response = await fetch(apiUrl, requestOptions);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error.message || "Something went wrong!");
      }

      // Handle data streaming
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const json = JSON.parse(line.substring(6));
              const textFragment = json.candidates[0].content.parts[0].text;

              if (textFragment) {
                accumulatedText += textFragment;
                // Remove formatting and update UI in real-time
                const cleanedText = accumulatedText.replace(/\*\* (.*?)\*\*/g, "$1").trim();
                updateHistory(cleanedText);
              }
            } catch (e) {
              continue; // Ignore errors from incomplete JSON fragments
            }
          }
        }
      }
    } catch (error) {
      updateHistory(error.message, true);
    }
  };

  useEffect(() => {
    // Auto-scroll whenever chat history updates
    chatBodyRef.current.scrollTo({ top: chatBodyRef.current.scrollHeight, behavior: "smooth" });
  }, [chatHistory]);

  return (
    <div className={`container ${showChatbot ? "show-chatbot" : ""}`}>

      <button onClick={() => setShowChatbot(prev => !prev)}
        id="chatbot-toggler">
        <span className="material-symbols-rounded">mode_comment</span>
        <span className="material-symbols-rounded">close</span>
      </button>

      <div className="chatbot-popup">

        {/* Chatbot Header */}
        <div className="chat-header">
          <div className="header-info">
            <ChatbotIcon />
            <h2 className="logo-text">Chatbot</h2>
          </div>
          <button onClick={() => setShowChatbot(prev => !prev)} className="material-symbols-rounded">
            keyboard_arrow_down
          </button>
        </div>

        {/* Chatbot Body */}
        <div ref={chatBodyRef} className="chat-body">
          <div className="message bot-message">
            <ChatbotIcon />
            <p className="message-text">
              Cześć! <br /> W czym mogę pomóc?
            </p>
          </div>
          {/* Render the chat history dynamically */}
          {chatHistory.map((chat, index) => (
            <ChatMessage key={index} chat={chat} />
          ))}
        </div>

        {/* Chatbot Footer */}
        <div className="chat-footer">
          <Chatform chatHistory={chatHistory} setChatHistory={setChatHistory} generateBotResponse={generateBotResponse} />
        </div>

      </div>

    </div>
  );
};

export default App;
