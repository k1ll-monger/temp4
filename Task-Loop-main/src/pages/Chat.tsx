import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import ChatList from '@/components/ChatList';
import ChatBox from '@/components/ChatBox';
import AddUserDialog from '@/components/AddUserDialog';
import ChatRequestCard from '@/components/ChatRequestCard';
import { ChatType, MessageType, FileAttachment } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const mockChats: ChatType[] = [{
  id: 'chat1',
  participantId: 'user2',
  participantName: 'Jane Smith',
  participantImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.0.3',
  lastMessage: 'I will be there at 3 PM',
  lastMessageTime: new Date(Date.now() - 1000 * 60 * 30),
  unreadCount: 2
}, {
  id: 'chat2',
  participantId: 'user3',
  participantName: 'Mike Johnson',
  lastMessage: 'Is the task still available?',
  lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 2),
  unreadCount: 0
}, {
  id: 'chat3',
  participantId: 'user4',
  participantName: 'Sara Williams',
  lastMessage: 'Task completed, please share the code',
  lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 24),
  unreadCount: 1
}];

const mockChatRequests = [
  {
    id: 'req1',
    userId: 'user5',
    username: 'Alex Turner',
    timestamp: new Date(),
    requestorRating: 4.5,
    doerRating: 4.2,
    profileImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3'
  }
];

const mockMessages: Record<string, MessageType[]> = {
  chat1: [{
    id: 'msg1',
    senderId: 'user1',
    senderName: 'You',
    receiverId: 'user2',
    content: 'Hello! Are you available for the task?',
    timestamp: new Date(Date.now() - 1000 * 60 * 60),
    read: true
  }, {
    id: 'msg2',
    senderId: 'user2',
    senderName: 'Jane Smith',
    receiverId: 'user1',
    content: 'Yes, I can help you with that.',
    timestamp: new Date(Date.now() - 1000 * 60 * 45),
    read: true
  }, {
    id: 'msg3',
    senderId: 'user1',
    senderName: 'You',
    receiverId: 'user2',
    content: 'Great! When can you start?',
    timestamp: new Date(Date.now() - 1000 * 60 * 40),
    read: true
  }, {
    id: 'msg4',
    senderId: 'user2',
    senderName: 'Jane Smith',
    receiverId: 'user1',
    content: 'I will be there at 3 PM',
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    read: false
  }, {
    id: 'msg5',
    senderId: 'user2',
    senderName: 'Jane Smith',
    receiverId: 'user1',
    content: 'Is that time okay for you?',
    timestamp: new Date(Date.now() - 1000 * 60 * 25),
    read: false
  }, {
    id: 'msg6',
    senderId: 'user1',
    senderName: 'You',
    receiverId: 'user2',
    content: '',
    timestamp: new Date(Date.now() - 1000 * 60 * 20),
    read: true,
    attachment: {
      id: 'file1',
      name: 'task_requirements.pdf',
      type: 'application/pdf',
      url: 'https://example.com/files/task_requirements.pdf',
      size: 256000 // 256 KB
    }
  }],
  chat2: [{
    id: 'msg6',
    senderId: 'user3',
    senderName: 'Mike Johnson',
    receiverId: 'user1',
    content: 'Hi there, I saw your task about grocery shopping',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3),
    read: true
  }, {
    id: 'msg7',
    senderId: 'user3',
    senderName: 'Mike Johnson',
    receiverId: 'user1',
    content: 'Is the task still available?',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    read: true
  }],
  chat3: [{
    id: 'msg8',
    senderId: 'user4',
    senderName: 'Sara Williams',
    receiverId: 'user1',
    content: 'I completed the house cleaning task',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 25),
    read: true
  }, {
    id: 'msg9',
    senderId: 'user1',
    senderName: 'You',
    receiverId: 'user4',
    content: 'Thank you! I will check it once I get home',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
    read: true
  }, {
    id: 'msg10',
    senderId: 'user4',
    senderName: 'Sara Williams',
    receiverId: 'user1',
    content: 'Task completed, please share the code',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    read: false
  }]
};

