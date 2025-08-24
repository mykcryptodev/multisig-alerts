'use client';

import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface Multisig {
  id: string;
  chainId: number;
  address: string;
  name: string | null;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

interface NotificationSettings {
  telegramBotToken: string | null;
  telegramChatId: string | null;
  enabled: boolean;
}

const CHAIN_NAMES: Record<number, string> = {
  1: 'Ethereum',
  10: 'Optimism',
  137: 'Polygon',
  8453: 'Base',
  42161: 'Arbitrum',
};

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [multisigs, setMultisigs] = useState<Multisig[]>([]);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings | null>(null);
  const [showAddMultisig, setShowAddMultisig] = useState(false);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [checkingTransactions, setCheckingTransactions] = useState(false);

  // Form states
  const [newMultisig, setNewMultisig] = useState({
    chainId: '1',
    address: '',
    name: '',
  });
  const [notificationForm, setNotificationForm] = useState({
    telegramBotToken: '',
    telegramChatId: '',
    enabled: true,
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  // Load data
  useEffect(() => {
    if (session?.user) {
      loadMultisigs();
      loadNotificationSettings();
    }
  }, [session]);

  const loadMultisigs = async () => {
    try {
      const res = await fetch('/api/multisigs');
      if (res.ok) {
        const data = await res.json();
        setMultisigs(data);
      }
    } catch (error) {
      console.error('Error loading multisigs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadNotificationSettings = async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotificationSettings(data);
        setNotificationForm({
          telegramBotToken: data.telegramBotToken || '',
          telegramChatId: data.telegramChatId || '',
          enabled: data.enabled ?? true,
        });
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    }
  };

  const handleAddMultisig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/multisigs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMultisig),
      });

      if (res.ok) {
        await loadMultisigs();
        setShowAddMultisig(false);
        setNewMultisig({ chainId: '1', address: '', name: '' });
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to add multisig');
      }
    } catch (error) {
      alert('Failed to add multisig');
    }
  };

  const handleToggleMultisig = async (id: string, enabled: boolean) => {
    try {
      const res = await fetch(`/api/multisigs/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      });

      if (res.ok) {
        await loadMultisigs();
      }
    } catch (error) {
      console.error('Error toggling multisig:', error);
    }
  };

  const handleDeleteMultisig = async (id: string) => {
    if (!confirm('Are you sure you want to delete this multisig?')) return;

    try {
      const res = await fetch(`/api/multisigs/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        await loadMultisigs();
      }
    } catch (error) {
      console.error('Error deleting multisig:', error);
    }
  };

  const handleSaveNotifications = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notificationForm),
      });

      if (res.ok) {
        await loadNotificationSettings();
        setShowNotificationSettings(false);
        alert('Notification settings saved!');
      }
    } catch (error) {
      alert('Failed to save notification settings');
    }
  };

  const handleTestNotifications = async () => {
    try {
      const res = await fetch('/api/notifications/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegramBotToken: notificationForm.telegramBotToken,
          telegramChatId: notificationForm.telegramChatId,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        alert('Test notification sent successfully!');
      } else {
        alert(data.error || 'Failed to send test notification');
      }
    } catch (error) {
      alert('Failed to send test notification');
    }
  };

  const handleCheckTransactions = async () => {
    setCheckingTransactions(true);
    try {
      const res = await fetch('/api/cron/check-safe', {
        method: 'POST',
      });

      const data = await res.json();
      if (res.ok) {
        alert(`Check complete! Found ${data.totalNewTransactions} new transactions, sent ${data.totalNotificationsSent} notifications.`);
      } else {
        alert('Failed to check transactions');
      }
    } catch (error) {
      alert('Failed to check transactions');
    } finally {
      setCheckingTransactions(false);
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Multisig Alert Dashboard</h1>
              <p className="text-gray-600 mt-1">Welcome, {session.user.email}</p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={handleCheckTransactions}
                disabled={checkingTransactions}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {checkingTransactions ? 'Checking...' : 'Check All Transactions'}
              </button>
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <button
            onClick={() => setShowAddMultisig(true)}
            className="p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow text-left"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0 p-3 bg-blue-500 rounded-md">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Add Multisig</h3>
                <p className="text-gray-500">Add a new Safe multisig to monitor</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setShowNotificationSettings(true)}
            className="p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow text-left"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0 p-3 bg-purple-500 rounded-md">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Notification Settings</h3>
                <p className="text-gray-500">Configure Telegram notifications</p>
              </div>
            </div>
          </button>
        </div>

        {/* Multisigs List */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Your Multisigs</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {multisigs.length === 0 ? (
              <div className="px-6 py-12 text-center text-gray-500">
                No multisigs added yet. Add your first multisig to get started!
              </div>
            ) : (
              multisigs.map((multisig) => (
                <div key={multisig.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">
                        {multisig.name || 'Unnamed Multisig'}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {CHAIN_NAMES[multisig.chainId] || `Chain ${multisig.chainId}`} • {multisig.address}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={multisig.enabled}
                          onChange={(e) => handleToggleMultisig(multisig.id, e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
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
                </div>
              ))
            )}
          </div>
        </div>

        {/* Add Multisig Modal */}
        {showAddMultisig && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Add New Multisig</h2>
              <form onSubmit={handleAddMultisig}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Chain</label>
                    <select
                      value={newMultisig.chainId}
                      onChange={(e) => setNewMultisig({ ...newMultisig, chainId: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    >
                      {Object.entries(CHAIN_NAMES).map(([id, name]) => (
                        <option key={id} value={id}>{name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Safe Address</label>
                    <input
                      type="text"
                      value={newMultisig.address}
                      onChange={(e) => setNewMultisig({ ...newMultisig, address: e.target.value })}
                      placeholder="0x..."
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name (optional)</label>
                    <input
                      type="text"
                      value={newMultisig.name}
                      onChange={(e) => setNewMultisig({ ...newMultisig, name: e.target.value })}
                      placeholder="My Safe"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                </div>
                <div className="mt-6 flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Add Multisig
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddMultisig(false)}
                    className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Notification Settings Modal */}
        {showNotificationSettings && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Telegram Notification Settings</h2>
              <form onSubmit={handleSaveNotifications}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Bot Token</label>
                    <input
                      type="text"
                      value={notificationForm.telegramBotToken}
                      onChange={(e) => setNotificationForm({ ...notificationForm, telegramBotToken: e.target.value })}
                      placeholder="123456:ABC-DEF1234..."
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                    <p className="mt-1 text-xs text-gray-500">Get from @BotFather on Telegram</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Chat ID</label>
                    <input
                      type="text"
                      value={notificationForm.telegramChatId}
                      onChange={(e) => setNotificationForm({ ...notificationForm, telegramChatId: e.target.value })}
                      placeholder="-100XXXXXXXXXX"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                    <p className="mt-1 text-xs text-gray-500">Your group or channel ID</p>
                  </div>
                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={notificationForm.enabled}
                        onChange={(e) => setNotificationForm({ ...notificationForm, enabled: e.target.checked })}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">Enable notifications</span>
                    </label>
                  </div>
                </div>
                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={handleTestNotifications}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Test
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Save Settings
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNotificationSettings(false)}
                    className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
