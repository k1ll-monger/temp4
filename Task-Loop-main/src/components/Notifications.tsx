import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const Notifications = () => {
  const [pendingCount, setPendingCount] = useState(0);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchPendingCount();
    }
  }, [user]);

  const fetchPendingCount = async () => {
    try {
      const { data, error } = await supabase
        .from('task_applications')
        .select('id, task:task_id(creator_id)')
        .eq('status', 'pending')
        .eq('task.creator_id', user?.id);

      if (error) throw error;

      setPendingCount(data?.length || 0);
    } catch (error: any) {
      console.error('Error fetching pending count:', error);
      setPendingCount(0);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (user) {
      navigate('/notifications');
    } else {
      navigate('/login');
    }
  };

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      className="relative"
      onClick={handleClick}
    >
      <Bell className="h-5 w-5" />
      {pendingCount > 0 && (
        <Badge 
          variant="destructive" 
          className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
        >
          {pendingCount}
        </Badge>
      )}
    </Button>
  );
};

export default Notifications; 