'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import Header from '@/components/Header';
import ToastDemo from '@/components/ToastDemo';
import { showToast } from '@/components/CustomToast';

interface User {
  id: string;
  walletAddress: string;
  name?: string | null;
  createdAt: string;
  updatedAt: string;
  multisigs: Multisig[];
  notifications?: NotificationSetting | null;
}

interface Multisig {
  id: string;
  userId: string;
  chainId: number;
  address: string;
  name?: string | null;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  transactions: SeenTransaction[];
}

interface NotificationSetting {
  id: string;
  userId: string;
  telegramBotToken?: string | null;
  telegramChatId?: string | null;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

interface SeenTransaction {
  id: string;
  multisigId: string;
  safeTxHash: string;
  firstSeen: string;
  lastChecked: string;
  confirmations: number;
  threshold: number;
  notified: boolean;
}

interface AdminStats {
  totalUsers: number;
  totalMultisigs: number;
  activeMultisigs: number;
  totalTransactions: number;
  recentTransactions: number;
  usersWithNotifications: number;
  systemHealth: {
    uptime: number;
    nodeVersion: string;
    platform: string;
    memoryUsage: {
      rss: number;
      heapTotal: number;
      heapUsed: number;
      external: number;
    };
  };
}

export default function AdminPage() {
  const { user, isLoading, signOut } = useAuth();
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [selectedView, setSelectedView] = useState<'overview' | 'users' | 'multisigs' | 'transactions' | 'toast'>('overview');

  // Load admin data
  useEffect(() => {
    if (user) {
      loadAdminData();
    }
  }, [user]);

  const loadAdminData = async () => {
    try {
      setIsLoadingData(true);
      
      // Fetch admin data from dedicated endpoints
      const [statsResponse, usersResponse, transactionsResponse] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/users'),
        fetch('/api/admin/transactions?limit=20')
      ]);

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData.stats);
      }

      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setUsers(usersData.users || []);
      }

      if (transactionsResponse.ok) {
        const transactionsData = await transactionsResponse.json();
        setTransactions(transactionsData.transactions || []);
      }

    } catch (error) {
      console.error('Error loading admin data:', error);
      showToast.error('Failed to load admin data');
    } finally {
      setIsLoadingData(false);
    }
  };

  if (isLoading || isLoadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <span className="loading loading-spinner loading-lg"></span>
          <p className="mt-4">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="opacity-70">You need to be signed in to access the admin panel.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen siggy-gradient-soft">
      <Header variant="dashboard" onSignOut={signOut} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Admin Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img 
              src="/images/siggy.png" 
              alt="Siggy the Admin" 
              className="w-16 h-16 bounce-gentle"
            />
          </div>
          <h1 className="text-3xl font-bold siggy-text-gradient-outlined mb-2 title-large">Admin Control Panel 🛠️</h1>
          <p className="text-lg opacity-80">Siggy's command center for system oversight</p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {[
            { key: 'overview', label: '📊 Overview', icon: '📊' },
            { key: 'users', label: '👥 Users', icon: '👥' },
            { key: 'multisigs', label: '🏠 Safes', icon: '🏠' },
            { key: 'transactions', label: '💸 Transactions', icon: '💸' },
            { key: 'toast', label: '🎨 Toast Demo', icon: '🎨' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSelectedView(tab.key as any)}
              className={`btn ${selectedView === tab.key ? 'btn-primary' : 'btn-outline'} hover-bounce`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Section */}
        {selectedView === 'overview' && stats && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="card-siggy hover-bounce">
                <div className="card-siggy-inner">
                  <div className="card-body text-center">
                    <div className="text-4xl mb-2">👥</div>
                    <h3 className="text-2xl font-bold siggy-text-gradient-outlined">{stats.totalUsers}</h3>
                    <p className="opacity-70">Total Users</p>
                  </div>
                </div>
              </div>

              <div className="card-siggy hover-bounce">
                <div className="card-siggy-inner">
                  <div className="card-body text-center">
                    <div className="text-4xl mb-2">🏠</div>
                    <h3 className="text-2xl font-bold siggy-text-gradient-outlined">{stats.totalMultisigs}</h3>
                    <p className="opacity-70">Total Safes</p>
                  </div>
                </div>
              </div>

              <div className="card-siggy hover-bounce">
                <div className="card-siggy-inner">
                  <div className="card-body text-center">
                    <div className="text-4xl mb-2">👁️</div>
                    <h3 className="text-2xl font-bold siggy-text-gradient-outlined">{stats.activeMultisigs}</h3>
                    <p className="opacity-70">Active Safes</p>
                  </div>
                </div>
              </div>

              <div className="card-siggy hover-bounce">
                <div className="card-siggy-inner">
                  <div className="card-body text-center">
                    <div className="text-4xl mb-2">💸</div>
                    <h3 className="text-2xl font-bold siggy-text-gradient-outlined">{stats.totalTransactions}</h3>
                    <p className="opacity-70">Total Transactions</p>
                  </div>
                </div>
              </div>

              <div className="card-siggy hover-bounce">
                <div className="card-siggy-inner">
                  <div className="card-body text-center">
                    <div className="text-4xl mb-2">🔔</div>
                    <h3 className="text-2xl font-bold siggy-text-gradient-outlined">{stats.usersWithNotifications}</h3>
                    <p className="opacity-70">Users with Notifications</p>
                  </div>
                </div>
              </div>

              <div className="card-siggy hover-bounce">
                <div className="card-siggy-inner">
                  <div className="card-body text-center">
                    <div className="text-4xl mb-2">⚡</div>
                    <h3 className="text-2xl font-bold siggy-text-gradient-outlined">{stats.recentTransactions}</h3>
                    <p className="opacity-70">Recent (24h)</p>
                  </div>
                </div>
              </div>
            </div>

            {/* System Health */}
            <div className="card-siggy hover-bounce mb-6">
              <div className="card-siggy-inner">
                <div className="card-body">
                  <h3 className="text-xl font-bold siggy-text-gradient-outlined mb-4">🖥️ System Health</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-base-100 rounded-xl p-4 text-center">
                      <div className="text-2xl mb-2">⏱️</div>
                      <p className="text-sm font-bold">Uptime</p>
                      <p className="text-xs opacity-70">
                        {Math.floor(stats.systemHealth.uptime / 3600)}h {Math.floor((stats.systemHealth.uptime % 3600) / 60)}m
                      </p>
                    </div>
                    <div className="bg-base-100 rounded-xl p-4 text-center">
                      <div className="text-2xl mb-2">🟢</div>
                      <p className="text-sm font-bold">Node.js</p>
                      <p className="text-xs opacity-70">{stats.systemHealth.nodeVersion}</p>
                    </div>
                    <div className="bg-base-100 rounded-xl p-4 text-center">
                      <div className="text-2xl mb-2">💾</div>
                      <p className="text-sm font-bold">Memory</p>
                      <p className="text-xs opacity-70">
                        {Math.round(stats.systemHealth.memoryUsage.heapUsed / 1024 / 1024)}MB used
                      </p>
                    </div>
                    <div className="bg-base-100 rounded-xl p-4 text-center">
                      <div className="text-2xl mb-2">🖥️</div>
                      <p className="text-sm font-bold">Platform</p>
                      <p className="text-xs opacity-70">{stats.systemHealth.platform}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="card-siggy hover-bounce">
              <div className="card-siggy-inner">
                <div className="card-body">
                  <h3 className="text-xl font-bold siggy-text-gradient-outlined mb-4">🚧 Admin Features Coming Soon</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-base-100 rounded-xl p-4">
                      <h4 className="font-bold mb-2">📊 Advanced Analytics</h4>
                      <p className="text-sm opacity-70">User activity, transaction patterns, and system health metrics</p>
                    </div>
                    <div className="bg-base-100 rounded-xl p-4">
                      <h4 className="font-bold mb-2">🔧 System Management</h4>
                      <p className="text-sm opacity-70">Configure monitoring intervals, manage notifications, and system settings</p>
                    </div>
                    <div className="bg-base-100 rounded-xl p-4">
                      <h4 className="font-bold mb-2">📈 Performance Monitoring</h4>
                      <p className="text-sm opacity-70">API response times, database performance, and error tracking</p>
                    </div>
                    <div className="bg-base-100 rounded-xl p-4">
                      <h4 className="font-bold mb-2">🛡️ Security Audit</h4>
                      <p className="text-sm opacity-70">Failed login attempts, suspicious activity, and security logs</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Users Section */}
        {selectedView === 'users' && (
          <div className="space-y-6">
            <div className="card-siggy hover-bounce">
              <div className="card-siggy-inner">
                <div className="card-body">
                  <h3 className="text-xl font-bold siggy-text-gradient-outlined mb-4">👥 User Management</h3>
                  
                  {users.length === 0 ? (
                    <div className="bg-base-100 rounded-xl p-6 text-center">
                      <div className="text-6xl mb-4">👥</div>
                      <p className="opacity-70">No users found or unable to load user data.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {users.map((user) => (
                        <div key={user.id} className="bg-base-100 rounded-xl p-4 hover:bg-base-200 transition-colors">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-4">
                              <div className="text-3xl">👤</div>
                              <div>
                                <h4 className="font-bold text-lg">{user.name || 'Unnamed User'}</h4>
                                <p className="text-sm opacity-70 font-mono">{user.walletAddress}</p>
                                <div className="flex gap-4 mt-2 text-xs opacity-60">
                                  <span>📅 Joined: {new Date(user.createdAt).toLocaleDateString()}</span>
                                  <span>🏠 Safes: {user.multisigs?.length || 0}</span>
                                  <span>🔔 Notifications: {user.notifications?.enabled ? '✅' : '❌'}</span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="badge badge-outline">
                                {user.multisigs?.filter(m => m.enabled).length || 0} active
                              </div>
                            </div>
                          </div>
                          
                          {user.multisigs && user.multisigs.length > 0 && (
                            <div className="mt-4 pl-12">
                              <h5 className="font-semibold mb-2 text-sm">User's Safes:</h5>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {user.multisigs.map((multisig) => (
                                  <div key={multisig.id} className="bg-base-200 rounded-lg p-2 text-xs">
                                    <div className="flex items-center justify-between">
                                      <span className="font-mono">
                                        {multisig.address.slice(0, 6)}...{multisig.address.slice(-4)}
                                      </span>
                                      <div className="flex items-center gap-1">
                                        <span className="badge badge-xs">Chain {multisig.chainId}</span>
                                        <span className={`badge badge-xs ${multisig.enabled ? 'badge-success' : 'badge-error'}`}>
                                          {multisig.enabled ? '👁️' : '😴'}
                                        </span>
                                      </div>
                                    </div>
                                    {multisig.name && (
                                      <div className="mt-1 opacity-70">{multisig.name}</div>
                                    )}
                                    <div className="mt-1 opacity-60">
                                      {multisig.transactions?.length || 0} transactions seen
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Multisigs Section */}
        {selectedView === 'multisigs' && (
          <div className="space-y-6">
            <div className="card-siggy hover-bounce">
              <div className="card-siggy-inner">
                <div className="card-body">
                  <h3 className="text-xl font-bold siggy-text-gradient-outlined mb-4">🏠 Safe Management</h3>
                  
                  {/* Chain Distribution */}
                  {users.length > 0 && (
                    <div className="mb-6">
                      <h4 className="font-bold mb-3">⛓️ Chain Distribution</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                        {(() => {
                          const chainCounts: { [key: number]: number } = {};
                          const chainNames: { [key: number]: string } = {
                            1: 'Ethereum',
                            8453: 'Base',
                            137: 'Polygon',
                            56: 'BSC',
                            42161: 'Arbitrum',
                            10: 'Optimism'
                          };
                          
                          users.forEach(user => {
                            user.multisigs?.forEach(multisig => {
                              chainCounts[multisig.chainId] = (chainCounts[multisig.chainId] || 0) + 1;
                            });
                          });
                          
                          return Object.entries(chainCounts).map(([chainId, count]) => (
                            <div key={chainId} className="bg-base-100 rounded-lg p-3 text-center">
                              <div className="text-lg mb-1">⛓️</div>
                              <div className="font-bold">{count}</div>
                              <div className="text-xs opacity-70">{chainNames[parseInt(chainId)] || `Chain ${chainId}`}</div>
                            </div>
                          ));
                        })()}
                      </div>
                    </div>
                  )}
                  
                  {/* All Safes List */}
                  {users.length === 0 ? (
                    <div className="bg-base-100 rounded-xl p-6 text-center">
                      <div className="text-6xl mb-4">🏠</div>
                      <p className="opacity-70">No safes found or unable to load safe data.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <h4 className="font-bold mb-3">📋 All Safes</h4>
                      {users.flatMap(user => 
                        user.multisigs?.map(multisig => ({ ...multisig, user })) || []
                      ).map((multisig) => (
                        <div key={multisig.id} className="bg-base-100 rounded-xl p-4 hover:bg-base-200 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="text-2xl">🏠</div>
                              <div>
                                <h5 className="font-bold">{multisig.name || `Safe ${multisig.address.slice(0, 6)}...${multisig.address.slice(-4)}`}</h5>
                                <p className="text-sm opacity-70 font-mono">{multisig.address}</p>
                                <div className="flex gap-4 mt-1 text-xs opacity-60">
                                  <span>⛓️ Chain {multisig.chainId}</span>
                                  <span>👤 Owner: {multisig.user.name || 'Unnamed'}</span>
                                  <span>📅 Added: {new Date(multisig.createdAt).toLocaleDateString()}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="badge badge-outline">
                                {multisig.transactions?.length || 0} txs
                              </div>
                              <div className={`badge ${multisig.enabled ? 'badge-success' : 'badge-error'}`}>
                                {multisig.enabled ? '👁️ Active' : '😴 Inactive'}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Transactions Section */}
        {selectedView === 'transactions' && (
          <div className="space-y-6">
            <div className="card-siggy hover-bounce">
              <div className="card-siggy-inner">
                <div className="card-body">
                  <h3 className="text-xl font-bold siggy-text-gradient-outlined mb-4">💸 Transaction Monitoring</h3>
                  
                  {transactions.length === 0 ? (
                    <div className="bg-base-100 rounded-xl p-6 text-center">
                      <div className="text-6xl mb-4">💸</div>
                      <p className="opacity-70">No transactions found yet.</p>
                      <p className="text-sm opacity-60 mt-2">Transactions will appear here as they are detected by Siggy.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <p className="text-sm opacity-70">Showing latest {transactions.length} transactions</p>
                        <button
                          onClick={loadAdminData}
                          className="btn btn-sm btn-outline hover-bounce"
                        >
                          🔄 Refresh
                        </button>
                      </div>
                      
                      <div className="overflow-x-auto">
                        <table className="table table-zebra w-full">
                          <thead>
                            <tr>
                              <th>Safe</th>
                              <th>Owner</th>
                              <th>Transaction Hash</th>
                              <th>Status</th>
                              <th>First Seen</th>
                              <th>Notified</th>
                            </tr>
                          </thead>
                          <tbody>
                            {transactions.map((tx) => (
                              <tr key={tx.id} className="hover">
                                <td>
                                  <div className="flex items-center gap-2">
                                    <span className="text-lg">🏠</span>
                                    <div>
                                      <div className="font-mono text-sm">
                                        {tx.multisig.address.slice(0, 6)}...{tx.multisig.address.slice(-4)}
                                      </div>
                                      <div className="text-xs opacity-60">
                                        Chain {tx.multisig.chainId}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td>
                                  <div className="text-sm">
                                    <div className="font-semibold">{tx.multisig.user.name || 'Unnamed'}</div>
                                    <div className="font-mono text-xs opacity-60">
                                      {tx.multisig.user.walletAddress.slice(0, 6)}...{tx.multisig.user.walletAddress.slice(-4)}
                                    </div>
                                  </div>
                                </td>
                                <td>
                                  <div className="font-mono text-sm">
                                    {tx.safeTxHash.slice(0, 8)}...{tx.safeTxHash.slice(-6)}
                                  </div>
                                </td>
                                <td>
                                  <div className="text-center">
                                    <div className="text-sm font-bold">
                                      {tx.confirmations}/{tx.threshold}
                                    </div>
                                    <div className="text-xs opacity-60">confirmations</div>
                                    {tx.confirmations >= tx.threshold && (
                                      <div className="badge badge-success badge-xs mt-1">✅ Ready</div>
                                    )}
                                  </div>
                                </td>
                                <td>
                                  <div className="text-sm">
                                    {new Date(tx.firstSeen).toLocaleDateString()}
                                  </div>
                                  <div className="text-xs opacity-60">
                                    {new Date(tx.firstSeen).toLocaleTimeString()}
                                  </div>
                                </td>
                                <td>
                                  <div className="text-center">
                                    {tx.notified ? (
                                      <span className="badge badge-success">✅ Sent</span>
                                    ) : (
                                      <span className="badge badge-warning">⏳ Pending</span>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Toast Demo Section */}
        {selectedView === 'toast' && (
          <div className="card-siggy hover-bounce">
            <div className="card-siggy-inner">
              <div className="card-body">
                <h3 className="text-xl font-bold siggy-text-gradient-outlined mb-4">🎨 Toast Notification Demo</h3>
                <ToastDemo />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
