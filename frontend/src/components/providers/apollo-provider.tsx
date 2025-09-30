'use client'

import { ReactNode } from 'react';

interface ApolloProviderWrapperProps {
  children: ReactNode;
}

// Temporary provider without Apollo Client to fix build issues
// TODO: Re-enable Apollo Client once import issues are resolved
export function ApolloProviderWrapper({ children }: ApolloProviderWrapperProps) {
  return <>{children}</>;
}
