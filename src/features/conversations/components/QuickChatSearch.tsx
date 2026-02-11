import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import {
  getConversations,
  createDirectConversation,
  type Conversation,
} from "../services/conversationService";
import { Search, X } from "lucide-react";

interface QuickChatSearchProps {
  onStartChat: (conversationId: string) => void;
  currentConversations: Conversation[];
  onConversationCreated?: (conversationId: string) => void;
}

export function QuickChatSearch({
  onStartChat,
  currentConversations,
  onConversationCreated,
}: QuickChatSearchProps) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Search for users by name
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const searchUsers = async () => {
      try {
        setLoading(true);
        const query = searchQuery.toLowerCase();

        const { data: profiles, error } = await supabase
          .from("profiles")
          .select("id, first_name, last_name, email, avatar_url")
          .neq("id", user?.id)
          .or(
            `first_name.ilike.%${query}%,last_name.ilike.%${query}%`
          )
          .limit(15);

        if (error) {
          console.error("Search error:", error);
          return;
        }

        // Sort results by name match relevance
        const sorted = (profiles || []).sort((a, b) => {
          const aName = `${a.first_name} ${a.last_name}`.toLowerCase();
          const bName = `${b.first_name} ${b.last_name}`.toLowerCase();
          const aStartsWithQuery = aName.startsWith(query);
          const bStartsWithQuery = bName.startsWith(query);
          
          if (aStartsWithQuery && !bStartsWithQuery) return -1;
          if (!aStartsWithQuery && bStartsWithQuery) return 1;
          return aName.localeCompare(bName);
        });

        setSearchResults(sorted);
      } catch (error) {
        console.error("Error searching users:", error);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(searchUsers, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, user?.id]);

  const handleStartChat = async (selectedUser: any) => {
    if (!user?.id) return;

    try {
      setLoading(true);

      // Check if direct conversation already exists
      const existingConv = currentConversations.find((conv) => {
        if (conv.type !== "group") {
          const convParticipants = (conv as any).participants || [];
          return (
            convParticipants.some(
              (p: any) => p.participant_id === selectedUser.id
            ) &&
            convParticipants.some((p: any) => p.participant_id === user.id)
          );
        }
        return false;
      });

      if (existingConv) {
        // Open existing conversation immediately
        onStartChat(existingConv.id);
      } else {
        // Create new direct conversation
        const newConv = await createDirectConversation(
          user.id,
          selectedUser.id,
          "student_faculty" // Default type, can be customized
        );
        // Notify parent to refresh list and will open this conversation after
        onConversationCreated?.(newConv.id);
        // Still call onStartChat with the new ID - parent will map it after refresh
        setTimeout(() => onStartChat(newConv.id), 500);
      }

      setSearchQuery("");
      setIsSearchOpen(false);
    } catch (error) {
      console.error("Error starting chat:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2 pb-4 border-b border-border">
      <div className="relative">
        <Search className="absolute left-3 top-3.5 w-4 h-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Search by name..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setIsSearchOpen(true);
          }}
          onFocus={() => setIsSearchOpen(true)}
          className="pl-9 h-11 text-sm bg-muted/50 border-border font-medium placeholder:font-normal"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setSearchQuery("");
              setIsSearchOpen(false);
            }}
            className="absolute right-1 top-1 h-9 w-9 hover:bg-muted"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isSearchOpen && searchQuery && (
        <Card className="absolute top-14 left-0 right-0 z-50 border border-border shadow-lg max-h-80 rounded-lg">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-muted-foreground animate-pulse">
                Searching...
              </div>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-muted-foreground">
                No users found matching "{searchQuery}"
              </div>
            </div>
          ) : (
            <ScrollArea className="max-h-80">
              <div className="space-y-1 p-3">
                {searchResults.map((profile) => (
                  <Button
                    key={profile.id}
                    variant="ghost"
                    className="w-full justify-start h-auto py-2.5 px-3 rounded-md hover:bg-muted/80 text-left transition-colors"
                    onClick={() => handleStartChat(profile)}
                    disabled={loading}
                  >
                    <div className="flex items-center gap-3 w-full min-w-0">
                      <Avatar className="h-10 w-10 flex-shrink-0 ring-1 ring-border/50">
                        <AvatarImage src={profile.avatar_url || ""} alt={`${profile.first_name} ${profile.last_name}`} />
                        <AvatarFallback className="text-xs font-semibold bg-primary/10">
                          {profile.first_name[0]?.toUpperCase()}
                          {profile.last_name[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate text-foreground">
                          {profile.first_name} {profile.last_name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {profile.email}
                        </p>
                      </div>
                      <div className="text-xs text-muted-foreground flex-shrink-0">
                        →
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </ScrollArea>
          )}
        </Card>
      )}
    </div>
  );
}
