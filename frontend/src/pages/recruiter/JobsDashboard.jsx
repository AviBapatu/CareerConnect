import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Edit2 } from "lucide-react";
import {
  getAllJobs,
  getMyJobPosts,
  updateJobStatus,
  deleteJob,
} from "@/api/jobApi";
import useAuthStore from "@/store/userStore";
import { useCompanyStore } from "@/store/companyStore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import StatusDropdown from "../../components/ui/StatusDropdown";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Constants
const VIEW_TYPES = {
  ALL: "all",
  MY_POSTS: "my-posts",
};

const JobsDashboard = () => {
  const [deleteDialog, setDeleteDialog] = useState({ open: false, job: null });
  // Delete job handler
  const handleDeleteJob = async (jobId) => {
    try {
      await deleteJob(jobId);
      queryClient.invalidateQueries({ queryKey: ["jobs", jobView] });
      toast.success("Job deleted successfully!");
    } catch (err) {
      console.error("Error deleting job:", err);
      toast.error("Failed to delete job.");
    } finally {
      setDeleteDialog({ open: false, job: null });
    }
  };
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { companyRole } = useCompanyStore();
  const [jobView, setJobView] = useState(VIEW_TYPES.MY_POSTS);
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    job: null,
    newStatus: null,
  });
  const queryClient = useQueryClient();

  // Handler for status change
  const handleStatusChange = async (job, newStatus) => {
    if (newStatus !== job.status) {
      setConfirmDialog({
        open: true,
        job,
        newStatus,
      });
    }
  };

  // Handle confirmation of status change
  const handleConfirmStatusChange = async () => {
    const { job, newStatus } = confirmDialog;
    try {
      // Get company ID from job data or user store
      const companyId = job.company?._id || job.company || user.company;
      await updateJobStatus(companyId, job._id, newStatus);

      // Invalidate and refetch the jobs query to get updated data
      queryClient.invalidateQueries({ queryKey: ["jobs", jobView] });

      toast.success("Job status updated!");
    } catch (err) {
      console.error("Error updating job status:", err);
      toast.error("Failed to update job status.");
    } finally {
      setConfirmDialog({ open: false, job: null, newStatus: null });
    }
  };

  // Handle cancellation of status change
  const handleCancelStatusChange = () => {
    setConfirmDialog({ open: false, job: null, newStatus: null });
  };

  // Fetch jobs based on current view (all jobs or user's job posts)
  const {
    data: jobsResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["jobs", jobView],
    queryFn: jobView === VIEW_TYPES.ALL ? getAllJobs : getMyJobPosts,
    refetchOnWindowFocus: false,
  });

  const jobs = jobsResponse?.data?.jobs || [];

  // Helper function to format dates
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return "1 day ago";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30)
      return `${Math.ceil(diffDays / 7)} week${
        Math.ceil(diffDays / 7) > 1 ? "s" : ""
      } ago`;
    return `${Math.ceil(diffDays / 30)} month${
      Math.ceil(diffDays / 30) > 1 ? "s" : ""
    } ago`;
  };

  // Helper function to get status badge colors
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
      case "closed":
        return "bg-gray-100 text-gray-800";
      case "paused":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  // Handle edit button click
  const handleEditClick = (e, jobId) => {
    e.stopPropagation();
    e.preventDefault();
    
    
    

    // Use React Router navigation
    navigate(`/recruiter/edit-job/${jobId}`);
  };

  // Handle job title click based on view
  const handleJobTitleClick = (jobId) => {
    if (jobView === VIEW_TYPES.MY_POSTS) {
      navigate(`/recruiter/edit-job/${jobId}`);
    } else {
      // For recruiters viewing all jobs, use the recruiter job detail route
      navigate(`/recruiter/job/${jobId}`);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Error Loading Jobs
          </h2>
          <p className="text-gray-600">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex size-full min-h-screen flex-col bg-slate-50">
      <div className="layout-container flex h-full grow flex-col">
        <div className="gap-1 px-6 flex flex-1 justify-center py-5">
          {/* Main Content */}
          <div className="layout-content-container flex flex-col max-w-[960px] flex-1">
            <div className="flex flex-wrap justify-between gap-3 p-4">
              <h1 className="text-[#0d151c] tracking-light text-[32px] font-bold leading-tight min-w-72">
                Jobs Dashboard
              </h1>
              {user?.role === "recruiter" &&
                (companyRole === "admin" || companyRole === "recruiter") && (
                  <Button
                    onClick={() => navigate("/recruiter/post-job")}
                    className="bg-[#1284e7] hover:bg-[#0f6bb8] text-white h-10 px-4"
                  >
                    Post New Job
                  </Button>
                )}
            </div>

            {/* View Toggle Buttons */}
            <div className="flex gap-2 px-4 pb-4">
              <Button
                variant={jobView === VIEW_TYPES.ALL ? "default" : "outline"}
                onClick={() => setJobView(VIEW_TYPES.ALL)}
                className="min-w-[120px]"
              >
                All Jobs
              </Button>
              {user?.role === "recruiter" && (
                <Button
                  variant={
                    jobView === VIEW_TYPES.MY_POSTS ? "default" : "outline"
                  }
                  onClick={() => setJobView(VIEW_TYPES.MY_POSTS)}
                  className="min-w-[120px]"
                >
                  My Job Posts
                </Button>
              )}
            </div>

            <h2 className="text-[#0d151c] text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-5">
              {jobView === VIEW_TYPES.ALL
                ? "Available Jobs"
                : "My Job Postings"}
            </h2>

            {/* Jobs Table */}
            <div className="px-4 py-3">
              <div className="flex overflow-hidden rounded-xl border border-[#cedce8] bg-slate-50">
                <Table className="flex-1">
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead className="px-4 py-3 text-left text-[#0d151c] w-[400px] text-sm font-medium leading-normal">
                        Job Title
                      </TableHead>
                      <TableHead className="px-4 py-3 text-left text-[#0d151c] w-60 text-sm font-medium leading-normal">
                        Company
                      </TableHead>
                      <TableHead className="px-4 py-3 text-left text-[#0d151c] w-60 text-sm font-medium leading-normal">
                        Status
                      </TableHead>
                      <TableHead className="px-4 py-3 text-left text-[#0d151c] w-[200px] text-sm font-medium leading-normal">
                        Type
                      </TableHead>
                      <TableHead className="px-4 py-3 text-left text-[#0d151c] w-[200px] text-sm font-medium leading-normal">
                        Posted
                      </TableHead>
                      {jobView === VIEW_TYPES.MY_POSTS && (
                        <>
                          <TableHead className="px-4 py-3 text-left text-[#0d151c] w-[200px] text-sm font-medium leading-normal">
                            Applications
                          </TableHead>
                          <TableHead className="px-4 py-3 text-left text-[#0d151c] w-[120px] text-sm font-medium leading-normal">
                            Actions
                          </TableHead>
                        </>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {jobs.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={jobView === VIEW_TYPES.MY_POSTS ? 7 : 5}
                          className="text-center py-8"
                        >
                          <p className="text-gray-500">No jobs found</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      jobs.map((job) => (
                        <TableRow
                          key={job._id}
                          className="border-t border-t-[#cedce8] hover:bg-gray-50"
                          onClick={
                            jobView === VIEW_TYPES.ALL
                              ? () => handleJobTitleClick(job._id)
                              : undefined
                          }
                        >
                          <TableCell
                            className={`h-[72px] px-4 py-2 w-[400px] text-[#0d151c] text-sm font-normal leading-normal ${
                              jobView === VIEW_TYPES.ALL ? "cursor-pointer" : ""
                            }`}
                          >
                            <div>
                              <p className="font-medium">{job.title}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                {job.salaryRange &&
                                  (job.salaryRange.min ||
                                    job.salaryRange.max) &&
                                  `$${
                                    job.salaryRange.min?.toLocaleString() ||
                                    "N/A"
                                  } - $${
                                    job.salaryRange.max?.toLocaleString() ||
                                    "N/A"
                                  }`}
                                {job.location && ` • ${job.location}`}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="h-[72px] px-4 py-2 w-60 text-[#0d151c] text-sm font-normal leading-normal">
                            {job.companyName ||
                              job.company?.name ||
                              "Unknown Company"}
                          </TableCell>
                          <TableCell className="h-[72px] px-4 py-2 w-60 text-sm font-normal leading-normal">
                            <StatusDropdown
                              job={job}
                              getStatusColor={getStatusColor}
                              onStatusChange={(newStatus) =>
                                handleStatusChange(job, newStatus)
                              }
                            />
                          </TableCell>
                          <TableCell className="h-[72px] px-4 py-2 w-[200px] text-[#0d151c] text-sm font-normal leading-normal">
                            {job.type || "N/A"}
                          </TableCell>
                          <TableCell className="h-[72px] px-4 py-2 w-[200px] text-[#0d151c] text-sm font-normal leading-normal">
                            {formatDate(job.createdAt)}
                          </TableCell>
                          {jobView === VIEW_TYPES.MY_POSTS && (
                            <>
                              <TableCell className="h-[72px] px-4 py-2 w-[200px] text-[#0d151c] text-sm font-normal leading-normal">
                                {job.applicationsCount || 0}
                              </TableCell>
                              <TableCell className="h-[72px] px-4 py-2 w-[120px] text-[#0d151c] text-sm font-normal leading-normal">
                                <div className="flex gap-2 justify-center items-center">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => handleEditClick(e, job._id)}
                                    className="hover:bg-blue-100"
                                  >
                                    <Edit2 className="w-5 h-5 text-blue-600" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      e.preventDefault();
                                      setDeleteDialog({ open: true, job });
                                    }}
                                    className="hover:bg-red-100"
                                  >
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      className="w-5 h-5 text-red-600"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                      />
                                    </svg>
                                  </Button>
                                </div>
                                {/* Delete Confirmation Dialog */}
                                <Dialog
                                  open={deleteDialog.open}
                                  onOpenChange={() =>
                                    setDeleteDialog({ open: false, job: null })
                                  }
                                >
                                  <DialogContent className="sm:max-w-[425px]">
                                    <DialogHeader>
                                      <DialogTitle>Delete Job Post</DialogTitle>
                                      <DialogDescription>
                                        Are you sure you want to delete the job
                                        "{deleteDialog.job?.title}"? This action
                                        cannot be undone.
                                      </DialogDescription>
                                    </DialogHeader>
                                    <DialogFooter>
                                      <Button
                                        variant="outline"
                                        onClick={() =>
                                          setDeleteDialog({
                                            open: false,
                                            job: null,
                                          })
                                        }
                                      >
                                        Cancel
                                      </Button>
                                      <Button
                                        variant="destructive"
                                        onClick={() =>
                                          handleDeleteJob(deleteDialog.job?._id)
                                        }
                                      >
                                        Delete
                                      </Button>
                                    </DialogFooter>
                                  </DialogContent>
                                </Dialog>
                              </TableCell>
                            </>
                          )}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Quick Stats - Only show for my posts */}
            {jobView === VIEW_TYPES.MY_POSTS && jobs.length > 0 && (
              <>
                <h2 className="text-[#0d151c] text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-5">
                  Quick Overview
                </h2>
                <div className="flex flex-wrap gap-4 px-4 py-6">
                  <div className="flex min-w-72 flex-1 flex-col gap-2 rounded-xl border border-[#cedce8] p-6">
                    <p className="text-[#0d151c] text-base font-medium leading-normal">
                      Total Jobs Posted
                    </p>
                    <p className="text-[#0d151c] tracking-light text-[32px] font-bold leading-tight truncate">
                      {jobs.length}
                    </p>
                    <p className="text-[#49749c] text-base font-normal leading-normal">
                      All time
                    </p>
                  </div>

                  <div className="flex min-w-72 flex-1 flex-col gap-2 rounded-xl border border-[#cedce8] p-6">
                    <p className="text-[#0d151c] text-base font-medium leading-normal">
                      Active Jobs
                    </p>
                    <p className="text-[#0d151c] tracking-light text-[32px] font-bold leading-tight truncate">
                      {
                        jobs.filter(
                          (job) =>
                            job.status?.toLowerCase() === "active" ||
                            !job.status
                        ).length
                      }
                    </p>
                    <p className="text-[#49749c] text-base font-normal leading-normal">
                      Currently open
                    </p>
                  </div>

                  <div className="flex min-w-72 flex-1 flex-col gap-2 rounded-xl border border-[#cedce8] p-6">
                    <p className="text-[#0d151c] text-base font-medium leading-normal">
                      Total Applications
                    </p>
                    <p className="text-[#0d151c] tracking-light text-[32px] font-bold leading-tight truncate">
                      {jobs.reduce(
                        (total, job) => total + (job.applicationsCount || 0),
                        0
                      )}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Status Change Confirmation Dialog */}
      <Dialog open={confirmDialog.open} onOpenChange={handleCancelStatusChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Status Change</DialogTitle>
            <DialogDescription>
              Are you sure you want to change the status of "
              {confirmDialog.job?.title}" to{" "}
              <span className="font-medium">
                {confirmDialog.newStatus === "active" ? "Active" : "Closed"}
              </span>
              ?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelStatusChange}>
              Cancel
            </Button>
            <Button onClick={handleConfirmStatusChange}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default JobsDashboard;
