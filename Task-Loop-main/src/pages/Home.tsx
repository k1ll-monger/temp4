import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import TaskCard, { TaskCardProps } from '@/components/TaskCard';
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
      
      // Fetch creator profiles
      const creatorIds = data?.map(task => task.creator_id) || [];
      let creatorProfiles = {};
      
      if (creatorIds.length > 0) {
        try {
          // Step 1: Get usernames from users table
          const { data: userData, error } = await supabase
            .from('users')
            .select('id, username, rating')
            .in('id', creatorIds);
            
          if (error) {
            console.error('Error fetching user data:', error);
          } else if (userData) {
            console.log('Found users in users table:', userData);
            // Create a lookup table
            userData.forEach(user => {
              creatorProfiles[user.id] = user;
            });
          }
          
          // Step 2: For any creator IDs that we couldn't find in the users table,
          // try to get the user data directly from auth.users
          const missingCreatorIds = creatorIds.filter(id => !creatorProfiles[id]);
          
          if (missingCreatorIds.length > 0) {
            console.log('Missing users, attempting to fetch from auth:', missingCreatorIds);
            
            // Fetch the user data one by one since we can't do a bulk fetch from auth
            for (const creatorId of missingCreatorIds) {
              // Try to get the user's data from their task
              const taskWithCreator = data.find(task => task.creator_id === creatorId);
              
              if (taskWithCreator?.creator_name) {
                // If the task has creator_name, use that
                creatorProfiles[creatorId] = {
                  id: creatorId,
                  username: taskWithCreator.creator_name,
                  rating: taskWithCreator.creator_rating || 0
                };
                console.log(`Found creator name in task: ${taskWithCreator.creator_name}`);
              } else {
                // Just use a simple and clear display name
                creatorProfiles[creatorId] = {
                  id: creatorId,
                  username: "Anonymous User",
                  rating: 0
                };
              }
            }
          }
        } catch (e) {
          console.error('Error in user fetching:', e);
        }
      }
      
      // Transform tasks with available user data
      const transformedTasks = data?.map(task => {
        const creator = creatorProfiles[task.creator_id];
        
        // Add detailed logging to debug username issues
        if (!creator || !creator.username) {
          console.log(`Task ${task.id} creator has missing username:`, {
            creator_id: task.creator_id,
            creator_data: creator || 'No creator profile found'
          });
        }
        
        // Use the name stored in the task if creator profile is missing or has no username
        const creatorName = creator?.username || task.creator_name || "Anonymous User";
        
        return {
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
          creatorName: creatorName,
          creatorRating: creator?.rating || task.creator_rating || 0,
          assignedTo: task.assigned_to,
          assignedAt: task.assigned_at
        };
      }) || [];

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
          {tasks.map((task) => {
            // Extra check - only show tasks with creator info
            if (!task.creatorName || task.creatorName === 'Unknown') {
              console.log('Task with unknown creator:', task);
            }
            
            return (
              <TaskCard
                key={task.id}
                task={task}
                isCreator={user?.id === task.creatorId}
                onStatusChange={handleTaskStatusChange}
                onApply={async (taskId, proposal) => {
                  try {
                    // Get the current user
                    const { data: { user }, error: userError } = await supabase.auth.getUser();
                    if (userError) throw userError;
                    if (!user) throw new Error('No user found');

                    // Get user's profile
                    const { data: profile, error: profileError } = await supabase
                      .from('users')
                      .select('username, email')
                      .eq('id', user.id)
                      .single();

                    if (profileError) throw profileError;

                    // Get task details first
                    const { data: taskData, error: taskError } = await supabase
                      .from('tasks')
                      .select('creator_id, title')
                      .eq('id', taskId)
                      .single();

                    if (taskError) throw taskError;

                    // Insert the application
                    const { data: application, error: applicationError } = await supabase
                      .from('task_applications')
                      .insert([
                        {
                          task_id: taskId,
                          applicant_id: user.id,
                          applicant_name: profile.username,
                          applicant_email: profile.email,
                          proposal: proposal,
                          status: 'pending',
                          created_at: new Date().toISOString()
                        }
                      ])
                      .select()
                      .single();

                    if (applicationError) throw applicationError;

                    // Try to create notification with error logging
                    try {
                      // Check if notifications table exists first
                      const { error: tableCheckError } = await supabase
                        .from('notifications')
                        .select('id')
                        .limit(1);
                        
                      // If table doesn't exist, skip notification creation
                      if (tableCheckError && tableCheckError.code === '42P01') {
                        console.log('Notifications table does not exist yet, skipping notification creation');
                        toast({
                          title: "Success",
                          description: "Your application has been submitted successfully.",
                        });
                        return;
                      }
                      
                      // If table exists, create notification
                      const { data: notifData, error: notifError } = await supabase
                        .from('notifications')
                        .insert([
                          {
                            user_id: taskData.creator_id,
                            title: 'New Task Application',
                            message: `${profile.username} has applied for your task "${taskData.title}"`,
                            type: 'info',
                            read: false,
                            related_id: application.id,
                            related_type: 'application',
                            created_at: new Date().toISOString()
                          }
                        ])
                        .select();

                      if (notifError) {
                        console.error('Notification creation error:', notifError);
                        // Don't throw the error, just log it
                        toast({
                          title: "Note",
                          description: "Application submitted but notification creation failed.",
                          variant: "default",
                        });
                      } else {
                        console.log('Notification created:', notifData);
                        toast({
                          title: "Success",
                          description: "Your application has been submitted successfully.",
                        });
                      }
                    } catch (notifError: any) {
                      // If notifications table doesn't exist, just log the error and continue
                      if (notifError.code === '42P01') {
                        console.log('Notifications table does not exist yet');
                        toast({
                          title: "Success",
                          description: "Your application has been submitted successfully.",
                        });
                      } else {
                        console.error('Error creating notification:', notifError);
                        toast({
                          title: "Note",
                          description: "Application submitted but notification creation failed.",
                          variant: "default",
                        });
                      }
                    }
                  } catch (error: any) {
                    console.error('Error submitting application:', error);
                    toast({
                      title: "Error",
                      description: error.message || "Failed to submit application. Please try again.",
                      variant: "destructive",
                    });
                  }
                }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Home;