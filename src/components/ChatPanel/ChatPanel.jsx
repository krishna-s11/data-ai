import React, { useState, useRef, useEffect } from 'react';
import './chatPanel.css';
import { FaShareAlt, FaChevronDown, FaArrowUp, FaClock } from 'react-icons/fa';
import logo from '../../assets/logo.png';
import api from '../../utility/api';
import { useNavigate } from 'react-router-dom';
// Remove InlineNoteEditor import - notes are now shown directly in chat

const ChatPanel = ({ messages, setMessages, title, typingTitle }) => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  // Remove note editor state - we'll show notes directly in chat
  
  // Simple incremental typer for text and HTML bubbles
  const typeIncrementally = async ({
    id,
    full,
    field = 'text',
    delayMs = 14,
    chunkSize = 2,
  }) => {
    let index = 0;
    while (index < full.length) {
      index = Math.min(index + chunkSize, full.length);
      const partial = full.slice(0, index);
      setMessages(prev => prev.map(m => m.id === id ? { ...m, [field]: partial } : m));
      // eslint-disable-next-line no-await-in-loop
      await new Promise(r => setTimeout(r, delayMs));
    }
  };
  

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const getUser = async () => {
      try {
        const res = await api.get('/auth/me');
        setUser(res.data);
      } catch (e) {
        // Ignore errors while unauthenticated during backend testing
        setUser(null);
      }
    };

    getUser();
  }, []);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const trimmed = input.trim();
    setInput('');
    inputRef.current?.focus();
    setLoading(true);

    const userMessage = { type: 'user', text: trimmed, timestamp: new Date().toISOString() };
    const loadingMessage = { type: 'bot-loading', timestamp: new Date().toISOString() };

    setMessages(prev => [...prev, userMessage, loadingMessage]);

    try {
      // Special structured response for "what is data ai"
      if (/^\s*what\s+is\s+data\s*ai\??\s*$/i.test(trimmed)) {
        setMessages(prev => prev.filter(msg => msg.type !== 'bot-loading'));
        const botId = `bot_${Date.now()}`;
        // Streamed HTML content with headings and bullet points
        const htmlContent = [
          '<div><strong>Data AI</strong> is your privacy-first personal assistant that connects your everyday tools to help you act faster.</div>',
          '<div style="margin-top:0.5rem;">Here\'s what it does:</div>',
          '<ul style="margin:0.5rem 0 0.25rem 1.25rem;">',
          '<li><strong>Connects your apps</strong>: Google Calendar, Gmail, Notion, Slack, Zoom.</li>',
          '<li><strong>Automates tasks</strong>: schedule meetings, draft emails, create notes, and more.</li>',
          '<li><strong>Understands context</strong>: suggests next actions based on your request.</li>',
          '<li><strong>Respects privacy</strong>: your data stays yours; access is permission-based.</li>',
          '</ul>',
          '<div style="margin-top:0.5rem;">Quick ways to start:</div>',
          '<ul style="margin:0.5rem 0 0.25rem 1.25rem;">',
          '<li>"Check my calendar for today"</li>',
          '<li>"Draft an email to my teammate about the update"</li>',
          '<li>"Create a Notion page for meeting notes"</li>',
          '</ul>',
          '<div style="margin-top:0.5rem;">Want to connect apps now? Use the quick action below.</div>'
        ].join('');

        setMessages(prev => [
          ...prev,
          { id: botId, type: 'bot-html', html: '', timestamp: new Date().toISOString() }
        ]);
        await typeIncrementally({ id: botId, full: htmlContent, field: 'html', delayMs: 8, chunkSize: 3 });

        // Offer a suggestion card to connect apps after the message
        setMessages(prev => [
          ...prev,
          {
            type: 'bot-suggestion',
            description: 'Connect your apps to unlock calendar, email, notes, and calls',
            action: 'Connect your apps',
            service: 'google_calendar',
            timestamp: new Date().toISOString(),
          }
        ]);
        return;
      }

      // Build context including the new user message
      const allMessages = [...messages, userMessage];
      const context = allMessages
        .filter(m => m.type === 'user' || m.type === 'bot')
        .slice(-6)
        .map(m => ({ 
          role: m.type === 'user' ? 'user' : 'assistant', 
          content: m.text || '' 
        }));
      
      const res = await api.post('/chat', { message: trimmed, context });

      setMessages(prev => prev.filter(msg => msg.type !== 'bot-loading'));

      const newMessages = [];

      if (res.data.response) {
        const botId = `bot_${Date.now()}`;
        // Add placeholder bot message to be typed into
        newMessages.push({
          id: botId,
          type: 'bot',
          text: '',
          timestamp: new Date().toISOString(),
        });
        setMessages(prev => [...prev, ...newMessages]);
        await typeIncrementally({ id: botId, full: res.data.response, field: 'text', delayMs: 12, chunkSize: 2 });
        // Prevent double append below
        newMessages.length = 0;
      }

      if (Array.isArray(res.data.suggestions)) {
        res.data.suggestions.forEach((sug) => {
          newMessages.push({
            type: 'bot-suggestion',
            description: sug.description,
            action: sug.action,
            service: sug.service,
            note_content: sug.note_content,  // Pass through note content
            note_title: sug.note_title,      // Pass through note title
            timestamp: new Date().toISOString(),
          });
        });
      }

      if (newMessages.length) {
        setMessages(prev => [...prev, ...newMessages]);
      }

      // Title generation after 2 user and 2 bot messages
      const userMsgs = allMessages.filter(m => m.type === 'user');
      const botMsgs = allMessages.filter(m => m.type === 'bot');
      if (userMsgs.length >= 2 && botMsgs.length >= 2) {
        try {
          const convoForTitle = allMessages
            .filter(m => m.type === 'user' || m.type === 'bot')
            .slice(-6)
            .map(m => ({ role: m.type === 'user' ? 'user' : 'assistant', content: m.text || '' }));
          const tRes = await api.post('/title', { messages: convoForTitle });
          const fullTitle = tRes.data?.title || '';
          const shortTitle = tRes.data?.short_title || '';
          // Dispatch both full and short titles
          if (fullTitle) {
            window.dispatchEvent(new CustomEvent('dataai:title', { detail: fullTitle }));
          }
          if (shortTitle) {
            window.dispatchEvent(new CustomEvent('dataai:title:mini', { detail: shortTitle }));
          }
        } catch (e) {
          // ignore title errors
        }
      }
    } catch (error) {
      setMessages(prev => [
        ...prev.filter(msg => msg.type !== 'bot-loading'),
        { type: 'bot', text: 'Oops! Failed to connect to Data AI.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to parse meeting time from user message
  const parseMeetingTime = (message) => {
    const now = new Date();
    const messageLower = message.toLowerCase();
    
    // Default values
    let startTime = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
    let duration = 30; // 30 minutes default
    
    // Parse "tomorrow" + time
    if (messageLower.includes('tomorrow')) {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      // Extract time (2pm, 2:30pm, 14:00, etc.)
      const timeMatch = messageLower.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/);
      if (timeMatch) {
        let hours = parseInt(timeMatch[1]);
        const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
        const period = timeMatch[3];
        
        // Convert to 24-hour format
        if (period === 'pm' && hours !== 12) {
          hours += 12;
        } else if (period === 'am' && hours === 12) {
          hours = 0;
        }
        
        tomorrow.setHours(hours, minutes, 0, 0);
        startTime = tomorrow;
      } else {
        // Default to 2pm tomorrow if no specific time
        tomorrow.setHours(14, 0, 0, 0);
        startTime = tomorrow;
      }
    }
    
    // Parse "today" + time
    else if (messageLower.includes('today')) {
      const today = new Date(now);
      
      const timeMatch = messageLower.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/);
      if (timeMatch) {
        let hours = parseInt(timeMatch[1]);
        const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
        const period = timeMatch[3];
        
        if (period === 'pm' && hours !== 12) {
          hours += 12;
        } else if (period === 'am' && hours === 12) {
          hours = 0;
        }
        
        today.setHours(hours, minutes, 0, 0);
        startTime = today;
      }
    }
    
    // Parse duration (1 hour, 2 hours, 30 minutes, etc.)
    const durationMatch = messageLower.match(/(\d+)\s*(hour|hr|minute|min)/);
    if (durationMatch) {
      const value = parseInt(durationMatch[1]);
      const unit = durationMatch[2];
      
      if (unit.includes('hour') || unit.includes('hr')) {
        duration = value * 60; // Convert hours to minutes
      } else {
        duration = value; // Already in minutes
      }
    }
    
    return {
      start_time: startTime.toISOString(),
      duration: duration
    };
  };
  
  // Helper function to extract meeting topic from user message
  const extractMeetingTopic = (message) => {
    // Remove common scheduling words to get the actual topic
    const topic = message
      .replace(/\b(schedule|book|arrange|create|set up|setup)\b/gi, '')
      .replace(/\b(a meeting|meeting|call|video call|zoom call)\b/gi, '')
      .replace(/\b(for|at|on|tomorrow|today|next week|this week)\b/gi, '')
      .replace(/\b(\d{1,2}(?::\d{2})?\s*(am|pm)?)\b/gi, '')
      .replace(/\b(\d+\s*(hour|hr|minute|min)s?)\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    return topic || 'AI Meeting';
  };

  const handleAction = async (msg) => {
    console.log(msg);
    try {
      if (msg.action.includes('Connect')) {
        navigate("/connect");
        return;
      } else if (msg.action && (msg.action.includes('Add to Notion page') || msg.action.includes('Create Notion page'))) {
        // Handle Notion page content addition with smart note detection
        console.log('Handling Notion page action:', msg.action);
        console.log('Message data:', msg);
        
        // Show note preview directly in chat instead of editor
        const notePreviewHtml = `
          <div class="note-preview-card">
            <div class="note-preview-header">
              <div class="note-preview-icon">📝</div>
              <div class="note-preview-title">${msg.note_title || 'Quick Note'}</div>
            </div>
            <div class="note-preview-content">
              ${msg.note_content || 'No content available'}
            </div>
            <div class="note-preview-actions">
              <button class="note-save-btn" onclick="window.saveNoteToNotion('${msg.note_title || ''}', '${(msg.note_content || '').replace(/'/g, "\\'")}')">
                Save to Notion
              </button>
            </div>
          </div>
        `;
        
        setMessages(prev => [...prev, { 
          type: 'bot-html', 
          html: notePreviewHtml,
          noteData: {
            title: msg.note_title || '',
            content: msg.note_content || ''
          }
        }]);
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
      } else if (msg.service === 'zoom' && msg.action === 'Create Zoom meeting') {
        // Handle Zoom meeting creation
        console.log('Creating Zoom meeting...');
        
        // Extract meeting details from the conversation context
        const recentMessages = messages.slice(-10); // Get last 10 messages for context
        const userMessages = recentMessages.filter(m => m.type === 'user');
        const lastUserMessage = userMessages[userMessages.length - 1]?.text || 'AI Meeting';
        
        // Parse meeting time from user message
        const parsedTime = parseMeetingTime(lastUserMessage);
        
        // Create meeting data
        const meetingData = {
          topic: extractMeetingTopic(lastUserMessage),
          start_time: parsedTime.start_time,
          duration: parsedTime.duration
        };
        
        try {
          // Debug: Check if token exists
          const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
          console.log('Token exists:', !!token);
          console.log('Token preview:', token ? token.substring(0, 50) + '...' : 'No token');
          
          const res = await api.post('/create_zoom_meeting_direct', {
            topic: meetingData.topic,
            start_time: meetingData.start_time,
            duration: meetingData.duration
          });
          
          console.log('Zoom meeting created:', res.data);
          
          // Display the meeting details
          const meetingHtml = `
            <div class="zoom-meeting-card">
              <div class="meeting-header">
                <div class="meeting-icon">🎥</div>
                <div class="meeting-title">Zoom Meeting Created!</div>
              </div>
              <div class="meeting-details">
                <div class="meeting-topic"><strong>Topic:</strong> ${meetingData.topic}</div>
                <div class="meeting-link">
                  <strong>Meeting Link:</strong> 
                  <a href="${res.data.zoom.zoom_link}" target="_blank" style="color: #60a5fa; text-decoration: underline;">
                    Join Meeting
                  </a>
                </div>
                <div class="meeting-id"><strong>Meeting ID:</strong> ${res.data.zoom.meeting_id}</div>
                <div class="meeting-time"><strong>Start Time:</strong> ${new Date(res.data.zoom.start_time).toLocaleString()}</div>
              </div>
            </div>
          `;
          
          setMessages(prev => [...prev, { type: 'bot-html', html: meetingHtml }]);
          
        } catch (error) {
          console.error('Error creating Zoom meeting:', error);
          let errorMessage = 'Failed to create Zoom meeting. ';
          
          if (error.response?.status === 401) {
            errorMessage += 'Please connect your Zoom account first.';
          } else if (error.response?.status === 500) {
            errorMessage += 'There was an error with the Zoom service.';
          } else {
            errorMessage += 'Please try again.';
          }
          
          setMessages(prev => [...prev, { 
            type: 'bot', 
            text: errorMessage 
          }]);
        }
      }
    } catch (error) {
      console.error('Error in handleAction:', error);
      
      // Handle different types of errors
      if (error.response?.status === 401) {
        const serviceName = msg.service === 'google_calendar' ? 'Google Calendar' : 
                           msg.service === 'notion' ? 'Notion' : 
                           msg.service === 'gmail' ? 'Gmail' : 'service';
        
        const html = `
          <div style="margin-bottom: 1rem;">
            <div><strong>🔌 ${serviceName} not connected</strong></div>
            <div style="font-size: 0.9rem; color: #ccc; margin-top: 0.5rem;">
              To use this feature, please connect your ${serviceName} account first.
            </div>
            <button onclick="window.location.href='/connect'" style="margin-top: 0.5rem; padding: 0.5rem 1rem; background: #4681c3; color: white; border: none; border-radius: 4px; cursor: pointer;">
              Connect ${serviceName}
            </button>
          </div>
        `;
        setMessages(prev => [...prev, { type: 'bot-html', html }]);
      } else {
        const html = `<div>Sorry, there was an error processing your request. Please try again later.</div>`;
        setMessages(prev => [...prev, { type: 'bot-html', html }]);
      }
    }
  };


  // Global function for saving notes from HTML buttons
  window.saveNoteToNotion = async (title, content) => {
    console.log('Saving note:', { title, content });
    
    try {
      const res = await api.post('/append_to_notion_page', {
        title: title,
        content: content,
      });
      
      console.log('API response:', res.data);
      
      const html = `
        <div style="margin-bottom: 1rem; padding: 1rem; background: rgba(34, 197, 94, 0.1); border-radius: 8px; border-left: 4px solid #22c55e;">
          <div style="color: #22c55e; font-weight: 600; margin-bottom: 0.5rem;">✅ Note saved successfully!</div>
          <div style="font-size: 0.9rem; color: #ccc;">
            <strong>Title:</strong> ${title}
          </div>
          <div style="font-size: 0.9rem; color: #ccc; margin-top: 0.25rem;">
            <strong>Content:</strong> ${content.length > 100 ? content.substring(0, 100) + '...' : content}
          </div>
        </div>
      `;
      setMessages(prev => [...prev, { type: 'bot-html', html }]);
      
    } catch (error) {
      console.error('Error saving note:', error);
      
      const errorHtml = `
        <div style="margin-bottom: 1rem; padding: 1rem; background: rgba(239, 68, 68, 0.1); border-radius: 8px; border-left: 4px solid #ef4444;">
          <div style="color: #ef4444; font-weight: 600; margin-bottom: 0.5rem;">❌ Failed to save note</div>
          <div style="font-size: 0.9rem; color: #ccc;">
            Please try again or check your Notion connection.
          </div>
        </div>
      `;
      setMessages(prev => [...prev, { type: 'bot-html', html: errorHtml }]);
    }
  };

  console.log(messages);

  // Note editor functions removed - notes are now shown directly in chat

  const handleShare = async () => {
    try {
      const text = messages.map(m => `${m.type === 'user' ? 'You' : 'AI'}: ${m.text || m.description || ''}`).join('\n');
      if (navigator.share) {
        await navigator.share({ title: 'Data AI chat', text });
        return;
      }
      await navigator.clipboard.writeText(text);
      console.info('Conversation copied to clipboard');
    } catch (e) {
      console.warn('Share failed; falling back to alert');
      alert('Conversation copied to clipboard');
    }
  };

  const showWelcome = !loading && messages.length === 0;

  

  return (
    <div className="chat-panel">
      {/* Header */}
      <div className="chat-header">
        <div className="chat-title">
          <span className={typingTitle ? 'typing-title' : ''}>{title || 'Data AI'}</span>
          <span className="subhead">{title ? 'Conversation' : 'Private assistant'}</span>
        </div>
        <div className="toolbar">
          <button className="tool-btn" title="Share" onClick={handleShare}>
            <FaShareAlt />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="chat-messages">
        {showWelcome && (
          <div className="welcome-hero">
            <h1 style={{ color: '#4681c3', fontSize: '3rem', marginBottom: '2rem', fontFamily: 'Arial, sans-serif' }}>Hello{user?.username ? `, ${user.username}` : ''}</h1>
            <p className="muted">Here are some quick actions to get started</p>
            <div className="quick-actions">
              <button className="qa-btn" onClick={() => handleAction({ action: 'Connect your apps' })}>Connect apps</button>
              <button className="qa-btn" onClick={() => handleAction({ service: 'google_calendar', action: 'Show calendar' })}>Check calendar</button>
              <button className="qa-btn" onClick={() => handleAction({ service: 'notion', action: 'Show Notion pages' })}>Browse Notion</button>
              <button className="qa-btn" onClick={() => handleAction({ action: 'Create Notion page' })}>Create note</button>
              <button className="qa-btn" onClick={() => handleAction({ service: 'gmail', action: 'List recent emails' })}>Review emails</button>
            </div>
          </div>
        )}
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
                  {msg.timestamp && (
                    <div className="meta"><FaClock /> {new Date(msg.timestamp).toLocaleTimeString()}</div>
                  )}
                </div>
              )}

              {/* Bot Loading */}
              {msg.type === 'bot-loading' && (
                <div className="bubble bot-bubble">
                  <div className="typing">
                    <span className="dot"></span>
                    <span className="dot"></span>
                    <span className="dot"></span>
                  </div>
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
                  {msg.service && msg.action?.includes('Connect') ? (
                    <div className="connection-card">
                      <div className="connection-header">
                        <div className="service-icon">
                          {msg.service === 'notion' && '📝'}
                          {msg.service === 'gmail' && '📧'}
                          {msg.service === 'google_calendar' && '📅'}
                          {msg.service === 'slack' && '💬'}
                          {msg.service === 'zoom' && '🎥'}
                        </div>
                        <div className="connection-title">
                          <h3>Enable {msg.service === 'google_calendar' ? 'Google Calendar' : msg.service?.charAt(0).toUpperCase() + msg.service?.slice(1)} integration</h3>
                          <p className="connection-subtitle">Connect your {msg.service === 'google_calendar' ? 'Google Calendar' : msg.service} to unlock powerful features</p>
                        </div>
                      </div>
                      <div className="connection-benefits">
                        <div className="benefit-item">
                          <span className="benefit-icon">✨</span>
                          <span>Seamless data access</span>
                        </div>
                        <div className="benefit-item">
                          <span className="benefit-icon">⚡</span>
                          <span>Automated workflows</span>
                        </div>
                        <div className="benefit-item">
                          <span className="benefit-icon">🔒</span>
                          <span>Secure & private</span>
                        </div>
                      </div>
                      <button className="connection-button" onClick={() => handleAction(msg)}>
                        <span className="button-text">{msg.action}</span>
                        <span className="button-icon">→</span>
                      </button>
                    </div>
                  ) : (
                    <>
                      <p>{msg.description}</p>
                      <button className="action-button" onClick={() => handleAction(msg)}>
                        {msg.action}
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* User Message */}
              {msg.type === 'user' && (
                <>
                  <div className="bubble user-bubble">
                    {msg.text}
                    {msg.timestamp && (
                      <div className="meta"><FaClock /> {new Date(msg.timestamp).toLocaleTimeString()}</div>
                    )}
                  </div>
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
          ref={inputRef}
          type="text"
          placeholder={loading ? "Waiting for response..." : "Reply to Data AI..."}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
        />


        <button className="send-btn" onClick={handleSend} disabled={loading}>
          <FaArrowUp />
        </button>
      </div>

      {/* InlineNoteEditor removed - notes are now shown directly in chat */}
    </div>
  );
};

export default ChatPanel;
