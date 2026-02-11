import { supabase } from "@/integrations/supabase/client";
import type {
  Database,
  Tables,
  TablesInsert,
  TablesUpdate,
} from "@/integrations/supabase/types";

export type Conversation = Tables<"conversations">;
export type ConversationMessage = Tables<"conversation_messages">;
export type ConversationParticipant = Tables<"conversation_participants">;
export type ConversationType = Database["public"]["Enums"]["conversation_type"];

// Get all conversations for current user
export const getConversations = async (userId: string) => {
  try {
    // Get conversation IDs where user is a participant
    const { data: participations, error: partError } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("participant_id", userId);

    if (partError) {
      console.error("Error fetching participations:", partError);
      throw partError;
    }

    if (!participations || participations.length === 0) {
      return [];
    }

    const conversationIds = participations.map((p) => p.conversation_id);

    // Fetch those conversations
    const { data: conversations, error: convError } = await supabase
      .from("conversations")
      .select("id, title, description, type, created_by, is_active, created_at, updated_at")
      .in("id", conversationIds)
      .order("updated_at", { ascending: false });

    if (convError) {
      console.error("Error fetching conversations:", convError);
      throw convError;
    }

    // Fetch participants and latest message for each
    if (conversations && conversations.length > 0) {
      const conversationsWithData = await Promise.all(
        conversations.map(async (conv) => {
          try {
            const [participants, messages] = await Promise.all([
              getConversationParticipants(conv.id),
              getConversationMessages(conv.id, 1, 0),
            ]);
            return {
              ...conv,
              conversation_participants: participants,
              conversation_messages: messages,
            };
          } catch (mapError) {
            console.error(`Error loading data for conversation ${conv.id}:`, mapError);
            return {
              ...conv,
              conversation_participants: [],
              conversation_messages: [],
            };
          }
        })
      );
      return conversationsWithData;
    }

    return conversations || [];
  } catch (error) {
    console.error("Error fetching conversations:", error);
    throw error;
  }
};

// Get single conversation with all messages
export const getConversation = async (conversationId: string) => {
  try {
    const { data: conversation, error: convError } = await supabase
      .from("conversations")
      .select(
        `
        id,
        title,
        description,
        type,
        created_by,
        is_active,
        created_at,
        updated_at
      `
      )
      .eq("id", conversationId)
      .single();

    if (convError) throw convError;

    // Fetch participants and messages separately
    const [participants, messages] = await Promise.all([
      getConversationParticipants(conversationId),
      getConversationMessages(conversationId, 100, 0),
    ]);

    return {
      ...conversation,
      conversation_participants: participants,
      conversation_messages: messages,
    };
  } catch (error) {
    console.error("Error fetching conversation:", error);
    throw error;
  }
};

// Create new conversation
export const createConversation = async (
  input: TablesInsert<"conversations">
) => {
  try {
    const { data, error } = await supabase
      .from("conversations")
      .insert(input)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error creating conversation:", error);
    throw error;
  }
};

