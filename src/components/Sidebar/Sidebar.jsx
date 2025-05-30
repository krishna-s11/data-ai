import React, { useEffect, useState } from 'react';
import './sidebar.css';
import { FaChevronLeft, FaChevronDown } from 'react-icons/fa';
import logo from '../../assets/logo.png';
import { useNavigate } from 'react-router-dom';
import {logout} from '../../utility/logout';
import api from '../../utility/api';

const Sidebar = ({ closeSidebar }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const [user, setUser] = useState(null);


  useEffect(() => {
    const getUser = async () => {
      const res = await api.get('/auth/me');
      setUser(res.data);
    };

    getUser();
  },[])

  return (
     <div className="sidebar-container" onClick={() => window.innerWidth <= 768 && closeSidebar()}>
      <div className="collapse-toggle" onClick={(e) => { e.stopPropagation(); setCollapsed(!collapsed); }}>
        {/* <FaChevronLeft className={`collapse-icon ${collapsed ? 'rotated' : ''}`} /> */}
      </div>

      <div className="sidebar-header">
        <img src={logo} alt="Logo" className="sidebar-logo" />
        {!collapsed && <h2 className="sidebar-title">Data AI</h2>}
      </div>

      {!collapsed && (
        <>
          <button className="new-chat-btn">+ New chat</button>

          <div className="sidebar-section">
            <p className="section-label">Chats</p>
            <div className="chat-item selected">
              <span>Welcome to Data AI</span>
              <button className="chat-menu">•••</button>
            </div>
          </div>
        </>
      )}

      <div className="sidebar-footer">
        <div className="user-info" onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}>
          <div className="avatar-circle">{user?.username.charAt(0)}</div>
          {!collapsed && (
            <div>
              <p className="user-name">{user?.username || 'User'}</p>
              <p className="user-plan">Free plan</p>
            </div>
          )}
          <FaChevronDown className="expand-btn" />
        </div>

        {!collapsed && menuOpen && (
          <div className="user-menu">
            <p className="email">{user?.email}</p>
            <div className="menu-user-info">
              <div className="avatar-circle">{user?.username.charAt(0)}</div>
              <div>
                <p className="user-name">Personal</p>
                <p className="user-plan">Free plan</p>
              </div>
              <span className="checkmark">✓</span>
            </div>
            <hr />
            <ul className="menu-options">
              <li>Settings</li>
              <li onClick={() => {navigate("/connect")}}>Connect your applications</li>
              <li>Get help</li>
              <li>View all plans</li>
              <li>Learn more</li>
              <li onClick={() => {logout(navigate)}}>Log out</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;