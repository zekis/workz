/**
 * ProjectMenuContextMenu
 * - Context menu for hamburger menu items
 * - Provides "Open in Frappe" option for referenced documents
 * - Handles URL generation for different doctypes
 */
import React from "react";
import {
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider
} from "@mui/material";
import {
  Launch as LaunchIcon,
  Info as InfoIcon
} from "@mui/icons-material";

export interface ProjectMenuContextMenuProps {
  open: boolean;
  onClose: () => void;
  mouseX: number;
  mouseY: number;
  referenceType: string;
  referenceName: string;
  displayName: string;
}

export function ProjectMenuContextMenu({
  open,
  onClose,
  mouseX,
  mouseY,
  referenceType,
  referenceName,
  displayName
}: ProjectMenuContextMenuProps) {

  const handleOpenInFrappe = () => {
    // Generate Frappe URL for the document
    const baseUrl = window.location.origin;
    const frappeUrl = `${baseUrl}/app/${referenceType.toLowerCase()}/${encodeURIComponent(referenceName)}`;
    
    // Open in new tab
    window.open(frappeUrl, '_blank', 'noopener,noreferrer');
    onClose();
  };

  const handleCopyReference = () => {
    // Copy reference information to clipboard
    const referenceInfo = `${referenceType}: ${referenceName}`;
    navigator.clipboard.writeText(referenceInfo).then(() => {
      console.log('Reference copied to clipboard:', referenceInfo);
    }).catch(err => {
      console.error('Failed to copy reference:', err);
    });
    onClose();
  };

  return (
    <Menu
      open={open}
      onClose={onClose}
      anchorReference="anchorPosition"
      anchorPosition={
        open ? { top: mouseY, left: mouseX } : undefined
      }
      PaperProps={{
        sx: {
          minWidth: 200,
          boxShadow: 3
        }
      }}
    >
      <MenuItem onClick={handleOpenInFrappe}>
        <ListItemIcon>
          <LaunchIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText 
          primary="Open in Frappe"
          secondary={`View ${referenceType}`}
        />
      </MenuItem>
      
      <Divider />
      
      <MenuItem onClick={handleCopyReference}>
        <ListItemIcon>
          <InfoIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText 
          primary="Copy Reference"
          secondary={`${referenceType}: ${displayName}`}
        />
      </MenuItem>
    </Menu>
  );
}
