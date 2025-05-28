import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

export const logout = () => {
  // Clear both storage options
  localStorage.removeItem('access_token');
  sessionStorage.removeItem('access_token');

  // Show toast and redirect
  toast.info('You have been logged out.', {
    onClose: () => {
      window.location.href = '/';
    },
    autoClose: 2000,
  });
};
