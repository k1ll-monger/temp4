import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import TaskCard from '@/components/TaskCard';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Calendar, Clock, IndianRupee, Plus } from 'lucide-react';

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
  const [locationFilter, setLocationFilter] = useState('');
  const [taskTypeFilter, setTaskTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [sortBy, setSortBy] = useState('newest');
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('tasks')
        .select('*')
        .eq('status', statusFilter)
        .order('created_at', { ascending: false });

      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
      }
      if (locationFilter && locationFilter !== 'all') {
        query = query.eq('location', locationFilter);
      }
      if (taskTypeFilter && taskTypeFilter !== 'all') {
        query = query.eq('task_type', taskTypeFilter);
      }

      switch (sortBy) {
        case 'newest':
          query = query.order('created_at', { ascending: false });
          break;
        case 'oldest':
          query = query.order('created_at', { ascending: true });
          break;
        case 'highest_reward':
          query = query.order('reward', { ascending: false });
          break;
        case 'lowest_reward':
          query = query.order('reward', { ascending: true });
          break;
        case 'deadline_soonest':
          query = query.order('deadline', { ascending: true });
          break;
        case 'deadline_latest':
          query = query.order('deadline', { ascending: false });
          break;
      }

      const { data, error } = await query;

      if (error) throw error;
      setTasks(data || []);
    } catch (error: unknown) {
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

  const handleFilterChange = (value: string, type: 'location' | 'taskType' | 'sort' | 'status') => {
    switch (type) {
      case 'location':
        setLocationFilter(value);
        break;
      case 'taskType':
        setTaskTypeFilter(value);
        break;
      case 'sort':
        setSortBy(value);
        break;
      case 'status':
        setStatusFilter(value);
        break;
    }
    fetchTasks();
  };

  const getUniqueLocations = () => {
    return Array.from(new Set(tasks.map(task => task.location)));
  };

  const handleTaskStatusChange = () => {
    fetchTasks();
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
          <h1 className="text-3xl font-bold">Available Tasks</h1>
          <Button onClick={() => navigate('/create-task')}>
            <Plus className="mr-2 h-4 w-4" />
            Create Task
          </Button>
        </div>
        <div className="flex flex-wrap gap-4">
          <Button variant="outline">Active Tasks</Button>
          <Button variant="outline">Applied Tasks</Button>
          <Button variant="outline">Created Tasks</Button>
          <Button variant="outline">Completed Tasks</Button>
        </div>
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Label htmlFor="search">Search Tasks</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                id="search"
                placeholder="Search by title or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="w-full md:w-48">
            <Label htmlFor="status">Status</Label>
            <Select value={statusFilter} onValueChange={(value) => handleFilterChange(value, 'status')}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="w-full md:w-48">
            <Label htmlFor="location">Location</Label>
            <Select value={locationFilter} onValueChange={(value) => handleFilterChange(value, 'location')}>
              <SelectTrigger>
                <SelectValue placeholder="All Locations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {getUniqueLocations().map((location) => (
                  <SelectItem key={location} value={location}>
                    {location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-full md:w-48">
            <Label htmlFor="taskType">Task Type</Label>
            <Select value={taskTypeFilter} onValueChange={(value) => handleFilterChange(value, 'taskType')}>
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="joint">Joint</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="w-full md:w-48">
            <Label htmlFor="sort">Sort By</Label>
            <Select value={sortBy} onValueChange={(value) => handleFilterChange(value, 'sort')}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="highest_reward">Highest Reward</SelectItem>
                <SelectItem value="lowest_reward">Lowest Reward</SelectItem>
                <SelectItem value="deadline_soonest">Deadline Soonest</SelectItem>
                <SelectItem value="deadline_latest">Deadline Latest</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </form>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No tasks found. Try adjusting your filters.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onStatusChange={handleTaskStatusChange}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;