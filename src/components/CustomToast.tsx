'use client';

import { ToastContainer, toast, ToastOptions } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../app/toastify-custom.css';
import { useTheme } from './providers/ThemeProvider';
import { useEffect, useState } from 'react';

// Custom toast component that matches DaisyUI design
const CustomToast = ({ message, type, isLoading = false }: { message: string; type: string; isLoading?: boolean }) => {
  const getIcon = () => {
    if (isLoading) {
      return (
        <div className="animate-spin">
          <svg className="w-5 h-5 text-info" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2a10 10 0 100 20 10 10 0 000-20z" />
          </svg>
        </div>
      );
    }
    
    switch (type) {
      case 'success':
        return (
          <svg className="w-5 h-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-5 h-5 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-5 h-5 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case 'info':
        return (
          <svg className="w-5 h-5 text-info" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getAlertClass = () => {
    if (isLoading) {
      return 'alert alert-info border-l-4 border-l-info';
    }
    
    switch (type) {
      case 'success':
        return 'alert alert-success';
      case 'error':
        return 'alert alert-error';
      case 'warning':
        return 'alert alert-warning';
      case 'info':
        return 'alert alert-info';
      default:
        return 'alert';
    }
  };

  return (
    <div className={getAlertClass()}>
      {getIcon()}
      <span className="font-medium">{message}</span>
    </div>
  );
};

// Custom toast container with DaisyUI styling
export const CustomToastContainer = () => {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <ToastContainer
      position="top-right"
      autoClose={5000}
      hideProgressBar={false}
      newestOnTop={false}
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme={theme}
      toastClassName="!p-6 !bg-base-100 !shadow-none"
      closeButton={false}
    />
  );
};

// Toast utility functions with custom styling
export const showToast = {
  success: (message: string, options?: ToastOptions) => {
    return toast(<CustomToast message={message} type="success" />, {
      ...options,
      className: '!p-6 !bg-base-100 !shadow-none',
    });
  },
  error: (message: string, options?: ToastOptions) => {
    return toast(<CustomToast message={message} type="error" />, {
      ...options,
      className: '!p-6 !bg-base-100 !shadow-none',
    });
  },
  warning: (message: string, options?: ToastOptions) => {
    return toast(<CustomToast message={message} type="warning" />, {
      ...options,
      className: '!p-6 !bg-base-100 !shadow-none',
    });
  },
  info: (message: string, options?: ToastOptions) => {
    return toast(<CustomToast message={message} type="info" />, {
      ...options,
      className: '!p-6 !bg-base-100 !shadow-none',
    });
  },
  pending: (message: string, options?: ToastOptions) => {
    return toast(<CustomToast message={message} type="info" isLoading={true} />, {
      ...options,
      className: '!p-6 !bg-base-100 !shadow-none',
      autoClose: false,
    });
  },
};

export default CustomToast;
