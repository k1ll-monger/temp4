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
      chat_rooms: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          task_id: string | null;
          creator_id: string;
          participant_id: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          task_id?: string | null;
          creator_id: string;
          participant_id: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          task_id?: string | null;
          creator_id?: string;
          participant_id?: string;
        };
      };
      chat_messages: {
        Row: {
          id: string;
          room_id: string;
          sender_id: string;
          message: string;
          created_at: string;
          read: boolean;
        };
        Insert: {
          id?: string;
          room_id: string;
          sender_id: string;
          message: string;
          created_at?: string;
          read?: boolean;
        };
        Update: {
          id?: string;
          room_id?: string;
          sender_id?: string;
          message?: string;
          created_at?: string;
          read?: boolean;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
} 