import React, { useState } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, Edit, Trash, MapPin, CalendarClock, MessageCircle, Plus, Send, UserPlus, UserCheck } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { TaskType } from '@/lib/types';
import { Badge } from './ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { useNavigate } from 'react-router-dom';

interface TaskCardProps {
  task: TaskType;
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
  onAddToChat
}: TaskCardProps) => {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isApplyDialogOpen, setIsApplyDialogOpen] = useState(false);
  const [isJoinJointDialogOpen, setIsJoinJointDialogOpen] = useState(false);
  const [applicationMessage, setApplicationMessage] = useState('');
  const [jointTaskNeeds, setJointTaskNeeds] = useState('');
  const [jointTaskReward, setJointTaskReward] = useState(100);
  const { toast } = useToast();
  const navigate = useNavigate();

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

  const handleApply = () => {
    if (onApply && applicationMessage.trim()) {
      onApply(task.id, applicationMessage);
      setApplicationMessage('');
      setIsApplyDialogOpen(false);
      toast({
        title: "Application Submitted",
        description: "Your application has been sent to the task creator."
      });
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
            <div className="text-sm">{task.creatorName}</div>
            <div className="flex items-center">
              <span className="text-yellow-500 font-medium">{task.creatorRating.toFixed(1)}</span>
              <Star className="h-4 w-4 text-yellow-500 ml-1" fill="currentColor" />
            </div>
          </div>
        </CardContent>
        
        {isOwner && !isCompleted && (
          <CardFooter className="p-4 pt-0 flex justify-end space-x-2">
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
                  <span className="text-yellow-500 font-medium">{task.creatorRating.toFixed(1)}</span>
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
              Send a message to the task creator explaining why you're a good fit for this task.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="application-message">Your Message</Label>
              <Textarea 
                id="application-message" 
                placeholder="Explain why you're interested in this task and your qualifications..."
                value={applicationMessage}
                onChange={(e) => setApplicationMessage(e.target.value)}
                rows={5}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApplyDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleApply} disabled={!applicationMessage.trim()}>
              <Send className="h-4 w-4 mr-2" />
              Submit Application
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
    </>
  );
};

export default TaskCard;
