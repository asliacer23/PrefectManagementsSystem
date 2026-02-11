import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/layout/PageHeader";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConversationList } from "../components/ConversationList";
import { ConversationDetail } from "../components/ConversationDetail";
import { ArrowLeft } from "lucide-react";
import type { Conversation } from "../services/conversationService";

export function ConversationsPage() {
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showListOnMobile, setShowListOnMobile] = useState(true);

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setShowListOnMobile(false);
  };

  const handleBackToList = () => {
    setShowListOnMobile(true);
  };

  const handleConversationCreated = () => {
    // Trigger a refresh of the conversations list
    setRefreshKey((k) => k + 1);
  };

  return (
    <AppLayout>
      <div className="space-y-6 h-full flex flex-col">
        {/* Page Header */}
        <PageHeader
          title="Messaging"
          description="Chat with faculty, prefects, admins, and peers"
        />

        {/* Mobile Navigation */}
        {!showListOnMobile && selectedConversation && (
          <div className="flex items-center gap-2 md:hidden -mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleBackToList}
              className="h-9 gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Chats
            </Button>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 flex-1 overflow-hidden">
          {/* Conversations Sidebar List */}
          <div
            className={`${
              showListOnMobile ? "col-span-1" : "hidden md:block md:col-span-1"
            } overflow-hidden`}
          >
            <ConversationList
              key={`list-${refreshKey}`}
              onSelectConversation={handleSelectConversation}
              selectedConversationId={selectedConversation?.id}
              onClose={handleBackToList}
              onConversationCreated={handleConversationCreated}
            />
          </div>

          {/* Chat Area */}
          <div
            className={`${
              showListOnMobile || !selectedConversation
                ? "hidden md:block"
                : "col-span-1"
            } md:col-span-2 overflow-hidden`}
          >
            {selectedConversation ? (
              <ConversationDetail
                conversationId={selectedConversation.id}
                onBack={handleBackToList}
              />
            ) : (
              <Card className="h-full bg-gradient-to-br from-card to-muted/50 border-dashed flex items-center justify-center">
                <CardContent>
                  <div className="text-center space-y-4">
                    <div className="space-y-1">
                      <h3 className="font-semibold text-lg text-foreground">
                        Start Messaging
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Search for someone's name above to start a chat
                      </p>
                    </div>
                    <div className="text-center text-xs text-muted-foreground">
                      👈 Or select an existing chat
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
