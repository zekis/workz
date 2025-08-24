/**
 * ToDoToolbar
 * - Top toolbar with placeholder controls (search, filters, group-by) and bulk actions area
 * - Keep minimal for first slice; no real data wiring yet
 */
import React from "react";
import { Box, Button, Stack, TextField, Typography } from "@mui/material";

export function ToDoToolbar() {
  return (
    <Box display="flex" flexDirection={{ xs: "column", sm: "row" }} gap={2} alignItems={{ sm: "center" }}>
      <Typography variant="h6" component="div" flex={1}>
        Workz ToDos
      </Typography>
      <Stack direction="row" spacing={1} flexWrap="wrap">
        <TextField size="small" placeholder="Search..." aria-label="Search todos" />
        <Button variant="outlined">New</Button>
      </Stack>
    </Box>
  );
}