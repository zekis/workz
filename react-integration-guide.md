# Wizardz React Integration Guide

This guide shows how to integrate Wizardz agentic document creation into your React applications using frappe-react-sdk.

## Overview

Wizardz provides a conversational AI interface for creating and updating Frappe documents. The React integration includes:

- **Simplified API**: Clean endpoints optimized for React apps
- **React Hooks**: Easy-to-use hooks for state management
- **Reusable Components**: Drop-in components for immediate use
- **TypeScript Support**: Full type definitions (coming soon)

## Quick Start

### 1. Install Dependencies

```bash
npm install frappe-react-sdk
```

### 2. Copy Wizardz Files

Copy these files from the wizardz app to your React project:

```
src/
  components/
    wizardz/
      useWizardChat.js      # React hooks
      WizardChat.jsx        # Main component
      wizard-chat.css       # Styles
```

### 3. Basic Usage

```jsx
import React from 'react';
import WizardChat from './components/wizardz/WizardChat';
import './components/wizardz/wizard-chat.css';

function CreateCustomer() {
    const handleDocumentCreated = (result) => {
        console.log('Customer created:', result.document_name);
        // Redirect or refresh your app
    };

    return (
        <div>
            <h2>Create New Customer</h2>
            <WizardChat
                doctype="Customer"
                onDocumentCreated={handleDocumentCreated}
            />
        </div>
    );
}

export default CreateCustomer;
```

## API Reference

### React Hooks

#### `useWizardChat(doctype, existingDoc?)`

Main hook for managing wizard conversations.

**Parameters:**
- `doctype` (string): The DocType to create/update
- `existingDoc` (object|string, optional): Existing document for update mode

**Returns:**
```javascript
{
    // State
    sessionId: string | null,
    messages: Array<Message>,
    isLoading: boolean,
    sessionStatus: string,
    draftData: object,
    error: string | null,
    
    // Actions
    startSession: (sessionName?: string) => Promise<Result>,
    chat: (message: string) => Promise<Result>,
    loadSession: (sessionId: string) => Promise<Result>,
    finalize: () => Promise<Result>,
    refreshState: () => Promise<Result>,
    clearError: () => void,
    
    // Computed
    canFinalize: boolean,
    isActive: boolean,
    isCompleted: boolean,
    hasError: boolean,
    
    // Utilities
    reset: () => void
}
```

#### `useWizardInfo(doctype)`

Get wizard information for a specific DocType.

**Returns:**
```javascript
{
    wizardInfo: object | null,
    hasWizard: boolean,
    isLoading: boolean,
    error: string | null
}
```

#### `useAvailableWizards()`

Get all available wizards.

**Returns:**
```javascript
{
    doctypes: Array<WizardInfo>,
    isLoading: boolean,
    error: string | null,
    refresh: () => void
}
```

#### `useUserSessions()`

Get user's wizard sessions.

**Returns:**
```javascript
{
    sessions: Array<Session>,
    isLoading: boolean,
    error: string | null,
    refresh: () => void
}
```

### Components

#### `<WizardChat />`

Main chat component for document creation.

**Props:**
```javascript
{
    doctype: string,                    // Required: DocType to create
    existingDoc?: object | string,      // Optional: For update mode
    onDocumentCreated?: (result) => void, // Callback when document is created
    onSessionStarted?: (info) => void,  // Callback when session starts
    onError?: (error) => void,          // Error callback
    className?: string,                 // Additional CSS classes
    autoStart?: boolean,                // Auto-start session (default: false)
    showHeader?: boolean,               // Show header (default: true)
    placeholder?: string,               // Input placeholder
    disabled?: boolean                  // Disable input (default: false)
}
```

#### `<WizardSessionSelector />`

Component for resuming previous sessions.

**Props:**
```javascript
{
    onSessionSelected: (session) => void, // Required: Callback when session selected
    className?: string                    // Additional CSS classes
}
```

#### `<WizardLauncher />`

Grid of available wizards for quick access.

