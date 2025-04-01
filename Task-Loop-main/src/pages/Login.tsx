import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await signIn(email, password);

      if (error) throw error;

      if (!data?.user) {
        throw new Error('Failed to login');
      }

      // Check if user exists in users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (userError && userError.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('Error checking user profile:', userError);
        throw userError;
      }

      // If user doesn't exist in users table, create it
      if (!userData) {
        const { error: createError } = await supabase
          .from('users')
          .insert([
            {
              id: data.user.id,
              username: data.user.user_metadata.username || email.split('@')[0],
              email: data.user.email,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }
          ]);

        if (createError) {
          console.error('Error creating user profile:', createError);
          // Don't throw here, as the user is already logged in
        }
      }

      toast({
        title: "Welcome back!",
        description: "You have successfully logged in.",
      });

      setEmail("");
      setPassword("");
      navigate("/home");
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: "Login failed",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-background">
      <div className="w-full text-center py-12">
        <h1 className="text-5xl font-bold text-primary">TaskLoop</h1>
      </div>
      
      <div className="w-full max-w-md px-4 md:px-0 mt-8">
        <div className="border-border bg-card p-6 rounded-lg shadow-md space-y-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 via-primary to-accent"></div>
          
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-center">Welcome Back</h2>
            <p className="text-center text-muted-foreground text-sm">
              Sign in to your account
            </p>
          </div>
          
          <form onSubmit={handleLogin}>
            <div className="grid gap-3">
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
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  className="input-dark"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary/90" 
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
              <div className="flex items-center justify-between mt-1">
                <Link to="/" className="text-sm text-primary hover:underline">
                  Back to Home
                </Link>
              </div>
              <div className="flex justify-center pt-1">
                <p className="text-sm text-muted-foreground">
                  Don't have an account?{" "}
                  <Link to="/signup" className="text-primary hover:underline">
                    Sign Up
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

export default Login;