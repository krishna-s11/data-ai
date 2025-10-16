import axios from 'axios';
import { toast } from 'react-toastify';

const api = axios.create({
  baseURL: 'https://51.20.4.158',
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
  },
});

// Attach token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Soft logout on 401, but not for service-specific endpoints
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Don't auto-logout for service-specific endpoints that are expected to fail when not connected
      const serviceEndpoints = [
        '/list_calendar_events',
        '/list_notion_pages', 
        '/list_gmail_messages',
        '/create_calendar_event',
        '/send_gmail',
        '/create_notion_page',
        '/post_to_slack',
        '/create_zoom_meeting'
      ];
      
      const isServiceEndpoint = serviceEndpoints.some(endpoint => 
        error.config?.url?.includes(endpoint)
      );
      
      if (!isServiceEndpoint) {
        toast.error('Session expired. Please login again.', {
          onClose: () => {
            localStorage.removeItem('access_token');
            sessionStorage.removeItem('access_token');
            window.location.href = '/';
          },
          autoClose: 3000,
        });
      }
    }
    return Promise.reject(error);
  }
);

export default api;
