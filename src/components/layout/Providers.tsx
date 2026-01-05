'use client';

import React from 'react';
import { TranslationProvider } from '@/lib/utils/translation';
import { ToastProvider } from '@/components/ui/Toast';
import { NetworkProvider } from '@/components/ui/NetworkStatus';
import { UserProvider } from '@/contexts/UserContext';
import { CsrfProvider } from '@/contexts/CsrfContext';

interface ProvidersProps {
  children: React.ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <CsrfProvider>
      <UserProvider>
        <NetworkProvider>
          <ToastProvider>
            <TranslationProvider>
              {children}
            </TranslationProvider>
          </ToastProvider>
        </NetworkProvider>
      </UserProvider>
    </CsrfProvider>
  );
}
