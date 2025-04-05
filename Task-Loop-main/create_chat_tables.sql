-- Create chat_rooms table
CREATE TABLE IF NOT EXISTS public.chat_rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  creator_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  participant_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  UNIQUE(task_id, creator_id, participant_id)
);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID REFERENCES public.chat_rooms(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  read BOOLEAN DEFAULT false NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS chat_rooms_task_id_idx ON public.chat_rooms(task_id);
CREATE INDEX IF NOT EXISTS chat_rooms_creator_id_idx ON public.chat_rooms(creator_id);
CREATE INDEX IF NOT EXISTS chat_rooms_participant_id_idx ON public.chat_rooms(participant_id);
CREATE INDEX IF NOT EXISTS chat_messages_room_id_idx ON public.chat_messages(room_id);
CREATE INDEX IF NOT EXISTS chat_messages_sender_id_idx ON public.chat_messages(sender_id);

-- Set up Row Level Security (RLS)
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for chat_rooms if they don't exist
DO $$
BEGIN
  -- Check if policy exists before creating it
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'chat_rooms' 
    AND policyname = 'Users can view their own chat rooms'
  ) THEN
    CREATE POLICY "Users can view their own chat rooms"
      ON public.chat_rooms
      FOR SELECT
      USING (
        auth.uid() = creator_id OR
        auth.uid() = participant_id
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'chat_rooms' 
    AND policyname = 'Users can create chat rooms'
  ) THEN
    CREATE POLICY "Users can create chat rooms"
      ON public.chat_rooms
      FOR INSERT
      WITH CHECK (
        auth.uid() = creator_id OR
        auth.uid() = participant_id
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'chat_rooms' 
    AND policyname = 'Users can update their own chat rooms'
  ) THEN
    CREATE POLICY "Users can update their own chat rooms"
      ON public.chat_rooms
      FOR UPDATE
      USING (
        auth.uid() = creator_id OR
        auth.uid() = participant_id
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'chat_rooms' 
    AND policyname = 'Users can delete their own chat rooms'
  ) THEN
    CREATE POLICY "Users can delete their own chat rooms"
      ON public.chat_rooms
      FOR DELETE
      USING (
        auth.uid() = creator_id OR
        auth.uid() = participant_id
      );
  END IF;
END
$$;

-- Create policies for chat_messages if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'chat_messages' 
    AND policyname = 'Users can view messages in their chat rooms'
  ) THEN
    CREATE POLICY "Users can view messages in their chat rooms"
      ON public.chat_messages
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.chat_rooms
          WHERE id = room_id
          AND (creator_id = auth.uid() OR participant_id = auth.uid())
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'chat_messages' 
    AND policyname = 'Users can insert messages in their chat rooms'
  ) THEN
    CREATE POLICY "Users can insert messages in their chat rooms"
      ON public.chat_messages
      FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.chat_rooms
          WHERE id = room_id
          AND (creator_id = auth.uid() OR participant_id = auth.uid())
        )
        AND sender_id = auth.uid()
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'chat_messages' 
    AND policyname = 'Users can update their own messages'
  ) THEN
    CREATE POLICY "Users can update their own messages"
      ON public.chat_messages
      FOR UPDATE
      USING (
        sender_id = auth.uid()
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'chat_messages' 
    AND policyname = 'Users can delete their own messages'
  ) THEN
    CREATE POLICY "Users can delete their own messages"
      ON public.chat_messages
      FOR DELETE
      USING (
        sender_id = auth.uid()
      );
  END IF;
END
$$;

-- Create function to update updated_at timestamp if it doesn't exist
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for chat_rooms if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'set_updated_at' 
    AND tgrelid = 'public.chat_rooms'::regclass
  ) THEN
    CREATE TRIGGER set_updated_at
      BEFORE UPDATE ON public.chat_rooms
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_updated_at();
  END IF;
END
$$; 