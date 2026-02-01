import { useState, useEffect } from 'react';
import { SuperAdminLogin } from './SuperAdminLogin';
import { SuperAdminDashboard } from './SuperAdminDashboard';

export function SuperAdminApp() {
  const [token, setToken] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const storedToken = sessionStorage.getItem('superadmin_token');
    if (storedToken) {
      validateToken(storedToken);
    } else {
      setChecking(false);
    }
  }, []);

  const validateToken = async (token: string) => {
    try {
      const response = await fetch('/api/superadmin/validate', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        setToken(token);
      } else {
        sessionStorage.removeItem('superadmin_token');
      }
    } catch {
      sessionStorage.removeItem('superadmin_token');
    }
    setChecking(false);
  };

  const handleLogin = (newToken: string) => {
    setToken(newToken);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('superadmin_token');
    setToken(null);
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!token) {
    return <SuperAdminLogin onLogin={handleLogin} />;
  }

  return <SuperAdminDashboard token={token} onLogout={handleLogout} />;
}
