import { User } from "@shared/schema";
import { apiRequest, queryClient } from "./queryClient";

/**
 * Register a new user
 */
export async function registerUser(userData: {
  username: string;
  password: string;
  email: string;
  firstName?: string;
  lastName?: string;
}): Promise<User> {
  try {
    const user = await apiRequest<User>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
    
    // Update current user cache
    queryClient.setQueryData(['/api/auth/me'], user);
    
    return user;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
}

/**
 * Login a user
 */
export async function loginUser(credentials: {
  username: string;
  password: string;
}): Promise<User> {
  try {
    const user = await apiRequest<User>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
    
    // Update current user cache
    queryClient.setQueryData(['/api/auth/me'], user);
    
    return user;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}

/**
 * Logout the current user
 */
export async function logoutUser(): Promise<void> {
  try {
    await apiRequest('/api/auth/logout', {
      method: 'POST'
    });
    
    // Clear user from cache
    queryClient.setQueryData(['/api/auth/me'], null);
    
    // Invalidate all user-related queries
    queryClient.invalidateQueries({ queryKey: ['/api/schedules'] });
    queryClient.invalidateQueries({ queryKey: ['/api/logs'] });
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
}

/**
 * Get the current logged in user
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    return await apiRequest<User>('/api/auth/me');
  } catch (error) {
    // If 401 Unauthorized, user is not logged in
    if ((error as any)?.status === 401) {
      return null;
    }
    console.error('Error fetching current user:', error);
    throw error;
  }
}

/**
 * Check if user is logged in
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    const user = await getCurrentUser();
    return !!user;
  } catch (error) {
    return false;
  }
}