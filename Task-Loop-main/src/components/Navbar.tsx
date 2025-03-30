
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, Trophy, Home, User, Menu, X, MessageSquare, Calendar, FileText } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Session } from '@supabase/supabase-js';
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

interface NavbarProps {
  onSearch?: (term: string) => void;
  session?: Session | null;
  onProtectedNavigation?: (path: string) => void;
}

const Navbar = ({ onSearch, session, onProtectedNavigation }: NavbarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isHomePage = location.pathname === '/home';
  const isLandingPage = location.pathname === '/';
  const [searchTerm, setSearchTerm] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Check localStorage session on component mount and when location changes
    const checkAuth = () => {
      const localSession = localStorage.getItem('taskloop_session');
      setIsAuthenticated(localSession ? JSON.parse(localSession).isAuthenticated : false);
    };
    
    checkAuth();
    
    // Set up an event listener for storage changes (for when logout happens in another tab)
    window.addEventListener('storage', checkAuth);
    
    return () => {
      window.removeEventListener('storage', checkAuth);
    };
  }, [location]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    if (onSearch) {
      onSearch(term);
    }
  };

  const handleLoginClick = () => {
    navigate('/login');
  };

  const handleProfileClick = () => {
    navigate('/profile');
  };

  // Get user name for avatar
  const getUserInitials = (): string => {
    const localSession = localStorage.getItem('taskloop_session');
    if (localSession) {
      const userData = JSON.parse(localSession);
      if (userData.user && userData.user.name) {
        return userData.user.name.substring(0, 2).toUpperCase();
      }
      return 'JD'; // Default to "John Doe" initials
    }
    return 'U';
  };

  // Different menu items based on whether it's the landing page or not
  const MainNavLinks = () => {
    if (isLandingPage) {
      return (
        <>
          <NavigationMenuItem>
            <Link to="/leaderboard" className={navigationMenuTriggerStyle()}>
              <Trophy className="mr-2 h-4 w-4" />
              Leaderboard
            </Link>
          </NavigationMenuItem>
        </>
      );
    }
    
    return (
      <>
        <NavigationMenuItem>
          <Link to="/home" className={navigationMenuTriggerStyle()}>
            <Home className="mr-2 h-4 w-4" />
            Home
          </Link>
        </NavigationMenuItem>
        
        <NavigationMenuItem>
          <Link to="/task" className={navigationMenuTriggerStyle()}>
            <FileText className="mr-2 h-4 w-4" />
            Task
          </Link>
        </NavigationMenuItem>
        
        <NavigationMenuItem>
          <Link to="/chat" className={navigationMenuTriggerStyle()}>
            <MessageSquare className="mr-2 h-4 w-4" />
            Chat
          </Link>
        </NavigationMenuItem>
        
        <NavigationMenuItem>
          <Link to="/history" className={navigationMenuTriggerStyle()}>
            <Calendar className="mr-2 h-4 w-4" />
            History
          </Link>
        </NavigationMenuItem>
        
        <NavigationMenuItem>
          <Link to="/leaderboard" className={navigationMenuTriggerStyle()}>
            <Trophy className="mr-2 h-4 w-4" />
            Leaderboard
          </Link>
        </NavigationMenuItem>
      </>
    );
  };

  return (
    <nav className="border-b bg-background sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex items-center">
        <Link to={isAuthenticated ? "/home" : "/"} className="text-xl font-bold mr-6">
          Task Loop
        </Link>
        
        {isHomePage && (
          <div className="relative mx-4 flex-1 max-w-sm">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks by name, description or location..."
              value={searchTerm}
              onChange={handleSearch}
              className="pl-10"
            />
          </div>
        )}
        
        {/* Desktop Navigation Menu */}
        <div className="hidden md:flex ml-auto items-center">
          <NavigationMenu>
            <NavigationMenuList>
              <MainNavLinks />
            </NavigationMenuList>
          </NavigationMenu>
          
          <div className="ml-4">
            {isLandingPage ? (
              <Button onClick={handleLoginClick} variant="outline">
                Login
              </Button>
            ) : (
              <div onClick={handleProfileClick} style={{ cursor: 'pointer' }}>
                <Avatar>
                  <AvatarImage src="https://github.com/shadcn.png" />
                  <AvatarFallback>{getUserInitials()}</AvatarFallback>
                </Avatar>
              </div>
            )}
          </div>
        </div>
        
        {/* Mobile Menu */}
        <div className="md:hidden ml-auto flex items-center gap-2">
          {!isLandingPage && (
            <div onClick={handleProfileClick} style={{ cursor: 'pointer' }}>
              <Avatar>
                <AvatarImage src="https://github.com/shadcn.png" />
                <AvatarFallback>{getUserInitials()}</AvatarFallback>
              </Avatar>
            </div>
          )}
          
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <div className="flex flex-col gap-4 mt-6">
                {isLandingPage ? (
                  <>
                    <Link 
                      to="/leaderboard" 
                      className="flex items-center gap-2 px-2 py-2 hover:bg-muted rounded-md"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Trophy className="h-5 w-5" />
                      Leaderboard
                    </Link>
                    <Button 
                      onClick={() => {
                        handleLoginClick();
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full"
                    >
                      Login
                    </Button>
                  </>
                ) : (
                  <>
                    <Link 
                      to="/home" 
                      className="flex items-center gap-2 px-2 py-2 hover:bg-muted rounded-md"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Home className="h-5 w-5" />
                      Home
                    </Link>
                    
                    <Link 
                      to="/task" 
                      className="flex items-center gap-2 px-2 py-2 hover:bg-muted rounded-md"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <FileText className="h-5 w-5" />
                      Task
                    </Link>
                    
                    <Link 
                      to="/chat" 
                      className="flex items-center gap-2 px-2 py-2 hover:bg-muted rounded-md"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <MessageSquare className="h-5 w-5" />
                      Chat
                    </Link>
                    
                    <Link 
                      to="/history" 
                      className="flex items-center gap-2 px-2 py-2 hover:bg-muted rounded-md"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Calendar className="h-5 w-5" />
                      History
                    </Link>
                    
                    <Link 
                      to="/leaderboard" 
                      className="flex items-center gap-2 px-2 py-2 hover:bg-muted rounded-md"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Trophy className="h-5 w-5" />
                      Leaderboard
                    </Link>
                    
                    <Link 
                      to="/profile" 
                      className="flex items-center gap-2 px-2 py-2 hover:bg-muted rounded-md"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <User className="h-5 w-5" />
                      Profile
                    </Link>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
