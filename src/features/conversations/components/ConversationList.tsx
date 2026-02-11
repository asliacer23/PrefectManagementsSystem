import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { QuickChatSearch } from "./QuickChatSearch";
import {
  getConversations,
  searchConversations,
  type Conversation,
  type ConversationType,
} from "../services/conversationService";
import { formatDistanceToNow } from "date-fns";
import { X } from "lucide-react";

interface ConversationListProps {
  onSelectConversation: (conversation: Conversation) => void;
  selectedConversationId?: string;
  onClose?: () => void;
  onConversationCreated?: () => void;
}

export function ConversationList({
  onSelectConversation,
  selectedConversationId,
  onClose,
  onConversationCreated,
}: ConversationListProps) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<ConversationType | "all">("all");

  useEffect(() => {
    if (!user?.id) {
      setConversations([]);
      setLoading(false);
      return;
    }

    const loadConversations = async () => {
      try {
        setLoading(true);
        let results;

        if (searchQuery) {
          results = await searchConversations(searchQuery, user.id);
        } else {
          results = await getConversations(user.id);
        }

        setConversations(Array.isArray(results) ? results : []);
      } catch (error) {
        console.error("Error loading conversations:", error);
        setConversations([]);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(loadConversations, 300);
    return () => clearTimeout(timer);
  }, [user?.id, searchQuery]);

  const filteredConversations = conversations.filter((conv) =>
    filterType === "all" ? true : conv.type === filterType
  );

  const getTypeColor = (type: ConversationType) => {
    const colors = {
      student_faculty: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      student_prefect:
        "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      student_admin:
        "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      group: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
    };
    return colors[type] || colors.group;
  };

  const getOtherParticipants = (conv: any) => {
    if (!conv.participants) return [];
    return conv.participants.filter((p: any) => p.participant_id !== user?.id);
  };

  return (
    <Card className="h-full flex flex-col bg-card border border-border shadow-sm">
      <CardHeader className="pb-3 border-b border-border bg-muted/40">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold">Chats</CardTitle>
            <CardDescription className="text-xs md:text-sm mt-1">
              {filteredConversations.length} chat
              {filteredConversations.length !== 1 ? "s" : ""}
            </CardDescription>
          </div>
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="md:hidden h-8 w-8"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden flex flex-col gap-3 p-4">
        {/* Quick Chat Search */}
        {user?.id && (
          <QuickChatSearch
            onStartChat={(conversationId) => {
              const conv = conversations.find((c) => c.id === conversationId);
              if (conv) {
                onSelectConversation(conv);
                onClose?.();
              }
            }}
            currentConversations={conversations}
            onConversationCreated={onConversationCreated}
          />
        )}

        {/* Filter */}
        <Select
          value={filterType}
          onValueChange={(value) =>
            setFilterType(value as ConversationType | "all")
          }
        >
          <SelectTrigger className="h-10 text-sm bg-muted/50 border-border">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Conversations</SelectItem>
            <SelectItem value="student_faculty">👨‍🎓 Student-Faculty</SelectItem>
            <SelectItem value="student_prefect">👔 Student-Prefect</SelectItem>
            <SelectItem value="student_admin">🛂 Student-Admin</SelectItem>
            <SelectItem value="group">👥 Group</SelectItem>
          </SelectContent>
        </Select>

        {/* Conversations List */}
        {loading ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
            <div className="animate-pulse">Loading chats...</div>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground text-sm gap-2">
            <div className="text-base">
              💬 No chats yet
            </div>
            <div className="text-xs">
              Search someone's name above to start chatting
            </div>
          </div>
        ) : (
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-2">
              {filteredConversations.map((conversation) => {
                const otherParticipants = getOtherParticipants(conversation);
                const displayName =
                  conversation.type === "group"
                    ? conversation.title
                    : otherParticipants.length > 0
                    ? `${otherParticipants[0].profiles?.first_name} ${otherParticipants[0].profiles?.last_name}`
                    : conversation.title;

                const displayEmail =
                  conversation.type === "group"
                    ? conversation.description
                    : otherParticipants.length > 0
                    ? otherParticipants[0].profiles?.email
                    : "";

                return (
                  <Button
                    key={conversation.id}
                    variant={
                      selectedConversationId === conversation.id
                        ? "default"
                        : "ghost"
                    }
                    className="w-full justify-start text-left h-auto py-3 px-3 rounded-lg transition-all duration-200 hover:bg-muted"
                    onClick={() => {
                      onSelectConversation(conversation);
                      onClose?.();
                    }}
                  >
                    <div className="flex items-start gap-3 w-full min-w-0">
                      {/* Avatar */}
                      {conversation.type === "group" ? (
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-muted flex items-center justify-center text-xs font-semibold">
                          👥
                        </div>
                      ) : otherParticipants.length > 0 ? (
                        <Avatar className="h-10 w-10 flex-shrink-0">
                          <AvatarImage
                            src={otherParticipants[0].profiles?.avatar_url || ""}
                          />
                          <AvatarFallback className="text-xs">
                            {otherParticipants[0].profiles
                              ? `${otherParticipants[0].profiles.first_name[0]}${otherParticipants[0].profiles.last_name[0]}`
                              : "U"}
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-muted" />
                      )}

                      <div className="flex-1 min-w-0">
                        {/* Name and Badge */}
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold truncate text-sm leading-tight">
                            {displayName}
                          </span>
                          <Badge
                            className={`text-xs flex-shrink-0 font-medium ${getTypeColor(
                              conversation.type
                            )}`}
                            variant="secondary"
                          >
                            {conversation.type === "group"
                              ? "G"
                              : conversation.type.split("_")[1]?.[0]?.toUpperCase()}
                          </Badge>
                        </div>

                        {/* Email or Description */}
                        {displayEmail && (
                          <p className="text-xs text-muted-foreground truncate mb-1">
                            {displayEmail}
                          </p>
                        )}

                        {/* Last message preview */}
                        {(conversation as any).conversation_messages?.[0] && (
                          <p className="text-xs text-muted-foreground truncate mb-1 line-clamp-1 italic">
                            {(conversation as any).conversation_messages[0].message}
                          </p>
                        )}

                        {/* Timestamp */}
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(
                            new Date(conversation.updated_at),
                            {
                              addSuffix: true,
                            }
                          )}
                        </p>
                      </div>
                    </div>
                  </Button>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
