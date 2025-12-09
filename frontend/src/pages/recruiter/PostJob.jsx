import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { postJob, editJob, getJobById } from "@/api/jobApi";
import useAuthStore from "@/store/userStore";
import { useCompanyStore } from "@/store/companyStore";
import { postJobSchema } from "@/validation/job.validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const PostJob = () => {
  const navigate = useNavigate();
  const { jobId } = useParams(); // Get jobId from URL params for edit mode
  const { user } = useAuthStore();
  const { companyRole } = useCompanyStore();
  const [isDraft, setIsDraft] = useState(false);

  const isEditMode = !!jobId;

  
  
  

  // Fetch job data when in edit mode
  const {
    data: jobData,
    isLoading: isLoadingJob,
    error: jobError,
  } = useQuery({
    queryKey: ["job", jobId],
    queryFn: () => {
      
      return getJobById(jobId);
    },
    enabled: isEditMode,
    onSuccess: (data) => {
      
    },
    onError: (error) => {
      console.error("Error fetching job data:", error);
      toast.error("Failed to load job data");
      navigate("/jobs");
    },
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(postJobSchema),
    defaultValues: {
      title: "",
      description: "",
      requirements: "",
      location: "",
      type: "",
      industry: "",
      salaryMin: "",
      salaryMax: "",
      applicationInstructions: "",
    },
  });

  // Populate form when job data is loaded (edit mode)
  useEffect(() => {
    if (isEditMode && jobData?.data) {
      const job = jobData.data;
      

      reset({
        title: job.title || "",
        description: job.description || "",
        requirements: job.requirements ? job.requirements.join("\n") : "",
        location: job.location || "",
        type: job.type || "",
        industry: job.industry || "",
        salaryMin: job.salaryRange?.min || "",
        salaryMax: job.salaryRange?.max || "",
        applicationInstructions: job.applicationInstructions || "",
      });

      // Set select values manually
      if (job.type) {
        setValue("type", job.type);
      }
      if (job.industry) {
        setValue("industry", job.industry);
      }
    }
  }, [jobData, isEditMode, reset, setValue]);

  // Watch form values for preview
  const watchedValues = watch();

  // Check if user has permission to post jobs
  useEffect(() => {
    
    

    if (!user || user.role !== "recruiter") {
      
      toast.error("You must be a recruiter to post jobs");
      navigate("/jobs");
      return;
    }

    if (
      !companyRole ||
      (companyRole !== "admin" && companyRole !== "recruiter")
    ) {
      
      toast.error("You don't have permission to post jobs");
      navigate("/jobs");
      return;
    }

    
  }, [user, companyRole, navigate]);

  // Post job mutation
  const postJobMutation = useMutation({
    mutationFn: postJob,
    onSuccess: (response) => {
      const jobStatus = response.data?.job?.status || "active";
      const successMessage =
        jobStatus === "draft"
          ? "Job saved as draft successfully!"
          : "Job posted successfully!";
      toast.success(successMessage);
      reset();
      navigate("/jobs");
    },
    onError: (error) => {
      console.error("Post job error:", error);
      const errorMessage =
        error.response?.data?.message ||
        "Failed to post job. Please try again.";
      toast.error(errorMessage);
    },
  });

  // Edit job mutation (full edit, triggers navigation)
  const editJobMutation = useMutation({
    mutationFn: ({ id, data }) => editJob(id, data),
    onSuccess: (response) => {
      const jobStatus = response.data?.job?.status || "active";
      const successMessage =
        jobStatus === "draft"
          ? "Job saved as draft successfully!"
          : "Job updated successfully!";
      toast.success(successMessage);
      navigate("/jobs");
    },
    onError: (error) => {
      console.error("Edit job error:", error);
      const errorMessage =
        error.response?.data?.message ||
        "Failed to update job. Please try again.";
      toast.error(errorMessage);
    },
  });

  // Status update mutation (no navigation)
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => editJob(id, { status }),
    onSuccess: (response) => {
      toast.success("Job status updated!");
    },
    onError: (error) => {
      console.error("Status update error:", error);
      toast.error("Failed to update job status.");
    },
  });

  const onSubmit = async (data, isDraftSubmission = false) => {
    try {
      // Transform data to match backend schema
      const jobData = {
        title: data.title,
        description: data.description,
        requirements: data.requirements
          ? data.requirements.split("\n").filter((req) => req.trim())
          : [],
        location: data.location,
        type: data.type,
        industry: data.industry || undefined,
        salaryRange:
          data.salaryMin || data.salaryMax
            ? {
                min: data.salaryMin || undefined,
                max: data.salaryMax || undefined,
              }
            : undefined,
        applicationInstructions: data.applicationInstructions || undefined,
        status: isDraftSubmission ? "closed" : "active", // Save as draft sets status to closed
      };

      

      if (isEditMode) {
        await editJobMutation.mutateAsync({ id: jobId, data: jobData });
      } else {
        await postJobMutation.mutateAsync(jobData);
      }
    } catch (error) {
      console.error("Submit error:", error);
    }
  };

  const handleSaveDraft = () => {
    setIsDraft(true);
    handleSubmit((data) => onSubmit(data, true))();
  };

  const handlePostJob = () => {
    setIsDraft(false);
    handleSubmit((data) => onSubmit(data, false))();
  };

  const jobTypes = [
    { value: "full-time", label: "Full-time" },
    { value: "part-time", label: "Part-time" },
    { value: "internship", label: "Internship" },
    { value: "contract", label: "Contract" },
    { value: "freelance", label: "Freelance" },
    { value: "remote", label: "Remote" },
  ];

  const industries = [
    { value: "technology", label: "Technology" },
    { value: "healthcare", label: "Healthcare" },
    { value: "finance", label: "Finance" },
    { value: "education", label: "Education" },
    { value: "retail", label: "Retail" },
    { value: "manufacturing", label: "Manufacturing" },
    { value: "construction", label: "Construction" },
    { value: "transportation", label: "Transportation" },
    { value: "hospitality", label: "Hospitality" },
    { value: "media", label: "Media & Entertainment" },
    { value: "consulting", label: "Consulting" },
    { value: "non-profit", label: "Non-profit" },
    { value: "government", label: "Government" },
    { value: "other", label: "Other" },
  ];

  return (
    <div className="relative flex size-full min-h-screen flex-col bg-slate-50">
      <div className="layout-container flex h-full grow flex-col">
        <div className="px-40 flex flex-1 justify-center py-5">
          <div className="layout-content-container flex flex-col max-w-[960px] flex-1">
            {/* Show loading spinner when fetching job data in edit mode */}
            {isEditMode && isLoadingJob ? (
              <div className="flex justify-center items-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="flex flex-wrap justify-between gap-3 p-4">
                  <div className="flex min-w-72 flex-col gap-3">
                    <h1 className="text-[#0d151b] tracking-light text-[32px] font-bold leading-tight">
                      {isEditMode ? "Edit Job" : "Post a job"}
                    </h1>
                    <p className="text-[#4c759a] text-sm font-normal leading-normal">
                      {isEditMode
                        ? "Update your job posting details."
                        : "Reach millions of job seekers and find the perfect fit for your company."}
                    </p>
                  </div>
                  {/* Status dropdown for active jobs */}
                  {isEditMode && jobData?.data?.status && (
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">Status:</span>
                      <span className="px-2 py-1 border rounded bg-gray-100 text-gray-700">
                        {jobData.data.status === "active" ? "Open" : "Closed"}
                      </span>
                    </div>
                  )}
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  {/* Job Title */}
                  <div className="flex max-w-[480px] flex-wrap items-end gap-4 px-4 py-3">
                    <div className="flex flex-col min-w-40 flex-1">
                      <Label
                        htmlFor="title"
                        className="text-[#0d151b] text-base font-medium leading-normal pb-2"
                      >
                        Job title
                      </Label>
                      <Input
                        id="title"
                        {...register("title")}
                        placeholder="e.g., Software Engineer, Marketing Manager"
                        className="h-14 bg-slate-50 border-[#cfdce7] focus:border-[#cfdce7] text-base"
                      />
                      {errors.title && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.title.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Job Description */}
                  <div className="flex max-w-[480px] flex-wrap items-end gap-4 px-4 py-3">
                    <div className="flex flex-col min-w-40 flex-1">
                      <Label
                        htmlFor="description"
                        className="text-[#0d151b] text-base font-medium leading-normal pb-2"
                      >
                        Job description
                      </Label>
                      <Textarea
                        id="description"
                        {...register("description")}
                        placeholder="Describe the role, responsibilities, and what you're looking for in a candidate"
                        className="min-h-36 bg-slate-50 border-[#cfdce7] focus:border-[#cfdce7] text-base resize-none"
                      />
                      {errors.description && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.description.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Requirements */}
                  <div className="flex max-w-[480px] flex-wrap items-end gap-4 px-4 py-3">
                    <div className="flex flex-col min-w-40 flex-1">
                      <Label
                        htmlFor="requirements"
                        className="text-[#0d151b] text-base font-medium leading-normal pb-2"
                      >
                        Requirements
                      </Label>
                      <Textarea
                        id="requirements"
                        {...register("requirements")}
                        placeholder="List the required skills, qualifications, and experience (one per line)"
                        className="min-h-36 bg-slate-50 border-[#cfdce7] focus:border-[#cfdce7] text-base resize-none"
                      />
                      {errors.requirements && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.requirements.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Location */}
                  <div className="flex max-w-[480px] flex-wrap items-end gap-4 px-4 py-3">
                    <div className="flex flex-col min-w-40 flex-1">
                      <Label
                        htmlFor="location"
                        className="text-[#0d151b] text-base font-medium leading-normal pb-2"
                      >
                        Location
                      </Label>
                      <Input
                        id="location"
                        {...register("location")}
                        placeholder="e.g., San Francisco, CA"
                        className="h-14 bg-slate-50 border-[#cfdce7] focus:border-[#cfdce7] text-base"
                      />
                      {errors.location && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.location.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Job Type */}
                  <div className="flex max-w-[480px] flex-wrap items-end gap-4 px-4 py-3">
                    <div className="flex flex-col min-w-40 flex-1">
                      <Label
                        htmlFor="type"
                        className="text-[#0d151b] text-base font-medium leading-normal pb-2"
                      >
                        Job type
                      </Label>
                      <Select
                        onValueChange={(value) => setValue("type", value)}
                        value={watchedValues.type}
                      >
                        <SelectTrigger className="h-14 bg-slate-50 border-[#cfdce7] focus:border-[#cfdce7]">
                          <SelectValue placeholder="Select job type" />
                        </SelectTrigger>
                        <SelectContent>
                          {jobTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.type && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.type.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Industry */}
                  <div className="flex max-w-[480px] flex-wrap items-end gap-4 px-4 py-3">
                    <div className="flex flex-col min-w-40 flex-1">
                      <Label
                        htmlFor="industry"
                        className="text-[#0d151b] text-base font-medium leading-normal pb-2"
                      >
                        Industry
                      </Label>
                      <Select
                        onValueChange={(value) => setValue("industry", value)}
                        value={watchedValues.industry}
                      >
                        <SelectTrigger className="h-14 bg-slate-50 border-[#cfdce7] focus:border-[#cfdce7]">
                          <SelectValue placeholder="Select industry" />
                        </SelectTrigger>
                        <SelectContent>
                          {industries.map((industry) => (
                            <SelectItem
                              key={industry.value}
                              value={industry.value}
                            >
                              {industry.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.industry && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.industry.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Salary Range */}
                  <div className="flex max-w-[480px] flex-wrap items-end gap-4 px-4 py-3">
                    <div className="flex flex-col min-w-40 flex-1">
                      <Label className="text-[#0d151b] text-base font-medium leading-normal pb-2">
                        Salary range
                      </Label>
                      <Input
                        {...register("salaryMin")}
                        placeholder="Minimum"
                        className="h-14 bg-slate-50 border-[#cfdce7] focus:border-[#cfdce7] text-base"
                        type="number"
                      />
                    </div>
                    <div className="flex flex-col min-w-40 flex-1">
                      <Input
                        {...register("salaryMax")}
                        placeholder="Maximum"
                        className="h-14 bg-slate-50 border-[#cfdce7] focus:border-[#cfdce7] text-base"
                        type="number"
                      />
                    </div>
                  </div>

                  {/* Application Instructions */}
                  <div className="flex max-w-[480px] flex-wrap items-end gap-4 px-4 py-3">
                    <div className="flex flex-col min-w-40 flex-1">
                      <Label
                        htmlFor="applicationInstructions"
                        className="text-[#0d151b] text-base font-medium leading-normal pb-2"
                      >
                        Application instructions
                      </Label>
                      <Textarea
                        id="applicationInstructions"
                        {...register("applicationInstructions")}
                        placeholder="How should candidates apply? Include contact information or a link to your application portal"
                        className="min-h-36 bg-slate-50 border-[#cfdce7] focus:border-[#cfdce7] text-base resize-none"
                      />
                      {errors.applicationInstructions && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.applicationInstructions.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Preview Section */}
                  <div className="px-4 py-5">
                    <h2 className="text-[#0d151b] text-[22px] font-bold leading-tight tracking-[-0.015em] pb-3">
                      Preview
                    </h2>
                    <Card className="bg-white border-[#e7eef3]">
                      <CardContent className="p-6">
                        <div className="flex items-stretch justify-between gap-4">
                          <div className="flex flex-col gap-1 flex-[2_2_0px]">
                            <h3 className="text-[#0d151b] text-base font-bold leading-tight">
                              {watchedValues.title || "Job Title"}
                            </h3>
                            <p className="text-[#4c759a] text-sm font-normal leading-normal">
                              {user?.company?.name || "Company Name"} •{" "}
                              {watchedValues.location || "Location"}
                            </p>
                            <p className="text-[#4c759a] text-sm font-normal leading-normal mt-2">
                              {watchedValues.type &&
                                jobTypes.find(
                                  (t) => t.value === watchedValues.type
                                )?.label}
                              {watchedValues.salaryMin &&
                                watchedValues.salaryMax &&
                                ` • $${parseInt(
                                  watchedValues.salaryMin
                                ).toLocaleString()} - $${parseInt(
                                  watchedValues.salaryMax
                                ).toLocaleString()}`}
                            </p>
                            {watchedValues.description && (
                              <p
                                className="text-[#0d151b] text-sm mt-3"
                                style={{
                                  display: "-webkit-box",
                                  WebkitLineClamp: 3,
                                  WebkitBoxOrient: "vertical",
                                  overflow: "hidden",
                                }}
                              >
                                {watchedValues.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-stretch">
                    <div className="flex flex-1 gap-3 flex-wrap px-4 py-3 justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleSaveDraft}
                        disabled={
                          postJobMutation.isLoading || editJobMutation.isLoading
                        }
                        className="min-w-[84px] h-10 bg-[#e7eef3] text-[#0d151b] border-0 hover:bg-[#d1dce7]"
                      >
                        {(postJobMutation.isLoading ||
                          editJobMutation.isLoading) &&
                        isDraft
                          ? "Saving..."
                          : "Save as draft"}
                      </Button>
                      <Button
                        type="button"
                        onClick={handlePostJob}
                        disabled={
                          postJobMutation.isLoading || editJobMutation.isLoading
                        }
                        className="min-w-[84px] h-10 bg-[#1284e7] hover:bg-[#0f6bb8] text-white"
                      >
                        {(postJobMutation.isLoading ||
                          editJobMutation.isLoading) &&
                        !isDraft
                          ? isEditMode
                            ? "Updating..."
                            : "Posting..."
                          : isEditMode
                          ? "Update Job"
                          : "Post job"}
                      </Button>
                    </div>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostJob;
