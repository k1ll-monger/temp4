import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Loader2, Bell, CheckCircle, XCircle, AlertCircle, Calendar, MapPin, DollarSign, User, Clock } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

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
  } | null;
}

interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  created_at: string;
  related_id?: string;
  related_type?: string;
}

const Notifications = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchApplications();
      fetchNotifications();
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

  const fetchNotifications = async () => {
    try {
      if (!user?.id) return;
      
      // Check if notifications table exists first
      const { data: tableExists, error: tableCheckError } = await supabase
        .from('notifications')
        .select('id')
        .limit(1);
        
      // If table doesn't exist, set empty notifications and return
      if (tableCheckError && tableCheckError.code === '42P01') {
        console.log('Notifications table does not exist yet');
        setNotifications([]);
        return;
      }
      
      // If table exists, fetch notifications
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (error: any) {
      console.error('Error fetching notifications:', error);
      
      // If the error is that the table doesn't exist, just set empty notifications
      if (error.code === '42P01') {
        setNotifications([]);
        return;
      }
      
      toast({
        title: "Error",
        description: "Failed to load notifications. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleApplicationAction = async (applicationId: string, action: 'accept' | 'reject') => {
    try {
      const application = applications.find(app => app.id === applicationId);
      if (!application) return;

      // Update application status
      const { error: applicationError } = await supabase
        .from('task_applications')
        .update({ status: action === 'accept' ? 'accepted' : 'rejected' })
        .eq('id', applicationId);

      if (applicationError) throw applicationError;

      // If accepting, update task status to assigned
      if (action === 'accept' && application.task) {
        const { error: taskError } = await supabase
          .from('tasks')
          .update({ 
            status: 'assigned',
            assigned_to: application.applicant_id,
            assigned_at: new Date().toISOString()
          })
          .eq('id', application.task.id);

        if (taskError) throw taskError;

        // Try to create notification for applicant
        try {
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
        } catch (notificationError: any) {
          // If notifications table doesn't exist, just log the error and continue
          if (notificationError.code === '42P01') {
            console.log('Notifications table does not exist yet');
          } else {
            console.error('Error creating notification:', notificationError);
          }
        }
      }

      toast({
        title: "Success",
        description: `Application ${action}ed successfully.`,
      });

      fetchApplications();
    } catch (error: any) {
      console.error(`Error ${action}ing application:`, error);
      toast({
        title: "Error",
        description: `Failed to ${action} application. Please try again.`,
        variant: "destructive",
      });
    }
  };

  const handleCancelAssignment = async () => {
    if (!selectedApplication) return;

    try {
      // Update application status to cancelled
      const { error: applicationError } = await supabase
        .from('task_applications')
        .update({ status: 'cancelled' })
        .eq('id', selectedApplication.id);

      if (applicationError) throw applicationError;

      // Update task status back to active
      if (selectedApplication.task) {
        const { error: taskError } = await supabase
          .from('tasks')
          .update({ 
            status: 'active',
            assigned_to: null,
            assigned_at: null
          })
          .eq('id', selectedApplication.task.id);

        if (taskError) throw taskError;

        // Try to create notification for applicant
        try {
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
        } catch (notificationError: any) {
          // If notifications table doesn't exist, just log the error and continue
          if (notificationError.code === '42P01') {
            console.log('Notifications table does not exist yet');
          } else {
            console.error('Error creating notification:', notificationError);
          }
        }
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
      toast({
        title: "Error",
        description: "Failed to cancel assignment. Please try again.",
        variant: "destructive",
      });
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      // Check if notifications table exists first
      const { error: tableCheckError } = await supabase
        .from('notifications')
        .select('id')
        .limit(1);
        
      // If table doesn't exist, just update the local state
      if (tableCheckError && tableCheckError.code === '42P01') {
        setNotifications(notifications.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read: true } 
            : notification
        ));
        return;
      }
      
      // If table exists, update the notification
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(notifications.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true } 
          : notification
      ));
    } catch (error: any) {
      console.error('Error marking notification as read:', error);
      
      // If the error is that the table doesn't exist, just update the local state
      if (error.code === '42P01') {
        setNotifications(notifications.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read: true } 
            : notification
        ));
      }
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Bell className="h-5 w-5 text-blue-500" />;
    }
  };

  // Filter applications by status
  const pendingApplications = applications.filter(app => app.status === 'pending');
  const acceptedApplications = applications.filter(app => app.status === 'accepted');
  const rejectedApplications = applications.filter(app => app.status === 'rejected');
  const cancelledApplications = applications.filter(app => app.status === 'cancelled');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Notifications</h1>
      
      <Tabs defaultValue="notifications" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="applications" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Applications
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notifications">
          {notifications.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No notifications found.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {notifications.map((notification) => (
                <Card 
                  key={notification.id} 
                  className={notification.read ? 'opacity-70' : ''}
                  onClick={() => {
                    if (!notification.read) {
                      markNotificationAsRead(notification.id);
                    }
                    if (notification.related_type === 'task' && notification.related_id) {
                      navigate(`/tasks/${notification.related_id}`);
                    } else if (notification.related_type === 'application' && notification.related_id) {
                      // Switch to applications tab and scroll to the application
                      const tabTrigger = document.querySelector('[value="applications"]') as HTMLElement;
                      if (tabTrigger) {
                        tabTrigger.click();
                        setTimeout(() => {
                          const applicationElement = document.getElementById(`application-${notification.related_id}`);
                          if (applicationElement) {
                            applicationElement.scrollIntoView({ behavior: 'smooth' });
                          }
                        }, 100);
                      }
                    }
                  }}
                >
                  <CardContent className="p-4 flex items-start gap-4">
                    <div className="mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{notification.title}</h3>
                      <p className="text-sm text-muted-foreground">{notification.message}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {format(new Date(notification.created_at), 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>
                    {!notification.read && (
                      <Badge variant="default" className="ml-auto">New</Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="applications">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold mb-2">Task Applications</h2>
            <p className="text-muted-foreground">
              Manage applications for your tasks and handle accepted assignments.
            </p>
          </div>
          
          {applications.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No applications found.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-8">
              {/* Pending Applications Section */}
              {pendingApplications.length > 0 && (
                <div>
                  <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Clock className="h-5 w-5 text-amber-500" />
                    Pending Applications
                  </h3>
                  <div className="grid gap-6">
                    {pendingApplications.map((application) => (
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
                            <Badge variant="secondary">
                              Pending
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
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                  <div className="flex items-center gap-1">
                                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                                    <span>₹{application.task.reward}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                    <span>{application.task.location}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <span>{format(new Date(application.task.deadline), 'MMM d, yyyy')}</span>
                                  </div>
                                </div>
                              </div>
                            )}

                            <div className="flex gap-2">
                              <Button
                                onClick={() => handleApplicationAction(application.id, 'accept')}
                              >
                                Accept
                              </Button>
                              <Button
                                variant="destructive"
                                onClick={() => handleApplicationAction(application.id, 'reject')}
                              >
                                Reject
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
                  <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    Accepted Applications
                  </h3>
                  <div className="grid gap-6">
                    {acceptedApplications.map((application) => (
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
                            <Badge variant="default">
                              Accepted
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
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                  <div className="flex items-center gap-1">
                                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                                    <span>₹{application.task.reward}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                    <span>{application.task.location}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <span>{format(new Date(application.task.deadline), 'MMM d, yyyy')}</span>
                                  </div>
                                </div>
                              </div>
                            )}

                            <div className="flex gap-2">
                              <Button
                                variant="destructive"
                                onClick={() => {
                                  setSelectedApplication(application);
                                  setCancelDialogOpen(true);
                                }}
                              >
                                Cancel Assignment
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
                            <Badge variant="destructive">
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
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                  <div className="flex items-center gap-1">
                                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                                    <span>₹{application.task.reward}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                    <span>{application.task.location}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <span>{format(new Date(application.task.deadline), 'MMM d, yyyy')}</span>
                                  </div>
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
                            <Badge variant="outline">
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
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                  <div className="flex items-center gap-1">
                                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                                    <span>₹{application.task.reward}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                    <span>{application.task.location}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <span>{format(new Date(application.task.deadline), 'MMM d, yyyy')}</span>
                                  </div>
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
      </Tabs>

      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Assignment</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this assignment? The task will become available again for other applicants.
            </DialogDescription>
          </DialogHeader>
          {selectedApplication && (
            <div className="py-4">
              <h3 className="font-semibold">{selectedApplication.task?.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Assigned to: {selectedApplication.applicant_name}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
              No, Keep Assignment
            </Button>
            <Button variant="destructive" onClick={handleCancelAssignment}>
              Yes, Cancel Assignment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Notifications; 