# Conversations Feature

A comprehensive communication system for the Prefect Management System that enables direct messaging between students and faculty, prefects, admins, as well as group conversations.

## Overview

The Conversations feature provides a unified platform for all types of communications in the system, regardless of whether it's related to complaints, incidents, or general communication needs.

## Database Schema

### Tables

1. **conversations**
   - Main conversation record
   - Fields: id, title, description, type, created_by, is_active, created_at, updated_at
   - Types: student_faculty, student_prefect, student_admin, group

2. **conversation_participants**
   - Links users to conversations
   - Fields: id, conversation_id, participant_id, joined_at, last_read_at, created_at
   - Tracks when each user joined and last read message timestamp

3. **conversation_messages**
   - Individual messages in conversations
   - Fields: id, conversation_id, sender_id, message, attachment_url, is_edited, edited_at, created_at, updated_at
   - Supports message editing and file attachments

## Components

### ConversationList
Displays all conversations for the current user with filtering and search capabilities.

**Features:**
- List of all user's conversations
- Filter by conversation type
- Search conversations
- Shows last updated time
- Visual type badges

**Props:**
```typescript
interface ConversationListProps {
  onSelectConversation: (conversation: Conversation) => void;
  selectedConversationId?: string;
}
```

### ConversationDetail
Shows a single conversation with all messages and message input capability.

**Features:**
- Full message history
- Real-time message streaming
- Message timestamps
- User avatars
- Message sender indication
- Edited message indicators

**Props:**
```typescript
interface ConversationDetailProps {
  conversationId: string;
}
```

### MessageInput
Component for sending new messages to a conversation.

**Features:**
- Textarea input with multi-line support
- Send button
- Keyboard shortcut (Ctrl+Enter)
- Loading state
- Disabled state handling

**Props:**
```typescript
interface MessageInputProps {
  onSendMessage: (message: string) => Promise<void>;
  disabled?: boolean;
}
```

### CreateConversation
Dialog component for creating new conversations.

**Features:**
- Dialog form for new conversation creation
- Title and description input
- Conversation type selection
- User selection for direct conversations
- Automatic participant addition

**Props:**
```typescript
interface CreateConversationProps {
  onConversationCreated?: (conversationId: string) => void;
}
```

## Services

The `conversationService` module provides the following functions:

### Query Functions
- `getConversations(userId: string)` - Get all conversations for a user
- `getConversation(conversationId: string)` - Get single conversation with all data
- `getConversationMessages(conversationId: string, limit?: number, offset?: number)` - Get paginated messages
- `getConversationParticipants(conversationId: string)` - Get all participants
- `searchConversations(query: string, userId: string)` - Search conversations

### Mutation Functions
- `createConversation(input: TablesInsert<"conversations">)` - Create new conversation
- `updateConversation(conversationId: string, input: TablesUpdate<"conversations">)` - Update conversation
- `addParticipant(conversationId: string, userId: string)` - Add user to conversation
- `removeParticipant(conversationId: string, userId: string)` - Remove user from conversation
- `sendMessage(input: TablesInsert<"conversation_messages">)` - Send new message
- `updateMessage(messageId: string, input: TablesUpdate<"conversation_messages">)` - Edit message
- `deleteMessage(messageId: string)` - Delete message
- `updateLastRead(conversationId: string, userId: string)` - Update last read timestamp

### Utility Functions
- `createDirectConversation(currentUserId: string, otherUserId: string, type: ConversationType)` - Create or get direct conversation
- `subscribeToMessages(conversationId: string, callback: Function)` - Real-time message subscription

## Row Level Security (RLS)

All tables have RLS policies enforcing:
- Users can only view conversations they're part of
- Users can only send messages in conversations they're in
- Users can only edit/delete their own messages
- Admin can manage all conversations and messages

## Usage Example

```typescript
import { ConversationsPage } from "@/features/conversations/pages";
import { ConversationList, ConversationDetail } from "@/features/conversations/components";

function App() {
  const [selectedConversation, setSelectedConversation] = useState(null);

  return (
    <div className="grid grid-cols-3 gap-4">
      <ConversationList onSelectConversation={setSelectedConversation} />
      {selectedConversation && (
        <ConversationDetail conversationId={selectedConversation.id} />
      )}
    </div>
  );
}
```

## Integration Points

### User Query
Messages include related user profile data (first_name, last_name, avatar_url).

### Conversation Types
Four types of conversations supported:
- `student_faculty` - Direct student-faculty communication
- `student_prefect` - Direct student-prefect communication
- `student_admin` - Direct student-admin communication
- `group` - Group conversations with multiple participants

## Real-time Features

The service includes real-time capabilities using Supabase subscriptions:
- New messages appear instantly
- Message edits are reflected in real-time
- Delete operations are synchronized
- Automatic subscription/unsubscription handling

## Performance Optimizations

- Indexed columns for fast queries:
  - conversations.created_by
  - conversations.is_active
  - conversation_participants.conversation_id & participant_id
  - conversation_messages.conversation_id & sender_id & created_at

- Message pagination support (default 50 messages per page)
- Debounced search queries
- Efficient filtering and sorting

## Future Enhancements

- File/image attachments
- Message reactions/emojis
- Read receipts
- Typing indicators
- Message pinning
- Conversation archiving
- Message bulk operations
