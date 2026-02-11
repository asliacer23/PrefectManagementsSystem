import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlusIcon } from "lucide-react";
import {
  createConversation,
  addParticipant,
  type ConversationType,
} from "../services/conversationService";
import { supabase } from "@/integrations/supabase/client";

interface CreateConversationProps {
  onConversationCreated?: (conversationId: string) => void;
}

export function CreateConversation({
  onConversationCreated,
}: CreateConversationProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<ConversationType>("group");
  const [selectedUser, setSelectedUser] = useState("");
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadAvailableUsers();
    }
  }, [open]);

  const loadAvailableUsers = async () => {
    try {
      const { data } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, email")
        .neq("id", user?.id)
        .limit(50);
      setAvailableUsers(data || []);
    } catch (error) {
      console.error("Error loading users:", error);
    }
  };

  const handleCreate = async () => {
    if (!user?.id || !title.trim()) return;

    try {
      setLoading(true);

      // Create conversation
      const conversation = await createConversation({
        title: title.trim(),
        description: description.trim() || null,
        type,
        created_by: user.id,
      });

      // Add creator as participant
      await addParticipant(conversation.id, user.id);

      // Add selected user if it's a direct conversation
      if (selectedUser && type !== "group") {
        await addParticipant(conversation.id, selectedUser);
      }

      // Reset form
      setTitle("");
      setDescription("");
      setType("group");
      setSelectedUser("");
      setOpen(false);

      onConversationCreated?.(conversation.id);
    } catch (error) {
      console.error("Error creating conversation:", error);
    } finally {
      setLoading(false);
    }
  };

  const isDirectConversation = ["student_faculty", "student_prefect", "student_admin"].includes(type);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2 h-10 font-medium shadow-sm">
          <PlusIcon className="w-4 h-4" />
          <span className="hidden sm:inline">New Chat</span>
          <span className="sm:hidden">Chat</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-md md:max-w-lg max-h-[90vh] overflow-y-auto shadow-lg border border-border">
        <DialogHeader className="space-y-3 pb-4">
          <DialogTitle className="text-xl font-semibold">Start New Conversation</DialogTitle>
          <DialogDescription className="text-sm">
            Create a new conversation with faculty, prefect, admin, or group
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-250px)] pr-4">
          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-medium">
                Conversation Title *
              </Label>
              <Input
                id="title"
                placeholder="e.g., Course Feedback, Project Discussion"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={loading}
                className="h-10 text-sm border-border bg-muted/30"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">
                Description
              </Label>
              <Textarea
                id="description"
                placeholder="Add a description for this conversation (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={loading}
                className="min-h-[90px] text-sm resize-none border-border bg-muted/30"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type" className="text-sm font-medium">
                Conversation Type *
              </Label>
              <Select value={type} onValueChange={(value) => setType(value as ConversationType)}>
                <SelectTrigger className="h-10 text-sm border-border bg-muted/30">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student_faculty">
                    👨‍🎓 Student - Faculty
                  </SelectItem>
                  <SelectItem value="student_prefect">
                    👔 Student - Prefect
                  </SelectItem>
                  <SelectItem value="student_admin">👤 Student - Admin</SelectItem>
                  <SelectItem value="group">👥 Group</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isDirectConversation && (
              <div className="space-y-3 p-3 bg-muted/30 rounded-lg border border-border">
                <div>
                  <Label htmlFor="user" className="text-sm font-medium">
                    Select Recipient *
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Choose who you want to chat with
                  </p>
                </div>
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger className="h-10 text-sm border-border bg-background">
                    <SelectValue placeholder="Choose a person to talk to" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableUsers.length === 0 ? (
                      <SelectItem disabled value="">
                        No users available
                      </SelectItem>
                    ) : (
                      availableUsers.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          <div className="flex flex-col gap-0.5">
                            <span className="font-medium">
                              {user.first_name} {user.last_name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {user.email}
                            </span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                
                {selectedUser && (
                  <div className="mt-2 p-2 bg-background rounded border border-border">
                    {availableUsers.find((u) => u.id === selectedUser) && (
                      <div className="text-sm">
                        <p className="font-medium">
                          ✓ {availableUsers.find((u) => u.id === selectedUser)?.first_name}{" "}
                          {availableUsers.find((u) => u.id === selectedUser)?.last_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {availableUsers.find((u) => u.id === selectedUser)?.email}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <Button
              onClick={handleCreate}
              disabled={
                loading || !title.trim() || (isDirectConversation && !selectedUser)
              }
              className="w-full h-10 text-sm font-medium"
            >
              {loading ? (
                <>
                  <span className="animate-spin mr-2">⌛</span>
                  Creating...
                </>
              ) : (
                "Create Conversation"
              )}
            </Button>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