**Props:**
```javascript
{
    onWizardSelected: (wizard) => void,  // Required: Callback when wizard selected
    className?: string                   // Additional CSS classes
}
```

## Advanced Usage Examples

### 1. Update Existing Document

```jsx
function EditCustomer({ customer }) {
    return (
        <WizardChat
            doctype="Customer"
            existingDoc={customer}
            onDocumentCreated={(result) => {
                console.log('Customer updated:', result.document_name);
            }}
        />
    );
}
```

### 2. Session Management

```jsx
function CustomerManager() {
    const [currentSession, setCurrentSession] = useState(null);
    const [mode, setMode] = useState('create'); // 'create' | 'resume'

    return (
        <div>
            {mode === 'create' && (
                <WizardChat
                    doctype="Customer"
                    onDocumentCreated={(result) => {
                        console.log('Created:', result);
                        setMode('create'); // Reset for new document
                    }}
                />
            )}
            
            {mode === 'resume' && (
                <>
                    <WizardSessionSelector
                        onSessionSelected={(session) => {
                            setCurrentSession(session);
                        }}
                    />
                    {currentSession && (
                        <WizardChat
                            doctype={currentSession.doctype}
                            sessionId={currentSession.session_id}
                        />
                    )}
                </>
            )}
            
            <div className="mode-switcher">
                <button onClick={() => setMode('create')}>
                    Create New
                </button>
                <button onClick={() => setMode('resume')}>
                    Resume Session
                </button>
            </div>
        </div>
    );
}
```

### 3. Multi-DocType Dashboard

```jsx
function DocumentDashboard() {
    const [selectedWizard, setSelectedWizard] = useState(null);

    if (selectedWizard) {
        return (
            <div>
                <button onClick={() => setSelectedWizard(null)}>
                    ← Back to Dashboard
                </button>
                <WizardChat
                    doctype={selectedWizard.doctype}
                    onDocumentCreated={(result) => {
                        console.log('Document created:', result);
                        setSelectedWizard(null); // Return to dashboard
                    }}
                />
            </div>
        );
    }

    return (
        <div>
            <h1>Document Creation Dashboard</h1>
            <WizardLauncher
                onWizardSelected={setSelectedWizard}
            />
        </div>
    );
}
```

### 4. Custom Hook Usage

```jsx
function CustomWizardInterface() {
    const {
        messages,
        isLoading,
        startSession,
        chat,
        finalize,
        canFinalize,
        isActive
    } = useWizardChat('Customer');

    const [input, setInput] = useState('');

    const handleStart = async () => {
        await startSession('My Custom Customer');
    };

    const handleSend = async () => {
        if (input.trim()) {
            await chat(input);
            setInput('');
        }
    };

    return (
        <div className="custom-wizard">
            {!isActive ? (
                <button onClick={handleStart}>Start Wizard</button>
            ) : (
                <>
                    <div className="messages">
                        {messages.map((msg, i) => (
                            <div key={i} className={`message-${msg.type}`}>
                                {msg.content}
                            </div>
                        ))}
                    </div>
                    
                    <div className="input-area">
                        <input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            disabled={isLoading}
                        />
                        <button onClick={handleSend} disabled={isLoading}>
                            Send
                        </button>
                        {canFinalize && (
                            <button onClick={finalize}>Create Document</button>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
```

## Styling

The components come with default styles that integrate well with Frappe's design system. You can customize them by:

1. **Override CSS variables:**
```css
:root {
    --primary: #your-primary-color;
    --border-color: #your-border-color;
    --bg-color: #your-background-color;
}
```

2. **Add custom classes:**
```jsx
<WizardChat
    className="my-custom-wizard"
    doctype="Customer"
/>
```

3. **Custom CSS:**
```css
.my-custom-wizard {
    height: 600px;
    border-radius: 12px;
}

.my-custom-wizard .message-user .message-content {
    background: linear-gradient(45deg, #667eea 0%, #764ba2 100%);
}
```

## Error Handling

All components and hooks provide comprehensive error handling:

