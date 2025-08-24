'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { ConnectButton } from 'thirdweb/react';
import { client } from '@/lib/thirdweb-auth';

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

export default function DashboardPage() {
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
    telegramBotToken: '',
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
        setTelegramConfig({ telegramBotToken: '', telegramChatId: '' });
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please sign in to continue</h1>
          <p className="text-gray-600">You need to connect your wallet to access the dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-semibold text-gray-900">Multisig Alert Dashboard</h1>
            <div className="flex items-center gap-4">
              <ConnectButton client={client} />
              <button
                onClick={signOut}
                className="p-2 cursor-pointer text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
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
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setShowAddMultisig(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Add Multisig
            </button>
            <button
              onClick={() => {
                if (notificationSettings) {
                  setTelegramConfig({
                    telegramBotToken: notificationSettings.telegramBotToken || '',
                    telegramChatId: notificationSettings.telegramChatId || '',
                  });
                }
                setShowTelegramConfig(true);
              }}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              Configure Telegram
            </button>
            <button
              onClick={handleTestTelegram}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
            >
              Test Telegram
            </button>
            <button
              onClick={handleManualCheck}
              className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
            >
              Manual Check
            </button>
            
            {/* Test Transaction Type Buttons */}
            <button
              onClick={() => handleTestTransactionType('transfer')}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              title="Test transfer transaction notifications"
            >
              Test Transfer
            </button>
            
            <button
              onClick={() => handleTestTransactionType('approval')}
              className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
              title="Test approval transaction notifications"
            >
              Test Approval
            </button>
            
            <button
              onClick={() => handleTestTransactionType('contract')}
              className="px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              title="Test contract call notifications"
            >
              Test Contract
            </button>
          </div>
        </div>

        {/* Multisigs Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Your Multisigs</h2>
          
          {multisigs.length === 0 ? (
            <p className="text-gray-500">No multisigs configured yet. Add your first one to get started!</p>
          ) : (
            <div className="space-y-4">
              {multisigs.map((multisig) => (
                <div key={multisig.id} className="border rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {multisig.name || `Multisig ${multisig.address.slice(0, 6)}...${multisig.address.slice(-4)}`}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Chain ID: {multisig.chainId} | Address: {multisig.address}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={multisig.enabled}
                        onChange={(e) => handleUpdateMultisig(multisig.id, { enabled: e.target.checked })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-600">Enabled</span>
                    </label>
                    <button
                      onClick={() => handleDeleteMultisig(multisig.id)}
                      className="px-3 py-1 text-sm text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notification Settings Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Notification Settings</h2>
          
          {notificationSettings ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Telegram Bot Token</p>
                  <p className="font-mono text-sm">
                    {notificationSettings.telegramBotToken ? 
                      `${notificationSettings.telegramBotToken.slice(0, 10)}...` : 
                      'Not configured'
                    }
                  </p>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Telegram Chat ID</p>
                  <p className="font-mono text-sm">
                    {notificationSettings.telegramChatId || 'Not configured'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center">
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
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-600">Enable notifications</span>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">Notification settings not configured yet.</p>
          )}
        </div>
      </div>

      {/* Add Multisig Modal */}
      {showAddMultisig && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Multisig</h3>
            <form onSubmit={handleAddMultisig}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Chain ID</label>
                  <select
                    value={newMultisig.chainId}
                    onChange={(e) => setNewMultisig({ ...newMultisig, chainId: parseInt(e.target.value) })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value={1}>Ethereum (1)</option>
                    <option value={8453}>Base (8453)</option>
                    <option value={137}>Polygon (137)</option>
                    <option value={56}>BSC (56)</option>
                    <option value={42161}>Arbitrum (42161)</option>
                    <option value={10}>Optimism (10)</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Safe Address</label>
                  <input
                    type="text"
                    value={newMultisig.address}
                    onChange={(e) => setNewMultisig({ ...newMultisig, address: e.target.value })}
                    placeholder="0x..."
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name (Optional)</label>
                  <input
                    type="text"
                    value={newMultisig.name}
                    onChange={(e) => setNewMultisig({ ...newMultisig, name: e.target.value })}
                    placeholder="My Safe"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div className="mt-6 flex gap-3">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Add Multisig
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddMultisig(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Configure Telegram Notifications</h3>
            <form onSubmit={handleUpdateNotifications}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Bot Token</label>
                  <input
                    type="text"
                    value={telegramConfig.telegramBotToken}
                    onChange={(e) => setTelegramConfig({ ...telegramConfig, telegramBotToken: e.target.value })}
                    placeholder="123456:ABC..."
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Chat ID</label>
                  <input
                    type="text"
                    value={telegramConfig.telegramChatId}
                    onChange={(e) => setTelegramConfig({ ...telegramConfig, telegramChatId: e.target.value })}
                    placeholder="-1001234567890"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
              
              <div className="mt-6 flex gap-3">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                >
                  Save Settings
                </button>
                <button
                  type="button"
                  onClick={() => setShowTelegramConfig(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
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
