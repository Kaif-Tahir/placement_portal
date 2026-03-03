import { Link } from 'react-router-dom';
import {
    BriefcaseIcon,
    AcademicCapIcon,
    ChartBarIcon,
    ShieldCheckIcon,
    BoltIcon,
    UsersIcon,
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

const LandingPage = () => {
    return (
        <div className="overflow-hidden">
            {/* Hero Section */}
            <section className="relative py-20 sm:py-32">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <h1 className="text-4xl sm:text-5xl md:text-6xl font-display font-bold text-gray-900 mb-6 animate-fade-in">
                            Transform Your Campus
                            <span className="block text-primary-600">Placement Experience</span>
                        </h1>
                        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
                            CareerOS is the all-in-one platform connecting students, recruiters, and placement cells
                            with real-time collaboration and intelligent automation.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link to="/register" className="btn-primary btn-lg">
                                Get Started Free
                            </Link>
                            <Link to="/login" className="btn-outline btn-lg">
                                Sign In
                            </Link>
                        </div>
                    </div>

                    {/* Hero Image */}
                    <div className="mt-16 relative">
                        <div className="card p-8 bg-gradient-to-br from-primary-50 to-secondary-50">
                            <div className="aspect-video bg-white rounded-lg shadow-lg flex items-center justify-center">
                                <div className="text-center">
                                    <BriefcaseIcon className="w-24 h-24 mx-auto text-primary-600 mb-4" />
                                    <p className="text-gray-600 text-lg">Dashboard Preview</p>
                                </div>
                            </div>
                        </div>
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
                                className="card p-6 hover:shadow-medium transition-shadow"
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
            <section className="py-20 bg-primary-600">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-3 gap-8 text-center text-white">
                        <div>
                            <div className="text-5xl font-bold mb-2">10K+</div>
                            <div className="text-primary-100 text-lg">Students Placed</div>
                        </div>
                        <div>
                            <div className="text-5xl font-bold mb-2">500+</div>
                            <div className="text-primary-100 text-lg">Companies</div>
                        </div>
                        <div>
                            <div className="text-5xl font-bold mb-2">95%</div>
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
                    <Link to="/register" className="btn-primary btn-lg">
                        Create Your Account
                    </Link>
                </div>
            </section>
        </div>
    );
};

export default LandingPage;
