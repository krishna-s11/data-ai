import React, { useState, useRef, useEffect } from 'react';
import './chatPanel.css';
import { FaShareAlt, FaChevronDown, FaPlus, FaPenNib, FaArrowUp } from 'react-icons/fa';
import logo from '../../assets/logo.png';
import api from '../../utility/api';

const ChatPanel = () => {
  const [messages, setMessages] = useState([
    {
      type: 'bot',
      text: "Hi there! How's it going? What can I help you with today?",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const trimmed = input.trim();
    setInput('');  // 🔁 Clear input immediately
    setLoading(true);

    const userMessage = { type: 'user', text: trimmed };
    const loadingMessage = { type: 'bot', text: 'Thinking...' };

    setMessages(prev => [...prev, userMessage, loadingMessage]);

    try {
      const res = await api.post('/chat', { message: trimmed });

      // Remove the "Thinking..." message
      setMessages(prev => prev.filter(msg => msg.text !== 'Thinking...'));

      const newMessages = [];

      if (res.data.response) {
        newMessages.push({
          type: 'bot',
          text: res.data.response,
        });
      }

      if (Array.isArray(res.data.suggestions)) {
        res.data.suggestions.forEach((sug) => {
          newMessages.push({
            type: 'bot-suggestion',
            description: sug.description,
            action: sug.action,
            service: sug.service,
          });
        });
      }

      setMessages(prev => [...prev, ...newMessages]);
    } catch (error) {
      setMessages(prev => [
        ...prev.filter(msg => msg.text !== 'Thinking...'),
        { type: 'bot', text: 'Oops! Failed to connect to Data AI.' },
      ]);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="chat-panel">
      {/* Header */}
      <div className="chat-header">
        <div className="chat-title">
          <span>Welcome to Data AI</span>
          <FaChevronDown className="dropdown-icon" />
        </div>
        <FaShareAlt className="share-icon" />
      </div>

      {/* Messages */}
      <div className="chat-messages">
        <div className="messages-container">
          {messages.map((msg, index) => (
            <div key={index} className={`message ${msg.type.startsWith('bot') ? 'bot' : msg.type}`}>
              {msg.type.startsWith('bot') && (
                <img src={logo} alt="AI" className="logo-avatar" />
              )}

              <div className={`bubble ${msg.type.startsWith('bot') ? 'bot-bubble' : ''}`}>
                {msg.type === 'bot' && msg.text}
                {msg.type === 'bot-suggestion' && (
                  <>
                    <p>{msg.description}</p>
                    <button className="action-button">{msg.action}</button>
                  </>
                )}
                {msg.type === 'user' && msg.text}
              </div>

              {msg.type === 'user' && <div className="avatar user-avatar">K</div>}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="chat-input">
        <input
          type="text"
          placeholder={loading ? "Waiting for response..." : "Reply to Data AI..."}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          disabled={loading}
        />

        <div className="input-icons">
          <FaPlus />
          <FaPenNib />
        </div>

        <button className="send-btn" onClick={handleSend} disabled={loading}>
          <FaArrowUp />
        </button>
      </div>
    </div>
  );
};

export default ChatPanel;
