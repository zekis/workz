import frappe

@frappe.whitelist()
def csrf_token():
    """
    Return a fresh CSRF token for the logged-in user.

    Client usage (same-origin cookie session):
      GET /api/method/workz.workz.api.security.csrf_token
      - Requires an authenticated session (sid cookie)
      - Response: {"message": {"csrf_token": "..."}} on success

    Notes:
    - This should not be exposed to Guests. It relies on an existing session.
    - Useful for SPAs served from website where CSRF cookie may not be primed by a Jinja render.
    """
    if frappe.session.user == "Guest":
        frappe.throw("Login required", frappe.PermissionError)
    token = frappe.sessions.get_csrf_token()
    return {"csrf_token": token}