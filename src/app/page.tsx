'use client';

import { useAuth } from '@/components/providers/AuthProvider';
import { ConnectWalletButton } from '@/components/providers/AuthProvider';
import ThemeToggle from '@/components/ThemeToggle';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { HugeiconsIcon } from '@hugeicons/react';
import { Megaphone03Icon, MoneySafeIcon, WalletDone01Icon } from '@hugeicons/core-free-icons'

export default function HomePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && !isLoading) {
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <span className="loading loading-spinner loading-lg"></span>
          <p className="mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen siggy-gradient-soft">
      {/* Header */}
      <header className="bg-base-200/80 backdrop-blur-sm shadow-lg border-b-4 border-gradient">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-4">
              <img 
                src="/images/siggy.png" 
                alt="Siggy the Parrot" 
                className="w-12 h-12 hover-wiggle cursor-pointer"
              />
              <h1 className="text-2xl font-bold siggy-text-gradient-outlined title-medium">Siggy</h1>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <ConnectWalletButton />
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          {/* Siggy Hero Image */}
          <div className="flex justify-center mb-8">
            <img 
              src="/images/siggy.png" 
              alt="Siggy the Parrot" 
              className="w-32 h-32 md:w-48 md:h-48 hover-wiggle cursor-pointer"
            />
          </div>
          
          <h1 className="text-5xl font-bold sm:text-6xl md:text-7xl lg:text-8xl mb-6 title-hero">
            Meet{" "}
            <span className="siggy-text-gradient-outlined-thick">Siggy!</span>
          </h1>
          
          <h2 className="text-3xl font-bold sm:text-4xl md:text-5xl mb-8 title-large">
            Your Smart Multisig Guardian
          </h2>
          
          <p className="mt-6 max-w-3xl mx-auto text-xl md:text-2xl opacity-80 leading-relaxed tracking-tight">
            Siggy the Parrot keeps a watchful eye on your Gnosis Safe multisigs! 
            Get instant Telegram notifications when transactions need your signature. 
            Never miss an important transaction again! 🚀
          </p>
          
          <div className="mt-12 flex justify-center">
            <div className="hover-bounce">
              <ConnectWalletButton />
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="mt-24 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div className="card-siggy hover-bounce">
            <div className="card-siggy-inner">
              <div className="card-body p-8">
                <div className="text-6xl mb-6 text-center">🌈</div>
                <h3 className="card-title text-2xl mb-4 siggy-text-gradient-outlined title-medium">Multi-Chain Magic!</h3>
                <p className="text-lg tracking-tight">Siggy flies across all chains - Ethereum, Base, Polygon, and more! 
                No blockchain is too far for our feathered friend! ✨</p>
              </div>
            </div>
          </div>

          <div className="card-siggy hover-bounce">
            <div className="card-siggy-inner">
              <div className="card-body p-8">
                <div className="text-6xl mb-6 text-center">⚡</div>
                <h3 className="card-title text-2xl mb-4 siggy-text-gradient-outlined title-medium">Lightning Fast Alerts!</h3>
                <p className="text-lg tracking-tight">Siggy squawks instantly when transactions need your signature! 
                Get Telegram notifications faster than you can say "Pretty Polly!" 🚨</p>
              </div>
            </div>
          </div>

          <div className="card-siggy hover-bounce">
            <div className="card-siggy-inner">
              <div className="card-body p-8">
                <div className="text-6xl mb-6 text-center">🔐</div>
                <h3 className="card-title text-2xl mb-4 siggy-text-gradient-outlined title-medium">Safe & Secure!</h3>
                <p className="text-lg tracking-tight">Just connect your wallet - no passwords needed! 
                Siggy keeps your secrets safer than a bird's nest! 🛡️</p>
              </div>
            </div>
          </div>
        </div>

        {/* How it works */}
        <div className="mt-32">
          <h2 className="text-6xl font-bold text-center mb-4 siggy-text-gradient-outlined-thick title-large">How Siggy Works!</h2>
          <p className="text-center text-xl opacity-80 mb-16">Three simple steps to let Siggy guard your multisigs!</p>
          
          <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
            <div className="text-center hover-bounce">
              <div className="w-24 h-24 border-2 border-black dark:border-none siggy-gradient rounded-full flex items-center justify-center mx-auto mb-6 hover-wiggle">
                <span className="text-black font-bold text-3xl">
                  <HugeiconsIcon className="w-12 h-14 siggy-text-gradient-outlined" icon={WalletDone01Icon} />
                </span>
              </div>
              <h3 className="text-4xl font-bold mb-4 siggy-text-gradient-outlined title-medium">Connect Your Wallet</h3>
              <p className="text-lg opacity-80">Sign in with your wallet - Siggy speaks your blockchain language!</p>
            </div>

            <div className="text-center hover-bounce">
              <div className="w-24 h-24 border-2 border-black dark:border-none siggy-gradient rounded-full flex items-center justify-center mx-auto mb-6 hover-wiggle">
                <span className="text-black font-bold text-3xl">
                  <HugeiconsIcon className="w-12 h-14 siggy-text-gradient-outlined" icon={MoneySafeIcon} />
                </span>
              </div>
              <h3 className="text-4xl font-bold mb-4 siggy-text-gradient-outlined title-medium">Add Your Safes</h3>
              <p className="text-lg opacity-80">Tell Siggy which Safe addresses to watch. Our feathered friend never forgets!</p>
            </div>

            <div className="text-center hover-bounce">
              <div className="w-24 h-24 border-2 border-black dark:border-none siggy-gradient rounded-full flex items-center justify-center mx-auto mb-6 hover-wiggle">
                <span className="text-black font-bold text-3xl">
                  <HugeiconsIcon className="w-12 h-14 siggy-text-gradient-outlined" icon={Megaphone03Icon} />
                </span>
              </div>
              <h3 className="text-4xl font-bold mb-4 siggy-text-gradient-outlined title-medium">Get Squawked At!</h3>
              <p className="text-lg opacity-80">Siggy sends you instant Telegram alerts when signatures are needed!</p>
            </div>
          </div>
          
          <div className="text-center mt-16">
            <p className="text-2xl font-bold siggy-text-gradient mb-8">Ready to let Siggy guard your multisigs? 🚀</p>
            <div className="hover-bounce">
              <ConnectWalletButton />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}