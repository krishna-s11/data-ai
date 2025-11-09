import React, { useEffect, useRef, useState } from 'react';
import './sidebar.css';
import { FaChevronLeft, FaChevronDown, FaSearch, FaPlus, FaLink, FaThumbtack, FaTrash } from 'react-icons/fa';
import logo from '../../assets/logo.png';
import { useNavigate } from 'react-router-dom';
import {logout} from '../../utility/logout';
import api from '../../utility/api';
import { toast } from 'react-toastify';

const Sidebar = ({ closeSidebar, currentTitle, typingTitle, miniTitle, conversations = [], currentConversationId, onSelectConversation, onNewChat, onDeleteConversation, onTogglePin, onCollapseChange }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [openChatMenuId, setOpenChatMenuId] = useState(null);
  const chatMenusRef = useRef({});

  useEffect(() => {
    if (!openChatMenuId) return;
    const handleClickOutside = (e) => {
      const menuEl = chatMenusRef.current[openChatMenuId];
      if (menuEl && !menuEl.contains(e.target)) {
        setOpenChatMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openChatMenuId]);
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [search, setSearch] = useState('');
  const [filteredConversations, setFilteredConversations] = useState([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [selectedSearchIndex, setSelectedSearchIndex] = useState(-1);
  const userInfoRef = useRef(null);
  const userMenuRef = useRef(null);
  const searchDropdownRef = useRef(null);


  useEffect(() => {
    const getUser = async () => {
      const res = await api.get('/auth/me');
      setUser(res.data);
    };

    getUser();
  },[])

  // Initialize filtered conversations when conversations change
  useEffect(() => {
    setFilteredConversations(conversations);
  }, [conversations]);

  // Search functionality
  useEffect(() => {
    if (!search.trim()) {
      setFilteredConversations([]);
      setShowSearchDropdown(false);
      return;
    }

    const searchTerm = search.toLowerCase().trim();
    const filtered = conversations.filter(conversation => {
      // Search in title and miniTitle
      const titleMatch = (conversation.title || '').toLowerCase().includes(searchTerm);
      const miniTitleMatch = (conversation.miniTitle || '').toLowerCase().includes(searchTerm);
      
      // Search in message content
      const messageMatch = conversation.messages?.some(message => {
        if (message.text) {
          return message.text.toLowerCase().includes(searchTerm);
        }
        if (message.html) {
          // Strip HTML tags for search
          const textContent = message.html.replace(/<[^>]*>/g, '').toLowerCase();
          return textContent.includes(searchTerm);
        }
        return false;
      }) || false;

      return titleMatch || miniTitleMatch || messageMatch;
    });

    setFilteredConversations(filtered);
    setShowSearchDropdown(true);
    setSelectedSearchIndex(-1);
  }, [search, conversations]);

  // Handle clicks outside search dropdown
  useEffect(() => {
    if (!showSearchDropdown) return;
    const handleClickOutside = (e) => {
      const dropdownEl = searchDropdownRef.current;
      if (dropdownEl && !dropdownEl.contains(e.target)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSearchDropdown]);

  useEffect(() => {
    if (!menuOpen) return;
    const onDocClick = (e) => {
      const target = e.target;
      const insideInfo = userInfoRef.current && userInfoRef.current.contains(target);
      const insideMenu = userMenuRef.current && userMenuRef.current.contains(target);
      if (!insideInfo && !insideMenu) {
        setMenuOpen(false);
      }
    };
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  // Notify parent when collapsed state changes
  useEffect(() => {
    onCollapseChange && onCollapseChange(collapsed);
  }, [collapsed, onCollapseChange]);

  const containerClass = `sidebar-container${collapsed ? ' collapsed' : ''}`;

  return (
     <div className={containerClass} onClick={() => window.innerWidth <= 768 && closeSidebar()}>
      <div className="collapse-toggle" onClick={(e) => { e.stopPropagation(); setCollapsed(!collapsed); }}>
        <FaChevronLeft className={`collapse-icon ${collapsed ? 'rotated' : ''}`} />
      </div>

      <div className="sidebar-header">
        <img src={logo} alt="Logo" className="sidebar-logo" />
        {!collapsed && (
          <div className="brand-row">
            <h2 className="sidebar-title">Nerve AI</h2>
            <span className="beta-badge">Pro</span>
          </div>
        )}
      </div>

      {/* Search */}
      <div className={`search-container${collapsed ? ' hidden' : ''}`} onClick={(e) => e.stopPropagation()}>
        <div className="search-bar">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => search.trim() && setShowSearchDropdown(true)}
            onKeyDown={(e) => {
              if (!showSearchDropdown || filteredConversations.length === 0) return;
              
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedSearchIndex(prev => 
                  prev < filteredConversations.length - 1 ? prev + 1 : prev
                );
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedSearchIndex(prev => prev > 0 ? prev - 1 : -1);
              } else if (e.key === 'Enter') {
                e.preventDefault();
                if (selectedSearchIndex >= 0 && selectedSearchIndex < filteredConversations.length) {
                  const conversation = filteredConversations[selectedSearchIndex];
                  onSelectConversation && onSelectConversation(conversation.id);
                  setSearch('');
                  setShowSearchDropdown(false);
                  setSelectedSearchIndex(-1);
                }
              } else if (e.key === 'Escape') {
                setShowSearchDropdown(false);
                setSelectedSearchIndex(-1);
              }
            }}
          />
        </div>
        
        {/* Search Dropdown */}
        {showSearchDropdown && (
          <div ref={searchDropdownRef} className="search-dropdown">
            <div className="search-dropdown-header">
              <span className="search-results-label">
                {filteredConversations.length > 0 
                  ? `${filteredConversations.length} result${filteredConversations.length !== 1 ? 's' : ''} found`
                  : 'No results found'
                }
              </span>
            </div>
            
            {filteredConversations.length > 0 ? (
              <div className="search-results">
                {filteredConversations.map((conversation, index) => (
                  <div 
                    key={conversation.id} 
                    className={`search-result-item${conversation.id === currentConversationId ? ' selected' : ''}${index === selectedSearchIndex ? ' keyboard-selected' : ''}`}
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      onSelectConversation && onSelectConversation(conversation.id); 
                      setSearch(''); 
                      setShowSearchDropdown(false);
                      setSelectedSearchIndex(-1);
                    }}
                  >
                    <div className="search-result-title">
                      {conversation.pinned && <FaThumbtack className="pinned-icon" />}
                      {conversation.miniTitle || conversation.title || 'Untitled'}
                    </div>
                    <div className="search-result-preview">
                      {conversation.messages?.find(msg => 
                        msg.text?.toLowerCase().includes(search.toLowerCase()) || 
                        (msg.html && msg.html.replace(/<[^>]*>/g, '').toLowerCase().includes(search.toLowerCase()))
                      )?.text?.substring(0, 100) || 'No preview available'}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="search-no-results">
                <p>No conversations found matching "{search}"</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Primary navigation */}
      <nav className="primary-nav">
        <button
          className={`nav-item${collapsed ? ' icon-only' : ''}`}
          onClick={(e) => { e.stopPropagation(); onNewChat && onNewChat(); }}
        >
          <FaPlus className="nav-icon" />
          {!collapsed && <span className="label">New chat</span>}
        </button>
        <button
          className={`nav-item${collapsed ? ' icon-only' : ''}`}
          onClick={(e) => { e.stopPropagation(); navigate('/connect'); closeSidebar(); }}
        >
          <FaLink className="nav-icon" />
          {!collapsed && <span className="label">Connect apps</span>}
        </button>
      </nav>

      {/* Chats */}
      {!collapsed && (
        <div className="sidebar-section">
          <p className="section-label">Recent</p>
          {(conversations && conversations.length > 0) ? (
            conversations
              .map(c => (
                <div key={c.id} className={`chat-item${c.id === currentConversationId ? ' selected' : ''}`} onClick={(e) => { e.stopPropagation(); onSelectConversation && onSelectConversation(c.id); }}>
                  <span className={typingTitle && c.id === currentConversationId ? 'typing-title' : ''}>
                    {c.pinned && <FaThumbtack className="pinned-icon" />} {c.miniTitle || c.title || 'Untitled'}
                  </span>
                  <button className="chat-menu" onClick={(e) => { e.stopPropagation(); setOpenChatMenuId(openChatMenuId === c.id ? null : c.id); }}>•••</button>
                  {openChatMenuId === c.id && (
                    <div ref={(el) => { chatMenusRef.current[c.id] = el; }} className="chat-item-menu premium" onClick={(e) => e.stopPropagation()}>
                      <button className="menu-item" onClick={() => { onTogglePin && onTogglePin(c.id); setOpenChatMenuId(null); }}>
                        <FaThumbtack className="menu-icon" />
                        <span>{c.pinned ? 'Unpin' : 'Pin to top'}</span>
                      </button>
                      <button className="menu-item destructive" onClick={() => { onDeleteConversation && onDeleteConversation(c.id); setOpenChatMenuId(null); }}>
                        <FaTrash className="menu-icon" />
                        <span>Delete</span>
                      </button>
                    </div>
                  )}
                </div>
              ))
          ) : (
            <div className="chat-item">
              <span className={typingTitle ? 'typing-title' : ''}>{miniTitle || currentTitle || 'Welcome to Nerve AI'}</span>
            </div>
          )}
        </div>
      )}

      <div className="sidebar-footer">
        <div ref={userInfoRef} className="user-info" onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}>
          <div className="avatar-circle">{(user?.username?.charAt(0) || 'U').toUpperCase()}</div>
          {!collapsed && (
            <div>
              <p className="user-name">{user?.username || 'User'}</p>
              <p className="user-plan">Pro Plan</p>
            </div>
          )}
          <FaChevronDown className={`expand-btn ${!menuOpen ? 'rotated' : ''}`} />
        </div>

        {!collapsed && menuOpen && (
          <div ref={userMenuRef} className="user-menu" onClick={(e) => e.stopPropagation()}>
            <p className="email">{user?.email}</p>
            <div className="menu-user-info">
              <div className="avatar-circle">{(user?.username?.charAt(0) || 'U').toUpperCase()}</div>
              <div className="user-details">
                <p className="user-name">{user?.username || 'User'}</p>
                <p className="user-plan">Pro Plan</p>
              </div>
              <span className="checkmark">✓</span>
            </div>
            <hr />
            <ul className="menu-options">
              <li onClick={() => {navigate("/connect")}}>Connect your applications</li>
              <li onClick={() => window.open('https://data-ai.gitbook.io/docs', '_blank')}>Learn more</li>
              <li onClick={() => {logout(navigate)}}>Log out</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;