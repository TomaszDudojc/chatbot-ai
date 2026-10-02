import { useRef } from "react";

const ChatForm = ({ chatHistory, setChatHistory, generateBotResponse, loadingText, isGenerating }) => {
    const inputRef = useRef();

    const handleFormSubmit = (e) => {
        e.preventDefault();
        if (isGenerating) return;// DODANO: Zabezpieczenie przed wykonaniem funkcji, gdy bot przetwarza zapytanie
        const userMessage = inputRef.current.value.trim();
        if (!userMessage) return;
        inputRef.current.value = "";

        // Update chat history with th user's message       
        setChatHistory(history => [...history, { id: crypto.randomUUID(), role: "user", text: userMessage }]);

        // Delay 600 ms before showing "Myślę..." message        
        setTimeout(() => {
            // Add a "Myślę..." placeholder for the bot's response
            // setChatHistory(history => [...history, { id: crypto.randomUUID(), role: "model", text: "Myślę..." }]);
            setChatHistory(history => [...history, { id: crypto.randomUUID(), role: "model", text: loadingText, isLoading: true }]);
            // Call the function to generate bot response
            generateBotResponse([...chatHistory, { id: crypto.randomUUID(), role: "user", text: userMessage }]);
        }, 600);
    }

    return (
        <form className="chat-form" onSubmit={handleFormSubmit}>
            {/* DODANO: Atrybut disabled blokujący input na czas generowania odpowiedzi */}
            <input ref={inputRef} type="text" placeholder="Wiadomość..." className="message-input" disabled={isGenerating} required />
            {/* DODANO: Atrybut disabled uniemożliwiający kliknięcie przycisku wysyłania */}
            <button className="material-symbols-rounded" disabled={isGenerating}>arrow_upward</button>
        </form>
    );
};

export default ChatForm
