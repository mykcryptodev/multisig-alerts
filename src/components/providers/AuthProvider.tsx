'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { ThirdwebProvider, ConnectButton } from 'thirdweb/react';
import { client } from '@/lib/thirdweb-auth';
import { generatePayload, login, getUser, isLoggedIn, logout } from '@/server/actions/auth';
import { useTheme } from './ThemeProvider';

interface User {
  id: string;
  walletAddress: string;
  name?: string | null;
  multisigs: Multisig[];
  notifications: NotificationSetting | null;
}

interface Multisig {
  id: string;
  chainId: number;
  address: string;
  name?: string | null;
  enabled: boolean;
}

interface NotificationSetting {
  id: string;
  telegramBotToken?: string | null;
  telegramChatId?: string | null;
  enabled: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const currentUser = await getUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Error refreshing user:', error);
      setUser(null);
    }
  };

  const signOut = async () => {
    try {
      console.log('Client-side signOut called');
      const result = await logout();
      console.log('Logout result:', result);
      setUser(null);
      // Force redirect to home page
      window.location.href = '/';
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const loggedIn = await isLoggedIn();
        if (loggedIn) {
          await refreshUser();
        }
      } catch (error) {
        console.error('Auth check error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const value = {
    user,
    isLoading,
    signOut,
    refreshUser,
  };

  return (
    <ThirdwebProvider>
      <AuthContext.Provider value={value}>
        {children}
      </AuthContext.Provider>
    </ThirdwebProvider>
  );
}

export function ConnectWalletButton() {
  const { user, signOut } = useAuth();
  const { theme } = useTheme();

  if (user) {
    return (
      <div className="flex items-center gap-4">
        <span className="text-sm opacity-70">
          {user.name || `${user.walletAddress.slice(0, 6)}...${user.walletAddress.slice(-4)}`}
        </span>
        <button
          onClick={signOut}
          className="btn btn-error btn-sm"
        >
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <ConnectButton
      theme={theme === 'dark' ? 'dark' : 'light'}
      client={client}
      auth={{
        getLoginPayload: async (params) => {
          return generatePayload(params);
        },
        doLogin: async (params) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const result = await login(params as any);
          if (result.success) {
            // Refresh the page to update auth state
            window.location.reload();
          }
        },
        isLoggedIn: async () => {
          return isLoggedIn();
        },
        doLogout: async () => {
          try {
            console.log('ConnectButton doLogout called');
            await logout();
            // Clear local state and redirect
            window.location.href = '/';
          } catch (error) {
            console.error('Logout error:', error);
          }
        },
      }}
    />
  );
}
