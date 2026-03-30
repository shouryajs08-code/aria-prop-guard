import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await signIn(email, password);
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm">
        <Link to="/" className="mb-12 block text-center font-display text-2xl font-semibold tracking-wide">
          <span className="text-primary">ARIA</span> <span className="text-foreground">PropGuard</span>
        </Link>

        <h1 className="font-display text-3xl font-light">Welcome back</h1>
        <p className="mt-2 font-body text-sm text-muted-foreground">Sign in to your account</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          {error && <div className="rounded-md bg-danger/10 p-3 font-body text-sm text-danger">{error}</div>}

          <div className="space-y-2">
            <Label htmlFor="email" className="font-body text-sm text-muted-foreground">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-card border-border" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="font-body text-sm text-muted-foreground">Password</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="bg-card border-border" />
          </div>

          <Button type="submit" variant="gold" className="w-full" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </Button>
        </form>

        <p className="mt-6 text-center font-body text-sm text-muted-foreground">
          Don't have an account?{' '}
          <Link to="/signup" className="text-primary hover:underline">Start free trial</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
