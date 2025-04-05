import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, Edit, Trash, MapPin, CalendarClock, MessageCircle, Plus, Send, UserPlus, UserCheck, CheckCircle2, Trash2, DollarSign, Calendar, User, X, Eye, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { TaskType } from '@/lib/types';
import { Badge } from './ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import TaskApplications from './TaskApplications';
import { useAuth } from '@/hooks/useAuth';

export interface TaskCardProps {
  task: {
    id: string;
    title: string;
    description: string;
    location: string;
    reward: number;
    deadline: Date;
    taskType: "normal" | "joint";
    status: "active" | "completed" | "assigned" | "cancelled";
    createdAt: Date;
    creatorId: string;
    creatorName: string;
    creatorRating?: number;
    assignedTo?: string | null;
    assignedAt?: Date | null;
  };
  isOwner?: boolean;
  isCompleted?: boolean;
  isCreator?: boolean;
  onCancel?: (taskId: string) => void;
  onEdit?: (task: TaskType) => void;
  onDelete?: (taskId: string) => void;
  onApply?: (taskId: string, message: string) => void;
  onJoinJointTask?: (taskId: string, needs: string, reward: number) => void;
  onApproveJointRequestor?: (taskId: string, userId: string) => void;
  onRejectJointRequestor?: (taskId: string, userId: string) => void;
  onApproveDoer?: (taskId: string, userId: string) => void;
  onRejectDoer?: (taskId: string, userId: string) => void;
  onAddToChat?: (taskId: string) => void;
  onStatusChange?: (taskId: string) => void;
}

