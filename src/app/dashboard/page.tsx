'use client';

import { useState, useEffect } from 'react';
import { formatAddress } from '@/config/env';

interface CheckResult {
  success: boolean;
  timestamp: string;
  newTransactions?: number;
  notificationsSent?: number;
  errors?: string[];
  error?: string;
}

interface TelegramTestResult {
  success: boolean;
  message: string;
  tests?: {
    textMessage: string;
    ogImage: string;
  };
  imageError?: string;
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

interface ClientConfig {
  safe: {
    address: string;
    chainId: string;
    chainName: string;
    explorer: string;
  };
  telegram: {
    isConfigured: boolean;
    hasBotToken: boolean;
    hasChatId: boolean;
  };
  isFullyConfigured: boolean;
}

export default function Dashboard() {
  const [isChecking, setIsChecking] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isTestingOG, setIsTestingOG] = useState(false);
  const [lastResult, setLastResult] = useState<CheckResult | null>(null);
  const [testResult, setTestResult] = useState<TelegramTestResult | null>(null);
  const [ogTestResult, setOgTestResult] = useState<string>('');
  const [configLoaded, setConfigLoaded] = useState(false);
  const [clientConfig, setClientConfig] = useState<ClientConfig | null>(null);
  const [safeInfo, setSafeInfo] = useState<SafeInfo | null>(null);
  const [loadingSafeInfo, setLoadingSafeInfo] = useState(false);

  useEffect(() => {
    // Load configuration from server-side API
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/config');
      const data = await response.json();
      if (data.success) {
        setClientConfig(data.data);
        setConfigLoaded(true);
        
        // Fetch Safe info if address is configured
        if (data.data.safe.address) {
          fetchSafeInfo();
        }
      }
    } catch (error) {
      console.error('Failed to fetch configuration:', error);
      setConfigLoaded(true); // Still set loaded to show error state
    }
  };

  const fetchSafeInfo = async () => {
    if (!clientConfig?.safe.address) return;
    
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
    setTestResult(null);
    
    try {
      const response = await fetch('/api/test-telegram', {
        method: 'POST',
      });
      
      const data = await response.json();
      setTestResult(data);
    } catch (error) {
      setTestResult({
        success: false,
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleTestOGImage = async () => {
    setIsTestingOG(true);
    setOgTestResult('');
    
    try {
      const response = await fetch('/api/test-og');
      const data = await response.json();
      
      if (data.success) {
        setOgTestResult(data.ogImageUrl);
      } else {
        setOgTestResult('');
      }
    } catch (error) {
      console.error('Failed to test OG image:', error);
      setOgTestResult('');
    } finally {
      setIsTestingOG(false);
    }
  };

  if (!configLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!clientConfig) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-red-400">Failed to load configuration</div>
      </div>
    );
  }

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
              <p className="font-mono text-sm break-all">{clientConfig.safe.address || 'Not configured'}</p>
            </div>
            <div>
              <p className="text-gray-400">Chain:</p>
              <p>{clientConfig.safe.chainName} (ID: {clientConfig.safe.chainId})</p>
            </div>
            <div>
              <p className="text-gray-400">Telegram Bot:</p>
              <p>{clientConfig.telegram.hasBotToken ? '✅ Configured' : '❌ Not configured'}</p>
            </div>
            <div>
              <p className="text-gray-400">Telegram Chat:</p>
              <p>{clientConfig.telegram.hasChatId ? '✅ Configured' : '❌ Not configured'}</p>
            </div>
          </div>
          
          {clientConfig.safe.explorer && clientConfig.safe.address && (
            <div className="mt-4 pt-4 border-t border-gray-700">
              <a
                href={`${clientConfig.safe.explorer}/address/${clientConfig.safe.address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 underline"
              >
                View Safe on {clientConfig.safe.chainName} Explorer →
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

        {loadingSafeInfo && clientConfig.safe.address && (
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
                disabled={isChecking || !clientConfig.safe.address}
                className="w-full md:w-auto px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 rounded-lg font-semibold transition-all transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
              >
                {isChecking ? 'Checking...' : 'Check for New Transactions'}
              </button>
              
              {!clientConfig.safe.address && (
                <p className="text-red-400 text-sm mt-2">Configure SAFE_ADDRESS to enable</p>
              )}
            </div>

            <div>
              <button
                onClick={handleTestTelegram}
                disabled={isTesting || !clientConfig.telegram.isConfigured}
                className="w-full md:w-auto px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 rounded-lg font-semibold transition-all transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
              >
                {isTesting ? 'Testing...' : 'Test Telegram Connection'}
              </button>
              
              {!clientConfig.telegram.isConfigured && (
                <p className="text-red-400 text-sm mt-2">Configure Telegram credentials to enable</p>
              )}
              
              {testResult && (
                <div className="mt-2">
                  <p className={`${testResult.success ? 'text-green-400' : 'text-red-400'}`}>
                    {testResult.message}
                  </p>
                  {testResult.tests && (
                    <div className="mt-2 text-sm">
                      <p className="text-gray-300">Test Results:</p>
                      <ul className="list-disc list-inside text-gray-400 ml-2">
                        <li>Text Message: <span className={testResult.tests.textMessage === 'Passed' ? 'text-green-400' : 'text-red-400'}>{testResult.tests.textMessage}</span></li>
                        <li>OG Image: <span className={testResult.tests.ogImage === 'Passed' ? 'text-green-400' : 'text-red-400'}>{testResult.tests.ogImage}</span></li>
                      </ul>
                      {testResult.imageError && (
                        <p className="text-yellow-400 text-xs mt-1">Image Error: {testResult.imageError}</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <button
                onClick={handleTestOGImage}
                disabled={isTestingOG}
                className="w-full md:w-auto px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-600 disabled:to-gray-700 rounded-lg font-semibold transition-all transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
              >
                {isTestingOG ? 'Testing...' : 'Test OG Image Generation'}
              </button>
              
              {ogTestResult && (
                <div className="mt-2">
                  <p className="text-green-400 text-sm mb-2">OG Image generated successfully!</p>
                  <a
                    href={ogTestResult}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 underline text-sm"
                  >
                    View Generated Image →
                  </a>
                </div>
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
