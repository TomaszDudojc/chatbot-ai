import ChatbotIcon from "./components/ChatbotIcon";

const App = () => {
  return <div className="container">
    <div className="chatbot-popup">
      {/* Chatbot Header */}
      <div className="chat-header">
        <div className="header-info">
          <ChatbotIcon />
          <h2 className="logo-text">Chatbot</h2>
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
          <div className="message user-message">
            <p className="message-text">
              Naucz mnie świetnie programować.
            </p>
          </div>
        </div>

        {/* Chatbot Footer */}
        <div className="chat-footer">
          <form action="#" className="message-input">
            <input type="text" placeholder="Wiadomość..." className="message-input" required />
            <button className="material-symbols-rounded">
            arrow_upward
          </button>
          </form>
        </div>
      </div>
    </div>
  </div>
};

export default App;

