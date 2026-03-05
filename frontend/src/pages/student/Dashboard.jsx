import { useState, useEffect } from 'react';
import { useAuth } from '@context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import {
    BriefcaseIcon,
    DocumentTextIcon,
    CalendarIcon,
    CheckCircleIcon,
} from '@heroicons/react/24/outline';

const StudentDashboard = () => {
    const { userProfile } = useAuth();
    const navigate = useNavigate();
    const [showProfileModal, setShowProfileModal] = useState(false);

    // Show complete-profile modal for new students whose profile isn't completed
    useEffect(() => {
        if (userProfile && userProfile.role === 'student' && userProfile.profileCompleted === false) {
            setShowProfileModal(true);
        }
    }, [userProfile]);

    const stats = [
        { name: 'Applications', value: '0', icon: DocumentTextIcon, color: 'text-blue-600', bg: 'bg-blue-100' },
        { name: 'Interviews', value: '0', icon: CalendarIcon, color: 'text-purple-600', bg: 'bg-purple-100' },
        { name: 'Offers', value: '0', icon: CheckCircleIcon, color: 'text-green-600', bg: 'bg-green-100' },
        { name: 'Jobs Available', value: '0', icon: BriefcaseIcon, color: 'text-orange-600', bg: 'bg-orange-100' },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="page-header">
                    Welcome back, {userProfile?.fullName || 'Student'}!
                </h1>
                <p className="text-gray-600">Here&apos;s your placement dashboard overview</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat) => (
                    <div key={stat.name} className="card p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">{stat.name}</p>
                                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                            </div>
                            <div className={`w-12 h-12 ${stat.bg} rounded-lg flex items-center justify-center`}>
                                <stat.icon className={`w-6 h-6 ${stat.color}`} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Quick Actions */}
            <div className="grid md:grid-cols-2 gap-6">
                <div className="card p-6">
                    <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                    <div className="space-y-3">
                        <Link to="/student/jobs" className="block p-3 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors">
                            <div className="flex items-center space-x-3">
                                <BriefcaseIcon className="w-5 h-5 text-primary-600" />
                                <span className="font-medium text-primary-700">Browse Available Jobs</span>
                            </div>
                        </Link>
                        <Link to="/student/resume" className="block p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                            <div className="flex items-center space-x-3">
                                <DocumentTextIcon className="w-5 h-5 text-blue-600" />
                                <span className="font-medium text-blue-700">Update Resume</span>
                            </div>
                        </Link>
                        <Link to="/student/profile" className="block p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors">
                            <div className="flex items-center space-x-3">
                                <CheckCircleIcon className="w-5 h-5 text-purple-600" />
                                <span className="font-medium text-purple-700">Complete Profile</span>
                            </div>
                        </Link>
                    </div>
                </div>

                <div className="card p-6">
                    <h3 className="text-lg font-semibold mb-4">Recent Applications</h3>
                    <div className="text-center py-8 text-gray-500">
                        <DocumentTextIcon className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                        <p>No applications yet</p>
                        <Link to="/student/jobs" className="text-primary-600 hover:underline mt-2 inline-block">
                            Start applying to jobs
                        </Link>
                    </div>
                </div>
            </div>

            {/* ── Complete Profile Modal ── */}
            {showProfileModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-[modalIn_0.35s_ease-out]">
                        {/* Gradient top strip */}
                        <div className="h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
                        <div className="p-8 text-center">
                            {/* Icon */}
                            <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-5">
                                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-bold text-gray-900">Complete Your Profile</h2>
                            <p className="text-gray-500 mt-2 text-sm leading-relaxed">
                                Recruiters prefer students with complete profiles. Add your skills,
                                projects, and achievements to stand out!
                            </p>

                            <div className="mt-7 flex flex-col gap-3">
                                <button
                                    onClick={() => {
                                        setShowProfileModal(false);
                                        navigate('/student/profile?edit=true');
                                    }}
                                    className="w-full px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-200/50"
                                >
                                    Complete Profile Now
                                </button>
                                <button
                                    onClick={() => setShowProfileModal(false)}
                                    className="w-full px-5 py-2.5 text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors"
                                >
                                    I&apos;ll do it later
                                </button>
                            </div>
                        </div>
                    </div>

                    <style>{`
                        @keyframes modalIn {
                            0% { transform: scale(0.9) translateY(20px); opacity: 0; }
                            100% { transform: scale(1) translateY(0); opacity: 1; }
                        }
                    `}</style>
                </div>
            )}
        </div>
    );
};

export default StudentDashboard;