// Update conversation
export const updateConversation = async (
  conversationId: string,
  input: TablesUpdate<"conversations">
) => {
  try {
    const { data, error } = await supabase
      .from("conversations")
      .update(input)
      .eq("id", conversationId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error updating conversation:", error);
    throw error;
  }
};

// Add participant to conversation
export const addParticipant = async (
  conversationId: string,
  userId: string
) => {
  try {
    const { data, error } = await supabase
      .from("conversation_participants")
      .insert({
        conversation_id: conversationId,
        participant_id: userId,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error adding participant:", error);
    throw error;
  }
};

// Remove participant from conversation
export const removeParticipant = async (
  conversationId: string,
  userId: string
) => {
  try {
    const { error } = await supabase
      .from("conversation_participants")
      .delete()
      .eq("conversation_id", conversationId)
      .eq("participant_id", userId);

    if (error) throw error;
  } catch (error) {
    console.error("Error removing participant:", error);
    throw error;
  }
};

// Get conversation messages (paginated)
export const getConversationMessages = async (
  conversationId: string,
  limit: number = 50,
  offset: number = 0
) => {
  try {
    const { data: messages, error } = await supabase
      .from("conversation_messages")
      .select("id, conversation_id, sender_id, message, attachment_url, is_edited, edited_at, created_at, updated_at")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Error fetching messages:", error);
      throw error;
    }

    if (!messages || messages.length === 0) {
      return [];
    }

    // Fetch user profiles for sender IDs
    const senderIds = [...new Set(messages.map((m) => m.sender_id))];
    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, avatar_url")
      .in("id", senderIds);

    if (profileError) {
      console.error("Error fetching profiles:", profileError);
      // Continue without profiles
    }

    const profileMap = profiles?.reduce((acc, p) => {
      acc[p.id] = p;
      return acc;
    }, {} as Record<string, any>) || {};

    return messages.map((msg) => ({
      ...msg,
      profiles: profileMap[msg.sender_id] || null,
    }));
  } catch (error) {
    console.error("Error fetching messages:", error);
    throw error;
  }
};

// Send message to conversation
export const sendMessage = async (
  input: TablesInsert<"conversation_messages">
) => {
  try {
    const { data, error } = await supabase
      .from("conversation_messages")
      .insert(input)
      .select()
      .single();

    if (error) throw error;

    // Fetch sender profile
    if (data && data.sender_id) {
      const { data: senderProfile } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, avatar_url")
        .eq("id", data.sender_id)
        .single();

      return {
        ...data,
        profiles: senderProfile,
      };
    }

    return data;
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
};

// Update message
export const updateMessage = async (
  messageId: string,
  input: TablesUpdate<"conversation_messages">
) => {
  try {
    const { data, error } = await supabase
      .from("conversation_messages")
      .update(input)
      .eq("id", messageId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error updating message:", error);
    throw error;
  }
};

// Delete message
export const deleteMessage = async (messageId: string) => {
  try {
    const { error } = await supabase
      .from("conversation_messages")
      .delete()
      .eq("id", messageId);

    if (error) throw error;
  } catch (error) {
    console.error("Error deleting message:", error);
    throw error;
  }
};

// Update last read timestamp
export const updateLastRead = async (
  conversationId: string,
  userId: string
) => {
  try {
    const { error } = await supabase
      .from("conversation_participants")
      .update({ last_read_at: new Date().toISOString() })
      .eq("conversation_id", conversationId)
      .eq("participant_id", userId);

    if (error) throw error;
  } catch (error) {
    console.error("Error updating last read:", error);
    throw error;
  }
};

// Get conversation participants
export const getConversationParticipants = async (
  conversationId: string
) => {
  try {
    const { data: participants, error } = await supabase
      .from("conversation_participants")
      .select("id, conversation_id, participant_id, joined_at, last_read_at, created_at")
      .eq("conversation_id", conversationId);

    if (error) {
      console.error("Error fetching participants:", error);
      throw error;
    }

    if (!participants || participants.length === 0) {
      return [];
    }

    // Fetch user profiles for participants
    const participantIds = participants.map((p) => p.participant_id);
    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, email, avatar_url")
      .in("id", participantIds);

    if (profileError) {
      console.error("Error fetching participant profiles:", profileError);
      // Continue without profiles
    }

    const profileMap = profiles?.reduce((acc, p) => {
      acc[p.id] = p;
      return acc;
    }, {} as Record<string, any>) || {};

    return participants.map((participant) => ({
      ...participant,
      profiles: profileMap[participant.participant_id] || null,
    }));
  } catch (error) {
    console.error("Error fetching participants:", error);
    throw error;
  }
};

// Search conversations by title or description
export const searchConversations = async (
  query: string,
  userId: string
) => {
  try {
    // Get conversation IDs where user is a participant
    const { data: participantConvs, error: partError } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("participant_id", userId);

    if (partError) {
      console.error("Error fetching user conversations:", partError);
      throw partError;
    }

    if (!participantConvs || participantConvs.length === 0) {
      return [];
    }

    const convIds = participantConvs.map((p) => p.conversation_id);

    // Search within those conversations
    const { data, error } = await supabase
      .from("conversations")
      .select("id, title, description, type, created_by, created_at, updated_at")
      .in("id", convIds)
      .or(`title.ilike.%${query}%,description.ilike.%${query}%`);

    if (error) {
      console.error("Error searching conversations:", error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error("Error searching conversations:", error);
    throw error;
  }
};

// Create a conversation between specific users
export const createDirectConversation = async (
  currentUserId: string,
  otherUserId: string,
  type: ConversationType
) => {
  try {
    // Check if conversation already exists
    const { data: conversationIds } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("participant_id", currentUserId);

    if (conversationIds && conversationIds.length > 0) {
      const convIds = conversationIds.map((c) => c.conversation_id);

      // Get conversations of the current user with the specified type
      const { data: existingConvs } = await supabase
        .from("conversations")
        .select("id")
        .in("id", convIds)
        .eq("type", type);

      if (existingConvs && existingConvs.length > 0) {
        // Check which of these conversations also has the other user
        for (const conv of existingConvs) {
          const { data: otherUserParticipant } = await supabase
            .from("conversation_participants")
            .select("id")
            .eq("conversation_id", conv.id)
            .eq("participant_id", otherUserId)
            .single();

          if (otherUserParticipant) {
            // Conversation exists with both users
            return await getConversation(conv.id);
          }
        }
      }
    }

    // Create new conversation
    const newConv = await createConversation({
      title: `Conversation - ${type}`,
      type,
      created_by: currentUserId,
    });

    // Add both participants
    await addParticipant(newConv.id, currentUserId);
    await addParticipant(newConv.id, otherUserId);

    return newConv;
  } catch (error) {
    console.error("Error creating direct conversation:", error);
    throw error;
  }
};

// Realtime subscription for messages
export const subscribeToMessages = (
  conversationId: string,
  callback: (message: any) => void
) => {
  const subscription = supabase
    .channel(`messages:${conversationId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "conversation_messages",
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        callback(payload.new);
      }
    )
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "conversation_messages",
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        callback(payload.new);
      }
    )
    .on(
      "postgres_changes",
      {
        event: "DELETE",
        schema: "public",
        table: "conversation_messages",
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        callback({ ...payload.old, deleted: true });
      }
    )
    .subscribe();

  return subscription;
};
