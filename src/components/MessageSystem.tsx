import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Send, 
  MessageCircle, 
  Phone, 
  Video, 
  MoreVertical,
  Search,
  Paperclip,
  Smile,
  Check,
  CheckCheck
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { MessageService, Message, Conversation } from '../services/messageService';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface MessageSystemProps {
  propertyId?: string;
  recipientId?: string;
  className?: string;
}

const MessageSystem: React.FC<MessageSystemProps> = ({
  propertyId,
  recipientId,
  className = ''
}) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadConversations = useCallback(async () => {
    if (!user) return;
    
    try {
      const convs = await MessageService.getUserConversations(user.id);
      setConversations(convs);
      
      // Sélectionner la première conversation si aucune n'est sélectionnée
      if (!selectedConversation && convs.length > 0) {
        setSelectedConversation(convs[0]);
      }
    } catch (error) {
      console.error('Erreur chargement conversations:', error);
    }
  }, [user, selectedConversation]);

  const loadMessages = useCallback(async (conversationId: string) => {
    try {
      const msgs = await MessageService.getConversationMessages(conversationId);
      setMessages(msgs);
      
      // Marquer les messages comme lus
      if (user) {
        await MessageService.markMessagesAsRead(conversationId, user.id);
      }
    } catch (error) {
      console.error('Erreur chargement messages:', error);
    }
  }, [user]);

  const startNewConversation = useCallback(async (otherUserId: string, propertyId: string) => {
    if (!user) return;
    
    try {
      const conversation = await MessageService.createConversation([user.id, otherUserId], propertyId);
      setConversations(prev => [conversation, ...prev]);
      setSelectedConversation(conversation);
    } catch (error) {
      console.error('Erreur création conversation:', error);
    }
  }, [user]);

  // Charger les conversations
  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user, loadConversations]);

  // Charger les messages de la conversation sélectionnée
  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
    }
  }, [selectedConversation, loadMessages]);

  // Auto-scroll vers le bas
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Démarrer une conversation automatiquement si recipientId est fourni
  useEffect(() => {
    if (recipientId && propertyId && user && conversations.length > 0) {
      const existingConversation = conversations.find(conv => 
        conv.participants.some(p => p.id === recipientId)
      );
      
      if (existingConversation) {
        setSelectedConversation(existingConversation);
      } else {
        startNewConversation(recipientId, propertyId);
      }
    }
  }, [recipientId, propertyId, user, conversations, startNewConversation]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !user) return;
    
    setIsLoading(true);
    try {
      const message = await MessageService.sendMessage(
        selectedConversation.id,
        user.id,
        newMessage.trim()
      );
      
      setMessages(prev => [...prev, message]);
      setNewMessage('');
      
      // Mettre à jour la conversation dans la liste
      setConversations(prev => 
        prev.map(conv => 
          conv.id === selectedConversation.id 
            ? { ...conv, lastMessage: message, updatedAt: new Date() }
            : conv
        )
      );
    } catch (error) {
      console.error('Erreur envoi message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatMessageTime = (date: Date) => {
    const now = new Date();
    const messageDate = new Date(date);
    
    if (messageDate.toDateString() === now.toDateString()) {
      return format(messageDate, 'HH:mm');
    } else {
      return format(messageDate, 'dd/MM HH:mm', { locale: fr });
    }
  };

  const getOtherParticipant = (conversation: Conversation) => {
    return conversation.participants.find(p => p.id !== user?.id);
  };

  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery) return true;
    const otherParticipant = getOtherParticipant(conv);
    return otherParticipant?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           conv.property?.title.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (!user) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Connectez-vous pour accéder à vos messages</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`flex h-[600px] border rounded-lg overflow-hidden ${className}`}>
      {/* Liste des conversations */}
      <div className="w-1/3 border-r bg-gray-50">
        <div className="p-4 border-b bg-white">
          <h3 className="font-semibold mb-3">Messages</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Rechercher une conversation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <ScrollArea className="h-[calc(100%-120px)]">
          {filteredConversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <MessageCircle className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">Aucune conversation</p>
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {filteredConversations.map((conversation) => {
                const otherParticipant = getOtherParticipant(conversation);
                const unreadCount = conversation.unreadCount || 0;
                
                return (
                  <div
                    key={conversation.id}
                    onClick={() => setSelectedConversation(conversation)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedConversation?.id === conversation.id
                        ? 'bg-primary/10 border border-primary/20'
                        : 'hover:bg-white'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={otherParticipant?.avatar} />
                        <AvatarFallback>
                          {otherParticipant?.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-sm truncate">
                            {otherParticipant?.name}
                          </p>
                          {conversation.lastMessage && (
                            <span className="text-xs text-gray-500">
                              {formatMessageTime(conversation.lastMessage.createdAt)}
                            </span>
                          )}
                        </div>
                        
                        {conversation.property && (
                          <p className="text-xs text-gray-500 truncate">
                            {conversation.property.title}
                          </p>
                        )}
                        
                        <div className="flex items-center justify-between mt-1">
                          {conversation.lastMessage && (
                            <p className="text-sm text-gray-600 truncate">
                              {conversation.lastMessage.content}
                            </p>
                          )}
                          {unreadCount > 0 && (
                            <Badge variant="default" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                              {unreadCount}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Zone de chat */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* En-tête du chat */}
            <div className="p-4 border-b bg-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={getOtherParticipant(selectedConversation)?.avatar} />
                  <AvatarFallback>
                    {getOtherParticipant(selectedConversation)?.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">
                    {getOtherParticipant(selectedConversation)?.name}
                  </p>
                  {selectedConversation.property && (
                    <p className="text-sm text-gray-500">
                      {selectedConversation.property.title}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm">
                  <Phone className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Video className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => {
                  const isOwn = message.senderId === user?.id;
                  
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg px-4 py-2 ${
                          isOwn
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <div className={`flex items-center gap-1 mt-1 ${
                          isOwn ? 'justify-end' : 'justify-start'
                        }`}>
                          <span className={`text-xs ${
                            isOwn ? 'text-primary-foreground/70' : 'text-gray-500'
                          }`}>
                            {formatMessageTime(message.createdAt)}
                          </span>
                          {isOwn && (
                            <div className="text-primary-foreground/70">
                              {message.readAt ? (
                                <CheckCheck className="h-3 w-3" />
                              ) : (
                                <Check className="h-3 w-3" />
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Zone de saisie */}
            <div className="p-4 border-t bg-white">
              <div className="flex items-end gap-2">
                <Button variant="ghost" size="sm">
                  <Paperclip className="h-4 w-4" />
                </Button>
                <div className="flex-1">
                  <Input
                    placeholder="Tapez votre message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={isLoading}
                  />
                </div>
                <Button variant="ghost" size="sm">
                  <Smile className="h-4 w-4" />
                </Button>
                <Button 
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || isLoading}
                  size="sm"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <MessageCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">Sélectionnez une conversation</p>
              <p className="text-sm text-gray-400">
                Choisissez une conversation pour commencer à discuter
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageSystem;
