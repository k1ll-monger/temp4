import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

const LandingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-6">Welcome to TaskLoop</h1>
            <p className="text-xl text-gray-600 mb-8">
              Connect with your community to get tasks done
            </p>
            {user ? (
              <Button onClick={() => navigate('/home')}>
                Go to Dashboard
              </Button>
            ) : (
              <div className="space-x-4">
                <Button onClick={() => navigate('/login')}>
                  Login
                </Button>
                <Button variant="outline" onClick={() => navigate('/register')}>
                  Register
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
      <footer className="bg-gray-100 py-8">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>&copy; {new Date().getFullYear()} TaskLoop. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
