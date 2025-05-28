import React, { useState } from 'react';
import './authPage.css';
import logo from "../../assets/logo.png";
import { useNavigate } from 'react-router-dom';

const AuthPage = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async () => {
    setError("");
    setLoading(true);
    const endpoint = isRegistering
      ? "https://backend.data-ai.co/auth/register"
      : "https://backend.data-ai.co/auth/login";
    console.log(endpoint);
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (response.ok) {
        if (isRegistering) {
          setIsRegistering(false);
          setEmail("");
          setPassword("");
        } else {
          const storage = remember ? localStorage : sessionStorage;
          storage.setItem("access_token", data.access_token);
          navigate("/chat");
        }
      } else {
        setError(data.detail || "Something went wrong");
      }
    } catch (error) {
      setError("Error connecting to server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="homepage">
      <div className="left-panel dark">
        <div className="left-content">
          <div className="logo-title">
            <img src={logo} alt="Logo" className="logo-img" />
            <h1 className="brand">Data AI</h1>
          </div>
          <h2 className="headline">Your ideas,<br />amplified</h2>
          <p className="subtext">Privacy-first AI that helps you create in confidence.</p>

          <form className="login-box fade-in" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
            {isRegistering && (
              <input type="text" placeholder="Enter your name" className="email-input" disabled />
            )}
            <input
              type="email"
              placeholder="Enter your email"
              className="email-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              type="password"
              placeholder="Enter your password"
              className="email-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {error && <div className="error-text">{error}</div>}
            {!isRegistering && (
              <div className="remember-row">
                <input
                  type="checkbox"
                  id="remember"
                  checked={remember}
                  onChange={() => setRemember(!remember)}
                />
                <label htmlFor="remember">Remember me</label>
              </div>
            )}
            <button type="submit" className="email-btn scale-hover" disabled={loading}>
              {loading
                ? "Loading..."
                : isRegistering
                ? "Register with email"
                : "Continue with email"}
            </button>
            <div className="divider">OR</div>
            <div className="signup-text">
              {isRegistering ? (
                <>
                  Already have an account?{' '}
                  <a href="#" onClick={() => setIsRegistering(false)}>Login</a>
                </>
              ) : (
                <>
                  Don't have an account?{' '}
                  <a href="#" onClick={() => setIsRegistering(true)}>Sign up</a>
                </>
              )}
            </div>
          </form>

        </div>
      </div>

      <div className="right-panel light center-content">
        <div className="chat-bubble slide-in">
          <img src="https://randomuser.me/api/portraits/women/44.jpg" alt="User" className="avatar" />
          <p>Hi Data AI! Can you visualize my sales funnel from awareness to purchase using bar graphs?</p>
        </div>

        <div className="response-box fade-in">
          <div className="chart-wrapper">
            <div className="chat-overlay">Here’s your sales funnel.</div>
            <div className="chart-box small-chart">
              <h4>Sales funnel</h4>
              <div className="bars">
                <div className="bar animated-bar" style={{ height: '80%' }} title="Ad view">Ad view</div>
                <div className="bar animated-bar" style={{ height: '50%' }} title="Email open">Email open</div>
                <div className="bar animated-bar" style={{ height: '30%' }} title="Website Visit">Website Visit</div>
                <div className="bar animated-bar" style={{ height: '15%' }} title="Product Demo">Product Demo</div>
                <div className="bar animated-bar" style={{ height: '10%' }} title="Purchase">Purchase</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
