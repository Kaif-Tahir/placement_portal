import { useAuth } from '@context/AuthContext';
import { Link } from 'react-router-dom';
import {
    BriefcaseIcon,
    DocumentTextIcon,
    CalendarIcon,
    CheckCircleIcon,
} from '@heroicons/react/24/outline';

const StudentDashboard = () => {
    const { userProfile } = useAuth();

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
        </div>
    );
};

export default StudentDashboard;
