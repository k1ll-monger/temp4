import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Eye, EyeOff } from 'lucide-react';

const Signup = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (password !== confirmPassword) {
      toast({
        title: "Password mismatch",
        description: "Passwords do not match",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }
  
    try {
      // Create the auth user with metadata
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            email,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          emailRedirectTo: `${window.location.origin}/login`,
        },
      });

      if (authError) throw authError;

      if (!authData?.user) {
        throw new Error('Failed to create user');
      }

      // Create user profile in users table
      const { error: profileError } = await supabase
        .from('users')
        .insert([
          {
            id: authData.user.id,
            username,
            email,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
        ]);

      if (profileError) {
        console.error('Profile creation error:', profileError);
        // Don't throw here, as the auth user is already created
      }

      setEmailSent(true);
      toast({
        title: "Check your email!",
        description: "We've sent you a confirmation link. Please check your email to confirm your account.",
      });
  
      setUsername("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      console.error('Signup error:', error);
      toast({
        title: "Signup failed",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="flex flex-col items-center min-h-screen bg-background">
        <div className="w-full text-center py-12">
          <h1 className="text-5xl font-bold text-primary">TaskLoop</h1>
        </div>
        
        <div className="w-full max-w-md px-4 md:px-0 mt-8">
          <div className="border-border bg-card p-6 rounded-lg shadow-md space-y-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 via-primary to-accent"></div>
            
            <div className="space-y-4 text-center">
              <h2 className="text-2xl font-bold">Check your email</h2>
              <p className="text-muted-foreground">
                We've sent a confirmation link to {email}. Please check your email and click the link to confirm your account.
              </p>
              <p className="text-sm text-muted-foreground">
                After confirming your email, you can log in to your account.
              </p>
              <div className="flex justify-center gap-4">
                <Link to="/login">
                  <Button className="bg-transparent hover:bg-transparent border border-input hover:border-primary">
                    Go to Login
                  </Button>
                </Link>
                <Button onClick={() => setEmailSent(false)}>Try Again</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center min-h-screen bg-background">
      <div className="w-full text-center py-12">
        <h1 className="text-5xl font-bold text-primary">TaskLoop</h1>
      </div>
      
      <div className="w-full max-w-md px-4 md:px-0 mt-8">
        <div className="border-border bg-card p-6 rounded-lg shadow-md space-y-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 via-primary to-accent"></div>
          
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-center">Create an Account</h2>
            <p className="text-center text-muted-foreground text-sm">
              Sign up to start using Task Loop
            </p>
          </div>
          
          <form onSubmit={handleSignup}>
            <div className="grid gap-3">
              <div className="grid gap-1">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Username"
                  className="input-dark"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              
              <div className="grid gap-1">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="example@iiitkottayam.ac.in"
                  className="input-dark"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="grid gap-1">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password"
                    className="input-dark"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div className="grid gap-1">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    className="input-dark"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary/90" 
                disabled={loading}
              >
                {loading ? 'Creating account...' : 'Sign Up'}
              </Button>
              <div className="flex items-center justify-between mt-1">
                <Link to="/" className="text-sm text-primary hover:underline">
                  Back to Home
                </Link>
              </div>
              <div className="flex justify-center pt-1">
                <p className="text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <Link to="/login" className="text-primary hover:underline">
                    Login
                  </Link>
                </p>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Signup;
