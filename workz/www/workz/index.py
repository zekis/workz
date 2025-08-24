from multiprocessing import context
import frappe
from frappe import _
import re
import json


SCRIPT_TAG_PATTERN = re.compile(r"\<script[^<]*\</script\>")
CLOSING_SCRIPT_TAG_PATTERN = re.compile(r"</script\>")

def get_context(context):
    context.no_cache = 1

    # --- 1. Set CSRF cookie for SPA ---
    try:
        user_id = frappe.session.user  # "Guest" if not logged in
        if user_id == "Guest":
            raise frappe.AuthenticationError(_("Authentication failed. Please log in again."))
        else:
            try:
                boot = frappe.sessions.get()
            except Exception as e:
                raise frappe.SessionBootFailed from e
            
        boot_json = frappe.as_json(boot, indent=None, separators=(",", ":"))
        boot_json = SCRIPT_TAG_PATTERN.sub("", boot_json)

        boot_json = CLOSING_SCRIPT_TAG_PATTERN.sub("", boot_json)
        boot_json = json.dumps(boot_json)

        context.update({
            "build_version": frappe.utils.get_build_version(),
            "boot": boot_json,
        })

        
        full_name = frappe.utils.get_fullname(user_id)
        roles = frappe.get_roles(user_id)
        email = user_id if "@" in (user_id or "") else None
        user_info = {
            "name": user_id,
            "full_name": full_name,
            "email": email,
            "roles": roles,
        }

        # --- User context for SPA ---
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
        # If something goes wrong, dont let them in
        raise frappe.AuthenticationError(_("Authentication failed. Please log in again."))

    
    return context