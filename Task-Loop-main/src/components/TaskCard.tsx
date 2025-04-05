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

interface TaskCardProps {
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

  // Check if the user is the creator of the task
  const isCreator = user?.id === task.creatorId;

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
              email: creatorProfile.email || ''
            }));
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      };
      
      fetchUserProfile();
    }
  }, [isApplyDialogOpen, user]);

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
      if (onStatusChange) {
        onStatusChange(task.id);
      } else {
        const { error } = await supabase
          .from('tasks')
          .update({
            status: 'completed',
            updated_at: new Date().toISOString()
          })
          .eq('id', task.id);

        if (error) throw error;

        toast({
          title: "Success!",
          description: "Task marked as completed.",
        });
      }
    } catch (error: any) {
      console.error('Error closing task:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to close task. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getStatusInfo = () => {
    if (task.status === 'completed' || isCompleted) {
      return {
        color: 'text-red-500',
        bgColor: 'bg-red-500',
        text: 'Done',
        variant: 'destructive' as const
      };
    } else if (task.status === 'assigned') {
      return {
        color: 'text-green-500',
        bgColor: 'bg-green-500',
        text: 'Assigned',
        variant: 'default' as const
      };
    } else if (task.status === 'cancelled') {
      return {
        color: 'text-gray-500',
        bgColor: 'bg-gray-500',
        text: 'Cancelled',
        variant: 'outline' as const
      };
    } else {
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
      <Card className="w-full hover:shadow-lg transition-shadow duration-200">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl font-semibold">{task.title}</CardTitle>
              <CardDescription className="mt-2 line-clamp-2">{task.description}</CardDescription>
            </div>
            <Badge variant={statusInfo.variant} className="ml-2">
              {statusInfo.text}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span className="text-sm">{task.location}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              <span className="text-sm font-medium">₹{task.reward}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span className="text-sm">{format(task.deadline, 'PPP')}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="h-4 w-4" />
              <span className="text-sm">{task.creatorName}</span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between border-t pt-4">
          {isOwner ? (
            <div className="flex gap-2">
              {task.status === 'active' && (
                <>
                  <Button variant="outline" size="sm" onClick={() => onEdit?.(task)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => onDelete?.(task.id)}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </>
              )}
              {task.status === 'assigned' && (
                <Button variant="outline" size="sm" onClick={() => onCancel?.(task.id)}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel Assignment
                </Button>
              )}
            </div>
          ) : (
            <div className="flex gap-2">
              {task.status === 'active' && !isCreator && onApply && (
                <Button variant="default" size="sm" onClick={() => setIsApplyDialogOpen(true)}>
                  <Send className="h-4 w-4 mr-2" />
                  Apply
                </Button>
              )}
              {task.status === 'active' && !isCreator && task.taskType === 'joint' && (
                <Button variant="outline" size="sm" onClick={() => setIsJoinJointDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Join
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => setIsDetailsDialogOpen(true)}>
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </Button>
            </div>
          )}
        </CardFooter>
      </Card>

      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>{task.title}</DialogTitle>
            <DialogDescription className="flex items-center mt-2">
              <Badge variant={statusInfo.variant} className="mr-2">
                {statusInfo.text}
              </Badge>
              <span className="font-bold">₹{task.reward}</span>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <p>{task.description}</p>
            
            <div className="flex items-center text-sm">
              <MapPin className="h-4 w-4 mr-2" />
              <span>{task.location}</span>
            </div>
            
            <div className="flex items-center text-sm">
              <CalendarClock className="h-4 w-4 mr-2" />
              <span>Due: {format(new Date(task.deadline), 'MMM d, yyyy')} at {format(new Date(task.deadline), 'h:mm a')}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center text-sm">
                <span className="font-medium mr-2">Posted by:</span> 
                {task.creatorName}
                <span className="flex items-center ml-2">
                  <span className="text-yellow-500 font-medium">{task.creatorRating?.toFixed(1) || 'N/A'}</span>
                  <Star className="h-4 w-4 text-yellow-500 ml-1" fill="currentColor" />
                </span>
              </div>
            </div>
          </div>
          
          <DialogFooter className="flex space-x-2">
            <Button 
              variant="outline" 
              onClick={handleAddToChat} 
              className="flex items-center"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Message
            </Button>
            
            {task.taskType === 'joint' ? (
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => setIsJoinJointDialogOpen(true)} 
                  className="flex items-center"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </Button>
                <Button 
                  onClick={() => setIsApplyDialogOpen(true)}
                  className="flex items-center"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Join
                </Button>
              </div>
            ) : (
              <Button 
                onClick={() => setIsApplyDialogOpen(true)}
                className="flex items-center"
              >
                <Send className="h-4 w-4 mr-2" />
                Apply
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isApplyDialogOpen} onOpenChange={setIsApplyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply for Task</DialogTitle>
            <DialogDescription>
              Fill out the form below to apply for this task.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleApplySubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  disabled
                />
                <p className="text-xs text-muted-foreground">Your registered email will be used.</p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone (Optional)</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="proposal">Proposal</Label>
                <Textarea
                  id="proposal"
                  value={formData.proposal}
                  onChange={(e) => setFormData({ ...formData, proposal: e.target.value })}
                  required
                  placeholder="Explain why you're a good fit for this task..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsApplyDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Application'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isJoinJointDialogOpen} onOpenChange={setIsJoinJointDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Join as Task Requestor</DialogTitle>
            <DialogDescription>
              Describe what you need help with and how much you're willing to pay.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="joint-task-needs">What do you need?</Label>
              <Textarea 
                id="joint-task-needs" 
                placeholder="Describe what you need help with..."
                value={jointTaskNeeds}
                onChange={(e) => setJointTaskNeeds(e.target.value)}
                rows={4}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="joint-task-reward">Reward (₹)</Label>
              <Input 
                id="joint-task-reward" 
                type="number"
                min="1"
                value={jointTaskReward}
                onChange={(e) => setJointTaskReward(parseInt(e.target.value))}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsJoinJointDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleJoinJointTask} 
              disabled={!jointTaskNeeds.trim() || jointTaskReward <= 0}
            >
              <UserCheck className="h-4 w-4 mr-2" />
              Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isCompleteConfirmationOpen} onOpenChange={setIsCompleteConfirmationOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Mark Task as Completed</DialogTitle>
            <DialogDescription>
              Are you sure you want to mark this task as completed? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="font-medium">{task.title}</p>
            <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCompleteConfirmationOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="secondary" 
              onClick={() => {
                handleCloseTask();
                setIsCompleteConfirmationOpen(false);
              }}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TaskCard;
