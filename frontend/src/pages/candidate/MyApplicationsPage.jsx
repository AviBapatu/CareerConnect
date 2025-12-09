import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { getMyApplications, deleteApplication } from "@/api/jobApi";
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
import { MoreHorizontal, Trash2, Eye } from "lucide-react";

const MyApplicationsPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("all");
  const { user } = useAuthStore();

  // Fetch applications
  const {
    data: applicationsResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["myApplications"],
    queryFn: () => getMyApplications(),
    onError: (err) => {
      console.error("Error fetching applications:", err);
    },
    onSuccess: (data) => {
      
    },
  });

  // Ensure applications is always an array
  const applications = Array.isArray(applicationsResponse?.data?.data)
    ? applicationsResponse.data.data
    : [];

  // Debug logging to see what we're getting from the API
  

  // Delete application mutation
  const deleteApplicationMutation = useMutation({
    mutationFn: ({ jobId, applicationId }) =>
      deleteApplication(jobId, applicationId),
    onSuccess: () => {
      toast.success("Application deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["myApplications"] });
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message || "Failed to delete application"
      );
    },
  });

  // Filter applications based on active tab
  const filteredApplications = applications.filter((application) => {
    if (activeTab === "all") return true;
    return application.status === activeTab;
  });

  // Safe counts for tabs to avoid filter errors
  const appliedCount = applications.filter(
    (app) => app.status === "applied"
  ).length;
  const interviewCount = applications.filter(
    (app) => app.status === "interview"
  ).length;
  const rejectedCount = applications.filter(
    (app) => app.status === "rejected"
  ).length;

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Get status badge variant
  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case "applied":
        return "secondary";
      case "reviewed":
        return "outline";
      case "interview":
        return "default";
      case "hired":
        return "default";
      case "rejected":
        return "destructive";
      default:
        return "secondary";
    }
  };

  // Get status button styling
  const getStatusButtonStyle = (status) => {
    switch (status) {
      case "applied":
        return "bg-blue-100 text-blue-800";
      case "reviewed":
        return "bg-purple-100 text-purple-800";
      case "interview":
        return "bg-yellow-100 text-yellow-800";
      case "hired":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Handle delete application
  const handleDeleteApplication = (jobId, applicationId) => {
    if (window.confirm("Are you sure you want to delete this application?")) {
      deleteApplicationMutation.mutate({ jobId, applicationId });
    }
  };

  // Handle view job
  const handleViewJob = (jobId) => {
    navigate(`/job/${jobId}`);
  };

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
            Error Loading Applications
          </h2>
          <p className="text-gray-600 mb-4">
            {error.response?.data?.message || "Failed to load applications"}
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
            My Applications
          </h1>
          <p className="text-gray-600">
            Track and manage all your job applications
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab("all")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "all"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                All ({applications.length})
              </button>
              <button
                onClick={() => setActiveTab("applied")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "applied"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Applied ({appliedCount})
              </button>
              <button
                onClick={() => setActiveTab("interview")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "interview"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Interviewing ({interviewCount})
              </button>
              <button
                onClick={() => setActiveTab("rejected")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "rejected"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Rejected ({rejectedCount})
              </button>
            </nav>
          </div>
        </div>

        {/* Applications Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job Title</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Date Applied</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredApplications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center py-8">
                      <div className="mb-4">
                        <svg
                          className="w-16 h-16 text-gray-300"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-1">
                        {activeTab === "all"
                          ? "No applications yet"
                          : `No ${activeTab} applications`}
                      </h3>
                      <p className="text-gray-500">
                        {activeTab === "all"
                          ? "Start applying to jobs to see them here"
                          : `You don't have any ${activeTab} applications yet`}
                      </p>
                      {activeTab === "all" && (
                        <Button
                          onClick={() => navigate("/candidate/jobs")}
                          className="mt-4"
                        >
                          Browse Jobs
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredApplications.map((application) => (
                  <TableRow key={application._id}>
                    <TableCell className="font-medium">
                      {application.job?.title || "Job Title Not Available"}
                    </TableCell>
                    <TableCell>
                      {application.job?.company?.name ||
                        application.job?.companyName ||
                        "Company Not Available"}
                    </TableCell>
                    <TableCell>{formatDate(application.createdAt)}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusButtonStyle(
                          application.status
                        )}`}
                      >
                        {application.status.charAt(0).toUpperCase() +
                          application.status.slice(1)}
                      </span>
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
                            onClick={() => handleViewJob(application.job?._id)}
                            className="cursor-pointer"
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Job
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleDeleteApplication(
                                application.job?._id,
                                application._id
                              )
                            }
                            className="cursor-pointer text-red-600"
                            disabled={deleteApplicationMutation.isPending}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Application
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Summary Stats */}
        {applications.length > 0 && (
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {applications.length}
                      </span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total Applications
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {applications.length}
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
                    <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {interviewCount}
                      </span>
                    </div>
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
                    <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {
                          applications.filter((app) => app.status === "hired")
                            .length
                        }
                      </span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Hired
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {
                          applications.filter((app) => app.status === "hired")
                            .length
                        }
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
                    <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {rejectedCount}
                      </span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Rejected
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {rejectedCount}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyApplicationsPage;
