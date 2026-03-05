import { createContext, useContext, useState, useEffect } from 'react';
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    sendPasswordResetEmail,
    updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { auth, db } from '@config/firebase';
import { COLLECTIONS } from '@config/constants';
import emailjs from '@emailjs/browser';

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

    // Generate 6-digit OTP
    const generateOTP = () => {
        return Math.floor(100000 + Math.random() * 900000).toString();
    };

    // Send OTP via EmailJS
    const sendOTPEmail = async (email, otp, fullName) => {
        try {
            // EmailJS configuration - replace with your actual service, template, and public key
            const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_id';
            const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'template_id';
            const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'public_key';

            await emailjs.send(serviceId, templateId, {
                to_email: email,
                to_name: fullName,
                otp_code: otp,
                from_name: 'CareerOS',
            }, publicKey);

            return true;
        } catch (err) {
            console.error('Error sending OTP email:', err);
            throw new Error('Failed to send OTP email. Please try again.');
        }
    };

    // Sign up with OTP verification - stores pending registration, creates user only after verification
    const signUpWithOTP = async (email, password, userData) => {
        try {
            setError(null);
            const trimmedEmail = email.trim().toLowerCase();

            // Generate a unique pending registration ID using email hash
            const pendingId = btoa(trimmedEmail + Date.now()).replace(/[^a-zA-Z0-9]/g, '').slice(0, 20);

            // Generate OTP
            const otp = generateOTP();

            // Store pending registration data (user NOT created in Firebase Auth yet)
            await setDoc(doc(db, COLLECTIONS.OTP_VERIFICATION, pendingId), {
                email: trimmedEmail,
                password: password, // Stored temporarily, deleted after verification
                otp: otp,
                role: userData.role,
                fullName: userData.fullName,
                userData: userData,
                createdAt: new Date().toISOString(),
            });

            // Send OTP email
            await sendOTPEmail(trimmedEmail, otp, userData.fullName);

            return { uid: pendingId, email: trimmedEmail };
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    // Verify OTP - creates Firebase Auth user only after successful verification
    const verifyOTP = async (pendingId, enteredOTP) => {
        try {
            setError(null);

            // Fetch pending registration document
            const otpDoc = await getDoc(doc(db, COLLECTIONS.OTP_VERIFICATION, pendingId));

            if (!otpDoc.exists()) {
                throw new Error('OTP not found. Please sign up again.');
            }

            const otpData = otpDoc.data();

            // Check OTP expiry (5 minutes)
            const createdAt = new Date(otpData.createdAt);
            const now = new Date();
            const diffMinutes = (now - createdAt) / (1000 * 60);

            if (diffMinutes > 5) {
                // Delete expired pending registration
                await deleteDoc(doc(db, COLLECTIONS.OTP_VERIFICATION, pendingId));
                throw new Error('OTP expired. Please sign up again.');
            }

            // Verify OTP
            if (otpData.otp !== enteredOTP) {
                throw new Error('Invalid OTP. Please try again.');
            }

            // OTP is valid - NOW create the Firebase Auth user
            const { user: newUser } = await createUserWithEmailAndPassword(
                auth,
                otpData.email,
                otpData.password
            );

            // Update display name
            await updateProfile(newUser, {
                displayName: otpData.fullName,
            });

            const userData = otpData.userData;
            const uid = newUser.uid;

            // Create user document
            await setDoc(doc(db, COLLECTIONS.USERS, uid), {
                uid: uid,
                email: otpData.email,
                fullName: otpData.fullName,
                role: otpData.role,
                verified: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            });

            // Create role-specific document
            if (userData.role === 'student') {
                await setDoc(doc(db, COLLECTIONS.STUDENTS, uid), {
                    uid: uid,
                    ...userData.studentData,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                });
            } else if (userData.role === 'recruiter') {
                await setDoc(doc(db, COLLECTIONS.RECRUITERS, uid), {
                    uid: uid,
                    ...userData.recruiterData,
                    isVerified: false,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                });
            }

            // Delete pending registration document (contains password)
            await deleteDoc(doc(db, COLLECTIONS.OTP_VERIFICATION, pendingId));

            // User is now logged in and verified - no sign out needed
            // Fetch user profile to update context
            await fetchUserProfile(uid);

            return { role: otpData.role, verified: true };
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    // Resend OTP
    const resendOTP = async (pendingId) => {
        try {
            setError(null);

            // Fetch existing pending registration document
            const otpDoc = await getDoc(doc(db, COLLECTIONS.OTP_VERIFICATION, pendingId));

            if (!otpDoc.exists()) {
                throw new Error('Session expired. Please sign up again.');
            }

            const otpData = otpDoc.data();

            // Generate new OTP
            const newOTP = generateOTP();

            // Update OTP in Firestore
            await updateDoc(doc(db, COLLECTIONS.OTP_VERIFICATION, pendingId), {
                otp: newOTP,
                createdAt: new Date().toISOString(),
            });

            // Send new OTP email
            await sendOTPEmail(otpData.email, newOTP, otpData.fullName);

            return true;
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
        signUpWithOTP,
        verifyOTP,
        resendOTP,
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
