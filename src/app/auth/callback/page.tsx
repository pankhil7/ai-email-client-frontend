'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEmailStore } from '@/store/emailStore';

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
      alert(`Auth failed: ${error}`);
      router.push('/');
      return;
    }

    if (accountId && email && provider === 'gmail') {
      addAccount({
        id: accountId,
        email,
        provider: 'gmail',
        color: '#ea4335',
      }).then(() => router.push('/'));
    } else {
      router.push('/');
    }
  }, []);

  return (
    <div className="h-screen flex items-center justify-center bg-slate-950 text-white">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-400">Connecting your Gmail account...</p>
      </div>
    </div>
  );
}
