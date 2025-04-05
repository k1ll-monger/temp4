import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '../components/ui/use-toast';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { ScrollArea } from '../components/ui/scroll-area';
import { Separator } from '../components/ui/separator';
import { Loader2, Send, ArrowLeft, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Database } from '../types/database';

type ChatRoom = Database['public']['Tables']['chat_rooms']['Row'];
type ChatMessage = Database['public']['Tables']['chat_messages']['Row'];

interface ChatRoomWithParticipants extends ChatRoom {
  creator: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
  participant: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
  task?: {
    id: string;
    title: string;
  } | null;
}

interface ChatMessageWithSender extends ChatMessage {
  sender: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
}

export default function Chat() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<{ id: string; username: string } | null>(null);
  const [chatRooms, setChatRooms] = useState<ChatRoomWithParticipants[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoomWithParticipants | null>(null);
  const [messages, setMessages] = useState<ChatMessageWithSender[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [chatRoomsLoading, setChatRoomsLoading] = useState(true);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate('/login');
          return;
        }

        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id, username')
          .eq('id', user.id)
          .single();

        if (userError) throw userError;
        setCurrentUser(userData);
      } catch (error) {
        console.error('Error fetching current user:', error);
        toast({
          title: 'Error',
          description: 'Failed to load user data. Please try again.',
          variant: 'destructive',
        });
      }
    };

    fetchCurrentUser();
  }, [navigate, toast]);

  useEffect(() => {
    const fetchChatRooms = async () => {
      if (!currentUser) return;

      try {
        setChatRoomsLoading(true);
        const { data: rooms, error: roomsError } = await supabase
          .from('chat_rooms')
          .select('*')
          .or(`creator_id.eq.${currentUser.id},participant_id.eq.${currentUser.id}`)
          .order('updated_at', { ascending: false });

        if (roomsError) throw roomsError;
        
        // Fetch user details for each room
        const roomsWithUsers = await Promise.all(
          rooms.map(async (room) => {
            // Fetch creator details
            const { data: creatorData } = await supabase
              .from('users')
              .select('id, username, avatar_url')
              .eq('id', room.creator_id)
              .single();
            
            // Fetch participant details
            const { data: participantData } = await supabase
              .from('users')
              .select('id, username, avatar_url')
              .eq('id', room.participant_id)
              .single();
            
            // Fetch task details if task_id exists
            let taskData = null;
            if (room.task_id) {
              const { data: task } = await supabase
                .from('tasks')
                .select('id, title')
                .eq('id', room.task_id)
                .single();
              taskData = task;
            }
            
            return {
              ...room,
              creator: creatorData,
              participant: participantData,
              task: taskData
            };
          })
        );
        
        setChatRooms(roomsWithUsers);
        
        // If a roomId is provided, select that room
        if (roomId) {
          const room = roomsWithUsers.find(r => r.id === roomId);
          if (room) {
            setSelectedRoom(room);
          }
        }
      } catch (error) {
        console.error('Error fetching chat rooms:', error);
        toast({
          title: 'Error',
          description: 'Failed to load chat rooms. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setChatRoomsLoading(false);
      }
    };

    fetchChatRooms();
  }, [currentUser, roomId, toast]);

  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedRoom) return;

      try {
        setLoading(true);
        const { data: messages, error: messagesError } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('room_id', selectedRoom.id)
          .order('created_at', { ascending: true });

        if (messagesError) throw messagesError;
        
        // Fetch sender details for each message
        const messagesWithSenders = await Promise.all(
          messages.map(async (message) => {
            // Fetch sender details
            const { data: senderData } = await supabase
              .from('users')
              .select('id, username, avatar_url')
              .eq('id', message.sender_id)
              .single();
            
            return {
              ...message,
              sender: senderData
            };
          })
        );
        
        setMessages(messagesWithSenders);
        scrollToBottom();
      } catch (error) {
        console.error('Error fetching messages:', error);
        toast({
          title: 'Error',
          description: 'Failed to load messages. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [selectedRoom, toast]);

  useEffect(() => {
    if (!selectedRoom) return;

    // Subscribe to new messages
    const subscription = supabase
      .channel(`chat_messages:${selectedRoom.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${selectedRoom.id}`,
        },
        async (payload) => {
          // Fetch the complete message with sender info
          const { data: message, error } = await supabase
            .from('chat_messages')
            .select('*')
            .eq('id', payload.new.id)
            .single();
            
          if (!error && message) {
            // Fetch sender details
            const { data: senderData } = await supabase
              .from('users')
              .select('id, username, avatar_url')
              .eq('id', message.sender_id)
              .single();
              
            const messageWithSender = {
              ...message,
              sender: senderData
            };
            
            setMessages(prev => [...prev, messageWithSender]);
            scrollToBottom();
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [selectedRoom]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!selectedRoom || !currentUser || !newMessage.trim()) return;

    try {
      setSending(true);
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          room_id: selectedRoom.id,
          sender_id: currentUser.id,
          message: newMessage.trim(),
        })
        .select()
        .single();

      if (error) throw error;
      
      // Create a message object with the current user as sender
      const newMessageObj = {
        ...data,
        sender: {
          id: currentUser.id,
          username: currentUser.username
        }
      };
      
      // Update the messages state immediately
      setMessages(prev => [...prev, newMessageObj]);
      scrollToBottom();
      
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const selectRoom = (room: ChatRoomWithParticipants) => {
    setSelectedRoom(room);
    navigate(`/chat/${room.id}`);
  };

  const getOtherUser = (room: ChatRoomWithParticipants) => {
    if (!currentUser) return null;
    return room.creator_id === currentUser.id ? room.participant : room.creator;
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  return (
    <div className="container mx-auto py-6 h-[calc(100vh-4rem)]">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 h-full">
        {/* Chat Rooms List */}
        <Card className="md:col-span-1 h-full">
          <CardHeader>
            <CardTitle>Chats</CardTitle>
            <CardDescription>Your conversations</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-12rem)]">
              {chatRoomsLoading ? (
                <div className="flex justify-center items-center h-32">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : chatRooms.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  No chat rooms yet
                </div>
              ) : (
                <div className="divide-y">
                  {chatRooms.map((room) => {
                    const otherUser = getOtherUser(room);
                    if (!otherUser) return null;
                    
                    return (
                      <div
                        key={room.id}
                        className={`p-4 cursor-pointer hover:bg-muted transition-colors ${
                          selectedRoom?.id === room.id ? 'bg-muted' : ''
                        }`}
                        onClick={() => selectRoom(room)}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={otherUser.avatar_url || undefined} />
                            <AvatarFallback>{getInitials(otherUser.username)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{otherUser.username}</div>
                            {room.task && (
                              <div className="text-xs text-muted-foreground truncate">
                                {room.task.title}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chat Messages */}
        <Card className="md:col-span-3 h-full">
          {selectedRoom ? (
            <>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden"
                    onClick={() => navigate('/chat')}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <Avatar>
                    <AvatarImage
                      src={
                        getOtherUser(selectedRoom)?.avatar_url || undefined
                      }
                    />
                    <AvatarFallback>
                      {getInitials(getOtherUser(selectedRoom)?.username || '')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">
                      {getOtherUser(selectedRoom)?.username}
                    </CardTitle>
                    {selectedRoom.task && (
                      <CardDescription>
                        {selectedRoom.task.title}
                      </CardDescription>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[calc(100vh-16rem)]">
                  {loading ? (
                    <div className="flex justify-center items-center h-32">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">
                      No messages yet. Start the conversation!
                    </div>
                  ) : (
                    <div className="p-4 space-y-4">
                      {messages.map((message) => {
                        const isCurrentUser = message.sender_id === currentUser?.id;
                        return (
                          <div
                            key={message.id}
                            className={`flex ${
                              isCurrentUser ? 'justify-end' : 'justify-start'
                            }`}
                          >
                            <div
                              className={`max-w-[70%] rounded-lg p-3 ${
                                isCurrentUser
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted'
                              }`}
                            >
                              <div className="text-sm">{message.message}</div>
                              <div
                                className={`text-xs mt-1 ${
                                  isCurrentUser
                                    ? 'text-primary-foreground/70'
                                    : 'text-muted-foreground'
                                }`}
                              >
                                {formatDistanceToNow(new Date(message.created_at), {
                                  addSuffix: true,
                                })}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
              <CardFooter className="border-t p-4">
                <div className="flex w-full gap-2">
                  <Input
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={sending}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={sending || !newMessage.trim()}
                  >
                    {sending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardFooter>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-4 text-center">
              <User className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No chat selected</h3>
              <p className="text-sm text-muted-foreground">
                Select a chat from the list or start a new conversation
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
