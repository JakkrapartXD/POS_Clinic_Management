# Patient Page Debug Guide

## Issue: Patient data not loading
**Patient ID:** `cmfpdhiyz0002mu080ytbn16k`
**Status:** Loading: false, Fetching: false, Mounted: N/A

## Debugging Steps

### 1. Check Authentication Status
Open browser console and run:
```javascript
// Check if user is authenticated
const token = document.cookie
  .split('; ')
  .find(row => row.startsWith('auth_token='))
  ?.split('=')[1];

console.log('Auth Token:', token ? 'Present' : 'Missing');

// Check user data
const userData = localStorage.getItem('user');
if (userData) {
  const user = JSON.parse(userData);
  console.log('User Data:', user);
  console.log('User Role:', user.role);
} else {
  console.log('User Data: Not found in localStorage');
}
```

### 2. Check Network Requests
1. Open Developer Tools (F12)
2. Go to Network tab
3. Refresh the patient page
4. Look for GraphQL requests to `/graphql`
5. Check if any requests return 401 (Unauthorized) or 403 (Forbidden)

### 3. Test GraphQL API Directly
In browser console:
```javascript
// Test if GraphQL API is available
if (window.GraphQLAPI) {
  console.log('GraphQL API: Available');
  
  // Test patient fetch
  window.GraphQLAPI.getPatient('cmfpdhiyz0002mu080ytbn16k')
    .then(result => {
      console.log('GraphQL Test Success:', result);
    })
    .catch(error => {
      console.error('GraphQL Test Error:', error);
    });
} else {
  console.log('GraphQL API: Not available');
}
```

### 4. Check User Permissions
The patient page requires `patients:read` permission. Check if your user role has this permission:

```javascript
// Check user role and permissions
const userData = localStorage.getItem('user');
if (userData) {
  const user = JSON.parse(userData);
  console.log('User Role:', user.role);
  
  // Check if role has patients:read permission
  const allowedRoles = ['admin', 'doctor', 'staff', 'nurse'];
  const hasPermission = allowedRoles.includes(user.role);
  console.log('Has patients:read permission:', hasPermission);
}
```

### 5. Common Solutions

#### If Authentication Token is Missing:
1. Log out and log back in
2. Clear browser cookies and localStorage
3. Check if the login process is working correctly

#### If User Role Doesn't Have Permission:
1. Check if user role is correctly set in the database
2. Verify role permissions in `/frontend/src/config/role-permissions.ts`

#### If GraphQL API is Not Available:
1. Check if frontend is properly built and running
2. Verify GraphQL client is properly imported
3. Check for JavaScript errors in console

### 6. Backend Debugging
Check backend logs for authentication issues:
```bash
cd /home/jakkrapart/final_project
docker-compose logs backend --tail=20
```

Look for:
- Authentication errors
- GraphQL query errors
- Database connection issues

### 7. Database Check
Verify the patient exists in the database:
```bash
cd /home/jakkrapart/final_project/backend
DATABASE_URL="postgresql://dev_admin:dev1234@localhost:5432/SNClinc?schema=clinic_dev" bunx prisma studio
```

## Expected Behavior
- User should be authenticated with a valid role
- GraphQL requests should include authentication cookies
- Patient data should load successfully
- Page should display patient information and visits

## Next Steps
1. Run the debugging steps above
2. Share the console output and network request details
3. Check if the issue is authentication, permissions, or data-related
