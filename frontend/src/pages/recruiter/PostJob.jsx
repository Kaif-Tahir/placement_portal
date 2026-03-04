import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@config/firebase';
import { COLLECTIONS, STORAGE_PATHS, JOB_TYPES, WORK_MODES, JOB_TYPE_LABELS } from '@config/constants';
import { useAuth } from '@context/AuthContext';

// Constants for form options
const DEPARTMENTS = [
    'Engineering',
    'Product',
    'Design',
    'Marketing',
    'Sales',
    'Human Resources',
    'Finance',
    'Operations',
    'Data Science',
    'Customer Success',
];

const BRANCHES = [
    'Computer Science',
    'Information Technology',
    'Electronics',
    'Electrical',
    'Mechanical',
    'Civil',
    'Chemical',
    'Biotechnology',
    'MBA',
    'MCA',
];

const SELECTION_PROCESS_OPTIONS = [
    'Resume Screening',
    'Online Assessment',
    'Technical Interview',
    'HR Interview',
    'Group Discussion',
    'Case Study',
    'Coding Round',
    'System Design',
    'Final Interview',
];

const SALARY_TYPES = [
    { value: 'monthly', label: 'Monthly' },
    { value: 'yearly', label: 'Yearly' },
    { value: 'stipend', label: 'Stipend (Internship)' },
];

const INTERVIEW_MODES = [
    { value: 'online', label: 'Online' },
    { value: 'offline', label: 'Offline / In-Person' },
    { value: 'hybrid', label: 'Hybrid' },
];

const DEFAULT_WORKFLOW_STAGES = [
    'Applied',
    'Shortlisted',
    'Interview Scheduled',
    'Selected',
    'Rejected',
];

