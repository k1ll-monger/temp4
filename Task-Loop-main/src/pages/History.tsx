import React, { useState } from 'react';
import Layout from '@/components/Layout';
import TaskCard from '@/components/TaskCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { TaskType } from '@/lib/types';

const mockTaskHistory: TaskType[] = [
  {
    id: '1',
    title: 'Grocery Shopping',
    description: 'Picked up groceries from the local market',
    location: 'Downtown Market',
    reward: 150,
    deadline: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
    taskType: 'normal',
    status: 'completed',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5), // 5 days ago
    creatorId: 'user1',
    creatorName: 'John Doe',
    creatorRating: 4.5,
    doerId: 'user2',
    doerName: 'Jane Smith',
    doerRating: 4.8,
  },
  {
    id: '2',
    title: 'House Cleaning',
    description: 'Cleaned a 2 bedroom apartment thoroughly',
    location: 'Central Apartments',
    reward: 300,
    deadline: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1), // 1 day ago
    taskType: 'normal',
    status: 'completed',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4), // 4 days ago
    creatorId: 'user1',
    creatorName: 'John Doe',
    creatorRating: 4.5,
    doerId: 'user4',
    doerName: 'Sara Williams',
    doerRating: 4.2,
  },
  {
    id: '3',
    title: 'Website Design',
    description: 'Designed a landing page for a small business',
    location: 'Remote',
    reward: 1500,
    deadline: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10), // 10 days ago
    taskType: 'normal',
    status: 'completed',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15), // 15 days ago
    creatorId: 'user3',
    creatorName: 'Mike Johnson',
    creatorRating: 4.3,
    doerId: 'user1',
    doerName: 'John Doe',
    doerRating: 4.6,
  },
  {
    id: '4',
    title: 'Dog Walking',
    description: 'Walked a labrador for 1 hour in the park',
    location: 'City Park',
    reward: 100,
    deadline: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7), // 7 days ago
    taskType: 'normal',
    status: 'completed',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 9), // 9 days ago
    creatorId: 'user5',
    creatorName: 'Alex Brown',
    creatorRating: 4.7,
    doerId: 'user1',
    doerName: 'John Doe',
    doerRating: 4.6,
  },
  {
    id: '5',
    title: 'Community Event Organization',
    description: 'Organized a local community cleanup event',
    location: 'Community Center',
    reward: 500,
    deadline: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14), // 14 days ago
    taskType: 'joint',
    status: 'completed',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30), // 30 days ago
    creatorId: 'user1',
    creatorName: 'John Doe',
    creatorRating: 4.5,
    doerId: 'user6',
    doerName: 'Emma Wilson',
    doerRating: 4.9,
  },
];

const History = () => {
  const [searchQuery, setSearchQuery] = useState('');
  
  const filteredTasks = mockTaskHistory.filter(task => 
    task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    task.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    task.location.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const createdTasks = filteredTasks.filter(task => task.creatorId === 'user1');
  const completedTasks = filteredTasks.filter(task => task.doerId === 'user1');

  return (
    <Layout requireAuth>
      <div className="container mx-auto py-8">
        <h1 className="text-xl font-semibold text-primary mb-6">Task History</h1>
        
        <div className="relative mb-6">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks by name, description, or location..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="all">All Tasks ({filteredTasks.length})</TabsTrigger>
            <TabsTrigger value="created">Created Tasks ({createdTasks.length})</TabsTrigger>
            <TabsTrigger value="completed">Completed Tasks ({completedTasks.length})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all">
            <div className="flex flex-col space-y-6">
              {filteredTasks.length > 0 ? (
                filteredTasks.map(task => (
                  <TaskCard 
                    key={task.id} 
                    task={task} 
                    isOwner={task.creatorId === 'user1'}
                    isCompleted={true}
                  />
                ))
              ) : (
                <div className="text-center py-10">
                  <p className="text-muted-foreground">No tasks found matching your search.</p>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="created">
            <div className="flex flex-col space-y-6">
              {createdTasks.length > 0 ? (
                createdTasks.map(task => (
                  <TaskCard 
                    key={task.id} 
                    task={task} 
                    isOwner={true}
                    isCompleted={true}
                  />
                ))
              ) : (
                <div className="text-center py-10">
                  <p className="text-muted-foreground">No created tasks found matching your search.</p>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="completed">
            <div className="flex flex-col space-y-6">
              {completedTasks.length > 0 ? (
                completedTasks.map(task => (
                  <TaskCard 
                    key={task.id} 
                    task={task} 
                    isOwner={false}
                    isCompleted={true}
                  />
                ))
              ) : (
                <div className="text-center py-10">
                  <p className="text-muted-foreground">No completed tasks found matching your search.</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default History;

