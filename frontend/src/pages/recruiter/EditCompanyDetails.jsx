import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ImageCropModal from "@/components/ImageCropModal";
import {
  ArrowLeft,
  Building2,
  MapPin,
  Users,
  Globe,
  Mail,
  Phone,
  Save,
  Upload,
  X,
  Camera,
  Image as ImageIcon,
  Calendar,
  Linkedin,
  Twitter,
  Github,
} from "lucide-react";
import { toast } from "sonner";
import useAuthStore from "@/store/userStore";
import { useCompanyStore } from "@/store/companyStore";
import {
  getCompanyById,
  updateCompany,
  getMyCompany,
  uploadCompanyLogo,
  uploadCompanyCover,
} from "@/api/companyApi";

const EditCompanyDetails = () => {
  const { companyId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    companyData,
    companyRole,
    companyId: userCompanyId,
  } = useCompanyStore();
  const queryClient = useQueryClient();

  // Use companyId from params or from user's company
  const targetCompanyId =
    companyId || companyData?.company?._id || companyData?.company;

  // Debug logging
  React.useEffect(() => {
    
    
    
    
    
    
    
  }, [companyId, user, companyData, targetCompanyId]);

  const [formData, setFormData] = useState({
    name: "",
    industry: "",
    size: "",
    location: "",
    website: "",
    phone: "",
    foundedYear: "",
    description: "",
    logo: "",
    coverImage: "",
    benefits: [],
    specialties: [],
    socialLinks: {
      linkedin: "",
      twitter: "",
      github: "",
    },
  });

  const [newBenefit, setNewBenefit] = useState("");
  const [newSpecialty, setNewSpecialty] = useState("");

  // Image cropping states
  const [cropModal, setCropModal] = useState({
    open: false,
    imageSrc: null,
    type: null, // 'logo' or 'cover'
  });
  const [logoPreview, setLogoPreview] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [logoFile, setLogoFile] = useState(null); // Store the actual file
  const [coverFile, setCoverFile] = useState(null); // Store the actual file
  const [isUploading, setIsUploading] = useState(false);

  // Fetch company details
  const {
    data: company,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["company", targetCompanyId || "my-company"],
    queryFn: () => {
      if (targetCompanyId) {
        return getCompanyById(targetCompanyId);
      } else {
        return getMyCompany();
      }
    },
    enabled: !!targetCompanyId || !companyId, // Fetch if we have an ID or we're in "my company" mode
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (updatedData) => {
      const companyIdToUpdate = targetCompanyId || company?._id;
      return updateCompany(companyIdToUpdate, updatedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries([
        "company",
        targetCompanyId || "my-company",
      ]);
      queryClient.invalidateQueries(["companies"]);
      toast.success("Company details updated successfully!");
    },
    onError: (error) => {
      console.error("Update error:", error);
      toast.error("Failed to update company details");
    },
  });

  // Populate form when company data is loaded
  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name || "",
        industry: company.industry || "",
        size: company.size || "",
        location: company.location || "",
        website: company.website || "",
        phone: company.phone || "",
        foundedYear: company.foundedYear ? company.foundedYear.toString() : "",
        description: company.description || "",
        logo: company.logo || "",
        coverImage: company.coverImage || "",
        benefits: company.benefits || [],
        specialties: company.specialties || [],
        socialLinks: {
          linkedin: company.socialLinks?.linkedin || "",
          twitter: company.socialLinks?.twitter || "",
          github: company.socialLinks?.github || "",
        },
      });

      // Set image previews
      setLogoPreview(company.logo || null);
      setCoverPreview(company.coverImage || null);
    }
  }, [company]);

  // Cleanup object URLs when component unmounts
  useEffect(() => {
    return () => {
      if (logoPreview && logoPreview.startsWith("blob:")) {
        URL.revokeObjectURL(logoPreview);
      }
      if (coverPreview && coverPreview.startsWith("blob:")) {
        URL.revokeObjectURL(coverPreview);
      }
    };
  }, [logoPreview, coverPreview]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSocialLinkChange = (platform, value) => {
    setFormData((prev) => ({
      ...prev,
      socialLinks: {
        ...prev.socialLinks,
        [platform]: value,
      },
    }));
  };

  const handleAddBenefit = () => {
    if (newBenefit.trim() && !formData.benefits.includes(newBenefit.trim())) {
      setFormData((prev) => ({
        ...prev,
        benefits: [...prev.benefits, newBenefit.trim()],
      }));
      setNewBenefit("");
    }
  };

  const handleRemoveBenefit = (index) => {
    setFormData((prev) => ({
      ...prev,
      benefits: prev.benefits.filter((_, i) => i !== index),
    }));
  };

  const handleAddSpecialty = () => {
    if (
      newSpecialty.trim() &&
      !formData.specialties.includes(newSpecialty.trim())
    ) {
      setFormData((prev) => ({
        ...prev,
        specialties: [...prev.specialties, newSpecialty.trim()],
      }));
      setNewSpecialty("");
    }
  };

  const handleRemoveSpecialty = (index) => {
    setFormData((prev) => ({
      ...prev,
      specialties: prev.specialties.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!formData.name.trim()) {
      toast.error("Company name is required");
      return;
    }

    if (!formData.industry.trim()) {
      toast.error("Industry is required");
      return;
    }

    setIsUploading(true);

    try {
      const companyIdToUpdate = targetCompanyId || company?._id;

      // First update the basic company data (excluding image URLs from blob URLs)
      const dataToUpdate = {
        name: formData.name.trim(),
        industry: formData.industry.trim(),
        size: formData.size || null,
        location: formData.location.trim() || null,
        website: formData.website.trim() || null,
        phone: formData.phone.trim() || null,
        foundedYear: formData.foundedYear
          ? parseInt(formData.foundedYear)
          : null,
        email: user?.email || null, // Use email from user store
        description: formData.description.trim() || null,
        benefits: formData.benefits,
        specialties: formData.specialties,
        socialLinks: {
          linkedin: formData.socialLinks.linkedin.trim() || null,
          twitter: formData.socialLinks.twitter.trim() || null,
          github: formData.socialLinks.github.trim() || null,
        },
        // Handle logo and cover image URLs (exclude blob URLs)
        ...(formData.logo &&
          !formData.logo.startsWith("blob:") && { logo: formData.logo }),
        ...(formData.coverImage &&
          !formData.coverImage.startsWith("blob:") && {
            coverImage: formData.coverImage,
          }),
      };

      // Remove undefined values
      Object.keys(dataToUpdate).forEach((key) => {
        if (dataToUpdate[key] === undefined || dataToUpdate[key] === "") {
          delete dataToUpdate[key];
        }
      });

      // Update company details
      await updateMutation.mutateAsync(dataToUpdate);

      // Upload images if they exist
      const uploadPromises = [];

      if (logoFile) {
        uploadPromises.push(uploadCompanyLogo(companyIdToUpdate, logoFile));
      }

      if (coverFile) {
        uploadPromises.push(uploadCompanyCover(companyIdToUpdate, coverFile));
      }

      // Wait for all image uploads to complete
      if (uploadPromises.length > 0) {
        await Promise.all(uploadPromises);
        toast.success("Company details and images updated successfully!");

        // Refresh the company data to get the new image URLs
        queryClient.invalidateQueries(["company", companyIdToUpdate]);
      }
    } catch (error) {
      console.error("Update error:", error);
      toast.error("Failed to update company details");
    } finally {
      setIsUploading(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  // Image handling functions
  const handleImageUpload = (type) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setCropModal({
            open: true,
            imageSrc: e.target.result,
            type: type,
          });
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const handleCropComplete = (croppedImageFile) => {
    const type = cropModal.type;

    // Convert the File object to a URL for preview
    const imageUrl = URL.createObjectURL(croppedImageFile);

    if (type === "logo") {
      setLogoPreview(imageUrl);
      setLogoFile(croppedImageFile); // Store the file for upload
      setFormData((prev) => ({ ...prev, logo: imageUrl }));
    } else if (type === "cover") {
      setCoverPreview(imageUrl);
      setCoverFile(croppedImageFile); // Store the file for upload
      setFormData((prev) => ({ ...prev, coverImage: imageUrl }));
    }
    setCropModal({ open: false, imageSrc: null, type: null });
  };

  const handleRemoveImage = (type) => {
    if (type === "logo") {
      // Clean up object URL if it exists
      if (logoPreview && logoPreview.startsWith("blob:")) {
        URL.revokeObjectURL(logoPreview);
      }
      setLogoPreview(null);
      setLogoFile(null);
      setFormData((prev) => ({ ...prev, logo: "" }));
    } else if (type === "cover") {
      // Clean up object URL if it exists
      if (coverPreview && coverPreview.startsWith("blob:")) {
        URL.revokeObjectURL(coverPreview);
      }
      setCoverPreview(null);
      setCoverFile(null);
      setFormData((prev) => ({ ...prev, coverImage: "" }));
    }
  };

  // Access control check - only admins can edit company details
  // and they can only edit their own company
  if (companyRole !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
        <p className="text-gray-500 mb-4">
          Only company admins can edit company details.
        </p>
        <Button
          onClick={() => navigate("/recruiter/dashboard")}
          variant="outline"
        >
          <ArrowLeft size={16} className="mr-2" />
          Back to Dashboard
        </Button>
      </div>
    );
  }

  // If viewing a specific company by ID, ensure it's the admin's own company
  if (companyId && companyId !== userCompanyId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
        <p className="text-gray-500 mb-4">
          You can only edit your own company's details.
        </p>
        <Button
          onClick={() => navigate("/recruiter/dashboard")}
          variant="outline"
        >
          <ArrowLeft size={16} className="mr-2" />
          Back to Dashboard
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!targetCompanyId && companyId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h2 className="text-2xl font-bold text-gray-600 mb-4">
          No Company Associated
        </h2>
        <p className="text-gray-500 mb-4">
          You need to be associated with a company to edit its details.
        </p>
        <Button
          onClick={() => navigate("/recruiter/company-choice")}
          variant="outline"
        >
          <ArrowLeft size={16} className="mr-2" />
          Choose Company
        </Button>
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h2 className="text-2xl font-bold text-gray-600 mb-4">
          Company not found
        </h2>
        <p className="text-gray-500 mb-4">
          {error?.message ||
            "The company you're trying to edit could not be found."}
        </p>
        <Button onClick={handleBack} variant="outline">
          <ArrowLeft size={16} className="mr-2" />
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div
      className="relative min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-50"
      style={{ fontFamily: '"Inter", "SF Pro Display", system-ui, sans-serif' }}
    >
      <div className="mx-auto max-w-5xl px-6 py-12 sm:px-8 lg:px-12">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-start gap-6">
            <Button
              onClick={handleBack}
              variant="ghost"
              className="mt-1 -ml-2 flex items-center gap-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 transition-all duration-200 rounded-xl px-3 py-2 font-medium"
            >
              <ArrowLeft size={18} className="text-slate-500" />
              Back
            </Button>
            <div className="flex-1">
              <h1 className="text-4xl font-semibold tracking-tight text-slate-900 mb-3">
                Edit Company Details
              </h1>
              <p className="text-lg text-slate-600 font-light leading-relaxed">
                Update your company information to attract top talent and build
                credibility
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-10">
          {/* Company Branding */}
          <Card className="border-0 shadow-sm bg-white/70 backdrop-blur-sm ring-1 ring-slate-200/50 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-slate-50/80 to-zinc-50/80 border-b border-slate-200/60 px-8 py-7">
              <CardTitle className="flex items-center gap-3 text-xl font-semibold text-slate-800">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center">
                  <ImageIcon size={18} className="text-white" />
                </div>
                Company Branding
              </CardTitle>
              <p className="text-sm text-slate-600 font-normal mt-2 leading-relaxed">
                Upload your company logo and cover image to make a great first
                impression
              </p>
            </CardHeader>
            <CardContent className="px-8 py-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Logo Section */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-slate-800 tracking-tight">
                      Company Logo
                    </h3>
                    <Badge
                      variant="secondary"
                      className="text-xs font-medium bg-slate-100 text-slate-600 border-0 px-3 py-1.5 rounded-full"
                    >
                      Recommended: 512×512px
                    </Badge>
                  </div>

                  <div className="relative">
                    {logoPreview ? (
                      <div className="relative group">
                        <div className="w-48 h-48 mx-auto bg-gradient-to-br from-slate-50 to-zinc-100 rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm ring-1 ring-slate-200/20">
                          <img
                            src={logoPreview}
                            alt="Company Logo Preview"
                            className="w-full h-full object-contain p-4"
                          />
                        </div>
                        <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/60 transition-all duration-300 rounded-2xl flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-95 group-hover:scale-100 flex gap-3">
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              onClick={() => handleImageUpload("logo")}
                              className="bg-white/95 text-slate-700 hover:bg-white border-0 shadow-lg backdrop-blur-sm font-medium px-4 py-2.5 rounded-xl"
                            >
                              <Camera size={16} className="mr-2" />
                              Change
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="destructive"
                              onClick={() => handleRemoveImage("logo")}
                              className="bg-red-500/95 hover:bg-red-600 border-0 shadow-lg backdrop-blur-sm font-medium px-4 py-2.5 rounded-xl"
                            >
                              <X size={16} className="mr-2" />
                              Remove
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => handleImageUpload("logo")}
                        className="w-48 h-48 mx-auto bg-gradient-to-br from-slate-50 to-zinc-100 rounded-2xl border-2 border-dashed border-slate-300 hover:border-slate-400 cursor-pointer transition-all duration-300 flex flex-col items-center justify-center group hover:shadow-sm"
                      >
                        <Upload
                          size={28}
                          className="text-slate-400 group-hover:text-slate-600 mb-3 transition-colors duration-300"
                        />
                        <p className="text-sm text-slate-600 font-medium text-center px-4 leading-relaxed">
                          Click to upload logo
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          PNG, JPG or SVG
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="text-center">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleImageUpload("logo")}
                      className="border-slate-300 hover:border-slate-400 hover:bg-slate-50 text-slate-700 font-medium px-6 py-2.5 rounded-xl transition-all duration-200"
                    >
                      <Upload size={16} className="mr-2" />
                      {logoPreview ? "Change Logo" : "Upload Logo"}
                    </Button>
                  </div>
                </div>

                {/* Cover Image Section */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-slate-800 tracking-tight">
                      Cover Image
                    </h3>
                    <Badge
                      variant="secondary"
                      className="text-xs font-medium bg-slate-100 text-slate-600 border-0 px-3 py-1.5 rounded-full"
                    >
                      Recommended: 1200×675px
                    </Badge>
                  </div>

                  <div className="relative">
                    {coverPreview ? (
                      <div className="relative group">
                        <div className="w-full h-44 bg-gradient-to-br from-slate-50 to-zinc-100 rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm ring-1 ring-slate-200/20">
                          <img
                            src={coverPreview}
                            alt="Cover Image Preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/60 transition-all duration-300 rounded-2xl flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-95 group-hover:scale-100 flex gap-3">
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              onClick={() => handleImageUpload("cover")}
                              className="bg-white/95 text-slate-700 hover:bg-white border-0 shadow-lg backdrop-blur-sm font-medium px-4 py-2.5 rounded-xl"
                            >
                              <Camera size={16} className="mr-2" />
                              Change
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="destructive"
                              onClick={() => handleRemoveImage("cover")}
                              className="bg-red-500/95 hover:bg-red-600 border-0 shadow-lg backdrop-blur-sm font-medium px-4 py-2.5 rounded-xl"
                            >
                              <X size={16} className="mr-2" />
                              Remove
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => handleImageUpload("cover")}
                        className="w-full h-44 bg-gradient-to-br from-slate-50 to-zinc-100 rounded-2xl border-2 border-dashed border-slate-300 hover:border-slate-400 cursor-pointer transition-all duration-300 flex flex-col items-center justify-center group hover:shadow-sm"
                      >
                        <Upload
                          size={28}
                          className="text-slate-400 group-hover:text-slate-600 mb-3 transition-colors duration-300"
                        />
                        <p className="text-sm text-slate-600 font-medium text-center px-4 leading-relaxed">
                          Click to upload cover image
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          PNG, JPG (16:9 ratio)
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="text-center">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleImageUpload("cover")}
                      className="border-slate-300 hover:border-slate-400 hover:bg-slate-50 text-slate-700 font-medium px-6 py-2.5 rounded-xl transition-all duration-200"
                    >
                      <Upload size={16} className="mr-2" />
                      {coverPreview ? "Change Cover" : "Upload Cover"}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Tips */}
              <div className="mt-8 p-6 bg-gradient-to-r from-slate-50/80 to-zinc-50/80 rounded-2xl border border-slate-200/60 ring-1 ring-slate-200/20">
                <div className="flex items-start gap-4">
                  <div className="w-6 h-6 bg-gradient-to-br from-slate-600 to-slate-800 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  <div className="text-sm text-slate-700">
                    <p className="font-medium mb-3 text-slate-800">
                      Image Guidelines:
                    </p>
                    <ul className="space-y-2 text-slate-600 leading-relaxed">
                      <li className="flex items-start gap-2">
                        <span className="text-slate-400 mt-1">•</span>
                        <span>
                          <strong className="font-medium text-slate-700">
                            Logo:
                          </strong>{" "}
                          Square format (1:1 ratio), transparent background
                          recommended
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-slate-400 mt-1">•</span>
                        <span>
                          <strong className="font-medium text-slate-700">
                            Cover:
                          </strong>{" "}
                          Landscape format (16:9 ratio), represents your company
                          culture
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-slate-400 mt-1">•</span>
                        <span>
                          <strong className="font-medium text-slate-700">
                            Quality:
                          </strong>{" "}
                          High-resolution images for professional appearance
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Basic Information */}
          <Card className="border-0 shadow-sm bg-white/70 backdrop-blur-sm ring-1 ring-slate-200/50">
            <CardHeader className="px-8 py-7 border-b border-slate-200/60">
              <CardTitle className="flex items-center gap-3 text-xl font-semibold text-slate-800">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center">
                  <Building2 size={18} className="text-white" />
                </div>
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="px-8 py-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-slate-800 mb-3 tracking-tight">
                    Company Name <span className="text-red-500 ml-1">*</span>
                  </label>
                  <Input
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Enter your company name"
                    className="h-12 px-4 bg-white border-slate-200 rounded-xl focus:border-slate-400 focus:ring-0 text-slate-800 font-medium placeholder:text-slate-400 placeholder:font-normal transition-all duration-200 hover:border-slate-300"
                    required
                  />
                </div>
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-slate-800 mb-3 tracking-tight">
                    Industry <span className="text-red-500 ml-1">*</span>
                  </label>
                  <Input
                    value={formData.industry}
                    onChange={(e) =>
                      handleInputChange("industry", e.target.value)
                    }
                    placeholder="e.g., Technology, Healthcare"
                    className="h-12 px-4 bg-white border-slate-200 rounded-xl focus:border-slate-400 focus:ring-0 text-slate-800 font-medium placeholder:text-slate-400 placeholder:font-normal transition-all duration-200 hover:border-slate-300"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-slate-800 mb-3 tracking-tight">
                    Company Size
                  </label>
                  <select
                    value={formData.size}
                    onChange={(e) => handleInputChange("size", e.target.value)}
                    className="h-12 px-4 bg-white border border-slate-200 rounded-xl focus:border-slate-400 focus:ring-0 text-slate-800 font-medium transition-all duration-200 hover:border-slate-300 cursor-pointer"
                  >
                    <option value="" className="text-slate-400">
                      Select company size
                    </option>
                    <option value="1-10">1-10 employees</option>
                    <option value="11-50">11-50 employees</option>
                    <option value="51-200">51-200 employees</option>
                    <option value="201-500">201-500 employees</option>
                    <option value="501-1000">501-1000 employees</option>
                    <option value="1000+">1000+ employees</option>
                  </select>
                </div>
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-slate-800 mb-3 tracking-tight">
                    Founded Year
                  </label>
                  <div className="relative">
                    <Calendar
                      size={18}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400"
                    />
                    <Input
                      value={formData.foundedYear}
                      onChange={(e) =>
                        handleInputChange("foundedYear", e.target.value)
                      }
                      placeholder="e.g., 2010"
                      type="number"
                      min="1950"
                      max={new Date().getFullYear()}
                      className="h-12 pl-12 pr-4 bg-white border-slate-200 rounded-xl focus:border-slate-400 focus:ring-0 text-slate-800 font-medium placeholder:text-slate-400 placeholder:font-normal transition-all duration-200 hover:border-slate-300"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-slate-800 mb-3 tracking-tight">
                    Location
                  </label>
                  <div className="relative">
                    <MapPin
                      size={18}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400"
                    />
                    <Input
                      value={formData.location}
                      onChange={(e) =>
                        handleInputChange("location", e.target.value)
                      }
                      placeholder="City, Country"
                      className="h-12 pl-12 pr-4 bg-white border-slate-200 rounded-xl focus:border-slate-400 focus:ring-0 text-slate-800 font-medium placeholder:text-slate-400 placeholder:font-normal transition-all duration-200 hover:border-slate-300"
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-slate-800 mb-3 tracking-tight">
                    Phone
                  </label>
                  <div className="relative">
                    <Phone
                      size={18}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400"
                    />
                    <Input
                      value={formData.phone}
                      onChange={(e) => {
                        const value = e.target.value
                          .replace(/\D/g, "")
                          .slice(0, 10);
                        handleInputChange("phone", value);
                      }}
                      maxLength={10}
                      placeholder="Enter 10-digit mobile number"
                      className="h-12 pl-12 pr-4 bg-white border-slate-200 rounded-xl focus:border-slate-400 focus:ring-0 text-slate-800 font-medium placeholder:text-slate-400 placeholder:font-normal transition-all duration-200 hover:border-slate-300"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-slate-800 mb-3 tracking-tight">
                  Company Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
                  placeholder="Tell us about your company, mission, and values..."
                  rows={4}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-slate-400 focus:ring-0 text-slate-800 font-medium placeholder:text-slate-400 placeholder:font-normal transition-all duration-200 hover:border-slate-300 resize-none leading-relaxed"
                />
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-slate-200/60">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                <Mail className="w-5 h-5 text-slate-600" />
              </div>
              <h2 className="text-xl font-semibold text-slate-800 tracking-tight">
                Contact Information
              </h2>
              <div className="h-px bg-gradient-to-r from-slate-200 to-transparent flex-1 ml-4"></div>
            </div>
            <p className="text-sm text-slate-600 mb-8 pl-13">
              Company contact email will be automatically set to your account
              email:{" "}
              <span className="font-medium text-slate-800 bg-slate-50 px-2 py-1 rounded-md">
                {user?.email}
              </span>
            </p>

            <div className="space-y-8">
              <div className="space-y-3">
                <label className="block text-sm font-medium text-slate-800 mb-3 tracking-tight">
                  Website
                </label>
                <div className="relative">
                  <Globe
                    size={18}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400"
                  />
                  <Input
                    value={formData.website}
                    onChange={(e) =>
                      handleInputChange("website", e.target.value)
                    }
                    placeholder="https://yourcompany.com"
                    className="h-12 pl-12 pr-4 bg-white border-slate-200 rounded-xl focus:border-slate-400 focus:ring-0 text-slate-800 font-medium placeholder:text-slate-400 placeholder:font-normal transition-all duration-200 hover:border-slate-300"
                  />
                </div>
              </div>

              {/* Social Links */}
              <div className="space-y-6">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center">
                    <Users className="w-4 h-4 text-slate-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800 tracking-tight">
                    Social Media Links
                  </h3>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Connect your company's social media profiles to build
                  credibility and reach
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-slate-800 mb-3 tracking-tight">
                      LinkedIn
                    </label>
                    <div className="relative">
                      <Linkedin
                        size={18}
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400"
                      />
                      <Input
                        value={formData.socialLinks.linkedin}
                        onChange={(e) =>
                          handleSocialLinkChange("linkedin", e.target.value)
                        }
                        placeholder="https://linkedin.com/company/..."
                        className="h-12 pl-12 pr-4 bg-white border-slate-200 rounded-xl focus:border-slate-400 focus:ring-0 text-slate-800 font-medium placeholder:text-slate-400 placeholder:font-normal transition-all duration-200 hover:border-slate-300"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-slate-800 mb-3 tracking-tight">
                      Twitter
                    </label>
                    <div className="relative">
                      <Twitter
                        size={18}
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400"
                      />
                      <Input
                        value={formData.socialLinks.twitter}
                        onChange={(e) =>
                          handleSocialLinkChange("twitter", e.target.value)
                        }
                        placeholder="https://twitter.com/..."
                        className="h-12 pl-12 pr-4 bg-white border-slate-200 rounded-xl focus:border-slate-400 focus:ring-0 text-slate-800 font-medium placeholder:text-slate-400 placeholder:font-normal transition-all duration-200 hover:border-slate-300"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-slate-800 mb-3 tracking-tight">
                      GitHub
                    </label>
                    <div className="relative">
                      <Github
                        size={18}
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400"
                      />
                      <Input
                        value={formData.socialLinks.github}
                        onChange={(e) =>
                          handleSocialLinkChange("github", e.target.value)
                        }
                        placeholder="https://github.com/..."
                        className="h-12 pl-12 pr-4 bg-white border-slate-200 rounded-xl focus:border-slate-400 focus:ring-0 text-slate-800 font-medium placeholder:text-slate-400 placeholder:font-normal transition-all duration-200 hover:border-slate-300"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Benefits */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-slate-200/60">
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-slate-600" />
              </div>
              <h2 className="text-xl font-semibold text-slate-800 tracking-tight">
                Employee Benefits
              </h2>
              <div className="h-px bg-gradient-to-r from-slate-200 to-transparent flex-1 ml-4"></div>
            </div>

            <div className="space-y-6">
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <Input
                    value={newBenefit}
                    onChange={(e) => setNewBenefit(e.target.value)}
                    placeholder="Add a benefit (e.g., Health Insurance)"
                    className="h-12 px-4 bg-white border-slate-200 rounded-xl focus:border-slate-400 focus:ring-0 text-slate-800 font-medium placeholder:text-slate-400 placeholder:font-normal transition-all duration-200 hover:border-slate-300"
                    onKeyPress={(e) =>
                      e.key === "Enter" &&
                      (e.preventDefault(), handleAddBenefit())
                    }
                  />
                </div>
                <Button
                  type="button"
                  onClick={handleAddBenefit}
                  className="h-12 px-6 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-medium transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  Add
                </Button>
              </div>

              <div className="flex flex-wrap gap-3">
                {formData.benefits.map((benefit, index) => (
                  <div
                    key={index}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-700 rounded-lg border border-slate-200 hover:border-slate-300 transition-all duration-200 group"
                  >
                    <span className="font-medium text-sm">{benefit}</span>
                    <button
                      onClick={() => handleRemoveBenefit(index)}
                      className="p-1 rounded-full hover:bg-slate-200 transition-colors duration-200 group-hover:text-red-600"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Specialties */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-slate-200/60">
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-slate-600" />
              </div>
              <h2 className="text-xl font-semibold text-slate-800 tracking-tight">
                Company Specialties
              </h2>
              <div className="h-px bg-gradient-to-r from-slate-200 to-transparent flex-1 ml-4"></div>
            </div>

            <div className="space-y-6">
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <Input
                    value={newSpecialty}
                    onChange={(e) => setNewSpecialty(e.target.value)}
                    placeholder="Add a specialty (e.g., Web Development)"
                    className="h-12 px-4 bg-white border-slate-200 rounded-xl focus:border-slate-400 focus:ring-0 text-slate-800 font-medium placeholder:text-slate-400 placeholder:font-normal transition-all duration-200 hover:border-slate-300"
                    onKeyPress={(e) =>
                      e.key === "Enter" &&
                      (e.preventDefault(), handleAddSpecialty())
                    }
                  />
                </div>
                <Button
                  type="button"
                  onClick={handleAddSpecialty}
                  className="h-12 px-6 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-medium transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  Add
                </Button>
              </div>

              <div className="flex flex-wrap gap-3">
                {formData.specialties.map((specialty, index) => (
                  <div
                    key={index}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200 hover:border-emerald-300 transition-all duration-200 group"
                  >
                    <span className="font-medium text-sm">{specialty}</span>
                    <button
                      onClick={() => handleRemoveSpecialty(index)}
                      className="p-1 rounded-full hover:bg-emerald-200 transition-colors duration-200 group-hover:text-red-600"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-4 pt-8">
            <Button
              type="button"
              onClick={handleBack}
              className="h-12 px-8 bg-white border border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50 rounded-xl font-medium transition-all duration-200 shadow-sm hover:shadow-md"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateMutation.isPending || isUploading}
              className="h-12 px-8 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-medium transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updateMutation.isPending || isUploading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              ) : (
                <Save size={18} />
              )}
              <span>
                {isUploading
                  ? "Uploading Images..."
                  : updateMutation.isPending
                  ? "Saving Changes..."
                  : "Save Changes"}
              </span>
            </Button>
          </div>
        </form>
      </div>

      {/* Image Crop Modal */}
      <ImageCropModal
        open={cropModal.open}
        onClose={() =>
          setCropModal({ open: false, imageSrc: null, type: null })
        }
        imageSrc={cropModal.imageSrc}
        type={cropModal.type}
        onCropCompleteAction={handleCropComplete}
      />
    </div>
  );
};

export default EditCompanyDetails;
