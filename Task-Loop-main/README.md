# Task Loop

A task management application built with React, TypeScript, and Supabase.

## Features

- User authentication
- Task creation and management
- Task applications and assignments
- Notifications for task updates
- Profile management

## Setup

1. Clone the repository
2. Install dependencies with `npm install`
3. Create a `.env` file with your Supabase credentials:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Run the development server with `npm run dev`

## Database Setup

### Creating the Notifications Table

The application requires a `notifications` table in your Supabase database. You can create it using the SQL script in `create_notifications_table.sql`:

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy the contents of `create_notifications_table.sql`
4. Run the SQL script

### Adding Required Task Columns

If you see an error about missing columns in the tasks table (like "Could not find the 'assigned_at' column"), you need to add these columns:

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy the contents of `add_task_columns.sql`
4. Run the SQL script

This script will:
1. Add the `assigned_at` column if it doesn't exist
2. Add the `assigned_to` column if it doesn't exist
3. Update existing tasks to have null values for these columns

### Fixing Task Applications Status

If you encounter an error like "violates check constraint task_applications_status_check" when trying to cancel an assignment, you need to fix the status column in the `task_applications` table:

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy the contents of `fix_task_applications_status.sql`
4. Run the SQL script

This script will:
1. Check if the status column is using an enum type or a check constraint
2. If it's an enum type:
   - Create a new enum type with all required values
   - Migrate the data to use the new type
   - Replace the old enum type with the new one
3. If it's using a check constraint:
   - Remove any existing status check constraints
   - Add a new constraint that allows all required statuses

## Chat Functionality Setup

To enable real-time chat functionality between users, you need to set up the chat tables in your Supabase database. Follow these steps:

1. Access your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy the contents of the `create_chat_tables.sql` file
4. Run the SQL script to create the necessary tables and set up Row Level Security (RLS) policies

The script will create:
- `chat_rooms` table: Stores chat room information between users
- `chat_messages` table: Stores individual messages in chat rooms
- Appropriate indexes for better performance
- RLS policies to ensure users can only access their own chat rooms and messages
- A trigger to automatically update the `updated_at` timestamp

### Chat Features

The chat functionality includes:
- Real-time messaging between users
- Chat rooms associated with tasks
- Message history
- Read/unread status
- User avatars and online status
- Mobile-responsive design

### Troubleshooting Chat Issues

If you encounter any issues with the chat functionality:

1. **Missing Chat Tables**
   - Ensure you've run the `create_chat_tables.sql` script
   - Check if the tables exist in your Supabase database
   - Verify that the RLS policies are correctly set up

2. **Real-time Updates Not Working**
   - Check your Supabase project settings
   - Ensure real-time is enabled for the `chat_messages` table
   - Verify your network connection

3. **Permission Issues**
   - Check if users are properly authenticated
   - Verify that the RLS policies are correctly configured
   - Ensure users have the necessary permissions to access chat rooms

## Troubleshooting

### Missing Task Columns

If you see an error like "Could not find the 'assigned_at' column of 'tasks'":

1. Follow the instructions in the "Adding Required Task Columns" section above
2. After running the fix, try the operation again
3. If the issue persists, check the browser console for any specific error messages

### Assignment Cancellation Issues

If you see an error like "violates check constraint task_applications_status_check" when trying to cancel an assignment:

1. Follow the instructions in the "Fixing Task Applications Status" section above
2. After running the fix, try cancelling the assignment again
3. If the issue persists, check the browser console for any specific error messages

### Notifications Not Working

If you see the error "Notifications table does not exist yet", you need to create the notifications table in your Supabase database as described in the "Creating the Notifications Table" section above.

## License

MIT
