'use client';

import { ToastContainer, toast, ToastOptions } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../app/toastify-custom.css';
import { useTheme } from './providers/ThemeProvider';
import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, Loader2 } from 'lucide-react';

// Custom toast component that matches DaisyUI design
const CustomToast = ({ message, type, isLoading = false }: { message: string; type: string; isLoading?: boolean }) => {
  const getIcon = () => {
    if (isLoading) {
      return (
        <div className="animate-spin">
          <Loader2 className="w-5 h-5 text-info" />
        </div>
      );
    }
    
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-success" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-error" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-warning" />;
      case 'info':
        return <Info className="w-5 h-5 text-info" />;
      default:
        return null;
    }
  };

  const getAlertClass = () => {
    const baseClass = 'alert bg-base-200 w-full border-2 !border-solid';
    
    if (isLoading) {
      return `${baseClass} border-info`;
    }
    
    switch (type) {
      case 'success':
        return `${baseClass} border-success`;
      case 'error':
        return `${baseClass} border-error`;
      case 'warning':
        return `${baseClass} border-warning`;
      case 'info':
        return `${baseClass} border-info`;
      default:
        return `${baseClass} border-base-300`;
    }
  };

  return (
    <div className={getAlertClass()}>
      {getIcon()}
      <span className="font-medium text-base-content">{message}</span>
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
      hideProgressBar={true}
      newestOnTop={false}
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme={theme}
      toastClassName="!p-2 !bg-transparent !rounded-lg !bg-red-500"
      closeButton={false}
    />
  );
};

// Toast utility functions with custom styling
export const showToast = {
  success: (message: string, options?: ToastOptions) => {
    return toast(<CustomToast message={message} type="success" />, {
      ...options,
      className: '!p-2 !bg-transparent !rounded-lg',
    });
  },
  error: (message: string, options?: ToastOptions) => {
    return toast(<CustomToast message={message} type="error" />, {
      ...options,
      className: '!p-2 !bg-transparent !rounded-lg',
    });
  },
  warning: (message: string, options?: ToastOptions) => {
    return toast(<CustomToast message={message} type="warning" />, {
      ...options,
      className: '!p-2 !bg-transparent !rounded-lg',
    });
  },
  info: (message: string, options?: ToastOptions) => {
    return toast(<CustomToast message={message} type="info" />, {
      ...options,
      className: '!p-2 !bg-transparent !rounded-lg',
    });
  },
  pending: (message: string, options?: ToastOptions) => {
    return toast(<CustomToast message={message} type="info" isLoading={true} />, {
      ...options,
      className: '!p-2 !bg-transparent !rounded-lg',
      autoClose: false,
    });
  },
};

export default CustomToast;