```jsx
function ErrorHandlingExample() {
    const { error, hasError, clearError } = useWizardChat('Customer');

    return (
        <div>
            {hasError && (
                <div className="error-banner">
                    <p>Error: {error}</p>
                    <button onClick={clearError}>Dismiss</button>
                </div>
            )}
            
            <WizardChat
                doctype="Customer"
                onError={(error) => {
                    console.error('Wizard error:', error);
                    // Handle error (show toast, log, etc.)
                }}
            />
        </div>
    );
}
```

## Next Steps

1. **Configure Wizards**: Set up wizard configurations in Frappe for your DocTypes
2. **Customize Styling**: Adapt the CSS to match your app's design
3. **Add TypeScript**: Convert to TypeScript for better development experience
4. **Extend Functionality**: Build custom components using the provided hooks

## Backend API Endpoints

The React integration uses these simplified API endpoints:

### `wizardz.react_api.create_wizard_session`
Create a new wizard session.

**Parameters:**
- `doctype` (string): Target DocType
- `session_name` (string, optional): Custom session name
- `existing_doc` (object, optional): For update mode

**Response:**
```json
{
    "success": true,
    "session_id": "WZRD-DRAFT-2025-00001",
    "doctype": "Customer",
    "wizard_name": "Customer Creation Assistant",
    "initial_message": "Hello! I'm ready to help...",
    "mode": "create"
}
```

### `wizardz.react_api.chat`
Send message to AI assistant.

**Parameters:**
- `session_id` (string): Session ID
- `message` (string): User message

**Response:**
```json
{
    "success": true,
    "message": "I understand you want to create...",
    "draft_data": {...},
    "status": "In Progress",
    "session_id": "WZRD-DRAFT-2025-00001"
}
```

### `wizardz.react_api.finalize_session`
Create final document from session.

**Parameters:**
- `session_id` (string): Session ID

**Response:**
```json
{
    "success": true,
    "document_name": "CUST-00001",
    "doctype": "Customer",
    "session_id": "WZRD-DRAFT-2025-00001"
}
```

### `wizardz.react_api.get_session_state`
Get current session state and conversation.

**Parameters:**
- `session_id` (string): Session ID

**Response:**
```json
{
    "success": true,
    "session_id": "WZRD-DRAFT-2025-00001",
    "conversation": [...],
    "draft_data": {...},
    "status": "In Progress",
    "can_finalize": true
}
```

### `wizardz.react_api.get_available_doctypes`
Get all DocTypes with configured wizards.

**Response:**
```json
{
    "success": true,
    "doctypes": [
        {
            "doctype": "Customer",
            "wizard_name": "Customer Creation Assistant",
            "ai_model": "gpt-4"
        }
    ]
}
```

### `wizardz.react_api.get_user_sessions`
Get user's wizard sessions.

**Response:**
```json
{
    "success": true,
    "sessions": [
        {
            "session_id": "WZRD-DRAFT-2025-00001",
            "name": "New Customer",
            "doctype": "Customer",
            "status": "In Progress",
            "last_modified": "2025-01-15 10:30:00",
            "can_resume": true,
            "is_completed": false
        }
    ]
}
```

## Troubleshooting

### Common Issues

1. **"No wizard configured for DocType"**
   - Ensure a Wizardz Configuration exists for the DocType
   - Check that the wizard is active (`is_active = 1`)
   - Verify user has permissions for the DocType

2. **"Permission denied"**
   - Check user has create/write permissions for the target DocType
   - Ensure user is logged in with valid session

3. **API calls failing**
   - Verify frappe-react-sdk is properly configured
   - Check network connectivity to Frappe server
   - Ensure API endpoints are accessible

4. **Styles not loading**
   - Import the CSS file: `import './wizard-chat.css'`
   - Check CSS file path is correct
   - Verify CSS variables are defined

### Debug Mode

Enable debug logging:

```javascript
// Add to your app's initialization
window.wizardz_debug = true;

// The hooks will log detailed information to console
```

For more information, see the [API Reference](api-reference.md) and [Setup Guide](setup-guide.md).
