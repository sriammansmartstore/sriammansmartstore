# Content Security Policy (CSP) Configuration Guide

## Understanding the CSP Errors

### Current Issues:
1. `frame-ancestors` directive is ignored when delivered via `<meta>` element
2. Missing domains in `frame-src` directive blocking Razorpay and Firebase
3. CSP policies need to be configured at server level for production

## Development Solution

For development with Create React App, CSP restrictions are typically relaxed to allow third-party integrations.

### Current Configuration:
- Removed CSP meta tag from index.html
- Added .env file to configure development environment
- reCAPTCHA and Firebase scripts loaded directly

## Production CSP Configuration

When deploying to production, configure these CSP headers at your server level:

```
Content-Security-Policy: 
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' 
    https://www.google.com 
    https://www.gstatic.com 
    https://checkout.razorpay.com 
    https://apis.google.com;
  frame-src 'self' 
    https://www.google.com 
    https://www.gstatic.com 
    https://recaptcha.google.com 
    https://www.recaptcha.net 
    https://api.razorpay.com 
    https://checkout.razorpay.com 
    https://*.firebaseapp.com 
    https://*.googleapis.com;
  connect-src 'self' 
    https://*.googleapis.com 
    https://*.firebaseapp.com 
    https://api.razorpay.com 
    https://identitytoolkit.googleapis.com;
  img-src 'self' data: 
    https://*.googleapis.com 
    https://*.gstatic.com;
  style-src 'self' 'unsafe-inline' 
    https://fonts.googleapis.com;
  font-src 'self' 
    https://fonts.gstatic.com;
```

## Server Configuration Examples

### Netlify (_headers file):
```
/*
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.google.com https://www.gstatic.com https://checkout.razorpay.com https://apis.google.com; frame-src 'self' https://www.google.com https://www.gstatic.com https://recaptcha.google.com https://www.recaptcha.net https://api.razorpay.com https://checkout.razorpay.com https://*.firebaseapp.com https://*.googleapis.com; connect-src 'self' https://*.googleapis.com https://*.firebaseapp.com https://api.razorpay.com https://identitytoolkit.googleapis.com
```

### Apache (.htaccess):
```
Header always set Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.google.com https://www.gstatic.com https://checkout.razorpay.com https://apis.google.com; frame-src 'self' https://www.google.com https://www.gstatic.com https://recaptcha.google.com https://www.recaptcha.net https://api.razorpay.com https://checkout.razorpay.com https://*.firebaseapp.com https://*.googleapis.com; connect-src 'self' https://*.googleapis.com https://*.firebaseapp.com https://api.razorpay.com https://identitytoolkit.googleapis.com"
```

### Nginx:
```
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.google.com https://www.gstatic.com https://checkout.razorpay.com https://apis.google.com; frame-src 'self' https://www.google.com https://www.gstatic.com https://recaptcha.google.com https://www.recaptcha.net https://api.razorpay.com https://checkout.razorpay.com https://*.firebaseapp.com https://*.googleapis.com; connect-src 'self' https://*.googleapis.com https://*.firebaseapp.com https://api.razorpay.com https://identitytoolkit.googleapis.com";
```

## Required Domains by Service

### Firebase Authentication:
- `https://*.googleapis.com`
- `https://*.firebaseapp.com`
- `https://identitytoolkit.googleapis.com`

### Google reCAPTCHA:
- `https://www.google.com`
- `https://www.gstatic.com`
- `https://recaptcha.google.com`
- `https://www.recaptcha.net`

### Razorpay:
- `https://api.razorpay.com`
- `https://checkout.razorpay.com`

## Testing CSP Configuration

1. Use browser developer tools to check for CSP violations
2. Test all payment flows and authentication
3. Verify reCAPTCHA loads and functions properly
4. Check Firebase authentication works correctly

## Notes

- `frame-ancestors` directive only works via HTTP headers, not meta tags
- Development environments typically have relaxed CSP policies
- Production CSP should be as restrictive as possible while allowing necessary functionality
