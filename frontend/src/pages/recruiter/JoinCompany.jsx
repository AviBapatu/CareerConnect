import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { useCompanyStore } from "@/store/companyStore";
import {
  getAllCompanies,
  requestToJoinCompany,
  searchCompaniesByName,
  getMyJoinRequestStatus,
} from "@/api/companyApi";
import useAuthStore from "@/store/userStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2, ArrowLeft, Send, Search, X } from "lucide-react";

const JoinCompany = () => {
  const navigate = useNavigate();
  const { setCompanyData } = useCompanyStore();
  const { user, refreshUserData } = useAuthStore();

  const [formData, setFormData] = useState({
    name: user?.name || "",
    companyId: "",
    role: "",
  });

  const [companySearch, setCompanySearch] = useState("");
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [hasShownAcceptedNotification, setHasShownAcceptedNotification] = useState(false);
  const notificationShownRef = useRef(false);
  const lastAcceptedCompanyRef = useRef(null);

  // Fetch companies
  const { data: companiesResponse, isLoading: companiesLoading } = useQuery({
    queryKey: ["companies"],
    queryFn: getAllCompanies,
  });

  // Fetch user's join request status
  const {
    data: joinRequests = [],
    isLoading: joinRequestsLoading,
    refetch: refetchJoinStatus,
  } = useQuery({
    queryKey: ["myJoinRequests"],
    queryFn: getMyJoinRequestStatus,
  });

  // Debug: Log join requests data
  useEffect(() => {
    if (joinRequests.length > 0) {
      
    }
  }, [joinRequests]);

  const companies = companiesResponse?.companies || [];

  // Search companies function
  const searchCompanies = async (query) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    setIsSearching(true);
    try {
      const results = await searchCompaniesByName(query);
      setSearchResults(results || []);
      setShowDropdown(true);
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle search input change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchCompanies(companySearch);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [companySearch]);

  // Reset notification flag when component mounts
  useEffect(() => {
    setHasShownAcceptedNotification(false);
    notificationShownRef.current = false;
    lastAcceptedCompanyRef.current = null;
  }, []);

  // Redirect to dashboard when accepted
  useEffect(() => {
    const acceptedRequest = joinRequests.find(
      (req) => req.status === "accepted"
    );
    
    // Only show notification if this is a new acceptance (different company or first time)
    const isNewAcceptance = acceptedRequest && 
      (!lastAcceptedCompanyRef.current || 
       lastAcceptedCompanyRef.current !== acceptedRequest.companyId);
    
    if (isNewAcceptance && !notificationShownRef.current) {
      
      const companyName = acceptedRequest.companyName;
      toast.success(
        `You have been accepted into ${companyName}! Redirecting to dashboard...`
      );
      notificationShownRef.current = true;
      setHasShownAcceptedNotification(true);
      lastAcceptedCompanyRef.current = acceptedRequest.companyId;
      
      // Refresh user data to get updated company information
      if (refreshUserData) {
        refreshUserData();
      }
      
      // Update company store with the accepted company data
      setCompanyData(acceptedRequest.companyId, acceptedRequest.roleTitle);
      
      // Use setTimeout to ensure the toast is shown before navigation
      setTimeout(() => {
        navigate("/recruiter/dashboard");
      }, 1000);
    }
  }, [joinRequests, navigate, refreshUserData, setCompanyData]);

  // Join request mutation
  const joinMutation = useMutation({
    mutationFn: ({ companyId, roleTitle }) =>
      requestToJoinCompany(companyId, { roleTitle }),
    onSuccess: (_, variables) => {
      // Reset the notification flags for new requests
      setHasShownAcceptedNotification(false);
      notificationShownRef.current = false;
      lastAcceptedCompanyRef.current = null;
      
      // Refetch join status to get the latest data
      refetchJoinStatus().then((res) => {
        const requests = res?.data || joinRequests;
        const newRequest = requests.find(
          (req) =>
            req.companyId === variables.companyId &&
            req.roleTitle === variables.roleTitle
        );
        
        // Check if the request was immediately accepted
        if (newRequest && newRequest.status === "accepted") {
          // Don't show toast here - let useEffect handle the accepted case
          // Update company store with the accepted company data
          setCompanyData(newRequest.companyId, newRequest.roleTitle);
          
          // Refresh user data to get updated company information
          if (refreshUserData) {
            refreshUserData();
          }
          
          // Use setTimeout to ensure proper redirect
          setTimeout(() => {
            navigate("/recruiter/dashboard");
          }, 500);
        } else {
          // Show success toast only for pending requests
          toast.success(
            "Join request submitted successfully! Please wait for approval."
          );
          navigate("/recruiter/company-choice");
        }
      });
    },
    onError: (error) => {
      toast.error(
        error?.response?.data?.message || "Failed to submit join request"
      );
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!selectedCompany || !formData.role) {
      toast.error("Please select a company and role");
      return;
    }

    joinMutation.mutate({
      companyId: selectedCompany._id,
      roleTitle: formData.role,
    });
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCompanySelect = (company) => {
    setSelectedCompany(company);
    setCompanySearch(company.name);
    setShowDropdown(false);
    setFormData((prev) => ({
      ...prev,
      companyId: company._id,
    }));
  };

  // Function to get join request status for a specific company
  const getCompanyRequestStatus = (companyId) => {
    return joinRequests.find((request) => request.companyId === companyId);
  };

  // Function to manually check status
  const handleCheckStatus = async () => {
    try {
      await refetchJoinStatus();
    } catch (error) {
      toast.error("Failed to check status");
    }
  };

  const clearCompanySelection = () => {
    setSelectedCompany(null);
    setCompanySearch("");
    setShowDropdown(false);
    setFormData((prev) => ({
      ...prev,
      companyId: "",
    }));
  };

  return (
    <div
      className="relative flex size-full min-h-screen flex-col bg-gray-50 overflow-x-hidden"
      style={{ fontFamily: 'Inter, "Noto Sans", sans-serif' }}
    >
      <div className="layout-container flex h-full grow flex-col">
        {/* Header */}
        <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-b-[#eaeef1] px-10 py-3 bg-white">
          <div className="flex items-center gap-4 text-[#101518]">
            <div className="size-4">
              <Building2 className="w-4 h-4" />
            </div>
            <h2 className="text-[#101518] text-lg font-bold leading-tight tracking-[-0.015em]">
              CareerConnect
            </h2>
          </div>
          <Button
            variant="ghost"
            onClick={() => navigate("/recruiter/company-choice")}
            className="flex items-center gap-2 text-[#101518] hover:bg-gray-100"
          >
            <ArrowLeft size={16} />
            Back to Company Choice
          </Button>
        </header>

        {/* Main Content */}
        <div className="px-10 md:px-40 flex flex-1 justify-center py-8">
          <div className="layout-content-container flex flex-col w-full max-w-[600px] py-5">
            {/* Page Title */}
            <div className="flex flex-wrap justify-center gap-3 p-4 mb-6">
              <div className="text-center">
                <h1 className="text-[#101518] tracking-light text-[32px] font-bold leading-tight mb-2">
                  Join a Company
                </h1>
                <p className="text-[#5c758a] text-base leading-relaxed">
                  Request to join an existing company as a recruiter or team
                  member
                </p>
              </div>
            </div>

            {/* Current Join Request Status */}
            {joinRequests.length > 0 && (
              <div className="mb-6 p-4">
                <div className="bg-white rounded-xl border border-[#d4dce2] p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-[#101518] text-lg font-semibold">
                      Your Join Request Status
                    </h2>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCheckStatus}
                      disabled={joinRequestsLoading}
                      className="flex items-center gap-2"
                    >
                      <Search size={16} />
                      Check Status
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {joinRequests.map((request) => (
                      <div
                        key={request.companyId}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded bg-blue-100 flex items-center justify-center">
                            <Building2 size={20} className="text-blue-600" />
                          </div>
                          <div>
                            <div className="font-medium text-[#101518]">
                              {request.companyName}
                            </div>
                            <div className="text-sm text-[#5c758a]">
                              Role: {request.roleTitle}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-medium ${
                              request.status === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : request.status === "accepted"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {request.status.charAt(0).toUpperCase() +
                              request.status.slice(1)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name Field */}
              <div className="flex max-w-full flex-wrap items-end gap-4 px-4 py-3">
                <label className="flex flex-col min-w-40 flex-1">
                  <p className="text-[#101518] text-base font-medium leading-normal pb-2">
                    Your Name
                  </p>
                  <Input
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-[#101518] focus:outline-0 focus:ring-0 border border-[#d4dce2] bg-gray-50 focus:border-[#3a7aaf] h-14 placeholder:text-[#5c758a] p-[15px] text-base font-normal leading-normal"
                    placeholder="Enter your full name"
                    required
                    disabled
                  />
                </label>
              </div>

              {/* Company Search */}
              <div className="flex max-w-full flex-wrap items-end gap-4 px-4 py-3">
                <label className="flex flex-col min-w-40 flex-1 relative">
                  <p className="text-[#101518] text-base font-medium leading-normal pb-2">
                    Company
                  </p>
                  <div className="relative">
                    <div className="relative flex items-center">
                      <Search
                        size={16}
                        className="absolute left-4 text-[#5c758a]"
                      />
                      <Input
                        value={companySearch}
                        onChange={(e) => setCompanySearch(e.target.value)}
                        className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-[#101518] focus:outline-0 focus:ring-0 border border-[#d4dce2] bg-gray-50 focus:border-[#3a7aaf] h-14 placeholder:text-[#5c758a] pl-12 pr-12 text-base font-normal leading-normal"
                        placeholder="Search for a company..."
                        required
                      />
                      {selectedCompany && (
                        <button
                          type="button"
                          onClick={clearCompanySelection}
                          className="absolute right-4 text-[#5c758a] hover:text-[#101518] transition-colors"
                        >
                          <X size={16} />
                        </button>
                      )}
                      {isSearching && (
                        <div className="absolute right-4">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#3a7aaf]"></div>
                        </div>
                      )}
                    </div>

                    {/* Search Results Dropdown */}
                    {showDropdown && searchResults.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-[#d4dce2] rounded-xl shadow-lg z-50 max-h-64 overflow-y-auto">
                        {searchResults.map((company) => (
                          <button
                            key={company._id}
                            type="button"
                            onClick={() => handleCompanySelect(company)}
                            className="w-full p-4 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                          >
                            <div className="flex items-center gap-3">
                              {company.logo ? (
                                <img
                                  src={company.logo}
                                  alt={company.name}
                                  className="w-8 h-8 rounded object-cover flex-shrink-0"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded bg-gray-200 flex items-center justify-center flex-shrink-0">
                                  <Building2
                                    size={16}
                                    className="text-gray-400"
                                  />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-[#101518] truncate">
                                  {company.name}
                                </div>
                                {company.industry && (
                                  <div className="text-sm text-[#5c758a] truncate">
                                    {company.industry}
                                  </div>
                                )}
                                {company.location && (
                                  <div className="text-xs text-[#5c758a] truncate">
                                    {company.location}
                                  </div>
                                )}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* No Results Message */}
                    {showDropdown &&
                      searchResults.length === 0 &&
                      companySearch.length >= 2 &&
                      !isSearching && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-[#d4dce2] rounded-xl shadow-lg z-50 p-4 text-center text-[#5c758a]">
                          No companies found for "{companySearch}"
                        </div>
                      )}
                  </div>

                  {/* Selected Company Display */}
                  {selectedCompany && (
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        {selectedCompany.logo ? (
                          <img
                            src={selectedCompany.logo}
                            alt={selectedCompany.name}
                            className="w-8 h-8 rounded object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded bg-blue-200 flex items-center justify-center">
                            <Building2 size={16} className="text-blue-600" />
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="font-medium text-[#101518]">
                            {selectedCompany.name}
                          </div>
                          {selectedCompany.industry && (
                            <div className="text-sm text-[#5c758a]">
                              {selectedCompany.industry}
                            </div>
                          )}
                          {/* Show join request status for selected company */}
                          {(() => {
                            const requestStatus = getCompanyRequestStatus(
                              selectedCompany._id
                            );
                            if (requestStatus) {
                              return (
                                <div className="mt-2 flex items-center gap-2">
                                  <span className="text-xs text-[#5c758a]">
                                    Request Status:
                                  </span>
                                  <span
                                    className={`px-2 py-1 rounded text-xs font-medium ${
                                      requestStatus.status === "pending"
                                        ? "bg-yellow-100 text-yellow-800"
                                        : requestStatus.status === "accepted"
                                        ? "bg-green-100 text-green-800"
                                        : "bg-red-100 text-red-800"
                                    }`}
                                  >
                                    {requestStatus.status
                                      .charAt(0)
                                      .toUpperCase() +
                                      requestStatus.status.slice(1)}
                                  </span>
                                </div>
                              );
                            }
                            return null;
                          })()}
                        </div>
                      </div>
                    </div>
                  )}
                </label>
              </div>

              {/* Role Selection */}
              <div className="flex max-w-full flex-wrap items-end gap-4 px-4 py-3">
                <label className="flex flex-col min-w-40 flex-1">
                  <p className="text-[#101518] text-base font-medium leading-normal pb-2">
                    Desired Role
                  </p>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => handleInputChange("role", value)}
                    required
                  >
                    <SelectTrigger className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-[#101518] focus:outline-0 focus:ring-0 border border-[#d4dce2] bg-gray-50 focus:border-[#3a7aaf] h-14 placeholder:text-[#5c758a] p-[15px] text-base font-normal leading-normal">
                      <SelectValue placeholder="Select your desired role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recruiter">
                        <div>
                          <div className="font-medium">Recruiter</div>
                          <div className="text-xs text-gray-500">
                            Can post jobs and manage applications
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="employee">
                        <div>
                          <div className="font-medium">Employee</div>
                          <div className="text-xs text-gray-500">
                            Basic company member access
                          </div>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </label>
              </div>

              {/* Additional Info */}
              <div className="px-4 py-3">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-xs font-bold">i</span>
                    </div>
                    <div>
                      <p className="text-[#101518] text-sm font-medium mb-1">
                        Join Request Process
                      </p>
                      <p className="text-[#5c758a] text-sm leading-relaxed">
                        Your request will be sent to the company administrators.
                        They will review your request and notify you of their
                        decision. You can check your request status by returning
                        to this page.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex px-4 py-3 justify-end">
                {(() => {
                  const existingRequest = selectedCompany
                    ? getCompanyRequestStatus(selectedCompany._id)
                    : null;
                  const isRequestPending =
                    existingRequest && existingRequest.status === "pending";
                  const isRequestAccepted =
                    existingRequest && existingRequest.status === "accepted";
                  const isRequestRejected =
                    existingRequest && existingRequest.status === "rejected";

                  if (isRequestAccepted) {
                    return (
                      <div className="flex items-center gap-3">
                        <span className="text-green-600 text-sm font-medium">
                          ✅ You've been accepted to this company!
                        </span>
                        <Button
                          type="button"
                          onClick={() => navigate("/recruiter/dashboard")}
                          className="flex min-w-[140px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-12 px-6 bg-green-600 hover:bg-green-700 text-white text-sm font-bold leading-normal tracking-[0.015em]"
                        >
                          Go to Dashboard
                        </Button>
                      </div>
                    );
                  }

                  if (isRequestPending) {
                    return (
                      <div className="flex items-center gap-3">
                        <span className="text-yellow-600 text-sm font-medium">
                          ⏳ Request pending approval
                        </span>
                        <Button
                          type="button"
                          disabled
                          className="flex min-w-[140px] max-w-[480px] cursor-not-allowed items-center justify-center overflow-hidden rounded-full h-12 px-6 bg-gray-300 text-gray-500 text-sm font-bold leading-normal tracking-[0.015em]"
                        >
                          Request Sent
                        </Button>
                      </div>
                    );
                  }

                  return (
                    <Button
                      type="submit"
                      disabled={
                        joinMutation.isPending ||
                        !selectedCompany ||
                        !formData.role
                      }
                      className="flex min-w-[140px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-12 px-6 bg-[#3a7aaf] hover:bg-[#2d5d87] text-gray-50 text-sm font-bold leading-normal tracking-[0.015em] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    >
                      {joinMutation.isPending ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send size={16} className="mr-2" />
                          {isRequestRejected
                            ? "Resubmit Request"
                            : "Submit Request"}
                        </>
                      )}
                    </Button>
                  );
                })()}
              </div>
            </form>

            {/* Help Section */}
            <div className="mt-8 p-4">
              <div className="text-center">
                <p className="text-[#5c758a] text-sm mb-2">
                  Don't see your company in the list?
                </p>
                <Button
                  variant="outline"
                  onClick={() => navigate("/recruiter/create-company")}
                  className="border-[#3a7aaf] text-[#3a7aaf] hover:bg-[#3a7aaf] hover:text-white"
                >
                  Create New Company
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JoinCompany;
