import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchProfile = async (userId) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .maybeSingle();
            if (error) throw error;
            setProfile(data);
        } catch (error) {
            console.error('Error fetching user profile:', error);
            setProfile(null);
        }
    };

    useEffect(() => {
        // Get initial session
        const initAuth = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.user) {
                    setUser(session.user);
                    await fetchProfile(session.user.id);
                }
            } catch (error) {
                console.error('Error getting initial session:', error);
            } finally {
                setLoading(false);
            }
        };

        initAuth();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('Auth state changed:', event);
            if (session?.user) {
                setUser(session.user);
                await fetchProfile(session.user.id);
            } else {
                setUser(null);
                setProfile(null);
            }
            setLoading(false);
        });

        return () => {
            subscription?.unsubscribe();
        };
    }, []);

    const login = async (email, password, rememberMe = true) => {
        try {
            if (!email || !password) {
                return { success: false, error: 'Email and password are required' };
            }
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });
            if (error) throw error;
            localStorage.setItem('rememberMe', rememberMe.toString());
            return { success: true, user: data.user };
        } catch (error) {
            console.error('Login error:', error);
            if (error.message.includes('Invalid login')) {
                return { success: false, error: 'Invalid email or password. Please try again.' };
            }
            if (error.message.includes('Email not confirmed')) {
                return { success: false, error: 'Please confirm your email before logging in.' };
            }
            return { success: false, error: error.message || 'Login failed. Please try again.' };
        }
    };

    const register = async (fullName, email, password) => {
        try {
            if (!fullName || !email || !password) {
                return { success: false, error: 'All fields are required' };
            }
            if (password.length < 6) {
                return { success: false, error: 'Password must be at least 6 characters' };
            }
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
            return { success: true, user: data.user, message: 'Registration successful! Please check your email to confirm.' };
        } catch (error) {
            console.error('Registration error:', error);
            if (error.message.includes('already registered')) {
                return { success: false, error: 'This email is already registered. Please login instead.' };
            }
            return { success: false, error: error.message || 'Registration failed. Please try again.' };
        }
    };

    const logout = async () => {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            localStorage.removeItem('darkMode');
            localStorage.removeItem('sidebarCollapsed');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const updateProfile = async (updates) => {
        try {
            if (!user) throw new Error('Not authenticated');
            const { data: dataList, error } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', user.id)
                .select();
            if (error) throw error;
            const data = dataList?.[0] || null;
            setProfile(data);
            return { success: true, data };
        } catch (error) {
            console.error('Error updating profile:', error);
            return { success: false, error: error.message };
        }
    };

    const changePassword = async (newPassword) => {
        try {
            if (!newPassword || newPassword.length < 6) {
                return { success: false, error: 'Password must be at least 6 characters' };
            }
            const { error } = await supabase.auth.updateUser({
                password: newPassword
            });
            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Error changing password:', error);
            return { success: false, error: error.message };
        }
    };

    const forgotPassword = async (email) => {
        try {
            if (!email) {
                return { success: false, error: 'Email is required' };
            }
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`
            });
            if (error) throw error;
            return { success: true, message: 'Password reset link sent!' };
        } catch (error) {
            console.error('Password reset error:', error);
            return { success: false, error: error.message };
        }
    };

    const loginWithGoogle = async () => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: { redirectTo: window.location.origin },
            });
            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Google login error:', error);
            return { success: false, error: error.message };
        }
    };

    // Send a 6-digit OTP to the given email (magic-link OTP mode)
    const sendOtp = async (email) => {
        try {
            if (!email) return { success: false, error: 'Email is required' };
            const { error } = await supabase.auth.signInWithOtp({
                email,
                options: { shouldCreateUser: true }
            });
            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Send OTP error:', error);
            return { success: false, error: error.message };
        }
    };

    // Verify the 6-digit OTP the user received in their email
    const verifyOtp = async (email, token) => {
        try {
            if (!email || !token) return { success: false, error: 'Email and code are required' };
            const { data, error } = await supabase.auth.verifyOtp({
                email,
                token,
                type: 'email'
            });
            if (error) throw error;
            return { success: true, user: data.user };
        } catch (error) {
            console.error('Verify OTP error:', error);
            if (error.message.toLowerCase().includes('expired')) {
                return { success: false, error: 'Code expired — please request a new one.' };
            }
            if (error.message.toLowerCase().includes('invalid')) {
                return { success: false, error: 'Incorrect code. Check your email and try again.' };
            }
            return { success: false, error: error.message };
        }
    };

    const refreshProfile = async () => {
        if (user) {
            await fetchProfile(user.id);
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            profile,
            loading,
            login,
            loginWithGoogle,
            sendOtp,
            verifyOtp,
            register,
            logout,
            updateProfile,
            changePassword,
            forgotPassword,
            refreshProfile
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
