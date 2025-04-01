import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';

interface Application {
  id: string;
  task_id: string;
  applicant_id: string;
  applicant_name: string;
  applicant_email: string;
  applicant_phone: string;
  proposal: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  task: {
    title: string;
    description: string;
    reward: number;
    deadline: string;
    location: string;
  } | null;
}

const Notifications = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchApplications();
    }
  }, [user]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('task_applications')
        .select(`
          *,
          task:tasks!task_id (
            title,
            description,
            reward,
            deadline,
            location
          )
        `)
        .eq('task.creator_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const validApplications = data?.filter(app => app.task !== null) || [];
      setApplications(validApplications);
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

  const handleApplicationAction = async (applicationId: string, action: 'accept' | 'reject') => {
    try {
      const { error } = await supabase
        .from('task_applications')
        .update({ status: action === 'accept' ? 'accepted' : 'rejected' })
        .eq('id', applicationId);

      if (error) throw error;

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Task Applications</h1>
      
      {applications.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No applications found.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {applications.map((application) => (
            <Card key={application.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl">
                    {application.task?.title || 'Untitled Task'}
                  </CardTitle>
                  <Badge variant={
                    application.status === 'accepted' ? 'default' :
                    application.status === 'rejected' ? 'destructive' :
                    'secondary'
                  }>
                    {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Applicant Details</h3>
                    <p><strong>Name:</strong> {application.applicant_name}</p>
                    <p><strong>Email:</strong> {application.applicant_email}</p>
                    {application.applicant_phone && (
                      <p><strong>Phone:</strong> {application.applicant_phone}</p>
                    )}
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Proposal</h3>
                    <p className="text-muted-foreground">{application.proposal}</p>
                  </div>

                  {application.task && (
                    <div>
                      <h3 className="font-semibold mb-2">Task Details</h3>
                      <p><strong>Reward:</strong> ₹{application.task.reward}</p>
                      <p><strong>Location:</strong> {application.task.location}</p>
                      <p><strong>Deadline:</strong> {format(new Date(application.task.deadline), 'MMM d, yyyy')}</p>
                    </div>
                  )}

                  {application.status === 'pending' && (
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
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications; 