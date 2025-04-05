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

const Tasks = () => {
  const [activeTasks, setActiveTasks] = useState<TaskType[]>([]);
  const [createdTasks, setCreatedTasks] = useState<TaskType[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchTasks();
    }
  }, [user]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      
      // Fetch tasks created by the user
      const { data: createdTasksData, error: createdError } = await supabase
        .from('tasks')
        .select('*')
        .eq('creator_id', user?.id)
        .order('created_at', { ascending: false });

      if (createdError) throw createdError;

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

      if (appliedError) throw appliedError;

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

      const transformedAppliedTasks = appliedTasksData
        ?.filter(item => item.task !== null)
        .map(item => ({
          id: item.task.id,
          title: item.task.title,
          description: item.task.description,
          location: item.task.location,
          reward: item.task.reward,
          deadline: new Date(item.task.deadline),
          taskType: item.task.task_type,
          status: item.task.status,
          createdAt: new Date(item.task.created_at),
          creatorId: item.task.creator_id,
          creatorName: item.task.creator_name,
          creatorRating: item.task.creator_rating,
          assignedTo: item.task.assigned_to,
          assignedAt: item.task.assigned_at ? new Date(item.task.assigned_at) : null,
        })) || [];

      setCreatedTasks(transformedCreatedTasks);
      setActiveTasks(transformedAppliedTasks);
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
          assigned_to: application.applicant_id,
          status: 'assigned',
          assigned_at: new Date().toISOString()
        })
        .eq('id', application.task_id);

      if (taskError) throw taskError;

      // Finally, reject all other pending applications for this task
      const { error: rejectError } = await supabase
        .from('task_applications')
        .update({ status: 'rejected' })
        .eq('task_id', application.task_id)
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

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
            <CreateTaskForm onSubmit={handleCreateTask} />
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
                  onApproveJointRequestor={handleApproveJointRequest}
                  onRejectJointRequestor={handleRejectJointRequest}
                  onApproveDoer={handleApproveApplication}
                  onRejectDoer={handleRejectApplication}
                  onAddToChat={handleAddToChat}
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
                  onApply={handleApplyForTask}
                  onJoinJointTask={handleJoinJointTask}
                  onApproveJointRequestor={handleApproveJointRequest}
                  onRejectJointRequestor={handleRejectJointRequest}
                  onApproveDoer={handleApproveApplication}
                  onRejectDoer={handleRejectApplication}
                  onAddToChat={handleAddToChat}
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