import React, { useState, useEffect } from 'react';
import TaskCard from '@/components/TaskCard';
import CreateTaskForm from '@/components/CreateTaskForm';
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PlusCircle, ClipboardCheck, User, Clock, Check, X, Star, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TaskType, ApplicationType, JointTaskMemberType } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'react-router-dom';

const Tasks = () => {
  const [activeTasks, setActiveTasks] = useState<TaskType[]>([]);
  const [createdTasks, setCreatedTasks] = useState<TaskType[]>([]);
  const [completedTasks, setCompletedTasks] = useState<TaskType[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();
  const location = useLocation();
  const showCompleted = location.pathname === '/tasks/completed';

  useEffect(() => {
    if (user) {
      if (showCompleted) {
        fetchCompletedTasks();
      } else {
        fetchTasks();
      }
    }
  }, [user, showCompleted]);

  const fetchCompletedTasks = async () => {
    try {
      setLoading(true);
      console.log("📣 Fetching completed tasks for user:", user?.id);

      // First, check the tasks table directly to see all completed tasks regardless of user
      const { data: allCompletedTasksCheck, error: allCompletedError } = await supabase
        .from('tasks')
        .select('*')
        .eq('status', 'completed')
        .order('completed_at', { ascending: false });
        
      if (allCompletedError) {
        console.error("📣 Error checking all completed tasks:", allCompletedError);
      } else {
        console.log("📣 ALL completed tasks in the database:", allCompletedTasksCheck);
      }
      
      // Fetch tasks created by the user that are completed
      const { data: creatorCompletedData, error: creatorCompletedError } = await supabase
        .from('tasks')
        .select('*')
        .eq('creator_id', user?.id)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false });
        
      if (creatorCompletedError) {
        console.error("📣 Error fetching creator completed tasks:", creatorCompletedError);
        throw creatorCompletedError;
      }
      
      console.log("📣 Creator completed tasks:", creatorCompletedData);
      
      // Fetch tasks the user completed as a doer
      const { data: doerCompletedData, error: doerCompletedError } = await supabase
        .from('tasks')
        .select('*')
        .eq('assigned_to', user?.id)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false });
        
      if (doerCompletedError) {
        console.error("📣 Error fetching doer completed tasks:", doerCompletedError);
        throw doerCompletedError;
      }
      
      console.log("📣 Doer completed tasks:", doerCompletedData);
      
      // Combine and transform all completed tasks
      const allCompletedTasksData = [
        ...(creatorCompletedData || []),
        ...(doerCompletedData || [])
      ];
      
      console.log("📣 Combined completed tasks:", allCompletedTasksData);
      
      // Remove duplicates
      const uniqueTasks = Array.from(
        new Map(allCompletedTasksData.map(task => [task.id, task])).values()
      );
      
      console.log("📣 Unique completed tasks:", uniqueTasks);
      
      // Transform to TaskType
      const transformedCompletedTasks = uniqueTasks.map(task => ({
        id: task.id,
        title: task.title,
        description: task.description,
        location: task.location,
        reward: task.reward,
        deadline: new Date(task.deadline),
        taskType: task.task_type,
        status: task.status,
        createdAt: new Date(task.created_at),
        creatorId: task.creator_id,
        creatorName: task.creator_name,
        creatorRating: task.creator_rating || 0,
        assignedTo: task.assigned_to,
        assignedAt: task.assigned_at ? new Date(task.assigned_at) : null,
      }));
      
      console.log("📣 Transformed completed tasks:", transformedCompletedTasks);
      setCompletedTasks(transformedCompletedTasks);
    } catch (error: any) {
      console.error('Error fetching completed tasks:', error);
      toast({
        title: "Error",
        description: "Failed to load completed tasks. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);
      console.log("🔎 fetchTasks called - user:", user?.id);
      
      // Fetch tasks created by the user (excluding completed tasks)
      const { data: createdTasksData, error: createdError } = await supabase
        .from('tasks')
        .select('*')
        .eq('creator_id', user?.id)
        .not('status', 'eq', 'completed')
        .order('created_at', { ascending: false });

      if (createdError) {
        console.error("🔎 Error fetching created tasks:", createdError);
        throw createdError;
      }
      
      console.log("🔎 Created tasks (not completed):", createdTasksData);

      // Fetch tasks the user has applied for
      const { data: appliedTasksData, error: appliedError } = await supabase
        .from('task_applications')
        .select(`
          task:tasks (
            id,
            title,
            description,
            location,
            reward,
            deadline,
            task_type,
            status,
            created_at,
            creator_id,
            creator_name,
            creator_rating,
            assigned_to,
            assigned_at
          )
        `)
        .eq('applicant_id', user?.id)
        .eq('status', 'accepted');

      if (appliedError) {
        console.error("🔎 Error fetching applied tasks:", appliedError);
        throw appliedError;
      }
      
      console.log("🔎 Applied tasks:", appliedTasksData);

      // Double-check directly for any completed tasks
      console.log("🔎 Running direct check for completed tasks...");
      const { data: completedCheckData, error: completedCheckError } = await supabase
        .from('tasks')
        .select('*')
        .eq('status', 'completed')
        .or(`creator_id.eq.${user?.id},assigned_to.eq.${user?.id}`);
        
      if (completedCheckError) {
        console.error("🔎 Error checking completed tasks:", completedCheckError);
      } else {
        console.log("🔎 Direct check for completed tasks found:", completedCheckData?.length || 0, "tasks");
        if (completedCheckData && completedCheckData.length > 0) {
          console.log("🔎 First completed task:", completedCheckData[0]);
        }
      }

      // Transform the data to match TaskType
      const transformedCreatedTasks = createdTasksData?.map(task => ({
        id: task.id,
        title: task.title,
        description: task.description,
        location: task.location,
        reward: task.reward,
        deadline: new Date(task.deadline),
        taskType: task.task_type,
        status: task.status,
        createdAt: new Date(task.created_at),
        creatorId: task.creator_id,
        creatorName: task.creator_name,
        creatorRating: task.creator_rating,
        assignedTo: task.assigned_to,
        assignedAt: task.assigned_at ? new Date(task.assigned_at) : null,
      })) || [];

      // Need to handle the task property differently to fix type errors
      const transformedAppliedTasks = (appliedTasksData || [])
        .filter(item => item && item.task)
        .map(item => {
          const task = item.task as any;
          return {
            id: task.id,
            title: task.title,
            description: task.description,
            location: task.location,
            reward: task.reward,
            deadline: new Date(task.deadline),
            taskType: task.task_type,
            status: task.status,
            createdAt: new Date(task.created_at),
            creatorId: task.creator_id,
            creatorName: task.creator_name,
            creatorRating: task.creator_rating,
            assignedTo: task.assigned_to,
            assignedAt: task.assigned_at ? new Date(task.assigned_at) : null,
          };
        });

      // Filter out completed tasks
      const filteredAppliedTasks = transformedAppliedTasks.filter(task => task.status !== 'completed');

      setCreatedTasks(transformedCreatedTasks);
      setActiveTasks(filteredAppliedTasks);
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

  const handleCreateTask = async (task: TaskType) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .insert({
          title: task.title,
          description: task.description,
          location: task.location,
          reward: task.reward,
          deadline: task.deadline.toISOString(),
          task_type: task.taskType,
          status: 'active',
          creator_id: user?.id,
          creator_name: user?.user_metadata?.name || 'Anonymous',
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Task created successfully.",
      });

      setIsCreateDialogOpen(false);
      fetchTasks();
    } catch (error: any) {
      console.error('Error creating task:', error);
      toast({
        title: "Error",
        description: "Failed to create task. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCancelTask = async (taskId: string) => {
    try {
      // First, check if the task is assigned
      const { data: taskData, error: taskError } = await supabase
        .from('tasks')
        .select('status, assigned_to')
        .eq('id', taskId)
        .single();

      if (taskError) throw taskError;

      if (taskData.status === 'assigned') {
        // If the task is assigned, update it back to active
        const { error: updateError } = await supabase
          .from('tasks')
          .update({ 
            status: 'active',
            assigned_to: null,
            assigned_at: null
          })
          .eq('id', taskId);

        if (updateError) throw updateError;

        // Update the corresponding application status to cancelled
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
      } else {
        // If the task is not assigned, cancel it completely
        const { error: cancelError } = await supabase
          .from('tasks')
          .update({ status: 'cancelled' })
          .eq('id', taskId);

        if (cancelError) throw cancelError;

        toast({
          title: "Success",
          description: "Task cancelled successfully.",
        });
      }

      fetchTasks();
    } catch (error: any) {
      console.error('Error cancelling task:', error);
      toast({
        title: "Error",
        description: "Failed to cancel task. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEditTask = async (updatedTask: TaskType) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          title: updatedTask.title,
          description: updatedTask.description,
          location: updatedTask.location,
          reward: updatedTask.reward,
          deadline: updatedTask.deadline.toISOString(),
        })
        .eq('id', updatedTask.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Task updated successfully.",
      });

      fetchTasks();
    } catch (error: any) {
      console.error('Error updating task:', error);
      toast({
        title: "Error",
        description: "Failed to update task. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleApplyForTask = async (taskId: string, message: string) => {
    try {
      const { error } = await supabase
        .from('task_applications')
        .insert({
          task_id: taskId,
          applicant_id: user?.id,
          applicant_name: user?.user_metadata?.name || 'Anonymous',
          applicant_email: user?.email,
          proposal: message,
          status: 'pending',
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Application submitted successfully.",
      });
    } catch (error: any) {
      console.error('Error applying for task:', error);
      toast({
        title: "Error",
        description: "Failed to submit application. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleJoinJointTask = async (taskId: string, needs: string, reward: number) => {
    try {
      const { error } = await supabase
        .from('joint_task_requests')
        .insert({
          task_id: taskId,
          requestor_id: user?.id,
          requestor_name: user?.user_metadata?.name || 'Anonymous',
          needs: needs,
          reward: reward,
          status: 'pending',
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Join request submitted successfully.",
      });
    } catch (error: any) {
      console.error('Error joining joint task:', error);
      toast({
        title: "Error",
        description: "Failed to submit join request. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleApproveApplication = async (application: ApplicationType) => {
    try {
      // First, update the application status to accepted
      const { error: applicationError } = await supabase
        .from('task_applications')
        .update({ status: 'accepted' })
        .eq('id', application.id);

      if (applicationError) throw applicationError;

      // Then, update the task to assign it to the applicant and set status to assigned
      const { error: taskError } = await supabase
        .from('tasks')
        .update({ 
          assigned_to: application.userId,
          status: 'assigned',
          assigned_at: new Date().toISOString()
        })
        .eq('id', application.taskId);

      if (taskError) throw taskError;

      // Finally, reject all other pending applications for this task
      const { error: rejectError } = await supabase
        .from('task_applications')
        .update({ status: 'rejected' })
        .eq('task_id', application.taskId)
        .eq('status', 'pending');

      if (rejectError) throw rejectError;

      toast({
        title: "Success",
        description: "Application approved successfully.",
      });

      fetchTasks();
    } catch (error: any) {
      console.error('Error approving application:', error);
      toast({
        title: "Error",
        description: "Failed to approve application. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRejectApplication = async (applicationId: string) => {
    try {
      const { error } = await supabase
        .from('task_applications')
        .update({ status: 'rejected' })
        .eq('id', applicationId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Application rejected successfully.",
      });

      fetchTasks();
    } catch (error: any) {
      console.error('Error rejecting application:', error);
      toast({
        title: "Error",
        description: "Failed to reject application. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleApproveJointRequest = async (request: JointTaskMemberType) => {
    try {
      const { error } = await supabase
        .from('joint_task_requests')
        .update({ status: 'accepted' })
        .eq('id', request.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Joint task request approved successfully.",
      });

      fetchTasks();
    } catch (error: any) {
      console.error('Error approving joint request:', error);
      toast({
        title: "Error",
        description: "Failed to approve joint task request. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRejectJointRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('joint_task_requests')
        .update({ status: 'rejected' })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Joint task request rejected successfully.",
      });

      fetchTasks();
    } catch (error: any) {
      console.error('Error rejecting joint request:', error);
      toast({
        title: "Error",
        description: "Failed to reject joint task request. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAddToChat = (taskId: string) => {
    // Navigate to chat with the task owner
    // This would be implemented based on your chat functionality
    toast({
      title: "Chat",
      description: "Chat functionality will be implemented soon.",
    });
  };

  const handleTaskStatusChange = async (taskId: string) => {
    try {
      console.log("🔄 handleTaskStatusChange called for task ID:", taskId);
      
      const { data: taskBefore, error: fetchError } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .single();
        
      if (fetchError) {
        console.error("🔄 Error fetching task before update:", fetchError);
      } else {
        console.log("🔄 Task before status update:", taskBefore);
      }
      
      const { data: updateResult, error } = await supabase
        .from('tasks')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId)
        .select();

      if (error) {
        console.error("🔄 Error updating task status:", error);
        throw error;
      }
      
      console.log("🔄 Task update result:", updateResult);
      
      // Verify the update was successful
      const { data: taskAfter, error: verifyError } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .single();
        
      if (verifyError) {
        console.error("🔄 Error verifying task update:", verifyError);
      } else {
        console.log("🔄 Task after status update:", taskAfter);
      }

      toast({
        title: "Success",
        description: "Task marked as completed successfully.",
      });

      // Reload tasks to update the UI
      console.log("🔄 Reloading tasks, showCompleted =", showCompleted);
      if (showCompleted) {
        fetchCompletedTasks();
      } else {
        fetchTasks();
      }
      
      // Force a redirect to the completed tasks view
      console.log("🔄 Redirecting to completed tasks view");
      window.location.href = '/tasks/completed?refresh=' + Date.now();
      
    } catch (error: any) {
      console.error('Error updating task status:', error);
      toast({
        title: "Error",
        description: "Failed to update task status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleApproveDoer = (taskId: string, userId: string) => {
    // This is a simplified adapter function
    console.log(`Approve doer for task ${taskId}, user ${userId}`);
    // Implementation would call the appropriate API
  };

  const handleRejectDoer = (taskId: string, userId: string) => {
    // This is a simplified adapter function
    console.log(`Reject doer for task ${taskId}, user ${userId}`);
    // Implementation would call the appropriate API
  };

  const handleApproveJointRequestor = (taskId: string, userId: string) => {
    // This is a simplified adapter function
    console.log(`Approve joint requestor for task ${taskId}, user ${userId}`);
    // Implementation would call the appropriate API
  };

  const handleRejectJointRequestor = (taskId: string, userId: string) => {
    // This is a simplified adapter function
    console.log(`Reject joint requestor for task ${taskId}, user ${userId}`);
    // Implementation would call the appropriate API
  };

  // Handler for task deletion
  const handleDeleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Task deleted successfully.",
      });

      fetchTasks();
    } catch (error: any) {
      console.error('Error deleting task:', error);
      toast({
        title: "Error",
        description: "Failed to delete task. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handler for the CreateTaskForm cancel button
  const handleCreateTaskCancel = () => {
    setIsCreateDialogOpen(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Display completed tasks view
  if (showCompleted) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Completed Tasks</h1>
          <div className="flex gap-2">
            <Button onClick={() => window.history.back()}>
              Back
            </Button>
            <Button 
              variant="outline" 
              onClick={async () => {
                // Debug function to directly check all completed tasks in the database
                console.log("🔍 Checking all completed tasks in database");
                const { data, error } = await supabase
                  .from('tasks')
                  .select('*')
                  .eq('status', 'completed');
                  
                if (error) {
                  console.error("🔍 Error checking completed tasks:", error);
                  toast({
                    title: "Error",
                    description: "Failed to check completed tasks.",
                    variant: "destructive"
                  });
                } else {
                  console.log("🔍 All completed tasks in database:", data);
                  toast({
                    title: "Check Console",
                    description: `Found ${data.length} completed tasks in database.`
                  });
                  
                  // Force refetch
                  await fetchCompletedTasks();
                }
              }}
            >
              Debug Check
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => {
                // Force a hard reload of the page to update the UI
                console.log("🔄 Forcing complete page reload");
                window.location.href = window.location.href.split('?')[0] + '?refresh=' + Date.now();
              }}
            >
              Force Reload
            </Button>
          </div>
        </div>

        {completedTasks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No completed tasks found. Tasks will appear here once they are marked as complete.
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {completedTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                isOwner={task.creatorId === user?.id}
                isCompleted={true}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Display regular tasks view
  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Tasks</h1>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Task
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create a New Task</DialogTitle>
              <DialogDescription>
                Fill in the details to create a new task for others to help with.
              </DialogDescription>
            </DialogHeader>
            <CreateTaskForm 
              onSubmit={handleCreateTask} 
              onCancel={handleCreateTaskCancel}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="active">Active Tasks</TabsTrigger>
          <TabsTrigger value="created">Created Tasks</TabsTrigger>
        </TabsList>
        <TabsContent value="active" className="mt-6">
          {activeTasks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No active tasks found. Browse available tasks or create your own.
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {activeTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onCancel={handleCancelTask}
                  onEdit={handleEditTask}
                  onApply={handleApplyForTask}
                  onJoinJointTask={handleJoinJointTask}
                  onApproveJointRequestor={handleApproveJointRequestor}
                  onRejectJointRequestor={handleRejectJointRequestor}
                  onApproveDoer={handleApproveDoer}
                  onRejectDoer={handleRejectDoer}
                  onAddToChat={handleAddToChat}
                  onStatusChange={handleTaskStatusChange}
                />
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="created" className="mt-6">
          {createdTasks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              You haven't created any tasks yet. Create your first task to get started.
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {createdTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  isOwner={true}
                  onCancel={handleCancelTask}
                  onEdit={handleEditTask}
                  onDelete={handleDeleteTask}
                  onApply={handleApplyForTask}
                  onJoinJointTask={handleJoinJointTask}
                  onApproveJointRequestor={handleApproveJointRequestor}
                  onRejectJointRequestor={handleRejectJointRequestor}
                  onApproveDoer={handleApproveDoer}
                  onRejectDoer={handleRejectDoer}
                  onAddToChat={handleAddToChat}
                  onStatusChange={handleTaskStatusChange}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Tasks; 