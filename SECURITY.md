# Security Policy

## Reporting a Vulnerability

Please **do not** open a public GitHub issue for security vulnerabilities.

Instead, email us at: security@cloudsecurityinsider.com

Include:
- A description of the vulnerability
- Steps to reproduce
- Potential impact
- Your suggested fix (if any)

We aim to respond within 5 business days and will coordinate a fix before public disclosure.

## API Token Guidance

If you deploy the feature request API, your `GITHUB_TOKEN` must be stored as an Azure Static Web Apps
application setting — **never** commit it to the repository.

The token requires only `repo` scope (to create issues). Use a fine-grained personal access token
scoped to the specific repository for minimum privilege.

## Data Note

This tool runs entirely client-side. No user data is sent to any server during cost calculations.
The only server call is the optional feature request form, which sends name, email, category,
summary, description, and priority to an Azure Function, which then creates a GitHub issue.
No data is stored beyond what GitHub retains in the issue.
