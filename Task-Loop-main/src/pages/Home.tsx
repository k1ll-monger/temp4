import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import TaskCard from '@/components/TaskCard';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Calendar, Clock, IndianRupee } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description: string;
  location: string;
  reward: number;
  deadline: Date;
  taskType: "normal" | "joint";
  status: "active" | "completed";
  createdAt: Date;
  creatorId: string;
  creatorName: string;
  creatorRating?: number;
  assignedTo?: string | null;
  completedAt?: Date | null;
  updatedAt?: Date;
}

const Home = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchTasks();
  }, [locationFilter, sortBy]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('tasks')
        .select('*')
        .eq('status', 'active')
        .gt('deadline', new Date().toISOString()); // Only fetch tasks with future deadlines

      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
      }
      if (locationFilter && locationFilter !== 'all') {
        query = query.eq('location', locationFilter);
      }

      switch (sortBy) {
        case 'newest':
          query = query.order('created_at', { ascending: false });
          break;
        case 'oldest':
          query = query.order('created_at', { ascending: true });
          break;
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Fetch creator profiles separately
      const creatorIds = data?.map(task => task.creator_id) || [];
      const uniqueCreatorIds = [...new Set(creatorIds)];
      
      let creatorProfiles: Record<string, any> = {};
      
      if (uniqueCreatorIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, username, rating')
          .in('id', uniqueCreatorIds);
          
        if (!profilesError && profilesData) {
          creatorProfiles = profilesData.reduce((acc, profile) => {
            acc[profile.id] = profile;
            return acc;
          }, {} as Record<string, any>);
        }
      }
      
      const transformedTasks = data?.map(task => ({
        id: task.id,
        title: task.title,
        description: task.description,
        location: task.location,
        reward: task.reward,
        deadline: task.deadline,
        taskType: task.task_type,
        status: task.status,
        createdAt: task.created_at,
        creatorId: task.creator_id,
        creatorName: creatorProfiles[task.creator_id]?.username || 'Unknown',
        creatorRating: creatorProfiles[task.creator_id]?.rating || 0,
        assignedTo: task.assigned_to,
        assignedAt: task.assigned_at
      })) || [];

      setTasks(transformedTasks);
    } catch (error: any) {
      console.error('Error fetching tasks:', error);
      toast({
        title: "Error",
        description: "Failed to load tasks. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTasks();
  };

  const handleLocationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLocationFilter(e.target.value);
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortBy(e.target.value);
  };

  // Get unique locations from tasks
  const locations = [...new Set(tasks.map(task => task.location))];

  const handleTaskStatusChange = () => {
    fetchTasks();
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <h1 className="text-3xl font-bold mb-4 md:mb-0">Available Tasks</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <form onSubmit={handleSearch} className="md:col-span-2">
          <div className="flex gap-2">
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Button type="submit">Search</Button>
          </div>
        </form>
        <div className="flex gap-2">
          <Select value={locationFilter} onValueChange={setLocationFilter}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Filter by location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              {locations.map((location) => (
                <SelectItem key={location} value={location}>
                  {location}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : tasks.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No tasks found. Try adjusting your search or filters.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onStatusChange={handleTaskStatusChange}
              onApply={(taskId, message) => {
                // Handle task application
                toast({
                  title: "Application Submitted",
                  description: "Your application has been submitted successfully.",
                });
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Home;