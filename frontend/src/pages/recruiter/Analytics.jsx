import { useState, useEffect, useRef, useMemo } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@config/firebase';
import { useAuth } from '@context/AuthContext';
import { COLLECTIONS, APPLICATION_STATUS, STATUS_LABELS, JOB_TYPE_LABELS } from '@config/constants';

const RecruiterAnalytics = () => {
    const { user } = useAuth();
    const [jobs, setJobs] = useState([]);
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const appUnsubRef = useRef(null);

    // Subscribe to recruiter's jobs
    useEffect(() => {
        if (!user?.uid) return;

        const q = query(
            collection(db, COLLECTIONS.JOBS),
            where('recruiterId', '==', user.uid),
            orderBy('createdAt', 'desc')
        );

        const unsubJobs = onSnapshot(q, (snapshot) => {
            const jobsData = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            setJobs(jobsData);
            setLoading(false);
        });

        return () => unsubJobs();
    }, [user?.uid]);

    // Subscribe to applications for recruiter's jobs
    useEffect(() => {
        if (appUnsubRef.current) {
            appUnsubRef.current();
            appUnsubRef.current = null;
        }

        const jobIds = jobs.map(j => j.id);
        if (jobIds.length === 0) {
            setApplications([]);
            return;
        }

        const chunks = [];
        for (let i = 0; i < jobIds.length; i += 30) {
            chunks.push(jobIds.slice(i, i + 30));
        }

        const unsubscribes = [];
        const allApps = new Map();

        chunks.forEach((chunk) => {
            const q = query(
                collection(db, COLLECTIONS.APPLICATIONS),
                where('jobId', 'in', chunk)
            );

            const unsub = onSnapshot(q, (snapshot) => {
                snapshot.docs.forEach(d => {
                    allApps.set(d.id, { id: d.id, ...d.data() });
                });
                const currentIds = new Set(snapshot.docs.map(d => d.id));
                for (const [key, value] of allApps) {
                    if (chunk.includes(value.jobId) && !currentIds.has(key)) {
                        allApps.delete(key);
                    }
                }
                setApplications(Array.from(allApps.values()));
            });

            unsubscribes.push(unsub);
        });

        appUnsubRef.current = () => unsubscribes.forEach(u => u());
        return () => {
            if (appUnsubRef.current) appUnsubRef.current();
        };
    }, [jobs]);

    // Computed stats
    const stats = useMemo(() => {
        const totalJobs = jobs.length;
        const activeJobs = jobs.filter(j => j.status === 'active').length;
        const closedJobs = jobs.filter(j => j.status === 'closed').length;
        const draftJobs = jobs.filter(j => j.status === 'draft').length;
        const totalApps = applications.length;
        const applied = applications.filter(a => a.status === APPLICATION_STATUS.APPLIED).length;
        const shortlisted = applications.filter(a => a.status === APPLICATION_STATUS.SHORTLISTED).length;
        const interview = applications.filter(a => a.status === APPLICATION_STATUS.INTERVIEW_SCHEDULED).length;
        const selected = applications.filter(a => a.status === APPLICATION_STATUS.SELECTED).length;
        const rejected = applications.filter(a => a.status === APPLICATION_STATUS.REJECTED).length;

        const conversionRate = totalApps > 0 ? ((selected / totalApps) * 100).toFixed(1) : 0;
        const shortlistRate = totalApps > 0 ? ((shortlisted / totalApps) * 100).toFixed(1) : 0;
        const avgAppsPerJob = totalJobs > 0 ? (totalApps / totalJobs).toFixed(1) : 0;

        // Per-job breakdown
        const jobBreakdown = jobs.map(job => {
            const jobApps = applications.filter(a => a.jobId === job.id);
            return {
                ...job,
                totalApps: jobApps.length,
                applied: jobApps.filter(a => a.status === APPLICATION_STATUS.APPLIED).length,
                shortlisted: jobApps.filter(a => a.status === APPLICATION_STATUS.SHORTLISTED).length,
                interview: jobApps.filter(a => a.status === APPLICATION_STATUS.INTERVIEW_SCHEDULED).length,
                selected: jobApps.filter(a => a.status === APPLICATION_STATUS.SELECTED).length,
                rejected: jobApps.filter(a => a.status === APPLICATION_STATUS.REJECTED).length,
            };
        });

        // Job type distribution
        const jobTypeMap = {};
        jobs.forEach(j => {
            const label = JOB_TYPE_LABELS[j.jobType] || j.jobType || 'Other';
            jobTypeMap[label] = (jobTypeMap[label] || 0) + 1;
        });

        // Application timeline (last 7 days)
        const now = new Date();
        const timeline = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            const dayStr = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
            const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
            const dayEnd = new Date(dayStart.getTime() + 86400000);
            const count = applications.filter(a => {
                const appDate = a.createdAt?.toDate?.() || a.appliedAt?.toDate?.() || new Date(a.createdAt || a.appliedAt || 0);
                return appDate >= dayStart && appDate < dayEnd;
            }).length;
            timeline.push({ label: dayStr, count });
        }
        const maxTimelineCount = Math.max(...timeline.map(t => t.count), 1);

        // Branch distribution
        const branchMap = {};
        applications.forEach(a => {
            const branch = a.studentBranch || 'Unknown';
            branchMap[branch] = (branchMap[branch] || 0) + 1;
        });
        const branchData = Object.entries(branchMap).sort((a, b) => b[1] - a[1]).slice(0, 8);

        return {
            totalJobs, activeJobs, closedJobs, draftJobs,
            totalApps, applied, shortlisted, interview, selected, rejected,
            conversionRate, shortlistRate, avgAppsPerJob,
            jobBreakdown, jobTypeMap, timeline, maxTimelineCount, branchData,
        };
    }, [jobs, applications]);

    const pipelineStages = [
        { key: 'applied', label: 'Applied', count: stats.applied, color: 'from-blue-500 to-blue-600', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
        { key: 'shortlisted', label: 'Shortlisted', count: stats.shortlisted, color: 'from-amber-400 to-amber-500', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
        { key: 'interview', label: 'Interview', count: stats.interview, color: 'from-purple-500 to-purple-600', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
        { key: 'selected', label: 'Selected', count: stats.selected, color: 'from-emerald-500 to-emerald-600', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
        { key: 'rejected', label: 'Rejected', count: stats.rejected, color: 'from-red-400 to-red-500', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
    ];

    const branchColors = [
        'bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-amber-500',
        'bg-rose-500', 'bg-cyan-500', 'bg-indigo-500', 'bg-orange-500',
    ];

    const jobTypeColors = [
        'bg-gradient-to-r from-blue-500 to-cyan-500',
        'bg-gradient-to-r from-purple-500 to-pink-500',
        'bg-gradient-to-r from-emerald-500 to-teal-500',
        'bg-gradient-to-r from-amber-500 to-orange-500',
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Recruitment Analytics</h1>
                <p className="text-gray-500 mt-1">Real-time insights into your hiring pipeline</p>
            </div>

            {/* Top KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {[
                    { label: 'Total Jobs', value: stats.totalJobs, icon: '💼', gradient: 'from-blue-500 to-blue-700' },
                    { label: 'Active Jobs', value: stats.activeJobs, icon: '🟢', gradient: 'from-emerald-500 to-emerald-700' },
                    { label: 'Applications', value: stats.totalApps, icon: '📄', gradient: 'from-purple-500 to-purple-700' },
                    { label: 'Shortlisted', value: stats.shortlisted, icon: '⭐', gradient: 'from-amber-500 to-amber-700' },
                    { label: 'Selected', value: stats.selected, icon: '✅', gradient: 'from-green-500 to-green-700' },
                    { label: 'Avg/Job', value: stats.avgAppsPerJob, icon: '📊', gradient: 'from-indigo-500 to-indigo-700' },
                ].map((kpi) => (
                    <div key={kpi.label} className="relative overflow-hidden bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                        <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${kpi.gradient}`}></div>
                        <div className="flex items-center justify-between">
                            <span className="text-2xl">{kpi.icon}</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900 mt-2">{kpi.value}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{kpi.label}</p>
                    </div>
                ))}
            </div>

            {/* Conversion Rates */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-5 text-white">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-blue-100">Shortlist Rate</p>
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                        </div>
                    </div>
                    <p className="text-3xl font-bold mt-2">{stats.shortlistRate}%</p>
                    <p className="text-xs text-blue-200 mt-1">{stats.shortlisted} of {stats.totalApps} applicants</p>
                </div>
                <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-5 text-white">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-emerald-100">Selection Rate</p>
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                    </div>
                    <p className="text-3xl font-bold mt-2">{stats.conversionRate}%</p>
                    <p className="text-xs text-emerald-200 mt-1">{stats.selected} of {stats.totalApps} applicants</p>
                </div>
                <div className="bg-gradient-to-br from-purple-600 to-pink-700 rounded-2xl p-5 text-white">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-purple-100">Interview Rate</p>
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        </div>
                    </div>
                    <p className="text-3xl font-bold mt-2">
                        {stats.totalApps > 0 ? ((stats.interview / stats.totalApps) * 100).toFixed(1) : 0}%
                    </p>
                    <p className="text-xs text-purple-200 mt-1">{stats.interview} of {stats.totalApps} applicants</p>
                </div>
            </div>

            {/* Pipeline Funnel */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-5">Hiring Pipeline</h2>
                <div className="space-y-3">
                    {pipelineStages.map((stage, idx) => {
                        const pct = stats.totalApps > 0 ? (stage.count / stats.totalApps) * 100 : 0;
                        return (
                            <div key={stage.key} className="flex items-center gap-4">
                                <div className="w-28 flex-shrink-0">
                                    <span className={`text-sm font-medium ${stage.text}`}>{stage.label}</span>
                                </div>
                                <div className="flex-1 h-10 bg-gray-100 rounded-xl overflow-hidden relative">
                                    <div
                                        className={`h-full bg-gradient-to-r ${stage.color} rounded-xl transition-all duration-700 ease-out flex items-center`}
                                        style={{ width: `${Math.max(pct, stage.count > 0 ? 4 : 0)}%` }}
                                    >
                                    </div>
                                    <span className="absolute inset-y-0 left-3 flex items-center text-sm font-bold text-gray-700">
                                        {stage.count}
                                    </span>
                                </div>
                                <div className="w-14 text-right">
                                    <span className="text-sm font-semibold text-gray-600">{pct.toFixed(0)}%</span>
                                </div>
                                {idx < pipelineStages.length - 1 && (
                                    <div className="hidden">{/* connector handled by spacing */}</div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Application Trend (Bar Chart) */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-1">Application Trend</h2>
                    <p className="text-xs text-gray-500 mb-5">Last 7 days</p>
                    <div className="flex items-end justify-between gap-2 h-44">
                        {stats.timeline.map((day, idx) => {
                            const heightPct = stats.maxTimelineCount > 0 ? (day.count / stats.maxTimelineCount) * 100 : 0;
                            return (
                                <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                                    <span className="text-xs font-bold text-gray-700">{day.count}</span>
                                    <div className="w-full relative" style={{ height: '120px' }}>
                                        <div
                                            className="absolute bottom-0 w-full rounded-t-lg bg-gradient-to-t from-blue-600 to-cyan-400 transition-all duration-500"
                                            style={{ height: `${Math.max(heightPct, day.count > 0 ? 8 : 2)}%` }}
                                        ></div>
                                    </div>
                                    <span className="text-[10px] text-gray-500 text-center leading-tight">{day.label.split(', ')[0]}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Branch Distribution (Horizontal bar) */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-1">Applicant Branches</h2>
                    <p className="text-xs text-gray-500 mb-5">Top branches by application count</p>
                    {stats.branchData.length === 0 ? (
                        <p className="text-sm text-gray-400 py-8 text-center">No applicant data yet</p>
                    ) : (
                        <div className="space-y-3">
                            {stats.branchData.map(([branch, count], idx) => {
                                const maxBranch = stats.branchData[0][1];
                                const pct = maxBranch > 0 ? (count / maxBranch) * 100 : 0;
                                return (
                                    <div key={branch} className="flex items-center gap-3">
                                        <div className="w-32 flex-shrink-0 truncate text-sm text-gray-700 font-medium">{branch}</div>
                                        <div className="flex-1 h-7 bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${branchColors[idx % branchColors.length]} transition-all duration-500`}
                                                style={{ width: `${Math.max(pct, 6)}%` }}
                                            ></div>
                                        </div>
                                        <span className="text-sm font-bold text-gray-700 w-8 text-right">{count}</span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Job Type Distribution & Job Status */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Job Type Cards */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Job Type Distribution</h2>
                    {Object.keys(stats.jobTypeMap).length === 0 ? (
                        <p className="text-sm text-gray-400 py-8 text-center">No jobs posted yet</p>
                    ) : (
                        <div className="grid grid-cols-2 gap-3">
                            {Object.entries(stats.jobTypeMap).map(([type, count], idx) => (
                                <div key={type} className={`${jobTypeColors[idx % jobTypeColors.length]} rounded-xl p-4 text-white`}>
                                    <p className="text-2xl font-bold">{count}</p>
                                    <p className="text-sm font-medium opacity-90">{type}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Job Status Donut-like */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Job Status Overview</h2>
                    <div className="flex items-center justify-center gap-8">
                        <div className="relative w-40 h-40">
                            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                                {(() => {
                                    const total = stats.totalJobs || 1;
                                    const segments = [
                                        { count: stats.activeJobs, color: '#22c55e' },
                                        { count: stats.closedJobs, color: '#94a3b8' },
                                        { count: stats.draftJobs, color: '#eab308' },
                                    ];
                                    let offset = 0;
                                    return segments.map((seg, i) => {
                                        const pct = (seg.count / total) * 100;
                                        const el = (
                                            <circle
                                                key={i}
                                                cx="18" cy="18" r="15.9155"
                                                fill="none"
                                                stroke={seg.color}
                                                strokeWidth="3.5"
                                                strokeDasharray={`${pct} ${100 - pct}`}
                                                strokeDashoffset={-offset}
                                                strokeLinecap="round"
                                            />
                                        );
                                        offset += pct;
                                        return el;
                                    });
                                })()}
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-2xl font-bold text-gray-900">{stats.totalJobs}</span>
                                <span className="text-xs text-gray-500">Total</span>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-green-500"></span>
                                <span className="text-sm text-gray-600">Active</span>
                                <span className="text-sm font-bold text-gray-900 ml-auto">{stats.activeJobs}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-slate-400"></span>
                                <span className="text-sm text-gray-600">Closed</span>
                                <span className="text-sm font-bold text-gray-900 ml-auto">{stats.closedJobs}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                                <span className="text-sm text-gray-600">Draft</span>
                                <span className="text-sm font-bold text-gray-900 ml-auto">{stats.draftJobs}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Per-Job Breakdown Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 pb-4">
                    <h2 className="text-lg font-semibold text-gray-900">Per-Job Breakdown</h2>
                    <p className="text-xs text-gray-500 mt-1">Detailed application stats for each posting</p>
                </div>
                {stats.jobBreakdown.length === 0 ? (
                    <p className="text-sm text-gray-400 py-8 text-center">No jobs to display</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50 border-y border-gray-100">
                                    <th className="text-left py-3 px-6 font-semibold text-gray-600">Job Title</th>
                                    <th className="text-center py-3 px-3 font-semibold text-gray-600">Status</th>
                                    <th className="text-center py-3 px-3 font-semibold text-blue-600">Applied</th>
                                    <th className="text-center py-3 px-3 font-semibold text-amber-600">Short.</th>
                                    <th className="text-center py-3 px-3 font-semibold text-purple-600">Interview</th>
                                    <th className="text-center py-3 px-3 font-semibold text-emerald-600">Selected</th>
                                    <th className="text-center py-3 px-3 font-semibold text-red-500">Rejected</th>
                                    <th className="text-center py-3 px-3 font-semibold text-gray-600">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {stats.jobBreakdown.map((job) => (
                                    <tr key={job.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="py-3 px-6">
                                            <div className="font-medium text-gray-900 truncate max-w-[200px]">{job.title}</div>
                                            <div className="text-xs text-gray-400">{job.location || 'Remote'}</div>
                                        </td>
                                        <td className="text-center py-3 px-3">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                                job.status === 'active' ? 'bg-green-100 text-green-700' :
                                                job.status === 'closed' ? 'bg-gray-100 text-gray-600' :
                                                'bg-yellow-100 text-yellow-700'
                                            }`}>
                                                {job.status?.charAt(0).toUpperCase() + job.status?.slice(1) || 'Draft'}
                                            </span>
                                        </td>
                                        <td className="text-center py-3 px-3">
                                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 text-blue-700 font-bold text-sm">{job.applied}</span>
                                        </td>
                                        <td className="text-center py-3 px-3">
                                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-amber-50 text-amber-700 font-bold text-sm">{job.shortlisted}</span>
                                        </td>
                                        <td className="text-center py-3 px-3">
                                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-purple-50 text-purple-700 font-bold text-sm">{job.interview}</span>
                                        </td>
                                        <td className="text-center py-3 px-3">
                                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 font-bold text-sm">{job.selected}</span>
                                        </td>
                                        <td className="text-center py-3 px-3">
                                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-red-50 text-red-600 font-bold text-sm">{job.rejected}</span>
                                        </td>
                                        <td className="text-center py-3 px-3">
                                            <span className="font-bold text-gray-900">{job.totalApps}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RecruiterAnalytics;
