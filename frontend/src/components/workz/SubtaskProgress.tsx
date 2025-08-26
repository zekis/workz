/**
 * SubtaskProgress
 * - Displays subtask completion count and progress
 * - Shows under todo subject in table/card views
 * - Only displays if todo has subtasks
 */
import React from "react";
import { Box, Typography, LinearProgress, Chip } from "@mui/material";
import { CheckCircle as CheckCircleIcon } from "@mui/icons-material";
import type { SubtaskCount } from "../../hooks/useSubtaskCounts";

export interface SubtaskProgressProps {
  subtaskCount: SubtaskCount | null;
  variant?: "compact" | "detailed";
  showProgress?: boolean;
}

export function SubtaskProgress({ 
  subtaskCount, 
  variant = "compact",
  showProgress = false 
}: SubtaskProgressProps) {
  // Don't render if no subtasks
  if (!subtaskCount || subtaskCount.total === 0) {
    return null;
  }

  const { total, completed, percentage } = subtaskCount;
  const isCompleted = completed === total;

  if (variant === "compact") {
    return (
      <Box display="flex" alignItems="center" gap={0.5} mt={0.5}>
        <Chip
          icon={<CheckCircleIcon />}
          label={`${completed}/${total} subtasks`}
          size="small"
          variant="outlined"
          color={isCompleted ? "success" : "default"}
          sx={{
            height: 20,
            fontSize: "0.75rem",
            "& .MuiChip-icon": {
              fontSize: "0.875rem"
            }
          }}
        />
        {showProgress && (
          <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
            {percentage}%
          </Typography>
        )}
      </Box>
    );
  }

  // Detailed variant with progress bar
  return (
    <Box mt={1}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.5}>
        <Typography variant="caption" color="text.secondary">
          Subtasks: {completed}/{total}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {percentage}%
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={percentage}
        sx={{
          height: 4,
          borderRadius: 2,
          backgroundColor: "grey.200",
          "& .MuiLinearProgress-bar": {
            backgroundColor: isCompleted ? "success.main" : "primary.main"
          }
        }}
      />
    </Box>
  );
}
