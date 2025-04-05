import { Link, useLocation } from 'react-router-dom';
import { cn } from '../lib/utils';
import { Home, Bell, MessageSquare, User, ClipboardList } from 'lucide-react';

const navigation = [
  {
    icon: Home,
    label: 'Home',
    href: '/',
  },
  {
    icon: Bell,
    label: 'Notifications',
    href: '/notifications',
  },
  {
    icon: ClipboardList,
    label: 'Applications',
    href: '/applications',
  },
  {
    icon: MessageSquare,
    label: 'Chat',
    href: '/chat',
  },
  {
    icon: User,
    label: 'Profile',
    href: '/profile',
  },
];

export default function Navigation() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t md:top-0 md:bottom-auto md:border-b md:border-t-0">
      <div className="container mx-auto">
        <div className="flex justify-around md:justify-end md:gap-6 p-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'flex flex-col items-center gap-1 p-2 text-muted-foreground hover:text-foreground transition-colors',
                  isActive && 'text-foreground'
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
} 