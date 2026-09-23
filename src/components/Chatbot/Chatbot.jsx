import { useRef, useEffect, useState } from "react";
import ChatbotIcon from "./ChatbotIcon";
import ChatForm from "./ChatForm";
import ChatMessage from "./ChatMessage";
import './Chatbot.css';

//!!!!!!!!!!!!!!!!!!!!!przniesienie połącznia na serwer!!!!!!!!!!!!!!!!!! początek
/*
const apiVersion = "gemini-flash-latest";

// Get API key from env file for Vite or CRA (Create React App)
const getApiKey = () => {  
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env.VITE_API_KEY;
  } 
  return process.env.REACT_APP_API_KEY || null;
};

const apiKey = getApiKey();
const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${apiVersion}:streamGenerateContent?alt=sse`;
*/
const apiUrl = "/api/chat"; // endpoint na Twoim backendzie
//!!!!!!!!!!!!!!!!!!!!!przniesienie połącznia na serwer!!!!!!!!!!!!!!!!!! koniec

const Chatbot = () => {
    const [chatHistory, setChatHistory] = useState([]);
    const [showChatbot, setShowChatbot] = useState(false);
    const chatBodyRef = useRef();

    const generateBotResponse = async (history) => {
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

        //!!!!!!!!!!!!!!!!!!!!!przniesienie połącznia na serwer!!!!!!!!!!!!!!!!!! początek
        /*
        const requestOptions = {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-goog-api-key": apiKey
            },
            body: JSON.stringify({ contents: formattedHistory })
        };
        */
        const requestOptions = {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: formattedHistory })
        };
        //!!!!!!!!!!!!!!!!!!!!!przniesienie połącznia na serwer!!!!!!!!!!!!!!!!!! koniec

        try {
            const response = await fetch(apiUrl, requestOptions);

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error.message || "Something went wrong!");
            }

            //!!!!!!!!!!!!!!!!!!!!!zmiana w związku z jąkaniem po przeniesienu na serwer!!!!!!!!!!!!!!!!!! początek
            // Handle data streaming
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = ""; //!!!!!!!!!!!dopisany kawałek 17.09            
            // Tworzymy lokalny akumulator tekstowy dedykowany dla tej pętli,
            // aby odciąć asynchroniczne opóźnienia hooka useState w React.
            // TA ZMIENNA JEST KLUCZEM: Zapamiętuje każdą najmniejszą nową cząstkę tekstu 
            // i buduje pełne zdanie od zera, całkowicie ignorując szatkowanie pakietów przez sieć.
            let fullResponseText = "";

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");
                buffer = lines.pop();

                for (const line of lines) {
                    if (line.startsWith("data: ")) {
                        try {
                            const json = JSON.parse(line.substring(6));

                            // Pobieramy nadesłany fragment tekstu
                            const textFragment = json.candidates[0].content.parts[0].text;

                            if (textFragment) {
                                // Sprawdzamy, czy nadesłany tekst to nowy fragment (delta), czy pełny ciąg.
                                // Jeśli to tylko mała cząstka (np. "ąbie"), doklejamy ją do całości.
                                if (!fullResponseText.endsWith(textFragment)) {
                                    if (textFragment.startsWith(fullResponseText)) {
                                        // Jeśli Google wysłało narastający tekst, nadpisujemy nim całość
                                        fullResponseText = textFragment;
                                    } else {
                                        // W standardowym przypadku po prostu doklejamy nowe słowo
                                        fullResponseText += textFragment;
                                    }
                                }

                                // Czyścimy formatowanie Markdown Twoim poprawionym regexem
                                const cleanedText = fullResponseText.replace(/\*\*(.*?)\*\*/g, "$1").trim();

                                // Wypychamy zawsze kompletny, narastający od zera tekst do okna czatu
                                updateHistory(cleanedText);
                            }
                        } catch (e) {
                            continue;
                        }
                    }
                }
            }
            //!!!!!!!!!!!!!!!!!!!!!zmiana w związku z jąkaniem po przeniesienu na serwer!!!!!!!!!!!!!!!!!! koniec
        } catch (error) {
            updateHistory(error.message, true);
        }
    };

    useEffect(() => {
        // Auto-scroll whenever chat history updates
        chatBodyRef.current.scrollTo({ top: chatBodyRef.current.scrollHeight, behavior: "smooth" });
    }, [chatHistory]);

    return (
        /* Main wrapper with a unique scope class to prevent style leaks */
        <div className={`chatbot-scope ${showChatbot ? "show-chatbot" : ""}`}>

            {/* Chat Toggler Button - Changed from ID to class for reusability */}
            <button
                onClick={() => setShowChatbot(prev => !prev)}
                className="chatbot-toggler"
            >
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
                    {/* Minimize button */}
                    <button onClick={() => setShowChatbot(prev => !prev)} className="material-symbols-rounded">
                        keyboard_arrow_down
                    </button>
                </div>

                {/* Chatbot Body - Contains the conversation scroll area */}
                <div ref={chatBodyRef} className="chat-body">
                    <div className="message bot-message">
                        <ChatbotIcon />
                        <p className="message-text">
                            Cześć! <br /> W czym mogę Ci dzisiaj pomóc?
                        </p>
                    </div>

                    {/* Render the chat history dynamically */}
                    {chatHistory.map((chat, index) => (
                        <ChatMessage key={index} chat={chat} />
                    ))}
                </div>

                {/* Chatbot Footer - Input field and send button */}
                <div className="chat-footer">
                    <ChatForm
                        chatHistory={chatHistory}
                        setChatHistory={setChatHistory}
                        generateBotResponse={generateBotResponse}
                    />
                </div>
            </div>
        </div>
    );
};

export default Chatbot;