# Complete Guide: Implementing React Apps in Frappe

## Overview

This guide documents the complete process of implementing a React application within a Frappe framework, based on lessons learned from building the Synapse flow canvas application. It covers all critical aspects from initial setup to production deployment.

## Table of Contents

1. [Project Structure](#project-structure)
2. [Initial Setup](#initial-setup)
3. [CSRF Token Management](#csrf-token-management)
4. [Frappe Integration](#frappe-integration)
5. [DocType Design](#doctype-design)
6. [API Layer](#api-layer)
7. [Frontend Architecture](#frontend-architecture)
8. [Common Pitfalls & Solutions](#common-pitfalls--solutions)
9. [Testing Strategy](#testing-strategy)
10. [Deployment Checklist](#deployment-checklist)

---

## Project Structure

### Recommended Directory Layout

```
your_app/
├── your_app/
│   ├── __init__.py
│   ├── hooks.py
│   ├── api.py                    # Custom API endpoints
│   ├── doctype/                  # Frappe DocTypes
│   │   ├── your_doctype/
│   │   │   ├── your_doctype.json
│   │   │   └── your_doctype.py
│   └── www/                      # Website routes
│       ├── your_app.html         # Main HTML template
│       └── your_app.py           # Website route handler
├── frontend/                     # React application
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   ├── proxyOptions.js           # CRITICAL: Vite proxy config
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── components/
│       ├── services/             # API integration layer
│       └── lib/
├── www/                          # Public website files
│   ├── your_app.html            # Public route template
│   └── your_app.py              # Public route handler
└── docs/                        # Documentation
```

---

## Initial Setup

### 1. Create Frappe App

```bash
# Create new Frappe app
bench new-app your_app_name

# Install app to site
bench --site your_site install-app your_app_name
```

### 2. Setup React Frontend

```bash
# Create React app with Vite + TypeScript
cd your_app_name
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install

# Install essential dependencies
npm install @xyflow/react frappe-react-sdk
npm install -D tailwindcss postcss autoprefixer
npm install lucide-react sonner
npm install @radix-ui/react-dialog @radix-ui/react-button
```

### 3. Configure Vite for Frappe Integration

**Critical File: `frontend/proxyOptions.js`**

```javascript
export default {
  '/api': {
    target: 'http://localhost:8000',
    changeOrigin: true,
    ws: true,
  },
  '/assets': {
    target: 'http://localhost:8000',
    changeOrigin: true,
  },
  '/files': {
    target: 'http://localhost:8000',
    changeOrigin: true,
  }
};
```

**Critical File: `frontend/vite.config.ts`**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import proxyOptions from './proxyOptions.js'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 8080,
    proxy: proxyOptions
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

---

## CSRF Token Management

This section reflects a robust, production-ready pattern verified in the Workz app. It ensures CSRF is always available to the SPA before any network activity, avoiding intermittent CSRFTokenError during PUT/POST/DELETE.

Key principles:
- Serve your SPA under a Frappe website route (same origin) so cookies and CSRF are first-class.
- Embed CSRF and boot context into the HTML before your bundle executes.
- Always send credentials: "include" and X-Requested-With: XMLHttpRequest for mutating requests.
- Use a central client helper to attach X-Frappe-CSRF-Token.

Recommended implementation (as used by Workz)

1) Website Route Handler
File: workz/www/workz/index.py

```python
import frappe
from frappe import _
import re
import json

SCRIPT_TAG_PATTERN = re.compile(r"\<script[^<]*\</script\>")
CLOSING_SCRIPT_TAG_PATTERN = re.compile(r"</script\>")

def get_context(context):
    context.no_cache = 1

    try:
        user_id = frappe.session.user  # "Guest" if not logged in
        if user_id == "Guest":
            raise frappe.AuthenticationError(_("Authentication failed. Please log in again."))
        else:
            try:
                boot = frappe.sessions.get()
            except Exception as e:
                raise frappe.SessionBootFailed from e

        # Serialize and sanitize boot JSON to safely embed in HTML
        boot_json = frappe.as_json(boot, indent=None, separators=(",", ":"))
        boot_json = SCRIPT_TAG_PATTERN.sub("", boot_json)
        boot_json = CLOSING_SCRIPT_TAG_PATTERN.sub("", boot_json)
        boot_json = json.dumps(boot_json)

        context.update({
            "build_version": frappe.utils.get_build_version(),
            "boot": boot_json,
        })

        # Optional: additional user context for SPA
        full_name = frappe.utils.get_fullname(user_id)
        roles = frappe.get_roles(user_id)
        email = user_id if "@" in (user_id or "") else None
        user_info = {
            "name": user_id,
            "full_name": full_name,
            "email": email,
            "roles": roles,
        }

        site = getattr(frappe.local, "site", None)
        context.workz_boot = {
            "site": site,
            "user": user_info,
            "app": {
                "name": "workz",
                "version": getattr(frappe, "__version__", None),
            },
        }
    except Exception:
        # If something goes wrong, do not render SPA
        raise frappe.AuthenticationError(_("Authentication failed. Please log in again."))

    return context
```

2) HTML Template with CSRF + Boot Injection
File: workz/www/workz/index.html

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Workz ToDo Manager</title>
    <link rel="icon" href="/assets/workz/frontend/favicon.ico" />
    <!-- Your built bundle -->
    <script type="module" crossorigin src="/assets/workz/frontend/index-<your-hash>.js"></script>
  </head>
  <body>
    <div id="root"></div>
    <script>
      // Embed CSRF token and boot before the app runs
      window.csrf_token = '{{ frappe.session.csrf_token }}';

      if (!window.frappe) window.frappe = {};
      // 'boot' is a JSON string escaped and sanitized in index.py, parse it here
      frappe.boot = JSON.parse({{ boot }});
    </script>
  </body>
</html>
```

For local dev with Vite, you can mirror the same pattern in frontend/index.html so the app works both in dev and in Frappe:
File: frontend/index.html

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Workz ToDo Manager</title>
    <link rel="icon" href="./favicon.ico" />
  </head>
  <body>
    <div id="root"></div>
    <script>
      window.csrf_token = '{{ frappe.session.csrf_token }}';
      if (!window.frappe) window.frappe = {};
      frappe.boot = JSON.parse({{ boot }});
    </script>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

3) React App initialization (same-origin cookie flow)
Keep it simple and explicit. The provider URL should be the same origin that serves your SPA route so cookies are used automatically.

File: frontend/src/main.tsx

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import { FrappeProvider } from "frappe-react-sdk";
import App from "./App";

const theme = createTheme({ palette: { mode: "light" } });

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <FrappeProvider url={window.location.origin}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <App />
      </ThemeProvider>
    </FrappeProvider>
  </React.StrictMode>
);
```

4) Centralized client helpers for CSRF + JSON
Implement a single place to attach CSRF, AJAX header, and credentials for all mutating requests. This prevents subtle inconsistencies across components.

File: frontend/src/lib/csrf.ts
- getCsrfToken(): try cookie "frappe-csrf-token" → window.csrf_token (embedded) → GET /api/method/workz.workz.api.security.csrf_token

File: frontend/src/lib/api.ts
- requestJSON(): sets Accept, Content-Type (where needed), credentials: "include"
- For POST/PUT/PATCH/DELETE: adds X-Requested-With: XMLHttpRequest and X-Frappe-CSRF-Token from getCsrfToken()
- Exposes getJSON/postJSON/putJSON/patchJSON/delJSON

5) Optional server endpoint to fetch CSRF (for SPA safety)
Useful in cases where user arrived at SPA without hitting Desk pages that set the CSRF cookie.

File: workz/workz/api/security.py

```python
import frappe

@frappe.whitelist()
def csrf_token():
    if frappe.session.user == "Guest":
        frappe.throw("Login required", frappe.PermissionError)
    return {"csrf_token": frappe.sessions.get_csrf_token()}
```

6) Verified request headers for mutating calls
Every PUT/POST/DELETE should include:
- Cookie: sid (session)
- Header: X-Frappe-CSRF-Token: <token>
- Header: X-Requested-With: XMLHttpRequest
- Header: Content-Type: application/json
- Header: Accept: application/json
- fetch option: credentials: "include"

Troubleshooting checklist
- Confirm cookies present at /workz load time (sid and frappe-csrf-token). If not, log in and reload /workz.
- Verify window.csrf_token is set (check in DevTools console).
- Ensure your component uses the centralized helper (api.ts) and not ad-hoc fetch.
- If using a dev server on a different origin, ensure CORS is correctly configured and credentials are included, or prefer a Vite proxy to keep same-origin semantics.

---

## DocType Design

### Key Principles

1. **Field Length Limits**: Be very careful with field lengths
2. **JSON Storage**: Use `Long Text` fields for JSON data
3. **Indexing**: Add indexes for frequently queried fields
4. **Permissions**: Set appropriate read/write permissions

### Example DocType: Canvas Workspace

**File: `your_app/doctype/canvas_workspace/canvas_workspace.json`**

```json
{
 "actions": [],
 "allow_rename": 1,
 "creation": "2024-01-01 00:00:00.000000",
 "doctype": "DocType",
 "engine": "InnoDB",
 "field_order": [
  "workspace_name",
  "workspace_id", 
  "canvas_data",
  "owner"
 ],
 "fields": [
  {
   "fieldname": "workspace_name",
   "fieldtype": "Data",
   "label": "Workspace Name",
   "length": 50,
   "reqd": 1
  },
  {
   "fieldname": "workspace_id", 
   "fieldtype": "Data",
   "label": "Workspace ID",
   "length": 50,
   "unique": 1
  },
  {
   "fieldname": "canvas_data",
   "fieldtype": "Long Text",
   "label": "Canvas Data"
  },
  {
   "fieldname": "owner",
   "fieldtype": "Link",
   "label": "Owner",
   "options": "User"
  }
 ],
 "index_web_pages_for_search": 1,
 "links": [],
 "modified": "2024-01-01 00:00:00.000000",
 "modified_by": "Administrator",
 "module": "Your App",
 "name": "Canvas Workspace",
 "owner": "Administrator",
 "permissions": [
  {
   "create": 1,
   "delete": 1,
   "email": 1,
   "export": 1,
   "print": 1,
   "read": 1,
   "report": 1,
   "role": "System Manager",
   "share": 1,
   "write": 1
  }
 ],
 "sort_field": "modified",
 "sort_order": "DESC"
}
```

### Critical Field Length Issue

**LESSON LEARNED**: Frappe has strict field length limits that aren't always obvious.

```python
# BAD: Will cause validation errors
"workspace_name": "This is a very long workspace name that exceeds the field limit"

# GOOD: Keep within defined limits
"workspace_name": "Short Name"  # Max 50 chars as defined in DocType
```

---

## API Layer

### 1. Custom API Endpoints

**File: `your_app/api.py`**

```python
import frappe
import json

@frappe.whitelist()
def get_workspace_list():
    """Get list of workspaces for current user"""
    workspaces = frappe.get_all(
        'Canvas Workspace',
        fields=['name', 'workspace_name', 'workspace_id', 'modified', 'owner'],
        order_by='modified desc'
    )
    return workspaces

@frappe.whitelist()
def save_workspace(workspace_name, canvas_data, workspace_id=None):
    """Save or update workspace"""
    try:
        if workspace_id:
            # Update existing
            doc = frappe.get_doc('Canvas Workspace', workspace_id)
            doc.workspace_name = workspace_name
            doc.canvas_data = canvas_data
            doc.save()
        else:
            # Create new
            doc = frappe.get_doc({
                'doctype': 'Canvas Workspace',
                'workspace_name': workspace_name,
                'workspace_id': frappe.generate_hash(length=10),
                'canvas_data': canvas_data
            })
            doc.insert()
        
        return {
            'success': True,
            'workspace_id': doc.workspace_id,
            'name': doc.name
        }
    except Exception as e:
        frappe.log_error(f"Error saving workspace: {str(e)}")
        return {'success': False, 'error': str(e)}
```

### 2. React Service Layer

**File: `frontend/src/services/workspaceService.ts`**

```typescript
import { useFrappeGetCall, useFrappeCreateDoc, useFrappeUpdateDoc, useFrappeGetDoc } from 'frappe-react-sdk';

// Custom hook for workspace operations
export function useWorkspaceOperations() {
  const saveWorkspace = async (workspaceName: string, canvasData: string, workspaceId?: string) => {
    const response = await fetch('/api/method/your_app.api.save_workspace', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Frappe-CSRF-Token': window.frappe_boot?.csrf_token || '',
      },
      body: JSON.stringify({
        workspace_name: workspaceName,
        canvas_data: canvasData,
        workspace_id: workspaceId
      })
    });
    
    const result = await response.json();
    if (!result.message?.success) {
      throw new Error(result.message?.error || 'Failed to save workspace');
    }
    
    return result.message;
  };

  return { saveWorkspace };
}

// Hook for listing workspaces
export function useWorkspaceList() {
  const { data, error, isLoading, mutate } = useFrappeGetCall<any[]>(
    'your_app.api.get_workspace_list'
  );

  return {
    workspaces: data || [],
    error,
    isLoading,
    refetch: mutate
  };
}
```

---

## Frontend Architecture

### 1. Component Structure

```
src/
├── components/
│   ├── Canvas/
│   │   ├── FlowCanvas.tsx           # Main canvas component
│   │   ├── NodeTypes/
│   │   │   ├── TextNode.tsx
│   │   │   └── DocNode.tsx
│   │   └── Dialogs/
│   │       ├── WorkspaceSelector.tsx
│   │       └── DocumentSelector.tsx
│   ├── ui/                          # Reusable UI components
│   │   ├── button.tsx
│   │   ├── dialog.tsx
│   │   └── card.tsx
├── services/                        # API integration
│   ├── workspaceService.ts
│   └── documentService.ts
├── lib/
│   └── utils.ts                     # Utility functions
└── types/                           # TypeScript definitions
    └── index.ts
```

### 2. State Management Pattern

```typescript
// Use React Flow's built-in state management for canvas
const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

// Use custom hooks for Frappe integration
const { saveWorkspace } = useWorkspaceOperations();
const { workspaces, refetch } = useWorkspaceList();

// Callback pattern for parent-child communication
const handleDeleteNode = useCallback((nodeId: string) => {
  setNodes((nds) => nds.filter(node => node.id !== nodeId));
  toast.success('Node deleted');
}, [setNodes]);

// Pass callbacks to child components
const newNode = {
  id: `doc-${Date.now()}`,
  data: { 
    ...nodeData,
    onDelete: handleDeleteNode  // Callback for child to parent communication
  }
};
```

---

## Common Pitfalls & Solutions

### 1. CSRF Token Issues

**Problem**: 403 Forbidden errors on API calls

**Solution**: 
- Ensure website route injects boot data
- Include CSRF token in all requests
- Use `frappe-react-sdk` which handles this automatically

### 2. Field Length Validation Errors

**Problem**: "Value too long for field" errors

**Solution**:
- Check DocType field definitions carefully
- Use appropriate field types (`Long Text` for JSON)
- Validate data length before saving

### 3. Proxy Configuration Issues

**Problem**: API calls fail in development

**Solution**:
- Configure Vite proxy correctly
- Ensure all Frappe routes are proxied
- Test proxy configuration thoroughly

### 4. State Management Complexity

**Problem**: Complex state updates and re-renders

**Solution**:
- Use React Flow's built-in state management
- Implement callback patterns for component communication
- Use custom hooks for Frappe integration

### 5. TypeScript Errors in Development

**Problem**: TypeScript compilation errors

**Solution**:
- These are often development environment issues
- Focus on runtime functionality
- Use proper type definitions where possible

---

## Testing Strategy

### 1. Development Testing

```bash
# Start Frappe development server
bench start

# Start React development server (separate terminal)
cd frontend
npm run dev

# Test in browser at: http://localhost:8000/your_app
```

### 2. Key Test Cases

1. **CSRF Token Validation**
   - Verify boot data injection
   - Test API calls with authentication
   - Confirm CSRF tokens are included

2. **Data Persistence**
   - Create, read, update, delete operations
   - Field length validation
   - JSON serialization/deserialization

3. **User Interface**
   - Component rendering
   - State management
   - User interactions

### 3. Production Testing

```bash
# Build React app
cd frontend
npm run build

# Test production build
bench --site your_site serve --port 8000
```

---

## Deployment Checklist

### Pre-Deployment

- [ ] All DocTypes created and migrated
- [ ] API endpoints tested and working
- [ ] CSRF token integration verified
- [ ] React app builds without errors
- [ ] All dependencies installed
- [ ] Database migrations completed

### Production Build

```bash
# Build React application
cd frontend
npm run build

# Copy build files to Frappe public directory
cp -r dist/* ../www/

# Update HTML template to use built files
# Replace development script tag with production build references
```

### Post-Deployment

- [ ] Website routes accessible
- [ ] API endpoints responding correctly
- [ ] User authentication working
- [ ] Data persistence functioning
- [ ] Error handling working properly

---

## Performance Considerations

### 1. Bundle Size Optimization

```javascript
// Use dynamic imports for large components
const HeavyComponent = lazy(() => import('./HeavyComponent'));

// Optimize React Flow performance
const nodeTypes = useMemo(() => ({
  textNode: TextNode,
  docNode: DocNode,
}), []);
```

### 2. API Optimization

```python
# Use efficient database queries
frappe.get_all(
    'Canvas Workspace',
    fields=['name', 'workspace_name', 'modified'],  # Only needed fields
    filters={'owner': frappe.session.user},         # Filter at database level
    limit=50                                        # Limit results
)
```

### 3. Caching Strategy

```typescript
// Use SWR for caching API responses
const { data, error, mutate } = useFrappeGetCall(
  'your_app.api.get_workspace_list',
  undefined,
  {
    revalidateOnFocus: false,
    dedupingInterval: 60000  // Cache for 1 minute
  }
);
```

---

## Security Considerations

### 1. API Security

```python
@frappe.whitelist()
def secure_api_endpoint():
    # Always validate user permissions
    if not frappe.has_permission('Canvas Workspace', 'read'):
        frappe.throw('Insufficient permissions')
    
    # Validate input data
    data = frappe.local.form_dict
    if not data.get('required_field'):
        frappe.throw('Missing required field')
    
    # Use parameterized queries
    results = frappe.db.sql("""
        SELECT name FROM `tabCanvas Workspace` 
        WHERE owner = %s
    """, (frappe.session.user,))
    
    return results
```

### 2. Frontend Security

```typescript
// Sanitize user input
const sanitizeInput = (input: string) => {
  return input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
};

// Validate data before sending to API
const validateWorkspaceName = (name: string) => {
  if (name.length > 50) {
    throw new Error('Workspace name too long');
  }
  return sanitizeInput(name);
};
```

---

## Troubleshooting Guide

### Common Error Messages

1. **"CSRF Token Missing"**
   - Check website route context injection
   - Verify boot data availability
   - Ensure CSRF token in request headers

2. **"Value too long for field"**
   - Check DocType field length definitions
   - Validate data before saving
   - Consider using Long Text fields

3. **"Permission Denied"**
   - Check DocType permissions
   - Verify user roles
   - Test with System Manager role first

4. **"Module not found"**
   - Check import paths
   - Verify file locations
   - Ensure proper TypeScript configuration

### Debug Tools

```javascript
// Add to React app for debugging
console.log('Frappe Boot Available:', window.frappeBootAvailable);
console.log('Frappe Boot Data:', window.frappe_boot);
console.log('CSRF Token:', window.frappe_boot?.csrf_token);
```

---

## Conclusion

This guide provides a comprehensive foundation for implementing React applications within Frappe. The key to success is:

1. **Proper CSRF token management** through website routes
2. **Careful DocType design** with appropriate field lengths
3. **Clean separation** between Frappe backend and React frontend
4. **Thorough testing** of the integration points

Following this guide should eliminate most common issues and provide a solid foundation for building complex React applications within the Frappe ecosystem.

---

## Additional Resources

- [Frappe Framework Documentation](https://frappeframework.com/docs)
- [React Flow Documentation](https://reactflow.dev/)
- [frappe-react-sdk Documentation](https://github.com/netchampfaris/frappe-react-sdk)
- [Vite Configuration Guide](https://vitejs.dev/config/)

---

*Last Updated: January 2024*
*Based on: Synapse Flow Canvas Application Implementation*
