/**
 * useWizardChat
 * - Handles communication with Wizard for conversational todo creation
 * - Provides back-and-forth conversation interface
 */
import { useFrappePostCall } from "frappe-react-sdk";
import { useState } from "react";

export interface WizardMessage {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
}

export interface WizardSession {
  session_id: string;
  doctype: string;
  wizard_name: string;
  status: string;
  draft_data?: any;
  can_finalize?: boolean;
}

export interface WizardResponse {
  success: boolean;
  session_id?: string;
  message?: string;
  draft_data?: any;
  draft_preview?: string;
  status?: string;
  can_finalize?: boolean;
  document_name?: string;
  error?: string;
}

export function useWizardChat() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<WizardMessage[]>([]);
  const [sessionStatus, setSessionStatus] = useState<string>("idle");
  const [draftData, setDraftData] = useState<any>(null);
  const [draftPreview, setDraftPreview] = useState<string | null>(null);
  const [canFinalize, setCanFinalize] = useState(false);

  const { call: createSession, loading: creatingSession } = useFrappePostCall<WizardResponse>(
    "wizardz.react_api.create_wizard_session"
  );

  const { call: sendMessage, loading: sendingMessage } = useFrappePostCall<WizardResponse>(
    "wizardz.react_api.chat"
  );

  const { call: finalizeSession, loading: finalizing } = useFrappePostCall<WizardResponse>(
    "wizardz.react_api.finalize_session"
  );

  const startSession = async (sessionName?: string, context?: any): Promise<WizardResponse> => {
    try {
      const rawResponse = await createSession({
        doctype: "ToDo",
        session_name: sessionName || "New Todo",
        context: context
      });

      // Handle nested response structure from Frappe
      const response = (rawResponse as any)?.message || rawResponse;
      console.log("Processed response:", response);

      if (response && typeof response === 'object' && response.success && response.session_id) {
        setSessionId(response.session_id);
        setSessionStatus("active");

        // Use initial_message if available, otherwise use message
        const initialMessage = response.initial_message || response.message;
        if (initialMessage) {
          setMessages([{
            role: "assistant",
            content: initialMessage,
            timestamp: new Date().toISOString()
          }]);
        }
      }

      return (response && typeof response === 'object') ? response : { success: false, error: "Invalid response format" };
    } catch (err) {
      console.error("Failed to start wizard session:", err);
      return {
        success: false,
        error: err instanceof Error ? err.message : "Failed to start session"
      };
    }
  };

  const chat = async (message: string): Promise<WizardResponse> => {
    if (!sessionId) {
      return { success: false, error: "No active session" };
    }

    try {
      // Add user message to conversation
      const userMessage: WizardMessage = {
        role: "user",
        content: message,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, userMessage]);

      const rawResponse = await sendMessage({
        session_id: sessionId,
        message: message
      });

      // Handle nested response structure from Frappe
      const response = (rawResponse as any)?.message || rawResponse;
      console.log("Chat response:", response);

      if (response && typeof response === 'object' && response.success && response.message) {
        // Add assistant response to conversation
        const assistantMessage: WizardMessage = {
          role: "assistant",
          content: response.message,
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, assistantMessage]);

        // Update session state
        if (response.draft_data) setDraftData(response.draft_data);
        if (response.draft_preview) setDraftPreview(response.draft_preview);
        if (response.status) setSessionStatus(response.status);
        if (typeof response.can_finalize === "boolean") setCanFinalize(response.can_finalize);
      }

      return (response && typeof response === 'object') ? response : { success: false, error: "Invalid response format" };
    } catch (err) {
      console.error("Failed to send message:", err);
      return {
        success: false,
        error: err instanceof Error ? err.message : "Failed to send message"
      };
    }
  };

  const finalize = async (): Promise<WizardResponse> => {
    if (!sessionId) {
      return { success: false, error: "No active session" };
    }

    try {
      const rawResponse = await finalizeSession({
        session_id: sessionId
      });

      // Handle nested response structure from Frappe
      const response = (rawResponse as any)?.message || rawResponse;
      console.log("Finalize response:", response);

      if (response && typeof response === 'object' && response.success) {
        setSessionStatus("completed");
      }

      return (response && typeof response === 'object') ? response : { success: false, error: "Invalid response format" };
    } catch (err) {
      console.error("Failed to finalize session:", err);
      return {
        success: false,
        error: err instanceof Error ? err.message : "Failed to finalize session"
      };
    }
  };

  const reset = () => {
    setSessionId(null);
    setMessages([]);
    setSessionStatus("idle");
    setDraftData(null);
    setDraftPreview(null);
    setCanFinalize(false);
  };

  const isLoading = creatingSession || sendingMessage || finalizing;
  const isActive = sessionStatus === "active";
  const isCompleted = sessionStatus === "completed";

  return {
    // State
    sessionId,
    messages,
    sessionStatus,
    draftData,
    draftPreview,
    canFinalize,
    isLoading,
    isActive,
    isCompleted,

    // Actions
    startSession,
    chat,
    finalize,
    reset
  };
}
