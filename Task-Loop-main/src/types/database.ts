export interface Database {
  public: {
    Tables: {
      tasks: {
        Row: {
          id: string;
          title: string;
          description: string;
          location: string;
          reward: number;
          deadline: string;
          task_type: 'normal' | 'joint';
          status: 'active' | 'completed' | 'assigned' | 'cancelled';
          creator_id: string;
          created_at: string;
          updated_at: string;
          assigned_to: string | null;
          assigned_at: string | null;
          creator_name: string | null;
          creator_rating: number | null;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          location: string;
          reward: number;
          deadline: string;
          task_type: 'normal' | 'joint';
          status?: 'active' | 'completed' | 'assigned' | 'cancelled';
          creator_id: string;
          created_at?: string;
          updated_at?: string;
          assigned_to?: string | null;
          assigned_at?: string | null;
          creator_name?: string | null;
          creator_rating?: number | null;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          location?: string;
          reward?: number;
          deadline?: string;
          task_type?: 'normal' | 'joint';
          status?: 'active' | 'completed' | 'assigned' | 'cancelled';
          creator_id?: string;
          created_at?: string;
          updated_at?: string;
          assigned_to?: string | null;
          assigned_at?: string | null;
          creator_name?: string | null;
          creator_rating?: number | null;
        };
      };
      task_applications: {
        Row: {
          id: string;
          task_id: string;
          applicant_id: string;
          applicant_name: string;
          applicant_email: string;
          applicant_phone: string;
          proposal: string;
          status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
          created_at: string;
        };
        Insert: {
          id?: string;
          task_id: string;
          applicant_id: string;
          applicant_name: string;
          applicant_email: string;
          applicant_phone: string;
          proposal: string;
          status?: 'pending' | 'accepted' | 'rejected' | 'cancelled';
          created_at?: string;
        };
        Update: {
          id?: string;
          task_id?: string;
          applicant_id?: string;
          applicant_name?: string;
          applicant_email?: string;
          applicant_phone?: string;
          proposal?: string;
          status?: 'pending' | 'accepted' | 'rejected' | 'cancelled';
          created_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          message: string;
          type: 'info' | 'success' | 'warning' | 'error';
          read: boolean;
          related_id: string | null;
          related_type: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          message: string;
          type: 'info' | 'success' | 'warning' | 'error';
          read?: boolean;
          related_id?: string | null;
          related_type?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          message?: string;
          type?: 'info' | 'success' | 'warning' | 'error';
          read?: boolean;
          related_id?: string | null;
          related_type?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
} 