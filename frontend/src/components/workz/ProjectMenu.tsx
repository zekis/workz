/**
 * ReferenceMenu (formerly ProjectMenu)
 * - Left sidebar menu for filtering todos by reference type and name (like MS Todo)
 * - Shows reference types with todo counts
 * - For Project reference type, shows sub-folders for each project
 * - Allows filtering by reference type or specific project
 */
import React from "react";
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  IconButton,
  Badge,
  Divider,
  useTheme,
  useMediaQuery,
  Collapse
} from "@mui/material";
import {
  Menu as MenuIcon,
  Close as CloseIcon,
  Folder as FolderIcon,
  FolderOpen as FolderOpenIcon,
  Inbox as InboxIcon,
  ExpandLess,
  ExpandMore,
  Business as ProjectIcon,
  Email as CommunicationIcon,
  Description as DocumentIcon,
  Timeline as ActivityIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon
} from "@mui/icons-material";
import type { Todo } from "../../hooks/useTodos";
import { useReferenceResolver } from "../../hooks/useReferenceResolver";

export interface ProjectMenuProps {
  todos: Todo[];
  selectedProject?: string | null;
  onProjectSelect?: (project: string | null) => void;
  open?: boolean;
  onToggle?: () => void;
  isDarkMode?: boolean;
  onThemeToggle?: () => void;
}

interface ReferenceInfo {
  name: string;
  count: number;
  openCount: number;
  projects?: Map<string, { count: number; openCount: number }>;
}

