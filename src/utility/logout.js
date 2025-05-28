import { toast } from 'react-toastify';

export const logout = (navigate) => {
  // Clear both storage options
  localStorage.removeItem('access_token');
  sessionStorage.removeItem('access_token');

  // Show toast and redirect
  toast.info('You have been logged out.', {
    onClose: () => {
      navigate('/auth');
    },
    autoClose: 2000,
  });
};
