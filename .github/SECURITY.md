# 🔒 Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x     | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability, please follow these steps:

### 1. Do Not Open Public Issues
Please **DO NOT** open a public issue for security vulnerabilities.

### 2. Contact Us Directly
Send an email to: **security@yski.org**

Include the following information:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

### 3. Response Timeline
- **Acknowledgment**: Within 24 hours
- **Initial Assessment**: Within 72 hours
- **Fix Timeline**: Depends on severity
  - Critical: 7 days
  - High: 14 days
  - Medium: 30 days
  - Low: 90 days

### 4. Disclosure Policy
We follow responsible disclosure:
- We will notify affected users after the fix is deployed
- Public disclosure only after the vulnerability is fixed
- Credit will be given to the reporter (unless requested otherwise)

## Security Best Practices

### For Developers
- Never commit secrets or API keys
- Use environment variables for sensitive data
- Keep dependencies updated (check Dependabot alerts)
- Enable 2FA on GitHub accounts

### For Deployment
- Use HTTPS only
- Keep Docker images updated
- Enable firewall rules
- Regular security audits

## Security Features

- JWT-based authentication
- Rate limiting on API endpoints
- SQL injection prevention (SQLAlchemy)
- XSS protection headers
- CORS configuration
- Input validation with Pydantic
