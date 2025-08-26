/**
 * AITodoDialog
 * - Dialog for creating todos using Wizard conversational AI
 * - Provides back-and-forth conversation interface
 */
import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Box,
  CircularProgress,
  Alert,
  IconButton,
  Paper,
  Avatar,
  Chip
} from "@mui/material";
import {
  Close as CloseIcon,
  AutoAwesome as MagicIcon,
  Send as SendIcon,
  Person as PersonIcon,
  SmartToy as BotIcon,
  Check as CheckIcon,
  Description as DocumentIcon
} from "@mui/icons-material";
import { useWizardChat, WizardMessage } from "../../hooks/useWizardChat";
import { DraftPreviewDialog } from "./DraftPreviewDialog";

export interface AITodoDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  currentUser?: string;
  selectedReference?: string | null;
  activeFilter?: string | null;
}

export function AITodoDialog({
  open,
  onClose,
  onSuccess,
  currentUser,
  selectedReference,
  activeFilter
}: AITodoDialogProps) {
  const [userInput, setUserInput] = React.useState("");
  const [sessionError, setSessionError] = React.useState<string | null>(null);
  const [draftPreviewOpen, setDraftPreviewOpen] = React.useState(false);
  const wizard = useWizardChat();
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  React.useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [wizard.messages, wizard.isLoading]);

  // Start session when dialog opens
  React.useEffect(() => {
    if (open && !wizard.sessionId && !wizard.isLoading) {
      console.log("Starting wizard session...");
      setSessionError(null);

      // Build context from current filters and user
      const context = {
        current_user: currentUser,
        selected_reference: selectedReference,
        active_filter: activeFilter,
        reference_context: selectedReference ? `Working on: ${selectedReference}` : null
      };

      wizard.startSession("Todo Creation", context).then(response => {
        console.log("Session start response:", response);
        if (!response.success) {
          setSessionError(response.error || "Failed to start AI session");
        }
      }).catch(err => {
        console.error("Failed to start session:", err);
        setSessionError("AI assistant is not available. Please try the regular todo creation.");
      });
    }
  }, [open, wizard.sessionId, wizard.isLoading, currentUser, selectedReference, activeFilter]);

  const handleSubmit = async () => {
    if (!userInput.trim()) return;

    try {
      await wizard.chat(userInput.trim());
      setUserInput("");
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  const handleFinalize = async () => {
    try {
      const response = await wizard.finalize();
      if (response.success) {
        onSuccess?.();
        // Auto-close after showing success
        setTimeout(() => {
          handleClose();
        }, 2000);
      }
    } catch (err) {
      console.error("Failed to finalize todo:", err);
    }
  };

  const handleClose = () => {
    setUserInput("");
    setSessionError(null);
    setDraftPreviewOpen(false);
    wizard.reset();
    onClose();
  };

  const handleDraftPreview = () => {
    setDraftPreviewOpen(true);
  };

  const handleDraftPreviewClose = () => {
    setDraftPreviewOpen(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const isProcessing = wizard.isLoading;
  const canSubmit = userInput.trim() && !isProcessing && (wizard.isActive || wizard.sessionId);
  const canFinalize = wizard.canFinalize && !isProcessing;

  // Debug logging
  React.useEffect(() => {
    console.log("Wizard state:", {
      sessionId: wizard.sessionId,
      isActive: wizard.isActive,
      isLoading: wizard.isLoading,
      canFinalize: wizard.canFinalize,
      messagesCount: wizard.messages.length
    });
  }, [wizard.sessionId, wizard.isActive, wizard.isLoading, wizard.canFinalize, wizard.messages.length]);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { minHeight: 300 }
      }}
    >
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1, pb: 1 }}>
        <MagicIcon color="primary" />
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          AI Todo Assistant
        </Typography>
        {wizard.canFinalize && (
          <Chip
            icon={<CheckIcon />}
            label="Ready to Create"
            color="success"
            size="small"
          />
        )}
        <IconButton
          aria-label="close"
          onClick={handleClose}
          sx={{ color: "grey.500" }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        {/* Conversation Area */}
        <Box
          sx={{
            height: 400,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden"
          }}
        >
          {/* Messages */}
          <Box
            sx={{
              flex: 1,
              overflowY: "auto",
              p: 2,
              display: "flex",
              flexDirection: "column",
              gap: 2
            }}
          >
            {/* Error State */}
            {sessionError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  {sessionError}
                </Typography>
              </Alert>
            )}

            {wizard.messages.length === 0 && !wizard.isLoading && !sessionError && (
              <Box sx={{ textAlign: "center", py: 4 }}>
                <MagicIcon sx={{ fontSize: 48, color: "text.secondary", mb: 2 }} />
                <Typography variant="body2" color="text.secondary">
                  {wizard.sessionId
                    ? "I'll help you create a todo. Just describe what you need to do!"
                    : "Starting AI assistant... Please wait or try typing your message."
                  }
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                  Example: "Schedule a team meeting for next Friday to discuss the quarterly review"
                </Typography>
              </Box>
            )}

            {wizard.messages.map((message, index) => (
              <MessageBubble
                key={index}
                message={message}
                showDraftIcon={message.role === "assistant" && Boolean(wizard.draftData)}
                onDraftClick={handleDraftPreview}
              />
            ))}

            {/* Loading indicator */}
            {isProcessing && (
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar sx={{ bgcolor: "primary.main" }}>
                  <BotIcon />
                </Avatar>
                <Paper
                  sx={{
                    p: 2,
                    bgcolor: "grey.100",
                    borderRadius: 2,
                    display: "flex",
                    alignItems: "center",
                    gap: 1
                  }}
                >
                  <CircularProgress size={16} />
                  <Typography variant="body2">Thinking...</Typography>
                </Paper>
              </Box>
            )}

            {/* Scroll anchor */}
            <div ref={messagesEndRef} />
          </Box>

          {/* Input Area */}
          <Box sx={{ p: 2, borderTop: 1, borderColor: "divider" }}>
            <Box display="flex" gap={1} alignItems="flex-end">
              <TextField
                fullWidth
                multiline
                maxRows={3}
                placeholder="Type your message..."
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isProcessing || (!wizard.sessionId && !wizard.isLoading)}
                size="small"
              />
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={!canSubmit}
                sx={{ minWidth: 48, height: 40 }}
              >
                <SendIcon />
              </Button>
            </Box>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={handleClose} disabled={isProcessing}>
          Cancel
        </Button>
        {canFinalize && (
          <Button
            variant="contained"
            color="success"
            onClick={handleFinalize}
            disabled={isProcessing}
            startIcon={<CheckIcon />}
          >
            Create Todo
          </Button>
        )}
      </DialogActions>

      {/* Draft Preview Dialog */}
      <DraftPreviewDialog
        open={draftPreviewOpen}
        onClose={handleDraftPreviewClose}
        draftData={wizard.draftData}
        draftPreview={wizard.draftPreview}
        onCreateDraft={handleFinalize}
        isCreating={wizard.isLoading}
      />
    </Dialog>
  );
}

