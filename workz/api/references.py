"""
Reference resolution API for workz app
- Resolves document names to display titles
- Uses doctype title_field configuration
- Provides batch resolution for efficiency
"""
import frappe
from frappe import _


@frappe.whitelist(allow_guest=False)
def resolve_references(references):
    """
    Resolve a list of references to their display titles.
    
    Args:
        references: List of dicts with 'doctype' and 'name' keys
                   Example: [{"doctype": "Project", "name": "PROJ-001"}, ...]
    
    Returns:
        Dict mapping "doctype:name" to display title
        Example: {"Project:PROJ-001": "Alpha Project", ...}
    """
    if not references:
        return {}
    
    # Parse references if it's a JSON string
    if isinstance(references, str):
        import json
        references = json.loads(references)
    
    if not isinstance(references, list):
        frappe.throw(_("References must be a list"), frappe.ValidationError)
    
    resolved = {}
    
    # Group references by doctype for efficient processing
    by_doctype = {}
    for ref in references:
        if not isinstance(ref, dict) or 'doctype' not in ref or 'name' not in ref:
            continue
            
        doctype = ref['doctype']
        name = ref['name']
        
        # Check if user has read permission for this doctype
        if not frappe.has_permission(doctype, "read"):
            continue
            
        if doctype not in by_doctype:
            by_doctype[doctype] = []
        by_doctype[doctype].append(name)
    
    # Resolve each doctype
    for doctype, names in by_doctype.items():
        try:
            # Get doctype metadata to find title field
            meta = frappe.get_meta(doctype)
            title_field = meta.title_field or "name"
            
            # Fetch documents with title field
            fields = ["name"]
            if title_field != "name":
                fields.append(title_field)
            
            # Batch fetch documents
            docs = frappe.get_all(
                doctype,
                filters={"name": ["in", names]},
                fields=fields
            )
            
            # Build resolution map
            for doc in docs:
                key = f"{doctype}:{doc.name}"
                
                # Use title field if available, otherwise use name
                if title_field != "name" and doc.get(title_field):
                    resolved[key] = str(doc[title_field]).strip()
                else:
                    resolved[key] = doc.name
                    
        except Exception as e:
            # Log error but don't fail the entire request
            frappe.log_error(f"Failed to resolve {doctype} references: {str(e)}")
            
            # Add fallback entries for this doctype
            for name in names:
                key = f"{doctype}:{name}"
                resolved[key] = name
    
    return resolved


@frappe.whitelist(allow_guest=False)
def get_doctype_title_field(doctype):
    """
    Get the title field for a specific doctype.
    
    Args:
        doctype: Name of the doctype
        
    Returns:
        Dict with title_field information
    """
    if not doctype:
        frappe.throw(_("Doctype is required"), frappe.ValidationError)
    
    # Check if user has read permission
    if not frappe.has_permission(doctype, "read"):
        frappe.throw(_("Not permitted to access {0}").format(doctype))
    
    try:
        meta = frappe.get_meta(doctype)
        return {
            "doctype": doctype,
            "title_field": meta.title_field or "name",
            "has_title_field": bool(meta.title_field)
        }
    except Exception as e:
        frappe.log_error(f"Failed to get title field for {doctype}: {str(e)}")
        return {
            "doctype": doctype,
            "title_field": "name",
            "has_title_field": False,
            "error": str(e)
        }


@frappe.whitelist(allow_guest=False)
def resolve_single_reference(doctype, name):
    """
    Resolve a single reference to its display title.
    
    Args:
        doctype: Document type
        name: Document name
        
    Returns:
        Display title string
    """
    if not doctype or not name:
        return name or ""
    
    # Check permission
    if not frappe.has_permission(doctype, "read"):
        return name
    
    try:
        # Get title field
        meta = frappe.get_meta(doctype)
        title_field = meta.title_field or "name"
        
        if title_field == "name":
            return name
        
        # Fetch document
        doc = frappe.get_value(doctype, name, title_field)
        return str(doc).strip() if doc else name
        
    except Exception as e:
        frappe.log_error(f"Failed to resolve {doctype}:{name}: {str(e)}")
        return name
