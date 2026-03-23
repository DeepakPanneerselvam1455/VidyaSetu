// Test script for Edge Function
// This is a simple test to verify the Edge Function works

// Test data for the disable-user function
const testData = {
  targetUserId: "test-user-id", // Replace with actual user ID
  disable: true
};

// Example of how to call the Edge Function from frontend
const testEdgeFunction = async () => {
  try {
    // This is how you would call it from your frontend
    const response = await fetch('/functions/v1/disable-user', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${userJWTToken}`, // User's JWT token
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        targetUserId: 'user-uuid-here',
        disable: true
      })
    });
    
    const result = await response.json();
    console.log('Edge Function Response:', result);
  } catch (error) {
    console.error('Error calling Edge Function:', error);
  }
};

console.log('Test script for Edge Function verification');
console.log('Make sure to:');
console.log('1. Set SUPABASE_SERVICE_ROLE_KEY in Edge Function environment');
console.log('2. Set SUPABASE_ANON_KEY in Edge Function environment');
console.log('3. Set SUPABASE_URL in Edge Function environment');
console.log('4. Deploy Edge Functions: supabase functions deploy');
console.log('5. Test with: curl or Postman to /functions/v1/disable-user');