import React, { useState } from 'react';
import './homeLayout.css';
import Sidebar from '../components/Sidebar/Sidebar';
import ChatPanel from '../components/ChatPanel/ChatPanel';
import { FaBars } from "react-icons/fa";

const HomeLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="home-layout">
      <button className="mobile-toggle" onClick={() => setSidebarOpen(true)}>
        <FaBars style={{fontSize: "14px"}} />
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
