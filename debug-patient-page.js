// Debug script for patient page issues
// Run this in the browser console on the patient page

console.log('=== Patient Page Debug Info ===');

// Check if user is authenticated
const token = document.cookie
  .split('; ')
  .find(row => row.startsWith('auth_token='))
  ?.split('=')[1];

console.log('Auth Token:', token ? 'Present' : 'Missing');

// Check current URL and patient ID
const url = window.location.href;
const patientId = url.split('/').pop();
console.log('Current URL:', url);
console.log('Patient ID from URL:', patientId);

// Check if GraphQL client is available
if (window.GraphQLAPI) {
  console.log('GraphQL API: Available');
} else {
  console.log('GraphQL API: Not available');
}

// Check localStorage for user data
const userData = localStorage.getItem('user');
if (userData) {
  const user = JSON.parse(userData);
  console.log('User Data:', user);
  console.log('User Role:', user.role);
} else {
  console.log('User Data: Not found in localStorage');
}

// Check for any error messages in the console
console.log('Check the Network tab for failed GraphQL requests');
console.log('Look for 401 (Unauthorized) or 403 (Forbidden) errors');

// Test GraphQL connection
if (window.GraphQLAPI && patientId) {
  console.log('Testing GraphQL connection...');
  window.GraphQLAPI.getPatient(patientId)
    .then(result => {
      console.log('GraphQL Test Success:', result);
    })
    .catch(error => {
      console.error('GraphQL Test Error:', error);
    });
}
