const RecruiterDashboard = () => {
  return (
    <div>
      <h1 className="page-header">Recruiter Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6">
          <h3 className="text-sm text-gray-600 mb-2">Active Jobs</h3>
          <p className="text-3xl font-bold">0</p>
        </div>
        <div className="card p-6">
          <h3 className="text-sm text-gray-600 mb-2">Total Applications</h3>
          <p className="text-3xl font-bold">0</p>
        </div>
        <div className="card p-6">
          <h3 className="text-sm text-gray-600 mb-2">Shortlisted</h3>
          <p className="text-3xl font-bold">0</p>
        </div>
      </div>
    </div>
  );
};

export default RecruiterDashboard;
