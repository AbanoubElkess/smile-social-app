# SMILE Platform - QA Regression Test Cases
**Version**: 1.0  
**Date**: June 23, 2025  
**Platform**: Web Application (Next.js Frontend + Node.js Backend)

## Test Environment Setup

### Prerequisites
- Node.js 18+ installed
- PostgreSQL database running
- Redis server running
- All environment variables configured
- Frontend running on http://localhost:3001
- Backend API running on http://localhost:3000

### Test Data Setup
```sql
-- Create test users for manual testing
INSERT INTO users (id, email, username, display_name, password) VALUES 
  ('test-user-1', 'testuser1@example.com', 'testuser1', 'Test User 1', '<hashed_password>'),
  ('test-user-2', 'testuser2@example.com', 'testuser2', 'Test User 2', '<hashed_password>');
```

---

## 1. FRONTEND TEST CASES

### 1.1 Landing Page Tests

#### TC-F001: Landing Page Load
**Priority**: Critical  
**Type**: Functional  
**Steps**:
1. Navigate to http://localhost:3001
2. Wait for page to fully load

**Expected Results**:
- [ ] Page loads within 3 seconds
- [ ] All sections visible: Header, Hero, Features, AI Agents, Marketplace, Testimonials, CTA, Footer
- [ ] No console errors
- [ ] Responsive design works on mobile/tablet/desktop
- [ ] All CSS styles properly applied

#### TC-F002: Navigation Functionality
**Priority**: High  
**Type**: Functional  
**Steps**:
1. Load landing page
2. Click each navigation link in header
3. Test smooth scrolling to sections

**Expected Results**:
- [ ] "Features" button scrolls to features section
- [ ] "Marketplace" button scrolls to marketplace section
- [ ] "About" button scrolls to testimonials section
- [ ] "Contact" button scrolls to CTA section
- [ ] Smooth scrolling animation works
- [ ] No JavaScript errors in console

#### TC-F003: Hero Section Interactivity
**Priority**: High  
**Type**: Functional  
**Steps**:
1. Locate "Get Started" button in hero section
2. Click the button
3. Observe scroll behavior

**Expected Results**:
- [ ] Button has hover effects (scale transform)
- [ ] Click scrolls smoothly to features section
- [ ] Button shows active state when clicked
- [ ] No errors in console

#### TC-F004: CTA Section Buttons
**Priority**: Medium  
**Type**: Functional  
**Steps**:
1. Scroll to bottom CTA section
2. Click "Sign Up Free" button
3. Click "Learn More" button

**Expected Results**:
- [ ] "Sign Up Free" shows placeholder alert
- [ ] "Learn More" scrolls to features section
- [ ] Both buttons have hover effects
- [ ] Visual feedback on click (scale animation)

#### TC-F005: Header Authentication Buttons  
**Priority**: Medium  
**Type**: Functional  
**Steps**:
1. Click "Sign In" button in header
2. Click "Sign Up" button in header

**Expected Results**:
- [ ] "Sign In" shows placeholder alert
- [ ] "Sign Up" shows placeholder alert
- [ ] Buttons have proper hover states
- [ ] Visual feedback on interaction

### 1.2 Responsive Design Tests

#### TC-F006: Mobile Responsiveness
**Priority**: High  
**Type**: UI/UX  
**Steps**:
1. Resize browser to mobile width (375px)
2. Test all page sections
3. Test navigation and buttons

**Expected Results**:
- [ ] All content properly stacked vertically
- [ ] Text remains readable
- [ ] Buttons remain clickable
- [ ] No horizontal scrolling
- [ ] Navigation menu adapts to mobile

#### TC-F007: Tablet Responsiveness
**Priority**: Medium  
**Type**: UI/UX  
**Steps**:
1. Resize browser to tablet width (768px)
2. Test all page sections
3. Verify layout adaptations

**Expected Results**:
- [ ] Content scales appropriately
- [ ] Grid layouts adjust properly
- [ ] Typography scales correctly
- [ ] Images and media responsive

