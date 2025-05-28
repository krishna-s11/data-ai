import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Auth from './pages/Auth/Auth';
import HomeLayout from './layout/HomeLayout';
import ConnectApps from './pages/ConnectApps/ConnectApps';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <>
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/auth" />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/chat" element={<ProtectedRoute><HomeLayout /></ProtectedRoute>} />
        <Route path="/connect" element={<ProtectedRoute><ConnectApps /></ProtectedRoute>} />
      </Routes>
    </Router>
    <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
    </>
  );
}

export default App;
