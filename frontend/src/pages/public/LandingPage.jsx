import { Link } from 'react-router-dom';
import {
    BriefcaseIcon,
    AcademicCapIcon,
    ChartBarIcon,
    ShieldCheckIcon,
    BoltIcon,
    UsersIcon,
    BuildingOfficeIcon,
    Cog6ToothIcon,
    ArrowRightIcon,
} from '@heroicons/react/24/outline';

const features = [
    {
        name: 'Smart Job Matching',
        description: 'AI-powered job recommendations based on your profile, skills, and preferences.',
        icon: BoltIcon,
    },
    {
        name: 'Real-time Updates',
        description: 'Get instant notifications on application status changes and new opportunities.',
        icon: ChartBarIcon,
    },
    {
        name: 'Transparent Process',
        description: 'Complete visibility into the recruitment pipeline with audit trails.',
        icon: ShieldCheckIcon,
    },
    {
        name: 'Resume Builder',
        description: 'Create professional resumes with industry-standard templates.',
        icon: AcademicCapIcon,
    },
    {
        name: 'Analytics Dashboard',
        description: 'Comprehensive insights into placement trends and hiring patterns.',
        icon: ChartBarIcon,
    },
    {
        name: 'Multi-role Support',
        description: 'Separate dashboards for students, recruiters, and placement administrators.',
        icon: UsersIcon,
    },
];

const portalCards = [
    {
        title: 'Student',
        description: 'Find dream jobs, build your resume, track applications, and prepare for interviews — all in one place.',
        icon: AcademicCapIcon,
        gradient: 'from-blue-500 to-indigo-600',
        hoverGradient: 'from-blue-600 to-indigo-700',
        bgLight: 'bg-blue-50',
        borderColor: 'border-blue-200',
        hoverBorder: 'hover:border-blue-400',
        iconBg: 'bg-blue-100',
        iconColor: 'text-blue-600',
        link: '/register',
        linkLabel: 'Get Started',
        isLogin: false,
    },
    {
        title: 'Recruiter',
        description: 'Post jobs, manage applications, shortlist candidates, and schedule interviews efficiently.',
        icon: BuildingOfficeIcon,
        gradient: 'from-emerald-500 to-teal-600',
        hoverGradient: 'from-emerald-600 to-teal-700',
        bgLight: 'bg-emerald-50',
        borderColor: 'border-emerald-200',
        hoverBorder: 'hover:border-emerald-400',
        iconBg: 'bg-emerald-100',
        iconColor: 'text-emerald-600',
        link: '/register',
        linkLabel: 'Get Started',
        isLogin: false,
    },
    {
        title: 'Admin',
        description: 'Manage the entire placement process — oversee students, recruiters, analytics, and generate reports.',
        icon: Cog6ToothIcon,
        gradient: 'from-purple-500 to-violet-600',
        hoverGradient: 'from-purple-600 to-violet-700',
        bgLight: 'bg-purple-50',
        borderColor: 'border-purple-200',
        hoverBorder: 'hover:border-purple-400',
        iconBg: 'bg-purple-100',
        iconColor: 'text-purple-600',
        link: '/login?role=admin',
        linkLabel: 'Admin Login',
        isLogin: true,
    },
];

const LandingPage = () => {
    return (
        <div className="overflow-hidden">
            {/* Hero Section */}
            <section className="relative py-20 sm:py-32">
                {/* Background decoration */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-100 rounded-full blur-3xl opacity-50" />
                    <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary-100 rounded-full blur-3xl opacity-50" />
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                    <div className="text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 border border-primary-200 text-primary-700 text-sm font-medium mb-6">
                            <BoltIcon className="w-4 h-4" />
                            <span>Powering Smart Campus Placements</span>
                        </div>
                        <h1 className="text-4xl sm:text-5xl md:text-6xl font-display font-bold text-gray-900 mb-6 animate-fade-in">
                            Transform Your Campus
                            <span className="block bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                                Placement Experience
                            </span>
                        </h1>
                        <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
                            CareerOS is the all-in-one platform connecting students, recruiters, and placement cells
                            with real-time collaboration and intelligent automation.
                        </p>
                    </div>

                    {/* Portal Selection Cards */}
                    <div className="max-w-5xl mx-auto">
                        <h2 className="text-center text-lg font-semibold text-gray-500 uppercase tracking-wider mb-8">
                            Choose Your Portal
                        </h2>
                        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
                            {portalCards.map((card) => (
                                <Link
                                    key={card.title}
                                    to={card.link}
                                    className={`group relative rounded-2xl border-2 ${card.borderColor} ${card.hoverBorder} ${card.bgLight} p-8 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 flex flex-col`}
                                >
                                    {/* Icon */}
                                    <div className={`w-14 h-14 ${card.iconBg} rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                                        <card.icon className={`w-7 h-7 ${card.iconColor}`} />
                                    </div>

                                    {/* Content */}
                                    <h3 className="text-2xl font-bold text-gray-900 mb-3">
                                        {card.title}
                                    </h3>
                                    <p className="text-gray-600 leading-relaxed mb-6 flex-1">
                                        {card.description}
                                    </p>

                                    {/* Action Button */}
                                    <div className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r ${card.gradient} text-white font-semibold text-sm group-hover:gap-3 transition-all duration-300 w-fit`}>
                                        {card.linkLabel}
                                        <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                                    </div>

                                    {/* Login badge for admin */}
                                    {card.isLogin && (
                                        <div className="absolute top-4 right-4">
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-medium border border-purple-200">
                                                <ShieldCheckIcon className="w-3.5 h-3.5" />
                                                Authorized Only
                                            </span>
                                        </div>
                                    )}
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Quick sign-in link */}
                    <div className="text-center mt-8">
                        <span className="text-gray-500">Already have an account? </span>
                        <Link to="/login" className="font-semibold text-primary-600 hover:text-primary-700 transition-colors">
                            Sign in here →
                        </Link>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl sm:text-4xl font-display font-bold text-gray-900 mb-4">
                            Everything You Need for Successful Placements
                        </h2>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                            Powerful features designed to streamline the entire recruitment lifecycle
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {features.map((feature) => (
                            <div
                                key={feature.name}
                                className="card p-6 hover:shadow-medium transition-all duration-300 hover:-translate-y-1"
                            >
                                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                                    <feature.icon className="w-6 h-6 text-primary-600" />
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                    {feature.name}
                                </h3>
                                <p className="text-gray-600">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-20 bg-gradient-to-r from-primary-600 to-primary-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-3 gap-8 text-center text-white">
                        <div className="group">
                            <div className="text-5xl font-bold mb-2 group-hover:scale-110 transition-transform duration-300">10K+</div>
                            <div className="text-primary-100 text-lg">Students Placed</div>
                        </div>
                        <div className="group">
                            <div className="text-5xl font-bold mb-2 group-hover:scale-110 transition-transform duration-300">500+</div>
                            <div className="text-primary-100 text-lg">Companies</div>
                        </div>
                        <div className="group">
                            <div className="text-5xl font-bold mb-2 group-hover:scale-110 transition-transform duration-300">95%</div>
                            <div className="text-primary-100 text-lg">Success Rate</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-3xl sm:text-4xl font-display font-bold text-gray-900 mb-4">
                        Ready to Get Started?
                    </h2>
                    <p className="text-xl text-gray-600 mb-8">
                        Join thousands of students and recruiters using CareerOS for smarter hiring
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link to="/register" className="btn-primary btn-lg">
                            Create Your Account
                        </Link>
                        <Link to="/login" className="btn-outline btn-lg">
                            Sign In
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default LandingPage;
