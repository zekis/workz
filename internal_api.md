# Trigger Internal API Documentation

The Trigger Internal API allows other Frappe apps to send natural language messages to Trigger agents and receive processed responses. This enables seamless integration between your custom apps and Trigger's AI capabilities.

## Overview

The Internal API provides a simple way for Frappe applications to:
- Send natural language messages to specific Trigger agents
- Receive processed responses from the AI
- Include contextual information about documents or operations
- Handle responses synchronously or asynchronously

## Authentication

The API uses Frappe's standard authentication system. Users must be logged in and have appropriate permissions to use the API.

### Rate Limiting

- **Default Limit**: 100 requests per hour per user
- **Configurable**: Can be adjusted based on your needs
- **Error Response**: Returns `RATE_LIMIT_EXCEEDED` error code when exceeded

## API Endpoints

### 1. Process Message

**Endpoint**: `/api/method/trigger.trigger.api.internal_api.process_message`

**Method**: POST

**Description**: Send a message to a Trigger agent and receive the response.

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `agent_name` | string | Yes | Name of the Trigger Agent to process the message |
| `user_message` | string | Yes | The natural language message to process (max 10,000 chars) |
| `user_id` | string | No | User ID to process as (defaults to current session user) |
| `source_doctype` | string | No | Source document type for context |
| `source_document` | string | No | Source document name for context |
| `context` | string | No | Additional context information |
| `timeout` | integer | No | Maximum wait time in seconds (1-300, default: 30) |

#### Response Format

**Success Response**:
```json
{
    "success": true,
    "response": "I've created the todo item 'Buy groceries' for you.",
    "thread_id": "internal_api_abc123def456",
    "agent_name": "Todo Assistant",
    "processing_time": 2.5,
    "timestamp": "2025-01-15 10:30:45"
}
```

**Error Response**:
```json
{
    "success": false,
    "error": "Agent 'NonExistent Agent' not found",
    "error_code": "AGENT_NOT_FOUND"
}
```

#### Error Codes

| Code | Description |
|------|-------------|
| `AUTH_REQUIRED` | User authentication required |
| `USER_DISABLED` | User account is disabled |
| `RATE_LIMIT_EXCEEDED` | Too many requests in time window |
| `MISSING_AGENT` | agent_name parameter is required |
| `MISSING_MESSAGE` | user_message parameter is required |
| `MESSAGE_TOO_LONG` | Message exceeds 10,000 character limit |
| `INVALID_TIMEOUT` | Timeout must be between 1-300 seconds |
| `AGENT_NOT_FOUND` | Specified agent does not exist |
| `USER_NOT_FOUND` | Specified user_id does not exist |
| `NO_RESPONSE` | No response generated or timeout exceeded |
| `INTERNAL_ERROR` | Unexpected server error |

### 2. Get Available Agents

**Endpoint**: `/api/method/trigger.trigger.api.internal_api.get_available_agents_for_internal_api`

**Method**: GET

**Description**: Get a list of available Trigger agents.

#### Response Format

```json
{
    "success": true,
    "agents": [
        {
            "name": "todo-assistant-001",
            "agent_name": "Todo Assistant",
            "description": "Helps create and manage todo items"
        },
        {
            "name": "email-helper-001", 
            "agent_name": "Email Helper",
            "description": "Assists with email composition and management"
        }
    ],
    "count": 2
}
```

### 3. Get Thread Status

**Endpoint**: `/api/method/trigger.trigger.api.internal_api.get_thread_status`

**Method**: GET

**Description**: Get the status of a specific thread.

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `thread_id` | string | Yes | Thread ID to check status for |

#### Response Format

```json
{
    "success": true,
    "thread_id": "internal_api_abc123def456",
    "status": "Completed",
    "agent_name": "Todo Assistant",
    "created": "2025-01-15 10:30:00",
    "last_activity": "2025-01-15 10:30:45",
    "message_count": 4
}
```

## Usage Examples

### Example 1: Todo App Integration

