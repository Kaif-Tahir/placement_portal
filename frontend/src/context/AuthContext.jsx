import { createContext, useContext, useState, useEffect } from 'react';
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    sendPasswordResetEmail,
    updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@config/firebase';
import { COLLECTIONS } from '@config/constants';

const AuthContext = createContext({});

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch user profile data
    const fetchUserProfile = async (uid) => {
        try {
            const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, uid));
            if (userDoc.exists()) {
                const userData = userDoc.data();
                let mergedProfile = { ...userData };

                // Fetch role-specific profile
                if (userData.role === 'student') {
                    const studentDoc = await getDoc(doc(db, COLLECTIONS.STUDENTS, uid));
                    if (studentDoc.exists()) {
                        mergedProfile = { ...userData, ...studentDoc.data() };
                    }
                } else if (userData.role === 'recruiter') {
                    const recruiterDoc = await getDoc(doc(db, COLLECTIONS.RECRUITERS, uid));
                    if (recruiterDoc.exists()) {
                        mergedProfile = { ...userData, ...recruiterDoc.data() };
                    }
                }

                const resumeUrl = userData.resumeUrl || mergedProfile?.resume?.url || null;
                const resumeScore = typeof userData.resumeScore === 'number' ? userData.resumeScore : 0;

                setUserProfile({
                    ...mergedProfile,
                    resumeUrl,
                    resumeScore,
                });
            }
        } catch (err) {
            console.error('Error fetching user profile:', err);
            setError(err.message);
        }
    };

    // Sign up
    const signUp = async (email, password, userData) => {
        try {
            setError(null);
            const { user: newUser } = await createUserWithEmailAndPassword(auth, email, password);

            // Update display name
            await updateProfile(newUser, {
                displayName: userData.fullName,
            });

            // Create user document
            await setDoc(doc(db, COLLECTIONS.USERS, newUser.uid), {
                uid: newUser.uid,
                email: newUser.email,
                fullName: userData.fullName,
                role: userData.role,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            });

            // Create role-specific document
            if (userData.role === 'student') {
                await setDoc(doc(db, COLLECTIONS.STUDENTS, newUser.uid), {
                    uid: newUser.uid,
                    ...userData.studentData,
                    profileCompleted: false,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                });
            } else if (userData.role === 'recruiter') {
                await setDoc(doc(db, COLLECTIONS.RECRUITERS, newUser.uid), {
                    uid: newUser.uid,
                    ...userData.recruiterData,
                    isVerified: false,
                    profileCompleted: false,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                });
            }

            // Fetch the user profile immediately after creation
            await fetchUserProfile(newUser.uid);

            return newUser;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    // Sign in
    const signIn = async (email, password) => {
        try {
            setError(null);
            const { user } = await signInWithEmailAndPassword(auth, email, password);
            return user;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    // Sign out
    const signOut = async () => {
        try {
            await firebaseSignOut(auth);
            setUser(null);
            setUserProfile(null);
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    // Reset password
    const resetPassword = async (email) => {
        try {
            await sendPasswordResetEmail(auth, email);
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    // Refresh user profile
    const refreshUserProfile = async () => {
        if (user) {
            await fetchUserProfile(user.uid);
        }
    };

    // Listen to auth state changes
    useEffect(() => {
        let mounted = true;
        
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (mounted) {
                setUser(user);
                if (user) {
                    await fetchUserProfile(user.uid);
                } else {
                    setUserProfile(null);
                }
                setLoading(false);
            }
        });

        return () => {
            mounted = false;
            unsubscribe();
        };
    }, []);

    const value = {
        user,
        userProfile,
        loading,
        error,
        signUp,
        signIn,
        signOut,
        resetPassword,
        refreshUserProfile,
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
