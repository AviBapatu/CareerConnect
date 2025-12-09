import axios from "@/lib/axios";

// Get all jobs
export const getAllJobs = (search = "") => {
  const params = {};
  if (search) params.search = search;
  return axios.get("/job/all", { params });
};

// Get job by ID
export const getJobById = (id) => {
  return axios.get(`/job/${id}`);
};

// Get jobs posted by current user/company
export const getMyJobPosts = () => {
  return axios.get("/job/my-posts");
};

// Get jobs by company
export const getJobsByCompany = (companyId) => {
  
  const url = `/job?company=${companyId}`;
  
  return axios.get(url);
};

// Post a new job
export const postJob = (jobData) => {
  return axios.post("/job/post", jobData);
};

// Edit a job
export const editJob = (id, jobData) => {
  return axios.put(`/job/${id}`, jobData);
};

// Delete a job
export const deleteJob = (id) => {
  return axios.delete(`/job/${id}`);
};

// Update job status
export const updateJobStatus = (companyId, jobId, status) => {
  return axios.put(`/job/${companyId}/${jobId}/status`, { status });
};

// Apply to a job
export const applyToJob = (jobId, applicationData) => {
  return axios.post(`/job/apply/${jobId}`, applicationData);
};

// Get user's applications
export const getMyApplications = async () => {
  
  try {
    const response = await axios.get("/job/my/applications");
    
    
    return response;
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};

// Get user's application for a specific job
export const getMyApplicationForJob = (jobId) => {
  return axios.get(`/job/my/applications/${jobId}`);
};

// Delete user's application
export const deleteApplication = (jobId, applicationId) => {
  return axios.delete(`/job/${jobId}/application/delete/${applicationId}`);
};

// Get applications for a specific job (for recruiters)
export const getApplicationsForJob = (companyId, jobId) => {
  return axios.get(`/job/${companyId}/applications/${jobId}`);
};

// Get all applications for company (for recruiters)
export const getAllApplicationsForCompany = () => {
  return axios.get("/job/applications/company");
};

// Update application status
export const updateApplicationStatus = (companyId, applicationId, status) => {
  return axios.put(`/job/${companyId}/applications/${applicationId}/status`, {
    status,
  });
};

// Send status update email to applicant
export const sendApplicationStatusEmail = (applicationId) => {
  return axios.post(`/job/${applicationId}/send-status-email`);
};