```python
import frappe

def create_todo_with_ai(todo_text, user_id=None):
    """Create a todo using natural language via Trigger AI"""
    
    response = frappe.call(
        "trigger.trigger.api.internal_api.process_message",
        agent_name="Todo Assistant",
        user_message=f"Create a todo: {todo_text}",
        user_id=user_id,
        source_doctype="ToDo",
        context="User wants to create a new todo item",
        timeout=30
    )
    
    if response.get("success"):
        return {
            "success": True,
            "message": response.get("response"),
            "thread_id": response.get("thread_id")
        }
    else:
        return {
            "success": False,
            "error": response.get("error"),
            "error_code": response.get("error_code")
        }

# Usage
result = create_todo_with_ai("Buy groceries for the weekend party")
if result["success"]:
    frappe.msgprint(f"AI Response: {result['message']}")
else:
    frappe.throw(f"Error: {result['error']}")
```

### Example 2: Customer Service Integration

```python
import frappe

def process_customer_inquiry(customer_id, inquiry_text):
    """Process customer inquiry using AI agent"""
    
    # Get customer context
    customer = frappe.get_doc("Customer", customer_id)
    context = f"Customer: {customer.customer_name}, Email: {customer.email_id}"
    
    response = frappe.call(
        "trigger.trigger.api.internal_api.process_message",
        agent_name="Customer Service Agent",
        user_message=inquiry_text,
        source_doctype="Customer",
        source_document=customer_id,
        context=context,
        timeout=45
    )
    
    if response.get("success"):
        # Log the interaction
        frappe.get_doc({
            "doctype": "Customer Interaction",
            "customer": customer_id,
            "inquiry": inquiry_text,
            "ai_response": response.get("response"),
            "thread_id": response.get("thread_id"),
            "processing_time": response.get("processing_time")
        }).insert()
        
        return response.get("response")
    else:
        frappe.log_error(
            f"AI processing failed: {response.get('error')}",
            "Customer Service AI Error"
        )
        return "I apologize, but I'm unable to process your inquiry right now. Please contact support."

# Usage in a web form or API endpoint
customer_response = process_customer_inquiry("CUST-001", "I need help with my recent order")
```

### Example 3: Document Processing

```python
import frappe

def analyze_document_with_ai(doctype, docname, analysis_request):
    """Analyze a document using AI"""
    
    response = frappe.call(
        "trigger.trigger.api.internal_api.process_message",
        agent_name="Document Analyzer",
        user_message=f"Please analyze this document: {analysis_request}",
        source_doctype=doctype,
        source_document=docname,
        timeout=60
    )
    
    return response

# Usage
analysis = analyze_document_with_ai(
    "Sales Invoice", 
    "SINV-001", 
    "Summarize the key details and identify any potential issues"
)
```

## Best Practices

1. **Error Handling**: Always check the `success` field in responses and handle errors appropriately.

2. **Timeouts**: Set appropriate timeout values based on the complexity of your requests.

3. **Context**: Provide relevant context to help the AI understand the request better.

4. **Rate Limiting**: Be mindful of rate limits, especially in high-volume applications.

5. **Logging**: Log important interactions for debugging and audit purposes.

6. **Agent Selection**: Choose the most appropriate agent for your specific use case.

## Integration Patterns

### Synchronous Processing
Use the standard `process_message` endpoint when you need immediate responses and can wait for processing to complete.

### Background Processing
For long-running tasks, consider using Frappe's background job system:

```python
from frappe.utils.background_jobs import enqueue

def process_in_background(agent_name, message, **kwargs):
    enqueue(
        "trigger.trigger.api.internal_api.process_message",
        agent_name=agent_name,
        user_message=message,
        **kwargs
    )
```

### Batch Processing
For multiple related requests, process them sequentially to maintain context:

```python
def process_batch_requests(agent_name, requests):
    results = []
    for request in requests:
        result = frappe.call(
            "trigger.trigger.api.internal_api.process_message",
            agent_name=agent_name,
            user_message=request["message"],
            context=request.get("context"),
            timeout=30
        )
        results.append(result)
    return results
```

## Troubleshooting

### Common Issues

1. **Agent Not Found**: Ensure the agent name exists and is spelled correctly.
2. **Timeout Errors**: Increase timeout for complex requests or check agent configuration.
3. **Rate Limiting**: Implement request queuing or reduce request frequency.
4. **Authentication Errors**: Verify user permissions and session state.

### Debugging

Use the `get_thread_status` endpoint to monitor thread processing and identify issues.

## Security Considerations

- The API respects Frappe's permission system
- Rate limiting prevents abuse
- All requests are logged for audit purposes
- User context is properly maintained throughout processing

For additional support or questions, please refer to the Trigger documentation or contact your system administrator.