// Message bubble component
function MessageBubble({
  message,
  showDraftIcon = false,
  onDraftClick
}: {
  message: WizardMessage;
  showDraftIcon?: boolean;
  onDraftClick?: () => void;
}) {
  const isUser = message.role === "user";

  return (
    <Box
      display="flex"
      justifyContent={isUser ? "flex-end" : "flex-start"}
      alignItems="flex-start"
      gap={1}
    >
      {!isUser && (
        <Avatar sx={{ bgcolor: "primary.main" }}>
          <BotIcon />
        </Avatar>
      )}

      <Box sx={{ maxWidth: "70%", display: "flex", flexDirection: "column", gap: 1 }}>
        <Paper
          sx={{
            p: 2,
            bgcolor: isUser ? "primary.main" : "grey.100",
            color: isUser ? "primary.contrastText" : "text.primary",
            borderRadius: 2,
            borderTopRightRadius: isUser ? 0.5 : 2,
            borderTopLeftRadius: isUser ? 2 : 0.5
          }}
        >
          <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
            {message.content}
          </Typography>
        </Paper>

        {/* Draft Icon for AI messages when draft is available */}
        {showDraftIcon && !isUser && (
          <Box display="flex" justifyContent="flex-start">
            <IconButton
              size="small"
              onClick={onDraftClick}
              sx={{
                bgcolor: "primary.main",
                color: "white",
                "&:hover": { bgcolor: "primary.dark" },
                width: 32,
                height: 32
              }}
              title="View draft preview"
            >
              <DocumentIcon fontSize="small" />
            </IconButton>
          </Box>
        )}
      </Box>

      {isUser && (
        <Avatar sx={{ bgcolor: "grey.400" }}>
          <PersonIcon />
        </Avatar>
      )}
    </Box>
  );
}
