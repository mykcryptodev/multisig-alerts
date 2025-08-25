'use client';

import { showToast } from './CustomToast';
import { toast } from 'react-toastify';

export default function ToastDemo() {
  const handleSuccessToast = () => {
    showToast.success('Operation completed successfully!');
  };

  const handleErrorToast = () => {
    showToast.error('Something went wrong. Please try again.');
  };

  const handleWarningToast = () => {
    showToast.warning('Please review your input before proceeding.');
  };

  const handleInfoToast = () => {
    showToast.info('Here is some helpful information for you.');
  };

  const handleCustomToast = () => {
    showToast.success('Custom toast with longer message that demonstrates how the toast handles different content lengths and wraps text appropriately.', {
      autoClose: 8000,
    });
  };

  const handlePendingToast = () => {
    const pendingToast = showToast.pending('This is a pending operation...');
    
    // Simulate an async operation
    setTimeout(() => {
      toast.dismiss(pendingToast);
      showToast.success('Pending operation completed!');
    }, 3000);
  };

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-2xl font-bold mb-4">Toast Notification Demo</h2>
      <p className="text-base-content/70 mb-6">
        Click the buttons below to see different types of toast notifications that integrate seamlessly with your DaisyUI theme.
      </p>
      
      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleSuccessToast}
          className="btn btn-success"
        >
          Success Toast
        </button>
        
        <button
          onClick={handleErrorToast}
          className="btn btn-error"
        >
          Error Toast
        </button>
        
        <button
          onClick={handleWarningToast}
          className="btn btn-warning"
        >
          Warning Toast
        </button>
        
        <button
          onClick={handleInfoToast}
          className="btn btn-info"
        >
          Info Toast
        </button>
        
        <button
          onClick={handleCustomToast}
          className="btn btn-primary"
        >
          Custom Toast
        </button>

        <button
          onClick={handlePendingToast}
          className="btn btn-secondary"
        >
          Pending Toast
        </button>
      </div>
      
      <div className="mt-8 p-4 bg-base-200 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Features:</h3>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>✅ Native DaisyUI styling with alert components</li>
          <li>✅ Theme-aware (light/dark mode support)</li>
          <li>✅ Custom icons for each toast type</li>
          <li>✅ Smooth slide-in/out animations</li>
          <li>✅ Progress bar with primary color</li>
          <li>✅ Click to dismiss</li>
          <li>✅ Auto-close after 5 seconds (configurable)</li>
          <li>✅ Pause on hover</li>
          <li>✅ Draggable toasts</li>
          <li>✅ Spinning loading icons for pending operations</li>
        </ul>
      </div>
    </div>
  );
}
