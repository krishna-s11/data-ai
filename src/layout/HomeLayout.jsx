import React, { useEffect, useState } from 'react';
import './homeLayout.css';
import Sidebar from '../components/Sidebar/Sidebar';
import ChatPanel from '../components/ChatPanel/ChatPanel';
import { FaBars } from "react-icons/fa";
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { logout } from '../utility/logout';

const HomeLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const access_token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
    if (!access_token) {
      // Token not found, log out user immediately
      logout(navigate);
      return;
    }
    axios.get("https://backend.data-ai.co/auth/verify-token", {
      headers: {
        Authorization: `Bearer ${access_token}`
      }
    })
      .catch(err => {
        console.error('Token verification failed:', err);
        logout(navigate);
      });
  }, [navigate]);

  return (
    <div className="home-layout">
      <button className="mobile-toggle" onClick={() => setSidebarOpen(true)}>
        <FaBars style={{ fontSize: "14px" }} />
      </button>

      <aside className={`sidebar-drawer ${sidebarOpen ? 'open' : ''}`}>
        <Sidebar closeSidebar={() => setSidebarOpen(false)} />
      </aside>

      {sidebarOpen && <div className="overlay" onClick={() => setSidebarOpen(false)} />}

      <main className="main-window">
        <ChatPanel />
      </main>
    </div>
  );
};

export default HomeLayout;
