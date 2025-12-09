import api from "@/lib/axios";

export const createCompany = async (companyData) => {
  const response = await api.post("/company/create", companyData);
  return response.data;
};

export const uploadCompanyLogo = async (companyId, file) => {
  const formData = new FormData();
  formData.append("logo", file);
  const response = await api.patch(`/company/${companyId}/logo`, formData);
  return response.data;
};

export const uploadCompanyCover = async (companyId, file) => {
  const formData = new FormData();
  formData.append("coverImage", file);
  const response = await api.patch(`/company/${companyId}/cover`, formData);
  return response.data;
};

export const getAllCompanies = async (queryParams) => {
  const url = queryParams ? `/company/all?${queryParams}` : "/company/all";
  const response = await api.get(url);
  return response.data;
};

export const getFilterOptions = async () => {
  const response = await api.get("/company/filter-options");
  return response.data;
};

export const getCompanyById = async (companyId) => {
  const response = await api.get(`/company/my/${companyId}`);
  return response.data;
};

export const getMyCompany = async () => {
  const response = await api.get("/company/my-company");
  return response.data;
};

export const searchCompaniesByName = async (query) => {
  const response = await api.get(
    `/company/search?q=${encodeURIComponent(query)}`
  );
  return response.data;
};

export const updateCompany = async (companyId, companyData) => {
  const response = await api.put(`/company/update/${companyId}`, companyData);
  return response.data;
};

export const deleteCompany = async (companyId) => {
  const response = await api.delete(`/company/delete/${companyId}`);
  return response.data;
};

export const requestToJoinCompany = async (companyId, { roleTitle }) => {
  const response = await api.post(`/company/${companyId}/request`, {
    roleTitle,
  });
  return response.data;
};

export const getJoinRequests = async (companyId) => {
  const response = await api.get(`/company/${companyId}/requests`);
  return response.data.requests;
};

export const handleJoinRequest = async (companyId, requestId, status) => {
  const response = await api.put(
    `/company/${companyId}/requests/${requestId}`,
    { status }
  );
  return response.data;
};

export const getCompanyMembers = async (companyId) => {
  const response = await api.get(`/company/${companyId}/members`);
  return response.data;
};

export const updateCompanyRole = async (companyId, userId, roleTitle) => {
  const response = await api.put(`/company/${companyId}/roles/${userId}`, {
    roleTitle,
  });
  return response.data;
};

export const removeMemberFromCompany = async (companyId, userId) => {
  const response = await api.delete(`/company/${companyId}/roles/${userId}`);
  return response.data;
};

export const getMyCompanyRole = async (companyId) => {
  const response = await api.get(`/company/${companyId}/me-role`);
  return response.data;
};

export const getMyJoinRequestStatus = async () => {
  const response = await api.get("/company/my-join-requests");
  
  return response.data.requests;
};

export const respondToCompanyJoinRequest = async (companyId, status) => {
  
  try {
    const response = await api.put(`/company/${companyId}/requests/respond`, { status });
    
    return response.data;
  } catch (error) {
    console.error("❌ Frontend: Request failed:", error.response?.data || error.message);
    throw error;
  }
};
