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
          status: 'active' | 'completed';
          creator_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          location: string;
          reward: number;
          deadline: string;
          task_type: 'normal' | 'joint';
          status?: 'active' | 'completed';
          creator_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          location?: string;
          reward?: number;
          deadline?: string;
          task_type?: 'normal' | 'joint';
          status?: 'active' | 'completed';
          creator_id?: string;
          created_at?: string;
          updated_at?: string;
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
          status: 'pending' | 'accepted' | 'rejected';
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
          status?: 'pending' | 'accepted' | 'rejected';
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
          status?: 'pending' | 'accepted' | 'rejected';
          created_at?: string;
        };
      };
    };
  };
} 