const Chat = () => {
  const [chats, setChats] = useState<ChatType[]>(mockChats);
  const [selectedChat, setSelectedChat] = useState<ChatType | null>(mockChats[0]);
  const [messages, setMessages] = useState<Record<string, MessageType[]>>(mockMessages);
  const [chatRequests, setChatRequests] = useState(mockChatRequests);
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (location.state?.startChat && location.state?.participant) {
      const participant = location.state.participant;
      
      const existingChat = chats.find(c => c.participantId === participant.id);
      
      if (existingChat) {
        setSelectedChat(existingChat);
      } else {
        const newChat: ChatType = {
          id: `chat${Date.now()}`,
          participantId: participant.id,
          participantName: participant.name,
          participantImage: participant.image || '',
          lastMessage: 'Chat started',
          lastMessageTime: new Date(),
          unreadCount: 0
        };
        
        setChats([newChat, ...chats]);
        setSelectedChat(newChat);
        
        setMessages({
          ...messages,
          [newChat.id]: []
        });
        
        toast({
          title: "New Chat Started",
          description: `You can now chat with ${participant.name}`
        });
      }
      
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, chats, messages, toast, navigate, location.pathname]);

  const handleChatSelect = (chat: ChatType) => {
    if (chat) {
      const updatedChats = chats.map(c => c.id === chat.id ? {
        ...c,
        unreadCount: 0
      } : c);
      setChats(updatedChats);
      if (messages[chat.id]) {
        const updatedMessages = {
          ...messages,
          [chat.id]: messages[chat.id].map(msg => msg.senderId !== 'user1' ? {
            ...msg,
            read: true
          } : msg)
        };
        setMessages(updatedMessages);
      }
    }
    setSelectedChat(chat);
  };

  const handleSendMessage = (content: string, attachment?: FileAttachment) => {
    if (!selectedChat || (!content.trim() && !attachment)) return;
    const newMessage: MessageType = {
      id: `msg${Date.now()}`,
      senderId: 'user1',
      senderName: 'You',
      receiverId: selectedChat.participantId,
      content,
      timestamp: new Date(),
      read: true,
      attachment: attachment
    };

    const updatedMessages = {
      ...messages,
      [selectedChat.id]: [...(messages[selectedChat.id] || []), newMessage]
    };

    const lastMessageText = attachment ? attachment.name : content;
    const updatedChats = chats.map(chat => chat.id === selectedChat.id ? {
      ...chat,
      lastMessage: attachment ? `📎 ${lastMessageText}` : lastMessageText,
      lastMessageTime: new Date()
    } : chat);
    setMessages(updatedMessages);
    setChats(updatedChats);
  };

  const handleSendChatRequest = (username: string) => {
    toast({
      title: "Chat request sent",
      description: `Your chat request has been sent to ${username}`,
    });
    setIsAddUserDialogOpen(false);
  };

  const handleAcceptRequest = (requestId: string) => {
    const request = chatRequests.find(req => req.id === requestId);
    if (!request) return;

    const newChat: ChatType = {
      id: `chat${Date.now()}`,
      participantId: request.userId,
      participantName: request.username,
      participantImage: request.profileImage,
      lastMessage: 'Chat started',
      lastMessageTime: new Date(),
      unreadCount: 0
    };

    setChats([newChat, ...chats]);
    setChatRequests(chatRequests.filter(req => req.id !== requestId));
    setSelectedChat(newChat);

    toast({
      title: "Chat request accepted",
      description: `You can now chat with ${request.username}`,
    });
  };

  const handleRejectRequest = (requestId: string) => {
    setChatRequests(chatRequests.filter(req => req.id !== requestId));
    
    toast({
      title: "Chat request rejected",
      description: "The chat request has been rejected",
    });
  };

  return (
    <Layout requireAuth>
      <div className="container mx-auto h-[calc(100vh-5rem)] flex">
        <div className="w-full md:w-[30%] border-r">
          <ChatList 
            chats={chats} 
            selectedChatId={selectedChat?.id} 
            onSelectChat={handleChatSelect}
            onAddUser={() => setIsAddUserDialogOpen(true)} 
          />
        </div>
        <div className="hidden md:block md:w-[70%]">
          {selectedChat ? (
            <ChatBox 
              chat={selectedChat} 
              messages={messages[selectedChat.id] || []} 
              onSendMessage={handleSendMessage} 
            />
          ) : (
            <div className="h-full flex items-center justify-center flex-col p-4">
              <p className="text-muted-foreground mb-4">Select a chat to start messaging</p>
              
              {chatRequests.length > 0 && (
                <div className="w-full max-w-md">
                  <h3 className="font-medium mb-3">Chat Requests</h3>
                  {chatRequests.map((request) => (
                    <ChatRequestCard
                      key={request.id}
                      username={request.username}
                      image={request.profileImage}
                      requestorRating={request.requestorRating}
                      doerRating={request.doerRating}
                      timestamp={request.timestamp}
                      onAccept={() => handleAcceptRequest(request.id)}
                      onReject={() => handleRejectRequest(request.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <AddUserDialog
        open={isAddUserDialogOpen}
        onOpenChange={setIsAddUserDialogOpen}
        onSendRequest={handleSendChatRequest}
      />
    </Layout>
  );
};

export default Chat;
