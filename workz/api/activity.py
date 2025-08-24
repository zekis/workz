import frappe
from frappe import _
from frappe.utils import get_fullname
import json


def _user_display(user: str) -> str:
    try:
        return get_fullname(user)
    except Exception:
        return user or "User"


def format_field_change(field_name, old_value, new_value):
    """Format a field change with before/after values"""
    # Handle None values
    old_display = "None" if old_value is None else str(old_value)
    new_display = "None" if new_value is None else str(new_value)

    # Clean up values by removing timestamps and usernames that are redundant
    old_display = clean_field_value(old_display)
    new_display = clean_field_value(new_display)

    # Special formatting for specific fields
    if field_name == "status":
        return f"Status: {old_display} → {new_display}"
    elif field_name == "priority":
        return f"Priority: {old_display} → {new_display}"
    elif field_name == "allocated_to":
        old_name = _user_display(old_display) if old_display != "None" else "None"
        new_name = _user_display(new_display) if new_display != "None" else "None"
        return f"Assigned to: {old_name} → {new_name}"
    elif field_name == "description":
        return f"Subject updated"
    elif field_name in ["reference_name", "reference_type"]:
        field_display = "Project" if field_name == "reference_name" else "Reference Type"
        return f"{field_display}: {old_display} → {new_display}"
    else:
        # Generic field formatting
        field_display = field_name.replace("_", " ").title()
        return f"{field_display}: {old_display} → {new_display}"


def clean_field_value(value):
    """Clean field values by removing redundant information"""
    if not value or value == "None":
        return value

    # Remove timestamps from approval notes and similar fields
    import re

    # Remove patterns like "by Administrator on 2025-08-08 15:22:26.808608"
    value = re.sub(r'\s+on\s+\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}(\.\d+)?', '', value)

    # Remove patterns like "Administrator on 2025-08-08"
    value = re.sub(r'\s+on\s+\d{4}-\d{2}-\d{2}', '', value)

    # Remove standalone timestamps
    value = re.sub(r'\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}(\.\d+)?', '', value)

    # Clean up extra whitespace
    value = ' '.join(value.split())

    return value


@frappe.whitelist(allow_guest=False)
def list_history(todo_id: str):
    """
    Return activity items for a ToDo.
    Returns both version history (status changes, assignments) and comments.
    """
    if not todo_id:
        frappe.throw("todo_id is required", frappe.ValidationError)

    # Check if user has read permission
    if not frappe.has_permission("ToDo", "read", todo_id):
        frappe.throw(_("Not permitted to read ToDo"))

    items = []

    # Get document versions from Version doctype
    versions = frappe.get_all(
        "Version",
        filters={
            "ref_doctype": "ToDo",
            "docname": todo_id
        },
        fields=["name", "owner", "creation", "data"],
        order_by="creation desc"
    )

    # Process version data
    for version in versions:
        try:
            version_data = json.loads(version.data) if version.data else {}
            changed_fields = []
            change_type = "status_change"

            if "changed" in version_data and version_data["changed"]:
                # "changed" is a list of [field_name, old_value, new_value] arrays
                if isinstance(version_data["changed"], list):
                    for change in version_data["changed"]:
                        if len(change) >= 3:
                            field_name, old_value, new_value = change[0], change[1], change[2]
                            # Format the change with before/after values
                            change_desc = format_field_change(field_name, old_value, new_value)
                            if change_desc:  # Only add non-None descriptions
                                changed_fields.append(change_desc)
                                # Determine activity type based on field
                                if field_name == "allocated_to":
                                    change_type = "assignment"
                        elif len(change) > 0:
                            changed_fields.append(change[0])
                else:
                    changed_fields = list(version_data["changed"].keys()) if isinstance(version_data["changed"], dict) else []

            if "added" in version_data and version_data["added"]:
                # Document was created
                change_type = "status_change"
                changed_fields = ["ToDo created"]
            elif not changed_fields:
                # Fallback for other changes
                if "removed" in version_data and version_data["removed"]:
                    changed_fields = ["Fields removed"]
                else:
                    changed_fields = ["ToDo updated"]

            # Add version as activity item
            items.append({
                "id": version.name,
                "type": change_type,
                "author": {"name": _user_display(version.owner)},
                "content": "; ".join(changed_fields),
                "created_at": str(version.creation),
                "meta": {
                    "changes": changed_fields,
                    "version_data": version_data
                }
            })
        except (json.JSONDecodeError, KeyError, TypeError) as e:
            # Log the error but continue processing other versions
            frappe.log_error(f"Error processing version {version.name}: {str(e)}")
            continue

    # Get comments from Comment doctype
    comments = frappe.get_all(
        "Comment",
        filters={
            "reference_doctype": "ToDo",
            "reference_name": todo_id,
            "comment_type": "Comment"
        },
        fields=["name", "owner", "creation", "content"],
        order_by="creation desc"
    )

    # Add comments as activity items
    for comment in comments:
        items.append({
            "id": comment.name,
            "type": "comment",
            "author": {"name": _user_display(comment.owner)},
            "content": comment.content or "",
            "created_at": str(comment.creation),
            "meta": None
        })

    # Sort all items by creation date (newest first)
    items.sort(key=lambda x: x["created_at"], reverse=True)

    return items


@frappe.whitelist(allow_guest=False)
def add_comment(todo_id: str, content: str):
    """
    Create a new comment for the ToDo using Comment doctype.
    Returns the created item in activity schema.
    """
    if not todo_id:
        frappe.throw("todo_id is required", frappe.ValidationError)
    content = (content or "").strip()
    if not content:
        frappe.throw("content cannot be empty", frappe.ValidationError)

    # Check if user has read permission (minimum required to comment)
    if not frappe.has_permission("ToDo", "read", todo_id):
        frappe.throw(_("Not permitted to comment on ToDo"))

    # Create Comment
    comment = frappe.get_doc({
        "doctype": "Comment",
        "comment_type": "Comment",
        "reference_doctype": "ToDo",
        "reference_name": todo_id,
        "content": content,
        "comment_email": frappe.session.user,
        "comment_by": get_fullname(frappe.session.user)
    })

    comment.insert(ignore_permissions=True)
    frappe.db.commit()

    # Return in activity schema format
    return {
        "id": comment.name,
        "type": "comment",
        "author": {"name": _user_display(comment.owner)},
        "content": comment.content or "",
        "created_at": str(comment.creation),
        "meta": None
    }