#### TC-F008: Desktop Responsiveness
**Priority**: Medium  
**Type**: UI/UX  
**Steps**:
1. Test on various desktop sizes (1024px, 1440px, 1920px)
2. Verify content centering and max-widths

**Expected Results**:
- [ ] Content properly centered
- [ ] No excessive whitespace
- [ ] Text remains readable at all sizes
- [ ] Maximum content width enforced

### 1.3 Performance Tests

#### TC-F009: Page Load Performance
**Priority**: High  
**Type**: Performance  
**Steps**:
1. Open Chrome DevTools > Network tab
2. Hard refresh page (Ctrl+Shift+R)
3. Measure load times

**Expected Results**:
- [ ] Initial page load < 3 seconds
- [ ] Largest Contentful Paint (LCP) < 2.5s
- [ ] First Input Delay (FID) < 100ms
- [ ] Cumulative Layout Shift (CLS) < 0.1

#### TC-F010: CSS/JS Bundle Size
**Priority**: Medium  
**Type**: Performance  
**Steps**:
1. Check Network tab for asset sizes
2. Verify code splitting and optimization

**Expected Results**:
- [ ] Main JS bundle < 200KB gzipped
- [ ] CSS bundle < 50KB gzipped
- [ ] Images optimized (WebP where possible)
- [ ] No unused code in bundles

---

## 2. BACKEND API TEST CASES

### 2.1 Authentication API Tests

#### TC-B001: User Registration
**Priority**: Critical  
**Type**: Functional  
**Steps**:
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "username": "newuser",
    "password": "SecurePass123!",
    "firstName": "New",
    "lastName": "User"
  }'
```

**Expected Results**:
- [ ] Returns 201 status code
- [ ] Returns user object without password
- [ ] Returns valid JWT token
- [ ] User created in database
- [ ] Email verification code generated

#### TC-B002: User Login
**Priority**: Critical  
**Type**: Functional  
**Steps**:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser1@example.com",
    "password": "SecurePass123!"
  }'
```

**Expected Results**:
- [ ] Returns 200 status code
- [ ] Returns user object without password
- [ ] Returns valid JWT token
- [ ] Updates lastLoginAt timestamp
- [ ] No sensitive data exposed

#### TC-B003: Email Verification
**Priority**: High  
**Type**: Functional  
**Steps**:
1. Register new user
2. Get verification code from database
3. Verify email with code

```bash
curl -X POST http://localhost:3000/api/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{"code": "VERIFICATION_CODE"}'
```

**Expected Results**:
- [ ] Returns 200 status code
- [ ] Updates emailVerified timestamp
- [ ] Clears verification code from database
- [ ] Returns success message

#### TC-B004: Password Reset Flow
**Priority**: High  
**Type**: Functional  
**Steps**:
1. Request password reset
2. Get reset token from database/email
3. Reset password with token

```bash
# Step 1: Request reset
curl -X POST http://localhost:3000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "testuser1@example.com"}'

# Step 2: Reset password
curl -X POST http://localhost:3000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "RESET_TOKEN",
    "password": "NewSecurePass123!"
  }'
```

**Expected Results**:
- [ ] Password reset request returns 200
- [ ] Reset token generated and stored
- [ ] Password successfully updated
- [ ] Old password no longer works
- [ ] New password works for login

#### TC-B005: Protected Route Access
**Priority**: Critical  
**Type**: Security  
**Steps**:
```bash
# Without token
curl -X GET http://localhost:3000/api/auth/me

# With valid token
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer VALID_JWT_TOKEN"
```

**Expected Results**:
- [ ] Without token returns 401 Unauthorized
- [ ] With valid token returns user data
- [ ] Expired token returns 401
- [ ] Invalid token returns 401

### 2.2 User Management API Tests

#### TC-B006: Get User Profile
**Priority**: High  
**Type**: Functional  
**Steps**:
```bash
curl -X GET http://localhost:3000/api/users/testuser1 \
  -H "Authorization: Bearer VALID_JWT_TOKEN"
```

