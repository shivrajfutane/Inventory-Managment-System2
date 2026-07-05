/**
 * ============================================================
 * AUTHENTICATION MODULE
 * ============================================================
 * Handles all authentication operations including login,
 * registration, logout, session management, and route protection.
 * 
 * This module depends on supabase.js for the Supabase client.
 * ============================================================
 */

import { supabase, getCurrentUser, getSession, onAuthStateChange } from './supabase.js';
import { showToast } from './app.js';

/**
 * Register a new user
 * @param {string} fullName - User's full name
 * @param {string} email - User's email address
 * @param {string} password - User's password
 * @returns {Promise<Object>} Result object with success flag and message
 */
async function register(fullName, email, password) {
    try {
        // Validate inputs
        if (!fullName || !email || !password) {
            return { success: false, error: 'All fields are required' };
        }

        if (password.length < 6) {
            return { success: false, error: 'Password must be at least 6 characters' };
        }

        // Create the user in Supabase Auth
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName
                }
            }
        });

        if (error) throw error;

        // The profile will be created automatically by the database trigger
        // we set up in the SQL schema (handle_new_user function)

        showToast('Registration successful! Please check your email to confirm your account.', 'success');
        
        return { 
            success: true, 
            message: 'Registration successful! Please check your email.',
            user: data.user 
        };
    } catch (error) {
        console.error('Registration error:', error);
        
        // Handle specific Supabase errors
        if (error.message.includes('already registered')) {
            return { success: false, error: 'This email is already registered. Please login instead.' };
        }
        
        return { success: false, error: error.message || 'Registration failed. Please try again.' };
    }
}

/**
 * Login an existing user
 * @param {string} email - User's email address
 * @param {string} password - User's password
 * @param {boolean} rememberMe - Whether to persist session
 * @returns {Promise<Object>} Result object with success flag
 */
async function login(email, password, rememberMe = true) {
    try {
        // Validate inputs
        if (!email || !password) {
            return { success: false, error: 'Email and password are required' };
        }

        // Attempt login
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
            options: {
                // Set session persistence based on remember me
                // Note: Supabase handles this automatically
            }
        });

        if (error) throw error;

        // Store remember me preference
        localStorage.setItem('rememberMe', rememberMe.toString());
        
        showToast('Login successful! Welcome back.', 'success');
        
        return { 
            success: true, 
            user: data.user,
            session: data.session 
        };
    } catch (error) {
        console.error('Login error:', error);
        
        // Handle specific errors
        if (error.message.includes('Invalid login')) {
            return { success: false, error: 'Invalid email or password. Please try again.' };
        }
        if (error.message.includes('Email not confirmed')) {
            return { success: false, error: 'Please confirm your email before logging in.' };
        }
        
        return { success: false, error: error.message || 'Login failed. Please try again.' };
    }
}

/**
 * Logout the current user
 * Clears all session data and redirects to login page
 */
async function logout() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;

        // Clear local storage items related to the app
        localStorage.removeItem('darkMode');
        localStorage.removeItem('sidebarCollapsed');
        
        showToast('You have been logged out successfully.', 'info');
        
        // Redirect to login page
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 500);
    } catch (error) {
        console.error('Logout error:', error);
        showToast('Error logging out. Please try again.', 'error');
    }
}

/**
 * Check if user is authenticated
 * Redirects to login page if not authenticated
 * @returns {Promise<boolean>} True if authenticated
 */
async function requireAuth() {
    try {
        const user = await getCurrentUser();
        
        if (!user) {
            // Not authenticated, redirect to login
            const currentPage = window.location.pathname.split('/').pop() || 'index.html';
            sessionStorage.setItem('redirectAfterLogin', currentPage);
            window.location.href = 'login.html';
            return false;
        }
        
        return true;
    } catch (error) {
        console.error('Auth check error:', error);
        window.location.href = 'login.html';
        return false;
    }
}

/**
 * Redirect authenticated users away from auth pages
 * Used on login/register pages to redirect if already logged in
 */
async function redirectIfAuthenticated() {
    try {
        const user = await getCurrentUser();
        
        if (user) {
            // User is already logged in, redirect to dashboard
            const redirectPage = sessionStorage.getItem('redirectAfterLogin') || 'index.html';
            sessionStorage.removeItem('redirectAfterLogin');
            window.location.href = redirectPage;
        }
    } catch (error) {
        console.error('Redirect check error:', error);
    }
}

/**
 * Get the current user's profile data from the profiles table
 * @returns {Promise<Object|null>} Profile data or null
 */
async function getUserProfile() {
    try {
        const user = await getCurrentUser();
        if (!user) return null;

        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (error) throw error;
        
        return data;
    } catch (error) {
        console.error('Error fetching profile:', error);
        return null;
    }
}

