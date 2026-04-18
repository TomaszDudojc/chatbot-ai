import { useState } from "react";
import ChatbotIcon from "./components/ChatbotIcon";
import Chatform from "./components/Chatform";
import ChatMessage from "./components/ChatMessage";

const apiVersion = "gemini-flash-latest";
const apiKey = import.meta.env.VITE_API_KEY;
//const apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/" + apiVersion + ":generateContent?key=" + apiKey;
const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${apiVersion}:generateContent?key=${apiKey}`;

const App = () => {
  const [chatHistory, setChatHistory] = useState([]);

  const generateBotResponse = async (history) => {//
    // Format chat history for API request
    history = history.map(({ role, text }) => ({ role, parts: [{ text }] }));

    const requestOptions = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: history })
    }

    try {
      // Make the API call to get the bot's response
      const response = await fetch(apiUrl, requestOptions);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error.message || "Coś poszło nie tak!");

      console.log(data);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="container">

      <div className="chatbot-popup">

        {/* Chatbot Header */}
        <div className="chat-header">
          <div className="header-info">
            <ChatbotIcon />
            <h2 className="logo-text">Chatbot</h2>
          </div>
          <button className="material-symbols-rounded">
            keyboard_arrow_down
          </button>
        </div>

        {/* Chatbot Body */}
        <div className="chat-body">
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

