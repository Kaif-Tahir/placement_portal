import { useState, useEffect } from 'react';
import { useAuth } from '@context/AuthContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@config/firebase';
import { uploadResumeToCloudinary } from '@services/cloudinaryService';
import toast from 'react-hot-toast';

const StudentProfile = () => {
    const { user, userProfile } = useAuth();
    const [isEditMode, setIsEditMode] = useState(false);
    const [loading, setLoading] = useState(false);
    const [profileLoading, setProfileLoading] = useState(true);
    const [profileData, setProfileData] = useState(null);
    const [skillInput, setSkillInput] = useState('');
    const [profilePhoto, setProfilePhoto] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [showPhotoAdjust, setShowPhotoAdjust] = useState(false);
    const [photoZoom, setPhotoZoom] = useState(1);
    const [photoPosition, setPhotoPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    const [formData, setFormData] = useState({
        fullName: '',
        rollNumber: '',
        branch: '',
        cgpa: '',
        skills: [],
        profilePhoto: '', // URL of profile photo
        aboutMe: '',
        projects: [],
        achievements: [],
    });

    const [projectInput, setProjectInput] = useState({ title: '', description: '', link: '' });
    const [achievementInput, setAchievementInput] = useState({ title: '', description: '', date: '' });

    // Fetch student profile data
    useEffect(() => {
        const fetchProfile = async () => {
            if (!user?.uid) return;
            try {
                const docRef = doc(db, 'students', user.uid);
                const docSnap = await getDoc(docRef);
                
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setProfileData(data);
                    setFormData({
                        fullName: userProfile?.fullName || '',
                        rollNumber: data.rollNumber || '',
                        branch: data.branch || '',
                        cgpa: data.cgpa || '',
                        skills: data.skills || [],
                        profilePhoto: data.profilePhoto || '',
                        aboutMe: data.aboutMe || '',
                        projects: data.projects || [],
                        achievements: data.achievements || [],
                    });
                    if (data.profilePhoto) {
                        setPhotoPreview(data.profilePhoto);
                    }
                } else {
                    // First time - set basic info from userProfile
                    setFormData(prev => ({
                        ...prev,
                        fullName: userProfile?.fullName || '',
                        rollNumber: userProfile?.rollNumber || '',
                        branch: userProfile?.branch || '',
                    }));
                }
            } catch (error) {
                console.error('Error fetching profile:', error);
                toast.error('Failed to load profile');
            } finally {
                setProfileLoading(false);
            }
        };

        fetchProfile();
    }, [user, userProfile]);

    // Handle input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));
    };

    // Handle profile photo selection
    const handlePhotoSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error('File size must be less than 5MB');
                return;
            }
            setProfilePhoto(file);
            const reader = new FileReader();
            reader.onload = (event) => {
                setPhotoPreview(event.target.result);
                setShowPhotoAdjust(true);
                setPhotoZoom(1);
                setPhotoPosition({ x: 0, y: 0 });
            };
            reader.readAsDataURL(file);
        }
    };

    // Handle photo drag
    const handlePhotoDragStart = (e) => {
        setIsDragging(true);
        setDragStart({ x: e.clientX - photoPosition.x, y: e.clientY - photoPosition.y });
    };

    const handlePhotoDragMove = (e) => {
        if (!isDragging) return;
        if (e.buttons !== 1) {
            setIsDragging(false);
            return;
        }
        setPhotoPosition({
            x: e.clientX - dragStart.x,
            y: e.clientY - dragStart.y,
        });
    };

    const handlePhotoDragEnd = () => {
        setIsDragging(false);
    };

    // Handle photo zoom
    const handlePhotoZoom = (e) => {
        setPhotoZoom(parseFloat(e.target.value));
    };

    // Apply photo adjustment and close modal
    const applyPhotoAdjustment = () => {
        setShowPhotoAdjust(false);
    };

    // Cancel photo adjustment
    const cancelPhotoAdjustment = () => {
        setProfilePhoto(null);
        setPhotoPreview(null);
        setShowPhotoAdjust(false);
        setPhotoZoom(1);
        setPhotoPosition({ x: 0, y: 0 });
    };

    // Add skill
    const addSkill = () => {
        if (skillInput.trim() === '') {
            toast.error('Skill cannot be empty');
            return;
        }
        if (formData.skills.includes(skillInput.trim())) {
            toast.error('Skill already added');
            return;
        }
        setFormData(prev => ({
            ...prev,
            skills: [...prev.skills, skillInput.trim()],
        }));
        setSkillInput('');
    };

    // Remove skill
    const removeSkill = (skillToRemove) => {
        setFormData(prev => ({
            ...prev,
            skills: prev.skills.filter(skill => skill !== skillToRemove),
        }));
    };

    // Add project
    const addProject = () => {
        if (!projectInput.title.trim()) {
            toast.error('Project title is required');
            return;
        }
        setFormData(prev => ({
            ...prev,
            projects: [...prev.projects, { ...projectInput, id: Date.now() }],
        }));
        setProjectInput({ title: '', description: '', link: '' });
    };

    // Remove project
    const removeProject = (projectId) => {
        setFormData(prev => ({
            ...prev,
            projects: prev.projects.filter(p => p.id !== projectId),
        }));
    };

    // Add achievement
    const addAchievement = () => {
        if (!achievementInput.title.trim()) {
            toast.error('Achievement title is required');
            return;
        }
        setFormData(prev => ({
            ...prev,
            achievements: [...prev.achievements, { ...achievementInput, id: Date.now() }],
        }));
        setAchievementInput({ title: '', description: '', date: '' });
    };

    // Remove achievement
    const removeAchievement = (achievementId) => {
        setFormData(prev => ({
            ...prev,
            achievements: prev.achievements.filter(a => a.id !== achievementId),
        }));
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.fullName || !formData.rollNumber || !formData.branch) {
            toast.error('Please fill in all required fields');
            return;
        }

        if (formData.cgpa && (isNaN(formData.cgpa) || formData.cgpa < 0 || formData.cgpa > 10)) {
            toast.error('CGPA must be between 0 and 10');
            return;
        }

        setLoading(true);
        try {
            let photoUrl = formData.profilePhoto;

            // Upload profile photo to Cloudinary if selected
            if (profilePhoto) {
                const uploadedFile = await uploadResumeToCloudinary(profilePhoto, user.uid);
                photoUrl = uploadedFile.url;
            }

            // Update Firestore
            const studentRef = doc(db, 'students', user.uid);
            await updateDoc(studentRef, {
                fullName: formData.fullName,
                rollNumber: formData.rollNumber,
                branch: formData.branch,
                cgpa: formData.cgpa || null,
                skills: formData.skills,
                profilePhoto: photoUrl,
                aboutMe: formData.aboutMe,
                projects: formData.projects,
                achievements: formData.achievements,
                updatedAt: new Date(),
            });

            setFormData(prev => ({
                ...prev,
                profilePhoto: photoUrl,
            }));
            setPhotoPreview(photoUrl);
            setProfilePhoto(null);
            setIsEditMode(false);
            toast.success('Profile updated successfully');
        } catch (error) {
            console.error('Error updating profile:', error);
            toast.error('Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    if (profileLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                    <p className="mt-4 text-gray-600">Loading profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 pb-12">
            {isEditMode ? (
                    // EDIT MODE
                    <div className="max-w-5xl mx-auto py-8 px-4">
                        <div className="mb-6">
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Profile</h1>
                            <p className="text-gray-600">Update your profile information</p>
                        </div>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Profile Photo Section */}
                        <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-600 text-lg">
                                    📷
                                </div>
                                Profile Photo
                            </h2>
                            <div className="flex flex-col md:flex-row items-center gap-8">
                                <div className="flex-shrink-0 relative">
                                    {photoPreview ? (
                                        <div className="relative">
                                            <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-gray-300 shadow-lg bg-gray-100">
                                                <img
                                                    src={photoPreview}
                                                    alt="Profile"
                                                    className="w-full h-full object-cover"
                                                    style={{
                                                        transform: `scale(${photoZoom}) translate(${photoPosition.x / 40}px, ${photoPosition.y / 40}px)`,
                                                    }}
                                                />
                                            </div>
                                            {profilePhoto && (
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPhotoAdjust(true)}
                                                    className="absolute bottom-1 right-1 bg-primary-600 text-white rounded-full p-2 hover:bg-primary-700 transition shadow-lg"
                                                    title="Adjust photo"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="w-40 h-40 rounded-full bg-gray-100 flex items-center justify-center border-4 border-dashed border-gray-300">
                                            <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                                            </svg>
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <label className="block mb-3">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handlePhotoSelect}
                                            className="hidden"
                                            disabled={loading}
                                        />
                                        <span className="cursor-pointer inline-block px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition duration-300 font-medium">
                                            Upload Photo
                                        </span>
                                    </label>
                                    <p className="text-sm text-gray-600">JPG, PNG or GIF. Max 5MB</p>
                                    <p className="text-xs text-gray-500 mt-2">For best results, use a square image</p>
                                </div>
                            </div>
                        </div>

                        {/* Basic Information */}
                        <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-600 text-lg">
                                    ℹ️
                                </div>
                                Basic Information
                            </h2>
                            
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Full Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="fullName"
                                    value={formData.fullName}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-gray-500 focus:ring-2 focus:ring-gray-200 outline-none transition"
                                    disabled={loading}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Roll Number <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="rollNumber"
                                        value={formData.rollNumber}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-gray-500 focus:ring-2 focus:ring-gray-200 outline-none transition"
                                        disabled={loading}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Branch <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="branch"
                                        value={formData.branch}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-gray-500 focus:ring-2 focus:ring-gray-200 outline-none transition"
                                        disabled={loading}
                                    />
                                </div>
                            </div>

                            <div className="mt-6">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    CGPA
                                </label>
                                <input
                                    type="number"
                                    name="cgpa"
                                    min="0"
                                    max="10"
                                    step="0.01"
                                    value={formData.cgpa}
                                    onChange={handleInputChange}
                                    placeholder="e.g., 8.5"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-gray-500 focus:ring-2 focus:ring-gray-200 outline-none transition"
                                    disabled={loading}
                                />
                                <p className="text-xs text-gray-500 mt-2">Enter value between 0 and 10</p>
                            </div>
                        </div>

                        {/* Skills Section */}
                        <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-600 text-lg">
                                    ⭐
                                </div>
                                Skills
                            </h2>
                            <div className="flex gap-2 mb-6">
                                <input
                                    type="text"
                                    value={skillInput}
                                    onChange={(e) => setSkillInput(e.target.value)}
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            addSkill();
                                        }
                                    }}
                                    placeholder="Add a skill (e.g., JavaScript, React, etc.)"
                                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:border-gray-500 focus:ring-2 focus:ring-gray-200 outline-none transition"
                                    disabled={loading}
                                />
                                <button
                                    type="button"
                                    onClick={addSkill}
                                    className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition duration-300 font-medium disabled:opacity-50"
                                    disabled={loading}
                                >
                                    Add
                                </button>
                            </div>

                            <div className="flex flex-wrap gap-3">
                                {formData.skills.map((skill) => (
                                    <div
                                        key={skill}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-900 rounded-full text-sm font-medium hover:bg-gray-300 transition"
                                    >
                                        {skill}
                                        <button
                                            type="button"
                                            onClick={() => removeSkill(skill)}
                                            className="ml-1 text-gray-900 hover:text-black transition"
                                            disabled={loading}
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                            </div>
                            {formData.skills.length === 0 && (
                                <p className="text-gray-500 text-sm">No skills added yet. Add your first skill above!</p>
                            )}
                        </div>

                        {/* About Me Section */}
                        <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-600 text-lg">
                                    ✍️
                                </div>
                                About Me
                            </h2>
                            <textarea
                                name="aboutMe"
                                value={formData.aboutMe}
                                onChange={handleInputChange}
                                placeholder="Write a brief introduction about yourself, your goals, interests..."
                                rows="6"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-gray-500 focus:ring-2 focus:ring-gray-200 outline-none transition resize-none"
                                disabled={loading}
                            />
                        </div>

                        {/* Projects Section */}
                        <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-600 text-lg">
                                    💼
                                </div>
                                Projects
                            </h2>
                            <div className="space-y-4 mb-6">
                                <input
                                    type="text"
                                    value={projectInput.title}
                                    onChange={(e) => setProjectInput(prev => ({ ...prev, title: e.target.value }))}
                                    placeholder="Project Title *"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-gray-500 focus:ring-2 focus:ring-gray-200 outline-none transition"
                                    disabled={loading}
                                />
                                <textarea
                                    value={projectInput.description}
                                    onChange={(e) => setProjectInput(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="Project Description"
                                    rows="3"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-gray-500 focus:ring-2 focus:ring-gray-200 outline-none transition resize-none"
                                    disabled={loading}
                                />
                                <input
                                    type="url"
                                    value={projectInput.link}
                                    onChange={(e) => setProjectInput(prev => ({ ...prev, link: e.target.value }))}
                                    placeholder="Project Link (optional)"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-gray-500 focus:ring-2 focus:ring-gray-200 outline-none transition"
                                    disabled={loading}
                                />
                                <button
                                    type="button"
                                    onClick={addProject}
                                    className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition font-medium disabled:opacity-50"
                                    disabled={loading}
                                >
                                    Add Project
                                </button>
                            </div>

                            <div className="space-y-4">
                                {formData.projects.map((project) => (
                                    <div key={project.id} className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="font-bold text-gray-900">{project.title}</h3>
                                            <button
                                                type="button"
                                                onClick={() => removeProject(project.id)}
                                                className="text-red-600 hover:text-red-800"
                                                disabled={loading}
                                            >
                                                ✕
                                            </button>
                                        </div>
                                        {project.description && <p className="text-gray-700 text-sm mb-2">{project.description}</p>}
                                        {project.link && (
                                            <a href={project.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
                                                View Project →
                                            </a>
                                        )}
                                    </div>
                                ))}
                            </div>
                            {formData.projects.length === 0 && (
                                <p className="text-gray-500 text-sm">No projects added yet</p>
                            )}
                        </div>

                        {/* Achievements Section */}
                        <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-600 text-lg">
                                    🏆
                                </div>
                                Achievements
                            </h2>
                            <div className="space-y-4 mb-6">
                                <input
                                    type="text"
                                    value={achievementInput.title}
                                    onChange={(e) => setAchievementInput(prev => ({ ...prev, title: e.target.value }))}
                                    placeholder="Achievement Title *"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-gray-500 focus:ring-2 focus:ring-gray-200 outline-none transition"
                                    disabled={loading}
                                />
                                <textarea
                                    value={achievementInput.description}
                                    onChange={(e) => setAchievementInput(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="Achievement Description"
                                    rows="3"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-gray-500 focus:ring-2 focus:ring-gray-200 outline-none transition resize-none"
                                    disabled={loading}
                                />
                                <input
                                    type="text"
                                    value={achievementInput.date}
                                    onChange={(e) => setAchievementInput(prev => ({ ...prev, date: e.target.value }))}
                                    placeholder="Date (e.g., Jan 2024)"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-gray-500 focus:ring-2 focus:ring-gray-200 outline-none transition"
                                    disabled={loading}
                                />
                                <button
                                    type="button"
                                    onClick={addAchievement}
                                    className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition font-medium disabled:opacity-50"
                                    disabled={loading}
                                >
                                    Add Achievement
                                </button>
                            </div>

                            <div className="space-y-4">
                                {formData.achievements.map((achievement) => (
                                    <div key={achievement.id} className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h3 className="font-bold text-gray-900">{achievement.title}</h3>
                                                {achievement.date && <p className="text-sm text-gray-500">{achievement.date}</p>}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeAchievement(achievement.id)}
                                                className="text-red-600 hover:text-red-800"
                                                disabled={loading}
                                            >
                                                ✕
                                            </button>
                                        </div>
                                        {achievement.description && <p className="text-gray-700 text-sm">{achievement.description}</p>}
                                    </div>
                                ))}
                            </div>
                            {formData.achievements.length === 0 && (
                                <p className="text-gray-500 text-sm">No achievements added yet</p>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-4 justify-end max-w-5xl mx-auto px-4">
                            <button
                                type="button"
                                onClick={() => setIsEditMode(false)}
                                className="px-8 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition font-semibold disabled:opacity-50"
                                disabled={loading}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-300 font-semibold disabled:opacity-50"
                                disabled={loading}
                            >
                                {loading ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>

                        {/* Photo Adjustment Modal */}
                        {showPhotoAdjust && photoPreview && (
                            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                                <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
                                    <div className="p-6 border-b border-gray-200">
                                        <h2 className="text-2xl font-bold text-gray-900">Adjust Photo</h2>
                                        <p className="text-gray-600 text-sm mt-1">Position and zoom your photo to get the perfect profile picture</p>
                                    </div>

                                    <div className="p-6 space-y-4">
                                        {/* Preview Container */}
                                        <div className="flex justify-center mb-6">
                                            <div className="relative w-48 h-48 rounded-full overflow-hidden border-4 border-gray-200 bg-gray-100 shadow-lg">
                                                <img
                                                    src={photoPreview}
                                                    alt="Preview"
                                                    style={{
                                                        width: '100%',
                                                        height: '100%',
                                                        objectFit: 'cover',
                                                        transform: `scale(${photoZoom}) translate(${photoPosition.x}px, ${photoPosition.y}px)`,
                                                        cursor: isDragging ? 'grabbing' : 'grab',
                                                    }}
                                                    onMouseDown={handlePhotoDragStart}
                                                    onMouseMove={handlePhotoDragMove}
                                                    onMouseUp={handlePhotoDragEnd}
                                                    onMouseLeave={handlePhotoDragEnd}
                                                    draggable={false}
                                                />
                                            </div>
                                        </div>

                                        {/* Adjustment Controls */}
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-900 mb-2">
                                                    Zoom: {Math.round(photoZoom * 100)}%
                                                </label>
                                                <input
                                                    type="range"
                                                    min="1"
                                                    max="3"
                                                    step="0.1"
                                                    value={photoZoom}
                                                    onChange={handlePhotoZoom}
                                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                                                />
                                            </div>

                                            <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                                                <p className="font-medium">💡 Tips:</p>
                                                <ul className="list-disc list-inside mt-1 space-y-1">
                                                    <li>Drag the image to position your face in the center</li>
                                                    <li>Use the zoom slider to adjust the size</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="border-t border-gray-200 p-6 flex gap-4 justify-end">
                                        <button
                                            onClick={cancelPhotoAdjustment}
                                            className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={applyPhotoAdjustment}
                                            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-semibold"
                                        >
                                            Apply & Continue
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </form>
                    </div>
                ) : (
                    // VIEW MODE - LinkedIn-inspired design
                    <>
                        {/* Profile Header Card */}
                        <div className="bg-white rounded-lg shadow-md border border-gray-200 mb-6 max-w-5xl mx-auto">
                            <div className="p-8">
                                <div className="flex flex-col md:flex-row items-start gap-8">
                                    {/* Profile Picture */}
                                    <div className="flex-shrink-0">
                                        {formData.profilePhoto ? (
                                            <img
                                                src={formData.profilePhoto}
                                                alt={formData.fullName}
                                                className="w-32 h-32 rounded-full object-cover shadow-xl ring-4 ring-primary-100"
                                            />
                                        ) : (
                                            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-xl ring-4 ring-primary-100 text-white text-5xl font-bold">
                                                {formData.fullName?.charAt(0)?.toUpperCase()}
                                            </div>
                                        )}
                                    </div>

                                    {/* Name and Info */}
                                    <div className="flex-1 min-w-0">
                                        <h1 className="text-3xl font-bold text-gray-900 mb-2">{formData.fullName}</h1>
                                        <p className="text-lg font-medium text-gray-700 mb-3">{formData.branch}</p>
                                        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                                            <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-full">
                                                <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                </svg>
                                                <span className="font-medium">{formData.rollNumber}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-full">
                                                <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                </svg>
                                                <span className="truncate">{userProfile?.email || user?.email}</span>
                                            </div>
                                            {formData.cgpa && (
                                                <div className="flex items-center gap-1.5 bg-primary-50 px-3 py-1.5 rounded-full">
                                                    <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                                                    </svg>
                                                    <span className="font-semibold text-primary-700">{formData.cgpa}/10 CGPA</span>
                                                </div>
                                            )}
                                        </div>
                                        
                                        {/* Stats */}
                                        <div className="flex gap-8 mt-5 pt-5 border-t border-gray-100">
                                            <div className="text-center">
                                                <p className="text-2xl font-bold text-primary-600">{formData.skills.length}</p>
                                                <p className="text-xs text-gray-500 uppercase tracking-wide mt-1">Skills</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-2xl font-bold text-primary-600">{formData.projects.length}</p>
                                                <p className="text-xs text-gray-500 uppercase tracking-wide mt-1">Projects</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-2xl font-bold text-primary-600">{formData.achievements.length}</p>
                                                <p className="text-xs text-gray-500 uppercase tracking-wide mt-1">Achievements</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Edit Button */}
                                    <div className="flex-shrink-0">
                                        <button
                                            onClick={() => setIsEditMode(true)}
                                            className="px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-semibold shadow-sm flex items-center gap-2"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                            Edit Profile
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Main Content */}
                        <div className="max-w-5xl mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Left Column - Main Content */}
                            <div className="lg:col-span-2 space-y-6">
                                {/* About Section */}
                                <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                                    <h2 className="text-xl font-bold text-gray-900 mb-4">About</h2>
                                    {formData.aboutMe ? (
                                        <p className="text-gray-700 whitespace-pre-line leading-relaxed">{formData.aboutMe}</p>
                                    ) : (
                                        <p className="text-gray-500 italic">No about information added yet.</p>
                                    )}
                                </div>

                                {/* Projects Section */}
                                <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                                    <h2 className="text-xl font-bold text-gray-900 mb-4">Projects</h2>
                                    {formData.projects.length > 0 ? (
                                        <div className="space-y-4">
                                            {formData.projects.map((project) => (
                                                <div key={project.id} className="border-b border-gray-200 last:border-0 pb-4 last:pb-0">
                                                    <h3 className="font-bold text-lg text-gray-900 mb-1">{project.title}</h3>
                                                    {project.description && (
                                                        <p className="text-gray-700 text-sm mb-2 leading-relaxed">{project.description}</p>
                                                    )}
                                                    {project.link && (
                                                        <a
                                                            href={project.link}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-blue-600 hover:underline text-sm font-medium inline-flex items-center gap-1"
                                                        >
                                                            View Project
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                            </svg>
                                                        </a>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-gray-500 italic">No projects added yet.</p>
                                    )}
                                </div>

                                {/* Achievements Section */}
                                <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                                    <h2 className="text-xl font-bold text-gray-900 mb-4">Achievements</h2>
                                    {formData.achievements.length > 0 ? (
                                        <div className="space-y-4">
                                            {formData.achievements.map((achievement) => (
                                                <div key={achievement.id} className="flex gap-4">
                                                    <div className="flex-shrink-0 w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center text-xl">
                                                        🏆
                                                    </div>
                                                    <div className="flex-1">
                                                        <h3 className="font-bold text-gray-900">{achievement.title}</h3>
                                                        {achievement.date && (
                                                            <p className="text-sm text-gray-500 mb-1">{achievement.date}</p>
                                                        )}
                                                        {achievement.description && (
                                                            <p className="text-gray-700 text-sm leading-relaxed">{achievement.description}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-gray-500 italic">No achievements added yet.</p>
                                    )}
                                </div>
                            </div>

                            {/* Right Column - Sidebar */}
                            <div className="space-y-6">
                                {/* Skills Card */}
                                <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                                    <h2 className="text-xl font-bold text-gray-900 mb-4">Skills</h2>
                                    {formData.skills.length > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                            {formData.skills.map((skill, index) => (
                                                <span
                                                    key={skill}
                                                    className={`inline-block px-4 py-2 rounded-lg text-sm font-semibold shadow-sm hover:shadow-md transition-all duration-200 cursor-default ${
                                                        index % 5 === 0 ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' :
                                                        index % 5 === 1 ? 'bg-purple-100 text-purple-700 hover:bg-purple-200' :
                                                        index % 5 === 2 ? 'bg-green-100 text-green-700 hover:bg-green-200' :
                                                        index % 5 === 3 ? 'bg-orange-100 text-orange-700 hover:bg-orange-200' :
                                                        'bg-pink-100 text-pink-700 hover:bg-pink-200'
                                                    }`}
                                                >
                                                    {skill}
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-gray-500 italic text-sm">No skills added yet.</p>
                                    )}
                                </div>

                                {/* Profile Strength Card */}
                                <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                                    <h2 className="text-xl font-bold text-gray-900 mb-4">Profile Strength</h2>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Completion</span>
                                            <span className="font-semibold text-gray-900">
                                                {Math.round(
                                                    ((formData.aboutMe ? 20 : 0) +
                                                    (formData.profilePhoto ? 20 : 0) +
                                                    (formData.skills.length > 0 ? 20 : 0) +
                                                    (formData.projects.length > 0 ? 20 : 0) +
                                                    (formData.achievements.length > 0 ? 20 : 0))
                                                )}%
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div
                                                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                                                style={{
                                                    width: `${
                                                        (formData.aboutMe ? 20 : 0) +
                                                        (formData.profilePhoto ? 20 : 0) +
                                                        (formData.skills.length > 0 ? 20 : 0) +
                                                        (formData.projects.length > 0 ? 20 : 0) +
                                                        (formData.achievements.length > 0 ? 20 : 0)
                                                    }%`
                                                }}
                                            ></div>
                                        </div>
                                        <div className="text-xs text-gray-500 mt-3 space-y-1">
                                            {!formData.aboutMe && <p>• Add about section</p>}
                                            {!formData.profilePhoto && <p>• Upload profile photo</p>}
                                            {formData.skills.length === 0 && <p>• Add skills</p>}
                                            {formData.projects.length === 0 && <p>• Add projects</p>}
                                            {formData.achievements.length === 0 && <p>• Add achievements</p>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
        </div>
    );
};

export default StudentProfile;
