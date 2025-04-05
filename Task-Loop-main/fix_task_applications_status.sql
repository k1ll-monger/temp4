-- This script fixes the status column in the task_applications table
-- It handles both enum types and check constraints

-- First, let's check if we're using an enum type
DO $$
DECLARE
    column_type text;
    enum_type text;
    constraint_name text;
BEGIN
    -- Get the column type
    SELECT data_type INTO column_type
    FROM information_schema.columns
    WHERE table_name = 'task_applications'
    AND column_name = 'status';

    IF column_type = 'USER-DEFINED' THEN
        -- We're using an enum type
        -- Get the enum type name
        SELECT t.typname INTO enum_type
        FROM pg_type t
        JOIN pg_attribute a ON t.oid = a.atttypid
        WHERE a.attrelid = 'task_applications'::regclass
        AND a.attname = 'status';

        -- Create a new enum type with all required values
        EXECUTE 'CREATE TYPE task_application_status_new AS ENUM (''pending'', ''accepted'', ''rejected'', ''cancelled'')';

        -- Create a temporary column with the new type
        ALTER TABLE task_applications ADD COLUMN status_new task_application_status_new;

        -- Copy data to the new column, handling the conversion
        UPDATE task_applications 
        SET status_new = CASE status::text
            WHEN 'pending' THEN 'pending'::task_application_status_new
            WHEN 'accepted' THEN 'accepted'::task_application_status_new
            WHEN 'rejected' THEN 'rejected'::task_application_status_new
            WHEN 'cancelled' THEN 'cancelled'::task_application_status_new
            ELSE 'pending'::task_application_status_new
        END;

        -- Drop the old column
        ALTER TABLE task_applications DROP COLUMN status;

        -- Rename the new column
        ALTER TABLE task_applications RENAME COLUMN status_new TO status;

        -- Drop the old enum type
        EXECUTE 'DROP TYPE ' || enum_type;

    ELSE
        -- We're using a check constraint
        -- Find and drop any existing status check constraints
        FOR constraint_name IN 
            SELECT conname
            FROM pg_constraint
            WHERE conrelid = 'task_applications'::regclass
            AND contype = 'c'
            AND pg_get_constraintdef(oid) LIKE '%status%'
        LOOP
            EXECUTE 'ALTER TABLE task_applications DROP CONSTRAINT ' || constraint_name;
        END LOOP;

        -- Add the new check constraint
        ALTER TABLE task_applications 
        ADD CONSTRAINT task_applications_status_check 
        CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled'));
    END IF;
END $$;

-- If the status column is using an enum type, we need to add the 'cancelled' value
-- This is more complex and might require recreating the enum type
-- The following code is commented out as it's more complex and might need customization
/*
DO $$
DECLARE
    enum_type text;
BEGIN
    -- Get the enum type name
    SELECT pg_type.typname INTO enum_type
    FROM pg_type
    JOIN pg_attribute ON pg_type.oid = pg_attribute.atttypid
    WHERE pg_attribute.attrelid = 'public.task_applications'::regclass
    AND pg_attribute.attname = 'status'
    AND pg_type.typtype = 'e';

    -- If it's an enum type, add the 'cancelled' value
    IF enum_type IS NOT NULL THEN
        EXECUTE 'ALTER TYPE ' || enum_type || ' ADD VALUE IF NOT EXISTS ''cancelled''';
        RAISE NOTICE 'Added ''cancelled'' to enum type: %', enum_type;
    END IF;
END $$;
*/ 