const AdminDashboard = () => {
    return (
        <div>
            <h1 className="page-header">Admin Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="card p-6">
                    <h3 className="text-sm text-gray-600 mb-2">Total Students</h3>
                    <p className="text-3xl font-bold">0</p>
                </div>
                <div className="card p-6">
                    <h3 className="text-sm text-gray-600 mb-2">Active Recruiters</h3>
                    <p className="text-3xl font-bold">0</p>
                </div>
                <div className="card p-6">
                    <h3 className="text-sm text-gray-600 mb-2">Placements</h3>
                    <p className="text-3xl font-bold">0</p>
                </div>
                <div className="card p-6">
                    <h3 className="text-sm text-gray-600 mb-2">Active Jobs</h3>
                    <p className="text-3xl font-bold">0</p>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
