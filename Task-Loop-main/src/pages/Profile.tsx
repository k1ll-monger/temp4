import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Star, Edit, LogOut, User, Camera, Upload } from 'lucide-react';
import { UserType, TaskType } from '@/lib/types';
import TaskCard from '@/components/TaskCard';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface UserProfile {
  id: string;
  username: string;
  email: string;
  avatar_url?: string;
  bio?: string;
  created_at: string;
  updated_at: string;
  requestorRating?: number;
  doerRating?: number;
}

interface Task {
  id: string;
  title: string;
  description: string;
  location: string;
  reward: number;
  deadline: string;
  task_type: string;
  status: string;
  created_at: string;
  creator_id: string;
  creator_name: string;
  creator_rating: number;
  assigned_to: string | null;
  completed_at: string | null;
  updated_at: string;
  taskType?: "normal" | "joint";
  createdAt?: Date;
  creatorId?: string;
  creatorName?: string;
}

const Profile = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [bio, setBio] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
  });
  const [isProfileImageDialogOpen, setIsProfileImageDialogOpen] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [activeTasks, setActiveTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [refreshingTasks, setRefreshingTasks] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    if (profile) {
      fetchActiveTasks();
    }
  }, [profile]);

  const getCurrentUser = async () => {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Session error:', sessionError);
      throw sessionError;
    }

    if (!session?.user) {
      console.log('No active session, redirecting to login');
      navigate('/login');
      return null;
    }

    return session.user;
  };

  const fetchProfile = async () => {
    try {
      console.log('Starting profile fetch...');
      const user = await getCurrentUser();
      if (!user) return;

      console.log('Current user:', user);

      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Profile fetch error:', profileError);
        throw profileError;
      }

      console.log('Fetched profile data:', profileData);

      if (!profileData) {
        console.log('No profile found, creating new profile...');
        // Create new profile
        const { data: newProfile, error: createError } = await supabase
          .from('users')
          .insert([
            {
              id: user.id,
              username: user.user_metadata.username || user.email?.split('@')[0] || 'User',
              email: user.email,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }
          ])
          .select()
          .single();

        if (createError) {
          console.error('Profile creation error:', createError);
          throw createError;
        }

        console.log('Created new profile:', newProfile);
        setProfile(newProfile);
        setBio(newProfile.bio || '');
      } else {
        setProfile(profileData);
        setBio(profileData.bio || '');
      }
    } catch (error: any) {
      console.error('Error in fetchProfile:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to load profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveTasks = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) return;

      const { data: tasks, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('creator_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setActiveTasks(tasks || []);
    } catch (error: any) {
      console.error('Error fetching tasks:', error);
      toast({
        title: "Error",
        description: "Failed to load tasks",
        variant: "destructive",
      });
    } finally {
      setLoadingTasks(false);
    }
  };

  const handleImageUpload = async (e: React.MouseEvent<HTMLButtonElement>) => {
    try {
      setUploading(true);
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = 'image/*';
      fileInput.onchange = async (event) => {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (!file) return;

        const user = await getCurrentUser();
        if (!user) return;

        // Upload image to Supabase Storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}-${Math.random()}.${fileExt}`;
        const filePath = `avatars/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);

        // Update user profile with new avatar URL
        const { error: updateError } = await supabase
          .from('users')
          .update({ 
            avatar_url: publicUrl,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);

        if (updateError) throw updateError;

        // Update local state
        setProfile(prev => prev ? { ...prev, avatar_url: publicUrl } : null);

        toast({
          title: "Success",
          description: "Profile picture updated successfully",
        });
      };
      fileInput.click();
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast({
        title: "Error",
        description: "Failed to upload profile picture",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleBioUpdate = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) return;

      const { error } = await supabase
        .from('users')
        .update({ 
          bio,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      // Update local state
      setProfile(prev => prev ? { ...prev, bio } : null);

      toast({
        title: "Success",
        description: "Bio updated successfully",
      });
    } catch (error: any) {
      console.error('Error updating bio:', error);
      toast({
        title: "Error",
        description: "Failed to update bio",
        variant: "destructive",
      });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Update user logic would go here
    setProfile(prev => prev ? { ...prev, username: formData.username, email: formData.email } : null);
    setIsEditing(false);
    toast({
      title: "Profile updated",
      description: "Your profile information has been updated successfully.",
    });
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/login');
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
    } catch (error) {
      console.error('Error logging out:', error);
      toast({
        title: "Error",
        description: "There was an error logging out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Here you would typically upload the file to a server or storage
      // For this mock example, we'll create a local URL
      const objectUrl = URL.createObjectURL(file);
      setProfile(prev => prev ? { ...prev, avatar_url: objectUrl } : null);
      setIsProfileImageDialogOpen(false);
      toast({
        title: "Profile image updated",
        description: "Your profile image has been updated successfully.",
      });
    }
  };

  const handleEditTask = async (task: TaskType) => {
    const taskToEdit: Task = {
      id: task.id,
      title: task.title,
      description: task.description,
      location: task.location,
      reward: task.reward,
      deadline: task.deadline.toISOString(),
      task_type: task.taskType,
      status: task.status,
      created_at: task.createdAt.toISOString(),
      creator_id: task.creatorId,
      creator_name: task.creatorName,
      creator_rating: task.creatorRating,
      updated_at: new Date().toISOString(),
      assigned_to: null,
      completed_at: null,
      taskType: task.taskType,
      createdAt: task.createdAt,
      creatorId: task.creatorId,
      creatorName: task.creatorName
    };
    setEditingTask(taskToEdit);
    setIsEditDialogOpen(true);
  };

  const handleUpdateTask = async (updatedTask: Task) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          title: updatedTask.title,
          description: updatedTask.description,
          location: updatedTask.location,
          reward: updatedTask.reward,
          deadline: updatedTask.deadline,
          updated_at: new Date().toISOString()
        })
        .eq('id', updatedTask.id);

      if (error) throw error;

      const updatedTaskType: TaskType = {
        id: updatedTask.id,
        title: updatedTask.title,
        description: updatedTask.description,
        location: updatedTask.location,
        reward: updatedTask.reward,
        deadline: new Date(updatedTask.deadline),
        taskType: updatedTask.task_type as "normal" | "joint",
        status: updatedTask.status as "active" | "completed",
        createdAt: new Date(updatedTask.created_at),
        creatorId: updatedTask.creator_id,
        creatorName: updatedTask.creator_name,
        creatorRating: updatedTask.creator_rating
      };

      setActiveTasks(tasks => 
        tasks.map(task => task.id === updatedTask.id ? updatedTask : task)
      );

      toast({
        title: "Success",
        description: "Task updated successfully",
      });

      setIsEditDialogOpen(false);
      setEditingTask(null);
    } catch (error: any) {
      console.error('Error updating task:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update task",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      setActiveTasks(tasks => tasks.filter(task => task.id !== taskId));

      toast({
        title: "Success",
        description: "Task deleted successfully",
      });
    } catch (error: any) {
      console.error('Error deleting task:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete task",
        variant: "destructive",
      });
    }
  };

  const handleTaskStatusChange = async (taskId: string) => {
    try {
      setRefreshingTasks(true);
      
      // Update the task status in the database
      const { error } = await supabase
        .from('tasks')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId);

      if (error) throw error;

      // Remove the completed task from active tasks
      setActiveTasks(tasks => tasks.filter(task => task.id !== taskId));

      toast({
        title: "Success",
        description: "Task marked as completed",
      });
    } catch (error: any) {
      console.error('Error updating task status:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update task status",
        variant: "destructive",
      });
    } finally {
      setRefreshingTasks(false);
    }
  };

  const handleCancelAssignedTask = async (taskId: string) => {
    try {
      // Update the task status back to active
      const { error: taskError } = await supabase
        .from('tasks')
        .update({ 
          status: 'active',
          assigned_to: null,
          assigned_at: null
        })
        .eq('id', taskId);

      if (taskError) throw taskError;

      // Update the application status to cancelled
      const { error: applicationError } = await supabase
        .from('task_applications')
        .update({ status: 'cancelled' })
        .eq('task_id', taskId)
        .eq('status', 'accepted');

      if (applicationError) throw applicationError;

      toast({
        title: "Success",
        description: "Task assignment cancelled successfully.",
      });

      fetchActiveTasks();
    } catch (error: any) {
      console.error('Error cancelling task assignment:', error);
      toast({
        title: "Error",
        description: "Failed to cancel task assignment. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCancelTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: 'cancelled' })
        .eq('id', taskId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Task cancelled successfully.",
      });

      fetchActiveTasks();
    } catch (error: any) {
      console.error('Error cancelling task:', error);
      toast({
        title: "Error",
        description: "Failed to cancel task. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Profile not found</h2>
          <Button onClick={() => navigate('/login')}>Go to Login</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              Profile
              {!isEditing && (
                <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                  <Edit size={16} />
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  {profile.avatar_url ? (
                    <AvatarImage 
                      src={profile.avatar_url} 
                      alt={profile.username}
                    />
                  ) : (
                    <AvatarFallback>
                      <User className="h-12 w-12" />
                    </AvatarFallback>
                  )}
                </Avatar>
              </div>
              
              {isEditing ? (
                <form onSubmit={handleSubmit} className="w-full space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button 
                      className={cn(buttonVariants({ variant: "destructive", size: "sm" }))}
                      onClick={() => setIsEditing(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      className={cn(buttonVariants({ variant: "default", size: "sm" }), "w-full")}
                      onClick={handleSubmit}
                    >
                      Save Changes
                    </Button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="text-center">
                    <h3 className="text-xl font-medium">{profile.username}</h3>
                    <p className="text-sm text-muted-foreground">{profile.email}</p>
                  </div>
                  
                  <div className="flex justify-center space-x-6 w-full">
                    <div className="text-center">
                      <div className="flex items-center justify-center">
                        <p className="text-yellow-500 font-bold">{profile.requestorRating?.toFixed(1) || 'N/A'}</p>
                        <Star className="h-4 w-4 text-yellow-500 ml-1" />
                      </div>
                      <p className="text-xs text-muted-foreground">Requestor Rating</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center">
                        <p className="text-green-500 font-bold">{profile.doerRating?.toFixed(1) || 'N/A'}</p>
                        <Star className="h-4 w-4 text-green-500 ml-1" />
                      </div>
                      <p className="text-xs text-muted-foreground">Doer Rating</p>
                    </div>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    className={buttonVariants({ variant: "default" })}
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
        
        <div className="md:col-span-2">
          <Tabs defaultValue="tasks">
            <TabsList>
              {/* Removed the Active Tasks button */}
            </TabsList>
            
            <TabsContent value="tasks" className="mt-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Your Active Tasks ({activeTasks.length})</h3>
                {refreshingTasks && (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                )}
              </div>
              {loadingTasks ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : activeTasks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No active tasks found
                </div>
              ) : (
                <div className="flex flex-col space-y-6">
                  {activeTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={{
                        id: task.id,
                        title: task.title,
                        description: task.description,
                        location: task.location,
                        reward: task.reward,
                        deadline: new Date(task.deadline),
                        taskType: task.task_type as "normal" | "joint",
                        status: task.status as "active" | "completed" | "assigned",
                        createdAt: new Date(task.created_at),
                        creatorId: task.creator_id,
                        creatorName: task.creator_name,
                        creatorRating: task.creator_rating
                      }}
                      isOwner={true}
                      onCancel={task.status === 'assigned' ? handleCancelAssignedTask : handleCancelTask}
                      onEdit={handleEditTask}
                      onDelete={handleDeleteTask}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          {editingTask && (
            <form onSubmit={(e) => {
              e.preventDefault();
              handleUpdateTask(editingTask);
            }}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={editingTask.title}
                    onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={editingTask.description}
                    onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={editingTask.location}
                    onChange={(e) => setEditingTask({ ...editingTask, location: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="reward">Reward</Label>
                  <Input
                    id="reward"
                    type="number"
                    value={editingTask.reward}
                    onChange={(e) => setEditingTask({ ...editingTask, reward: parseFloat(e.target.value) })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="deadline">Deadline</Label>
                  <Input
                    id="deadline"
                    type="datetime-local"
                    value={new Date(editingTask.deadline).toISOString().slice(0, 16)}
                    onChange={(e) => setEditingTask({ ...editingTask, deadline: new Date(e.target.value).toISOString() })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Save changes</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Profile;
