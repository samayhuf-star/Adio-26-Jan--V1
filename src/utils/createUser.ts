/**
 * Utility function to create a user in localStorage
 * This matches the format used by Auth.tsx
 */

export function createUser(email: string, password: string, name: string = 'User') {
  try {
    // Get existing users
    const existingUsers = JSON.parse(localStorage.getItem('adiology_users') || '[]');
    
    // Check if user already exists
    const userExists = existingUsers.some((u: any) => 
      u.email.toLowerCase() === email.toLowerCase()
    );
    
    if (userExists) {
      console.log('User already exists:', email);
      return { success: false, message: 'User already exists' };
    }
    
    // Create new user
    const newUser = {
      email: email.toLowerCase().trim(),
      password: password.trim(),
      name: name.trim() || email.split('@')[0],
      createdAt: new Date().toISOString()
    };
    
    // Add to existing users
    existingUsers.push(newUser);
    localStorage.setItem('adiology_users', JSON.stringify(existingUsers));
    
    console.log('✅ User created successfully:', email);
    console.log('Total users:', existingUsers.length);
    
    return { success: true, message: 'User created successfully', user: newUser };
  } catch (error) {
    console.error('Error creating user:', error);
    return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Auto-create user on import (for convenience)
// Commented out to prevent auto-execution and reduce console noise
// Uncomment if you need to auto-create a test user on app load
/*
if (typeof window !== 'undefined') {
  // Create user s@s.com
  const result = createUser('s@s.com', 's@s.com', 'Test User');
  if (result.success) {
    console.log('✅ User s@s.com created successfully!');
  } else {
    console.log('ℹ️', result.message);
  }
}
*/

