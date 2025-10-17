# Authentication Flow Manual Test Plan

## Prerequisites
- Ensure Supabase project is properly configured
- Verify environment variables are set correctly:
  - VITE_SUPABASE_URL
  - VITE_SUPABASE_ANON_KEY

## Test Cases

### 1. Sign Up Flow

#### 1.1 Basic Sign Up
- Navigate to `/auth/register`
- Enter valid email and strong password
- Confirm password matches
- Click "Create Account"
- Verify redirect to email verification page
- Check Supabase dashboard for new user

#### 1.2 Sign Up Validation
- Test with invalid email format
- Test with weak password
- Test with mismatched passwords
- Test with already registered email
- Verify appropriate error messages

#### 1.3 Email Verification
- Complete sign up process
- Check email for verification link
- Click verification link
- Verify redirect to login with success message

### 2. Sign In Flow

#### 2.1 Basic Sign In
- Navigate to `/auth/login`
- Enter valid credentials
- Click "Sign In"
- Verify redirect to home page
- Verify user session is active

#### 2.2 Sign In Validation
- Test with invalid email format
- Test with incorrect password
- Test with non-existent account
- Verify appropriate error messages

#### 2.3 Sign In with Unverified Email
- Sign in with unverified email
- Verify appropriate error/warning message

### 3. Password Reset Flow

#### 3.1 Request Password Reset
- Navigate to `/auth/login`
- Click "Forgot password?"
- Enter email address
- Submit request
- Verify success message

#### 3.2 Complete Password Reset
- Check email for reset link
- Click reset link
- Enter new password
- Submit form
- Verify redirect to login with success message
- Sign in with new password

### 4. OAuth Sign In

#### 4.1 Google Sign In
- Navigate to `/auth/login`
- Click Google sign in button
- Complete Google authentication
- Verify redirect back to app
- Verify user session is active

#### 4.2 Apple Sign In (if applicable)
- Navigate to `/auth/login`
- Click Apple sign in button
- Complete Apple authentication
- Verify redirect back to app
- Verify user session is active

#### 4.3 Microsoft Sign In (if applicable)
- Navigate to `/auth/login`
- Click Microsoft sign in button
- Complete Microsoft authentication
- Verify redirect back to app
- Verify user session is active

### 5. Multi-Factor Authentication (if implemented)

#### 5.1 MFA Setup
- Sign in with valid credentials
- Navigate to MFA setup page
- Scan QR code with authenticator app
- Enter verification code
- Verify MFA is enabled

#### 5.2 MFA Verification
- Sign in with valid credentials
- Verify MFA prompt appears
- Enter valid verification code
- Verify successful login

#### 5.3 MFA Recovery
- Test recovery process if user loses access to authenticator

### 6. Sign Out Flow

#### 6.1 Basic Sign Out
- Sign in with valid credentials
- Click sign out button
- Verify redirect to login page
- Verify session is terminated
- Verify protected routes are inaccessible

### 7. Session Management

#### 7.1 Session Persistence
- Sign in with valid credentials
- Close browser tab
- Reopen application
- Verify session is maintained

#### 7.2 Session Timeout
- Sign in with valid credentials
- Wait for session timeout period
- Attempt to access protected route
- Verify redirect to login

#### 7.3 Session Security
- Sign in on one device
- Sign in on another device
- Verify both sessions remain active
- Sign out from one device
- Verify other device session remains active

### 8. Error Handling

#### 8.1 Network Errors
- Disable network connection
- Attempt to sign in
- Verify appropriate error message
- Re-enable network
- Verify ability to retry

#### 8.2 Server Errors
- Simulate server error (if possible)
- Verify appropriate error message
- Verify ability to retry

## Test Results

Document test results in the following format:

| Test Case | Status | Notes |
|-----------|--------|-------|
| 1.1 Basic Sign Up | Pass/Fail | Any observations |

## Issues and Recommendations

Document any issues found during testing and provide recommendations for fixes.
