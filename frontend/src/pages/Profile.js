import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  User,
  Mail,
  Phone,
  MapPin,
  GraduationCap,
  BookOpen,
  Calendar,
  Briefcase,
  Upload,
  Target,
  TrendingUp,
  Globe,
  Save,
  FileText,
  Award,
  Cpu,
  Sparkles
} from "lucide-react";

// Move InputField outside component to prevent recreation on each render
const InputField = ({ label, icon: Icon, placeholder, value, onChange, type = "text", ...props }) => (
  <div className="space-y-2">
    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
      <Icon size={16} className="text-blue-600" />
      {label}
    </label>
    <input
      type={type}
      value={value}
      onChange={onChange}
      className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-blue-300"
      placeholder={placeholder}
      {...props}
    />
  </div>
);

function Profile() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [personal, setPersonal] = useState({
    firstName: "",
    lastName: "",
    email: "",
    degree: "",
    branch: "",
    graduationYear: "",
    phone: "",
    location: "",
  });

  useEffect(() => {
    if (user?.firstName || user?.lastName || user?.email) {
      setPersonal((prev) => ({
        ...prev,
        firstName: user?.firstName || prev.firstName || "",
        lastName: user?.lastName || prev.lastName || "",
        email: user?.email || prev.email || "",
      }));
    }
  }, [user]);

  const [careerPrefs, setCareerPrefs] = useState({
    targetRoles: "",
    skillsToImprove: "",
    preferredLocations: "",
  });

  const [resumeStatus, setResumeStatus] = useState("No file uploaded");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [aiExtracted, setAiExtracted] = useState({
    skills: [],
    education: [],
    experience: [],
    projects: [],
    certifications: [],
    achievements: [],
  });

  // Fetch profile data from backend
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setIsLoading(true);
        const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
        
        // Fetch user profile
        const profileResponse = await fetch(`${API_URL}/profile/view`, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          const userData = profileData.user || profileData;
          setPersonal((prev) => ({
            firstName: userData.firstName || prev.firstName || "",
            lastName: userData.lastName || prev.lastName || "",
            email: userData.email || prev.email || "",
            degree: userData.degree || "",
            branch: userData.branch || "",
            graduationYear: userData.graduationYear || "",
            phone: userData.phone || "",
            location: userData.location || "",
          }));

          setCareerPrefs({
            targetRoles: Array.isArray(userData.targetRoles)
              ? userData.targetRoles.join(", ")
              : userData.targetRoles || "",
            skillsToImprove: Array.isArray(userData.skillsToImprove)
              ? userData.skillsToImprove.join(", ")
              : userData.skillsToImprove || "",
            preferredLocations: Array.isArray(userData.preferredLocations)
              ? userData.preferredLocations.join(", ")
              : userData.preferredLocations || "",
          });

          if (userData.resumeFile) {
            setResumeStatus(`Resume uploaded: ${userData.resumeFile}`);
          }
        }

        // Fetch AI-extracted resume data
        if (user?._id) {
          try {
            const resumeResponse = await fetch(`${API_URL}/resume/parsed/${user._id}`, {
              credentials: 'include',
            });

            if (resumeResponse.ok) {
              const resumeParsedData = await resumeResponse.json();
              
              if (resumeParsedData.success && resumeParsedData.data) {
                setAiExtracted({
                  skills: resumeParsedData.data.skills || [],
                  education: Array.isArray(resumeParsedData.data.education)
                    ? resumeParsedData.data.education
                    : resumeParsedData.data.education
                      ? [resumeParsedData.data.education]
                      : [],
                  experience: resumeParsedData.data.experience || [],
                  projects: resumeParsedData.data.projects || [],
                  certifications: resumeParsedData.data.certifications || [],
                  achievements: resumeParsedData.data.achievements || [],
                });
              }
            }
          } catch (resumeError) {
          }
        }
      } catch (error) {
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchProfileData();
    }
  }, [user]);

  const handleResumeUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setResumeStatus(`Uploading ${file.name}...`);
    
    try {
      const formData = new FormData();
      formData.append('resume', file);
      
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${API_URL}/resume/upload`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        setResumeStatus(`${file.name} uploaded successfully`);

        if (result.data) {
          setAiExtracted({
            skills: result.data.skills || [],
            education: Array.isArray(result.data.education)
              ? result.data.education
              : result.data.education
                ? [result.data.education]
                : [],
            experience: result.data.experience || [],
            projects: result.data.projects || [],
            certifications: result.data.certifications || [],
            achievements: result.data.achievements || [],
          });
        }
        
        // Update user profile with resume filename
        await fetch(`${API_URL}/profile/update`, {
          method: 'PATCH',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ resumeFile: file.name }),
        });
        
        // Reload AI-extracted data with a small delay to ensure DB write
        if (user?._id) {
          // Add delay to allow database to write
          await new Promise(resolve => setTimeout(resolve, 500));
          
          try {
            const resumeResponse = await fetch(`${API_URL}/resume/parsed/${user._id}`, {
              credentials: 'include',
            });
            
            if (resumeResponse.ok) {
              const resumeParsedData = await resumeResponse.json();
              
              if (resumeParsedData.success && resumeParsedData.data) {
                setAiExtracted({
                  skills: resumeParsedData.data.skills || [],
                  education: Array.isArray(resumeParsedData.data.education)
                    ? resumeParsedData.data.education
                    : resumeParsedData.data.education
                      ? [resumeParsedData.data.education]
                      : [],
                  experience: resumeParsedData.data.experience || [],
                  projects: resumeParsedData.data.projects || [],
                  certifications: resumeParsedData.data.certifications || [],
                  achievements: resumeParsedData.data.achievements || [],
                });
              }
            }
          } catch (fetchError) {
          }
        }
        
        alert('Resume uploaded and processed successfully!');
      } else {
        const errorMsg = result.error || result.message || 'Upload failed';
        throw new Error(errorMsg);
      }
    } catch (error) {
      setResumeStatus("Upload failed. Please try again.");
      alert(`Failed to upload resume: ${error.message}`);
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const payload = {
        ...personal,
        graduationYear: personal.graduationYear
          ? parseInt(personal.graduationYear, 10)
          : undefined,
        targetRoles: careerPrefs.targetRoles
          ? careerPrefs.targetRoles.split(",").map((item) => item.trim()).filter(Boolean)
          : [],
        skillsToImprove: careerPrefs.skillsToImprove
          ? careerPrefs.skillsToImprove.split(",").map((item) => item.trim()).filter(Boolean)
          : [],
        preferredLocations: careerPrefs.preferredLocations
          ? careerPrefs.preferredLocations.split(",").map((item) => item.trim()).filter(Boolean)
          : [],
      };

      Object.keys(payload).forEach((key) =>
        payload[key] === undefined && delete payload[key]
      );

      const response = await fetch(`${API_URL}/profile/update`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        alert('Profile saved successfully!');
      } else {
        const errorMsg = result.error || 'Failed to save profile';
        throw new Error(errorMsg);
      }
    } catch (error) {
      alert(`Failed to save profile: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const getColorClasses = (color) => {
    const colorMap = {
      blue: "bg-blue-50 border-blue-100 bg-blue-100 text-blue-600",
      purple: "bg-purple-50 border-purple-100 bg-purple-100 text-purple-600",
      indigo: "bg-indigo-50 border-indigo-100 bg-indigo-100 text-indigo-600",
      pink: "bg-pink-50 border-pink-100 bg-pink-100 text-pink-600",
      green: "bg-green-50 border-green-100 bg-green-100 text-green-600",
    };
    return colorMap[color] || colorMap.purple;
  };

  const AICard = ({ title, icon: Icon, items, color = "purple" }) => {
    const colors = getColorClasses(color);
    const [bgLight, borderColor, bgMedium, textColor] = colors.split(" ");
    
    return (
    <div className={`bg-gradient-to-br ${bgLight} to-white border ${borderColor} rounded-xl p-5 hover:shadow-lg transition-all duration-300 hover:-translate-y-1`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg ${bgMedium}`}>
            <Icon size={20} className={textColor} />
          </div>
          <h3 className="font-semibold text-gray-900">{title}</h3>
        </div>
        <Sparkles size={16} className="text-purple-500" />
      </div>
      <ul className="space-y-2">
        {items.map((item, index) => (
          <li key={index} className="flex items-start gap-2">
            <div className={`w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0 ${
              color === 'blue' ? 'bg-blue-400' :
              color === 'purple' ? 'bg-purple-400' :
              color === 'indigo' ? 'bg-indigo-400' :
              color === 'pink' ? 'bg-pink-400' :
              color === 'green' ? 'bg-green-400' :
              'bg-purple-400'
            }`} />
            <span className="text-sm text-gray-700">{item}</span>
          </li>
        ))}
      </ul>
    </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-blue-500 to-purple-600 shadow-xl">
          <div className="absolute inset-0 opacity-20 bg-white/5"></div>
          <div className="relative p-8">
            <button
              onClick={() => navigate("/")}
              className="inline-flex items-center gap-2 text-white/90 hover:text-white text-sm font-medium transition-colors mb-6"
            >
              <span className="text-lg">←</span> Back to Home
            </button>
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div>
                <h1 className="text-4xl font-bold text-white mb-3">Your Profile</h1>
                <p className="text-blue-100 max-w-2xl">
                  Manage your personal details, upload your resume, and let AI extract insights to power your job compatibility analysis.
                </p>
              </div>
              <button
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="inline-flex items-center justify-center gap-2 bg-white text-blue-600 hover:bg-blue-50 px-6 py-3 rounded-xl font-semibold transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                <Save size={18} />
                {isSaving ? "Saving..." : "Save Profile"}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Personal Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Personal Details Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-blue-100 overflow-hidden">
              <div className="border-b border-blue-50 bg-gradient-to-r from-blue-50 to-white p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-blue-100">
                      <User size={24} className="text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Personal Details</h2>
                      <p className="text-gray-600">Update your personal information</p>
                    </div>
                  </div>
                  <span className="px-4 py-2 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold">
                    Editable
                  </span>
                </div>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputField
                    label="First Name"
                    icon={User}
                    value={personal.firstName}
                    onChange={(e) => setPersonal({ ...personal, firstName: e.target.value })}
                    placeholder="Enter your first name"
                  />
                  <InputField
                    label="Last Name"
                    icon={User}
                    value={personal.lastName}
                    onChange={(e) => setPersonal({ ...personal, lastName: e.target.value })}
                    placeholder="Enter your last name"
                  />
                  <InputField
                    label="Email"
                    icon={Mail}
                    type="email"
                    value={personal.email}
                    onChange={(e) => setPersonal({ ...personal, email: e.target.value })}
                    placeholder="you@example.com"
                  />
                  <InputField
                    label="Phone"
                    icon={Phone}
                    type="tel"
                    value={personal.phone}
                    onChange={(e) => setPersonal({ ...personal, phone: e.target.value })}
                    placeholder="Enter your phone number"
                  />
                  <InputField
                    label="Degree"
                    icon={GraduationCap}
                    value={personal.degree}
                    onChange={(e) => setPersonal({ ...personal, degree: e.target.value })}
                    placeholder="E.g., B.Tech, M.Sc"
                  />
                  <InputField
                    label="Branch"
                    icon={BookOpen}
                    value={personal.branch}
                    onChange={(e) => setPersonal({ ...personal, branch: e.target.value })}
                    placeholder="E.g., Computer Science, IT"
                  />
                  <InputField
                    label="Graduation Year"
                    icon={Calendar}
                    value={personal.graduationYear}
                    onChange={(e) => setPersonal({ ...personal, graduationYear: e.target.value })}
                    placeholder="E.g., 2025"
                  />
                  <InputField
                    label="Location"
                    icon={MapPin}
                    value={personal.location}
                    onChange={(e) => setPersonal({ ...personal, location: e.target.value })}
                    placeholder="City, Country"
                  />
                </div>
              </div>
            </div>

            {/* AI Insights Card */}
            <div className="bg-gradient-to-br from-purple-50 to-white rounded-2xl shadow-lg border border-purple-100 overflow-hidden">
              <div className="border-b border-purple-50 bg-gradient-to-r from-purple-50 to-white p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-gradient-to-r from-purple-100 to-pink-100">
                      <Cpu size={24} className="text-purple-600" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">AI-Extracted Insights</h2>
                      <p className="text-gray-600">Automatically extracted from your resume</p>
                    </div>
                  </div>
                  <span className="px-4 py-2 rounded-full bg-purple-100 text-purple-700 text-sm font-semibold">
                    Read-only
                  </span>
                </div>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <AICard
                    title="Skills"
                    icon={Target}
                    items={aiExtracted.skills}
                    color="blue"
                  />
                  <AICard
                    title="Education"
                    icon={GraduationCap}
                    items={aiExtracted.education}
                    color="purple"
                  />
                  <AICard
                    title="Experience"
                    icon={Briefcase}
                    items={aiExtracted.experience}
                    color="indigo"
                  />
                  <AICard
                    title="Projects"
                    icon={FileText}
                    items={aiExtracted.projects}
                    color="pink"
                  />
                  <div className="md:col-span-2">
                    <AICard
                      title="Certifications"
                      icon={Award}
                      items={aiExtracted.certifications}
                      color="green"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <AICard
                      title="Achievements & Awards"
                      icon={Award}
                      items={aiExtracted.achievements}
                      color="blue"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Resume Upload & Career Preferences */}
          <div className="space-y-8">
            {/* Resume Upload Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-blue-100 overflow-hidden">
              <div className="border-b border-blue-50 bg-gradient-to-r from-blue-50 to-white p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-blue-100">
                    <Upload size={24} className="text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Resume Upload</h2>
                    <p className="text-gray-600">Upload your resume for AI analysis</p>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                <label className="group cursor-pointer">
                  <div className="border-3 border-dashed border-blue-200 rounded-2xl p-8 text-center transition-all duration-300 hover:border-blue-400 hover:bg-blue-50/50 group-hover:scale-[1.02]">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 mb-4">
                      <Upload size={28} className="text-blue-600" />
                    </div>
                    <div className="text-blue-600 font-semibold text-lg mb-2">Click to upload resume</div>
                    <p className="text-gray-600 text-sm mb-4">PDF or DOCX up to 5MB</p>
                    <div className="text-sm font-medium text-gray-700 bg-gray-50 rounded-lg py-3 px-4">
                      {resumeStatus}
                    </div>
                  </div>
                  <input 
                    type="file" 
                    accept=".pdf,.doc,.docx" 
                    className="hidden" 
                    onChange={handleResumeUpload} 
                  />
                </label>
                
                <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100">
                  <div className="flex items-start gap-3">
                    <Sparkles size={18} className="text-purple-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">AI Processing</p>
                      <p className="text-sm text-gray-600 mt-1">
                        Your resume will be analyzed to extract skills, experience, and other insights automatically.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Career Preferences Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-purple-100 overflow-hidden">
              <div className="border-b border-purple-50 bg-gradient-to-r from-purple-50 to-white p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-gradient-to-r from-purple-100 to-pink-100">
                    <Target size={24} className="text-purple-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Career Preferences</h2>
                    <p className="text-gray-600">Set your career goals</p>
                  </div>
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                <div>
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-2">
                    <Briefcase size={16} className="text-blue-600" />
                    Target Job Roles
                  </label>
                  <textarea
                    value={careerPrefs.targetRoles}
                    onChange={(e) => setCareerPrefs({ ...careerPrefs, targetRoles: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-blue-300"
                    placeholder="e.g., Frontend Developer, Full Stack Engineer"
                    rows={3}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-2">
                    <TrendingUp size={16} className="text-purple-600" />
                    Skills to Improve
                  </label>
                  <textarea
                    value={careerPrefs.skillsToImprove}
                    onChange={(e) => setCareerPrefs({ ...careerPrefs, skillsToImprove: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-blue-300"
                    placeholder="e.g., AWS, System Design, GraphQL"
                    rows={3}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-2">
                    <Globe size={16} className="text-blue-600" />
                    Preferred Locations
                  </label>
                  <textarea
                    value={careerPrefs.preferredLocations}
                    onChange={(e) => setCareerPrefs({ ...careerPrefs, preferredLocations: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-blue-300"
                    placeholder="e.g., Remote, Bangalore, Hyderabad"
                    rows={3}
                  />
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-100">
                  <div className="flex items-start gap-3">
                    <Sparkles size={18} className="text-purple-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">AI-Powered Recommendations</p>
                      <p className="text-sm text-gray-600 mt-1">
                        Your preferences help AI provide personalized job recommendations and skill gap analysis.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;