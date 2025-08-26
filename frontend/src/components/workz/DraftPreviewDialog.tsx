/**
 * DraftPreviewDialog
 * - Shows markdown preview of wizard draft data
 * - Allows user to create the document from draft
 */
import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  IconButton,
  Paper,
  Divider
} from "@mui/material";
import {
  Close as CloseIcon,
  Description as DocumentIcon,
  Create as CreateIcon
} from "@mui/icons-material";

export interface DraftPreviewDialogProps {
  open: boolean;
  onClose: () => void;
  draftData?: any;
  draftPreview?: string | null;
  onCreateDraft: () => void;
  isCreating?: boolean;
}

export function DraftPreviewDialog({
  open,
  onClose,
  draftData,
  draftPreview,
  onCreateDraft,
  isCreating = false
}: DraftPreviewDialogProps) {

  const renderDraftContent = () => {
    if (draftPreview) {
      // If we have markdown preview, render it
      return (
        <Box sx={{ whiteSpace: "pre-wrap", fontFamily: "monospace" }}>
          {draftPreview}
        </Box>
      );
    }

    if (draftData) {
      // If we have draft data but no preview, format it nicely
      return (
        <Box>
          {Object.entries(draftData).map(([key, value]) => (
            <Box key={key} sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 600 }}>
                {key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ')}:
              </Typography>
              <Paper sx={{ p: 2, mt: 1, bgcolor: "grey.50" }}>
                <Typography variant="body2">
                  {typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
                </Typography>
              </Paper>
            </Box>
          ))}
        </Box>
      );
    }

    return (
      <Typography variant="body2" color="text.secondary">
        No draft content available
      </Typography>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: 400 }
      }}
    >
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1, pb: 1 }}>
        <DocumentIcon color="primary" />
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Draft Preview
        </Typography>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ color: "grey.500" }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ py: 3 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Review the draft content below. Click "Create Todo" to finalize and create the document.
        </Typography>

        <Paper 
          variant="outlined" 
          sx={{ 
            p: 3, 
            maxHeight: 400, 
            overflow: "auto",
            bgcolor: "background.default"
          }}
        >
          {renderDraftContent()}
        </Paper>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} disabled={isCreating}>
          Close
        </Button>
        <Button
          variant="contained"
          onClick={onCreateDraft}
          disabled={isCreating}
          startIcon={<CreateIcon />}
        >
          {isCreating ? "Creating..." : "Create Todo"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
