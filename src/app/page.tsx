import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Safe Monitor
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              Automated Gnosis Safe transaction monitoring with Telegram notifications
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                href="/dashboard"
                className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-lg font-semibold transition-all transform hover:scale-105 inline-block"
              >
                Open Dashboard
              </Link>
              <a
                href="/SETUP.md"
                className="px-8 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition-all inline-block"
              >
                View Setup Guide
              </a>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 gap-8 mb-16">
            <div className="bg-gray-800 p-6 rounded-lg shadow-xl">
              <div className="text-3xl mb-4">🔔</div>
              <h3 className="text-xl font-semibold mb-2 text-blue-400">Real-time Notifications</h3>
              <p className="text-gray-300">
                Get instant Telegram alerts when your Safe has new transactions requiring signatures
              </p>
            </div>

            <div className="bg-gray-800 p-6 rounded-lg shadow-xl">
              <div className="text-3xl mb-4">⏰</div>
              <h3 className="text-xl font-semibold mb-2 text-purple-400">Automated Monitoring</h3>
              <p className="text-gray-300">
                Runs on Vercel cron jobs, checking for new transactions every 5 minutes
              </p>
            </div>

            <div className="bg-gray-800 p-6 rounded-lg shadow-xl">
              <div className="text-3xl mb-4">💾</div>
              <h3 className="text-xl font-semibold mb-2 text-green-400">Persistent Storage</h3>
              <p className="text-gray-300">
                Uses Vercel KV to track seen transactions and prevent duplicate notifications
              </p>
            </div>

            <div className="bg-gray-800 p-6 rounded-lg shadow-xl">
              <div className="text-3xl mb-4">🎛️</div>
              <h3 className="text-xl font-semibold mb-2 text-pink-400">Web Dashboard</h3>
              <p className="text-gray-300">
                Monitor status, manually trigger checks, and test your configuration
              </p>
            </div>
          </div>

          {/* How It Works */}
          <div className="bg-gray-800 rounded-lg p-8 shadow-xl mb-16">
            <h2 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              How It Works
            </h2>
            
            <ol className="space-y-4">
              <li className="flex items-start">
                <span className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center font-bold mr-4">1</span>
                <div>
                  <h4 className="font-semibold mb-1">Monitor Safe</h4>
                  <p className="text-gray-300">Vercel cron job polls the Safe Client API every 5 minutes for pending transactions</p>
                </div>
              </li>
              
              <li className="flex items-start">
                <span className="flex-shrink-0 w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center font-bold mr-4">2</span>
                <div>
                  <h4 className="font-semibold mb-1">Detect New Transactions</h4>
                  <p className="text-gray-300">Identifies transactions that need signatures and haven't been seen before</p>
                </div>
              </li>
              
              <li className="flex items-start">
                <span className="flex-shrink-0 w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center font-bold mr-4">3</span>
                <div>
                  <h4 className="font-semibold mb-1">Send Notifications</h4>
                  <p className="text-gray-300">Sends formatted message to your Telegram group with transaction details</p>
                </div>
              </li>
              
              <li className="flex items-start">
                <span className="flex-shrink-0 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center font-bold mr-4">4</span>
                <div>
                  <h4 className="font-semibold mb-1">Sign Transaction</h4>
                  <p className="text-gray-300">Click the link in the notification to sign directly in the Safe app</p>
                </div>
              </li>
            </ol>
          </div>

          {/* Supported Chains */}
          <div className="bg-gray-800 rounded-lg p-8 shadow-xl">
            <h2 className="text-2xl font-bold mb-4 text-center">Supported Chains</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
              <div className="bg-gray-700 p-3 rounded">
                <div className="font-semibold">Ethereum</div>
                <div className="text-sm text-gray-400">Chain ID: 1</div>
              </div>
              <div className="bg-gray-700 p-3 rounded">
                <div className="font-semibold">Base</div>
                <div className="text-sm text-gray-400">Chain ID: 8453</div>
              </div>
              <div className="bg-gray-700 p-3 rounded">
                <div className="font-semibold">Polygon</div>
                <div className="text-sm text-gray-400">Chain ID: 137</div>
              </div>
              <div className="bg-gray-700 p-3 rounded">
                <div className="font-semibold">Arbitrum</div>
                <div className="text-sm text-gray-400">Chain ID: 42161</div>
              </div>
              <div className="bg-gray-700 p-3 rounded">
                <div className="font-semibold">Optimism</div>
                <div className="text-sm text-gray-400">Chain ID: 10</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}