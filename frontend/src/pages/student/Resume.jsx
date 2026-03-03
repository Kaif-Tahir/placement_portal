import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@context/AuthContext';
import { uploadResumeToCloudinary } from '@services/cloudinaryService';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@config/firebase';
import { COLLECTIONS, VALIDATION } from '@config/constants';
import { analyzeResumeFile } from '@utils/resumeScore';
import toast from 'react-hot-toast';
import {
    CloudArrowUpIcon,
    DocumentTextIcon,
    TrashIcon,
    ArrowDownTrayIcon,
    EyeIcon,
    XMarkIcon,
    CheckCircleIcon,
} from '@heroicons/react/24/outline';

const Resume = () => {
    const { user, refreshUserProfile } = useAuth();
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [dragActive, setDragActive] = useState(false);
    const [resumeData, setResumeData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showPreview, setShowPreview] = useState(false);
    const [resumeScore, setResumeScore] = useState(0);

    // Fetch existing resume data
    const fetchResumeData = useCallback(async () => {
        if (!user) return;

        try {
            setLoading(true);

            const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, user.uid));
            const studentDoc = await getDoc(doc(db, COLLECTIONS.STUDENTS, user.uid));
            const userData = userDoc.exists() ? userDoc.data() : {};
            const studentData = studentDoc.exists() ? studentDoc.data() : {};
            const existingResumeUrl = userData.resumeUrl || studentData?.resume?.url || null;
            
            if (studentData?.resume) {
                setResumeData(studentData.resume);
                // Try to analyze existing resume for score
                if (studentData.resume.url) {
                    try {
                        const response = await fetch(studentData.resume.url);
                        const blob = await response.blob();
                        const file = new File([blob], studentData.resume.name || 'resume.pdf', {
                            type: studentData.resume.type || 'application/pdf',
                        });
                        const analysis = await analyzeResumeFile(file);
                        setResumeScore(analysis.score || 0);
                    } catch (error) {
                        console.error('Error analyzing existing resume:', error);
                        setResumeScore(0);
                    }
                }
            } else if (existingResumeUrl) {
                setResumeData({
                    url: existingResumeUrl,
                    name: 'Uploaded Resume',
                    size: 0,
                    type: 'application/pdf',
                    uploadedAt: new Date().toISOString(),
                });
                setResumeScore(0);
            } else {
                setResumeData(null);
                setResumeScore(0);
            }
        } catch (error) {
            console.error('Error fetching resume:', error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchResumeData();
    }, [fetchResumeData]);

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileUpload(e.dataTransfer.files[0]);
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            handleFileUpload(e.target.files[0]);
        }
    };

    const handleFileUpload = async (file) => {
        if (resumeData?.url) {
            toast.error('Only one resume is allowed. Delete existing resume to upload a new one.');
            return;
        }

        // Validate file type
        if (!VALIDATION.ALLOWED_RESUME_TYPES.includes(file.type)) {
            toast.error('Please upload a PDF or DOC file');
            return;
        }

        // Validate file size
        if (file.size > VALIDATION.MAX_FILE_SIZE) {
            toast.error('File size must be less than 5MB');
            return;
        }

        setUploading(true);
        setUploadProgress(0);

        try {
            // Analyze resume for score
            const analysis = await analyzeResumeFile(file);
            const score = analysis.score || 0;

            // Upload to Cloudinary
            const uploadedFile = await uploadResumeToCloudinary(file, user.uid, (progress) => {
                setUploadProgress(progress);
            });

            // Update student document with resume data
            await updateDoc(doc(db, COLLECTIONS.STUDENTS, user.uid), {
                resume: {
                    url: uploadedFile.url,
                    publicId: uploadedFile.publicId,
                    name: uploadedFile.name,
                    size: uploadedFile.size,
                    type: uploadedFile.type,
                    uploadedAt: new Date().toISOString(),
                },
                updatedAt: new Date().toISOString(),
            });

            setResumeData({
                url: uploadedFile.url,
                publicId: uploadedFile.publicId,
                name: uploadedFile.name,
                size: uploadedFile.size,
                type: uploadedFile.type,
                uploadedAt: new Date().toISOString(),
            });
            setResumeScore(score);

            await refreshUserProfile();

            toast.success('Resume uploaded successfully!');
        } catch (error) {
            console.error('Upload error:', error);
            toast.error(error.message || 'Failed to upload resume');
        } finally {
            setUploading(false);
            setUploadProgress(0);
        }
    };

    const handleDeleteResume = async () => {
        if (!window.confirm('Are you sure you want to delete this resume?')) {
            return;
        }

        try {
            // Remove resume reference from Firestore
            await updateDoc(doc(db, COLLECTIONS.STUDENTS, user.uid), {
                resume: null,
                updatedAt: new Date().toISOString(),
            });

            setResumeData(null);
            setResumeScore(0);

            await refreshUserProfile();
            toast.success('Resume deleted successfully');
        } catch (error) {
            console.error('Delete error:', error);
            toast.error('Failed to delete resume');
        }
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const getPublicIdFromUrl = (url) => {
        try {
            const parsedUrl = new URL(url);
            const uploadSegment = '/upload/';
            const uploadIndex = parsedUrl.pathname.indexOf(uploadSegment);
            if (uploadIndex === -1) return null;

            let afterUpload = parsedUrl.pathname.slice(uploadIndex + uploadSegment.length);
            afterUpload = afterUpload.replace(/^v\d+\//, '');

            return afterUpload.replace(/\.[^/.]+$/, '');
        } catch {
            return null;
        }
    };

    const getCloudinaryPdfPreviewImageUrl = () => {
        const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
        const publicId = resumeData?.publicId || getPublicIdFromUrl(resumeData?.url || '');

        if (!cloudName || !publicId) {
            return null;
        }

        return `https://res.cloudinary.com/${cloudName}/image/upload/pg_1,f_auto,q_auto,w_1200/${publicId}.jpg`;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-6">
                <h1 className="page-header">Resume Management</h1>
                <p className="text-gray-600">
                    Upload and manage your resume for job applications
                </p>
            </div>

            {!resumeData ? (
                /* Upload Section */
                <div className="card p-8">
                    <div
                        className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-all ${
                            dragActive
                                ? 'border-primary-600 bg-primary-50'
                                : 'border-gray-300 hover:border-gray-400'
                        } ${uploading ? 'pointer-events-none opacity-60' : ''}`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                    >
                        {uploading ? (
                            <div className="space-y-4">
                                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary-600 mx-auto"></div>
                                <div>
                                    <p className="text-lg font-medium text-gray-900">
                                        Uploading Resume...
                                    </p>
                                    <div className="mt-4 max-w-xs mx-auto">
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div
                                                className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                                                style={{ width: `${uploadProgress}%` }}
                                            ></div>
                                        </div>
                                        <p className="mt-2 text-sm text-gray-600">
                                            {Math.round(uploadProgress)}%
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <>
                                <CloudArrowUpIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                                <div className="space-y-2">
                                    <p className="text-xl font-semibold text-gray-900">
                                        Drop your resume here
                                    </p>
                                    <p className="text-gray-600">
                                        or click to browse from your computer
                                    </p>
                                </div>
                                <input
                                    type="file"
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    accept=".pdf,.doc,.docx"
                                    onChange={handleFileChange}
                                    disabled={uploading}
                                />
                                <div className="mt-6 flex items-center justify-center gap-4 text-sm text-gray-500">
                                    <span className="flex items-center gap-1">
                                        <CheckCircleIcon className="h-5 w-5 text-green-500" />
                                        PDF, DOC, DOCX
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <CheckCircleIcon className="h-5 w-5 text-green-500" />
                                        Max 5MB
                                    </span>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Info Section */}
                    <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <h3 className="font-semibold text-blue-900 mb-2">
                            💡 Tips for a great resume:
                        </h3>
                        <ul className="text-sm text-blue-800 space-y-1">
                            <li>• Keep it concise (1-2 pages)</li>
                            <li>• Use a professional format</li>
                            <li>• Highlight relevant skills and experience</li>
                            <li>• Include your contact information</li>
                            <li>• Proofread for errors</li>
                        </ul>
                    </div>
                </div>
            ) : (
                /* Resume Display Section */
                <div className="space-y-6">
                    {/* Resume Score Card */}
                    {resumeScore > 0 && (
                        <div className="card p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Resume Score</h3>
                                    <p className="text-sm text-gray-600">Basic analysis of your resume</p>
                                </div>
                                <div className="text-right">
                                    <div className="text-4xl font-bold text-primary-600">{resumeScore}</div>
                                    <div className="text-sm text-gray-500">out of 100</div>
                                </div>
                            </div>
                            <div className="mt-4">
                                <div className="w-full bg-gray-200 rounded-full h-3">
                                    <div
                                        className="bg-primary-600 h-3 rounded-full transition-all duration-500"
                                        style={{ width: `${resumeScore}%` }}
                                    />
                                </div>
                            </div>
                            <div className="mt-3 text-sm text-gray-600">
                                {resumeScore >= 80 && '🎉 Excellent resume!'}
                                {resumeScore >= 60 && resumeScore < 80 && '👍 Good resume, minor improvements possible'}
                                {resumeScore >= 40 && resumeScore < 60 && '📝 Fair resume, consider adding more details'}
                                {resumeScore < 40 && '💡 Resume needs improvement'}
                            </div>
                        </div>
                    )}

                    <div className="card p-6">
                        <div className="flex items-start justify-between">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-primary-100 rounded-lg">
                                    <DocumentTextIcon className="h-8 w-8 text-primary-600" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                        {resumeData.name}
                                    </h3>
                                    <div className="flex items-center gap-4 text-sm text-gray-600">
                                        <span>{formatFileSize(resumeData.size)}</span>
                                        <span>•</span>
                                        <span>
                                            Uploaded on {formatDate(resumeData.uploadedAt)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {resumeData.type === 'application/pdf' && (
                                    <button
                                        onClick={() => setShowPreview(true)}
                                        className="btn-outline btn-sm flex items-center gap-2"
                                    >
                                        <EyeIcon className="h-4 w-4" />
                                        Preview
                                    </button>
                                )}
                                <a
                                    href={resumeData.url}
                                    download={resumeData.name}
                                    className="btn-primary btn-sm flex items-center gap-2"
                                >
                                    <ArrowDownTrayIcon className="h-4 w-4" />
                                    Download
                                </a>
                                <button
                                    onClick={handleDeleteResume}
                                    className="btn-error btn-sm flex items-center gap-2"
                                >
                                    <TrashIcon className="h-4 w-4" />
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="card p-6">
                        <p className="text-sm text-gray-600">
                            Only one resume is allowed. Delete the current resume to upload a new one.
                        </p>
                    </div>
                </div>
            )}

            {/* Preview Modal */}
            {showPreview && resumeData?.type === 'application/pdf' && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between p-4 border-b">
                            <h3 className="text-lg font-semibold">Resume Preview</h3>
                            <button
                                onClick={() => setShowPreview(false)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <XMarkIcon className="h-6 w-6" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-hidden">
                            {getCloudinaryPdfPreviewImageUrl() ? (
                                <div className="h-full overflow-auto bg-gray-100 p-4">
                                    <img
                                        src={getCloudinaryPdfPreviewImageUrl()}
                                        alt="Resume preview page 1"
                                        className="mx-auto max-w-full h-auto rounded-lg shadow-medium"
                                    />
                                </div>
                            ) : (
                                <div className="h-full flex items-center justify-center p-6">
                                    <p className="text-gray-700">Preview unavailable for this file. Use “Open original PDF”.</p>
                                </div>
                            )}
                        </div>
                        <div className="p-4 border-t bg-gray-50 flex justify-end">
                            <a
                                href={resumeData.url}
                                target="_blank"
                                rel="noreferrer"
                                className="btn-outline btn-sm"
                            >
                                Open original PDF
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Resume;
