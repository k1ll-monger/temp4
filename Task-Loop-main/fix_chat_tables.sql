-- Check if users table exists, if not create it
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create chat_rooms table if it doesn't exist
CREATE TABLE IF NOT EXISTS chat_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    participant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    UNIQUE(task_id, creator_id, participant_id)
);

-- Create chat_messages table if it doesn't exist
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    read BOOLEAN DEFAULT false
);

-- Create indexes if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'chat_rooms_task_id_idx') THEN
        CREATE INDEX chat_rooms_task_id_idx ON chat_rooms(task_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'chat_rooms_creator_id_idx') THEN
        CREATE INDEX chat_rooms_creator_id_idx ON chat_rooms(creator_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'chat_rooms_participant_id_idx') THEN
        CREATE INDEX chat_rooms_participant_id_idx ON chat_rooms(participant_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'chat_messages_room_id_idx') THEN
        CREATE INDEX chat_messages_room_id_idx ON chat_messages(room_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'chat_messages_sender_id_idx') THEN
        CREATE INDEX chat_messages_sender_id_idx ON chat_messages(sender_id);
    END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policies for users if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Users can view all users') THEN
        CREATE POLICY "Users can view all users"
            ON users FOR SELECT
            USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Users can update their own profile') THEN
        CREATE POLICY "Users can update their own profile"
            ON users FOR UPDATE
            USING (auth.uid() = id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Users can insert their own profile') THEN
        CREATE POLICY "Users can insert their own profile"
            ON users FOR INSERT
            WITH CHECK (auth.uid() = id);
    END IF;
END $$;

-- Create policies for chat_rooms if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'chat_rooms' AND policyname = 'Users can view their own chat rooms') THEN
        CREATE POLICY "Users can view their own chat rooms"
            ON chat_rooms FOR SELECT
            USING (auth.uid() = creator_id OR auth.uid() = participant_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'chat_rooms' AND policyname = 'Users can create chat rooms') THEN
        CREATE POLICY "Users can create chat rooms"
            ON chat_rooms FOR INSERT
            WITH CHECK (auth.uid() = creator_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'chat_rooms' AND policyname = 'Users can update their own chat rooms') THEN
        CREATE POLICY "Users can update their own chat rooms"
            ON chat_rooms FOR UPDATE
            USING (auth.uid() = creator_id OR auth.uid() = participant_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'chat_rooms' AND policyname = 'Users can delete their own chat rooms') THEN
        CREATE POLICY "Users can delete their own chat rooms"
            ON chat_rooms FOR DELETE
            USING (auth.uid() = creator_id OR auth.uid() = participant_id);
    END IF;
END $$;

-- Create policies for chat_messages if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'chat_messages' AND policyname = 'Users can view messages in their chat rooms') THEN
        CREATE POLICY "Users can view messages in their chat rooms"
            ON chat_messages FOR SELECT
            USING (
                EXISTS (
                    SELECT 1 FROM chat_rooms
                    WHERE chat_rooms.id = chat_messages.room_id
                    AND (chat_rooms.creator_id = auth.uid() OR chat_rooms.participant_id = auth.uid())
                )
            );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'chat_messages' AND policyname = 'Users can insert messages in their chat rooms') THEN
        CREATE POLICY "Users can insert messages in their chat rooms"
            ON chat_messages FOR INSERT
            WITH CHECK (
                EXISTS (
                    SELECT 1 FROM chat_rooms
                    WHERE chat_rooms.id = chat_messages.room_id
                    AND (chat_rooms.creator_id = auth.uid() OR chat_rooms.participant_id = auth.uid())
                )
                AND auth.uid() = sender_id
            );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'chat_messages' AND policyname = 'Users can update their own messages') THEN
        CREATE POLICY "Users can update their own messages"
            ON chat_messages FOR UPDATE
            USING (auth.uid() = sender_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'chat_messages' AND policyname = 'Users can delete their own messages') THEN
        CREATE POLICY "Users can delete their own messages"
            ON chat_messages FOR DELETE
            USING (auth.uid() = sender_id);
    END IF;
END $$;

-- Create function to update updated_at timestamp if it doesn't exist
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for chat_rooms if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at') THEN
        CREATE TRIGGER set_updated_at
            BEFORE UPDATE ON chat_rooms
            FOR EACH ROW
            EXECUTE FUNCTION handle_updated_at();
    END IF;
END $$;

-- Create trigger for users if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_users_updated_at') THEN
        CREATE TRIGGER set_users_updated_at
            BEFORE UPDATE ON users
            FOR EACH ROW
            EXECUTE FUNCTION handle_updated_at();
    END IF;
END $$; 