**Expected Results**:
- [ ] Returns 200 status code
- [ ] Returns complete user profile
- [ ] No sensitive data (password, tokens)
- [ ] Includes follower/following counts
- [ ] Includes post count

#### TC-B007: Update User Profile
**Priority**: High  
**Type**: Functional  
**Steps**:
```bash
curl -X PUT http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer VALID_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "displayName": "Updated Name",
    "bio": "Updated bio text",
    "website": "https://example.com"
  }'
```

**Expected Results**:
- [ ] Returns 200 status code
- [ ] Profile successfully updated
- [ ] Changes reflected in database
- [ ] Updated data returned in response

#### TC-B008: Follow/Unfollow User
**Priority**: Medium  
**Type**: Functional  
**Steps**:
```bash
# Follow user
curl -X POST http://localhost:3000/api/users/testuser2/follow \
  -H "Authorization: Bearer VALID_JWT_TOKEN"

# Unfollow user
curl -X DELETE http://localhost:3000/api/users/testuser2/follow \
  -H "Authorization: Bearer VALID_JWT_TOKEN"
```

**Expected Results**:
- [ ] Follow creates relationship in database
- [ ] Follow returns success message
- [ ] Unfollow removes relationship
- [ ] Cannot follow self (returns error)
- [ ] Cannot follow same user twice

#### TC-B009: User Search
**Priority**: Medium  
**Type**: Functional  
**Steps**:
```bash
curl -X GET "http://localhost:3000/api/users/search?q=test&page=1&limit=10" \
  -H "Authorization: Bearer VALID_JWT_TOKEN"
```

**Expected Results**:
- [ ] Returns matching users
- [ ] Supports pagination
- [ ] Searches username and display name
- [ ] No sensitive data exposed
- [ ] Proper error handling for invalid params

### 2.3 Input Validation Tests

#### TC-B010: Email Validation
**Priority**: High  
**Type**: Security  
**Steps**:
Test registration with various email formats:
- `invalid-email`
- `@example.com`
- `user@`
- `user@domain`
- `valid@example.com`

**Expected Results**:
- [ ] Invalid emails return 400 Bad Request
- [ ] Specific validation error messages
- [ ] Valid email accepts registration
- [ ] No SQL injection possible

#### TC-B011: Password Strength Validation
**Priority**: High  
**Type**: Security  
**Steps**:
Test registration with various passwords:
- `123` (too short)
- `password` (no numbers/special chars)
- `Password123!` (valid)

**Expected Results**:
- [ ] Weak passwords rejected with 400
- [ ] Clear error messages provided
- [ ] Strong passwords accepted
- [ ] Passwords hashed before storage

#### TC-B012: Username Validation
**Priority**: Medium  
**Type**: Functional  
**Steps**:
Test registration with various usernames:
- `ab` (too short)
- `very-long-username-that-exceeds-limit`
- `user@name` (special characters)
- `validuser123` (valid)

**Expected Results**:
- [ ] Invalid usernames rejected
- [ ] Length limits enforced
- [ ] Special character rules enforced
- [ ] Duplicate usernames rejected

### 2.4 Error Handling Tests

#### TC-B013: Database Connection Failure
**Priority**: High  
**Type**: Error Handling  
**Steps**:
1. Stop database server
2. Make API requests
3. Restart database

**Expected Results**:
- [ ] Graceful error responses (500)
- [ ] No sensitive error details exposed
- [ ] Application remains stable
- [ ] Automatic reconnection after DB restart

#### TC-B014: Rate Limiting
**Priority**: Medium  
**Type**: Security  
**Steps**:
1. Make rapid successive requests to auth endpoints
2. Exceed rate limit
3. Wait for rate limit reset

**Expected Results**:
- [ ] Rate limiting enforced (429 Too Many Requests)
- [ ] Rate limit headers included
- [ ] Legitimate requests allowed after reset
- [ ] No application crashes

---

## 3. INTEGRATION TEST CASES

### 3.1 Frontend-Backend Integration

