import React, { useEffect, useState } from 'react';
import './authPage.css';
import logo from "../../assets/logo.png";
import { useNavigate } from 'react-router-dom';
import api from '../../utility/api';
import { toast } from 'react-toastify';

const AuthPage = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
    if (token) {
      navigate('/chat');
    }
  }, [navigate]);

  const handleSubmit = async () => {
    if (!email || !password || (isRegistering && !username)) {
      setError("All fields are required.");
      setLoading(false);
      return;
    }
    setError("");
    setLoading(true);
    const endpoint = isRegistering ? "/auth/register" : "/auth/login";
    const payload = isRegistering ? { email, password, username } : { identifier: email, password };

    try {
      const response = await api.post(endpoint, payload);
      const data = response.data;

      if (isRegistering) {
        toast.success("Registered Successfully. Please login to access")
        setIsRegistering(false);
        setUsername("");
        setEmail("");
        setPassword("");
      } else {
        const storage = remember ? localStorage : sessionStorage;
        storage.setItem("access_token", data.access_token);
        storage.setItem("refresh_token", data.refresh_token);
        navigate("/chat");
      }
    } catch (error) {
      setError(error.response?.data?.detail || "Error connecting to server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="homepage">
      <div className="left-panel dark">
        <div className="left-content">
          <div className="logo-title" onClick={() => { window.location.href = 'https://nerveprotocol.com' }}>
            <img src={logo} alt="Logo" className="logo-img" />
            <h1 className="brand">Nerve AI</h1>
          </div>
          <h2 className="headline">Ready to escape <br></br>The Matrix?</h2>
          <p className="subtext">Follow the rabbit and disappear, Nerve AI <br></br>by Nerve Protocol sees without being seen.</p>

          <form className="login-box fade-in" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
            {isRegistering && (
              <input
                type="text"
                placeholder="Enter your username"
                className="email-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            )}
            <input
              type={isRegistering?"email":"text"}
              placeholder="Enter your email"
              className="email-input"
              value={email}
              required
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              type="password"
              placeholder="Enter your password"
              className="email-input"
              value={password}
              required
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
            <button type="submit" className="email-btn scale-hover" disabled={loading || !email || !password}>
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
                  <span onClick={() => setIsRegistering(false)} className="link-like">Login</span>
                </>
              ) : (
                <>
                  Don't have an account?{' '}
                  <span onClick={() => setIsRegistering(true)} className="link-like">Sign up</span>
                </>
              )}
            </div>
          </form>
        </div>
      </div>

    </div>
  );
};

export default AuthPage;
