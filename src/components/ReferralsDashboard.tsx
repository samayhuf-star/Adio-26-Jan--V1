import { useState, useEffect, useRef } from 'react';
import { Loader2, AlertCircle, RefreshCw, Users } from 'lucide-react';
import { Button } from './ui/button';
import { getSessionToken } from '../utils/auth';

export function ReferralsDashboard() {
  const [embedToken, setEmbedToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const fetchedRef = useRef(false);

  const fetchEmbedToken = async () => {
    setLoading(true);
    setError('');
    fetchedRef.current = true;
    try {
      const token = await getSessionToken();
      const response = await fetch('/api/affonso/embed-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to load referral dashboard');
      }

      setEmbedToken(data.token);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchEmbedToken();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Loading referral dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center max-w-sm">
          <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6 text-red-400" />
          </div>
          <h3 className="text-slate-800 font-semibold mb-2">Unable to load dashboard</h3>
          <p className="text-slate-500 text-sm mb-5">{error}</p>
          <Button
            onClick={() => { fetchedRef.current = false; fetchEmbedToken(); }}
            variant="outline"
            size="sm"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
          <Users className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Referral Program</h1>
          <p className="text-slate-500 text-sm">Earn commissions by referring new users to Adiology</p>
        </div>
      </div>

      <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-white">
        <iframe
          id="affonso-embed"
          src={`https://affonso.io/embed/referrals?token=${embedToken}&theme=light&lang=en`}
          style={{ width: '100%', height: '680px', border: 'none', display: 'block' }}
          allow="clipboard-write"
          title="Referral Dashboard"
        />
      </div>
    </div>
  );
}
