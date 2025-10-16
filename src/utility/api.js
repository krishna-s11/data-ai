import axios from 'axios';
import { toast } from 'react-toastify';

const api = axios.create({
  baseURL: 'https://dataai.pilotai.info',
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

// Soft logout on 401, but try to refresh token first
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      // Don't auto-logout for service-specific endpoints
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
      
      if (!isServiceEndpoint && !originalRequest.url?.includes('/auth/refresh')) {
        // Try to refresh the token
        const refreshToken = localStorage.getItem('refresh_token') || sessionStorage.getItem('refresh_token');
        
        if (refreshToken) {
          originalRequest._retry = true;
          
          try {
            const response = await axios.post('https://dataai.pilotai.info/auth/refresh', {
              refresh_token: refreshToken
            });
            
            const { access_token, refresh_token: new_refresh_token } = response.data;
            
            // Update tokens in storage
            const storage = localStorage.getItem('access_token') ? localStorage : sessionStorage;
            storage.setItem('access_token', access_token);
            storage.setItem('refresh_token', new_refresh_token);
            
            // Retry the original request with new token
            originalRequest.headers.Authorization = `Bearer ${access_token}`;
            return api(originalRequest);
          } catch (refreshError) {
            // Refresh failed, log out user
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            sessionStorage.removeItem('access_token');
            sessionStorage.removeItem('refresh_token');
            
            toast.error('Session expired. Please login again.', {
              onClose: () => {
                window.location.href = '/';
              },
              autoClose: 3000,
            });
          }
        } else {
          // No refresh token available
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
    }
    return Promise.reject(error);
  }
);

export default api;
