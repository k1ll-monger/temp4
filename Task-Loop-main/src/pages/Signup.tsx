import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Mail, Check } from 'lucide-react'; 
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

const Signup = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSendOTP = (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "OTP Sent!",
      description: `A verification code has been sent to ${email}`,
    });
    
    setIsOtpSent(true);
  };

  const handleVerifyOTP = (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (otp.length === 6) {
      toast({
        title: "OTP Verified!",
        description: "Your email has been verified successfully",
      });
      
      setIsOtpVerified(true);
    } else {
      toast({
        title: "Invalid OTP",
        description: "Please enter a valid 6-digit verification code",
        variant: "destructive",
      });
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
  
    if (!isOtpVerified) {
      toast({
        title: "Email verification required",
        description: "Please verify your email address before signing up",
        variant: "destructive",
      });
      return;
    }
  
    try {
      const response = await fetch("http://localhost:3000/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });
  
      const data = await response.json();
  
      if (response.ok) {
        toast({
          title: "Account created!",
          description: data.message || "Your account has been created successfully",
        });
  
        setUsername("");
        setEmail("");
        setPassword("");
        setConfirmPassword("");
        setOtp("");
        setIsOtpSent(false);
        setIsOtpVerified(false);
  
        navigate("/home");
      } else {
        toast({
          title: "Signup failed",
          description: data.message || "Something went wrong",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Signup error:", error);
      toast({
        title: "Network error",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  };
  

  const handleOTPChange = (value: string) => {
    setOtp(value);
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
                  placeholder="johndoe"
                  className="input-dark"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              
              <div className="grid gap-1">
                <Label htmlFor="email">Email</Label>
                <div className="flex gap-2">
                  <Input
                    id="email"
                    type="email"
                    placeholder="example@iiitkottayam.ac.in"
                    className="input-dark flex-1"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isOtpSent}
                  />
                  {!isOtpVerified && (
                    <Button 
                      type="button" 
                      onClick={handleSendOTP}
                      variant={isOtpSent ? "outline" : "default"}
                      className="whitespace-nowrap"
                      disabled={!email || !email.includes('@')}
                    >
                      <Mail className="mr-2 h-4 w-4" />
                      {isOtpSent ? "Resend OTP" : "Send OTP"}
                    </Button>
                  )}
                </div>
              </div>

              {isOtpSent && !isOtpVerified && (
                <div className="grid gap-1">
                  <Label htmlFor="otp">Verification Code</Label>
                  <p className="text-sm text-muted-foreground mb-1">
                    We've sent a 6-digit code to {email}
                  </p>
                  <div className="flex justify-center my-1">
                    <InputOTP maxLength={6} value={otp} onChange={handleOTPChange}>
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                  <Button 
                    type="button" 
                    onClick={handleVerifyOTP}
                    className="w-full bg-primary hover:bg-primary/90"
                    disabled={otp.length !== 6}
                  >
                    <Check className="mr-2 h-4 w-4" />
                    Verify
                  </Button>
                </div>
              )}

              <div className="grid gap-1">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Create a password"
                  className="input-dark"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="grid gap-1">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  className="input-dark"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary/90" 
                disabled={!isOtpVerified}
              >
                Sign Up
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
