import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { lovable } from '@/integrations/lovable/index';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
    <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 6.29C4.672 4.163 6.656 2.58 9 2.58z" fill="#EA4335"/>
  </svg>
);

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      checkAccountAndRedirect();
    }
  }, [user]);

  const checkAccountAndRedirect = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('user_accounts')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();
    navigate(data ? '/dashboard' : '/select-firm', { replace: true });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await signIn(email, password);
    if (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    const { error } = await lovable.auth.signInWithOAuth('google', {
      redirect_uri: window.location.origin,
    });
    if (error) setError(error.message || 'Google sign-in failed');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0A0A0A] px-6">
      <div className="w-full max-w-sm">
        <Link to="/" className="mb-12 block text-center font-display text-2xl font-semibold tracking-wide">
          <span className="text-primary">ARIA</span> <span className="text-[#F5F2EE]">PropGuard</span>
        </Link>

        <h1 className="font-display text-3xl font-light text-[#F5F2EE]">Welcome back</h1>
        <p className="mt-2 font-body text-sm text-[#F5F2EE]/55">Sign in to your account</p>

        <div className="mt-8 space-y-5">
          {error && <div className="rounded-md bg-red-500/10 p-3 font-body text-sm text-red-400">{error}</div>}

          <Button type="button" variant="outline" className="w-full border-[#F5F2EE]/20 bg-transparent text-[#F5F2EE] hover:bg-[#F5F2EE]/5" onClick={handleGoogleLogin}>
            <GoogleIcon />
            Continue with Google
          </Button>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-[#F5F2EE]/10" />
            <span className="font-body text-xs uppercase tracking-widest text-[#F5F2EE]/30">or</span>
            <div className="h-px flex-1 bg-[#F5F2EE]/10" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="font-body text-sm text-[#F5F2EE]/55">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-[#1A1A1A] border-[#F5F2EE]/10 text-[#F5F2EE]" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="font-body text-sm text-[#F5F2EE]/55">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="bg-[#1A1A1A] border-[#F5F2EE]/10 text-[#F5F2EE]" />
            </div>

            <Button type="submit" variant="gold" className="w-full" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In'}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center font-body text-sm text-[#F5F2EE]/55">
          Don't have an account?{' '}
          <Link to="/signup" className="text-primary hover:underline">Start free trial</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
