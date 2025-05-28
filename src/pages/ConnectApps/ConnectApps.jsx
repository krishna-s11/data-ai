import React, { useState } from 'react';
import './connectApps.css';
import { FaCheck } from 'react-icons/fa';
import googleLogo from '../../assets/google.png';
import slackLogo from '../../assets/slack.png';
import zoomLogo from '../../assets/zoom.png';
import notionLogo from '../../assets/notion1.png';
import { useNavigate } from 'react-router-dom';

const ConnectApps = () => {
  const [connections, setConnections] = useState({
    google: true,
    slack: false,
    zoom: true,
    notion: false,
  });
  const navigate = useNavigate();

  const allConnected = Object.values(connections).every(Boolean);

  return (
    <div className="connect-page">
      <h1 className="connect-heading">Connect your apps</h1>

      <div className="connect-box">
        <div className="app-tile">
          <img src={googleLogo} alt="Google" />
          <span>Connect your Google Calendar</span>
          {connections.google && <FaCheck className="status-check" />}
        </div>
        <div className="app-tile">
          <img src={slackLogo} alt="Slack" />
          <span>Connect your Slack account</span>
          {connections.slack && <FaCheck className="status-check" />}
        </div>
        <div className="app-tile">
          <img src={zoomLogo} alt="Zoom" />
          <span>Connect your Zoom account</span>
          {connections.zoom && <FaCheck className="status-check" />}
        </div>
        <div className="app-tile">
          <img src={notionLogo} alt="Notion" />
          <span>Connect your Notion</span>
          {connections.notion && <FaCheck className="status-check" />}
        </div>

        <div className="button-row">
          <button className="skip-btn" onClick={() => {navigate("/chat")}}>Skip</button>
          <button className="next-btn" disabled={!allConnected}>Next</button>
        </div>
      </div>
    </div>
  );
};

export default ConnectApps;
