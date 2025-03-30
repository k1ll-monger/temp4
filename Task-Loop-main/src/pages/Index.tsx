
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import TaskCard from '@/components/TaskCard';
import { TaskType } from '@/lib/types';
import { PlusCircle } from 'lucide-react';

// Sample tasks data for demonstration
const sampleTasks: TaskType[] = [
  {
    id: '1',
    title: 'Grocery Shopping',
    description: 'Buy groceries from the supermarket including vegetables, fruits, and dairy products.',
    reward: 200,
    location: 'City Market',
    deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2), // 2 days from now
    taskType: 'normal',
    status: 'active',
    creatorId: 'user1',
    creatorName: 'John Doe',
    creatorRating: 4.5,
    createdAt: new Date(),
  },
  {
    id: '2',
    title: 'House Cleaning',
    description: 'Clean a 2BHK apartment including dusting, mopping, and bathroom cleaning.',
    reward: 500,
    location: 'Riverside Apartments',
    deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 1), // 1 day from now
    taskType: 'joint',
    status: 'active',
    creatorId: 'user2',
    creatorName: 'Jane Smith',
    creatorRating: 4.8,
    createdAt: new Date(),
  },
  {
    id: '3',
    title: 'Dog Walking',
    description: 'Walk a golden retriever for 30 minutes in the evening.',
    reward: 150,
    location: 'Central Park',
    deadline: new Date(Date.now() + 1000 * 60 * 60 * 12), // 12 hours from now
    taskType: 'normal',
    status: 'active',
    creatorId: 'user3',
    creatorName: 'Mike Johnson',
    creatorRating: 4.2,
    createdAt: new Date(),
  },
  {
    id: '4',
    title: 'Web Development',
    description: 'Build a simple landing page using HTML, CSS, and JavaScript.',
    reward: 2000,
    location: 'Remote',
    deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5), // 5 days from now
    taskType: 'normal',
    status: 'active',
    creatorId: 'user4',
    creatorName: 'Sarah Williams',
    creatorRating: 4.9,
    createdAt: new Date(),
  },
];

const Index = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredTasks, setFilteredTasks] = useState(sampleTasks);

  const handleSearch = (term: string) => {
    const lowerCaseTerm = term.toLowerCase();
    setSearchTerm(lowerCaseTerm);
    
    const filtered = sampleTasks.filter(task => 
      task.title.toLowerCase().includes(lowerCaseTerm) || 
      task.description.toLowerCase().includes(lowerCaseTerm) || 
      task.location.toLowerCase().includes(lowerCaseTerm)
    );
    
    setFilteredTasks(filtered);
  };

  return (
    <Layout onSearch={handleSearch} requireAuth>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-xl font-semibold text-primary">Available Tasks</h1>
          <Link to="/task">
            <Button className="flex items-center gap-2">
              <PlusCircle size={20} />
              Create Task
            </Button>
          </Link>
        </div>

        {filteredTasks.length === 0 ? (
          <div className="text-center py-10">
            <h2 className="text-2xl font-semibold text-gray-500">No tasks found</h2>
            <p className="mt-2 text-gray-400">Try adjusting your search or create a new task</p>
          </div>
        ) : (
          <div className="flex flex-col space-y-6">
            {filteredTasks.map(task => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Index;
