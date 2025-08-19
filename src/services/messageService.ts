import { supabase } from '@/lib/supabase';

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: 'text' | 'image' | 'file';
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Conversation {
  id: string;
  participants: Array<{
    id: string;
    name: string;
    email: string;
    avatar?: string;
  }>;
  property?: {
    id: string;
    title: string;
    images: string[];
  };
  lastMessage?: Message;
  unreadCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConversationParticipant {
  conversationId: string;
  userId: string;
  joinedAt: Date;
  lastReadAt?: Date;
}

// Types pour les données brutes de Supabase
interface ConversationData {
  id: string;
  property_id?: string;
  created_at: string;
  updated_at: string;
  conversation_participants?: ConversationParticipantData[];
  properties?: {
    id: string;
    title: string;
    images: string[];
  };
  messages?: MessageData[];
}

interface ConversationParticipantData {
  user_id: string;
  joined_at: string;
  last_read_at?: string;
  users: {
    id: string;
    name: string;
    email: string;
    avatar_url?: string;
  };
}

interface MessageData {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  type: string;
  read_at?: string;
  created_at: string;
  updated_at: string;
}

export class MessageService {
  // Créer une nouvelle conversation
  static async createConversation(
    participantIds: string[],
    propertyId?: string
  ): Promise<Conversation> {
    try {
      // Vérifier si une conversation existe déjà entre ces participants
      const { data: existingConversation } = await supabase
        .from('conversations')
        .select(`
          *,
          conversation_participants!inner(user_id),
          properties(id, title, images)
        `)
        .eq('property_id', propertyId || null);

      if (existingConversation && existingConversation.length > 0) {
        // Vérifier que tous les participants correspondent
        const conversation = existingConversation[0];
        const existingParticipantIds = conversation.conversation_participants.map((p: { user_id: string }) => p.user_id);
        
        if (participantIds.every(id => existingParticipantIds.includes(id))) {
          return this.transformConversation(conversation);
        }
      }

      // Créer une nouvelle conversation
      const { data: conversation, error: conversationError } = await supabase
        .from('conversations')
        .insert({
          property_id: propertyId || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (conversationError) {
        throw new Error(`Erreur création conversation: ${conversationError.message}`);
      }

      // Ajouter les participants
      const participantInserts = participantIds.map(userId => ({
        conversation_id: conversation.id,
        user_id: userId,
        joined_at: new Date().toISOString()
      }));

      const { error: participantsError } = await supabase
        .from('conversation_participants')
        .insert(participantInserts);

      if (participantsError) {
        throw new Error(`Erreur ajout participants: ${participantsError.message}`);
      }

      // Récupérer la conversation complète
      return this.getConversationById(conversation.id);
    } catch (error) {
      console.error('Erreur création conversation:', error);
      throw error;
    }
  }

  // Récupérer une conversation par ID
  static async getConversationById(conversationId: string): Promise<Conversation> {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          conversation_participants(
            user_id,
            joined_at,
            last_read_at,
            users(id, name, email, avatar_url)
          ),
          properties(id, title, images),
          messages(
            id, sender_id, content, type, read_at, created_at
          )
        `)
        .eq('id', conversationId)
        .order('created_at', { foreignTable: 'messages', ascending: false })
        .limit(1, { foreignTable: 'messages' })
        .single();

      if (error) {
        throw new Error(`Erreur récupération conversation: ${error.message}`);
      }

      return this.transformConversation(data);
    } catch (error) {
      console.error('Erreur récupération conversation:', error);
      throw error;
    }
  }

  // Récupérer les conversations d'un utilisateur
  static async getUserConversations(userId: string): Promise<Conversation[]> {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          conversation_participants!inner(
            user_id,
            joined_at,
            last_read_at,
            users(id, name, email, avatar_url)
          ),
          properties(id, title, images),
          messages(
            id, sender_id, content, type, read_at, created_at
          )
        `)
        .eq('conversation_participants.user_id', userId)
        .order('updated_at', { ascending: false })
        .order('created_at', { foreignTable: 'messages', ascending: false })
        .limit(1, { foreignTable: 'messages' });

      if (error) {
        throw new Error(`Erreur récupération conversations: ${error.message}`);
      }

      return data.map(conv => this.transformConversation(conv));
    } catch (error) {
      console.error('Erreur récupération conversations utilisateur:', error);
      throw error;
    }
  }

  // Récupérer les messages d'une conversation
  static async getConversationMessages(
    conversationId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<Message[]> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .range(offset, offset + limit - 1);

      if (error) {
        throw new Error(`Erreur récupération messages: ${error.message}`);
      }

      return data.map(msg => this.transformMessage(msg));
    } catch (error) {
      console.error('Erreur récupération messages:', error);
      throw error;
    }
  }

  // Envoyer un message
  static async sendMessage(
    conversationId: string,
    senderId: string,
    content: string,
    type: 'text' | 'image' | 'file' = 'text'
  ): Promise<Message> {
    try {
      const { data: message, error: messageError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: senderId,
          content,
          type,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (messageError) {
        throw new Error(`Erreur envoi message: ${messageError.message}`);
      }

      // Mettre à jour la conversation
      const { error: updateError } = await supabase
        .from('conversations')
        .update({
          updated_at: new Date().toISOString()
        })
        .eq('id', conversationId);

      if (updateError) {
        console.error('Erreur mise à jour conversation:', updateError);
      }

      return this.transformMessage(message);
    } catch (error) {
      console.error('Erreur envoi message:', error);
      throw error;
    }
  }

  // Marquer les messages comme lus
  static async markMessagesAsRead(conversationId: string, userId: string): Promise<void> {
    try {
      // Marquer tous les messages non lus comme lus
      const { error: messagesError } = await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .neq('sender_id', userId)
        .is('read_at', null);

      if (messagesError) {
        throw new Error(`Erreur marquage messages lus: ${messagesError.message}`);
      }

      // Mettre à jour last_read_at pour le participant
      const { error: participantError } = await supabase
        .from('conversation_participants')
        .update({ last_read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('user_id', userId);

      if (participantError) {
        console.error('Erreur mise à jour last_read_at:', participantError);
      }
    } catch (error) {
      console.error('Erreur marquage messages lus:', error);
      throw error;
    }
  }

  // Supprimer un message
  static async deleteMessage(messageId: string, userId: string): Promise<void> {
    try {
      // Vérifier que l'utilisateur est l'expéditeur
      const { data: message, error: fetchError } = await supabase
        .from('messages')
        .select('sender_id')
        .eq('id', messageId)
        .single();

      if (fetchError) {
        throw new Error(`Erreur récupération message: ${fetchError.message}`);
      }

      if (message.sender_id !== userId) {
        throw new Error('Vous ne pouvez supprimer que vos propres messages');
      }

      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId);

      if (error) {
        throw new Error(`Erreur suppression message: ${error.message}`);
      }
    } catch (error) {
      console.error('Erreur suppression message:', error);
      throw error;
    }
  }

  // Quitter une conversation
  static async leaveConversation(conversationId: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('conversation_participants')
        .delete()
        .eq('conversation_id', conversationId)
        .eq('user_id', userId);

      if (error) {
        throw new Error(`Erreur quitter conversation: ${error.message}`);
      }

      // Vérifier s'il reste des participants
      const { data: remainingParticipants, error: countError } = await supabase
        .from('conversation_participants')
        .select('user_id')
        .eq('conversation_id', conversationId);

      if (countError) {
        console.error('Erreur vérification participants restants:', countError);
        return;
      }

      // Si plus de participants, supprimer la conversation
      if (remainingParticipants.length === 0) {
        await this.deleteConversation(conversationId);
      }
    } catch (error) {
      console.error('Erreur quitter conversation:', error);
      throw error;
    }
  }

  // Supprimer une conversation
  static async deleteConversation(conversationId: string): Promise<void> {
    try {
      // Supprimer d'abord les messages
      const { error: messagesError } = await supabase
        .from('messages')
        .delete()
        .eq('conversation_id', conversationId);

      if (messagesError) {
        console.error('Erreur suppression messages:', messagesError);
      }

      // Supprimer les participants
      const { error: participantsError } = await supabase
        .from('conversation_participants')
        .delete()
        .eq('conversation_id', conversationId);

      if (participantsError) {
        console.error('Erreur suppression participants:', participantsError);
      }

      // Supprimer la conversation
      const { error: conversationError } = await supabase
        .from('conversations')
        .delete()
        .eq('id', conversationId);

      if (conversationError) {
        throw new Error(`Erreur suppression conversation: ${conversationError.message}`);
      }
    } catch (error) {
      console.error('Erreur suppression conversation:', error);
      throw error;
    }
  }

  // Rechercher des conversations
  static async searchConversations(userId: string, query: string): Promise<Conversation[]> {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          conversation_participants!inner(
            user_id,
            users(id, name, email, avatar_url)
          ),
          properties(id, title, images),
          messages(
            id, sender_id, content, type, read_at, created_at
          )
        `)
        .eq('conversation_participants.user_id', userId)
        .or(`properties.title.ilike.%${query}%,conversation_participants.users.name.ilike.%${query}%`)
        .order('updated_at', { ascending: false })
        .limit(1, { foreignTable: 'messages' });

      if (error) {
        throw new Error(`Erreur recherche conversations: ${error.message}`);
      }

      return data.map(conv => this.transformConversation(conv));
    } catch (error) {
      console.error('Erreur recherche conversations:', error);
      throw error;
    }
  }

  // Obtenir le nombre de messages non lus
  static async getUnreadCount(userId: string): Promise<number> {
    try {
      // D'abord récupérer les IDs des conversations de l'utilisateur
      const { data: userConversations, error: convError } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', userId);

      if (convError) {
        throw new Error(`Erreur récupération conversations: ${convError.message}`);
      }

      const conversationIds = userConversations?.map(c => c.conversation_id) || [];

      if (conversationIds.length === 0) {
        return 0;
      }

      const { data, error } = await supabase
        .from('messages')
        .select('id', { count: 'exact' })
        .neq('sender_id', userId)
        .is('read_at', null)
        .in('conversation_id', conversationIds);

      if (error) {
        throw new Error(`Erreur comptage messages non lus: ${error.message}`);
      }

      return data?.length || 0;
    } catch (error) {
      console.error('Erreur comptage messages non lus:', error);
      return 0;
    }
  }

  // Transformer les données de conversation
  private static transformConversation(data: ConversationData): Conversation {
    return {
      id: data.id,
      participants: data.conversation_participants?.map((cp: ConversationParticipantData) => ({
        id: cp.users.id,
        name: cp.users.name,
        email: cp.users.email,
        avatar: cp.users.avatar_url
      })) || [],
      property: data.properties ? {
        id: data.properties.id,
        title: data.properties.title,
        images: data.properties.images || []
      } : undefined,
      lastMessage: data.messages?.[0] ? this.transformMessage(data.messages[0]) : undefined,
      unreadCount: 0, // À calculer séparément si nécessaire
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }

  // Transformer les données de message
  private static transformMessage(data: MessageData): Message {
    return {
      id: data.id,
      conversationId: data.conversation_id,
      senderId: data.sender_id,
      content: data.content,
      type: (data.type as 'text' | 'image' | 'file') || 'text',
      readAt: data.read_at ? new Date(data.read_at) : undefined,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }
}
