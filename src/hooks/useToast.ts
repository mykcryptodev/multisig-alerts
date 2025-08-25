import { useCallback } from 'react';
import { showToast } from '@/components/CustomToast';

export const useToast = () => {
  const success = useCallback((message: string) => {
    showToast.success(message);
  }, []);

  const error = useCallback((message: string) => {
    showToast.error(message);
  }, []);

  const warning = useCallback((message: string) => {
    showToast.warning(message);
  }, []);

  const info = useCallback((message: string) => {
    showToast.info(message);
  }, []);

  return {
    success,
    error,
    warning,
    info,
  };
};

