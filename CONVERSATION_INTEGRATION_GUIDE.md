# Conversation Feature - Quick Integration Guide

## Step 1: Run the Database Migration

1. Go to Supabase Dashboard
2. Navigate to "SQL Editor"
3. Create a new query and copy the contents of:
   ```
   supabase/migrations/20260211_create_conversations.sql
   ```
4. Execute the query
5. Verify tables are created:
   - `conversations`
   - `conversation_participants`
   - `conversation_messages`

## Step 2: Add to Your App Router

In your main routing file (likely `src/App.tsx`), add:

```typescript
import { ConversationsPage } from "@/features/conversations/pages";

// In your routes:
<Route path="/conversations" element={<ConversationsPage />} />
```

## Step 3: Add Navigation Link

In your navigation component, add:

```typescript
import { Link } from "react-router-dom";

<Link to="/conversations" className="nav-link">
  Conversations
</Link>
```

Or if using NavLink component:

```typescript
import NavLink from "@/components/NavLink";

<NavLink href="/conversations" label="Conversations" icon={<ChatIcon />} />
```

## Step 4: Optional - Quick Start Component

For quick access from other pages:

```typescript
import { createDirectConversation } from "@/features/conversations/services";
import { Button } from "@/components/ui/button";

function StartConversation({ userId, type = "student_faculty" }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleStart = async () => {
    const conversation = await createDirectConversation(
      user.id,
      userId,
      type
    );
    navigate(`/conversations`);
  };

  return (
    <Button onClick={handleStart}>
      Start Conversation
    </Button>
  );
}
```

## Usage Examples

### Show Current User's Conversations

```typescript
import { ConversationList } from "@/features/conversations/components";
import { useAuth } from "@/hooks/useAuth";

function MyConversations() {
  const { user } = useAuth();
  const [selected, setSelected] = useState(null);

  return (
    <ConversationList 
      onSelectConversation={setSelected}
      selectedConversationId={selected?.id}
    />
  );
}
```

### Create New Conversation Programmatically

```typescript
import { createConversation, addParticipant } from "@/features/conversations/services";

async function createStudentFacultyChat(studentId, facultyId) {
  const conv = await createConversation({
    title: `Chat: Student ${studentId}`,
    type: "student_faculty",
    created_by: studentId,
  });

  await addParticipant(conv.id, studentId);
  await addParticipant(conv.id, facultyId);

  return conv.id;
}
```

### Send Message from Another Feature

```typescript
import { sendMessage } from "@/features/conversations/services";

async function notifyUser(conversationId, userId, message) {
  await sendMessage({
    conversation_id: conversationId,
    sender_id: userId,
    message: message,
  });
}
```

## Component Usage

### Standalone Conversation View

```typescript
import { ConversationDetail } from "@/features/conversations/components";

<ConversationDetail conversationId="conversation-uuid" />
```

### Create Conversation Dialog

```typescript
import { CreateConversation } from "@/features/conversations/components";

<CreateConversation 
  onConversationCreated={(id) => console.log("Created:", id)}
/>
```

### Just Message Input

```typescript
import { MessageInput } from "@/features/conversations/components";

<MessageInput 
  onSendMessage={async (msg) => {
    await sendMessage({
      conversation_id: convId,
      sender_id: userId,
      message: msg,
    });
  }}
/>
```

## Data Structure Examples

### Creating a Conversation

```typescript
{
  title: "Discussion: Project Requirements",
  description: "Discussing the new project requirements and timeline",
  type: "student_faculty",
  created_by: "user-uuid"
}
```

### Sending a Message

```typescript
{
  conversation_id: "conv-uuid",
  sender_id: "user-uuid",
  message: "Hello, I have a question about the deadline...",
  attachment_url: null // Optional
}
```

### Getting Conversations

```typescript
const conversations = await getConversations(userId);
// Returns array of conversations with participants and latest message
```

## Troubleshooting

### Issue: "Cannot find module '@/integrations/supabase/client'"
**Solution:** Ensure path aliases are set up correctly in `tsconfig.json`:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

### Issue: RLS policy errors
**Solution:** Ensure user is authenticated. The service checks `auth.uid()` in policies:
```typescript
import { useAuth } from "@/hooks/useAuth";
const { user } = useAuth(); // Must be accessed in authenticated context
```

### Issue: Messages not updating in real-time
**Solution:** Ensure subscription is set up properly:
```typescript
const { data, error } = useEffect(() => {
  const sub = subscribeToMessages(convId, (newMsg) => {
    setMessages(msgs => [...msgs, newMsg]);
  });
  return () => sub.unsubscribe();
}, [convId]);
```

## Performance Tips

1. **Pagination:** Use offset/limit for large message histories
   ```typescript
   const messages = await getConversationMessages(convId, 50, 0);
   ```

2. **Selective Queries:** Don't always fetch full conversation data
   ```typescript
   // Just get list
   const convs = await getConversations(userId);
   
   // Get details only when needed
   const fullConv = await getConversation(convId);
   ```

3. **Debounce Search:** Already built-in, but can adjust timing
   ```typescript
   const [query, setQuery] = useState("");
   // ConversationList handles debouncing internally
   ```

## Security Notes

- ✅ All data is protected by RLS policies
- ✅ Users can only see their conversations
- ✅ Users can only send messages if they're participants
- ✅ Admins can view/manage all conversations
- ✅ No policy vulnerabilities (policies only in types, not enforced here)

## Next Enhancement Ideas

1. **File Uploads** - Extend `attachment_url` to actually store files
2. **Message Search** - Add full-text search in messages
3. **Conversation Pinning** - Pin important conversations
4. **Typing Indicators** - Show when someone is typing
5. **Read Receipts** - Show message read status
6. **Message Reactions** - Add emoji reactions
7. **Conversation Archiving** - Archive old conversations
8. **Bulk Operations** - Delete multiple messages
9. **Export** - Export conversation history
10. **Notifications** - Alert users of new messages

## Support

For issues or questions about the conversation feature, refer to:
- `src/features/conversations/README.md` - Detailed feature documentation
- `conversationService.ts` - Service function signatures and usage
- Component JSDoc comments for component-specific guidance
