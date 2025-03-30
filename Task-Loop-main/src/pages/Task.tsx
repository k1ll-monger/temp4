import React, { useState } from 'react';
import Layout from '@/components/Layout';
import TaskCard from '@/components/TaskCard';
import CreateTaskForm from '@/components/CreateTaskForm';
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PlusCircle, ClipboardCheck, User, Clock, Check, X, Star } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TaskType, ApplicationType, JointTaskMemberType } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const mockUserTasks: TaskType[] = [
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
    taskType: 'joint',
    status: 'active',
    createdAt: new Date(),
    creatorId: 'user1',
    creatorName: 'John Doe',
    creatorRating: 4.5,
  },
];

const mockAppliedTasks: TaskType[] = [
  {
    id: '3',
    title: 'Dog Walking',
    description: 'Need someone to walk my dog for 30 minutes',
    location: 'Park Avenue',
    reward: 100,
    deadline: new Date(Date.now() + 1000 * 60 * 60 * 24), // 1 day from now
    taskType: 'normal',
    status: 'active',
    createdAt: new Date(),
    creatorId: 'user2',
    creatorName: 'Jane Smith',
    creatorRating: 4.8,
    doerId: 'user1', // This user is the doer
  },
  {
    id: '4',
    title: 'Computer Repair',
    description: 'Need help fixing my laptop',
    location: 'Tech Center',
    reward: 500,
    deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5), // 5 days from now
    taskType: 'joint',
    status: 'active',
    createdAt: new Date(),
    creatorId: 'user3',
    creatorName: 'Mike Johnson',
    creatorRating: 4.2,
    doerId: 'user1', // This user is the doer
  },
];

const mockApplications: ApplicationType[] = [
  {
    id: 'app1',
    taskId: '1',
    userId: 'user5',
    username: 'David Wilson',
    message: 'I live near Downtown Market and can do this for you quickly.',
    rating: 4.7,
    createdAt: new Date(),
  },
];

const mockJointTaskRequests: JointTaskMemberType[] = [
  {
    id: 'jtr1',
    userId: 'user6',
    username: 'Emma Thomas',
    taskId: '2',
    needs: 'I also need help with organizing my closet after cleaning',
    reward: 150,
    rating: 4.3,
  },
];

