'use client';

import { useState, useEffect } from 'react';
import { config, getChainConfig, formatAddress } from '@/config/env';

interface CheckResult {
  success: boolean;
  timestamp: string;
  newTransactions?: number;
  notificationsSent?: number;
  errors?: string[];
  error?: string;
}

interface SafeInfo {
  address: string;
  nonce: number;
  threshold: number;
  owners: string[];
  masterCopy: string;
  modules: string[];
  fallbackHandler: string;
  guard: string;
  version: string;
}

export default function Dashboard() {
  const [isChecking, setIsChecking] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [lastResult, setLastResult] = useState<CheckResult | null>(null);
  const [testResult, setTestResult] = useState<string>('');
  const [configLoaded, setConfigLoaded] = useState(false);
  const [safeInfo, setSafeInfo] = useState<SafeInfo | null>(null);
  const [loadingSafeInfo, setLoadingSafeInfo] = useState(false);

  useEffect(() => {
    // Load config on client side
    setConfigLoaded(true);
    
    // Fetch Safe info if address is configured
    if (config.safe.address) {
      fetchSafeInfo();
    }
  }, []);

  const fetchSafeInfo = async () => {
    setLoadingSafeInfo(true);
    try {
      const response = await fetch('/api/safe-info');
      const data = await response.json();
      if (data.success && data.data) {
        setSafeInfo(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch Safe info:', error);
    } finally {
      setLoadingSafeInfo(false);
    }
  };

  const handleManualCheck = async () => {
    setIsChecking(true);
    setLastResult(null);
    
    try {
      const response = await fetch('/api/cron/check-safe', {
        method: 'POST',
      });
      
      const data = await response.json();
      setLastResult(data);
    } catch (error) {
      setLastResult({
        success: false,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsChecking(false);
    }
  };

  const handleTestTelegram = async () => {
    setIsTesting(true);
    setTestResult('');
    
    try {
      const response = await fetch('/api/test-telegram', {
        method: 'POST',
      });
      
      const data = await response.json();
      setTestResult(data.message || (data.success ? 'Success!' : 'Failed'));
    } catch (error) {
      setTestResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsTesting(false);
    }
  };

  if (!configLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  const chainConfig = getChainConfig(config.safe.chainId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
          Safe Monitor Dashboard
        </h1>

        {/* Configuration Info */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8 shadow-xl">
          <h2 className="text-2xl font-semibold mb-4 text-blue-400">Configuration</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-gray-400">Safe Address:</p>
              <p className="font-mono text-sm break-all">{config.safe.address || 'Not configured'}</p>
            </div>
            <div>
              <p className="text-gray-400">Chain:</p>
              <p>{chainConfig.name} (ID: {config.safe.chainId})</p>
            </div>
            <div>
              <p className="text-gray-400">Telegram Bot:</p>
              <p>{config.telegram.botToken ? '✅ Configured' : '❌ Not configured'}</p>
            </div>
            <div>
              <p className="text-gray-400">Telegram Chat:</p>
              <p>{config.telegram.chatId || 'Not configured'}</p>
            </div>
          </div>
          
          {chainConfig.explorer && config.safe.address && (
            <div className="mt-4 pt-4 border-t border-gray-700">
              <a
                href={`${chainConfig.explorer}/address/${config.safe.address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 underline"
              >
                View Safe on {chainConfig.name} Explorer →
              </a>
            </div>
          )}
        </div>

        {/* Safe Info (from API Kit) */}
        {safeInfo && (
          <div className="bg-gray-800 rounded-lg p-6 mb-8 shadow-xl">
            <h2 className="text-2xl font-semibold mb-4 text-green-400">Safe Details (via API Kit)</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-gray-400">Current Nonce:</p>
                <p className="font-mono">{safeInfo.nonce}</p>
              </div>
              <div>
                <p className="text-gray-400">Threshold:</p>
                <p className="font-mono">{safeInfo.threshold} of {safeInfo.owners.length}</p>
              </div>
              <div>
                <p className="text-gray-400">Version:</p>
                <p className="font-mono">{safeInfo.version}</p>
              </div>
              <div>
                <p className="text-gray-400">Modules:</p>
                <p>{safeInfo.modules.length > 0 ? `${safeInfo.modules.length} active` : 'None'}</p>
              </div>
            </div>
            
            {safeInfo.owners.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-700">
                <p className="text-gray-400 mb-2">Owners:</p>
                <div className="space-y-1">
                  {safeInfo.owners.map((owner, index) => (
                    <p key={index} className="font-mono text-sm text-gray-300">
                      {index + 1}. {formatAddress(owner)}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {loadingSafeInfo && config.safe.address && (
          <div className="bg-gray-800 rounded-lg p-6 mb-8 shadow-xl">
            <p className="text-gray-400">Loading Safe information...</p>
          </div>
        )}

        {/* Actions */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8 shadow-xl">
          <h2 className="text-2xl font-semibold mb-4 text-purple-400">Actions</h2>
          
          <div className="space-y-4">
            <div>
              <button
                onClick={handleManualCheck}
                disabled={isChecking || !config.safe.address}
                className="w-full md:w-auto px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 rounded-lg font-semibold transition-all transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
              >
                {isChecking ? 'Checking...' : 'Check for New Transactions'}
              </button>
              
              {!config.safe.address && (
                <p className="text-red-400 text-sm mt-2">Configure SAFE_ADDRESS to enable</p>
              )}
            </div>

            <div>
              <button
                onClick={handleTestTelegram}
                disabled={isTesting || !config.telegram.botToken || !config.telegram.chatId}
                className="w-full md:w-auto px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 rounded-lg font-semibold transition-all transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
              >
                {isTesting ? 'Testing...' : 'Test Telegram Connection'}
              </button>
              
              {(!config.telegram.botToken || !config.telegram.chatId) && (
                <p className="text-red-400 text-sm mt-2">Configure Telegram credentials to enable</p>
              )}
              
              {testResult && (
                <p className={`mt-2 ${testResult.includes('Error') || testResult.includes('Failed') ? 'text-red-400' : 'text-green-400'}`}>
                  {testResult}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Results */}
        {lastResult && (
          <div className={`rounded-lg p-6 shadow-xl ${lastResult.success ? 'bg-green-900' : 'bg-red-900'}`}>
            <h2 className="text-2xl font-semibold mb-4">
              {lastResult.success ? '✅ Check Complete' : '❌ Check Failed'}
            </h2>
            
            <div className="space-y-2">
              <p>
                <span className="text-gray-300">Timestamp:</span>{' '}
                {new Date(lastResult.timestamp).toLocaleString()}
              </p>
              
              {lastResult.success && (
                <>
                  <p>
                    <span className="text-gray-300">New Transactions:</span>{' '}
                    {lastResult.newTransactions || 0}
                  </p>
                  <p>
                    <span className="text-gray-300">Notifications Sent:</span>{' '}
                    {lastResult.notificationsSent || 0}
                  </p>
                </>
              )}
              
              {lastResult.error && (
                <p className="text-red-300">
                  <span className="font-semibold">Error:</span> {lastResult.error}
                </p>
              )}
              
              {lastResult.errors && lastResult.errors.length > 0 && (
                <div>
                  <p className="text-yellow-300 font-semibold">Warnings:</p>
                  <ul className="list-disc list-inside text-yellow-200">
                    {lastResult.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Cron Status */}
        <div className="mt-8 bg-gray-800 rounded-lg p-6 shadow-xl">
          <h2 className="text-2xl font-semibold mb-4 text-green-400">Cron Schedule</h2>
          <p className="text-gray-300">
            The Safe monitor is configured to check for new transactions every 5 minutes when deployed to Vercel.
          </p>
          <p className="text-gray-400 text-sm mt-2">
            Schedule: */5 * * * * (every 5 minutes)
          </p>
        </div>
      </div>
    </div>
  );
}
