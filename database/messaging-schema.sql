-- Tables pour le système de messagerie Lokali
-- À exécuter après schema.sql principal

-- Table des conversations
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des participants aux conversations
CREATE TABLE IF NOT EXISTS conversation_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_read_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(conversation_id, user_id)
);

-- Table des messages
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    type VARCHAR(20) DEFAULT 'text' CHECK (type IN ('text', 'image', 'file')),
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_conversations_property_id ON conversations(property_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_id ON conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation_id ON conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_read_at ON messages(read_at) WHERE read_at IS NULL;

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour updated_at
CREATE TRIGGER update_conversations_updated_at 
    BEFORE UPDATE ON conversations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at 
    BEFORE UPDATE ON messages 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour mettre à jour updated_at de la conversation quand un message est ajouté
CREATE OR REPLACE FUNCTION update_conversation_on_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversations 
    SET updated_at = NOW() 
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_conversation_on_new_message
    AFTER INSERT ON messages
    FOR EACH ROW EXECUTE FUNCTION update_conversation_on_message();

-- Politiques RLS (Row Level Security)
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Politique pour les conversations : accessible aux participants uniquement
CREATE POLICY "Users can view conversations they participate in" ON conversations
    FOR SELECT USING (
        id IN (
            SELECT conversation_id 
            FROM conversation_participants 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create conversations" ON conversations
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update conversations they participate in" ON conversations
    FOR UPDATE USING (
        id IN (
            SELECT conversation_id 
            FROM conversation_participants 
            WHERE user_id = auth.uid()
        )
    );

-- Politique pour les participants : gestion par les utilisateurs concernés
CREATE POLICY "Users can view conversation participants" ON conversation_participants
    FOR SELECT USING (
        conversation_id IN (
            SELECT conversation_id 
            FROM conversation_participants 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can add participants to conversations they're in" ON conversation_participants
    FOR INSERT WITH CHECK (
        conversation_id IN (
            SELECT conversation_id 
            FROM conversation_participants 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own participation" ON conversation_participants
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can leave conversations" ON conversation_participants
    FOR DELETE USING (user_id = auth.uid());

-- Politique pour les messages : accessible aux participants de la conversation
CREATE POLICY "Users can view messages in their conversations" ON messages
    FOR SELECT USING (
        conversation_id IN (
            SELECT conversation_id 
            FROM conversation_participants 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can send messages to their conversations" ON messages
    FOR INSERT WITH CHECK (
        sender_id = auth.uid() AND
        conversation_id IN (
            SELECT conversation_id 
            FROM conversation_participants 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own messages" ON messages
    FOR UPDATE USING (sender_id = auth.uid());

CREATE POLICY "Users can delete their own messages" ON messages
    FOR DELETE USING (sender_id = auth.uid());

-- Vue pour faciliter les requêtes de conversations avec derniers messages
CREATE OR REPLACE VIEW conversation_summary AS
SELECT 
    c.id,
    c.property_id,
    c.created_at,
    c.updated_at,
    p.title as property_title,
    p.images as property_images,
    COALESCE(
        json_agg(
            json_build_object(
                'user_id', cp.user_id,
                'joined_at', cp.joined_at,
                'last_read_at', cp.last_read_at,
                'name', u.name,
                'email', u.email,
                'avatar_url', u.avatar_url
            )
        ) FILTER (WHERE cp.user_id IS NOT NULL),
        '[]'::json
    ) as participants,
    (
        SELECT json_build_object(
            'id', m.id,
            'sender_id', m.sender_id,
            'content', m.content,
            'type', m.type,
            'read_at', m.read_at,
            'created_at', m.created_at
        )
        FROM messages m
        WHERE m.conversation_id = c.id
        ORDER BY m.created_at DESC
        LIMIT 1
    ) as last_message
FROM conversations c
LEFT JOIN properties p ON c.property_id = p.id
LEFT JOIN conversation_participants cp ON c.id = cp.conversation_id
LEFT JOIN users u ON cp.user_id = u.id
GROUP BY c.id, c.property_id, c.created_at, c.updated_at, p.title, p.images;

-- Fonction pour compter les messages non lus d'un utilisateur
CREATE OR REPLACE FUNCTION get_unread_messages_count(user_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::INTEGER
        FROM messages m
        JOIN conversation_participants cp ON m.conversation_id = cp.conversation_id
        WHERE cp.user_id = user_uuid
        AND m.sender_id != user_uuid
        AND m.read_at IS NULL
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour marquer tous les messages d'une conversation comme lus
CREATE OR REPLACE FUNCTION mark_conversation_as_read(conv_id UUID, user_uuid UUID)
RETURNS VOID AS $$
BEGIN
    -- Marquer les messages comme lus
    UPDATE messages 
    SET read_at = NOW() 
    WHERE conversation_id = conv_id 
    AND sender_id != user_uuid 
    AND read_at IS NULL;
    
    -- Mettre à jour last_read_at du participant
    UPDATE conversation_participants 
    SET last_read_at = NOW() 
    WHERE conversation_id = conv_id 
    AND user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Données de test pour le développement (optionnel)
-- Décommenter pour insérer des données de test

/*
-- Insérer une conversation de test
INSERT INTO conversations (id, property_id) VALUES 
('550e8400-e29b-41d4-a716-446655440001', (SELECT id FROM properties LIMIT 1));

-- Ajouter des participants (remplacer par de vrais IDs utilisateur)
INSERT INTO conversation_participants (conversation_id, user_id) VALUES 
('550e8400-e29b-41d4-a716-446655440001', (SELECT id FROM users WHERE role = 'owner' LIMIT 1)),
('550e8400-e29b-41d4-a716-446655440001', (SELECT id FROM users WHERE role = 'guest' LIMIT 1));

-- Ajouter quelques messages de test
INSERT INTO messages (conversation_id, sender_id, content) VALUES 
('550e8400-e29b-41d4-a716-446655440001', (SELECT id FROM users WHERE role = 'guest' LIMIT 1), 'Bonjour, je suis intéressé par votre propriété.'),
('550e8400-e29b-41d4-a716-446655440001', (SELECT id FROM users WHERE role = 'owner' LIMIT 1), 'Bonjour ! Je serais ravi de vous accueillir. Quelles sont vos dates ?'),
('550e8400-e29b-41d4-a716-446655440001', (SELECT id FROM users WHERE role = 'guest' LIMIT 1), 'Je cherche pour le weekend du 15-17 décembre.');
*/
