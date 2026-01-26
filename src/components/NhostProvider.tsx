/**
 * Nhost Provider Component
 * Wraps the app with Nhost authentication context
 */

import React from 'react';
import { NhostProvider as NhostReactProvider } from '@nhost/react';
import { nhost } from '../lib/nhost';

interface NhostProviderProps {
  children: React.ReactNode;
}

export function NhostProvider({ children }: NhostProviderProps) {
  return (
    <NhostReactProvider nhost={nhost}>
      {children}
    </NhostReactProvider>
  );
}

export default NhostProvider;