#### TC-I001: End-to-End User Registration
**Priority**: Critical  
**Type**: Integration  
**Steps**:
1. Navigate to frontend
2. Click "Sign Up" (when implemented)
3. Fill registration form
4. Submit and verify backend response

**Expected Results**:
- [ ] Form data correctly sent to backend
- [ ] Backend validation errors displayed
- [ ] Success message shown on valid registration
- [ ] User redirected appropriately

#### TC-I002: Authentication Flow
**Priority**: Critical  
**Type**: Integration  
**Steps**:
1. Login via frontend
2. Verify JWT token storage
3. Make authenticated requests
4. Test token expiration handling

**Expected Results**:
- [ ] JWT token stored securely
- [ ] Authenticated routes accessible
- [ ] Automatic logout on token expiry
- [ ] Refresh token flow works

### 3.2 Database Integration

#### TC-I003: Data Persistence
**Priority**: High  
**Type**: Integration  
**Steps**:
1. Create user via API
2. Restart backend server
3. Verify data persists
4. Update user data
5. Verify changes saved

**Expected Results**:
- [ ] Data survives server restart
- [ ] Updates properly persisted
- [ ] No data corruption
- [ ] Referential integrity maintained

#### TC-I004: Transaction Handling
**Priority**: Medium  
**Type**: Integration  
**Steps**:
1. Create operations that should be atomic
2. Force failure mid-transaction
3. Verify rollback occurred

**Expected Results**:
- [ ] Failed transactions rolled back completely
- [ ] No partial data corruption
- [ ] Database consistency maintained

---

## 4. SECURITY TEST CASES

### 4.1 Authentication Security

#### TC-S001: JWT Security
**Priority**: Critical  
**Type**: Security  
**Steps**:
1. Test with expired JWT tokens
2. Test with modified JWT tokens  
3. Test with invalid signatures
4. Test token exposure in logs

**Expected Results**:
- [ ] Expired tokens rejected
- [ ] Modified tokens rejected
- [ ] Invalid signatures rejected
- [ ] Tokens not logged in plaintext

#### TC-S002: Password Security
**Priority**: Critical  
**Type**: Security  
**Steps**:
1. Verify passwords are hashed
2. Test password comparison
3. Check password in API responses
4. Verify password reset security

**Expected Results**:
- [ ] Passwords never stored in plaintext
- [ ] Proper password hashing (bcrypt)
- [ ] Passwords never in API responses
- [ ] Secure password reset flow

### 4.2 Input Security

#### TC-S003: SQL Injection Prevention
**Priority**: Critical  
**Type**: Security  
**Steps**:
Test various SQL injection payloads in:
- Registration fields
- Login fields  
- Search queries
- Profile updates

**Expected Results**:
- [ ] All inputs properly sanitized
- [ ] Parameterized queries used
- [ ] No SQL errors exposed
- [ ] Database integrity maintained

#### TC-S004: XSS Prevention
**Priority**: High  
**Type**: Security  
**Steps**:
1. Submit HTML/JavaScript in user inputs
2. Verify output encoding
3. Test reflected and stored XSS

**Expected Results**:
- [ ] HTML/JS properly encoded
- [ ] No script execution
- [ ] Safe rendering in frontend
- [ ] Content Security Policy enforced

### 4.3 Authorization Security

#### TC-S005: Access Control
**Priority**: Critical  
**Type**: Security  
**Steps**:
1. Test accessing other users' data
2. Test privilege escalation
3. Verify resource ownership

**Expected Results**:
- [ ] Users can only access own data
- [ ] No unauthorized data access
- [ ] Proper ownership validation
- [ ] Administrative functions protected

---

## 5. PERFORMANCE TEST CASES

### 5.1 Load Testing

#### TC-P001: Concurrent User Load
**Priority**: Medium  
**Type**: Performance  
**Tools**: Apache Bench or Artillery
**Steps**:
```bash
# Test 100 concurrent users
ab -n 1000 -c 100 http://localhost:3000/api/auth/me
```

**Expected Results**:
- [ ] Response time < 500ms under load
- [ ] No errors under normal load
- [ ] Graceful degradation under stress
- [ ] Memory usage remains stable