/**
 * Update the current user's profile
 * @param {Object} updates - Object containing fields to update
 * @returns {Promise<Object>} Result with success flag
 */
async function updateProfile(updates) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return { success: false, error: 'Not authenticated' };
        }

        const { data, error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', user.id)
            .select()
            .single();

        if (error) throw error;
        
        showToast('Profile updated successfully!', 'success');
        return { success: true, data };
    } catch (error) {
        console.error('Error updating profile:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Change user password
 * @param {string} newPassword - New password
 * @returns {Promise<Object>} Result with success flag
 */
async function changePassword(newPassword) {
    try {
        if (!newPassword || newPassword.length < 6) {
            return { success: false, error: 'Password must be at least 6 characters' };
        }

        const { error } = await supabase.auth.updateUser({
            password: newPassword
        });

        if (error) throw error;
        
        showToast('Password changed successfully!', 'success');
        return { success: true };
    } catch (error) {
        console.error('Error changing password:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Send password reset email
 * @param {string} email - User's email address
 * @returns {Promise<Object>} Result with success flag
 */
async function forgotPassword(email) {
    try {
        if (!email) {
            return { success: false, error: 'Email is required' };
        }

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password.html`
        });

        if (error) throw error;
        
        showToast('Password reset link sent! Check your email.', 'success');
        return { success: true, message: 'Password reset link sent!' };
    } catch (error) {
        console.error('Password reset error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Initialize auth state monitoring
 * Sets up listener for auth state changes
 */
function initAuthState() {
    onAuthStateChange((event, session) => {
        console.log('Auth state changed:', event);
        
        switch (event) {
            case 'SIGNED_IN':
                // User signed in - page will handle refresh
                break;
            case 'SIGNED_OUT':
                // User signed out
                window.location.href = 'login.html';
                break;
            case 'USER_UPDATED':
                // User data updated
                break;
            case 'TOKEN_REFRESHED':
                // Token was refreshed automatically
                break;
            case 'PASSWORD_RECOVERY':
                // Password recovery flow initiated
                break;
        }
    });
}

/**
 * Display user info in the UI (avatar, name, etc.)
 * Call this on page load for authenticated pages
 */
async function displayUserInfo() {
    try {
        const profile = await getUserProfile();
        const user = await getCurrentUser();
        
        // Update user name displays
        const userNameElements = document.querySelectorAll('[data-user-name]');
        userNameElements.forEach(el => {
            el.textContent = profile?.full_name || user?.email?.split('@')[0] || 'User';
        });
        
        // Update user email displays
        const userEmailElements = document.querySelectorAll('[data-user-email]');
        userEmailElements.forEach(el => {
            el.textContent = user?.email || '';
        });
        
        // Update avatar
        const avatarElements = document.querySelectorAll('[data-user-avatar]');
        avatarElements.forEach(el => {
            if (profile?.avatar_url) {
                el.src = profile.avatar_url;
                el.style.display = 'block';
            } else {
                // Show initials fallback
                const initials = (profile?.full_name || user?.email || 'U')
                    .split(' ')
                    .map(n => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2);
                el.style.display = 'none';
                const parent = el.parentElement;
                if (parent && !parent.querySelector('.avatar-initials')) {
                    const initialsEl = document.createElement('span');
                    initialsEl.className = 'avatar-initials';
                    initialsEl.textContent = initials;
                    parent.appendChild(initialsEl);
                }
            }
        });
        
        // Update role badge
        const roleElements = document.querySelectorAll('[data-user-role]');
        roleElements.forEach(el => {
            const role = profile?.role || 'user';
            el.textContent = role.charAt(0).toUpperCase() + role.slice(1);
        });
        
        // Handle admin links
        const role = profile?.role || 'user';
        const adminElements = document.querySelectorAll('[data-admin-only]');
        adminElements.forEach(el => {
            if (role === 'admin') {
                el.style.display = '';
            } else {
                el.style.display = 'none';
            }
        });
        
    } catch (error) {
        console.error('Error displaying user info:', error);
    }
}

/**
 * Require admin role for a page
 * @returns {Promise<boolean>} True if user is admin
 */
async function requireAdmin() {
    try {
        const isAuth = await requireAuth();
        if (!isAuth) return false;
        
        const profile = await getUserProfile();
        if (!profile || profile.role !== 'admin') {
            showToast('Access denied. Admin privileges required.', 'error');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
            return false;
        }
        
        return true;
    } catch (error) {
        console.error('Admin check error:', error);
        window.location.href = 'index.html';
        return false;
    }
}

// Export all functions
export {
    register,
    login,
    logout,
    requireAuth,
    redirectIfAuthenticated,
    getUserProfile,
    updateProfile,
    changePassword,
    forgotPassword,
    initAuthState,
    displayUserInfo,
    requireAdmin
};
