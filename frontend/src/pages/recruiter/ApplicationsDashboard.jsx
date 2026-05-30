import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  getMyJobPosts,
  getApplicationsForJob,
  getAllApplicationsForCompany,
  updateApplicationStatus,
  sendApplicationStatusEmail,
  aiScreenApplications,
} from "@/api/jobApi";
import { getUser } from "@/api/profileApi";
import useAuthStore from "@/store/userStore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MoreHorizontal,
  Eye,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  FileText,
  Briefcase,
  Sparkles,
  Brain,
  RefreshCw,
  AlertTriangle,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const ApplicationsDashboard = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, autoSendStatusEmail } = useAuthStore();
  const [selectedJob, setSelectedJob] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [pendingStatusChange, setPendingStatusChange] = useState(null); // { applicationId, newStatus }
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [aiScreeningOpen, setAiScreeningOpen] = useState(false);
  const [aiScreeningData, setAiScreeningData] = useState(null);
  const [aiScreeningLoading, setAiScreeningLoading] = useState(false);
  const [expandedCandidate, setExpandedCandidate] = useState(null);

  const fetchAiScreening = async (forceRefresh = false) => {
    if (!selectedJob || selectedJob === "all") return;
    setAiScreeningLoading(true);
    setAiScreeningOpen(true);
    try {
      const res = await aiScreenApplications(user?.company, selectedJob, forceRefresh);
      setAiScreeningData(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to retrieve AI screening results");
    } finally {
      setAiScreeningLoading(false);
    }
  };

  // Fetch jobs posted by the company
  const {
    data: jobsResponse,
    isLoading: jobsLoading,
    error: jobsError,
  } = useQuery({
    queryKey: ["myJobPosts"],
    queryFn: getMyJobPosts,
    refetchOnWindowFocus: false,
  });

  const jobs = jobsResponse?.data?.jobs || [];

  // Fetch applications for selected job or all applications
  const {
    data: applicationsResponse,
    isLoading: applicationsLoading,
    error: applicationsError,
  } = useQuery({
    queryKey: ["applications", selectedJob],
    queryFn: () => {
      if (selectedJob === "all") {
        return getAllApplicationsForCompany();
      } else if (selectedJob) {
        return getApplicationsForJob(user?.company, selectedJob);
      }
      return Promise.resolve({ data: { data: [] } });
    },
    enabled: !!user?.company,
    refetchOnWindowFocus: false,
  });

  const applications = applicationsResponse?.data?.data || [];

  // Update application status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ applicationId, status }) =>
      updateApplicationStatus(user?.company, applicationId, status),
    onSuccess: () => {
      toast.success("Application status updated successfully!");
      queryClient.invalidateQueries({
        queryKey: ["applications", selectedJob],
      });
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message || "Failed to update application status"
      );
    },
  });

  // Send email mutation
  const sendEmailMutation = useMutation({
    mutationFn: (applicationId) => sendApplicationStatusEmail(applicationId),
    onSuccess: () => {
      toast.success("Status update email sent to applicant!");
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message || "Failed to send status update email"
      );
    },
  });

  // Filter applications based on status
  const filteredApplications = applications.filter((application) => {
    if (statusFilter === "all") return true;
    return application.status === statusFilter;
  });

  // Handle status change (show confirmation modal)
  const handleStatusChange = (applicationId, newStatus) => {
    setPendingStatusChange({ applicationId, newStatus });
    setConfirmOpen(true);
  };

  // Confirm status change
  const confirmStatusChange = () => {
    if (pendingStatusChange) {
      updateStatusMutation.mutate({
        applicationId: pendingStatusChange.applicationId,
        status: pendingStatusChange.newStatus,
      }, {
        onSuccess: () => {
          if (autoSendStatusEmail) {
            sendEmailMutation.mutate(pendingStatusChange.applicationId);
          }
        }
      });
    }
    setConfirmOpen(false);
    setPendingStatusChange(null);
  };

  // Cancel status change
  const cancelStatusChange = () => {
    setConfirmOpen(false);
    setPendingStatusChange(null);
  };

  // Handle view profile
  const handleViewProfile = (userId) => {
    navigate(`/recruiter/applicant/${userId}`);
  };

  // Handle download resume
  const handleDownloadResume = (resumeUrl, applicantName) => {
    if (!resumeUrl) {
      toast.error("No resume available for this applicant");
      return;
    }

    // Create a temporary link to download the resume
    const link = document.createElement("a");
    link.href = resumeUrl;
    link.download = `${applicantName}_Resume.pdf`;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case "applied":
        return "bg-blue-100 text-blue-800";
      case "reviewed":
        return "bg-yellow-100 text-yellow-800";
      case "interview":
        return "bg-purple-100 text-purple-800";
      case "hired":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Calculate stats
  const totalApplications = applications.length;
  const appliedCount = applications.filter(
    (app) => app.status === "applied"
  ).length;
  const interviewCount = applications.filter(
    (app) => app.status === "interview"
  ).length;
  const hiredCount = applications.filter(
    (app) => app.status === "hired"
  ).length;

  if (jobsLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (jobsError) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            Error Loading Jobs
          </h2>
          <p className="text-gray-600 mb-4">
            {jobsError.response?.data?.message || "Failed to load jobs"}
          </p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Applications Dashboard
          </h1>
          <p className="text-gray-600">
            Manage and review job applications from candidates
          </p>
        </div>

        {/* Job Selection */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Select Job to View Applications
          </h2>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Select value={selectedJob} onValueChange={setSelectedJob}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a job posting..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span>All Applications</span>
                      <Badge variant="secondary" className="ml-auto">
                        {jobs.reduce(
                          (total, job) => total + (job.applicationsCount || 0),
                          0
                        )}{" "}
                        total
                      </Badge>
                    </div>
                  </SelectItem>
                  {jobs.map((job) => (
                    <SelectItem key={job._id} value={job._id}>
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4" />
                        <span>{job.title}</span>
                        <Badge variant="secondary" className="ml-auto">
                          {job.applicationsCount || 0} applications
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedJob && (
              <div className="flex-1">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="applied">Applied</SelectItem>
                    <SelectItem value="reviewed">Reviewed</SelectItem>
                    <SelectItem value="interview">Interview</SelectItem>
                    <SelectItem value="hired">Hired</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {selectedJob && selectedJob !== "all" && (
              <div className="flex items-center">
                <Button
                  onClick={() => fetchAiScreening(false)}
                  className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-medium shadow-md transition-all duration-200 hover:shadow-lg flex items-center justify-center gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  Screen with AI
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        {selectedJob && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-6">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Users className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total Applications
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {totalApplications}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Clock className="h-8 w-8 text-yellow-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        New Applications
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {appliedCount}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <FileText className="h-8 w-8 text-purple-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Interviews
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {interviewCount}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Hired
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {hiredCount}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Applications Table */}
        {selectedJob && (
          <>
            <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Are you sure?</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to update the application status?
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={cancelStatusChange}>
                    Cancel
                  </Button>
                  <Button onClick={confirmStatusChange} disabled={updateStatusMutation.isPending}>
                    Confirm
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={aiScreeningOpen} onOpenChange={setAiScreeningOpen}>
              <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
                <DialogHeader className="flex flex-row items-center justify-between border-b pb-4 pr-6">
                  <div>
                    <DialogTitle className="text-2xl font-bold flex items-center gap-2 text-indigo-900">
                      <Sparkles className="h-6 w-6 text-indigo-600 animate-pulse" />
                      <span>AI Candidate Screening & Ranking</span>
                    </DialogTitle>
                    <DialogDescription className="text-gray-500 mt-1">
                      Candidates evaluated using weighted algorithms and Gemini enhancements.
                    </DialogDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                    onClick={() => fetchAiScreening(true)}
                    disabled={aiScreeningLoading}
                  >
                    <RefreshCw className={`h-4 w-4 ${aiScreeningLoading ? 'animate-spin' : ''}`} />
                    Refresh Analysis
                  </Button>
                </DialogHeader>

                {aiScreeningLoading ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-4">
                    <Loader2 className="h-12 w-12 text-indigo-600 animate-spin" />
                    <p className="text-indigo-800 font-medium animate-pulse">Running screening algorithms...</p>
                  </div>
                ) : !aiScreeningData || !aiScreeningData.applicants || aiScreeningData.applicants.length === 0 ? (
                  <div className="text-center py-12">
                    <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Applications Screened</h3>
                    <p className="text-gray-500">There are no candidates to analyze for this job post.</p>
                  </div>
                ) : (
                  <div className="space-y-4 py-4">
                    {aiScreeningData.applicants.map((cand, idx) => {
                      const isExpanded = expandedCandidate === cand.applicationId;
                      const score = cand.aiScreening?.matchScore || 0;
                      const conf = cand.aiScreening?.confidence || 0;
                      const rec = cand.aiScreening?.recommendation || "Under-qualified";

                      const scoreColor = score >= 80 
                        ? "bg-green-100 text-green-800 border-green-200" 
                        : score >= 60 
                          ? "bg-yellow-100 text-yellow-800 border-yellow-200" 
                          : "bg-red-100 text-red-800 border-red-200";

                      return (
                        <div key={cand.applicationId} className="border rounded-lg bg-white overflow-hidden shadow-sm hover:shadow transition-shadow duration-200">
                          {/* Main Row */}
                          <div className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-gray-50/50">
                            <div className="flex items-center gap-3">
                              <span className="text-lg font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 w-8 h-8 rounded-full flex items-center justify-center">
                                #{idx + 1}
                              </span>
                              <div>
                                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                                  {cand.name}
                                  {cand.status === "interview" && <Badge variant="secondary">Interviewing</Badge>}
                                </h4>
                                <p className="text-sm text-gray-500">{cand.headline || "No headline listed"}</p>
                                <p className="text-xs text-gray-400 mt-0.5">{cand.email}</p>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 self-stretch md:self-auto justify-end">
                              {/* Match Score Badge */}
                              <Badge className={`px-2.5 py-1 border text-sm font-semibold rounded-md ${scoreColor}`}>
                                {score}% - {rec}
                              </Badge>

                              {/* Confidence Score */}
                              <div className="text-right">
                                <span className="text-xs text-gray-500 block">Confidence</span>
                                <span className="text-sm font-semibold text-gray-700">{conf}%</span>
                              </div>

                              {/* Toggle expand */}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setExpandedCandidate(isExpanded ? null : cand.applicationId)}
                              >
                                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                              </Button>
                            </div>
                          </div>

                          {/* Collapsible Details */}
                          {isExpanded && (
                            <div className="p-5 border-t space-y-4 bg-white animate-in fade-in duration-200">
                              {/* Source Indicator */}
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-400">Analysis Source:</span>
                                <Badge variant="outline" className="text-xs capitalize">
                                  {cand.aiScreening?.source === "gemini" 
                                    ? `AI (${cand.aiScreening.model || "gemini-2.5-flash"})` 
                                    : "Local Algorithm (Standard ATS)"}
                                </Badge>
                              </div>

                              {/* Summary */}
                              <div>
                                <h5 className="text-sm font-semibold text-indigo-900 mb-1 flex items-center gap-1.5">
                                  <Brain className="h-4 w-4 text-indigo-500" />
                                  AI Summary
                                </h5>
                                <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-3 rounded border">
                                  {cand.aiScreening?.summary || "No summary generated."}
                                </p>
                              </div>

                              {/* Screening Reasons */}
                              {cand.aiScreening?.screeningReasons?.length > 0 && (
                                <div>
                                  <h5 className="text-sm font-semibold text-indigo-900 mb-1">Key Screening Reasons</h5>
                                  <ul className="list-disc list-inside text-sm text-gray-700 space-y-1 pl-1 bg-gray-50/50 p-3 rounded border">
                                    {cand.aiScreening.screeningReasons.map((reason, i) => (
                                      <li key={i}>{reason}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {/* Strengths & Concerns Grid */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="border rounded-md p-3.5 bg-green-50/20 border-green-100">
                                  <h6 className="text-sm font-semibold text-green-800 mb-2 flex items-center gap-1.5">
                                    <Check className="h-4 w-4 text-green-600" />
                                    Strengths
                                  </h6>
                                  {cand.aiScreening?.strengths?.length > 0 ? (
                                    <ul className="list-disc list-inside text-xs text-green-900 space-y-1">
                                      {cand.aiScreening.strengths.map((str, i) => (
                                        <li key={i}>{str}</li>
                                      ))}
                                    </ul>
                                  ) : (
                                    <span className="text-xs text-gray-400">No strengths recorded.</span>
                                  )}
                                </div>

                                <div className="border rounded-md p-3.5 bg-red-50/20 border-red-100">
                                  <h6 className="text-sm font-semibold text-red-800 mb-2 flex items-center gap-1.5">
                                    <X className="h-4 w-4 text-red-600" />
                                    Concerns
                                  </h6>
                                  {cand.aiScreening?.concerns?.length > 0 ? (
                                    <ul className="list-disc list-inside text-xs text-red-900 space-y-1">
                                      {cand.aiScreening.concerns.map((con, i) => (
                                        <li key={i}>{con}</li>
                                      ))}
                                    </ul>
                                  ) : (
                                    <span className="text-xs text-gray-400">No major concerns flags.</span>
                                  )}
                                </div>
                              </div>

                              {/* Skills Badges Grid */}
                              <div className="space-y-3">
                                <div>
                                  <span className="text-xs font-semibold text-gray-500 block mb-1.5">Matched Skills</span>
                                  <div className="flex flex-wrap gap-1.5">
                                    {cand.aiScreening?.matchedSkills?.length > 0 ? (
                                      cand.aiScreening.matchedSkills.map((skill, i) => (
                                        <Badge key={i} variant="outline" className="bg-green-50 text-green-800 border-green-200">
                                          {skill}
                                        </Badge>
                                      ))
                                    ) : (
                                      <span className="text-xs text-gray-400">None matched</span>
                                    )}
                                  </div>
                                </div>

                                <div>
                                  <span className="text-xs font-semibold text-gray-500 block mb-1.5">Missing Skills</span>
                                  <div className="flex flex-wrap gap-1.5">
                                    {cand.aiScreening?.missingSkills?.length > 0 ? (
                                      cand.aiScreening.missingSkills.map((skill, i) => (
                                        <Badge key={i} variant="outline" className="bg-red-50 text-red-800 border-red-200">
                                          {skill}
                                        </Badge>
                                      ))
                                    ) : (
                                      <span className="text-xs text-gray-400">None missing</span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Direct Recruiter Actions */}
                              <div className="flex items-center gap-2 pt-3 border-t">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleViewProfile(cand.userId)}
                                >
                                  <Eye className="h-3.5 w-3.5 mr-1" />
                                  View Profile
                                </Button>

                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDownloadResume(cand.resume, cand.name)}
                                  disabled={!cand.resume}
                                >
                                  <Download className="h-3.5 w-3.5 mr-1" />
                                  Resume
                                </Button>

                                <div className="ml-auto flex items-center gap-2">
                                  {cand.status !== "interview" && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="text-purple-700 hover:bg-purple-50 border-purple-200"
                                      onClick={() => handleStatusChange(cand.applicationId, "interview")}
                                    >
                                      Interview
                                    </Button>
                                  )}
                                  {cand.status !== "rejected" && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="text-red-700 hover:bg-red-50 border-red-200"
                                      onClick={() => handleStatusChange(cand.applicationId, "rejected")}
                                    >
                                      Reject
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </DialogContent>
            </Dialog>

            <div className="bg-white shadow rounded-lg overflow-hidden">
              {applicationsLoading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : applicationsError ? (
                <div className="text-center py-12">
                  <h3 className="text-lg font-medium text-red-600 mb-2">
                    Error Loading Applications
                  </h3>
                  <p className="text-gray-500">
                    {applicationsError.response?.data?.message ||
                      "Failed to load applications"}
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Applicant</TableHead>
                      {selectedJob === "all" && <TableHead>Job Title</TableHead>}
                      <TableHead>Email</TableHead>
                      <TableHead>Applied Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Update Status</TableHead>
                      <TableHead className="w-32">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredApplications.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={selectedJob === "all" ? 7 : 6}
                          className="h-32 text-center"
                        >
                          <div className="flex flex-col items-center justify-center">
                            <Users className="h-12 w-12 text-gray-400 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                              {statusFilter === "all"
                                ? "No applications yet"
                                : `No ${statusFilter} applications`}
                            </h3>
                            <p className="text-gray-500">
                              {statusFilter === "all"
                                ? "Applications will appear here when candidates apply"
                                : `No applications with ${statusFilter} status found`}
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredApplications.map((application) => (
                        <TableRow key={application._id}>
                          <TableCell className="font-medium">
                            {application.user?.name || "Name Not Available"}
                          </TableCell>
                          {selectedJob === "all" && (
                            <TableCell className="font-medium">
                              {application.job?.title ||
                                "Job Title Not Available"}
                            </TableCell>
                          )}
                          <TableCell>
                            {application.user?.email || "Email Not Available"}
                          </TableCell>
                          <TableCell>
                            {formatDate(application.createdAt)}
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(application.status)}>
                              {application.status.charAt(0).toUpperCase() +
                                application.status.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={application.status}
                              onValueChange={(newStatus) =>
                                handleStatusChange(application._id, newStatus)
                              }
                              disabled={updateStatusMutation.isPending}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="applied">Applied</SelectItem>
                                <SelectItem value="reviewed">Reviewed</SelectItem>
                                <SelectItem value="interview">
                                  Interview
                                </SelectItem>
                                <SelectItem value="hired">Hired</SelectItem>
                                <SelectItem value="rejected">Rejected</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <span className="sr-only">Open menu</span>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleViewProfile(application.user?._id)
                                  }
                                  className="cursor-pointer"
                                >
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Profile
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleDownloadResume(
                                      application.resume,
                                      application.user?.name
                                    )
                                  }
                                  className="cursor-pointer"
                                  disabled={!application.resume}
                                >
                                  <Download className="mr-2 h-4 w-4" />
                                  Download Resume
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => sendEmailMutation.mutate(application._id)}
                                  className="cursor-pointer"
                                  disabled={sendEmailMutation.isPending}
                                >
                                  <CheckCircle className="mr-2 h-4 w-4 text-blue-600" />
                                  Send Email
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </div>
          </>
        )}

        {/* Empty State */}
        {!selectedJob && jobs.length === 0 && (
          <div className="text-center py-12">
            <Briefcase className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Job Postings
            </h3>
            <p className="text-gray-500 mb-4">
              You need to post jobs before you can view applications.
            </p>
            <Button onClick={() => navigate("/recruiter/jobs")}>
              Post Your First Job
            </Button>
          </div>
        )}

        {!selectedJob && jobs.length > 0 && (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Select a Job to View Applications
            </h3>
            <p className="text-gray-500">
              Choose a job posting from the dropdown above to see all
              applications.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApplicationsDashboard;
