import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
} from "@/components/ui/navigation-menu";
import { Trophy } from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();

  const handleLoginClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate('/login');
  };
  
  const handleStartClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate('/signup');
  };

  const handleLeaderboardClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate('/login?redirect=/leaderboard');
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-background relative overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 w-full h-full z-0">
        <img 
          src="/lovable-uploads/c6597f0c-b261-4ae1-b452-a1879fbec2ec.png" 
          alt="Background" 
          className="w-full h-full object-cover"
        />
      </div>
      
      {/* Navigation Bar */}
      <header className="border-b bg-background/80 backdrop-blur-sm relative z-10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link to="/" className="text-xl font-bold">
              TaskLoop
            </Link>
          </div>
          
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <Button variant="ghost" onClick={handleLeaderboardClick}>
                  <Trophy size={20} />
                  Leaderboard
                </Button>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Button variant="ghost" onClick={handleLoginClick}>
                  Login
                </Button>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Button variant="ghost" onClick={handleStartClick}>
                  Register
                </Button>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>
      </header>
      
      {/* Hero Section */}
      <main className="flex-grow flex items-center justify-center relative z-10">
        <div className="container mx-auto px-4 py-16 text-left">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 text-primary">
            Welcome to Task Loop
          </h1>
          <h2 className="text-3xl md:text-5xl font-bold mb-4 text-primary">
            Get Things Done on Campus
          </h2>
          <p className="text-2xl md:text-3xl mb-4 max-w-3xl text-muted-foreground">
            Connect with fellow students to complete tasks, share resources, and make campus life easier
          </p>
          <p className="text-lg md:text-xl mb-10 max-w-3xl text-muted-foreground">
            ✓ Post and find campus-related tasks
            <br />
            ✓ Secure university email verification
            <br />
            ✓ Real-time chat with task participants
            <br />
            ✓ Build reputation with ratings
          </p>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="border-t py-6 bg-background/80 backdrop-blur-sm relative z-10">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>© {new Date().getFullYear()} Task Loop. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
