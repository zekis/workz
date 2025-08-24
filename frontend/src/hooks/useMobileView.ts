/**
 * useMobileView
 * - Centralized breakpoint helpers for responsive rendering decisions
 * - Derived flags drive whether to use card list (xs/sm) or table (md+)
 */
import { useMediaQuery, useTheme } from "@mui/material";

export function useMobileView() {
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down("sm")); // < 600
  const isSm = useMediaQuery(theme.breakpoints.between("sm", "md")); // 600..899
  const isMdUp = useMediaQuery(theme.breakpoints.up("md")); // >= 900

  const useCards = isXs || isSm;

  return {
    isXs,
    isSm,
    isMdUp,
    useCards
  };
}