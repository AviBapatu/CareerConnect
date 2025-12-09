import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getCompanyById } from "@/api/companyApi";
import { getJobsByCompany } from "@/api/jobApi";
import { Button } from "@/components/ui/button";
import {
  Building2,
  MapPin,
  Users,
  Calendar,
  Globe,
  Linkedin,
  Share2,
  Heart,
  Briefcase,
  ChevronDown,
  ChevronUp,
  Eye,
  ArrowRight,
  Edit,
  ExternalLink,
  Star,
  Award,
  Camera,
  Tag,
  Building,
} from "lucide-react";
import { toast } from "sonner";
import useAuthStore from "@/store/userStore";
import { useCompanyStore } from "@/store/companyStore";

const CompanyDetails = () => {
  const { companyId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { companyId: userCompanyId, companyRole } = useCompanyStore();
  const [activeTab, setActiveTab] = useState("overview");
  const [isFollowed, setIsFollowed] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  // Handle scroll for parallax and sticky header
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fetch company details
  const {
    data: companyResponse,
    isLoading: companyLoading,
    error: companyError,
  } = useQuery({
    queryKey: ["company", companyId],
    queryFn: () => getCompanyById(companyId),
    enabled: !!companyId,
    refetchOnWindowFocus: false,
  });

  // Fetch company jobs
  const {
    data: jobsResponse,
    isLoading: jobsLoading,
    error: jobsError,
  } = useQuery({
    queryKey: ["companyJobs", companyId],
    queryFn: () => getJobsByCompany(companyId),
    enabled: !!companyId,
    refetchOnWindowFocus: false,
  });

  const company = companyResponse?.company || companyResponse?.data;
  const allJobs = jobsResponse?.data?.jobs || jobsResponse?.jobs || [];
  // Filter jobs based on user role
  const jobs =
    user?.role === "candidate"
      ? allJobs.filter((job) => job.status === "active") // Candidates only see active jobs
      : allJobs; // Recruiters see all jobs (active, closed, draft)

  // Debug logging
  React.useEffect(() => {
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
  }, [
    companyId,
    user,
    companyResponse,
    jobsResponse,
    jobsLoading,
    jobsError,
    allJobs,
    jobs,
  ]);

  // Show error toast for jobs if there's an error
  if (jobsError) {
    console.error("❌ Error loading company jobs:", jobsError);
    console.error("Error details:", jobsError?.response?.data);
  }

  const handleJobClick = (jobId, job) => {
    
    
    
    
    
    

    // Navigate to appropriate page based on user role
    if (user?.role === "candidate") {
      // Candidates go to job detail page
      
      navigate(`/job/${jobId}`);
    } else if (user?.role === "recruiter") {
      // Check if user posted this job
      const canEdit =
        job && user && (job.postedBy === user.id || job.postedBy === user._id);

      if (canEdit) {
        // User can edit - go to edit page
        
        navigate(`/recruiter/edit-job/${jobId}`);
      } else {
        // User can only view - go to read-only view
        
        navigate(`/recruiter/job/${jobId}`);
      }
    } else {
      // Fallback: redirect to login for unauthenticated users
      
      navigate("/auth/login");
    }
  };

  const handleViewAllJobs = () => {
    
    
    

    if (user?.role === "candidate") {
      const path = `/candidate/company/${company._id}/jobs`;
      
      navigate(path);
    } else {
      const path = `/recruiter/company/${company._id}/jobs`;
      
      navigate(path);
    }
  };

  if (companyLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 text-sm">Loading company details...</p>
        </div>
      </div>
    );
  }

  if (companyError || !company) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Company Not Found
          </h2>
          <p className="text-gray-600 mb-8">
            {companyError?.response?.data?.message ||
              "The company you're looking for doesn't exist or has been removed."}
          </p>
          <Button
            onClick={() => navigate(-1)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg transition-colors duration-200"
          >
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "jobs", label: "Jobs", count: allJobs.length },
    { id: "people", label: "People" },
    { id: "photos", label: "Photos" },
    { id: "reviews", label: "Reviews" },
  ];

  const companyStats = [
    {
      label: "Employees",
      value: company.size || company.employees || "50+",
      icon: Users,
    },
    { label: "Founded", value: company.foundedYear || "2020", icon: Calendar },
    { label: "Open Jobs", value: jobs.length, icon: Briefcase },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Cover Image Section */}
      <div className="relative h-80 lg:h-96 overflow-hidden">
        {/* Cover Image */}
        <div
          className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800"
          style={{
            transform: `translateY(${scrollY * 0.5}px)`,
          }}
        >
          {company.coverImage ? (
            <img
              src={company.coverImage}
              alt={`${company.name} cover`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800" />
          )}
        </div>

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

        {/* Action Buttons - Top Right */}
        <div className="absolute top-6 right-6 flex items-center space-x-3">
          {/* Edit Button for Admins only */}
          {user?.role === "recruiter" &&
            companyRole === "admin" &&
            userCompanyId === companyId && (
              <Button
                onClick={() => navigate(`/recruiter/company/${companyId}/edit`)}
                size="sm"
                className="bg-white/90 hover:bg-white text-gray-900 rounded-full px-4 py-2 backdrop-blur-sm transition-colors duration-200"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
            )}
        </div>
      </div>

      {/* Company Info Section - Overlapping */}
      <div className="relative -mt-20 z-10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row lg:items-end lg:space-x-6">
            {/* Company Logo - Circular and Elevated */}
            <div className="flex-shrink-0 mb-4 lg:mb-0">
              <div className="w-32 h-32 lg:w-40 lg:h-40 rounded-full bg-white border-4 border-white shadow-xl flex items-center justify-center overflow-hidden">
                {company.logo ? (
                  <img
                    src={company.logo}
                    alt={company.name}
                    className="w-full h-full object-contain rounded-full"
                  />
                ) : (
                  <Building2 className="w-16 h-16 lg:w-20 lg:h-20 text-gray-400" />
                )}
              </div>
            </div>

            {/* Company Details */}
            <div className="flex-1 pb-6 lg:pb-8">
              <h1 className="text-3xl lg:text-5xl font-bold text-gray-900 mb-2 leading-tight">
                {company.name}
              </h1>
              <p className="text-lg lg:text-xl text-gray-600 mb-4 font-medium">
                {company.industry}
              </p>

              {/* Location, Website, and Social Links */}
              <div className="flex flex-wrap items-center gap-4 lg:gap-6 text-gray-600">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm lg:text-base">
                    {company.location}
                  </span>
                </div>

                {company.website && (
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 hover:text-blue-600 transition-colors duration-200"
                  >
                    <Globe className="w-4 h-4" />
                    <span className="text-sm lg:text-base">Website</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}

                {/* Social Links */}
                <div className="flex items-center space-x-3">
                  {company.socialLinks?.linkedin && (
                    <a
                      href={company.socialLinks.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors duration-200"
                    >
                      <Linkedin className="w-4 h-4 text-gray-600" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs - Sticky Header */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6">
          <nav className="flex space-x-0">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative py-4 px-6 text-sm font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-600 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300"
                }`}
              >
                {tab.label}
                {tab.count !== undefined && (
                  <span className="ml-1 text-xs text-gray-400">
                    ({tab.count})
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-12">
          {/* Left Column - Main Content (70%) */}
          <div className="lg:col-span-7 space-y-16">
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <>
                {/* About Section */}
                <section className="pt-4">
                  <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-6">
                    About {company.name}
                  </h2>
                  <div className="prose prose-lg prose-gray max-w-none">
                    <p className="text-gray-700 leading-relaxed text-lg">
                      {showFullDescription ||
                      !company.description ||
                      company.description.length <= 400
                        ? company.description ||
                          `${company.name} is a leading ${company.industry} company based in ${company.location}, dedicated to innovation and excellence in our field. We're committed to creating meaningful impact through our work and fostering a collaborative environment where our team can thrive and deliver exceptional results to our clients.`
                        : `${company.description.substring(0, 400)}...`}
                    </p>
                    {company.description &&
                      company.description.length > 400 && (
                        <button
                          onClick={() =>
                            setShowFullDescription(!showFullDescription)
                          }
                          className="inline-flex items-center mt-4 text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors duration-200"
                        >
                          {showFullDescription ? (
                            <>
                              <ChevronUp className="w-4 h-4 mr-1" />
                              Show less
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-4 h-4 mr-1" />
                              Read more
                            </>
                          )}
                        </button>
                      )}
                  </div>
                </section>

                {/* Company Stats - By the Numbers */}
                <section>
                  <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-8">
                    By the numbers
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {companyStats.map((stat, index) => {
                      const Icon = stat.icon;
                      return (
                        <div key={index} className="text-center group">
                          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-50 rounded-full mb-4 group-hover:bg-blue-100 transition-colors duration-300">
                            <Icon className="w-8 h-8 text-blue-600" />
                          </div>
                          <div className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                            {stat.value}
                          </div>
                          <div className="text-sm text-gray-600 font-medium uppercase tracking-wide">
                            {stat.label}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>

                {/* Our Workspace Section */}
                <section>
                  <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-8">
                    Our workspace
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Workspace Images */}
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div
                        key={i}
                        className="aspect-video bg-gray-100 rounded-xl overflow-hidden group cursor-pointer hover:shadow-lg transition-all duration-300"
                      >
                        <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center group-hover:from-gray-300 group-hover:to-gray-400 transition-all duration-300">
                          <Building2 className="w-12 h-12 text-gray-400 group-hover:scale-110 transition-transform duration-300" />
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </>
            )}

            {/* Jobs Tab */}
            {activeTab === "jobs" && (
              <section className="pt-4">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl lg:text-3xl font-bold text-gray-900">
                    Open positions
                  </h2>
                  <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                    {jobs.length} {jobs.length === 1 ? "position" : "positions"}{" "}
                    available
                  </span>
                </div>

                {jobsLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : jobs.length > 0 ? (
                  <div className="space-y-4">
                    {jobs.map((job) => (
                      <div
                        key={job._id}
                        onClick={() => handleJobClick(job._id, job)}
                        className="group p-6 bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-md transition-all duration-200 cursor-pointer"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors duration-200">
                              {job.title}
                            </h3>
                            <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                              <span className="flex items-center">
                                <MapPin className="w-4 h-4 mr-1" />
                                {job.location || company.location}
                              </span>
                              {job.type && (
                                <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                                  {job.type.replace("-", " ")}
                                </span>
                              )}
                              {user?.role === "recruiter" && (
                                <span
                                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                                    job.status === "active"
                                      ? "bg-green-100 text-green-700"
                                      : job.status === "closed"
                                      ? "bg-red-100 text-red-700"
                                      : "bg-yellow-100 text-yellow-700"
                                  }`}
                                >
                                  {job.status}
                                </span>
                              )}
                              {user?.role === "recruiter" &&
                                (job.postedBy === user?.id ||
                                  job.postedBy === user?._id) && (
                                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium flex items-center gap-1">
                                    <Edit className="w-3 h-3" />
                                    Can Edit
                                  </span>
                                )}
                            </div>
                            {job.salaryRange &&
                              (job.salaryRange.min || job.salaryRange.max) && (
                                <p className="text-sm text-gray-700 font-medium">
                                  {job.salaryRange.min && job.salaryRange.max
                                    ? `$${job.salaryRange.min.toLocaleString()} - $${job.salaryRange.max.toLocaleString()}`
                                    : job.salaryRange.min
                                    ? `From $${job.salaryRange.min.toLocaleString()}`
                                    : `Up to $${job.salaryRange.max.toLocaleString()}`}
                                </p>
                              )}
                          </div>
                          <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all duration-200" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                      <Briefcase className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No open positions
                    </h3>
                    <p className="text-gray-500">
                      Check back later for new opportunities.
                    </p>
                  </div>
                )}
              </section>
            )}

            {/* Other Tabs - Placeholder Content */}
            {activeTab === "people" && (
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-8">
                  Our team
                </h2>
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Team directory coming soon
                  </h3>
                  <p className="text-gray-500">
                    Meet our amazing team members and connect with colleagues.
                  </p>
                </div>
              </section>
            )}

            {activeTab === "photos" && (
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-8">
                  Photos
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div
                      key={i}
                      className="aspect-video bg-gray-100 rounded-xl flex items-center justify-center"
                    >
                      <Building2 className="w-8 h-8 text-gray-400" />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {activeTab === "reviews" && (
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-8">
                  Reviews
                </h2>
                <div className="text-center py-12">
                  <Award className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Reviews coming soon
                  </h3>
                  <p className="text-gray-500">
                    Employee reviews and testimonials will be available soon.
                  </p>
                </div>
              </section>
            )}

            {/* People Tab */}
            {activeTab === "people" && (
              <section className="pt-4">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl lg:text-3xl font-bold text-gray-900">
                    People at {company.name}
                  </h2>
                  <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                    Connect with team members
                  </span>
                </div>

                <div className="text-center py-16">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                    <Users className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Team Directory Coming Soon
                  </h3>
                  <p className="text-gray-500 max-w-md mx-auto">
                    We're working on bringing you the team directory to help you
                    connect with employees at {company.name}.
                  </p>
                </div>
              </section>
            )}

            {/* Photos Tab */}
            {activeTab === "photos" && (
              <section className="pt-4">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl lg:text-3xl font-bold text-gray-900">
                    Company Photos
                  </h2>
                  <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                    Workplace gallery
                  </span>
                </div>

                {company.workspaceImages &&
                company.workspaceImages.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {company.workspaceImages.map((image, index) => (
                      <div
                        key={index}
                        className="group relative aspect-video bg-gray-100 rounded-xl overflow-hidden"
                      >
                        <img
                          src={image}
                          alt={`${company.name} workspace ${index + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                      <Camera className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No photos available
                    </h3>
                    <p className="text-gray-500">
                      Company photos will appear here when uploaded.
                    </p>
                  </div>
                )}
              </section>
            )}

            {/* Reviews Tab */}
            {activeTab === "reviews" && (
              <section className="pt-4">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl lg:text-3xl font-bold text-gray-900">
                    Employee Reviews
                  </h2>
                  <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                    Honest feedback
                  </span>
                </div>

                <div className="text-center py-16">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                    <Star className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Reviews Coming Soon
                  </h3>
                  <p className="text-gray-500 max-w-md mx-auto">
                    Employee reviews and ratings will help you get insights into
                    the company culture and work environment.
                  </p>
                </div>
              </section>
            )}
          </div>

          {/* Right Sidebar - Key Facts */}
          <div className="lg:col-span-3">
            <div className="space-y-6">
              {/* Key Facts Panel */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Key Facts
                </h3>
                <div className="space-y-4">
                  {company.location && (
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-5 h-5 mt-0.5">
                        <MapPin className="w-5 h-5 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Location
                        </p>
                        <p className="text-sm text-gray-600">
                          {company.location}
                        </p>
                      </div>
                    </div>
                  )}

                  {company.website && (
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-5 h-5 mt-0.5">
                        <Globe className="w-5 h-5 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Website
                        </p>
                        <a
                          href={company.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-700 break-all"
                        >
                          {company.website.replace(/^https?:\/\//, "")}
                        </a>
                      </div>
                    </div>
                  )}

                  {company.foundedYear && (
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-5 h-5 mt-0.5">
                        <Calendar className="w-5 h-5 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Founded
                        </p>
                        <p className="text-sm text-gray-600">
                          {company.foundedYear}
                        </p>
                      </div>
                    </div>
                  )}

                  {(company.employees || company.size) && (
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-5 h-5 mt-0.5">
                        <Building className="w-5 h-5 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Company Size
                        </p>
                        <p className="text-sm text-gray-600">
                          {company.employees || company.size} employees
                        </p>
                      </div>
                    </div>
                  )}

                  {company.industry && (
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-5 h-5 mt-0.5">
                        <Tag className="w-5 h-5 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Industry
                        </p>
                        <p className="text-sm text-gray-600">
                          {company.industry}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Featured Jobs */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Featured Jobs
                  </h3>
                  {jobs.length > 2 && (
                    <button
                      onClick={() => setActiveTab("jobs")}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      View all
                    </button>
                  )}
                </div>

                {jobs.length > 0 ? (
                  <div className="space-y-3">
                    {jobs.slice(0, 2).map((job) => (
                      <div
                        key={job._id}
                        onClick={() => handleJobClick(job._id, job)}
                        className="group p-4 border border-gray-100 rounded-lg hover:border-gray-200 hover:bg-gray-50 transition-all duration-200 cursor-pointer"
                      >
                        <h4 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors duration-200 mb-1">
                          {job.title}
                        </h4>
                        <div className="flex items-center text-xs text-gray-500 space-x-2">
                          <MapPin className="w-3 h-3" />
                          <span>{job.location || company.location}</span>
                          {job.type && (
                            <>
                              <span>•</span>
                              <span className="capitalize">
                                {job.type.replace("-", " ")}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    No jobs available at the moment.
                  </p>
                )}
              </div>

              {/* Share Company */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Connect & Share
                </h3>
                <div className="space-y-3">
                  <button className="w-full flex items-center justify-center px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors duration-200">
                    <Share2 className="w-4 h-4 mr-2" />
                    <span className="text-sm font-medium">Share Company</span>
                  </button>

                  <div className="flex space-x-3">
                    {company.website && (
                      <a
                        href={company.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center px-3 py-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                      >
                        <Globe className="w-4 h-4 mr-2" />
                        <span className="text-sm font-medium">Website</span>
                      </a>
                    )}

                    {company.socialLinks?.linkedin && (
                      <a
                        href={company.socialLinks.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center px-3 py-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                      >
                        <Linkedin className="w-4 h-4 mr-2" />
                        <span className="text-sm font-medium">LinkedIn</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Styles */}
      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default CompanyDetails;
