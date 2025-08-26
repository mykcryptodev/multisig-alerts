'use client';

import { ConnectButton } from 'thirdweb/react';
import { ConnectWalletButton } from '@/components/providers/AuthProvider';
import ThemeToggle from '@/components/ThemeToggle';
import { client } from '@/lib/thirdweb-auth';
import { useTheme } from '@/components/providers/ThemeProvider';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface HeaderProps {
  variant?: 'homepage' | 'dashboard';
  onSignOut?: () => void;
}

export default function Header({ variant = 'homepage', onSignOut }: HeaderProps) {
  const { theme } = useTheme();
  const pathname = usePathname();

  return (
    <header className="bg-base-200/80 backdrop-blur-sm shadow-lg border-b-4 border-gradient">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center gap-1 sm:gap-4">
            <Link href="/" className="flex items-center gap-1 sm:gap-4">
              <img 
                src="/images/siggy.png" 
                alt="Siggy the Parrot" 
                className="w-12 h-12 hover-wiggle cursor-pointer"
              />
              <h1 className={`font-bold siggy-text-gradient-outlined title-medium text-2xl sm:text-4xl`}>
                Siggy
              </h1>
            </Link>
          </div>
          <div className={`flex items-center gap-1 sm:gap-4`}>           
            <ThemeToggle />
            {variant === 'homepage' ? (
              <ConnectWalletButton />
            ) : (
              <ConnectButton theme={theme === 'dark' ? 'dark' : 'light'} client={client} />
            )}
            {variant === 'dashboard' && onSignOut && (
              <button
                onClick={onSignOut}
                className="btn btn-ghost btn-circle hover-wiggle"
                title="Sign Out"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
