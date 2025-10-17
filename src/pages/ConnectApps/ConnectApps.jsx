import React, { useEffect, useState } from 'react';
import './connectApps.css';
import { FaCheck, FaTimes } from 'react-icons/fa';
import googleLogo from '../../assets/google.png';
import slackLogo from '../../assets/slack.png';
import zoomLogo from '../../assets/zoom.png';
import notionLogo from '../../assets/notion1.png';
import dataAiLogo from '../../assets/logo.png';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import api from '../../utility/api';
import { toast } from 'react-toastify';

const services = {
  google: { name: 'Google', image: googleLogo },
  slack: { name: 'Slack', image: slackLogo },
  zoom: { name: 'Zoom', image: zoomLogo },
  notion: { name: 'Notion', image: notionLogo }
};

const ConnectApps = () => {
  const [connections, setConnections] = useState({
    google: false,
    slack: false,
    zoom: false,
    notion: false,
  });

  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [connectedService, setConnectedService] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const navigate = useNavigate();
  const access_token = localStorage.getItem("access_token") || sessionStorage.getItem("access_token");
  console.log(access_token);
  useEffect(() => {
    if (!access_token) {
      toast.error("No access token found. Please login.");
      navigate("/");
      return;
    }

    // Step 1: Check if token is valid
    api.get('/auth/verify-token')
      .then(() => {
        // Step 2: Token valid, get connected services (even if empty)
        return api.get('/auth/tokens');
      })
      .then(res => {
        const tokens = res.data.tokens || {};
        setConnections({
          google: !!tokens.google,
          slack: !!tokens.slack,
          zoom: !!tokens.zoom,
          notion: !!tokens.notion
        });
      })
      .catch(err => {
        if (err.response?.status === 401) {
          toast.error("Session expired. Please login again.");
          localStorage.removeItem("access_token");
          navigate("/");
        } else if (err.response?.status === 404) {
          // No tokens found — not an error
          setConnections({ google: false, slack: false, zoom: false, notion: false });
        } else {
          console.error("Unexpected error loading tokens:", err);
        }
      })
      .finally(() => setLoading(false));
  }, [access_token, navigate]);

  const handleConnect = async (service) => {
    console.log(`[DEBUG] handleConnect called for service: ${service}`);
    if (service === 'notion') {
      console.log('[DEBUG] Using API client for Notion OAuth');
      try {
        // Use API client to get the redirect URL with proper authentication
        console.log('[DEBUG] Making API request to /auth/notion');
        const response = await api.get('/auth/notion');
        console.log('[DEBUG] API response:', response.data);
        if (response.data.redirect_url) {
          console.log('[DEBUG] Redirecting to:', response.data.redirect_url);
          window.location.href = response.data.redirect_url;
        } else {
          console.error('No redirect URL received from backend');
        }
      } catch (error) {
        console.error('Error getting Notion OAuth URL:', error);
        if (error.response?.status === 401) {
          toast.error("Please login again to connect Notion");
          navigate("/");
        } else {
          toast.error("Failed to connect Notion. Please try again.");
        }
      }
    } else {
      console.log('[DEBUG] Showing dialog for service:', service);
      setSelectedService(service);
      setShowDialog(true);
    }
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setSelectedService('');
  };

  const handleCloseSuccessDialog = () => {
    setShowSuccessDialog(false);
    setConnectedService('');
  };

  // Function to refresh connection status
  const refreshConnections = async () => {
    try {
      const res = await api.get('/auth/tokens');
      const tokens = res.data.tokens || {};
      setConnections({
        google: !!tokens.google,
        slack: !!tokens.slack,
        zoom: !!tokens.zoom,
        notion: !!tokens.notion
      });
    } catch (err) {
      console.error("Error refreshing connections:", err);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    let serviceConnected = '';
    
    // Check for success parameters
    if (params.get("google") === "success") {
      serviceConnected = 'Google';
    }
    if (params.get("slack") === "success") {
      serviceConnected = 'Slack';
    }
    if (params.get("zoom") === "success") {
      serviceConnected = 'Zoom';
    }
    if (params.get("notion") === "success") {
      serviceConnected = 'Notion';
    }
    
    // Handle raw OAuth callback parameters (workaround for misconfigured redirect URI)
    if (params.get("code") && params.get("state")) {
      console.log('[DEBUG] Raw OAuth callback detected, processing...');
      handleOAuthCallback(params.get("code"), params.get("state"));
      return;
    }
    
    if (serviceConnected) {
      setConnectedService(serviceConnected);
      setShowSuccessDialog(true);
      // Refresh connections to show updated status
      refreshConnections();
      // Clear URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Handle raw OAuth callback parameters
  const handleOAuthCallback = async (code, state) => {
    try {
      console.log('[DEBUG] Processing OAuth callback with code:', code.substring(0, 10) + '...');
      
      // Determine the backend URL based on environment
      const backendUrl = window.location.hostname === 'localhost' 
        ? 'http://localhost:8000' 
        : 'https://api.data-ai.co';
      
      // Call the backend callback endpoint directly
      const response = await fetch(`${backendUrl}/auth/notion/callback?code=${code}&state=${state}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        // If successful, redirect to success page
        window.location.href = 'https://chat.data-ai.co/connect?notion=success';
      } else {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
    } catch (error) {
      console.error('[ERROR] OAuth callback processing failed:', error);
      
      if (error.message.includes('400')) {
        toast.error("Invalid OAuth parameters. Please try connecting again.");
      } else if (error.message.includes('401')) {
        toast.error("OAuth state token is invalid. Please try connecting again.");
      } else if (error.message.includes('500')) {
        toast.error("Failed to exchange OAuth code for tokens. Please try again.");
      } else {
        toast.error("Connection failed. Please try again.");
      }
      
      // Clear URL parameters and stay on page
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  };

  const allConnected = Object.values(connections).every(Boolean);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <div className="enhanced-spinner">
            <div className="spinner-ring"></div>
            <div className="spinner-ring"></div>
            <div className="spinner-ring"></div>
          </div>
          <h2 className="loading-title">Loading Connected Apps</h2>
          <p className="loading-subtitle">Please wait while we fetch your connected services...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="connect-page">
      <h1 className="connect-heading">Connect your apps</h1>
      <div className="connect-box">
        {Object.entries(services).map(([key, service]) => (
          <div key={key} className={`app-tile ${connections[key] ? 'connected' : ''}`} onClick={() => handleConnect(key)}>
            <img src={service.image} alt={service.name} />
            <span>{connections[key] ? `${service.name} Connected` : `Connect your ${service.name}`}</span>
            {connections[key] && <FaCheck className="status-check" />}
          </div>
        ))}
        <div className="button-row">
          <button className="skip-btn" onClick={() => navigate("/chat")}>Skip</button>
          <button className="next-btn" disabled={!allConnected} onClick={() => navigate("/chat")}>Next</button>
        </div>
      </div>

      {/* Success Dialog - Shows when a service is connected */}
      {showSuccessDialog && (
        <div className="dialog-overlay" onClick={handleCloseSuccessDialog}>
          <div className="dialog-content success-dialog" onClick={(e) => e.stopPropagation()}>
            <button className="dialog-close" onClick={handleCloseSuccessDialog}>
              <FaTimes />
            </button>
            <div className="dialog-icon">
              <div className="success-icon">
                <FaCheck />
              </div>
              <div className="dialog-brand-text">Data AI</div>
            </div>
            <h2 className="dialog-title">Successfully Connected!</h2>
            <p className="dialog-message">
              Your {connectedService} account has been successfully connected to Data AI. 
              You can now use {connectedService} features in your conversations.
            </p>
            <div className="dialog-actions">
              <button className="dialog-btn primary" onClick={handleCloseSuccessDialog}>
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feature Coming Soon Dialog - Only for non-Notion services */}
      {showDialog && selectedService !== 'notion' && (
        <div className="dialog-overlay" onClick={handleCloseDialog}>
          <div className="dialog-content" onClick={(e) => e.stopPropagation()}>
            <button className="dialog-close" onClick={handleCloseDialog}>
              <FaTimes />
            </button>
            <div className="dialog-icon">
              <img src={dataAiLogo} alt="Data AI" className="dialog-logo" />
              <div className="dialog-brand-text">Data AI</div>
            </div>
            <h2 className="dialog-title">Feature Coming Soon!</h2>
            <p className="dialog-message">
              We're working hard to bring you the {services[selectedService]?.name} integration. 
              This feature will be available in an upcoming update.
            </p>
            <div className="dialog-actions">
              <button className="dialog-btn primary" onClick={handleCloseDialog}>
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConnectApps;
