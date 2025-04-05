-- Add missing columns to the tasks table
DO $$
BEGIN
    -- Check if assigned_at column exists
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'tasks'
        AND column_name = 'assigned_at'
    ) THEN
        -- Add assigned_at column
        ALTER TABLE tasks
        ADD COLUMN assigned_at TIMESTAMP WITH TIME ZONE;
    END IF;

    -- Check if assigned_to column exists
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'tasks'
        AND column_name = 'assigned_to'
    ) THEN
        -- Add assigned_to column
        ALTER TABLE tasks
        ADD COLUMN assigned_to UUID REFERENCES auth.users(id);
    END IF;

    -- Update existing tasks to have null values for new columns
    UPDATE tasks
    SET assigned_at = NULL,
        assigned_to = NULL
    WHERE assigned_at IS NULL
    OR assigned_to IS NULL;

END $$; 