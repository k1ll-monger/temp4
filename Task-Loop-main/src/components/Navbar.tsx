import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, Trophy, Home, User, Menu, X, MessageSquare, Calendar, FileText, Bell } from 'lucide-react';
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
import Notifications from './Notifications';
import { useAuth } from '@/hooks/useAuth';

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, signOut } = useAuth();

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    if (onSearch) {
      onSearch(term);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Get user name for avatar
  const getUserInitials = (): string => {
    if (user?.user_metadata?.name) {
      return user.user_metadata.name.substring(0, 2).toUpperCase();
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
          <NavigationMenuItem>
            <Link to="/login" className={navigationMenuTriggerStyle()}>
              Login
            </Link>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <Link to="/signup" className={navigationMenuTriggerStyle()}>
              Register
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
          <Link to="/create-task" className={navigationMenuTriggerStyle()}>
            <FileText className="mr-2 h-4 w-4" />
            Create Task
          </Link>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <Notifications />
        </NavigationMenuItem>
        <NavigationMenuItem>
          <Link to="/profile" className={navigationMenuTriggerStyle()}>
            <User className="mr-2 h-4 w-4" />
            Profile
          </Link>
        </NavigationMenuItem>
      </>
    );
  };

  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold text-primary">
          Task Loop
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-4">
          {isHomePage && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={handleSearch}
                className="pl-9 w-[300px]"
              />
            </div>
          )}
          <NavigationMenu>
            <NavigationMenuList>
              <MainNavLinks />
            </NavigationMenuList>
          </NavigationMenu>
          {user && (
            <Button variant="outline" onClick={handleSignOut}>
              Sign Out
            </Button>
          )}
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px]">
              <div className="flex flex-col gap-4 mt-4">
                {isHomePage && (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Search tasks..."
                      value={searchTerm}
                      onChange={handleSearch}
                      className="pl-9"
                    />
                  </div>
                )}
                <MainNavLinks />
                {user && (
                  <Button variant="outline" onClick={handleSignOut}>
                    Sign Out
                  </Button>
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
