import React, { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, Edit, Trash, MapPin, CalendarClock, MessageCircle, Plus, Send, UserPlus, UserCheck, CheckCircle2 } from 'lucide-react';
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
    status: "active" | "completed";
    createdAt: Date;
    creatorId: string;
    creatorName: string;
    creatorRating?: number;
  };
  isOwner?: boolean;
  isCompleted?: boolean;
  onCancel?: (taskId: string) => void;
  onEdit?: (task: TaskType) => void;
  onApply?: (taskId: string, message: string) => void;
  onJoinJointTask?: (taskId: string, needs: string, reward: number) => void;
  onApproveJointRequestor?: (taskId: string, userId: string) => void;
  onRejectJointRequestor?: (taskId: string, userId: string) => void;
  onApproveDoer?: (taskId: string, userId: string) => void;
  onRejectDoer?: (taskId: string, userId: string) => void;
  onAddToChat?: (taskId: string) => void;
  onStatusChange?: () => void;
}

const TaskCard = ({ 
  task, 
  isOwner = false, 
  isCompleted = false,
  onCancel,
  onEdit,
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

  const handleApply = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to apply for tasks.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const { error } = await supabase
        .from('task_applications')
        .insert({
          task_id: task.id,
          applicant_id: user.id,
          applicant_name: user.user_metadata?.name || 'Anonymous',
          applicant_email: user.email,
          applicant_phone: applicantPhone,
          proposal: proposal,
        });

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Your application has been submitted.",
      });

      // Reset form
      setApplicantName('');
      setApplicantEmail('');
      setApplicantPhone('');
      setProposal('');
      setIsApplyDialogOpen(false);
    } catch (error: any) {
      console.error('Error applying for task:', error);
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

      if (onStatusChange) {
        onStatusChange();
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
    } else if (task.doerId) {
      return {
        color: 'text-green-500',
        bgColor: 'bg-green-500',
        text: 'Active',
        variant: 'default' as const
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
      <Card 
        className={`h-full flex flex-col w-[90%] mx-auto ${!isOwner ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
        onClick={!isOwner ? handleCardClick : undefined}
      >
        <CardHeader>
          <div className="flex justify-between items-start">
            <CardTitle className="text-xl">{task.title}</CardTitle>
            <Badge className={`${statusInfo.bgColor} text-sm`}>
              {statusInfo.text.charAt(0).toUpperCase() + statusInfo.text.slice(1)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-4 flex-1">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-semibold text-lg">{task.title}</h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center">
                <div className={`h-2.5 w-2.5 rounded-full ${statusInfo.bgColor} mr-2 animate-pulse`}></div>
                <span className={`text-xs font-medium ${statusInfo.color}`}>{statusInfo.text}</span>
              </div>
              <div className="text-lg font-bold">₹{task.reward}</div>
            </div>
          </div>
          
          <p className="text-muted-foreground mb-4 text-sm">{task.description}</p>
          
          <div className="flex items-center text-xs text-muted-foreground mb-2">
            <MapPin className="h-3 w-3 mr-1" />
            <span>{task.location}</span>
          </div>
          
          <div className="flex flex-col gap-1 mb-4">
            <div className="flex items-center text-xs text-muted-foreground">
              <CalendarClock className="h-3 w-3 mr-1" />
              <span>Due: {format(new Date(task.deadline), 'MMM d, yyyy')} at {format(new Date(task.deadline), 'h:mm a')}</span>
            </div>
          </div>
          
          {task.taskType === 'joint' && (
            <Badge variant="outline" className="mb-4">Joint Task</Badge>
          )}
          
          <div className="mt-auto flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Posted by</span>
              <span className="font-medium">{task.creatorName}</span>
              {task.creatorRating !== undefined && (
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm text-gray-600">
                    {task.creatorRating.toFixed(1)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
        
        {isOwner && !isCompleted && (
          <CardFooter className="p-4 pt-0 flex justify-end space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsApplicationsDialogOpen(true)}
            >
              <MessageCircle className="h-4 w-4 mr-1" />
              View Applications
            </Button>
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[550px]">
                <div>Edit Task Form Placeholder</div>
              </DialogContent>
            </Dialog>
            
            <Button variant="destructive" size="sm" onClick={handleCancel}>
              <Trash className="h-4 w-4 mr-1" />
              Cancel
            </Button>
          </CardFooter>
        )}
      </Card>

      {isOwner && (
        <TaskApplications
          taskId={task.id}
          isOpen={isApplicationsDialogOpen}
          onOpenChange={setIsApplicationsDialogOpen}
        />
      )}

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
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Apply for Task</DialogTitle>
            <DialogDescription>
              Fill in your details and explain why you're a good fit for this task.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="applicant-name">Your Name *</Label>
              <Input 
                id="applicant-name" 
                placeholder="Enter your full name"
                value={applicantName}
                onChange={(e) => setApplicantName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="applicant-email">Your Email *</Label>
              <Input 
                id="applicant-email" 
                type="email"
                placeholder="Enter your email address"
                value={applicantEmail}
                onChange={(e) => setApplicantEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="applicant-phone">Your Phone (Optional)</Label>
              <Input 
                id="applicant-phone" 
                type="tel"
                placeholder="Enter your phone number"
                value={applicantPhone}
                onChange={(e) => setApplicantPhone(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="proposal">Your Proposal *</Label>
              <Textarea 
                id="proposal" 
                placeholder="Explain why you're interested in this task and your qualifications..."
                value={proposal}
                onChange={(e) => setProposal(e.target.value)}
                rows={5}
                required
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApplyDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleApply} 
              disabled={isSubmitting || !applicantName.trim() || !applicantEmail.trim() || !proposal.trim()}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
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

      {isOwner && task.status === 'active' && (
        <CardFooter className="p-4 pt-0 flex justify-end space-x-2">
          <Button
            variant="secondary"
            onClick={handleCloseTask}
            className="flex items-center gap-2"
          >
            <CheckCircle2 className="h-4 w-4" />
            Mark as Completed
          </Button>
        </CardFooter>
      )}
    </>
  );
};

export default TaskCard;
