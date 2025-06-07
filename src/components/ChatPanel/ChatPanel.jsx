import React, { useState, useRef, useEffect } from 'react';
import './chatPanel.css';
import { FaShareAlt, FaChevronDown, FaPlus, FaPenNib, FaArrowUp } from 'react-icons/fa';
import logo from '../../assets/logo.png';
import api from '../../utility/api';
import { useNavigate } from 'react-router-dom';

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
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const getUser = async () => {
      const res = await api.get('/auth/me');
      setUser(res.data);
    };

    getUser();
  }, []);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const trimmed = input.trim();
    setInput('');
    setLoading(true);

    const userMessage = { type: 'user', text: trimmed };
    const loadingMessage = { type: 'bot', text: 'Thinking...' };

    setMessages(prev => [...prev, userMessage, loadingMessage]);

    try {
      const res = await api.post('/chat', { message: trimmed });

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

  const handleAction = async (msg) => {
    console.log(msg);
    if (msg.action.includes('Connect')) {
      navigate("/connect");
    } else if (msg.service === 'google_calendar') {
      const res = await api.get('/list_calendar_events');
      console.log(res.data.events);
      let html;
      if (res.data.events.length === 0) {
        html = `<div>There are no upcoming events in your calendar</div>`;
      } else {
        html = res.data.events
          .map((e, idx) => `
            <div style="margin-bottom: 1rem;">
              <div><strong>${idx + 1}. ${e.summary}</strong></div>
              <div style="font-size: 0.9rem; color: #ccc;">
                ${new Date(e.start).toLocaleString()} —
                <a href="${e.link}" target="_blank" style="color: #60a5fa; text-decoration: underline;">Open event</a>
              </div>
            </div>
          `)
          .join('');
      }

      console.log(html);
      setMessages(prev => [...prev, { type: 'bot-html', html }]);
    } else if (msg.service === 'notion') {
      const res = await api.get('/list_notion_pages');
      let html;
      if (res.data.pages.length === 0) {
        html = `<div>There are no pages found in your notion</div>`;
      } else {
        html = res.data.pages
          .map((e, idx) => `
            <div style="margin-bottom: 1rem;">
              <div><strong>${idx + 1}. ${e.title} - </strong><a href="${e.link}" target="_blank" style="color: #60a5fa; text-decoration: underline;">Open Notion</a></div>
            </div>
          `)
          .join('');
      }
      console.log(res.data.pages);
      setMessages(prev => [...prev, { type: 'bot-html', html }]);
    } else if (msg.service === 'gmail') {
      const res = await api.get('/list_gmail_messages');
      let html;
      if (res.data.messages.length === 0) {
        html = `<div>There are no mails found in your mailbox</div>`;
      } else {
        html = res.data.messages.map((m, idx) => `
        <div style="margin-bottom: 1rem;">
          <div><strong>${idx + 1}.) From:</strong> ${m.from}, <strong>Timestamp:</strong> ${new Date(m.date).toLocaleString()}</div>
          <div style="font-size: 0.9rem; color: #ccc;">
            <strong>Subject:</strong> ${m.subject}
          </div>
        </div>
      `).join('');
      }
      console.log(res.data.messages);
      setMessages(prev => [...prev, { type: 'bot-html', html }]);
    }
  };


  console.log(messages);

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

              {/* Bot Text */}
              {msg.type === 'bot' && (
                <div className="bubble bot-bubble">
                  {msg.text}
                </div>
              )}

              {/* Bot HTML Message */}
              {msg.type === 'bot-html' && (
                <div
                  className="bubble bot-bubble"
                  dangerouslySetInnerHTML={{ __html: msg.html }}
                />
              )}

              {/* Bot Suggestion */}
              {msg.type === 'bot-suggestion' && (
                <div className="bubble bot-bubble">
                  <p>{msg.description}</p>
                  <button className="action-button" onClick={() => handleAction(msg)}>
                    {msg.action}
                  </button>
                </div>
              )}

              {/* User Message */}
              {msg.type === 'user' && (
                <>
                  <div className="bubble">{msg.text}</div>
                  <div className="avatar user-avatar">
                    {user?.username?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                </>
              )}
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
