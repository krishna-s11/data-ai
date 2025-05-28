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
  const [selectedModel, setSelectedModel] = useState('Claude Sonnet 4');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { type: 'user', text: input.trim() };
    setMessages(prev => [...prev, userMessage]);

    try {
      const res = await api.post('/chat', { message: input.trim() });

      const botMessage = {
        type: 'bot',
        text: res.data.response || 'Okay.',
        suggestions: res.data.suggestions || [],
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      setMessages(prev => [
        ...prev,
        { type: 'bot', text: 'Oops! Failed to connect to Data AI.' },
      ]);
    } finally {
      setInput('');
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
            <div key={index} className={`message ${msg.type}`}>
              {msg.type === 'bot' && <img src={logo} alt="AI" className="logo-avatar" />}
              <div className={`bubble ${msg.type === 'bot' ? 'bot-bubble' : ''}`}>
                {msg.text}
                {msg.type === 'bot' &&
                  msg.suggestions &&
                  msg.suggestions.length > 0 && (
                    <div className="suggestions">
                      {msg.suggestions.map((sug, idx) => (
                        <div key={idx} className="suggestion-card">
                          <strong>{sug.action}</strong>
                          <div className="service-tag">{sug.service}</div>
                          <p className="desc">{sug.description}</p>
                        </div>
                      ))}
                    </div>
                  )}
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
          placeholder="Reply to Data AI..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
        />

        <div className="input-icons">
          <FaPlus />
          <FaPenNib />
        </div>

        {/* <select
          className="model-select"
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
        >
          <option>Claude Sonnet 4</option>
          <option>GPT-4</option>
          <option>Gemini 1.5 Pro</option>
          <option>Mistral Medium</option>
        </select> */}

        <button className="send-btn" onClick={handleSend}>
          <FaArrowUp />
        </button>
      </div>
    </div>
  );
};

export default ChatPanel;
