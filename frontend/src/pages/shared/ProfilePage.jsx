import React, { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import Cropper from "react-easy-crop";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import {
  getProfile,
  updateProfile,
  uploadAvatar,
  uploadResume,
  deleteResume,
  deleteAvatar,
} from "@/api/profileApi";
import {
  getMyJoinRequestStatus,
  respondToCompanyJoinRequest,
} from "@/api/companyApi";
import api from "@/lib/axios";
import useUserStore from "@/store/userStore";
import { useCompanyStore } from "@/store/companyStore";
import {
  experienceSchema,
  educationSchema,
} from "@/validation/profile.validation";
import getCroppedImg from "@/utils/getCroppedImg";
import { getAvatarSrc } from "@/utils/avatarUtils";

const ProfilePage = () => {
  const { user, setUser, setResumeUrl, token } = useUserStore();
  const { setResumeId } = useCompanyStore();

  // Debug: Log current auth state
  
  
  

  // Ensure token is set in axios headers if available
  React.useEffect(() => {
    const localToken = localStorage.getItem("token");
    const storeToken = token;

    

    // If store has token but localStorage doesn't, sync them
    if (storeToken && !localToken) {
      
      localStorage.setItem("token", storeToken);
    }

    // If we have a token but axios doesn't have the header, set it
    const tokenToUse = storeToken || localToken;
    if (tokenToUse && !api.defaults.headers.common["Authorization"]) {
      
      api.defaults.headers.common["Authorization"] = `Bearer ${tokenToUse}`;
    }

    // If localStorage has token but store doesn't, this might indicate a bigger issue
    if (localToken && !storeToken) {
      console.warn(
        "localStorage has token but Zustand store does not - potential auth issue"
      );
    }
  }, [token]);

  const queryClient = useQueryClient();
  const [isEditingExperience, setIsEditingExperience] = useState(false);
  const [isEditingEducation, setIsEditingEducation] = useState(false);
  const [selectedExperienceIndex, setSelectedExperienceIndex] = useState(null);
  const [selectedEducationIndex, setSelectedEducationIndex] = useState(null);

  // Image cropping states
  const [imageToCrop, setImageToCrop] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isImageCropModalOpen, setIsImageCropModalOpen] = useState(false);

  // Fetch profile data
  const {
    data: profileResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["profile"],
    queryFn: getProfile,
    refetchOnWindowFocus: false,
  });

  // Extract the actual profile data
  const profile = profileResponse?.data || profileResponse;

  // Debug: Log the actual profile data structure
  
  

  const experienceForm = useForm({
    resolver: zodResolver(experienceSchema),
    defaultValues: {
      title: "",
      company: "",
      startDate: "",
      endDate: "",
      description: "",
    },
  });

  const educationForm = useForm({
    resolver: zodResolver(educationSchema),
    defaultValues: {
      degree: "",
      school: "",
      startDate: "",
      endDate: "",
      fieldOfStudy: "",
    },
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: (data) => {
      
      

      // Check token from both localStorage and Zustand store
      const localToken = localStorage.getItem("token");
      const storeToken = useUserStore.getState().token;
      
      
      

      return updateProfile(data);
    },
    onSuccess: (data) => {
      
      
      

      // The backend returns { success: true, message: "...", user: {...} }
      // But axios wraps it in { data: { success: true, message: "...", user: {...} } }
      const userData = data.data?.user || data.user;

      

      queryClient.invalidateQueries(["profile"]);
      if (userData) {
        setUser(userData);
        toast.success("Profile updated successfully");
      } else {
        console.error("No user data in response!");
        toast.error("Profile updated but user data missing");
      }
    },
    onError: (error) => {
      console.error("Profile update error:", error);
      console.error("Error response:", error.response?.data);
      console.error("Error status:", error.response?.status);
      console.error("Error config:", error.config);
      console.error("Current user after error:", user);
      console.error(
        "Token exists after error:",
        !!localStorage.getItem("token")
      );

      // Don't logout on profile update errors
      if (error.response?.status === 401) {
        toast.error("Session expired. Please login again.");
      } else {
        toast.error(
          error.response?.data?.message || "Failed to update profile"
        );
      }
    },
  });

  // Avatar upload mutation
  const avatarUploadMutation = useMutation({
    mutationFn: uploadAvatar,
    onSuccess: (data) => {
      
      
      
      

      queryClient.invalidateQueries(["profile"]);

      // Handle both old and new response structures
      const userData = data.data?.user || data.user;
      
      

      if (userData) {
        setUser(userData);
        
      }

      setIsImageCropModalOpen(false);
      setImageToCrop(null);
      toast.success("Avatar updated successfully");
    },
    onError: (error) => {
      console.error("Avatar upload error:", error);
      console.error("Error response:", error.response?.data);
      toast.error(error.response?.data?.message || "Failed to upload avatar");
    },
  });

  // Resume upload mutation
  const resumeUploadMutation = useMutation({
    mutationFn: uploadResume,
    onSuccess: (data) => {
      
      queryClient.invalidateQueries(["profile"]);

      // Handle both old and new response structures
      const userData = data.data?.user || data.user;
      if (userData) {
        setUser(userData);
        setResumeUrl(userData.resumeUrl);
        setResumeId(userData.resumeUrl); // Keep resumeId and resumeUrl in sync
      }

      toast.success("Resume uploaded successfully");
    },
    onError: (error) => {
      console.error("Resume upload error:", error);
      console.error("Error response:", error.response?.data);
      toast.error(error.response?.data?.message || "Failed to upload resume");
    },
  });

  // Delete resume mutation
  const deleteResumeMutation = useMutation({
    mutationFn: deleteResume,
    onSuccess: (data) => {
      
      queryClient.invalidateQueries(["profile"]);

      // Handle both old and new response structures
      const userData = data.data?.user || data.user;
      if (userData) {
        setUser(userData);
      }
      setResumeUrl(null);
      // Clear resume id from localStorage
      localStorage.removeItem("resumeUrl");
      toast.success("Resume deleted successfully");
    },
    onError: (error) => {
      console.error("Delete resume error:", error);
      console.error("Error response:", error.response?.data);
      toast.error(error.response?.data?.message || "Failed to delete resume");
    },
  });

  // Delete avatar mutation
  const deleteAvatarMutation = useMutation({
    mutationFn: deleteAvatar,
    onSuccess: (data) => {
      
      queryClient.invalidateQueries(["profile"]);

      // Handle both old and new response structures
      const userData = data.data?.user || data.user;
      if (userData) {
        setUser(userData);
      }
      toast.success("Avatar deleted successfully");
    },
    onError: (error) => {
      console.error("Delete avatar error:", error);
      console.error("Error response:", error.response?.data);
      toast.error(error.response?.data?.message || "Failed to delete avatar");
    },
  });

  // Handle image selection for cropping
  const handleImageSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        setImageToCrop(reader.result);
        setIsImageCropModalOpen(true);
      });
      reader.readAsDataURL(file);
    }
  };

  // Handle crop complete
  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  // Handle avatar upload after cropping
  const handleAvatarUpload = async () => {
    try {
      
      
      

      const croppedImage = await getCroppedImg(imageToCrop, croppedAreaPixels);
      

      const file = new File([croppedImage], "avatar.jpg", {
        type: "image/jpeg",
      });
      

      avatarUploadMutation.mutate(file);
    } catch (error) {
      console.error("Error in handleAvatarUpload:", error);
      toast.error("Failed to process image");
    }
  };

  // Handle resume upload
  const handleResumeUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      resumeUploadMutation.mutate(file);
    }
  };

  // Handle resume download
  const handleResumeDownload = () => {
    if (profile?.resumeUrl) {
      window.open(profile.resumeUrl, "_blank");
    }
  };

  // Helper function to create full profile data
  const createProfileData = (updates = {}) => {
    if (!profile) {
      console.error("Profile is not loaded");
      return {};
    }

    // Handle skills: if updates.skills is a string, split by comma and trim
    let skillsArr = Array.isArray(profile.skills) ? profile.skills : [];
    if (typeof updates.skills === "string") {
      skillsArr = updates.skills
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
    } else if (Array.isArray(updates.skills)) {
      skillsArr = updates.skills;
    }

    const profileData = {
      name: profile.name || "",
      email: profile.email || "",
      phone: profile.phone || "",
      headline: profile.headline || "",
      about: profile.about || "",
      location: profile.location || "",
      skills: skillsArr,
      isOpenToWork: Boolean(profile.isOpenToWork),
      social: {
        github: profile.social?.github || "",
        linkedin: profile.social?.linkedin || "",
        twitter: profile.social?.twitter || "",
        portfolio: profile.social?.portfolio || "",
      },
      experience: Array.isArray(profile.experience)
        ? profile.experience.map((exp) => ({
            ...exp,
            startDate: exp.startDate
              ? exp.startDate instanceof Date
                ? exp.startDate.toISOString()
                : exp.startDate
              : "",
            endDate: exp.endDate
              ? exp.endDate instanceof Date
                ? exp.endDate.toISOString()
                : exp.endDate
              : "",
          }))
        : [],
      education: Array.isArray(profile.education)
        ? profile.education.map((edu) => ({
            ...edu,
            startDate: edu.startDate
              ? edu.startDate instanceof Date
                ? edu.startDate.toISOString()
                : edu.startDate
              : "",
            endDate: edu.endDate
              ? edu.endDate instanceof Date
                ? edu.endDate.toISOString()
                : edu.endDate
              : "",
          }))
        : [],
      ...updates,
    };

    // If updates include experience or education, ensure dates are properly formatted
    if (updates.experience) {
      profileData.experience = updates.experience.map((exp) => ({
        ...exp,
        startDate: exp.startDate
          ? exp.startDate instanceof Date
            ? exp.startDate.toISOString()
            : exp.startDate
          : "",
        endDate: exp.endDate
          ? exp.endDate instanceof Date
            ? exp.endDate.toISOString()
            : exp.endDate
          : "",
      }));
    }

    if (updates.education) {
      profileData.education = updates.education.map((edu) => ({
        ...edu,
        startDate: edu.startDate
          ? edu.startDate instanceof Date
            ? edu.startDate.toISOString()
            : edu.startDate
          : "",
        endDate: edu.endDate
          ? edu.endDate instanceof Date
            ? edu.endDate.toISOString()
            : edu.endDate
          : "",
      }));
    }

    
    return profileData;
  };

  // Handle experience form submit
  const onExperienceSubmit = (data) => {
    if (!profile) {
      toast.error("Profile not loaded. Please refresh the page.");
      return;
    }

    
    const updatedExperience = [...(profile?.experience || [])];

    if (selectedExperienceIndex !== null) {
      updatedExperience[selectedExperienceIndex] = data;
    } else {
      updatedExperience.push(data);
    }

    const profileData = createProfileData({ experience: updatedExperience });
    if (Object.keys(profileData).length === 0) {
      toast.error("Failed to prepare profile data");
      return;
    }

    updateProfileMutation.mutate(profileData);
    setIsEditingExperience(false);
    setSelectedExperienceIndex(null);
    experienceForm.reset();
  };

  // Handle education form submit
  const onEducationSubmit = (data) => {
    if (!profile) {
      toast.error("Profile not loaded. Please refresh the page.");
      return;
    }

    
    const updatedEducation = [...(profile?.education || [])];

    if (selectedEducationIndex !== null) {
      updatedEducation[selectedEducationIndex] = data;
    } else {
      updatedEducation.push(data);
    }

    const profileData = createProfileData({ education: updatedEducation });
    if (Object.keys(profileData).length === 0) {
      toast.error("Failed to prepare profile data");
      return;
    }

    updateProfileMutation.mutate(profileData);
    setIsEditingEducation(false);
    setSelectedEducationIndex(null);
    educationForm.reset();
  };

  // Delete experience
  const deleteExperience = (index) => {
    const updatedExperience = profile.experience.filter((_, i) => i !== index);
    updateProfileMutation.mutate(
      createProfileData({ experience: updatedExperience })
    );
  };

  // Delete education
  const deleteEducation = (index) => {
    const updatedEducation = profile.education.filter((_, i) => i !== index);
    updateProfileMutation.mutate(
      createProfileData({ education: updatedEducation })
    );
  };

  // Edit experience
  const editExperience = (index) => {
    const exp = profile.experience[index];
    experienceForm.reset(exp);
    setSelectedExperienceIndex(index);
    setIsEditingExperience(true);
  };

  // Edit education
  const editEducation = (index) => {
    const edu = profile.education[index];
    educationForm.reset(edu);
    setSelectedEducationIndex(index);
    setIsEditingEducation(true);
  };

  const {
    data: joinRequests = [],
    isLoading: loadingJoinRequests,
    error: joinRequestsError,
  } = useQuery({
    queryKey: ["myCompanyJoinRequests"],
    queryFn: getMyJoinRequestStatus,
  });

  const respondMutation = useMutation({
    mutationFn: ({ companyId, status }) => {
      
      return respondToCompanyJoinRequest(companyId, status);
    },
    onSuccess: (data) => {
      
      toast.success("Response sent!");
      queryClient.invalidateQueries(["myCompanyJoinRequests"]);
      queryClient.invalidateQueries(["profile"]);
      
      // Reload the page to update the interface
      window.location.reload();
    },
    onError: (error) => {
      console.error("[DEBUG] Respond mutation error:", error);
      toast.error(
        error.response?.data?.message || "Failed to respond to request"
      );
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            Error Loading Profile
          </h2>
          <p className="text-gray-600">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Main Container */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
              Profile
            </h1>
            <Link to="/profile/edit">
              <Button className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-lg transition-colors duration-200">
                Edit Profile
              </Button>
            </Link>
          </div>
          <p className="text-gray-500 text-sm leading-relaxed">
            Manage your profile information and preferences
          </p>
        </div>

        {/* Profile Identity Section */}
        <div className="mb-12">
          <div className="flex items-start gap-6">
            <div className="relative">
              <Avatar className="h-20 w-20 ring-1 ring-gray-200">
                <AvatarImage
                  src={getAvatarSrc(profile?.avatarUrl)}
                  alt={profile?.name}
                  onError={(e) => {
                    e.target.src = getAvatarSrc(null);
                  }}
                />
                <AvatarFallback className="text-lg font-medium text-gray-600 bg-gray-50">
                  {profile?.name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute -bottom-1 -right-1 h-6 w-6 p-0 bg-white border border-gray-200 hover:border-gray-300 rounded-full shadow-sm"
                  >
                    <svg
                      className="h-3 w-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Update Avatar</DialogTitle>
                    <DialogDescription>
                      Upload a new profile picture or delete your current
                      avatar.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="w-full"
                    />
                    {profile?.avatarUrl && (
                      <Button
                        variant="destructive"
                        onClick={() => deleteAvatarMutation.mutate()}
                        disabled={deleteAvatarMutation.isPending}
                      >
                        Delete Avatar
                      </Button>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="flex-1 space-y-1">
              <h2 className="text-xl font-semibold text-gray-900 leading-tight">
                {profile?.name || "Unknown User"}
              </h2>
              {profile?.headline && (
                <p className="text-base text-gray-600 leading-relaxed">
                  {profile.headline}
                </p>
              )}
              <div className="flex items-center gap-4 pt-1">
                {profile?.location && (
                  <div className="flex items-center gap-1.5 text-gray-500">
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <span className="text-sm">{profile.location}</span>
                  </div>
                )}
                {profile?.isOpenToWork && (
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-green-700 font-medium">
                      Open to work
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* About Section */}
        {profile?.about && (
          <div className="mb-10">
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-semibold text-gray-900 mb-2">
                  About
                </h3>
                <div className="h-px bg-gray-200"></div>
              </div>
              <p className="text-gray-700 leading-relaxed text-sm max-w-4xl">
                {profile.about}
              </p>
            </div>
          </div>
        )}

        {/* Experience Section */}
        <div className="mb-10">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-gray-900 mb-2">
                  Experience
                </h3>
                <div className="h-px bg-gray-200"></div>
              </div>
              <Button
                onClick={() => setIsEditingExperience(true)}
                variant="ghost"
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                Add Experience
              </Button>
            </div>

            <div className="space-y-6">
              {profile?.experience?.map((exp, index) => (
                <div key={index} className="group relative">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2V6"
                        />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-sm font-semibold text-gray-900 leading-tight">
                            {exp.title}
                          </h4>
                          <p className="text-gray-600 font-medium mt-0.5 text-sm">
                            {exp.company}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {exp.startDate && !isNaN(new Date(exp.startDate))
                              ? new Date(exp.startDate)
                                  .toISOString()
                                  .slice(0, 10)
                              : ""}
                            {" - "}
                            {exp.endDate && !isNaN(new Date(exp.endDate))
                              ? new Date(exp.endDate).toISOString().slice(0, 10)
                              : "Present"}
                          </p>
                          {exp.description && (
                            <p className="text-gray-700 mt-2 leading-relaxed text-sm">
                              {exp.description}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => editExperience(index)}
                            className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
                          >
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteExperience(index)}
                            className="h-8 w-8 p-0 text-gray-400 hover:text-red-600"
                          >
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                  {index < profile.experience.length - 1 && (
                    <div className="ml-4 mt-6 h-px bg-gray-100"></div>
                  )}
                </div>
              ))}

              {(!profile?.experience || profile.experience.length === 0) && (
                <div className="text-center py-8">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <svg
                      className="w-5 h-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2V6"
                      />
                    </svg>
                  </div>
                  <p className="text-gray-500 text-sm">
                    No experience added yet
                  </p>
                  <Button
                    onClick={() => setIsEditingExperience(true)}
                    variant="ghost"
                    className="text-gray-600 hover:text-gray-900 font-medium mt-2"
                  >
                    Add your first experience
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Education Section */}
        <div className="mb-10">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-gray-900 mb-2">
                  Education
                </h3>
                <div className="h-px bg-gray-200"></div>
              </div>
              <Button
                onClick={() => setIsEditingEducation(true)}
                variant="ghost"
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                Add Education
              </Button>
            </div>

            <div className="space-y-6">
              {profile?.education?.map((edu, index) => (
                <div key={index} className="group relative">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 14l9-5-9-5-9 5 9 5z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
                        />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-sm font-semibold text-gray-900 leading-tight">
                            {edu.degree}
                          </h4>
                          <p className="text-gray-600 font-medium mt-0.5 text-sm">
                            {edu.school}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {edu.startDate && !isNaN(new Date(edu.startDate))
                              ? new Date(edu.startDate)
                                  .toISOString()
                                  .slice(0, 10)
                              : ""}
                            {" - "}
                            {edu.endDate && !isNaN(new Date(edu.endDate))
                              ? new Date(edu.endDate).toISOString().slice(0, 10)
                              : "Present"}
                          </p>
                          {edu.fieldOfStudy && (
                            <p className="text-gray-700 mt-1 text-sm">
                              {edu.fieldOfStudy}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => editEducation(index)}
                            className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
                          >
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteEducation(index)}
                            className="h-8 w-8 p-0 text-gray-400 hover:text-red-600"
                          >
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                  {index < profile.education.length - 1 && (
                    <div className="ml-6 mt-8 h-px bg-gray-100"></div>
                  )}
                </div>
              ))}

              {(!profile?.education || profile.education.length === 0) && (
                <div className="text-center py-12">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-6 h-6 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 14l9-5-9-5-9 5 9 5z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
                      />
                    </svg>
                  </div>
                  <p className="text-gray-500">No education added yet</p>
                  <Button
                    onClick={() => setIsEditingEducation(true)}
                    variant="ghost"
                    className="text-gray-600 hover:text-gray-900 font-medium mt-2"
                  >
                    Add your first education
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Skills Section */}
        {profile?.skills?.length > 0 && (
          <div className="mb-10">
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-semibold text-gray-900 mb-2">
                  Skills
                </h3>
                <div className="h-px bg-gray-200"></div>
              </div>
              <div className="flex flex-wrap gap-2">
                {profile.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2.5 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Resume Section */}
        <div className="mb-10">
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-2">
                Resume
              </h3>
              <div className="h-px bg-gray-200"></div>
            </div>

            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {profile?.resumeUrl ? "Resume.pdf" : "No resume uploaded"}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {profile?.resumeUrl
                      ? "Ready for download"
                      : "Upload your resume to share with recruiters"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleResumeUpload}
                    disabled={resumeUploadMutation.isPending}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Button
                    variant="ghost"
                    className="text-gray-600 hover:text-gray-900 font-medium"
                    disabled={resumeUploadMutation.isPending}
                  >
                    {resumeUploadMutation.isPending ? "Uploading..." : "Upload"}
                  </Button>
                </div>

                {profile?.resumeUrl && (
                  <>
                    <Button
                      variant="ghost"
                      onClick={handleResumeDownload}
                      className="text-gray-600 hover:text-gray-900 font-medium"
                    >
                      Download
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => deleteResumeMutation.mutate()}
                      disabled={deleteResumeMutation.isPending}
                      className="text-red-600 hover:text-red-700 font-medium"
                    >
                      Delete
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Company Join Requests Section */}
        <div className="mb-10">
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-2">
                Company Join Requests
              </h3>
              <div className="h-px bg-gray-200"></div>
            </div>
            {loadingJoinRequests ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-gray-800"></div>
              </div>
            ) : joinRequestsError ? (
              <div className="text-center py-8">
                <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-2">
                  <svg
                    className="w-5 h-5 text-red-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <p className="text-red-600 font-medium text-sm">
                  Failed to load join requests
                </p>
              </div>
            ) : joinRequests.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2V6"
                    />
                  </svg>
                </div>
                <p className="text-gray-500 text-sm">
                  No company join requests
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {joinRequests.map((req) => (
                  <div
                    key={req._id}
                    className="group p-4 bg-gradient-to-r from-white to-gray-50/30 border border-gray-200/60 rounded-lg hover:shadow-md hover:border-gray-300/60 transition-all duration-300"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-gray-600 to-gray-800 rounded-lg flex items-center justify-center text-white font-semibold shadow-sm">
                          {req.company?.name?.charAt(0).toUpperCase() || "C"}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-base font-semibold text-gray-900 tracking-tight mb-1">
                            {req.company?.name || "Unknown Company"}
                          </h3>
                          <p className="text-gray-600 font-medium text-sm mb-2">
                            {req.company?.industry}
                          </p>
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs font-medium bg-blue-50 text-blue-700 border-blue-200">
                              {req.roleTitle}
                            </span>
                            <span
                              className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs font-medium ${
                                req.status === "pending"
                                  ? "bg-amber-50 text-amber-700 border-amber-200"
                                  : req.status === "accepted"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : "bg-red-50 text-red-700 border-red-200"
                              }`}
                            >
                              {req.status}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500 font-medium mb-3">
                          {new Date(req.requestedAt).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </p>
                        {req.status === "pending" && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => {
                                const companyId =
                                  req.companyId ||
                                  (req.company && req.company._id);
                                if (!companyId) {
                                  console.error(
                                    "[DEBUG] No companyId found in join request:",
                                    req
                                  );
                                  return;
                                }
                                respondMutation.mutate({
                                  companyId,
                                  status: "accepted",
                                });
                              }}
                              disabled={respondMutation.isPending}
                              className="h-8 px-3 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 hover:border-emerald-300 rounded-md font-medium text-xs transition-all duration-200 shadow-none hover:shadow-sm"
                            >
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => {
                                const companyId =
                                  req.companyId ||
                                  (req.company && req.company._id);
                                if (!companyId) {
                                  console.error(
                                    "[DEBUG] No companyId found in join request:",
                                    req
                                  );
                                  return;
                                }
                                respondMutation.mutate({
                                  companyId,
                                  status: "rejected",
                                });
                              }}
                              disabled={respondMutation.isPending}
                              className="h-8 px-3 bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 hover:border-red-300 rounded-md font-medium text-xs transition-all duration-200 shadow-none hover:shadow-sm"
                            >
                              Reject
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Image Crop Modal */}
      <Dialog
        open={isImageCropModalOpen}
        onOpenChange={setIsImageCropModalOpen}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Crop Avatar</DialogTitle>
            <DialogDescription>
              Adjust the crop area to select the portion of the image you want
              to use as your avatar.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {imageToCrop && (
              <div className="relative h-64 w-full">
                <Cropper
                  image={imageToCrop}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                  cropShape="round"
                  showGrid={false}
                />
              </div>
            )}
            <div className="flex gap-2">
              <Button
                onClick={handleAvatarUpload}
                disabled={avatarUploadMutation.isPending}
                className="flex-1"
              >
                {avatarUploadMutation.isPending ? "Uploading..." : "Upload"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsImageCropModalOpen(false);
                  setImageToCrop(null);
                }}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Experience Modal */}
      <Dialog open={isEditingExperience} onOpenChange={setIsEditingExperience}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedExperienceIndex !== null ? "Edit" : "Add"} Experience
            </DialogTitle>
            <DialogDescription>
              {selectedExperienceIndex !== null
                ? "Update your work experience details below."
                : "Add a new work experience to your profile."}
            </DialogDescription>
          </DialogHeader>
          <Form {...experienceForm}>
            <form
              onSubmit={experienceForm.handleSubmit(onExperienceSubmit)}
              className="space-y-4"
            >
              <FormField
                control={experienceForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Title</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={experienceForm.control}
                name="company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={experienceForm.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={experienceForm.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={experienceForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={4} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-2 pt-4">
                <Button
                  type="submit"
                  disabled={updateProfileMutation.isPending}
                  className="flex-1"
                >
                  {updateProfileMutation.isPending ? "Saving..." : "Save"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditingExperience(false);
                    setSelectedExperienceIndex(null);
                    experienceForm.reset();
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Education Modal */}
      <Dialog open={isEditingEducation} onOpenChange={setIsEditingEducation}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedEducationIndex !== null ? "Edit" : "Add"} Education
            </DialogTitle>
            <DialogDescription>
              {selectedEducationIndex !== null
                ? "Update your education details below."
                : "Add a new education entry to your profile."}
            </DialogDescription>
          </DialogHeader>
          <Form {...educationForm}>
            <form
              onSubmit={educationForm.handleSubmit(onEducationSubmit)}
              className="space-y-4"
            >
              <FormField
                control={educationForm.control}
                name="degree"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Degree</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={educationForm.control}
                name="school"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>School/Institution</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={educationForm.control}
                name="fieldOfStudy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Field of Study</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={educationForm.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={educationForm.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  type="submit"
                  disabled={updateProfileMutation.isPending}
                  className="flex-1"
                >
                  {updateProfileMutation.isPending ? "Saving..." : "Save"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditingEducation(false);
                    setSelectedEducationIndex(null);
                    educationForm.reset();
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProfilePage;
