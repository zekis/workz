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

  const startSession = async (sessionName?: string): Promise<WizardResponse> => {
    try {
      const response = await createSession({
        doctype: "ToDo",
        session_name: sessionName || "New Todo"
      });

      if (response?.success && response.session_id) {
        setSessionId(response.session_id);
        setSessionStatus("active");
        if (response.message) {
          setMessages([{
            role: "assistant",
            content: response.message,
            timestamp: new Date().toISOString()
          }]);
        }
      }

      return response || { success: false, error: "No response received" };
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

      const response = await sendMessage({
        session_id: sessionId,
        message: message
      });

      if (response?.success && response.message) {
        // Add assistant response to conversation
        const assistantMessage: WizardMessage = {
          role: "assistant",
          content: response.message,
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, assistantMessage]);

        // Update session state
        if (response.draft_data) setDraftData(response.draft_data);
        if (response.status) setSessionStatus(response.status);
        if (typeof response.can_finalize === "boolean") setCanFinalize(response.can_finalize);
      }

      return response || { success: false, error: "No response received" };
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
      const response = await finalizeSession({
        session_id: sessionId
      });

      if (response?.success) {
        setSessionStatus("completed");
      }

      return response || { success: false, error: "No response received" };
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
