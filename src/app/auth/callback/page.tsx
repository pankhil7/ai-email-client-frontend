'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEmailStore } from '@/store/emailStore';
import { api } from '@/lib/api';
import logger from '@/lib/logger';

export default function AuthCallback() {
  const router = useRouter();
  const params = useSearchParams();
  const { addAccount } = useEmailStore();

  useEffect(() => {
    const accountId = params.get('accountId');
    const email = params.get('email');
    const provider = params.get('provider');
    const error = params.get('error');

    if (error) {
      logger.error({ msg: 'OAuth callback error', error });
      alert(`Auth failed: ${error}`);
      router.push('/');
      return;
    }

    const PROVIDER_COLORS: Record<string, string> = {
      gmail: '#ea4335',
      office365: '#0078d4',
    };

    if (accountId && email && provider && PROVIDER_COLORS[provider]) {
      logger.info({ msg: 'OAuth callback success', accountId, provider });
      api.addAccount({
        id: accountId,
        email,
        provider,
        color: PROVIDER_COLORS[provider],
      }).then(() => {
        logger.info({ msg: 'Account registered, redirecting to inbox' });
        router.push('/');
      }).catch((err: any) => {
        logger.error({ msg: 'Failed to register account', err });
        router.push('/');
      });
    } else {
      logger.warn({ msg: 'OAuth callback missing params', accountId, email, provider });
      router.push('/');
    }
  }, []);

  return (
    <div className="h-screen flex items-center justify-center bg-slate-950 text-white">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-300 font-medium">Account connected!</p>
        <p className="text-slate-500 text-sm mt-1">Redirecting to inbox...</p>
      </div>
    </div>
  );
}