const TaskCard = ({ 
  task, 
  isOwner = false, 
  isCompleted = false,
  isCreator = false,
  onCancel,
  onEdit,
  onDelete,
  onApply,
  onJoinJointTask,
  onApproveJointRequestor,
  onRejectJointRequestor,
  onApproveDoer,
  onRejectDoer,
  onAddToChat,
  onStatusChange
}: TaskCardProps) => {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isApplyDialogOpen, setIsApplyDialogOpen] = useState(false);
  const [isJoinJointDialogOpen, setIsJoinJointDialogOpen] = useState(false);
  const [isCompleteConfirmationOpen, setIsCompleteConfirmationOpen] = useState(false);
  const [applicationMessage, setApplicationMessage] = useState('');
  const [jointTaskNeeds, setJointTaskNeeds] = useState('');
  const [jointTaskReward, setJointTaskReward] = useState(100);
  const [applicantName, setApplicantName] = useState('');
  const [applicantEmail, setApplicantEmail] = useState('');
  const [applicantPhone, setApplicantPhone] = useState('');
  const [proposal, setProposal] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isApplicationsDialogOpen, setIsApplicationsDialogOpen] = useState(false);
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    proposal: ''
  });
  const [userRating, setUserRating] = useState<number | null>(null);
  const [rating, setRating] = useState<number | null>(null);

  // Check if the user is the creator of the task (use prop if provided)
  const userIsCreator = isCreator || user?.id === task.creatorId;

  // Fetch user profile when dialog opens
  useEffect(() => {
    if (isApplyDialogOpen && user) {
      const fetchUserProfile = async () => {
        try {
          const { data: creatorProfile, error: profileError } = await supabase
            .from('users')
            .select('username, rating')
            .eq('id', task.creatorId)
            .single();
            
          if (profileError) throw profileError;
          
          if (creatorProfile) {
            setFormData(prev => ({
              ...prev,
              name: creatorProfile.username || '',
            }));
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      };
      
      fetchUserProfile();
    }
  }, [isApplyDialogOpen, user]);

  // Fetch ratings when details dialog opens
  useEffect(() => {
    if (isDetailsDialogOpen && task.creatorId) {
      const fetchRatings = async () => {
        try {
          // Check if the user_ratings table exists
          const { data: ratingsData, error: ratingsError } = await supabase
            .from('user_ratings')
            .select('rating')
            .eq('rated_user_id', task.creatorId);
            
          if (ratingsError) {
            console.error('Error fetching ratings:', ratingsError);
            return;
          }
          
          // Calculate average rating if ratings exist
          if (ratingsData && ratingsData.length > 0) {
            const totalRating = ratingsData.reduce((sum, item) => sum + item.rating, 0);
            const averageRating = totalRating / ratingsData.length;
            setUserRating(averageRating);
          } else {
            setUserRating(null);
          }
        } catch (error) {
          console.error('Error processing ratings:', error);
        }
      };
      
      fetchRatings();
    }
  }, [isDetailsDialogOpen, task.creatorId]);

  // Trace component initialization to check for props
  useEffect(() => {
    console.log(`⚡ TaskCard mounted for task ${task.id}`);
    console.log(`⚡ Task status: ${task.status}, isCompleted prop: ${isCompleted}`);
    console.log(`⚡ Task data:`, task);
    
    // Return cleanup function
    return () => {
      console.log(`⚡ TaskCard unmounted for task ${task.id}`);
    };
  }, [task.id, task.status, isCompleted]);

  // Log whenever the task status changes
  useEffect(() => {
    console.log(`⚡ Task ${task.id} status changed to: ${task.status}`);
  }, [task.id, task.status]);

  const handleCancel = () => {
    if (onCancel) {
      onCancel(task.id);
    }
  };

  const handleEditSubmit = (updatedTask: TaskType) => {
    if (onEdit) {
      onEdit(updatedTask);
      setIsEditDialogOpen(false);
    }
  };

  const handleCardClick = () => {
    if (!isOwner) {
      setIsDetailsDialogOpen(true);
    }
  };

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Validate form - only check name and proposal since email is auto-filled
      if (!formData.name || !formData.proposal) {
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields.",
          variant: "destructive",
        });
        return;
      }
      
      // Call the onApply callback with the form data
      await onApply(task.id, formData.proposal);
      
      // Close the dialog
      setIsApplyDialogOpen(false);
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        proposal: ''
      });
      
      toast({
        title: "Success",
        description: "Your application has been submitted successfully.",
      });
    } catch (error) {
      console.error('Error submitting application:', error);
      toast({
        title: "Error",
        description: "Failed to submit application. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoinJointTask = () => {
    if (onJoinJointTask && jointTaskNeeds.trim() && jointTaskReward > 0) {
      onJoinJointTask(task.id, jointTaskNeeds, jointTaskReward);
      setJointTaskNeeds('');
      setJointTaskReward(100);
      setIsJoinJointDialogOpen(false);
      toast({
        title: "Join Request Submitted",
        description: "Your request to join this joint task has been sent."
      });
    }
  };

  const handleAddToChat = () => {
    if (onAddToChat) {
      onAddToChat(task.id);
    } else {
      navigate('/chat', { 
        state: { 
          startChat: true,
          participant: {
            id: task.creatorId,
            name: task.creatorName,
            task: task
          }
        }
      });
    }
    
    setIsDetailsDialogOpen(false);
    
    toast({
      title: "Chat Started",
      description: "A chat has been started with the task owner."
    });
  };

  const handleCloseTask = async () => {
    try {
      console.log("🔧 Starting task completion process for task ID:", task.id);
      console.log("🔧 Complete task data:", task);
      setIsSubmitting(true);
      
      if (onStatusChange) {
        console.log("🔧 Using onStatusChange callback");
        onStatusChange(task.id);
      } else {
        console.log("🔧 Using direct database update");
        
        try {
          // First, try to get the task to confirm it exists and check its current status
          const { data: taskCheck, error: checkError } = await supabase
            .from('tasks')
            .select('*')
            .eq('id', task.id)
            .single();
            
          if (checkError) {
            console.error("🔧 Error finding task:", checkError);
            throw new Error(`Task not found: ${checkError.message}`);
          }
          
          console.log("🔧 Found task to complete:", taskCheck);
          console.log("🔧 Current task status:", taskCheck.status);
          
          // Check if already completed
          if (taskCheck.status === 'completed') {
            console.log("🔧 Task is already marked as completed in the database");
            toast({
              title: "Task Already Completed",
              description: "This task has already been marked as completed. Refreshing the page to show updated status.",
            });
            
            // Force a hard reload to make sure UI reflects database state
            window.location.reload();
            return;
          }
          
          // Mark task as completed
          console.log("🔧 Updating task status to completed");
          const { data: updateData, error: taskError } = await supabase
            .from('tasks')
            .update({
              status: 'completed',
              completed_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', task.id)
            .select();

          if (taskError) {
            console.error("🔧 Task update error:", taskError);
            throw new Error(`Failed to update task: ${taskError.message}`);
          }
          
          console.log("🔧 Update successful:", updateData);
          
          // Verify the update was successful by fetching the task again
          const { data: verifyTask, error: verifyError } = await supabase
            .from('tasks')
            .select('status')
            .eq('id', task.id)
            .single();
            
          if (verifyError) {
            console.error("🔧 Error verifying task update:", verifyError);
          } else {
            console.log("🔧 Verification status:", verifyTask.status);
            if (verifyTask.status !== 'completed') {
              console.warn("🔧 Task was not updated to completed status in the database!");
            } else {
              console.log("🔧 Task successfully marked as completed in database");
            }
          }

          // If rating provided, save it
          if (rating && task.assignedTo) {
            console.log("Saving rating:", rating, "for user:", task.assignedTo);
            
            try {
              // Save the rating
              const { data: ratingData, error: ratingError } = await supabase
                .from('user_ratings')
                .insert({
                  rated_by_id: user?.id,
                  rated_user_id: task.assignedTo,
                  task_id: task.id,
                  rating: rating,
                  created_at: new Date().toISOString()
                })
                .select();

              if (ratingError) {
                console.error('Error saving rating:', ratingError);
              } else {
                console.log("Rating saved successfully:", ratingData);
              }
            } catch (ratingErr: any) {
              console.error("Rating insert error:", ratingErr);
            }
          }

          toast({
            title: "Success!",
            description: "Task marked as completed successfully!",
          });
          
          console.log("Task completion successful, forcing page reload");
          
          // Force a hard reload of the page to update the UI
          setTimeout(() => {
            // Clear any cached data by using hard reload
            window.location.href = window.location.href.split('#')[0] + '?refresh=' + Date.now();
          }, 1000);
        } catch (dbError: any) {
          console.error("Database operation error:", dbError);
          throw dbError;
        }
      }
      
      setIsCompleteConfirmationOpen(false);
      setRating(null);
    } catch (error: any) {
      console.error('Error closing task:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to close task. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusInfo = () => {
    console.log(`🎨 Getting status info for task ${task.id}, status: ${task.status}, isCompleted: ${isCompleted}`);
    
    if (task.status === 'completed' || isCompleted) {
      console.log(`🎨 Task ${task.id} displaying as COMPLETED`);
      return {
        color: 'text-red-500',
        bgColor: 'bg-red-500',
        text: 'Done',
        variant: 'destructive' as const
      };
    } else if (task.status === 'assigned') {
      console.log(`🎨 Task ${task.id} displaying as ASSIGNED`);
      return {
        color: 'text-green-500',
        bgColor: 'bg-green-500',
        text: 'Assigned',
        variant: 'default' as const
      };
    } else if (task.status === 'cancelled') {
      console.log(`🎨 Task ${task.id} displaying as CANCELLED`);
      return {
        color: 'text-gray-500',
        bgColor: 'bg-gray-500',
        text: 'Cancelled',
        variant: 'outline' as const
      };
    } else {
      console.log(`🎨 Task ${task.id} displaying as LIVE`);
      return {
        color: 'text-yellow-500',
        bgColor: 'bg-yellow-500',
        text: 'Live',
        variant: 'secondary' as const
      };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <>
      <Card 
        className="w-full transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 hover:border-primary/50 group cursor-pointer"
        onClick={() => setIsDetailsDialogOpen(true)}
      >
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl font-semibold group-hover:text-primary transition-colors">{task.title}</CardTitle>
              <CardDescription className="mt-2 line-clamp-2">{task.description}</CardDescription>
            </div>
            <Badge variant={statusInfo.variant} className="ml-2 transition-transform group-hover:scale-110">
              {statusInfo.text}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="h-4 w-4 group-hover:text-primary transition-colors" />
                <span className="text-sm font-medium group-hover:text-primary transition-colors">Posted by: {task.creatorName}</span>
                {task.creatorRating ? (
                  <div className="flex items-center">
                    <Star className="h-3 w-3 text-yellow-500 fill-current group-hover:scale-110 transition-transform" />
                    <span className="text-xs ml-1">{task.creatorRating.toFixed(1)}</span>
                  </div>
                ) : userRating ? (
                  <div className="flex items-center">
                    <Star className="h-3 w-3 text-yellow-500 fill-current group-hover:scale-110 transition-transform" />
                    <span className="text-xs ml-1">{userRating.toFixed(1)}</span>
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Star className="h-3 w-3 text-yellow-400 group-hover:scale-110 transition-transform" />
                    <span className="text-xs ml-1">N/A</span>
                  </div>
                )}
              </div>
              <Badge variant={statusInfo.variant} className="md:hidden">
                {statusInfo.text}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2 text-muted-foreground group-hover:text-foreground/80 transition-colors">
                <MapPin className="h-4 w-4 group-hover:text-primary transition-colors" />
                <span className="text-sm">{task.location}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground group-hover:text-foreground/80 transition-colors">
                <DollarSign className="h-4 w-4 group-hover:text-primary transition-colors" />
                <span className="text-sm font-medium">{task.reward ? `₹${task.reward}` : 'No reward'}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground group-hover:text-foreground/80 transition-colors">
                <Calendar className="h-4 w-4 group-hover:text-primary transition-colors" />
                <span className="text-sm">{format(task.deadline, 'PPP')}</span>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between border-t pt-4">
          {isOwner ? (
            <div className="flex gap-2">
              {task.status === 'active' && (
                <>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      onEdit?.(task as TaskType); 
                    }}
                    className="transition-all hover:bg-primary/10 hover:border-primary"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      onDelete?.(task.id); 
                    }}
                    className="transition-all hover:bg-destructive/10 hover:text-destructive hover:border-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </>
              )}
              {task.status === 'assigned' && (
                <>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      onCancel?.(task.id); 
                    }}
                    className="transition-all hover:bg-destructive/10 hover:text-destructive hover:border-destructive"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel Assignment
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      console.log("Opening complete dialog for task:", task);
                      setIsCompleteConfirmationOpen(true); 
                    }}
                    className="transition-all hover:bg-green-600 hover:text-white"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Mark Complete
                  </Button>
                  <Button 
                    variant="default" 
                    size="sm" 
                    onClick={async (e) => { 
                      e.stopPropagation();
                      
                      // Show what we're trying to do
                      console.log("EMERGENCY COMPLETE for task:", task.id);
                      
                      try {
                        // Method 1: Direct update
                        const { data: directUpdate, error: directError } = await supabase
                          .from('tasks')
                          .update({ status: 'completed' })
                          .eq('id', task.id)
                          .select();
                        
                        console.log("Direct update result:", directUpdate, "Error:", directError);
                        
                        // Method 2: Try RPC if available
                        try {
                          const { data: rpcResult, error: rpcError } = await supabase.rpc(
                            'complete_task',
                            { task_id: task.id }
                          );
                          
                          console.log("RPC result:", rpcResult, "Error:", rpcError);
                        } catch (rpcErr) {
                          console.log("RPC not available:", rpcErr);
                        }
                        
                        // Method 3: Raw SQL (if you have permission)
                        try {
                          const { data: sqlResult, error: sqlError } = await supabase
                            .from('tasks')
                            .update({ 
                              status: 'completed',
                              completed_at: new Date().toISOString()
                            })
                            .eq('id', task.id);
                            
                          console.log("SQL result:", sqlResult, "Error:", sqlError);
                        } catch (sqlErr) {
                          console.log("SQL error:", sqlErr);
                        }
                        
                        alert(`Emergency complete attempted for task ${task.id}. Check console for results.`);
                        
                      } catch (err) {
                        console.error("Emergency complete failed:", err);
                        alert("Emergency complete failed. See console.");
                      }
                    }}
                    className="h-8 mt-2 text-xs bg-red-600 hover:bg-red-700 text-white"
                  >
                    Emergency Complete
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={(e) => { 
                      e.stopPropagation();
                      // Redirect to completed tasks page or view
                      navigate('/tasks/completed');
                    }}
                    className="h-8 mt-2 text-xs bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    View Completed Tasks
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={(e) => { 
                      e.stopPropagation();
                      // Navigate to the tasks page
                      navigate('/tasks');
                    }}
                    className="h-8 mt-2 text-xs bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Go to Tasks Page
                  </Button>
                </>
              )}
            </div>
          ) : (
            <div className="flex gap-2">
              {task.status === 'active' && !userIsCreator && onApply && (
                <Button 
                  variant="default" 
                  size="sm" 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    setIsApplyDialogOpen(true); 
                  }}
                  className="transition-all hover:shadow-md hover:shadow-primary/20 hover:scale-105"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Apply
                </Button>
              )}
              {task.status === 'active' && !userIsCreator && task.taskType === 'joint' && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    setIsJoinJointDialogOpen(true); 
                  }}
                  className="transition-all hover:bg-secondary/80 hover:border-primary/50"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Join
                </Button>
              )}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  setIsDetailsDialogOpen(true); 
                }}
                className="transition-all hover:bg-secondary/80 hover:border-primary/50"
              >
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </Button>
            </div>
          )}
        </CardFooter>
      </Card>

      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="sm:max-w-[550px] border border-primary/20 shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-xl text-primary">{task.title}</DialogTitle>
            <DialogDescription className="flex items-center mt-2">
              <Badge variant={statusInfo.variant} className="mr-2">
                {statusInfo.text}
              </Badge>
              <span className="font-bold text-lg">₹{task.reward}</span>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <p className="text-foreground/90">{task.description}</p>
            
            <div className="flex items-center text-sm">
              <MapPin className="h-4 w-4 mr-2 text-primary" />
              <span>{task.location}</span>
            </div>
            
            <div className="flex items-center text-sm">
              <CalendarClock className="h-4 w-4 mr-2 text-primary" />
              <span>Due: {format(new Date(task.deadline), 'MMM d, yyyy')} at {format(new Date(task.deadline), 'h:mm a')}</span>
            </div>
            
            <div className="flex items-center justify-between border-t border-border pt-4">
              <div className="flex items-center text-sm">
                <User className="h-4 w-4 mr-2 text-primary" />
                <span className="font-medium mr-2">Posted by:</span> 
                {task.creatorName}
                <span className="flex items-center ml-2">
                  <span className="text-yellow-500 font-medium">{task.creatorRating?.toFixed(1) || userRating?.toFixed(1) || 'N/A'}</span>
                  <Star className="h-4 w-4 text-yellow-500 ml-1" fill="currentColor" />
                </span>
              </div>
            </div>
          </div>
          
          <DialogFooter className="flex space-x-2">
            <Button 
              variant="outline" 
              onClick={handleAddToChat} 
              className="flex items-center transition-all hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Message
            </Button>
            
            {task.taskType === 'joint' && !userIsCreator ? (
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => setIsJoinJointDialogOpen(true)} 
                  className="flex items-center transition-all hover:bg-primary/10 hover:border-primary"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </Button>
                <Button 
                  onClick={() => setIsApplyDialogOpen(true)}
                  className="flex items-center transition-all hover:shadow-md hover:shadow-primary/20 hover:scale-105"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Join
                </Button>
              </div>
            ) : !userIsCreator ? (
              <Button 
                onClick={() => setIsApplyDialogOpen(true)}
                className="flex items-center transition-all hover:shadow-md hover:shadow-primary/20 hover:scale-105"
              >
                <Send className="h-4 w-4 mr-2" />
                Apply
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isApplyDialogOpen} onOpenChange={setIsApplyDialogOpen}>
        <DialogContent className="border border-primary/20 shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-xl text-primary">Apply for Task</DialogTitle>
            <DialogDescription>
              Fill out the form below to apply for this task.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleApplySubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name" className="text-foreground/80">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="border-primary/20 focus-visible:ring-primary/30"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email" className="text-foreground/80">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  disabled
                  className="border-primary/20"
                />
                <p className="text-xs text-muted-foreground">Your registered email will be used.</p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone" className="text-foreground/80">Phone (Optional)</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="border-primary/20 focus-visible:ring-primary/30"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="proposal" className="text-foreground/80">Proposal</Label>
                <Textarea
                  id="proposal"
                  value={formData.proposal}
                  onChange={(e) => setFormData({ ...formData, proposal: e.target.value })}
                  placeholder="Explain why you're the right person for this task..."
                  required
                  className="border-primary/20 focus-visible:ring-primary/30 min-h-[100px]"
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="transition-all hover:shadow-md hover:shadow-primary/20"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Submit Application
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isJoinJointDialogOpen} onOpenChange={setIsJoinJointDialogOpen}>
        <DialogContent className="sm:max-w-[425px] border border-primary/20 shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-xl text-primary">Join Joint Task</DialogTitle>
            <DialogDescription>
              Describe what you can contribute to this task.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="needs" className="text-foreground/80">Description</Label>
              <Textarea 
                id="needs" 
                placeholder="I can help with..."
                value={jointTaskNeeds}
                onChange={(e) => setJointTaskNeeds(e.target.value)}
                className="col-span-3 border-primary/20 focus-visible:ring-primary/30 min-h-[100px]"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="reward" className="text-foreground/80">Reward Split</Label>
              <Input
                id="reward"
                type="number"
                min={0}
                max={1000}
                value={jointTaskReward}
                onChange={(e) => setJointTaskReward(Number(e.target.value))}
                className="col-span-3 border-primary/20 focus-visible:ring-primary/30"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              onClick={handleJoinJointTask}
              className="transition-all hover:shadow-md hover:shadow-primary/20 hover:scale-105"
            >
              <Plus className="h-4 w-4 mr-2" />
              Join Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isCompleteConfirmationOpen} onOpenChange={setIsCompleteConfirmationOpen}>
        <DialogContent className="border border-primary/20 shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-xl text-primary">Confirm Completion</DialogTitle>
            <DialogDescription>
              Are you sure you want to mark this task as complete?
              {task.assignedTo && <p className="mt-2">Please also rate the person who completed this task.</p>}
            </DialogDescription>
          </DialogHeader>
          
          {task.assignedTo && (
            <div className="py-2 space-y-3">
              <div className="space-y-2">
                <p className="text-sm font-medium">Rate this user:</p>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className={`transition-all duration-200 transform ${rating && rating >= star 
                        ? 'text-yellow-500 scale-110' 
                        : 'text-muted-foreground hover:text-yellow-400 hover:scale-105'}`}
                    >
                      <Star className="h-6 w-6 fill-current" />
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Rating is optional but helps other users know about the quality of work.
                </p>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsCompleteConfirmationOpen(false);
                setRating(null);
              }}
              className="transition-all hover:bg-secondary/80"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCloseTask}
              disabled={isSubmitting}
              className="transition-all hover:bg-primary/90 hover:shadow-sm hover:shadow-primary/20"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                "Mark as Complete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {isApplicationsDialogOpen && (
        <Dialog open={isApplicationsDialogOpen} onOpenChange={setIsApplicationsDialogOpen}>
          <DialogContent className="max-w-4xl border border-primary/20 shadow-lg">
            <DialogHeader>
              <DialogTitle className="text-xl text-primary">Applications for {task.title}</DialogTitle>
              <DialogDescription>
                Review and manage applications for this task.
              </DialogDescription>
            </DialogHeader>
            <TaskApplications
        taskId={task.id}
        isOpen={isApplicationsDialogOpen}
        onOpenChange={setIsApplicationsDialogOpen}
      />
          </DialogContent>
        </Dialog>
      )}

     
    </>
  );
};

export default TaskCard;