const Task = () => {
  const [tasks, setTasks] = useState<TaskType[]>(mockUserTasks);
  const [appliedTasks, setAppliedTasks] = useState<TaskType[]>(mockAppliedTasks);
  const [applications, setApplications] = useState<ApplicationType[]>(mockApplications);
  const [jointTaskRequests, setJointTaskRequests] = useState<JointTaskMemberType[]>(mockJointTaskRequests);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const [showApplicationDialog, setShowApplicationDialog] = useState(false);
  const [currentApplication, setCurrentApplication] = useState<ApplicationType | null>(null);
  
  const [showJointRequestDialog, setShowJointRequestDialog] = useState(false);
  const [currentJointRequest, setCurrentJointRequest] = useState<JointTaskMemberType | null>(null);

  const handleCreateTask = (task: TaskType) => {
    if (tasks.filter(t => t.status === 'active').length >= 3) {
      toast({
        title: "Limit Reached",
        description: "You can only have 3 active tasks at a time.",
        variant: "destructive"
      });
      return;
    }
    
    setTasks([...tasks, task]);
    setIsOpen(false);
    toast({
      title: "Task Created",
      description: "Your task has been created successfully."
    });
  };

  const handleCancelTask = (taskId: string) => {
    setTasks(tasks.filter(task => task.id !== taskId));
    toast({
      title: "Task Cancelled",
      description: "Your task has been cancelled."
    });
  };

  const handleEditTask = (updatedTask: TaskType) => {
    setTasks(tasks.map(task => task.id === updatedTask.id ? updatedTask : task));
    toast({
      title: "Task Updated",
      description: "Your task has been updated successfully."
    });
  };

  const handleApplyForTask = (taskId: string, message: string) => {
    const newApplication: ApplicationType = {
      id: `app-${Date.now()}`,
      taskId,
      userId: 'user1',
      username: 'Current User',
      message,
      rating: 4.5,
      createdAt: new Date(),
    };
    setApplications([...applications, newApplication]);
  };

  const handleJoinJointTask = (taskId: string, needs: string, reward: number) => {
    const newJointTaskRequest: JointTaskMemberType = {
      id: `jtr-${Date.now()}`,
      userId: 'user1',
      username: 'Current User',
      taskId,
      needs,
      reward,
      rating: 4.5,
    };
    setJointTaskRequests([...jointTaskRequests, newJointTaskRequest]);
  };

  const handleApproveApplication = (application: ApplicationType) => {
    const updatedTasks = tasks.map(task => {
      if (task.id === application.taskId) {
        return {
          ...task,
          doerId: application.userId,
          doerName: application.username,
          doerRating: application.rating
        };
      }
      return task;
    });
    
    setTasks(updatedTasks);
    
    setApplications(applications.filter(app => app.id !== application.id));
    
    setShowApplicationDialog(false);
    setCurrentApplication(null);
    
    toast({
      title: "Application Approved",
      description: `${application.username} has been assigned to the task.`
    });
  };

  const handleRejectApplication = (applicationId: string) => {
    setApplications(applications.filter(app => app.id !== applicationId));
    setShowApplicationDialog(false);
    setCurrentApplication(null);
    toast({
      title: "Application Rejected",
      description: "The application has been rejected."
    });
  };

  const handleApproveJointRequest = (request: JointTaskMemberType) => {
    toast({
      title: "Joint Request Approved",
      description: `${request.username} has been added to the joint task.`
    });
    
    setJointTaskRequests(jointTaskRequests.filter(req => req.id !== request.id));
    
    setShowJointRequestDialog(false);
    setCurrentJointRequest(null);
  };

  const handleRejectJointRequest = (requestId: string) => {
    setJointTaskRequests(jointTaskRequests.filter(req => req.id !== requestId));
    setShowJointRequestDialog(false);
    setCurrentJointRequest(null);
    toast({
      title: "Joint Request Rejected",
      description: "The joint task request has been rejected."
    });
  };

  const handleAddToChat = (taskId: string) => {
    toast({
      title: "Chat Started",
      description: "A chat has been started with the task owner."
    });
  };

  const taskApplications = applications.filter(
    app => tasks.some(task => task.id === app.taskId && task.creatorId === 'user1')
  );
  
  const taskJointRequests = jointTaskRequests.filter(
    req => tasks.some(task => task.id === req.taskId && task.creatorId === 'user1')
  );
  
  const getActiveTasks = () => {
    const createdActiveTasks = tasks.filter(task => task.status === 'active');
    const userDoingTasks = appliedTasks.filter(task => task.doerId === 'user1' && task.status === 'active');
    return [...createdActiveTasks, ...userDoingTasks];
  };

  const getCreatedTasks = () => {
    return tasks.filter(task => task.creatorId === 'user1');
  };

  const hasPendingRequests = taskApplications.length > 0 || taskJointRequests.length > 0;

  return (
    <Layout requireAuth>
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-6">
          <Tabs defaultValue="active" className="w-full">
            <div className="flex justify-between items-center">
              <TabsList>
                <TabsTrigger value="active">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>Active ({getActiveTasks().length})</span>
                  </div>
                </TabsTrigger>
                <TabsTrigger value="applied">
                  <div className="flex items-center gap-1">
                    <ClipboardCheck className="h-4 w-4" />
                    <span>Applied ({appliedTasks.length})</span>
                  </div>
                </TabsTrigger>
                <TabsTrigger value="created">
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    <span>Created ({getCreatedTasks().length})</span>
                  </div>
                </TabsTrigger>
                <TabsTrigger value="completed">Completed Tasks</TabsTrigger>
                {hasPendingRequests && (
                  <TabsTrigger value="requests" className="relative">
                    Requests
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                      {taskApplications.length + taskJointRequests.length}
                    </span>
                  </TabsTrigger>
                )}
              </TabsList>
              
              <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <PlusCircle size={18} />
                    Create Task
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[550px]">
                  <CreateTaskForm 
                    onSubmit={handleCreateTask} 
                    onCancel={() => setIsOpen(false)} 
                  />
                </DialogContent>
              </Dialog>
            </div>
            
            <TabsContent value="active" className="space-y-4">
              {getActiveTasks().length > 0 ? (
                <div className="flex flex-col space-y-6">
                  {getActiveTasks().map(task => (
                    <TaskCard 
                      key={task.id} 
                      task={task} 
                      onCancel={task.creatorId === 'user1' ? handleCancelTask : undefined}
                      onEdit={task.creatorId === 'user1' ? handleEditTask : undefined}
                      isOwner={task.creatorId === 'user1'}
                      onApply={handleApplyForTask}
                      onJoinJointTask={handleJoinJointTask}
                      onAddToChat={handleAddToChat}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <p className="text-muted-foreground">You don't have any active tasks.</p>
                  <p className="text-muted-foreground">Click the "Create Task" button to create one!</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="applied">
              {appliedTasks.length > 0 ? (
                <div className="flex flex-col space-y-6">
                  {appliedTasks.map(task => (
                    <TaskCard 
                      key={task.id} 
                      task={task} 
                      isOwner={false}
                      onAddToChat={handleAddToChat}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <p className="text-muted-foreground">You haven't applied to any tasks yet.</p>
                  <p className="text-muted-foreground">Browse the marketplace to find tasks you'd like to complete!</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="created" className="space-y-4">
              {getCreatedTasks().length > 0 ? (
                <div className="flex flex-col space-y-6">
                  {getCreatedTasks().map(task => (
                    <TaskCard 
                      key={task.id} 
                      task={task} 
                      onCancel={handleCancelTask}
                      onEdit={handleEditTask}
                      isOwner={true}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <p className="text-muted-foreground">You haven't created any tasks yet.</p>
                  <p className="text-muted-foreground">Click the "Create Task" button to create one!</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="completed">
              {tasks.filter(task => task.status === 'completed').length > 0 ? (
                <div className="flex flex-col space-y-6">
                  {tasks
                    .filter(task => task.status === 'completed')
                    .map(task => (
                      <TaskCard 
                        key={task.id} 
                        task={task} 
                        isOwner={true}
                        isCompleted={true}
                      />
                    ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <p className="text-muted-foreground">You don't have any completed tasks yet.</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="requests">
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">Pending Requests</h3>
                
                {taskApplications.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="text-md font-medium">Task Applications</h4>
                    {taskApplications.map(application => (
                      <div key={application.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <Avatar>
                              <AvatarFallback>{application.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{application.username}</p>
                              <div className="flex items-center text-sm text-muted-foreground">
                                <span className="text-yellow-500 font-medium">{application.rating.toFixed(1)}</span>
                                <Star className="h-3 w-3 text-yellow-500 ml-1" fill="currentColor" />
                              </div>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Applied {application.createdAt.toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        
                        <div className="mb-3">
                          <p className="text-sm font-medium">Task: {tasks.find(t => t.id === application.taskId)?.title}</p>
                          <p className="text-sm text-muted-foreground mt-1">{application.message}</p>
                        </div>
                        
                        <div className="flex justify-end space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              handleRejectApplication(application.id);
                            }}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                          <Button 
                            size="sm"
                            onClick={() => {
                              handleApproveApplication(application);
                            }}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {taskJointRequests.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="text-md font-medium">Joint Task Requests</h4>
                    {taskJointRequests.map(request => (
                      <div key={request.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <Avatar>
                              <AvatarFallback>{request.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{request.username}</p>
                              <div className="flex items-center text-sm text-muted-foreground">
                                <span className="text-yellow-500 font-medium">{request.rating.toFixed(1)}</span>
                                <Star className="h-3 w-3 text-yellow-500 ml-1" fill="currentColor" />
                              </div>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-bold">₹{request.reward}</p>
                          </div>
                        </div>
                        
                        <div className="mb-3">
                          <p className="text-sm font-medium">Task: {tasks.find(t => t.id === request.taskId)?.title}</p>
                          <p className="text-sm text-muted-foreground mt-1">{request.needs}</p>
                        </div>
                        
                        <div className="flex justify-end space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              handleRejectJointRequest(request.id);
                            }}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                          <Button 
                            size="sm"
                            onClick={() => {
                              handleApproveJointRequest(request);
                            }}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {taskApplications.length === 0 && taskJointRequests.length === 0 && (
                  <div className="text-center py-10">
                    <p className="text-muted-foreground">You don't have any pending requests.</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default Task;

