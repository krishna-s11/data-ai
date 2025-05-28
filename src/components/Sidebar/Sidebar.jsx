import React, { useState } from 'react';
import './sidebar.css';
import { FaChevronLeft, FaChevronDown } from 'react-icons/fa';
import logo from '../../assets/logo.png';
import { useNavigate } from 'react-router-dom';
import {logout} from '../../utility/logout';

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className={`sidebar-container ${collapsed ? 'collapsed' : ''}`} onClick={() => collapsed && setCollapsed(false)}>
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
          <div className="avatar-circle">K</div>
          {!collapsed && (
            <div>
              <p className="user-name">Krishna</p>
              <p className="user-plan">Free plan</p>
            </div>
          )}
          <FaChevronDown className="expand-btn" />
        </div>

        {!collapsed && menuOpen && (
          <div className="user-menu">
            <p className="email">krishnasaxena69@gmail.com</p>
            <div className="menu-user-info">
              <div className="avatar-circle">K</div>
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
              <li onClick={logout}>Log out</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;