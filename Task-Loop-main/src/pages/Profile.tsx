
import React, { useState, useRef } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Star, Edit, LogOut, User, Camera, Upload } from 'lucide-react';
import { UserType, TaskType } from '@/lib/types';
import TaskCard from '@/components/TaskCard';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

const mockUser: UserType = {
  id: 'user1',
  username: 'John Doe',
  email: 'john.doe@example.com',
  requestorRating: 4.5,
  doerRating: 4.6,
  profileImage: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=2080&auto=format&fit=crop&ixlib=rb-4.0.3',
};

const mockActiveTasks: TaskType[] = [
  {
    id: '1',
    title: 'Grocery Shopping',
    description: 'Need someone to pick up groceries from the local market',
    location: 'Downtown Market',
    reward: 150,
    deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2), // 2 days from now
    taskType: 'normal',
    status: 'active',
    createdAt: new Date(),
    creatorId: 'user1',
    creatorName: 'John Doe',
    creatorRating: 4.5,
  },
  {
    id: '2',
    title: 'House Cleaning',
    description: 'Need help cleaning a 2 bedroom apartment',
    location: 'Central Apartments',
    reward: 300,
    deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3), // 3 days from now
    taskType: 'normal',
    status: 'active',
    createdAt: new Date(),
    creatorId: 'user1',
    creatorName: 'John Doe',
    creatorRating: 4.5,
  },
];

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserType>(mockUser);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: user.username,
    email: user.email,
  });
  const [isProfileImageDialogOpen, setIsProfileImageDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    setUser({
      ...user,
      username: formData.username,
      email: formData.email,
    });
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
      setUser({
        ...user,
        profileImage: objectUrl,
      });
      setIsProfileImageDialogOpen(false);
      toast({
        title: "Profile image updated",
        description: "Your profile image has been updated successfully.",
      });
    }
  };

  return (
    <Layout requireAuth>
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
                    {user.profileImage ? (
                      <AvatarImage 
                        src={user.profileImage} 
                        alt={user.username}
                      />
                    ) : (
                      <AvatarFallback>
                        <User className="h-12 w-12" />
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <Button 
                    size="icon" 
                    className="absolute bottom-0 right-0 h-8 w-8 rounded-full"
                    onClick={() => setIsProfileImageDialogOpen(true)}
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
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
                        type="button" 
                        variant="outline" 
                        onClick={() => {
                          setIsEditing(false);
                          setFormData({ username: user.username, email: user.email });
                        }}
                      >
                        Cancel
                      </Button>
                      <Button type="submit">Save</Button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div className="text-center">
                      <h3 className="text-xl font-medium">{user.username}</h3>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    
                    <div className="flex justify-center space-x-6 w-full">
                      <div className="text-center">
                        <div className="flex items-center justify-center">
                          <p className="text-yellow-500 font-bold">{user.requestorRating.toFixed(1)}</p>
                          <Star className="h-4 w-4 text-yellow-500 ml-1" />
                        </div>
                        <p className="text-xs text-muted-foreground">Requestor Rating</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center">
                          <p className="text-green-500 font-bold">{user.doerRating.toFixed(1)}</p>
                          <Star className="h-4 w-4 text-green-500 ml-1" />
                        </div>
                        <p className="text-xs text-muted-foreground">Doer Rating</p>
                      </div>
                    </div>
                    
                    <Button 
                      variant="outline" 
                      className="w-full" 
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
                <TabsTrigger value="tasks">Active Tasks</TabsTrigger>
                <TabsTrigger value="stats">Statistics</TabsTrigger>
              </TabsList>
              
              <TabsContent value="tasks" className="mt-4">
                <h3 className="text-lg font-medium mb-4">Your Active Tasks ({mockActiveTasks.length}/3)</h3>
                <div className="flex flex-col space-y-6">
                  {mockActiveTasks.map(task => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      isOwner={true}
                    />
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="stats" className="mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Tasks Created</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">12</div>
                      <p className="text-xs text-muted-foreground">All time</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Tasks Completed</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">8</div>
                      <p className="text-xs text-muted-foreground">As a doer</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Total Rewards Earned</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">₹4,500</div>
                      <p className="text-xs text-muted-foreground">As a doer</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Total Rewards Paid</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">₹7,200</div>
                      <p className="text-xs text-muted-foreground">As a requestor</p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      <Dialog open={isProfileImageDialogOpen} onOpenChange={setIsProfileImageDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change profile picture</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center space-y-4 py-4">
            <div className="flex items-center justify-center">
              <Avatar className="h-24 w-24">
                {user.profileImage ? (
                  <AvatarImage 
                    src={user.profileImage} 
                    alt={user.username}
                  />
                ) : (
                  <AvatarFallback>
                    <User className="h-12 w-12" />
                  </AvatarFallback>
                )}
              </Avatar>
            </div>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleProfileImageChange}
              className="hidden"
            />
            <Button onClick={triggerFileInput} className="w-full">
              <Upload className="mr-2 h-4 w-4" />
              Upload new image
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Profile;
