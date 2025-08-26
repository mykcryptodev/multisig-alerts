'use client';

import { useAuth } from '@/components/providers/AuthProvider';
import { ConnectWalletButton } from '@/components/providers/AuthProvider';
import Header from '@/components/Header';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

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
      <Header variant="homepage" />

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
            <ConnectWalletButton />
          </div>
        </div>

        {/* How it works */}
        <div className="mt-32">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
            <div className="text-center hover-bounce">
              <img src="/images/sign.png" alt="Wallet" width={180} height={180} className="mb-6 hover-wiggle mx-auto" />
              <h3 className="text-4xl font-bold mb-4 siggy-text-gradient-outlined title-medium">Sign in</h3>
              <p className="text-lg opacity-80 tracking-tight">Sign in with your wallet - Siggy speaks your blockchain language!</p>
            </div>

            <div className="text-center hover-bounce">
              <img src="/images/ifitfitsisits.png" alt="Safe" width={180} height={180} className="mb-6 hover-wiggle mx-auto" />
              <h3 className="text-4xl font-bold mb-4 siggy-text-gradient-outlined title-medium">Add Your Safes</h3>
              <p className="text-lg opacity-80 tracking-tight">Tell Siggy which Safe addresses to watch. Our feathered friend never forgets!</p>
            </div>

            <div className="text-center hover-bounce">
              <img src="/images/shouting.png" alt="Megaphone" width={180} height={180} className="mb-6 hover-wiggle mx-auto" />
              <h3 className="text-4xl font-bold mb-4 siggy-text-gradient-outlined title-medium">Get Squawked At!</h3>
              <p className="text-lg opacity-80 tracking-tight">Siggy sends you instant Telegram alerts when signatures are needed!</p>
            </div>
          </div>
          
          <div className="text-center mt-16">
            <p className="text-2xl mb-8 tracking-tight">Ready to let Siggy guard your multisigs?</p>
            <ConnectWalletButton />
          </div>
        </div>
      </div>
    </div>
  );
}