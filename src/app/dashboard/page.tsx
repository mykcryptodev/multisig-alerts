'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import Header from '@/components/Header';

import { showToast } from '@/components/CustomToast';
import { toast } from 'react-toastify';
import { HugeiconsIcon } from '@hugeicons/react';
import { MoneySafeIcon } from '@hugeicons/core-free-icons';

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
  const [showTestAlertModal, setShowTestAlertModal] = useState(false);
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
      showToast.error('Failed to load user data');
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleAddMultisig = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Show pending toast
    const pendingToast = showToast.pending('Adding multisig...');
    
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
        // Close pending toast and show success
        toast.dismiss(pendingToast);
        showToast.success('Multisig added successfully!');
      } else {
        const error = await response.json();
        // Close pending toast and show error
        toast.dismiss(pendingToast);
        showToast.error(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error adding multisig:', error);
      // Close pending toast and show error
      toast.dismiss(pendingToast);
      showToast.error('Failed to add multisig');
    }
  };

  const handleUpdateMultisig = async (id: string, updates: Partial<Multisig>) => {
    // Show pending toast
    const pendingToast = showToast.pending('Updating multisig...');
    
    try {
      const response = await fetch(`/api/multisigs/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      
      if (response.ok) {
        loadUserData();
        // Close pending toast and show success
        toast.dismiss(pendingToast);
        showToast.success('Multisig updated successfully!');
      } else {
        const error = await response.json();
        // Close pending toast and show error
        toast.dismiss(pendingToast);
        showToast.error(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error updating multisig:', error);
      // Close pending toast and show error
      toast.dismiss(pendingToast);
      showToast.error('Failed to update multisig');
    }
  };

  const handleDeleteMultisig = async (id: string) => {
    if (!confirm('Are you sure you want to delete this multisig?')) return;
    
    // Show pending toast
    const pendingToast = showToast.pending('Deleting multisig...');
    
    try {
      const response = await fetch(`/api/multisigs/${id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        loadUserData();
        // Close pending toast and show success
        toast.dismiss(pendingToast);
        showToast.success('Multisig deleted successfully!');
      } else {
        const error = await response.json();
        // Close pending toast and show error
        toast.dismiss(pendingToast);
        showToast.error(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error deleting multisig:', error);
      // Close pending toast and show error
      toast.dismiss(pendingToast);
      showToast.error('Failed to delete multisig');
    }
  };

  const handleUpdateNotifications = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Show pending toast
    const pendingToast = showToast.pending('Updating notification settings...');
    
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
        // Close pending toast and show success
        toast.dismiss(pendingToast);
        showToast.success('Notification settings updated successfully!');
      } else {
        const error = await response.json();
        // Close pending toast and show error
        toast.dismiss(pendingToast);
        showToast.error(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error updating notifications:', error);
      // Close pending toast and show error
      toast.dismiss(pendingToast);
      showToast.error('Failed to update notification settings');
    }
  };

  const handleTestTelegram = async () => {
    // Show pending toast
    const pendingToast = showToast.pending('Testing Telegram notification...');
    
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: true }),
      });
      
      if (response.ok) {
        // Close pending toast and show success
        toast.dismiss(pendingToast);
        showToast.success('Test message sent successfully!');
      } else {
        const error = await response.json();
        // Close pending toast and show error
        toast.dismiss(pendingToast);
        showToast.error(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error testing Telegram:', error);
      // Close pending toast and show error
      toast.dismiss(pendingToast);
      showToast.error('Failed to send test message');
    }
  };

  const handleManualCheck = async () => {
    // Show pending toast
    const pendingToast = showToast.pending('Performing manual check...');
    
    try {
      const response = await fetch('/api/cron/check-safe', {
        method: 'POST',
      });
      
      if (response.ok) {
        // Close pending toast and show success
        toast.dismiss(pendingToast);
        showToast.success('Manual check completed!');
      } else {
        const error = await response.json();
        // Close pending toast and show error
        toast.dismiss(pendingToast);
        showToast.error(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error with manual check:', error);
      // Close pending toast and show error
      toast.dismiss(pendingToast);
      showToast.error('Failed to perform manual check');
    }
  };

  const handleTestTransactionType = async (transactionType: 'transfer' | 'approval' | 'contract') => {
    // Show pending toast
    const pendingToast = showToast.pending(`Testing ${transactionType} transaction...`);
    
    try {
      const response = await fetch('/api/test-transaction-type', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionType }),
      });
      
      if (response.ok) {
        const result = await response.json();
        // Close pending toast and show success
        toast.dismiss(pendingToast);
        showToast.success(`${result.message}`);
      } else {
        const error = await response.json();
        // Close pending toast and show error
        toast.dismiss(pendingToast);
        showToast.error(`Error: ${error.error || error.message}`);
      }
    } catch (error) {
      console.error(`Error testing ${transactionType} transaction:`, error);
      // Close pending toast and show error
      toast.dismiss(pendingToast);
      showToast.error(`Failed to test ${transactionType} transaction`);
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
    <div className="min-h-screen siggy-gradient-soft">
      <Header variant="dashboard" onSignOut={signOut} />

      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-8">
        {/* Quick Actions */}
        <div className="mb-12">
          <h3 className="text-2xl sm:text-4xl font-bold siggy-text-gradient-outlined mb-6 text-center title-medium">Quick Actions</h3>
          <div className="grid grid-cols-2 lg:grid-cols-2 gap-3 sm:gap-6 max-w-2xl mx-auto mb-6">
            <button
              onClick={() => setShowAddMultisig(true)}
              className="btn-quick-action hover-bounce flex flex-col items-center gap-2 sm:gap-3 p-3 sm:p-6 h-auto"
            >
              <img src="/images/add.png" alt="Safe" className="w-20 h-20 sm:w-32 sm:h-32 lg:w-44 lg:h-44 mb-2 sm:mb-6 hover-wiggle mx-auto" />
              <span className="text-sm sm:text-lg lg:text-xl font-semibold text-center">Add Safe</span>
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
              className="btn-quick-action hover-bounce flex flex-col items-center gap-2 sm:gap-3 p-3 sm:p-6 h-auto"
            >
              <img src="/images/plug.png" alt="Safe" className="w-20 h-20 sm:w-32 sm:h-32 lg:w-44 lg:h-44 mb-2 sm:mb-6 hover-wiggle mx-auto" />
              <span className="text-sm sm:text-lg lg:text-xl font-semibold text-center">Setup Telegram</span>
            </button>
            <button
              onClick={() => setShowTestAlertModal(true)}
              className="btn-quick-action hover-bounce flex flex-col items-center gap-2 sm:gap-3 p-3 sm:p-6 h-auto"
            >
              <img src="/images/scientist.png" alt="Safe" className="w-20 h-20 sm:w-32 sm:h-32 lg:w-44 lg:h-44 mb-2 sm:mb-6 hover-wiggle mx-auto" />
              <span className="text-sm sm:text-lg lg:text-xl font-semibold text-center">Test Alert</span>
            </button>
            <button
              onClick={handleManualCheck}
              className="btn-quick-action hover-bounce flex flex-col items-center gap-2 sm:gap-3 p-3 sm:p-6 h-auto"
            >
              <img src="/images/check.png" alt="Safe" className="w-20 h-20 sm:w-32 sm:h-32 lg:w-44 lg:h-44 mb-2 sm:mb-6 hover-wiggle mx-auto" />
              <span className="text-sm sm:text-lg lg:text-xl font-semibold text-center">Manual Check</span>
            </button>
          </div>
        </div>



        {/* Multisigs Section */}
        <div className="card-siggy hover-bounce mb-8">
          <div className="card-siggy-inner">
            <div className="card-body">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl sm:text-3xl">🏠</span>
                <h2 className="text-2xl sm:text-4xl font-bold siggy-text-gradient-outlined title-medium">Your Safe Houses</h2>
              </div>
              
              {multisigs.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">🦜</div>
                <p className="text-lg opacity-70">No Safe houses under Siggy's watch yet!</p>
                <p className="text-sm opacity-60 mt-2">Add your first Safe to get started! 🏠</p>
              </div>
            ) : (
              <div className="space-y-4">
                {multisigs.map((multisig) => (
                  <div key={multisig.id} className="bg-base-100 rounded-2xl border-2 border-transparent hover:border-gradient p-4 hover-bounce">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <span className="text-2xl flex-shrink-0">🏠</span>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-bold text-lg truncate">
                            {multisig.name || `Safe ${multisig.address.slice(0, 6)}...${multisig.address.slice(-4)}`}
                          </h3>
                          <div className="text-sm opacity-70 space-y-1">
                            <p>⛓️ Chain {multisig.chainId}</p>
                            <p className="break-all font-mono text-xs">📍 {multisig.address}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-shrink-0">
                        <label className="label cursor-pointer hover-wiggle flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={multisig.enabled}
                            onChange={(e) => handleUpdateMultisig(multisig.id, { enabled: e.target.checked })}
                            className="checkbox checkbox-primary"
                          />
                          <span className="label-text font-medium text-sm">
                            {multisig.enabled ? '👁️ Watching' : '😴 Sleeping'}
                          </span>
                        </label>
                        <button
                          onClick={() => handleDeleteMultisig(multisig.id)}
                          className="btn btn-ghost btn-sm text-error hover-wiggle"
                        >
                          🗑️ Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              )}
            </div>
          </div>
        </div>

        {/* Notification Settings Section */}
        <div className="card-siggy hover-bounce">
          <div className="card-siggy-inner">
            <div className="card-body">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl sm:text-3xl">📱</span>
                <h2 className="text-2xl sm:text-4xl font-bold siggy-text-gradient-outlined title-medium">Communication Settings</h2>
              </div>
              
              {notificationSettings ? (
              <div className="space-y-6">
                <div className="bg-base-100 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">🤖</span>
                    <p className="font-bold">Bot Token</p>
                  </div>
                  <p className="font-mono text-sm opacity-70">
                    {notificationSettings.telegramBotToken ? 
                      `${notificationSettings.telegramBotToken.slice(0, 10)}...` : 
                      '❌ Not configured'
                    }
                  </p>
                </div>
                
                <div className="bg-base-100 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">💬</span>
                    <p className="font-bold">Chat ID</p>
                  </div>
                  <p className="font-mono text-sm opacity-70">
                    {notificationSettings.telegramChatId || '❌ Not configured'}
                  </p>
                </div>
                
                <div className="bg-base-100 rounded-xl p-4">
                  <label className="label cursor-pointer hover-wiggle">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{notificationSettings.enabled ? '🔔' : '🔕'}</span>
                      <span className="label-text font-bold">
                        {notificationSettings.enabled ? 'Siggy is squawking!' : 'Siggy is quiet...'}
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={notificationSettings.enabled}
                      onChange={async (e) => {
                        // Show pending toast
                        const pendingToast = showToast.pending('Updating notification status...');
                        
                        try {
                          const response = await fetch('/api/notifications', {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ enabled: e.target.checked }),
                          });
                          
                          if (response.ok) {
                            await loadUserData();
                            // Close pending toast and show success
                            toast.dismiss(pendingToast);
                            showToast.success(`Siggy is now ${e.target.checked ? 'watching and ready to squawk! 🦜' : 'taking a quiet nap... 😴'}`);
                          } else {
                            const error = await response.json();
                            // Close pending toast and show error
                            toast.dismiss(pendingToast);
                            showToast.error(`Error: ${error.error}`);
                          }
                        } catch (error) {
                          console.error('Error updating notification status:', error);
                          // Close pending toast and show error
                          toast.dismiss(pendingToast);
                          showToast.error('Failed to update notification status');
                        }
                      }}
                      className="checkbox checkbox-primary"
                    />
                  </label>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">📱</div>
                <p className="text-lg opacity-70">Siggy needs to learn how to reach you!</p>
                <p className="text-sm opacity-60 mt-2">Configure Telegram to get started! 🚀</p>
              </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Multisig Modal */}
      {showAddMultisig && (
        <div className="modal modal-open">
          <div className="modal-box siggy-gradient rounded-3xl max-w-sm sm:max-w-lg mx-4">
            <div className="bg-base-100 rounded-2xl p-4 sm:p-6 m-1">
              <div className="flex flex-col items-center gap-3 mb-6">
                <img src="/images/add.png" alt="Safe" className="w-20 h-20 sm:w-32 sm:h-32 lg:w-44 lg:h-44 mb-2 sm:mb-6 hover-wiggle mx-auto" />
                <h3 className="font-bold text-lg sm:text-2xl title-medium">Add New Safe</h3>
              </div>
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
              
              <div className="modal-action flex items-center gap-2 justify-between">
                <button
                  type="button"
                  onClick={() => setShowAddMultisig(false)}
                  className="btn btn-ghost hover-wiggle"
                >
                  ❌ Cancel
                </button>
                <button
                  type="submit"
                  className="btn-siggy hover-bounce flex items-center gap-2"
                >
                  <HugeiconsIcon icon={MoneySafeIcon} />
                  Add Safe
                </button>
              </div>
            </form>
            </div>
          </div>
        </div>
      )}

      {/* Telegram Config Modal */}
      {showTelegramConfig && (
        <div className="modal modal-open">
          <div className="modal-box siggy-gradient rounded-3xl max-w-sm sm:max-w-lg mx-4">
            <div className="bg-base-100 rounded-2xl p-4 sm:p-6 m-1">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-2xl sm:text-4xl">📱</span>
                <h3 className="font-bold text-lg sm:text-2xl siggy-text-gradient-outlined title-medium">Teach Siggy to Squawk!</h3>
              </div>
            <form onSubmit={handleUpdateNotifications}>
              <div className="space-y-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Bot Token</span>
                  </label>
                  <input
                    type="text"
                    value={telegramConfig.telegramBotToken}
                    onChange={(e) => setTelegramConfig({ ...telegramConfig, telegramBotToken: e.target.value })}
                    placeholder="123456:ABC..."
                    className="input input-bordered w-full"
                    required
                  />
                </div>
                
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
              
              <div className="modal-action flex items-center gap-2 justify-between">
                <button
                  type="button"
                  onClick={() => setShowTelegramConfig(false)}
                  className="btn btn-ghost hover-wiggle"
                >
                  ❌ Cancel
                </button>
                <button
                  type="submit"
                  className="btn-siggy hover-bounce"
                >
                  Teach Siggy
                </button>
              </div>
            </form>
            </div>
          </div>
        </div>
      )}

      {/* Test Alert Modal */}
      {showTestAlertModal && (
        <div className="modal modal-open">
          <div className="modal-box siggy-gradient rounded-3xl max-w-sm sm:max-w-lg mx-4">
            <div className="bg-base-100 rounded-2xl p-4 sm:p-6 m-1">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-2xl sm:text-4xl">🧪</span>
                <h3 className="font-bold text-lg sm:text-2xl siggy-text-gradient-outlined title-medium">Test Your Alert!</h3>
              </div>
              <p className="text-sm opacity-70 mb-4">Choose how you'd like to test your alert:</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleTestTelegram}
                  className="btn btn-sm btn-outline hover-wiggle"
                  title="Test Telegram notification"
                >
                 🔌 Connection
                </button>
                <button
                  onClick={() => handleTestTransactionType('transfer')}
                  className="btn btn-sm btn-outline hover-wiggle"
                  title="Test transfer transaction notifications"
                >
                  💸 Transfer
                </button>
                <button
                  onClick={() => handleTestTransactionType('approval')}
                  className="btn btn-sm btn-outline hover-wiggle"
                  title="Test approval transaction notifications"
                >
                  ✅ Approval
                </button>
                <button
                  onClick={() => handleTestTransactionType('contract')}
                  className="btn btn-sm btn-outline hover-wiggle"
                  title="Test contract call notifications"
                >
                  📝 Contract
                </button>
              </div>
              <div className="modal-action flex items-center gap-2 justify-between mt-6">
                <button
                  type="button"
                  onClick={() => setShowTestAlertModal(false)}
                  className="btn btn-ghost hover-wiggle"
                >
                  ❌ Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
