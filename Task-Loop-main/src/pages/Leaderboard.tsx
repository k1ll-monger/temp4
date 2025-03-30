import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Star } from 'lucide-react';
import Layout from '@/components/Layout';

// Sample leaderboard data
const topRequestors = [
  { id: 1, name: 'John Doe', avatar: 'https://github.com/shadcn.png', tasksCreated: 35, rating: 4.8 },
  { id: 2, name: 'Alice Smith', avatar: '', tasksCreated: 32, rating: 4.7 },
  { id: 3, name: 'Robert Johnson', avatar: '', tasksCreated: 28, rating: 4.9 },
  { id: 4, name: 'Emma Wilson', avatar: '', tasksCreated: 25, rating: 4.6 },
  { id: 5, name: 'Michael Brown', avatar: '', tasksCreated: 22, rating: 4.5 },
];

const topDoers = [
  { id: 1, name: 'Lisa Anderson', avatar: '', tasksCompleted: 42, rating: 4.9 },
  { id: 2, name: 'David Miller', avatar: '', tasksCompleted: 38, rating: 4.8 },
  { id: 3, name: 'Jennifer Lee', avatar: 'https://github.com/shadcn.png', tasksCompleted: 35, rating: 4.7 },
  { id: 4, name: 'James Wilson', avatar: '', tasksCompleted: 30, rating: 4.6 },
  { id: 5, name: 'Sarah Garcia', avatar: '', tasksCompleted: 28, rating: 4.8 },
];

const Leaderboard = () => {
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const localSession = localStorage.getItem('taskloop_session');
      const isAuthenticated = localSession ? JSON.parse(localSession).isAuthenticated : false;

      if (!isAuthenticated) {
        navigate('/login');
      }
    } catch (error) {
      console.error('Error parsing session data:', error);
      navigate('/login');
    }
  }, [navigate]);

  const getAvatar = (avatar: string, name: string) => 
    avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Trophy size={32} className="text-primary" />
          <h1 className="text-3xl font-bold text-primary">Leaderboard</h1>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Task Loop Champions</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="requestors">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="requestors">Top Requestors</TabsTrigger>
                <TabsTrigger value="doers">Top Doers</TabsTrigger>
              </TabsList>
              
              <TabsContent value="requestors">
                <Table>
                  <TableCaption>Users who created the most tasks</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px]">Rank</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Tasks Created</TableHead>
                      <TableHead className="text-right">Rating</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topRequestors.map((user, index) => (
                      <TableRow key={user.id} className={index < 3 ? "bg-muted/20" : ""}>
                        <TableCell className="font-medium">
                          {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `${index + 1}`}
                        </TableCell>
                        <TableCell className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={getAvatar(user.avatar, user.name)} alt={`${user.name}'s avatar`} />
                            <AvatarFallback>{user.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                          </Avatar>
                          {user.name}
                        </TableCell>
                        <TableCell>{user.tasksCreated}</TableCell>
                        <TableCell className="text-right text-yellow-500 font-medium">
                          {user.rating} ⭐
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>
              
              <TabsContent value="doers">
                <Table>
                  <TableCaption>Users who completed the most tasks</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px]">Rank</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Tasks Completed</TableHead>
                      <TableHead className="text-right">Rating</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topDoers.map((user, index) => (
                      <TableRow key={user.id} className={index < 3 ? "bg-muted/20" : ""}>
                        <TableCell className="font-medium">
                          {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `${index + 1}`}
                        </TableCell>
                        <TableCell className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={getAvatar(user.avatar, user.name)} alt={`${user.name}'s avatar`} />
                            <AvatarFallback>{user.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                          </Avatar>
                          {user.name}
                        </TableCell>
                        <TableCell>{user.tasksCompleted}</TableCell>
                        <TableCell className="text-right text-green-500 font-medium">
                          {user.rating} <Star className="inline h-4 w-4 text-green-500" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Leaderboard;
