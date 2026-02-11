import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { MessageInput } from "./MessageInput";
import {
  getConversation,
  getConversationMessages,
  sendMessage,
  updateLastRead,
  subscribeToMessages,
  getConversationParticipants,
  type Conversation,
  type ConversationMessage,
} from "../services/conversationService";
import { formatDistanceToNow, formatDate } from "date-fns";
import { ArrowLeft, Users } from "lucide-react";

interface ConversationDetailProps {
  conversationId: string;
  onBack?: () => void;
}

export function ConversationDetail({
  conversationId,
  onBack,
}: ConversationDetailProps) {
  const { user } = useAuth();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [scrollRef, setScrollRef] = useState<HTMLDivElement | null>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef) {
      scrollRef.scrollTop = scrollRef.scrollHeight;
    }
  }, [messages, scrollRef]);

  // Load conversation details
  useEffect(() => {
    if (!conversationId) return;

    const loadConversation = async () => {
      try {
        setLoading(true);
        const data = await getConversation(conversationId);
        setConversation(data as any);

        // Load messages
        const messagesData = await getConversationMessages(
          conversationId,
          100
        );
        setMessages((messagesData as any)?.reverse?.() || messagesData || []);

        // Load participants
        const participantsData = await getConversationParticipants(conversationId);
        setParticipants((participantsData as any) || []);

        // Update last read
        if (user?.id) {
          try {
            await updateLastRead(conversationId, user.id);
          } catch (err) {
            console.warn("Could not update last read:", err);
          }
        }
      } catch (error) {
        console.error("Error loading conversation:", error);
        setConversation(null);
        setMessages([]);
        setParticipants([]);
      } finally {
        setLoading(false);
      }
    };

    loadConversation();

    // Subscribe to new messages
    if (!user?.id) return;

    let subscription: any;
    try {
      subscription = subscribeToMessages(conversationId, (newMessage) => {
        if ((newMessage as any).deleted) {
          setMessages((msgs) =>
            msgs.filter((m) => m.id !== (newMessage as any).id)
          );
        } else {
          setMessages((msgs) => [...msgs, newMessage]);
        }
      });
    } catch (err) {
      console.warn("Could not subscribe to messages:", err);
    }

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [conversationId, user?.id]);

  const handleSendMessage = async (text: string) => {
    if (!user?.id) return;

    try {
      setSendingMessage(true);
      const newMessage = await sendMessage({
        conversation_id: conversationId,
        sender_id: user.id,
        message: text,
      });
      setMessages((msgs) => [...msgs, newMessage as any]);
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSendingMessage(false);
    }
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      student_faculty:
        "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      student_prefect:
        "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      student_admin:
        "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      group: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
    };
    return colors[type] || colors.group;
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  };

  if (loading) {
    return (
      <Card className="h-full flex flex-col bg-card">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-muted-foreground text-sm">
            Loading conversation...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!conversation) {
    return (
      <Card className="h-full flex flex-col bg-card">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center">
            {onBack && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="mb-4"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            )}
            <div className="text-muted-foreground text-sm">
              Select a conversation to view details
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col bg-card border border-border shadow-sm">
      {/* Header */}
      <CardHeader className="pb-4 border-b border-border bg-muted/40">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {onBack && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onBack}
                className="flex-shrink-0 h-9 w-9 md:hidden"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            <div className="min-w-0 flex-1">
              <CardTitle className="text-base md:text-lg font-semibold truncate">
                {conversation.title}
              </CardTitle>
              {conversation.description && (
                <CardDescription className="text-xs md:text-sm truncate mt-1">
                  {conversation.description}
                </CardDescription>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge className={`font-medium ${getTypeColor(conversation.type)}`}>
              {conversation.type.split("_")[1]?.toUpperCase()}
            </Badge>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1 h-9"
                  title="View participants"
                >
                  <Users className="w-4 h-4" />
                  <span className="text-xs font-medium">{participants.length}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72" align="end">
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm">Participants ({participants.length})</h4>
                  <ScrollArea className="max-h-64">
                    <div className="space-y-2 pr-4">
                      {participants.map((participant) => (
                        <div
                          key={participant.id}
                          className="flex items-center gap-3 p-2 rounded-md hover:bg-muted transition-colors"
                        >
                          <Avatar className="h-8 w-8 flex-shrink-0">
                            <AvatarImage
                              src={participant.profiles?.avatar_url || ""}
                            />
                            <AvatarFallback className="text-xs">
                              {participant.profiles
                                ? `${participant.profiles.first_name[0]}${participant.profiles.last_name[0]}`.toUpperCase()
                                : "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {participant.profiles
                                ? `${participant.profiles.first_name} ${participant.profiles.last_name}`
                                : "Unknown User"}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {participant.profiles?.email || "No email"}
                            </p>
                          </div>
                          {participant.participant_id === user?.id && (
                            <Badge variant="secondary" className="text-xs flex-shrink-0">
                              You
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </CardHeader>

      {/* Messages Area */}
      <CardContent className="flex-1 overflow-hidden flex flex-col gap-4 p-4">
        <ScrollArea
          className="flex-1 border border-border rounded-lg p-4 bg-muted/30"
          ref={setScrollRef}
        >
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-12 text-sm">
                <div className="text-2xl mb-2">💬</div>
                <p>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages.map((message, index) => {
                const isOwn = message.sender_id === user?.id;
                const showDate =
                  index === 0 ||
                  formatDate(
                    new Date(messages[index - 1].created_at),
                    "yyyy-MM-dd"
                  ) !==
                    formatDate(new Date(message.created_at), "yyyy-MM-dd");

                return (
                  <div key={message.id}>
                    {showDate && (
                      <div className="flex items-center justify-center my-3">
                        <div className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full border border-border">
                          {formatDate(new Date(message.created_at), "MMM d, yyyy")}
                        </div>
                      </div>
                    )}

                    <div
                      className={`flex gap-3 ${
                        isOwn ? "flex-row-reverse" : ""
                      }`}
                    >
                      <Avatar className="h-8 w-8 md:h-9 md:w-9 flex-shrink-0">
                        <AvatarImage
                          src={(message as any).profiles?.avatar_url || ""}
                        />
                        <AvatarFallback className="text-xs font-semibold">
                          {(message as any).profiles
                            ? getInitials(
                                (message as any).profiles.first_name,
                                (message as any).profiles.last_name
                              )
                            : "U"}
                        </AvatarFallback>
                      </Avatar>

                      <div
                        className={`flex-1 ${isOwn ? "text-right" : ""}`}
                        style={{ maxWidth: "85%" }}
                      >
                        {!isOwn && (
                          <p className="text-xs font-semibold text-muted-foreground mb-1.5">
                            {(message as any).profiles
                              ? `${(message as any).profiles.first_name} ${
                                  (message as any).profiles.last_name
                                }`
                              : "Unknown User"}
                          </p>
                        )}

                        <div
                          className={`inline-block rounded-lg px-4 py-2.5 text-sm break-words shadow-sm ${
                            isOwn
                              ? "bg-primary text-primary-foreground rounded-br-none"
                              : "bg-muted text-foreground rounded-bl-none border border-border"
                          }`}
                        >
                          <p className="whitespace-pre-wrap leading-relaxed">
                            {message.message}
                          </p>
                          {message.is_edited && (
                            <p className="text-xs opacity-70 mt-1 italic">(edited)</p>
                          )}
                        </div>

                        <p className="text-xs text-muted-foreground mt-1.5 px-1">
                          {formatDistanceToNow(
                            new Date(message.created_at),
                            {
                              addSuffix: true,
                            }
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>

        {/* Message Input */}
        <MessageInput
          onSendMessage={handleSendMessage}
          disabled={sendingMessage}
        />
      </CardContent>
    </Card>
  );
}
