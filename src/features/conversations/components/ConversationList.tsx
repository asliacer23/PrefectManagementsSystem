import { useEffect, useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Copy, Filter, MessageSquareMore, MoreHorizontal, Search, X } from "lucide-react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { QuickChatSearch } from "./QuickChatSearch";
import {
  getConversations,
  type Conversation,
  type ConversationType,
} from "../services/conversationService";

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
        const results = await getConversations(user.id);
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
  }, [user?.id]);

  const getTypeColor = (type: ConversationType) => {
    const colors = {
      student_faculty: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      student_prefect: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      student_admin: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      group: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
    };
    return colors[type] || colors.group;
  };

  const getOtherParticipants = (conversation: any) => {
    if (!conversation.conversation_participants) return [];
    return conversation.conversation_participants.filter(
      (participant: any) => participant.participant_id !== user?.id,
    );
  };

  const filteredConversations = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return conversations.filter((conversation: any) => {
      const matchesType = filterType === "all" ? true : conversation.type === filterType;
      const otherParticipants = getOtherParticipants(conversation);
      const participantText = otherParticipants
        .map(
          (participant: any) =>
            `${participant.profiles?.first_name ?? ""} ${participant.profiles?.last_name ?? ""} ${participant.profiles?.email ?? ""}`.trim(),
        )
        .join(" ")
        .toLowerCase();
      const titleText = `${conversation.title ?? ""} ${conversation.description ?? ""}`.toLowerCase();
      const latestMessage = conversation.conversation_messages?.[0]?.message?.toLowerCase() ?? "";
      const matchesSearch =
        normalizedQuery === "" ||
        titleText.includes(normalizedQuery) ||
        participantText.includes(normalizedQuery) ||
        latestMessage.includes(normalizedQuery);

      return matchesType && matchesSearch;
    });
  }, [conversations, filterType, searchQuery]);

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
        {user?.id && (
          <QuickChatSearch
            onStartChat={(conversationId) => {
              const conversation = conversations.find((item) => item.id === conversationId);
              if (conversation) {
                onSelectConversation(conversation);
                onClose?.();
              }
            }}
            currentConversations={conversations}
            onConversationCreated={onConversationCreated}
          />
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search chats, participants, or messages..."
              className="pl-9"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="rounded-full">
                <Filter className="h-4 w-4" />
                Filter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-2xl">
              <DropdownMenuLabel>Conversation Type</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setFilterType("all")}>All Conversations</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterType("student_faculty")}>Student-Faculty</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterType("student_prefect")}>Student-Prefect</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterType("student_admin")}>Student-Admin</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterType("group")}>Group</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  setFilterType("all");
                  setSearchQuery("");
                }}
              >
                Reset Filters
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
            <div className="animate-pulse">Loading chats...</div>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground text-sm gap-2">
            <div className="text-base">No chats yet</div>
            <div className="text-xs">Search someone's name above to start chatting</div>
          </div>
        ) : (
          <ScrollArea className="flex-1 pr-4">
            <div className="rounded-xl border border-border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead>Chat</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Participants</TableHead>
                    <TableHead>Last Message</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredConversations.map((conversation: any) => {
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
                    const participantLabel =
                      conversation.type === "group"
                        ? `${conversation.conversation_participants?.length ?? 0} participants`
                        : otherParticipants.length > 0
                        ? otherParticipants
                            .map((participant: any) =>
                              `${participant.profiles?.first_name ?? ""} ${participant.profiles?.last_name ?? ""}`.trim(),
                            )
                            .join(", ")
                        : "No participants";
                    const latestMessage =
                      conversation.conversation_messages?.[0]?.message ?? "No messages yet";

                    return (
                      <TableRow
                        key={conversation.id}
                        className={selectedConversationId === conversation.id ? "bg-muted/40" : ""}
                      >
                        <TableCell>
                          <button
                            type="button"
                            onClick={() => {
                              onSelectConversation(conversation);
                              onClose?.();
                            }}
                            className="flex w-full items-start gap-3 text-left"
                          >
                            {conversation.type === "group" ? (
                              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-muted flex items-center justify-center text-xs font-semibold">
                                G
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

                            <div className="min-w-0">
                              <p className="font-semibold truncate text-sm leading-tight">
                                {displayName}
                              </p>
                              {displayEmail && (
                                <p className="text-xs text-muted-foreground truncate mt-1">
                                  {displayEmail}
                                </p>
                              )}
                            </div>
                          </button>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`text-xs font-medium ${getTypeColor(conversation.type)}`}
                            variant="secondary"
                          >
                            {conversation.type === "group"
                              ? "Group"
                              : conversation.type.replaceAll("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[180px]">
                          <p className="truncate text-sm">{participantLabel}</p>
                        </TableCell>
                        <TableCell className="max-w-[220px]">
                          <p className="truncate text-sm text-muted-foreground italic">
                            {latestMessage}
                          </p>
                        </TableCell>
                        <TableCell>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(conversation.updated_at), {
                              addSuffix: true,
                            })}
                          </p>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                onSelectConversation(conversation);
                                onClose?.();
                              }}
                            >
                              <MessageSquareMore className="h-4 w-4" />
                              Open
                            </Button>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="icon" className="h-9 w-9">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="rounded-2xl">
                                <DropdownMenuItem
                                  onClick={() => {
                                    onSelectConversation(conversation);
                                    onClose?.();
                                  }}
                                >
                                  View Conversation
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => navigator.clipboard.writeText(displayName)}
                                >
                                  <Copy className="mr-2 h-4 w-4" />
                                  Copy Name
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
