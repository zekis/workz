/**
 * App root for Workz ToDo Manager
 */
import React from "react";
import { Container } from "@mui/material";
import { WorkzTodoManager } from "./pages/WorkzTodoManager";

export default function App() {
  return (
    <Container maxWidth="lg" sx={{ py: 2 }}>
      <WorkzTodoManager />
    </Container>
  );
}
