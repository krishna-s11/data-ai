import React, { useEffect, useState } from 'react';
import './connectApps.css';
import { FaCheck } from 'react-icons/fa';
import googleLogo from '../../assets/google.png';
import slackLogo from '../../assets/slack.png';
import zoomLogo from '../../assets/zoom.png';
import notionLogo from '../../assets/notion1.png';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
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
    axios.get("https://backend.data-ai.co/auth/verify-token", {
      headers: { Authorization: `Bearer ${access_token}` }
    })
      .then(() => {
        // Step 2: Token valid, get connected services (even if empty)
        return axios.get("https://backend.data-ai.co/auth/tokens", {
          headers: { Authorization: `Bearer ${access_token}` }
        });
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
    try {
      const res = await axios.get(`https://backend.data-ai.co/auth/${service}`, {
        headers: { Authorization: `Bearer ${access_token}` }
      });
      if (res.data.redirect_url) {
        console.log(res.data.redirect_url);
        window.location.href = res.data.redirect_url;
      } else {
        toast.error(`No redirect URL received for ${service}`);
      }
    } catch (err) {
      if (err.response?.status === 401) {
        toast.error("Session expired. Please login again.");
        localStorage.removeItem("access_token");
        navigate("/");
      } else {
        toast.error(`Failed to connect ${service}. Please try again.`);
        console.error(`Connect ${service} failed:`, err);
      }
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("google") === "success") {
      toast.success("Google account connected!");
    }
    if (params.get("slack") === "success") {
      toast.success("Slack account connected!");
    }
    if (params.get("zoom") === "success") {
      toast.success("Zoom account connected!");
    }
    if (params.get("notion") === "success") {
      toast.success("Notion account connected!");
    }
  }, []);

  const allConnected = Object.values(connections).every(Boolean);

  if (loading) {
    return (
      <div className="spinner-container">
        <div className="spinner"></div>
        <p>Loading connected apps...</p>
      </div>
    );
  }

  return (
    <div className="connect-page">
      <h1 className="connect-heading">Connect your apps</h1>
      <div className="connect-box">
        {Object.entries(services).map(([key, service]) => (
          <div key={key} className="app-tile" onClick={() => handleConnect(key)}>
            <img src={service.image} alt={service.name} />
            <span>Connect your {service.name}</span>
            {connections[key] && <FaCheck className="status-check" />}
          </div>
        ))}
        <div className="button-row">
          <button className="skip-btn" onClick={() => navigate("/chat")}>Skip</button>
          <button className="next-btn" disabled={!allConnected} onClick={() => navigate("/chat")}>Next</button>
        </div>
      </div>
    </div>
  );
};

export default ConnectApps;
