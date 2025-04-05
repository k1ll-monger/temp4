import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Loader2, CheckCircle, XCircle, AlertCircle, Calendar, MapPin, DollarSign, User, Clock, Check, X, MessageSquare, ClipboardList, Star, Trophy } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

interface Application {
  id: string;
  task_id: string;
  applicant_id: string;
  applicant_name: string;
  applicant_email: string;
  applicant_phone: string;
  proposal: string;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  created_at: string;
  task: {
    id: string;
    title: string;
    description: string;
    reward: number;
    deadline: string;
    location: string;
    status: string;
    creator_id: string;
    creator_name: string;
  } | null;
}

const Applications = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [myApplications, setMyApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMyApps, setLoadingMyApps] = useState(true);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [retractDialogOpen, setRetractDialogOpen] = useState(false);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [rating, setRating] = useState<number | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchApplications();
      fetchMyApplications();
    }
  }, [user]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      
      // First, get all tasks created by the current user
      const { data: userTasks, error: tasksError } = await supabase
        .from('tasks')
        .select('id')
        .eq('creator_id', user?.id);
        
      if (tasksError) throw tasksError;
      
      const taskIds = userTasks?.map(task => task.id) || [];
      
      if (taskIds.length === 0) {
        setApplications([]);
        setLoading(false);
        return;
      }
      
      // Then get all applications for these tasks
      const { data, error } = await supabase
        .from('task_applications')
        .select('*')
        .in('task_id', taskIds)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch tasks separately
      const applicationTaskIds = data?.map(app => app.task_id) || [];
      const uniqueTaskIds = [...new Set(applicationTaskIds)];
      
      let taskDetails: Record<string, any> = {};
      
      if (uniqueTaskIds.length > 0) {
        const { data: tasksData, error: tasksError } = await supabase
          .from('tasks')
          .select('id, title, description, reward, deadline, location, status')
          .in('id', uniqueTaskIds);
          
        if (!tasksError && tasksData) {
          taskDetails = tasksData.reduce((acc, task) => {
            acc[task.id] = task;
            return acc;
          }, {} as Record<string, any>);
        }
      }
      
      // Combine application data with task details
      const validApplications = data?.map(app => ({
        ...app,
        task: app.task_id ? taskDetails[app.task_id] || null : null
      })) || [];
      
      setApplications(validApplications);
      
      // Create notifications for new pending applications
      const pendingApplications = validApplications.filter(app => app.status === 'pending');
      
      // Check if notifications table exists first
      const { data: tableExists, error: tableCheckError } = await supabase
        .from('notifications')
        .select('id')
        .limit(1);
        
      // If table doesn't exist, we can't create notifications
      if (tableCheckError && tableCheckError.code === '42P01') {
        console.log('Notifications table does not exist yet');
        return;
      }
      
      // Create notifications for new pending applications
      for (const app of pendingApplications) {
        // Check if notification already exists for this application
        const { data: existingNotification } = await supabase
          .from('notifications')
          .select('id')
          .eq('user_id', user?.id)
          .eq('related_id', app.id)
          .eq('related_type', 'application')
          .single();
          
        if (!existingNotification && app.task) {
          // Create notification for new application
          await supabase
            .from('notifications')
            .insert({
              user_id: user?.id,
              title: 'New Task Application',
              message: `${app.applicant_name} has applied for your task "${app.task.title}".`,
              type: 'info',
              read: false,
              related_id: app.id,
              related_type: 'application'
            });
        }
      }
    } catch (error: any) {
      console.error('Error fetching applications:', error);
      toast({
        title: "Error",
        description: "Failed to load applications. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMyApplications = async () => {
    try {
      setLoadingMyApps(true);
      
      if (!user?.id) return;
      
      // Get all applications made by the current user
      const { data, error } = await supabase
        .from('task_applications')
        .select('*')
        .eq('applicant_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch tasks details for these applications
      const taskIds = data?.map(app => app.task_id) || [];
      
      let taskDetails: Record<string, any> = {};
      
      if (taskIds.length > 0) {
        const { data: tasksData, error: tasksError } = await supabase
          .from('tasks')
          .select('id, title, description, reward, deadline, location, status, creator_id, creator_name')
          .in('id', taskIds);
          
        if (!tasksError && tasksData) {
          taskDetails = tasksData.reduce((acc, task) => {
            acc[task.id] = task;
            return acc;
          }, {} as Record<string, any>);
        }
      }
      
      // Combine application data with task details
      const validApplications = data?.map(app => ({
        ...app,
        task: app.task_id ? taskDetails[app.task_id] || null : null
      })) || [];
      
      setMyApplications(validApplications);
    } catch (error: any) {
      console.error('Error fetching my applications:', error);
      toast({
        title: "Error",
        description: "Failed to load your applications. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingMyApps(false);
    }
  };

  const handleApplicationAction = async (applicationId: string, action: 'accept' | 'reject') => {
    try {
      const application = applications.find(app => app.id === applicationId);
      if (!application) {
        throw new Error('Application not found');
      }

      // Update application status
      const { error: applicationError } = await supabase
        .from('task_applications')
        .update({ status: action === 'accept' ? 'accepted' : 'rejected' })
        .eq('id', applicationId);

      if (applicationError) throw applicationError;

      // If accepting, update task status to assigned
      if (action === 'accept' && application.task) {
        // First, reject all other pending applications for this task
        const { error: rejectError } = await supabase
          .from('task_applications')
          .update({ status: 'rejected' })
          .eq('task_id', application.task.id)
          .eq('status', 'pending')
          .neq('id', applicationId);

        if (rejectError) throw rejectError;

        // Then update the task status
        const { error: taskError } = await supabase
          .from('tasks')
          .update({ 
            status: 'assigned',
            assigned_to: application.applicant_id,
            assigned_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', application.task.id);

        if (taskError) throw taskError;

        // Create a notification for the applicant
        const { error: notificationError } = await supabase
          .from('notifications')
          .insert({
            user_id: application.applicant_id,
            title: 'Application Accepted',
            message: `Your application for "${application.task.title}" has been accepted.`,
            type: 'success',
            read: false,
            related_id: application.task.id,
            related_type: 'task'
          });

        if (notificationError && notificationError.code !== '42P01') {
          console.error('Error creating notification:', notificationError);
        }
      } else if (action === 'reject' && application.task) {
        // Create a notification for the rejected applicant
        const { error: notificationError } = await supabase
          .from('notifications')
          .insert({
            user_id: application.applicant_id,
            title: 'Application Rejected',
            message: `Your application for "${application.task.title}" has been rejected.`,
            type: 'error',
            read: false,
            related_id: application.task.id,
            related_type: 'task'
          });

        if (notificationError && notificationError.code !== '42P01') {
          console.error('Error creating notification:', notificationError);
        }
      }

      // Update the local state
      setApplications(applications.map(app => 
        app.id === applicationId ? { ...app, status: action === 'accept' ? 'accepted' : 'rejected' } : app
      ));

      toast({
        title: "Success",
        description: `Application ${action === 'accept' ? 'accepted' : 'rejected'} successfully.`,
      });
    } catch (error: any) {
      console.error('Error updating application status:', error);
      toast({
        title: "Error",
        description: "Failed to update application status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCancelAssignment = async () => {
    try {
      if (!selectedApplication || !selectedApplication.task) {
        throw new Error('No application selected or task details missing');
      }

      // Update task status back to active
      const { error: taskError } = await supabase
        .from('tasks')
        .update({ 
          status: 'active',
          assigned_to: null,
          assigned_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedApplication.task.id);

      if (taskError) throw taskError;

      // Update application status to cancelled
      const { error: applicationError } = await supabase
        .from('task_applications')
        .update({ status: 'cancelled' })
        .eq('id', selectedApplication.id);

      if (applicationError) throw applicationError;

      // Create a notification for the applicant
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: selectedApplication.applicant_id,
          title: 'Assignment Cancelled',
          message: `Your assignment for "${selectedApplication.task.title}" has been cancelled.`,
          type: 'warning',
          read: false,
          related_id: selectedApplication.task.id,
          related_type: 'task'
        });

      if (notificationError && notificationError.code !== '42P01') {
        console.error('Error creating notification:', notificationError);
      }

      toast({
        title: "Success",
        description: "Assignment cancelled successfully. The task is now available again.",
      });

      setCancelDialogOpen(false);
      setSelectedApplication(null);
      fetchApplications();
    } catch (error: any) {
      console.error('Error cancelling assignment:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      toast({
        title: "Error",
        description: "Failed to cancel assignment. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRetractApplication = async () => {
    try {
      if (!selectedApplication) {
        throw new Error('No application selected');
      }

      // Only allow retracting pending applications
      if (selectedApplication.status !== 'pending') {
        toast({
          title: "Error",
          description: "Only pending applications can be retracted.",
          variant: "destructive",
        });
        return;
      }

      // Update application status to cancelled
      const { error: applicationError } = await supabase
        .from('task_applications')
        .update({ status: 'cancelled' })
        .eq('id', selectedApplication.id);

      if (applicationError) throw applicationError;

      // Update local state
      setMyApplications(prev => 
        prev.map(app => 
          app.id === selectedApplication.id ? { ...app, status: 'cancelled' } : app
        )
      );

      toast({
        title: "Success",
        description: "Application retracted successfully.",
      });

      setRetractDialogOpen(false);
      setSelectedApplication(null);
    } catch (error: any) {
      console.error('Error retracting application:', error);
      toast({
        title: "Error",
        description: "Failed to retract application. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleStartChat = async (application: Application) => {
    try {
      // Check if a chat room already exists
      const { data: existingRoom, error: roomError } = await supabase
        .from('chat_rooms')
        .select('*')
        .eq('task_id', application.task_id)
        .eq('creator_id', application.applicant_id)
        .eq('participant_id', user?.id)
        .single();

      if (roomError && roomError.code !== 'PGRST116') {
        throw roomError;
      }

      if (existingRoom) {
        // Navigate to existing chat room
        navigate(`/chat/${existingRoom.id}`);
        return;
      }

      // Create a new chat room
      const { data: newRoom, error: createError } = await supabase
        .from('chat_rooms')
        .insert({
          task_id: application.task_id,
          creator_id: application.applicant_id,
          participant_id: user?.id,
        })
        .select()
        .single();

      if (createError) throw createError;

      // Navigate to the new chat room
      navigate(`/chat/${newRoom.id}`);
    } catch (error) {
      console.error('Error starting chat:', error);
      toast({
        title: 'Error',
        description: 'Failed to start chat. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleMarkComplete = async () => {
    try {
      if (!selectedApplication || !selectedApplication.task) {
        throw new Error('No application selected or task details missing');
      }

      // Update task status to completed
      const { error: taskError } = await supabase
        .from('tasks')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedApplication.task.id);

      if (taskError) throw taskError;

      // If a rating was provided, save it
      if (rating) {
        // Check if ratings table exists and create it if needed
        const { data: tableData, error: tableCheckError } = await supabase
          .from('user_ratings')
          .select('id')
          .limit(1);
          
        if (tableCheckError && tableCheckError.code === '42P01') {
          // Create ratings table if it doesn't exist
          const { error: createTableError } = await supabase.rpc('create_ratings_table_if_not_exists');
          if (createTableError) console.error('Error creating ratings table:', createTableError);
        }
        
        // Save the rating
        const { error: ratingError } = await supabase
          .from('user_ratings')
          .insert({
            rated_by_id: user?.id,
            rated_user_id: selectedApplication.applicant_id,
            task_id: selectedApplication.task.id,
            rating: rating,
            created_at: new Date().toISOString()
          });

        if (ratingError && ratingError.code !== '42P01') {
          console.error('Error saving rating:', ratingError);
        }
      }

      // Create a notification for the applicant
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: selectedApplication.applicant_id,
          title: 'Task Completed',
          message: `Your work on "${selectedApplication.task.title}" has been marked as completed.`,
          type: 'success',
          read: false,
          related_id: selectedApplication.task.id,
          related_type: 'task'
        });

      if (notificationError && notificationError.code !== '42P01') {
        console.error('Error creating notification:', notificationError);
      }

      toast({
        title: "Success",
        description: "Task marked as completed successfully.",
      });

      setCompleteDialogOpen(false);
      setSelectedApplication(null);
      setRating(null);
      fetchApplications();
    } catch (error: any) {
      console.error('Error marking task as complete:', error);
      toast({
        title: "Error",
        description: "Failed to mark task as complete. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Filter applications by status
  const pendingApplications = applications.filter(app => app.status === 'pending');
  const acceptedApplications = applications.filter(app => app.status === 'accepted');
  const rejectedApplications = applications.filter(app => app.status === 'rejected');
  const cancelledApplications = applications.filter(app => app.status === 'cancelled');

  if (loading && loadingMyApps) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Custom card styles for a more compact UI
  const cardStyles = "transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 hover:border-primary/50 group";
  const headerStyles = "p-4 pb-2";
  const contentStyles = "p-4 pt-2";
  const titleStyles = "text-base group-hover:text-primary transition-colors";
  const descriptionStyles = "text-xs";
  const sectionTitleStyles = "font-semibold mb-1 text-sm";
  const textStyles = "text-sm";
  const iconStyles = "h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors";
  const buttonStyles = {
    base: "h-8 text-xs transition-colors",
    accept: "hover:bg-green-50 hover:text-green-600 hover:border-green-200 hover:scale-105 transition-transform",
    reject: "hover:bg-red-50 hover:text-red-600 hover:border-red-200 hover:scale-105 transition-transform",
    chat: "hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 hover:scale-105 transition-transform",
    retract: "hover:bg-red-50 hover:text-red-600 hover:border-red-200 hover:scale-105 transition-transform"
  };
  const sectionHeaderStyles = "text-base font-semibold mb-3 flex items-center gap-2";
  const sectionStyles = "space-y-4";
  const gridGapStyles = "grid gap-4";

  return (
    <div className="container mx-auto py-6 max-w-5xl">
      <h1 className="text-2xl font-bold mb-4">Task Applications</h1>
      
      <div className="bg-muted/50 p-3 rounded-lg mb-4 text-sm">
        <p className="text-muted-foreground">
          <span className="font-medium">Use the tabs below to manage your applications:</span>
          <br />
          • "Received Applications" shows requests others have made to your tasks
          <br />
          • "My Applications" shows tasks you've applied to
        </p>
      </div>
      
      <Tabs defaultValue="received" className="w-full">
        <TabsList className="mb-4 grid w-full grid-cols-2 bg-card border border-border p-1 rounded-lg">
          <TabsTrigger value="received" className="flex items-center justify-center gap-2 py-3 text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">
            <User className="h-4 w-4" />
            Received Applications
          </TabsTrigger>
          <TabsTrigger value="submitted" className="flex items-center justify-center gap-2 py-3 text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">
            <ClipboardList className="h-4 w-4" />
            My Applications
          </TabsTrigger>
        </TabsList>

        <TabsContent value="received" className="border border-border rounded-lg p-4 mt-2">
          <h2 className="text-lg font-bold mb-3">Applications Received</h2>
          {applications.length === 0 ? (
            <Card>
              <CardContent className="py-6 text-center text-muted-foreground">
                No applications found for your tasks.
              </CardContent>
            </Card>
          ) : (
            <div className={sectionStyles}>
              {/* Pending Applications Section */}
              {pendingApplications.length > 0 && (
                <div>
                  <h3 className={sectionHeaderStyles}>
                    <Clock className="h-4 w-4 text-yellow-500" />
                    Pending Applications
                  </h3>
                  <div className={gridGapStyles}>
                    {pendingApplications.map((application) => (
                      <Card 
                        key={application.id} 
                        id={`application-${application.id}`}
                        className={cardStyles}
                      >
                        <CardHeader className={headerStyles}>
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className={titleStyles}>
                                {application.task?.title || 'Untitled Task'}
                              </CardTitle>
                              <CardDescription className={descriptionStyles}>
                                Application received on {format(new Date(application.created_at), 'MMM d, yyyy')}
                              </CardDescription>
                            </div>
                            <Badge variant="secondary" className="text-xs transition-transform group-hover:scale-110">
                              Pending
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className={contentStyles}>
                          <div className="space-y-3 text-sm">
                            <div>
                              <h3 className={sectionTitleStyles}>Applicant Details</h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                                <p className={textStyles}><span className="font-medium">Name:</span> {application.applicant_name}</p>
                                <p className={textStyles}><span className="font-medium">Email:</span> {application.applicant_email}</p>
                                {application.applicant_phone && (
                                  <p className={textStyles}><span className="font-medium">Phone:</span> {application.applicant_phone}</p>
                                )}
                              </div>
                            </div>

                            <div>
                              <h3 className={sectionTitleStyles}>Proposal</h3>
                              <p className="text-sm text-muted-foreground">{application.proposal}</p>
                            </div>

                            {application.task && (
                              <div>
                                <h3 className={sectionTitleStyles}>Task Details</h3>
                                <div className="flex items-center gap-2 text-muted-foreground group-hover:text-foreground/80 transition-colors">
                                  <DollarSign className={iconStyles} />
                                  <span>₹{application.task.reward}</span>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground group-hover:text-foreground/80 transition-colors">
                                  <MapPin className={iconStyles} />
                                  <span>{application.task.location}</span>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground group-hover:text-foreground/80 transition-colors">
                                  <Calendar className={iconStyles} />
                                  <span>{format(new Date(application.task.deadline), 'MMM d, yyyy')}</span>
                                </div>
                              </div>
                            )}

                            <div className="flex gap-2 pt-1">
                              <Button
                                variant="outline"
                                size="sm"
                                className={`${buttonStyles.base} ${buttonStyles.accept}`}
                                onClick={() => handleApplicationAction(application.id, 'accept')}
                                disabled={loading}
                              >
                                <Check className="h-3.5 w-3.5 mr-1" />
                                Accept
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className={`${buttonStyles.base} ${buttonStyles.reject}`}
                                onClick={() => handleApplicationAction(application.id, 'reject')}
                                disabled={loading}
                              >
                                <X className="h-3.5 w-3.5 mr-1" />
                                Reject
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className={`${buttonStyles.base} ${buttonStyles.chat}`}
                                onClick={() => handleStartChat(application)}
                                disabled={loading}
                              >
                                <MessageSquare className="h-3.5 w-3.5 mr-1" />
                                Chat
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Accepted Applications Section */}
              {acceptedApplications.length > 0 && (
                <div>
                  <h3 className={sectionHeaderStyles}>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Accepted Applications
                  </h3>
                  <div className={gridGapStyles}>
                    {acceptedApplications.map((application) => (
                      <Card 
                        key={application.id} 
                        id={`application-${application.id}`}
                        className={cardStyles}
                      >
                        <CardHeader className={headerStyles}>
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className={titleStyles}>
                                {application.task?.title || 'Untitled Task'}
                              </CardTitle>
                              <CardDescription className={descriptionStyles}>
                                Application received on {format(new Date(application.created_at), 'MMM d, yyyy')}
                              </CardDescription>
                            </div>
                            <Badge variant="default" className="text-xs transition-transform group-hover:scale-110">
                              Accepted
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className={contentStyles}>
                          <div className="space-y-3 text-sm">
                            <div>
                              <h3 className={sectionTitleStyles}>Applicant Details</h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                                <p className={textStyles}><span className="font-medium">Name:</span> {application.applicant_name}</p>
                                <p className={textStyles}><span className="font-medium">Email:</span> {application.applicant_email}</p>
                                {application.applicant_phone && (
                                  <p className={textStyles}><span className="font-medium">Phone:</span> {application.applicant_phone}</p>
                                )}
                              </div>
                            </div>

                            <div>
                              <h3 className={sectionTitleStyles}>Proposal</h3>
                              <p className="text-sm text-muted-foreground">{application.proposal}</p>
                            </div>

                            {application.task && (
                              <div>
                                <h3 className={sectionTitleStyles}>Task Details</h3>
                                <div className="flex items-center gap-2 text-muted-foreground group-hover:text-foreground/80 transition-colors">
                                  <DollarSign className={iconStyles} />
                                  <span>₹{application.task.reward}</span>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground group-hover:text-foreground/80 transition-colors">
                                  <MapPin className={iconStyles} />
                                  <span>{application.task.location}</span>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground group-hover:text-foreground/80 transition-colors">
                                  <Calendar className={iconStyles} />
                                  <span>{format(new Date(application.task.deadline), 'MMM d, yyyy')}</span>
                                </div>
                              </div>
                            )}

                            <div className="flex gap-2 pt-1">
                              <Button
                                variant="destructive"
                                size="sm"
                                className="h-8 text-xs"
                                onClick={() => {
                                  setSelectedApplication(application);
                                  setCancelDialogOpen(true);
                                }}
                              >
                                Cancel Assignment
                              </Button>
                              <Button
                                variant="default"
                                size="sm"
                                className="h-8 text-xs bg-green-600 hover:bg-green-700 transition-all hover:scale-105"
                                onClick={() => {
                                  setSelectedApplication(application);
                                  setCompleteDialogOpen(true);
                                }}
                              >
                                <Trophy className="h-3.5 w-3.5 mr-1" />
                                Mark as Complete
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Rejected Applications Section */}
              {rejectedApplications.length > 0 && (
                <div>
                  <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <XCircle className="h-5 w-5 text-red-500" />
                    Rejected Applications
                  </h3>
                  <div className="grid gap-6">
                    {rejectedApplications.map((application) => (
                      <Card key={application.id} id={`application-${application.id}`}>
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-xl">
                                {application.task?.title || 'Untitled Task'}
                              </CardTitle>
                              <CardDescription>
                                Application received on {format(new Date(application.created_at), 'MMM d, yyyy')}
                              </CardDescription>
                            </div>
                            <Badge variant="destructive" className="text-xs transition-transform group-hover:scale-110">
                              Rejected
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div>
                              <h3 className="font-semibold mb-2">Applicant Details</h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                <p><strong>Name:</strong> {application.applicant_name}</p>
                                <p><strong>Email:</strong> {application.applicant_email}</p>
                                {application.applicant_phone && (
                                  <p><strong>Phone:</strong> {application.applicant_phone}</p>
                                )}
                              </div>
                            </div>

                            <div>
                              <h3 className="font-semibold mb-2">Proposal</h3>
                              <p className="text-muted-foreground">{application.proposal}</p>
                            </div>

                            {application.task && (
                              <div>
                                <h3 className="font-semibold mb-2">Task Details</h3>
                                <div className="flex items-center gap-2 text-muted-foreground group-hover:text-foreground/80 transition-colors">
                                  <DollarSign className={iconStyles} />
                                  <span>₹{application.task.reward}</span>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground group-hover:text-foreground/80 transition-colors">
                                  <MapPin className={iconStyles} />
                                  <span>{application.task.location}</span>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground group-hover:text-foreground/80 transition-colors">
                                  <Calendar className={iconStyles} />
                                  <span>{format(new Date(application.task.deadline), 'MMM d, yyyy')}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Cancelled Applications Section */}
              {cancelledApplications.length > 0 && (
                <div>
                  <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-gray-500" />
                    Cancelled Applications
                  </h3>
                  <div className="grid gap-6">
                    {cancelledApplications.map((application) => (
                      <Card key={application.id} id={`application-${application.id}`}>
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-xl">
                                {application.task?.title || 'Untitled Task'}
                              </CardTitle>
                              <CardDescription>
                                Application received on {format(new Date(application.created_at), 'MMM d, yyyy')}
                              </CardDescription>
                            </div>
                            <Badge variant="outline" className="text-xs transition-transform group-hover:scale-110">
                              Cancelled
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div>
                              <h3 className="font-semibold mb-2">Applicant Details</h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                <p><strong>Name:</strong> {application.applicant_name}</p>
                                <p><strong>Email:</strong> {application.applicant_email}</p>
                                {application.applicant_phone && (
                                  <p><strong>Phone:</strong> {application.applicant_phone}</p>
                                )}
                              </div>
                            </div>

                            <div>
                              <h3 className="font-semibold mb-2">Proposal</h3>
                              <p className="text-muted-foreground">{application.proposal}</p>
                            </div>

                            {application.task && (
                              <div>
                                <h3 className="font-semibold mb-2">Task Details</h3>
                                <div className="flex items-center gap-2 text-muted-foreground group-hover:text-foreground/80 transition-colors">
                                  <DollarSign className={iconStyles} />
                                  <span>₹{application.task.reward}</span>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground group-hover:text-foreground/80 transition-colors">
                                  <MapPin className={iconStyles} />
                                  <span>{application.task.location}</span>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground group-hover:text-foreground/80 transition-colors">
                                  <Calendar className={iconStyles} />
                                  <span>{format(new Date(application.task.deadline), 'MMM d, yyyy')}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="submitted" className="border border-border rounded-lg p-4 mt-2">
          <h2 className="text-lg font-bold mb-3">My Submitted Applications</h2>
          {loadingMyApps ? (
            <div className="flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : myApplications.length === 0 ? (
            <Card>
              <CardContent className="py-6 text-center text-muted-foreground">
                You haven't applied to any tasks yet.
              </CardContent>
            </Card>
          ) : (
            <div className={sectionStyles}>
              {/* Pending applications I've submitted */}
              {myApplications.filter(app => app.status === 'pending').length > 0 && (
                <div>
                  <h3 className={sectionHeaderStyles}>
                    <Clock className="h-4 w-4 text-yellow-500" />
                    Pending Applications
                  </h3>
                  <div className={gridGapStyles}>
                    {myApplications.filter(app => app.status === 'pending').map((application) => (
                      <Card 
                        key={application.id}
                        className={cardStyles}
                      >
                        <CardHeader className={headerStyles}>
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className={titleStyles}>
                                {application.task?.title || 'Untitled Task'}
                              </CardTitle>
                              <CardDescription className={descriptionStyles}>
                                Applied on {format(new Date(application.created_at), 'MMM d, yyyy')}
                              </CardDescription>
                            </div>
                            <Badge variant="secondary" className="text-xs">
                              Pending
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className={contentStyles}>
                          <div className="space-y-3 text-sm">
                            {application.task && (
                              <div>
                                <h3 className={sectionTitleStyles}>Task Details</h3>
                                <div className="flex items-center gap-2 text-muted-foreground group-hover:text-foreground/80 transition-colors">
                                  <DollarSign className={iconStyles} />
                                  <span>₹{application.task.reward}</span>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground group-hover:text-foreground/80 transition-colors">
                                  <MapPin className={iconStyles} />
                                  <span>{application.task.location}</span>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground group-hover:text-foreground/80 transition-colors">
                                  <Calendar className={iconStyles} />
                                  <span>{format(new Date(application.task.deadline), 'MMM d, yyyy')}</span>
                                </div>
                                <p className="mt-2 text-xs text-muted-foreground">
                                  Creator: {application.task.creator_name || 'Anonymous User'}
                                </p>
                              </div>
                            )}

                            <div>
                              <h3 className={sectionTitleStyles}>Your Proposal</h3>
                              <p className="text-sm text-muted-foreground">{application.proposal}</p>
                            </div>

                            <div className="flex gap-2 pt-1">
                              <Button
                                variant="destructive"
                                size="sm"
                                className={`${buttonStyles.base} ${buttonStyles.retract}`}
                                onClick={() => {
                                  setSelectedApplication(application);
                                  setRetractDialogOpen(true);
                                }}
                              >
                                <X className="h-3.5 w-3.5 mr-1" />
                                Retract Application
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className={`${buttonStyles.base} ${buttonStyles.chat}`}
                                onClick={() => {
                                  if (application.task) {
                                    navigate(`/chat?taskId=${application.task.id}`);
                                  }
                                }}
                              >
                                <MessageSquare className="h-3.5 w-3.5 mr-1" />
                                Contact
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Accepted applications I've submitted */}
              {myApplications.filter(app => app.status === 'accepted').length > 0 && (
                <div>
                  <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    Accepted Applications
                  </h3>
                  <div className="grid gap-6">
                    {myApplications.filter(app => app.status === 'accepted').map((application) => (
                      <Card key={application.id}>
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-xl">
                                {application.task?.title || 'Untitled Task'}
                              </CardTitle>
                              <CardDescription>
                                Applied on {format(new Date(application.created_at), 'MMM d, yyyy')}
                              </CardDescription>
                            </div>
                            <Badge variant="default" className="text-xs transition-transform group-hover:scale-110">
                              Accepted
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {application.task && (
                              <div>
                                <h3 className="font-semibold mb-2">Task Details</h3>
                                <div className="flex items-center gap-2 text-muted-foreground group-hover:text-foreground/80 transition-colors">
                                  <DollarSign className={iconStyles} />
                                  <span>₹{application.task.reward}</span>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground group-hover:text-foreground/80 transition-colors">
                                  <MapPin className={iconStyles} />
                                  <span>{application.task.location}</span>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground group-hover:text-foreground/80 transition-colors">
                                  <Calendar className={iconStyles} />
                                  <span>{format(new Date(application.task.deadline), 'MMM d, yyyy')}</span>
                                </div>
                              </div>
                            )}

                            <div>
                              <h3 className="font-semibold mb-2">Your Proposal</h3>
                              <p className="text-muted-foreground">{application.proposal}</p>
                            </div>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (application.task) {
                                  navigate(`/chat?taskId=${application.task.id}`);
                                }
                              }}
                            >
                              <MessageSquare className="h-4 w-4 mr-1" />
                              Contact
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Rejected applications I've submitted */}
              {myApplications.filter(app => app.status === 'rejected').length > 0 && (
                <div>
                  <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <XCircle className="h-5 w-5 text-red-500" />
                    Rejected Applications
                  </h3>
                  <div className="grid gap-6">
                    {myApplications.filter(app => app.status === 'rejected').map((application) => (
                      <Card key={application.id}>
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-xl">
                                {application.task?.title || 'Untitled Task'}
                              </CardTitle>
                              <CardDescription>
                                Applied on {format(new Date(application.created_at), 'MMM d, yyyy')}
                              </CardDescription>
                            </div>
                            <Badge variant="destructive" className="text-xs transition-transform group-hover:scale-110">
                              Rejected
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {application.task && (
                              <div>
                                <h3 className="font-semibold mb-2">Task Details</h3>
                                <div className="flex items-center gap-2 text-muted-foreground group-hover:text-foreground/80 transition-colors">
                                  <DollarSign className={iconStyles} />
                                  <span>₹{application.task.reward}</span>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground group-hover:text-foreground/80 transition-colors">
                                  <MapPin className={iconStyles} />
                                  <span>{application.task.location}</span>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground group-hover:text-foreground/80 transition-colors">
                                  <Calendar className={iconStyles} />
                                  <span>{format(new Date(application.task.deadline), 'MMM d, yyyy')}</span>
                                </div>
                              </div>
                            )}

                            <div>
                              <h3 className="font-semibold mb-2">Your Proposal</h3>
                              <p className="text-muted-foreground">{application.proposal}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Cancelled applications I've submitted */}
              {myApplications.filter(app => app.status === 'cancelled').length > 0 && (
                <div>
                  <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-gray-500" />
                    Cancelled Applications
                  </h3>
                  <div className="grid gap-6">
                    {myApplications.filter(app => app.status === 'cancelled').map((application) => (
                      <Card key={application.id}>
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-xl">
                                {application.task?.title || 'Untitled Task'}
                              </CardTitle>
                              <CardDescription>
                                Applied on {format(new Date(application.created_at), 'MMM d, yyyy')}
                              </CardDescription>
                            </div>
                            <Badge variant="outline" className="text-xs transition-transform group-hover:scale-110">
                              Cancelled
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {application.task && (
                              <div>
                                <h3 className="font-semibold mb-2">Task Details</h3>
                                <div className="flex items-center gap-2 text-muted-foreground group-hover:text-foreground/80 transition-colors">
                                  <DollarSign className={iconStyles} />
                                  <span>₹{application.task.reward}</span>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground group-hover:text-foreground/80 transition-colors">
                                  <MapPin className={iconStyles} />
                                  <span>{application.task.location}</span>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground group-hover:text-foreground/80 transition-colors">
                                  <Calendar className={iconStyles} />
                                  <span>{format(new Date(application.task.deadline), 'MMM d, yyyy')}</span>
                                </div>
                              </div>
                            )}

                            <div>
                              <h3 className="font-semibold mb-2">Your Proposal</h3>
                              <p className="text-muted-foreground">{application.proposal}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Cancel Assignment Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent className="max-w-md border border-primary/20 shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-xl text-primary">Cancel Assignment</DialogTitle>
            <DialogDescription className="text-sm">
              Are you sure you want to cancel this assignment? The task will become available again for other applicants.
            </DialogDescription>
          </DialogHeader>
          {selectedApplication && (
            <div className="py-2">
              <h3 className="font-semibold text-sm">{selectedApplication.task?.title}</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Assigned to: {selectedApplication.applicant_name}
              </p>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button 
              variant="outline" 
              onClick={() => setCancelDialogOpen(false)}
              className="transition-all hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 text-sm hover:scale-105"
            >
              No, Keep Assignment
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleCancelAssignment}
              className="transition-all text-sm hover:shadow-md hover:shadow-destructive/20 hover:scale-105"
            >
              Yes, Cancel Assignment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Retract Application Dialog */}
      <Dialog open={retractDialogOpen} onOpenChange={setRetractDialogOpen}>
        <DialogContent className="max-w-md border border-primary/20 shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-xl text-primary">Retract Application</DialogTitle>
            <DialogDescription className="text-sm">
              Are you sure you want to retract your application? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedApplication && (
            <div className="py-2">
              <h3 className="font-semibold text-sm">{selectedApplication.task?.title}</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Applied on: {format(new Date(selectedApplication.created_at), 'MMM d, yyyy')}
              </p>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button 
              variant="outline" 
              onClick={() => setRetractDialogOpen(false)}
              className="transition-all hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 text-sm hover:scale-105"
            >
              No, Keep Application
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleRetractApplication}
              className="transition-all text-sm hover:shadow-md hover:shadow-destructive/20 hover:scale-105"
            >
              Yes, Retract Application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Complete Task Dialog */}
      <Dialog open={completeDialogOpen} onOpenChange={setCompleteDialogOpen}>
        <DialogContent className="max-w-md border border-primary/20 shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-xl text-primary">Mark Task as Complete</DialogTitle>
            <DialogDescription className="text-sm">
              Confirm that this task has been completed successfully by the assignee.
              Please also rate your experience with this user.
            </DialogDescription>
          </DialogHeader>
          {selectedApplication && (
            <div className="py-2 space-y-3">
              <h3 className="font-semibold text-sm">{selectedApplication.task?.title}</h3>
              <p className="text-xs text-muted-foreground">
                Assigned to: {selectedApplication.applicant_name}
              </p>
              
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
          <DialogFooter className="gap-2 sm:gap-0">
            <Button 
              variant="outline" 
              onClick={() => {
                setCompleteDialogOpen(false);
                setRating(null);
              }}
              className="transition-all hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 text-sm hover:scale-105"
            >
              Cancel
            </Button>
            <Button 
              variant="default" 
              onClick={handleMarkComplete}
              className="transition-all bg-green-600 hover:bg-green-700 text-sm hover:shadow-md hover:shadow-green-600/20 hover:scale-105"
            >
              Confirm Completion
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Applications; 