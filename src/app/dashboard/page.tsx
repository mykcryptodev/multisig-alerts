'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { ConnectButton } from 'thirdweb/react';
import { client } from '@/lib/thirdweb-auth';
import ThemeToggle from '@/components/ThemeToggle';
import { useTheme } from '@/components/providers/ThemeProvider';

interface Multisig {
  id: string;
  chainId: number;
  address: string;
  name?: string | null;
  enabled: boolean;
}

interface NotificationSetting {
  id: string;
  telegramChatId?: string | null;
  enabled: boolean;
}

export default function DashboardPage() {
  const { theme } = useTheme();
  const { user, isLoading, signOut } = useAuth();
  const [multisigs, setMultisigs] = useState<Multisig[]>([]);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSetting | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  
  // Form states
  const [showAddMultisig, setShowAddMultisig] = useState(false);
  const [showTelegramConfig, setShowTelegramConfig] = useState(false);
  const [newMultisig, setNewMultisig] = useState({
    chainId: 8453, // Base
    address: '',
    name: '',
  });
  const [telegramConfig, setTelegramConfig] = useState({
    telegramChatId: '',
  });

  // Load user data
  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    try {
      setIsLoadingData(true);
      
      // Load multisigs
      const multisigsResponse = await fetch('/api/multisigs');
      if (multisigsResponse.ok) {
        const data = await multisigsResponse.json();
        setMultisigs(data.multisigs);
      }
      
      // Load notification settings
      const notificationsResponse = await fetch('/api/notifications');
      if (notificationsResponse.ok) {
        const data = await notificationsResponse.json();
        setNotificationSettings(data.settings);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleAddMultisig = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/multisigs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMultisig),
      });
      
      if (response.ok) {
        setShowAddMultisig(false);
        setNewMultisig({ chainId: 8453, address: '', name: '' });
        loadUserData();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error adding multisig:', error);
      alert('Failed to add multisig');
    }
  };

  const handleUpdateMultisig = async (id: string, updates: Partial<Multisig>) => {
    try {
      const response = await fetch(`/api/multisigs/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      
      if (response.ok) {
        loadUserData();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error updating multisig:', error);
      alert('Failed to update multisig');
    }
  };

  const handleDeleteMultisig = async (id: string) => {
    if (!confirm('Are you sure you want to delete this multisig?')) return;
    
    try {
      const response = await fetch(`/api/multisigs/${id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        loadUserData();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error deleting multisig:', error);
      alert('Failed to delete multisig');
    }
  };

  const handleUpdateNotifications = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(telegramConfig),
      });
      
      if (response.ok) {
        setShowTelegramConfig(false);
        setTelegramConfig({ telegramChatId: '' });
        loadUserData();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error updating notifications:', error);
      alert('Failed to update notification settings');
    }
  };

  const handleTestTelegram = async () => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: true }),
      });
      
      if (response.ok) {
        alert('Test message sent successfully!');
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error testing Telegram:', error);
      alert('Failed to send test message');
    }
  };

  const handleManualCheck = async () => {
    try {
      const response = await fetch('/api/cron/check-safe', {
        method: 'POST',
      });
      
      if (response.ok) {
        alert('Manual check completed!');
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error with manual check:', error);
      alert('Failed to perform manual check');
    }
  };

  const handleTestTransactionType = async (transactionType: 'transfer' | 'approval' | 'contract') => {
    try {
      const response = await fetch('/api/test-transaction-type', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionType }),
      });
      
      if (response.ok) {
        const result = await response.json();
        alert(`✅ ${result.message}`);
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || error.message}`);
      }
    } catch (error) {
      console.error(`Error testing ${transactionType} transaction:`, error);
      alert(`Failed to test ${transactionType} transaction`);
    }
  };

  if (isLoading || isLoadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <span className="loading loading-spinner loading-lg"></span>
          <p className="mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in to continue</h1>
          <p className="opacity-70">You need to connect your wallet to access the dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-100">
      {/* Header */}
      <header className="bg-base-200 shadow-lg border-b border-base-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-semibold">Multisig Alert Dashboard</h1>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <ConnectButton theme={theme === 'dark' ? 'dark' : 'light'} client={client} />
              <button
                onClick={signOut}
                className="btn btn-ghost btn-circle"
                title="Sign Out"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Actions */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-4 mb-6">
            <button
              onClick={() => setShowAddMultisig(true)}
              className="btn btn-primary"
            >
              Add Multisig
            </button>
            <button
              onClick={() => {
                if (notificationSettings) {
                  setTelegramConfig({
                    telegramChatId: notificationSettings.telegramChatId || '',
                  });
                }
                setShowTelegramConfig(true);
              }}
              className="btn btn-success"
            >
              Configure Telegram
            </button>
            <button
              onClick={handleTestTelegram}
              className="btn btn-secondary"
            >
              Test Telegram
            </button>
            <button
              onClick={handleManualCheck}
              className="btn btn-warning"
            >
              Manual Check
            </button>
            
            {/* Test Transaction Type Buttons */}
            <button
              onClick={() => handleTestTransactionType('transfer')}
              className="btn btn-info"
              title="Test transfer transaction notifications"
            >
              Test Transfer
            </button>
            
            <button
              onClick={() => handleTestTransactionType('approval')}
              className="btn btn-accent"
              title="Test approval transaction notifications"
            >
              Test Approval
            </button>
            
            <button
              onClick={() => handleTestTransactionType('contract')}
              className="btn btn-neutral"
              title="Test contract call notifications"
            >
              Test Contract
            </button>
          </div>
        </div>

        {/* Multisigs Section */}
        <div className="card bg-base-200 shadow-xl mb-8">
          <div className="card-body">
            <h2 className="card-title">Your Multisigs</h2>
            
            {multisigs.length === 0 ? (
              <p className="opacity-70">No multisigs configured yet. Add your first one to get started!</p>
            ) : (
              <div className="space-y-4">
                {multisigs.map((multisig) => (
                  <div key={multisig.id} className="card bg-base-100 border border-base-300">
                    <div className="card-body p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">
                            {multisig.name || `Multisig ${multisig.address.slice(0, 6)}...${multisig.address.slice(-4)}`}
                          </h3>
                          <p className="text-sm opacity-70">
                            Chain ID: {multisig.chainId} | Address: {multisig.address}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="label cursor-pointer">
                            <input
                              type="checkbox"
                              checked={multisig.enabled}
                              onChange={(e) => handleUpdateMultisig(multisig.id, { enabled: e.target.checked })}
                              className="checkbox checkbox-primary"
                            />
                            <span className="label-text ml-2">Enabled</span>
                          </label>
                          <button
                            onClick={() => handleDeleteMultisig(multisig.id)}
                            className="btn btn-ghost btn-sm text-error"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Notification Settings Section */}
        <div className="card bg-base-200 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Notification Settings</h2>
            
            {notificationSettings ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-70">Telegram Chat ID</p>
                    <p className="font-mono text-sm">
                      {notificationSettings.telegramChatId || 'Not configured'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <label className="label cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notificationSettings.enabled}
                      onChange={(e) => {
                        fetch('/api/notifications', {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ enabled: e.target.checked }),
                        }).then(() => loadUserData());
                      }}
                      className="checkbox checkbox-primary"
                    />
                    <span className="label-text ml-2">Enable notifications</span>
                  </label>
                </div>
              </div>
            ) : (
              <p className="opacity-70">Notification settings not configured yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Add Multisig Modal */}
      {showAddMultisig && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">Add New Multisig</h3>
            <form onSubmit={handleAddMultisig}>
              <div className="space-y-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Chain ID</span>
                  </label>
                  <select
                    value={newMultisig.chainId}
                    onChange={(e) => setNewMultisig({ ...newMultisig, chainId: parseInt(e.target.value) })}
                    className="select select-bordered w-full"
                  >
                    <option value={1}>Ethereum (1)</option>
                    <option value={8453}>Base (8453)</option>
                    <option value={137}>Polygon (137)</option>
                    <option value={56}>BSC (56)</option>
                    <option value={42161}>Arbitrum (42161)</option>
                    <option value={10}>Optimism (10)</option>
                  </select>
                </div>
                
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Safe Address</span>
                  </label>
                  <input
                    type="text"
                    value={newMultisig.address}
                    onChange={(e) => setNewMultisig({ ...newMultisig, address: e.target.value })}
                    placeholder="0x..."
                    className="input input-bordered w-full"
                    required
                  />
                </div>
                
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Name (Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={newMultisig.name}
                    onChange={(e) => setNewMultisig({ ...newMultisig, name: e.target.value })}
                    placeholder="My Safe"
                    className="input input-bordered w-full"
                  />
                </div>
              </div>
              
              <div className="modal-action">
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  Add Multisig
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddMultisig(false)}
                  className="btn btn-ghost"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Telegram Config Modal */}
      {showTelegramConfig && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">Configure Telegram Notifications</h3>
            <form onSubmit={handleUpdateNotifications}>
              <div className="space-y-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Chat ID</span>
                  </label>
                  <input
                    type="text"
                    value={telegramConfig.telegramChatId}
                    onChange={(e) => setTelegramConfig({ ...telegramConfig, telegramChatId: e.target.value })}
                    placeholder="-1001234567890"
                    className="input input-bordered w-full"
                    required
                  />
                </div>
              </div>
              
              <div className="modal-action">
                <button
                  type="submit"
                  className="btn btn-success"
                >
                  Save Settings
                </button>
                <button
                  type="button"
                  onClick={() => setShowTelegramConfig(false)}
                  className="btn btn-ghost"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
