import { useRef, useEffect, useState } from "react";
import ChatbotIcon from "./components/ChatbotIcon";
import Chatform from "./components/Chatform";
import ChatMessage from "./components/ChatMessage";

const apiVersion = "gemini-flash-latest";
const apiKey = import.meta.env.VITE_API_KEY;
// LEGACY - Passing the API key via URL
//const apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/" + apiVersion + ":generateContent?key=" + apiKey;
//const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${apiVersion}:generateContent?key=${apiKey}`;

// NEW - API key is now sent in the headers
const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${apiVersion}:generateContent`;


const App = () => {
  const [chatHistory, setChatHistory] = useState([]);
  const [showChatbot, setShowChatbot] = useState(false);
  const chatBodyRef = useRef();

  const generateBotResponse = async (history) => {
    // Helper function to update chat history
    const updateHistory = (text, isError = false) => {
      setChatHistory((prev) => [...prev.filter((msg) => msg.text !== "Myślę..."), { role: "model", text, isError }]);
    };
    // Format chat history for API request
    history = history.map(({ role, text }) => ({ role, parts: [{ text }] }));

    // LEGACY - Passing the API key via URL
    /*
    const requestOptions = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: history })
    }
    */

    // NEW VERSION - Passing the API key in the header for better security
    const requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey
      },
      body: JSON.stringify({ contents: history })
    };

    try {
      // Make the API call to get the bot's response
      const response = await fetch(apiUrl, requestOptions);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error.message || "Coś poszło nie tak!");

      // Clean and update chat history with bot's response
      const apiResponseText = data.candidates[0].content.parts[0].text.replace(/\*\* (.*?)\*\*/g, "$1").trim();
      updateHistory(apiResponseText);
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