export function ProjectMenu(props: ProjectMenuProps) {
  const { todos, selectedProject, onProjectSelect, open = false, onToggle, isDarkMode = false, onThemeToggle } = props;

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [expandedTypes, setExpandedTypes] = React.useState<Set<string>>(new Set(["Project"]));

  // Use reference resolver to get display names
  const { resolveReference } = useReferenceResolver(todos);

  // Calculate reference statistics
  const referenceStats = React.useMemo(() => {
    const stats = new Map<string, ReferenceInfo>();

    // Add "All" reference
    const allOpenCount = todos.filter(todo =>
      todo.status?.toLowerCase() !== "closed" &&
      todo.status?.toLowerCase() !== "cancelled"
    ).length;

    stats.set("", {
      name: "All ToDos",
      count: todos.length,
      openCount: allOpenCount
    });

    // Calculate stats for each reference type
    todos.forEach(todo => {
      const refType = todo.referenceType || "No Reference";
      const refName = todo.referenceName;
      const isOpen = todo.status?.toLowerCase() !== "closed" &&
                    todo.status?.toLowerCase() !== "cancelled";

      if (!stats.has(refType)) {
        stats.set(refType, {
          name: refType,
          count: 0,
          openCount: 0,
          projects: (refType === "Project" || refType === "Activity") ? new Map() : undefined
        });
      }

      const refInfo = stats.get(refType)!;
      refInfo.count++;
      if (isOpen) {
        refInfo.openCount++;
      }

      // For Project and Activity reference types, track individual items
      if ((refType === "Project" || refType === "Activity") && refName && refInfo.projects) {
        if (!refInfo.projects.has(refName)) {
          refInfo.projects.set(refName, { count: 0, openCount: 0 });
        }
        const itemInfo = refInfo.projects.get(refName)!;
        itemInfo.count++;
        if (isOpen) {
          itemInfo.openCount++;
        }
      }
    });

    // Convert to array and sort
    const refArray = Array.from(stats.entries()).map(([key, info]) => ({
      key,
      ...info
    }));

    // Sort: All first, then by name, No Reference last
    refArray.sort((a, b) => {
      if (a.key === "") return -1;
      if (b.key === "") return 1;
      if (a.key === "No Reference") return 1;
      if (b.key === "No Reference") return -1;
      return a.name.localeCompare(b.name);
    });

    return refArray;
  }, [todos]);

  const handleReferenceClick = (referenceKey: string) => {
    const reference = referenceKey === "" ? null : referenceKey;
    onProjectSelect?.(reference);

    // Close menu on mobile after selection
    if (isMobile) {
      onToggle?.();
    }
  };

  const toggleExpanded = (refType: string) => {
    const newExpanded = new Set(expandedTypes);
    if (newExpanded.has(refType)) {
      newExpanded.delete(refType);
    } else {
      newExpanded.add(refType);
    }
    setExpandedTypes(newExpanded);
  };

  const getIconForReferenceType = (refType: string) => {
    switch (refType) {
      case "Project": return <ProjectIcon />;
      case "Communication": return <CommunicationIcon />;
      case "": return <InboxIcon />;
      default: return <DocumentIcon />;
    }
  };

  const drawerContent = (
    <Box sx={{
      width: 280,
      height: "100%",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden"
    }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider", flexShrink: 0 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">References</Typography>
          <IconButton onClick={onToggle} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Reference List */}
      <Box sx={{
        flex: 1,
        overflow: "auto",
        // Custom scrollbar styling
        "&::-webkit-scrollbar": {
          width: "8px",
        },
        "&::-webkit-scrollbar-track": {
          backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
        },
        "&::-webkit-scrollbar-thumb": {
          backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
          borderRadius: "4px",
          "&:hover": {
            backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
          }
        },
        // Firefox scrollbar styling
        scrollbarWidth: "thin",
        scrollbarColor: (theme) => theme.palette.mode === 'dark'
          ? 'rgba(255,255,255,0.3) rgba(255,255,255,0.1)'
          : 'rgba(0,0,0,0.3) rgba(0,0,0,0.1)'
      }}>
        <List sx={{ pt: 1, pb: 1 }}>
          {referenceStats.map((reference) => {
            const isSelected = selectedProject === reference.key ||
                             ((selectedProject === undefined || selectedProject === null) && reference.key === "");
            const isExpanded = expandedTypes.has(reference.key);
            const hasProjects = reference.projects && reference.projects.size > 0;

            return (
              <React.Fragment key={reference.key}>
                {/* Main Reference Type Item */}
                <ListItem disablePadding>
                  <ListItemButton
                    selected={isSelected}
                    onClick={() => handleReferenceClick(reference.key)}
                    sx={{
                      mx: 1,
                      borderRadius: 1,
                      "&.Mui-selected": {
                        bgcolor: (theme) => theme.palette.mode === 'dark'
                          ? 'primary.dark'
                          : 'primary.light',
                        "&:hover": {
                          bgcolor: (theme) => theme.palette.mode === 'dark'
                            ? 'primary.dark'
                            : 'primary.light',
                        }
                      }
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      {getIconForReferenceType(reference.key)}
                    </ListItemIcon>
                    <ListItemText
                      primary={reference.name}
                      primaryTypographyProps={{
                        variant: "body2",
                        fontWeight: isSelected ? 600 : 400
                      }}
                    />
                    <Badge
                      badgeContent={reference.openCount}
                      color="primary"
                      sx={{
                        "& .MuiBadge-badge": {
                          fontSize: "0.75rem",
                          minWidth: "18px",
                          height: "18px"
                        }
                      }}
                    />
                    {hasProjects && (
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleExpanded(reference.key);
                        }}
                        sx={{ ml: 1 }}
                      >
                        {isExpanded ? <ExpandLess /> : <ExpandMore />}
                      </IconButton>
                    )}
                  </ListItemButton>
                </ListItem>

                {/* Sub-items (for Project and Activity reference types) */}
                {hasProjects && (
                  <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding>
                      {Array.from(reference.projects!.entries()).map(([projectName, projectInfo]) => {
                        const projectKey = `${reference.key}:${projectName}`;
                        const isProjectSelected = selectedProject === projectKey;

                        return (
                          <ListItem key={projectKey} disablePadding>
                            <ListItemButton
                              selected={isProjectSelected}
                              onClick={() => handleReferenceClick(projectKey)}
                              sx={{
                                mx: 1,
                                ml: 3, // Indent sub-items
                                borderRadius: 1,
                                "&.Mui-selected": {
                                  bgcolor: (theme) => theme.palette.mode === 'dark'
                                    ? 'primary.dark'
                                    : 'primary.light',
                                  "&:hover": {
                                    bgcolor: (theme) => theme.palette.mode === 'dark'
                                      ? 'primary.dark'
                                      : 'primary.light',
                                  }
                                }
                              }}
                            >
                              <ListItemIcon sx={{ minWidth: 40 }}>
                                {isProjectSelected ? (
                                  <FolderOpenIcon color="primary" fontSize="small" />
                                ) : (
                                  <FolderIcon fontSize="small" />
                                )}
                              </ListItemIcon>
                              <ListItemText
                                primary={resolveReference(reference.key, projectName)}
                                primaryTypographyProps={{
                                  variant: "body2",
                                  fontWeight: isProjectSelected ? 600 : 400
                                }}
                              />
                              <Badge
                                badgeContent={projectInfo.openCount}
                                color="primary"
                                sx={{
                                  "& .MuiBadge-badge": {
                                    fontSize: "0.75rem",
                                    minWidth: "18px",
                                    height: "18px"
                                  }
                                }}
                              />
                            </ListItemButton>
                          </ListItem>
                        );
                      })}
                    </List>
                  </Collapse>
                )}
              </React.Fragment>
            );
          })}


        </List>

        {/* Theme Toggle at Bottom */}
        <Box sx={{ mt: 'auto', p: 2, borderTop: 1, borderColor: 'divider' }}>
          <ListItem disablePadding>
            <ListItemButton
              onClick={onThemeToggle}
              sx={{
                borderRadius: 1,
                "&:hover": { bgcolor: "action.hover" }
              }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                {isDarkMode ? <LightModeIcon /> : <DarkModeIcon />}
              </ListItemIcon>
              <ListItemText
                primary={isDarkMode ? "Light Mode" : "Dark Mode"}
                primaryTypographyProps={{ fontSize: "0.875rem" }}
              />
            </ListItemButton>
          </ListItem>
        </Box>
      </Box>
    </Box>
  );

  return (
    <>


      {/* Drawer */}
      <Drawer
        variant={isMobile ? "temporary" : "persistent"}
        anchor="left"
        open={open}
        onClose={onToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile
        }}
        sx={{
          "& .MuiDrawer-paper": {
            boxSizing: "border-box",
            width: 280,
            borderRight: 1,
            borderColor: "divider",
            overflowX: "hidden", // Prevent horizontal scrolling
            overflowY: "auto"
          }
        }}
      >
        {drawerContent}
      </Drawer>
    </>
  );
}