const PostJob = () => {
    const navigate = useNavigate();
    const { user, userProfile } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState({ jd: false, brochure: false });
    const [attachments, setAttachments] = useState({ jobDescriptionPDF: null, companyBrochure: null });
    const [submitError, setSubmitError] = useState(null);
    const [submitSuccess, setSubmitSuccess] = useState(false);

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
    } = useForm({
        defaultValues: {
            jobTitle: '',
            companyName: userProfile?.companyName || '',
            jobType: JOB_TYPES.FULL_TIME,
            workMode: WORK_MODES.ONSITE,
            location: '',
            department: '',
            openings: 1,
            roleOverview: '',
            responsibilities: '',
            requiredSkills: '',
            preferredSkills: '',
            technologies: '',
            qualification: '',
            experience: '',
            internshipDuration: '',
            salaryType: 'yearly',
            salaryAmount: '',
            bonus: '',
            ppoAvailable: false,
            minCGPA: '',
            branches: [],
            passingYear: new Date().getFullYear(),
            backlogAllowed: false,
            requiredSkillTags: '',
            certifications: '',
            portfolioRequired: false,
            deadline: '',
            selectionProcess: [],
            resumeRequired: true,
            coverLetterRequired: false,
            interviewMode: 'online',
            interviewLink: '',
            interviewDate: '',
            workflowStages: DEFAULT_WORKFLOW_STAGES,
        },
    });

    const watchJobType = watch('jobType');

    // Redirect if not a recruiter
    useEffect(() => {
        if (userProfile && userProfile.role !== 'recruiter') {
            navigate('/dashboard');
        }
    }, [userProfile, navigate]);

    // Auto-fill company name from user profile
    useEffect(() => {
        if (userProfile?.companyName) {
            setValue('companyName', userProfile.companyName);
        }
    }, [userProfile, setValue]);

    // Handle file uploads to Firebase Storage
    const uploadFile = async (file, path) => {
        if (!file) return null;
        const storageRef = ref(storage, `${STORAGE_PATHS.JOB_ATTACHMENTS}/${path}/${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file);
        return await getDownloadURL(storageRef);
    };

    // Handle file selection
    const handleFileChange = (e, type) => {
        const file = e.target.files[0];
        if (file) {
            setAttachments((prev) => ({ ...prev, [type]: file }));
        }
    };

    // Form submission handler
    const onSubmit = async (data, isDraft = false) => {
        setIsSubmitting(true);
        setSubmitError(null);
        setSubmitSuccess(false);

        try {
            setIsUploading(true);
            let attachmentUrls = {};

            // Upload job description PDF
            if (attachments.jobDescriptionPDF) {
                setUploadProgress((prev) => ({ ...prev, jd: true }));
                attachmentUrls.jobDescriptionPDF = await uploadFile(
                    attachments.jobDescriptionPDF,
                    `${user.uid}/job-descriptions`
                );
                setUploadProgress((prev) => ({ ...prev, jd: false }));
            }

            // Upload company brochure
            if (attachments.companyBrochure) {
                setUploadProgress((prev) => ({ ...prev, brochure: true }));
                attachmentUrls.companyBrochure = await uploadFile(
                    attachments.companyBrochure,
                    `${user.uid}/brochures`
                );
                setUploadProgress((prev) => ({ ...prev, brochure: false }));
            }

            setIsUploading(false);

            // Prepare job document
            const jobDocument = {
                recruiterId: user.uid,
                companyName: data.companyName,
                title: data.jobTitle,
                jobType: data.jobType,
                workMode: data.workMode,
                location: data.location,
                department: data.department,
                openings: parseInt(data.openings, 10) || 1,

                description: {
                    roleOverview: data.roleOverview,
                    responsibilities: data.responsibilities,
                    requiredSkills: data.requiredSkills,
                    preferredSkills: data.preferredSkills,
                    technologies: data.technologies,
                    qualification: data.qualification,
                    experience: data.experience,
                    ...(data.jobType === JOB_TYPES.INTERNSHIP && {
                        internshipDuration: data.internshipDuration,
                    }),
                },

                eligibility: {
                    minCGPA: parseFloat(data.minCGPA) || 0,
                    branches: data.branches || [],
                    passingYear: parseInt(data.passingYear, 10),
                    backlogAllowed: data.backlogAllowed,
                    requiredSkillTags: data.requiredSkillTags
                        ? data.requiredSkillTags.split(',').map((s) => s.trim())
                        : [],
                    certifications: data.certifications
                        ? data.certifications.split(',').map((s) => s.trim())
                        : [],
                    portfolioRequired: data.portfolioRequired,
                },

                salary: {
                    type: data.salaryType,
                    amount: data.salaryAmount,
                    bonus: data.bonus,
                    ppoAvailable: data.ppoAvailable,
                },

                applicationSettings: {
                    deadline: data.deadline,
                    selectionProcess: data.selectionProcess || [],
                    resumeRequired: data.resumeRequired,
                    coverLetterRequired: data.coverLetterRequired,
                },

                interviewSettings: {
                    mode: data.interviewMode,
                    link: data.interviewLink,
                    date: data.interviewDate,
                },

                workflowStages: data.workflowStages || DEFAULT_WORKFLOW_STAGES,

                attachments: attachmentUrls,

                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                status: isDraft ? 'draft' : 'active',
            };

            // Save to Firestore
            await addDoc(collection(db, COLLECTIONS.JOBS), jobDocument);

            setSubmitSuccess(true);
            setTimeout(() => {
                navigate('/recruiter/manage-jobs');
            }, 1500);
        } catch (error) {
            console.error('Error posting job:', error);
            setSubmitError(error.message || 'Failed to post job. Please try again.');
        } finally {
            setIsSubmitting(false);
            setIsUploading(false);
        }
    };

    // Section Card Component
    const SectionCard = ({ title, children, icon }) => (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    {icon && <span className="text-blue-600">{icon}</span>}
                    {title}
                </h2>
            </div>
            <div className="p-6">{children}</div>
        </div>
    );

    // Input Field Component
    const InputField = ({ label, name, type = 'text', required, placeholder, disabled, ...rest }) => (
        <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <input
                type={type}
                {...register(name, { required: required && `${label} is required` })}
                placeholder={placeholder}
                disabled={disabled}
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
                    } ${errors[name] ? 'border-red-500' : 'border-gray-300'}`}
                {...rest}
            />
            {errors[name] && <p className="text-sm text-red-500">{errors[name].message}</p>}
        </div>
    );

    // Textarea Field Component
    const TextareaField = ({ label, name, required, placeholder, rows = 4 }) => (
        <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <textarea
                {...register(name, { required: required && `${label} is required` })}
                placeholder={placeholder}
                rows={rows}
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none ${errors[name] ? 'border-red-500' : 'border-gray-300'
                    }`}
            />
            {errors[name] && <p className="text-sm text-red-500">{errors[name].message}</p>}
        </div>
    );

    // Select Field Component
    const SelectField = ({ label, name, options, required }) => (
        <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <select
                {...register(name, { required: required && `${label} is required` })}
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white ${errors[name] ? 'border-red-500' : 'border-gray-300'
                    }`}
            >
                <option value="">Select {label}</option>
                {options.map((opt) => (
                    <option key={opt.value || opt} value={opt.value || opt}>
                        {opt.label || opt}
                    </option>
                ))}
            </select>
            {errors[name] && <p className="text-sm text-red-500">{errors[name].message}</p>}
        </div>
    );

    // Checkbox Field Component
    const CheckboxField = ({ label, name }) => (
        <label className="flex items-center gap-3 cursor-pointer">
            <input
                type="checkbox"
                {...register(name)}
                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">{label}</span>
        </label>
    );

    // Multi-Select Field Component
    const MultiSelectField = ({ label, name, options, required }) => {
        const selectedValues = watch(name) || [];

        const toggleOption = (option) => {
            const newValues = selectedValues.includes(option)
                ? selectedValues.filter((v) => v !== option)
                : [...selectedValues, option];
            setValue(name, newValues);
        };

        return (
            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
                <div className="flex flex-wrap gap-2">
                    {options.map((option) => (
                        <button
                            key={option}
                            type="button"
                            onClick={() => toggleOption(option)}
                            className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${selectedValues.includes(option)
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                                }`}
                        >
                            {option}
                        </button>
                    ))}
                </div>
                {required && selectedValues.length === 0 && errors[name] && (
                    <p className="text-sm text-red-500">Please select at least one option</p>
                )}
            </div>
        );
    };

    if (!userProfile) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="pb-24">
            {/* Page Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Post New Job</h1>
                <p className="text-gray-600 mt-1">Create a new job or internship posting for candidates</p>
            </div>

            {/* Success/Error Messages */}
            {submitSuccess && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
                    <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                        />
                    </svg>
                    <span className="text-green-800">Job posted successfully! Redirecting...</span>
                </div>
            )}

            {submitError && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
                    <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                        <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clipRule="evenodd"
                        />
                    </svg>
                    <span className="text-red-800">{submitError}</span>
                </div>
            )}

            <form onSubmit={handleSubmit((data) => onSubmit(data, false))} className="space-y-6">
                {/* Section 1: Basic Job Information */}
                <SectionCard
                    title="Basic Job Information"
                    icon={
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                            />
                        </svg>
                    }
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <InputField
                            label="Job Title"
                            name="jobTitle"
                            required
                            placeholder="e.g., Software Engineer"
                        />
                        <InputField
                            label="Company Name"
                            name="companyName"
                            required
                            disabled
                            placeholder="Company Name"
                        />
                        <SelectField
                            label="Job Type"
                            name="jobType"
                            required
                            options={[
                                { value: JOB_TYPES.FULL_TIME, label: JOB_TYPE_LABELS[JOB_TYPES.FULL_TIME] },
                                { value: JOB_TYPES.INTERNSHIP, label: JOB_TYPE_LABELS[JOB_TYPES.INTERNSHIP] },
                                { value: JOB_TYPES.PART_TIME, label: JOB_TYPE_LABELS[JOB_TYPES.PART_TIME] },
                                { value: JOB_TYPES.CONTRACT, label: JOB_TYPE_LABELS[JOB_TYPES.CONTRACT] },
                            ]}
                        />
                        <SelectField
                            label="Work Mode"
                            name="workMode"
                            required
                            options={[
                                { value: WORK_MODES.ONSITE, label: 'On-site' },
                                { value: WORK_MODES.REMOTE, label: 'Remote' },
                                { value: WORK_MODES.HYBRID, label: 'Hybrid' },
                            ]}
                        />
                        <InputField label="Location" name="location" required placeholder="e.g., Bangalore, India" />
                        <SelectField label="Department" name="department" required options={DEPARTMENTS} />
                        <InputField label="Number of Openings" name="openings" type="number" required placeholder="1" />
                    </div>
                </SectionCard>

                {/* Section 2: Job Description */}
                <SectionCard
                    title="Job Description"
                    icon={
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                        </svg>
                    }
                >
                    <div className="space-y-6">
                        <TextareaField
                            label="Role Overview"
                            name="roleOverview"
                            required
                            placeholder="Provide a brief overview of the role and its impact..."
                            rows={3}
                        />
                        <TextareaField
                            label="Key Responsibilities"
                            name="responsibilities"
                            required
                            placeholder="List the key responsibilities for this role..."
                            rows={4}
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <TextareaField
                                label="Required Skills"
                                name="requiredSkills"
                                required
                                placeholder="List the required skills..."
                                rows={3}
                            />
                            <TextareaField
                                label="Preferred Skills"
                                name="preferredSkills"
                                placeholder="List any nice-to-have skills..."
                                rows={3}
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <TextareaField
                                label="Technologies / Tools"
                                name="technologies"
                                placeholder="e.g., React, Node.js, AWS, Docker..."
                                rows={2}
                            />
                            <TextareaField
                                label="Qualification"
                                name="qualification"
                                placeholder="e.g., B.Tech/B.E. in CS/IT"
                                rows={2}
                            />
                        </div>
                        <InputField label="Experience Required" name="experience" placeholder="e.g., 0-2 years" />
                        {watchJobType === JOB_TYPES.INTERNSHIP && (
                            <InputField
                                label="Internship Duration"
                                name="internshipDuration"
                                required
                                placeholder="e.g., 3 months, 6 months"
                            />
                        )}
                    </div>
                </SectionCard>

                {/* Section 3: Salary Details */}
                <SectionCard
                    title="Salary Details"
                    icon={
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                    }
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <SelectField label="Salary Type" name="salaryType" options={SALARY_TYPES} />
                        <InputField
                            label="Salary Amount"
                            name="salaryAmount"
                            placeholder="e.g., ₹8,00,000 or ₹25,000/month"
                        />
                        <InputField label="Bonus / Incentives" name="bonus" placeholder="e.g., Performance bonus" />
                        <div className="flex items-end pb-2">
                            <CheckboxField label="PPO Available (for internships)" name="ppoAvailable" />
                        </div>
                    </div>
                </SectionCard>

                {/* Section 4: Eligibility */}
                <SectionCard
                    title="Eligibility Criteria"
                    icon={
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                            />
                        </svg>
                    }
                >
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <InputField
                                label="Minimum CGPA"
                                name="minCGPA"
                                type="number"
                                placeholder="e.g., 6.0"
                            />
                            <InputField
                                label="Passing Year"
                                name="passingYear"
                                type="number"
                                placeholder={new Date().getFullYear().toString()}
                            />
                            <div className="flex items-end pb-2">
                                <CheckboxField label="Backlogs Allowed" name="backlogAllowed" />
                            </div>
                        </div>
                        <MultiSelectField label="Eligible Branches" name="branches" options={BRANCHES} />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <InputField
                                label="Required Skill Tags"
                                name="requiredSkillTags"
                                placeholder="e.g., JavaScript, Python, SQL (comma separated)"
                            />
                            <InputField
                                label="Certifications"
                                name="certifications"
                                placeholder="e.g., AWS Certified, Coursera Certificate (comma separated)"
                            />
                        </div>
                        <CheckboxField label="Portfolio Required" name="portfolioRequired" />
                    </div>
                </SectionCard>

                {/* Section 5: Application Settings */}
                <SectionCard
                    title="Application Settings"
                    icon={
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                            />
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                        </svg>
                    }
                >
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <InputField label="Application Deadline" name="deadline" type="date" required />
                            <div className="flex items-end gap-6 pb-2">
                                <CheckboxField label="Resume Required" name="resumeRequired" />
                                <CheckboxField label="Cover Letter Required" name="coverLetterRequired" />
                            </div>
                        </div>
                        <MultiSelectField
                            label="Selection Process"
                            name="selectionProcess"
                            options={SELECTION_PROCESS_OPTIONS}
                        />
                    </div>
                </SectionCard>

                {/* Section 6: Interview Settings */}
                <SectionCard
                    title="Interview Settings"
                    icon={
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                            />
                        </svg>
                    }
                >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <SelectField label="Interview Mode" name="interviewMode" options={INTERVIEW_MODES} />
                        <InputField
                            label="Interview Link"
                            name="interviewLink"
                            placeholder="e.g., https://meet.google.com/..."
                        />
                        <InputField label="Tentative Interview Date" name="interviewDate" type="date" />
                    </div>
                </SectionCard>

                {/* Section 7: Attachments */}
                <SectionCard
                    title="Attachments"
                    icon={
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                            />
                        </svg>
                    }
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">Job Description PDF</label>
                            <div className="flex items-center gap-4">
                                <label className="flex-1 flex items-center justify-center px-4 py-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
                                    <div className="text-center">
                                        <svg
                                            className="mx-auto h-8 w-8 text-gray-400"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                            />
                                        </svg>
                                        <p className="mt-1 text-sm text-gray-600">
                                            {attachments.jobDescriptionPDF
                                                ? attachments.jobDescriptionPDF.name
                                                : 'Click to upload JD (PDF)'}
                                        </p>
                                    </div>
                                    <input
                                        type="file"
                                        accept=".pdf"
                                        onChange={(e) => handleFileChange(e, 'jobDescriptionPDF')}
                                        className="hidden"
                                    />
                                </label>
                            </div>
                            {uploadProgress.jd && (
                                <p className="text-sm text-blue-600">Uploading JD...</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">Company Brochure</label>
                            <div className="flex items-center gap-4">
                                <label className="flex-1 flex items-center justify-center px-4 py-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
                                    <div className="text-center">
                                        <svg
                                            className="mx-auto h-8 w-8 text-gray-400"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                            />
                                        </svg>
                                        <p className="mt-1 text-sm text-gray-600">
                                            {attachments.companyBrochure
                                                ? attachments.companyBrochure.name
                                                : 'Click to upload Brochure (PDF)'}
                                        </p>
                                    </div>
                                    <input
                                        type="file"
                                        accept=".pdf"
                                        onChange={(e) => handleFileChange(e, 'companyBrochure')}
                                        className="hidden"
                                    />
                                </label>
                            </div>
                            {uploadProgress.brochure && (
                                <p className="text-sm text-blue-600">Uploading brochure...</p>
                            )}
                        </div>
                    </div>
                </SectionCard>


                {/* Sticky Submit Bar */}
                <div className="fixed bottom-0 left-0 right-0 lg:left-64 bg-white border-t border-gray-200 shadow-lg z-40">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                        <div className="flex items-center justify-between gap-4">
                            <p className="text-sm text-gray-500 hidden sm:block">
                                {isUploading ? 'Uploading files...' : 'Fill all required fields to publish'}
                            </p>
                            <div className="flex items-center gap-4 ml-auto">
                                <button
                                    type="button"
                                    onClick={handleSubmit((data) => onSubmit(data, true))}
                                    disabled={isSubmitting || isUploading}
                                    className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {isSubmitting && !submitSuccess ? (
                                        <span className="flex items-center gap-2">
                                            <svg
                                                className="animate-spin h-4 w-4"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                            >
                                                <circle
                                                    className="opacity-25"
                                                    cx="12"
                                                    cy="12"
                                                    r="10"
                                                    stroke="currentColor"
                                                    strokeWidth="4"
                                                />
                                                <path
                                                    className="opacity-75"
                                                    fill="currentColor"
                                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                />
                                            </svg>
                                            Saving...
                                        </span>
                                    ) : (
                                        'Save Draft'
                                    )}
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting || isUploading}
                                    className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {isSubmitting && !submitSuccess ? (
                                        <span className="flex items-center gap-2">
                                            <svg
                                                className="animate-spin h-4 w-4"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                            >
                                                <circle
                                                    className="opacity-25"
                                                    cx="12"
                                                    cy="12"
                                                    r="10"
                                                    stroke="currentColor"
                                                    strokeWidth="4"
                                                />
                                                <path
                                                    className="opacity-75"
                                                    fill="currentColor"
                                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                />
                                            </svg>
                                            Publishing...
                                        </span>
                                    ) : (
                                        'Publish Job'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default PostJob;