#### TC-P002: Database Query Performance
**Priority**: Medium  
**Type**: Performance  
**Steps**:
1. Run search queries with large datasets
2. Test pagination performance
3. Monitor database connection pools

**Expected Results**:
- [ ] Search queries < 200ms
- [ ] Pagination efficient
- [ ] Connection pool properly managed
- [ ] No connection leaks

---

## 6. BROWSER COMPATIBILITY TEST CASES

### 6.1 Cross-Browser Testing

#### TC-C001: Chrome Compatibility
**Priority**: High  
**Type**: Compatibility  
**Steps**:
Test all frontend functionality in Chrome (latest)

**Expected Results**:
- [ ] All features work correctly
- [ ] No console errors
- [ ] Proper styling
- [ ] All interactions functional

#### TC-C002: Firefox Compatibility  
**Priority**: Medium  
**Type**: Compatibility  
**Steps**:
Test all frontend functionality in Firefox (latest)

**Expected Results**:
- [ ] All features work correctly
- [ ] No console errors  
- [ ] Proper styling
- [ ] All interactions functional

#### TC-C003: Safari Compatibility
**Priority**: Medium  
**Type**: Compatibility  
**Steps**:
Test all frontend functionality in Safari (latest)

**Expected Results**:
- [ ] All features work correctly
- [ ] No console errors
- [ ] Proper styling  
- [ ] All interactions functional

---

## TEST EXECUTION CHECKLIST

### Pre-Test Setup
- [ ] Environment variables configured
- [ ] Database seeded with test data
- [ ] All services running (Frontend, Backend, Database, Redis)
- [ ] Test accounts created
- [ ] Postman/curl commands ready

### Test Execution Order
1. **Backend Unit Tests** - Run automated Jest tests
2. **Backend API Tests** - Manual API testing
3. **Frontend Component Tests** - Manual UI testing  
4. **Integration Tests** - End-to-end workflows
5. **Security Tests** - Security validation
6. **Performance Tests** - Load and stress testing
7. **Compatibility Tests** - Cross-browser validation

### Post-Test Activities
- [ ] Document all defects found
- [ ] Create GitHub issues for bugs
- [ ] Update test cases based on findings
- [ ] Generate test execution report
- [ ] Sign-off on release readiness

---

## DEFECT TRACKING TEMPLATE

### Bug Report Template
```
**Bug ID**: BUG-YYYY-MM-DD-001
**Title**: Brief description of the issue
**Priority**: Critical/High/Medium/Low  
**Type**: Functional/UI/Performance/Security
**Environment**: Development/Staging/Production

**Steps to Reproduce**:
1. Step 1
2. Step 2
3. Step 3

**Expected Result**: What should happen
**Actual Result**: What actually happened
**Screenshots**: Attach if applicable
**Browser**: Chrome/Firefox/Safari version
**Additional Info**: Any relevant details
```

### Test Results Summary Template
```
**Test Execution Summary**
**Date**: YYYY-MM-DD
**Tester**: Name/Team
**Environment**: Development

**Test Results**:
- Total Test Cases: XXX
- Passed: XXX
- Failed: XXX  
- Blocked: XXX
- Not Executed: XXX

**Pass Rate**: XX%
**Critical Issues**: X
**Blocker Issues**: X
**Release Recommendation**: Go/No-Go
```

---

## AUTOMATED TEST INTEGRATION

### Jest Unit Tests
```bash
# Run all backend tests
cd backend && npm test

# Run with coverage
cd backend && npm test -- --coverage

# Run specific test suite
cd backend && npm test -- authService.test.ts
```

### Frontend Testing Setup
```bash
# Future: Add Cypress or Playwright for E2E tests
cd frontend && npm run test:e2e
```

### CI/CD Integration
- All tests should run on every PR
- Deployment blocked if critical tests fail
- Performance benchmarks tracked over time
- Security scans automated

This comprehensive test suite ensures the SMILE platform maintains high quality standards and catches regressions early in the development cycle.
