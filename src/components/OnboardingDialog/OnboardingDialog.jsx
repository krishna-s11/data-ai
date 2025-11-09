import React, { useState, useEffect } from 'react';
import './OnboardingDialog.css';
import dataAiLogo from '../../assets/logo.png';
import { FaTimes, FaArrowRight, FaShieldAlt, FaLock, FaEye } from 'react-icons/fa';

const OnboardingDialog = ({ isOpen, onClose }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(true);

  const pages = [
    {
      title: "Congratulations on Your Free 7-Day Pro Trial!",
      content: "We're excited to offer you a complimentary 7-day Pro trial. This trial grants you full access to all premium features, allowing you to experience the full potential of Nerve AI by Nerve Protocol.",
      icon: "🎉",
      gradient: "linear-gradient(135deg, rgba(8,203,0,0.9), rgba(6,152,0,0.9))"
    },
    {
      title: "Your Privacy is Our Priority",
      content: "At Nerve AI by Nerve Protocol, we prioritize your privacy. Unlike other AI platforms, we ensure that all your chats are stored and processed directly on your device's browser. This means your data never leaves your device, providing you with complete control and peace of mind.",
      icon: <FaShieldAlt />,
      gradient: "linear-gradient(135deg, rgba(8,203,0,0.85), rgba(5,120,0,0.85))"
    },
    {
      title: "Why Privacy Matters",
      content: "Many AI agents, such as ChatGPT, Gemini, and Grok, collect and store your data without explicit permission. Nerve AI by Nerve Protocol is different. Our platform enables you to connect your daily services and interact with large language models without compromising your privacy. By keeping your data on your device, we eliminate the risks associated with data breaches and unauthorized access.",
      icon: <FaLock />,
      gradient: "linear-gradient(135deg, rgba(8,203,0,0.7), rgba(4,90,0,0.7))"
    }
  ];

  useEffect(() => {
    if (isOpen) {
      setCurrentPage(0);
      setIsAnimating(false);
    }
  }, [isOpen]);

  const handleNext = () => {
    if (currentPage < pages.length - 1) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentPage(currentPage + 1);
        setIsAnimating(false);
      }, 300);
    } else {
      handleFinish();
    }
  };

  const handleFinish = () => {
    if (dontShowAgain) {
      localStorage.setItem('onboarding_completed', 'true');
    } else {
      localStorage.setItem('onboarding_completed', 'false');
    }
    onClose();
  };

  const handleSkip = () => {
    if (dontShowAgain) {
      localStorage.setItem('onboarding_completed', 'true');
    } else {
      localStorage.setItem('onboarding_completed', 'false');
    }
    onClose();
  };

  const handleCheckboxChange = () => {
    setDontShowAgain(!dontShowAgain);
  };

  if (!isOpen) return null;

  const currentPageData = pages[currentPage];

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-container">
        <div className="onboarding-content">
          <button className="onboarding-close" onClick={handleSkip}>
            <FaTimes />
          </button>

          <div className="onboarding-header">
            <div className="onboarding-logo-container">
              <img src={dataAiLogo} alt="Nerve AI by Nerve Protocol" className="onboarding-logo" />
              <div className="onboarding-brand-text">Nerve AI</div>
            </div>
          </div>

          <div className="onboarding-body">
            <div className={`onboarding-page ${isAnimating ? 'animating' : ''}`}>
              <div className="onboarding-icon-container">
                <div 
                  className="onboarding-icon"
                  style={{ background: currentPageData.gradient }}
                >
                  {currentPageData.icon}
                </div>
              </div>

              <h2 className="onboarding-title">
                {currentPageData.title}
              </h2>

              <p className="onboarding-description">
                {currentPageData.content}
              </p>
            </div>
          </div>

          <div className="onboarding-footer">
            <div className="onboarding-progress">
              {pages.map((_, index) => (
                <div
                  key={index}
                  className={`progress-dot ${index === currentPage ? 'active' : ''} ${index < currentPage ? 'completed' : ''}`}
                />
              ))}
            </div>

            <div className="onboarding-checkbox-container">
              <label className="onboarding-checkbox-label">
                <input
                  type="checkbox"
                  checked={dontShowAgain}
                  onChange={handleCheckboxChange}
                  className="onboarding-checkbox"
                />
                <span className="onboarding-checkbox-text">Don't show this again</span>
              </label>
            </div>

            <div className="onboarding-actions">
              <button className="onboarding-skip-btn" onClick={handleSkip}>
                Skip
              </button>
              <button className="onboarding-next-btn" onClick={handleNext}>
                {currentPage === pages.length - 1 ? 'Get Started' : 'Next'}
                <FaArrowRight className="next-icon" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingDialog;
