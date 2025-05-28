import React from 'react';
import './homeLayout.css';
import Sidebar from '../components/Sidebar/Sidebar';
import ChatPanel from '../components/ChatPanel/ChatPanel';

const HomeLayout = ({ children }) => {
  return (
    <div className="home-layout">
      <aside className="sidebar">
        <Sidebar />
      </aside>
      <main className="main-window">
        <ChatPanel />
      </main>
    </div>
  );
};

export default HomeLayout;
