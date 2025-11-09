import React, { useEffect, useState, useRef } from 'react';
import './homeLayout.css';
import Sidebar from '../components/Sidebar/Sidebar';
import ChatPanel from '../components/ChatPanel/ChatPanel';
import OnboardingDialog from '../components/OnboardingDialog/OnboardingDialog';
import { FaBars } from "react-icons/fa";
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { logout } from '../utility/logout';
import api from '../utility/api';
import {
  loadConversations,
  saveConversations,
  createEmptyConversation,
  upsertConversation,
  renameConversation,
  deleteConversation,
  setPinned,
} from '../utility/conversations';
// Auth temporarily disabled during backend testing

const HomeLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [messages, setMessages] = useState([]);
  const [conversationTitle, setConversationTitle] = useState('');
  const [displayTitle, setDisplayTitle] = useState('');
  const [miniTitle, setMiniTitle] = useState('');
  const [typingTitle, setTypingTitle] = useState(false);
  const typingIntervalRef = useRef(null);
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const access_token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
    if (!access_token) {
      logout(navigate);
      return;
    }
    
    // Check if user wants to see onboarding dialog
    const onboardingCompleted = localStorage.getItem('onboarding_completed');
    if (onboardingCompleted !== 'true') {
      setShowOnboarding(true);
    }
    
    api.get("/auth/verify-token")
    .catch(err => {
      console.error('Token verification failed:', err);
      logout(navigate);
    });
  }, [navigate]);

  // Load conversations on mount
  useEffect(() => {
    const loaded = loadConversations();
    if (!loaded || loaded.length === 0) {
      const fresh = createEmptyConversation();
      setConversations([fresh]);
      setCurrentConversationId(fresh.id);
      setMessages([]);
      setConversationTitle('');
      setDisplayTitle('');
      setMiniTitle('');
      saveConversations([fresh]);
    } else {
      setConversations(loaded);
      const first = loaded[0];
      setCurrentConversationId(first.id);
      setMessages(first.messages || []);
      // Properly restore title states from the loaded conversation
      setConversationTitle(first.title || '');
      setDisplayTitle(first.title || '');
      setMiniTitle(first.miniTitle || '');
      setTypingTitle(false);
    }
  }, []);

  // Reset title states when messages are cleared (only for new conversations)
  useEffect(() => {
    if (messages.length === 0 && !currentConversationId) {
      setConversationTitle('');
      setDisplayTitle('');
      setMiniTitle('');
      setTypingTitle(false);
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
        typingIntervalRef.current = null;
      }
    }
  }, [messages.length, currentConversationId]);

  // Listen for title events from ChatPanel
  useEffect(() => {
    const handleTitleEvent = (event) => {
      const title = event.detail;
      if (title && !conversationTitle && !typingTitle) {
        setTypingTitle(true);
        setDisplayTitle('');
        let i = 0;
        if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
        typingIntervalRef.current = setInterval(() => {
          i += 1;
          setDisplayTitle(title.slice(0, i));
          if (i >= title.length) {
            clearInterval(typingIntervalRef.current);
            typingIntervalRef.current = null;
            setConversationTitle(title);
            setTypingTitle(false);
          }
        }, 45);
      }
    };

    window.addEventListener('nerveai:title', handleTitleEvent);
    const handleMiniTitle = (event) => {
      const shortTitle = event.detail;
      if (shortTitle) setMiniTitle(shortTitle);
    };
    window.addEventListener('nerveai:title:mini', handleMiniTitle);
    return () => {
      window.removeEventListener('nerveai:title', handleTitleEvent);
      window.removeEventListener('nerveai:title:mini', handleMiniTitle);
    };
  }, [conversationTitle, typingTitle]);

  // Persist title updates to current conversation
  useEffect(() => {
    if (!currentConversationId) return;
    setConversations(prev => {
      const current = prev.find(c => c.id === currentConversationId);
      if (!current) return prev;
      const updated = { ...current, title: conversationTitle || current.title, miniTitle: miniTitle || current.miniTitle, updatedAt: new Date().toISOString() };
      const next = upsertConversation(prev, updated);
      saveConversations(next);
      return next;
    });
  }, [conversationTitle, miniTitle, currentConversationId]);

  // Wrapper to persist messages into current conversation
  const setMessagesPersist = (updater) => {
    setMessages(prevMessages => {
      const nextMessages = typeof updater === 'function' ? updater(prevMessages) : updater;
      if (currentConversationId) {
        setConversations(prev => {
          const existing = prev.find(c => c.id === currentConversationId) || { id: currentConversationId };
          const updated = { ...existing, messages: nextMessages, updatedAt: new Date().toISOString() };
          const next = upsertConversation(prev, updated);
          saveConversations(next);
          return next;
        });
      }
      return nextMessages;
    });
  };

  const startNewChat = () => {
    const fresh = createEmptyConversation();
    setConversations(prev => {
      const next = upsertConversation(prev, fresh);
      saveConversations(next);
      return next;
    });
    setCurrentConversationId(fresh.id);
    setMessages([]);
    setConversationTitle('');
    setDisplayTitle('');
    setMiniTitle('');
    setTypingTitle(false);
  };

  const openConversation = (id) => {
    const conv = conversations.find(c => c.id === id);
    if (!conv) return;
    setCurrentConversationId(conv.id);
    setMessages(conv.messages || []);
    setConversationTitle(conv.title || '');
    setDisplayTitle(conv.title || '');
    setMiniTitle(conv.miniTitle || '');
    setTypingTitle(false);
  };

  const deleteConversationById = (id) => {
    setConversations(prev => {
      const next = deleteConversation(prev, id);
      saveConversations(next);
      return next;
    });
    if (currentConversationId === id) {
      // Switch to first available or create new
      setTimeout(() => {
        setConversations(prev => {
          if (prev.length === 0) {
            const fresh = createEmptyConversation();
            const next = upsertConversation([], fresh);
            saveConversations(next);
            setCurrentConversationId(fresh.id);
            setMessages([]);
            setConversationTitle('');
            setDisplayTitle('');
            setMiniTitle('');
            setTypingTitle(false);
            return next;
          }
          const first = prev[0];
          setCurrentConversationId(first.id);
          setMessages(first.messages || []);
          setConversationTitle(first.title || '');
          setDisplayTitle(first.title || '');
          setMiniTitle(first.miniTitle || '');
          setTypingTitle(false);
          return prev;
        });
      }, 0);
    }
  };

  const togglePinConversation = (id) => {
    setConversations(prev => {
      const current = prev.find(c => c.id === id);
      if (!current) return prev;
      const next = setPinned(prev, id, !current.pinned);
      // Sort: pinned first, then updatedAt desc
      next.sort((a, b) => {
        if (!!b.pinned !== !!a.pinned) return (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0); // pinned true first
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
      saveConversations(next);
      return [...next];
    });
  };

  const handleOnboardingClose = () => {
    setShowOnboarding(false);
  };

  return (
    <div className="home-layout">
      {!sidebarOpen && (
        <button className="mobile-toggle" onClick={() => setSidebarOpen(true)}>
          <FaBars style={{ fontSize: "14px" }} />
        </button>
      )}

      <aside className={`sidebar-drawer ${sidebarOpen ? 'open' : ''} ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <Sidebar 
          currentTitle={displayTitle || conversationTitle} 
          typingTitle={typingTitle}
          miniTitle={miniTitle}
          conversations={[...conversations].sort((a, b) => {
            if (!!b.pinned !== !!a.pinned) return (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0);
            return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
          })}
          currentConversationId={currentConversationId}
          onSelectConversation={(id) => { openConversation(id); setSidebarOpen(false); }}
          onNewChat={() => { startNewChat(); setSidebarOpen(false); }}
          onDeleteConversation={(id) => deleteConversationById(id)}
          onTogglePin={(id) => togglePinConversation(id)}
          closeSidebar={() => setSidebarOpen(false)}
          onCollapseChange={setSidebarCollapsed}
        />
      </aside>

      {sidebarOpen && <div className="overlay" onClick={() => setSidebarOpen(false)} />}

      <main className={`main-window ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <ChatPanel 
          messages={messages} 
          setMessages={setMessagesPersist} 
          title={displayTitle || conversationTitle} 
          typingTitle={typingTitle} 
        />
      </main>

      {/* Onboarding Dialog */}
      <OnboardingDialog 
        isOpen={showOnboarding} 
        onClose={handleOnboardingClose} 
      />
    </div>
  );
};

export default HomeLayout;
