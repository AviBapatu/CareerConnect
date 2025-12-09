import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCompanyStore } from "@/store/companyStore";
import useAuthStore from "@/store/userStore";
import {
  getJoinRequests,
  handleJoinRequest,
  getCompanyMembers,
  updateCompanyRole,
  removeMemberFromCompany,
  getAllCompanies,
  requestToJoinCompany,
} from "@/api/companyApi";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import api from "@/lib/axios";

const RoleManagement = () => {
  const { companyId, companyRole } = useCompanyStore();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState("");
  const [selectedRole, setSelectedRole] = useState("recruiter");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);

  // Fetch join requests
  const {
    data: joinRequests = [],
    isLoading: loadingRequests,
    error: requestsError,
  } = useQuery({
    queryKey: ["joinRequests", companyId],
    queryFn: () => getJoinRequests(companyId),
    enabled: !!companyId,
  });

  // Fetch company members
  const {
    data: membersData,
    isLoading: loadingMembers,
    error: membersError,
  } = useQuery({
    queryKey: ["companyMembers", companyId],
    queryFn: () => getCompanyMembers(companyId),
    enabled: !!companyId,
  });

  const { data: companies = [] } = useQuery({
    queryKey: ["allCompaniesForJoin"],
    queryFn: getAllCompanies,
    enabled: joinDialogOpen,
  });

  // Debounced user search
  useEffect(() => {
    if (!searchTerm) {
      setSearchResults([]);
      return;
    }
    setSearchLoading(true);
    
    const timeout = setTimeout(async () => {
      try {
        const url = `/connection/search?search=${encodeURIComponent(searchTerm)}&companyId=${companyId}`;
        
        const res = await api.get(url);
        
        setSearchResults(res.data.results || []);
      } catch (e) {
        console.error('[DEBUG] Search error:', e);
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 400);
    return () => clearTimeout(timeout);
  }, [searchTerm, companyId]);

  useEffect(() => {
    if (selectedUser) {
      
    }
  }, [selectedUser]);

  const sendUserJoinRequest = useMutation({
    mutationFn: ({ userId, roleTitle }) => {
      
      return api.post(`/company/${companyId}/invite`, { userId, roleTitle });
    },
    onSuccess: (data) => {
      
      toast.success("Join request sent!");
      setJoinDialogOpen(false);
      setSelectedUser(null);
      setSearchTerm("");
      setSelectedRole("recruiter");
    },
    onError: (error) => {
      console.error('[DEBUG] Invite error:', error);
      toast.error(error.response?.data?.message || "Failed to send join request");
    },
  });

  // Handle join request mutation
  const handleRequestMutation = useMutation({
    mutationFn: ({ requestId, status }) =>
      handleJoinRequest(companyId, requestId, status),
    onSuccess: (data, { status, requestId }) => {
      toast.success(`Request ${status} successfully`);
      queryClient.invalidateQueries(["joinRequests", companyId]);
      queryClient.invalidateQueries(["companyMembers", companyId]);

      // If request was accepted, also invalidate user-related queries
      // This helps refresh dashboards and other user-specific data
      if (status === "accepted") {
        queryClient.invalidateQueries(["user"]);
        queryClient.invalidateQueries(["candidateDashboard"]);
        queryClient.invalidateQueries(["myCompany"]);
      }
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to handle request");
    },
  });

  // Update role mutation
  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, roleTitle }) =>
      updateCompanyRole(companyId, userId, roleTitle),
    onSuccess: () => {
      toast.success("Role updated successfully");
      queryClient.invalidateQueries(["companyMembers", companyId]);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to update role");
    },
  });

  // Remove member mutation
  const removeMemberMutation = useMutation({
    mutationFn: (userId) => removeMemberFromCompany(companyId, userId),
    onSuccess: () => {
      toast.success("Member removed successfully");
      queryClient.invalidateQueries(["companyMembers", companyId]);
      setConfirmDialog(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to remove member");
      setConfirmDialog(null);
    },
  });

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case "admin":
        return "bg-red-50 text-red-700 border-red-200";
      case "recruiter":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "employee":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "accepted":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "rejected":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const canManageUser = (targetRole) => {
    if (companyRole === "admin") return true;
    if (companyRole === "recruiter" && targetRole !== "admin") return true;
    return false;
  };

  if (!companyId) {
    return (
      <div
        className="relative min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-50 flex items-center justify-center p-6"
        style={{
          fontFamily: '"Inter", "SF Pro Display", system-ui, sans-serif',
        }}
      >
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-8 h-8 text-slate-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-slate-900 tracking-tight mb-3">
            No Company Associated
          </h2>
          <p className="text-slate-600 leading-relaxed">
            You need to be part of a company to manage roles and team members.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-50 p-6"
      style={{ fontFamily: '"Inter", "SF Pro Display", system-ui, sans-serif' }}
    >
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900 mb-2">
                Role Management
              </h1>
              <p className="text-base text-slate-600 font-light leading-relaxed">
                Manage team members, requests, and permissions
              </p>
            </div>
            <div className="ml-8 flex flex-col items-end gap-2">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-50 text-slate-700 border border-slate-200 rounded-lg font-medium text-sm">
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full"></div>
                <span>Your Role: {companyRole}</span>
              </div>
              {(companyRole === "admin" || companyRole === "recruiter") && (
                <Button
                  className="mt-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 text-sm font-semibold shadow-sm"
                  onClick={() => setJoinDialogOpen(true)}
                >
                  Send Join Request to Company
                </Button>
              )}
            </div>
          </div>
        </div>

        <Tabs defaultValue="requests" className="w-full">
          <div className="mb-6">
            <TabsList className="grid w-full grid-cols-2 h-10 p-1 bg-slate-100/80 backdrop-blur-sm rounded-lg border border-slate-200/60">
              <TabsTrigger
                value="requests"
                className="flex items-center gap-2 h-8 px-4 rounded-md font-medium text-sm transition-all duration-200 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-slate-900 text-slate-600 hover:text-slate-800"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  fill="currentColor"
                  viewBox="0 0 256 256"
                >
                  <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm56-88a8,8,0,0,1-8,8H136a8,8,0,0,1-8-8V80a8,8,0,0,1,16,0v40h32A8,8,0,0,1,184,128Z" />
                </svg>
                Join Requests
                {joinRequests?.filter((req) => req.status === "pending")
                  .length > 0 && (
                  <div className="ml-1 px-1.5 py-0.5 bg-red-500 text-white text-xs font-semibold rounded-full min-w-[16px] h-[16px] flex items-center justify-center">
                    {
                      joinRequests.filter((req) => req.status === "pending")
                        .length
                    }
                  </div>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="members"
                className="flex items-center gap-2 h-8 px-4 rounded-md font-medium text-sm transition-all duration-200 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-slate-900 text-slate-600 hover:text-slate-800"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  fill="currentColor"
                  viewBox="0 0 256 256"
                >
                  <path d="M117.25,157.92a60,60,0,1,0-66.5,0A95.83,95.83,0,0,0,3.53,195.63a8,8,0,1,0,13.4,8.74,80,80,0,0,1,134.14,0,8,8,0,0,0,13.4-8.74A95.83,95.83,0,0,0,117.25,157.92ZM40,108a44,44,0,1,1,44,44A44.05,44.05,0,0,1,40,108Zm210.27,98.63a8,8,0,0,1-11.89-10.53,64,64,0,0,0-64.76-64.76,8,8,0,1,1-8.5-13.54,80,80,0,0,1,85.15,88.83Z" />
                </svg>
                Team Members ({membersData?.count || 0})
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Join Requests Tab */}
          <TabsContent value="requests" className="space-y-4">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200/60 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200/60 bg-gradient-to-r from-slate-50/80 to-zinc-50/80">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      fill="currentColor"
                      viewBox="0 0 256 256"
                      className="text-white"
                    >
                      <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm56-88a8,8,0,0,1-8,8H136a8,8,0,0,1-8-8V80a8,8,0,0,1,16,0v40h32A8,8,0,0,1,184,128Z" />
                    </svg>
                  </div>
                  <h2 className="text-lg font-semibold text-slate-800 tracking-tight">
                    Join Requests
                  </h2>
                  <div className="h-px bg-gradient-to-r from-slate-200 to-transparent flex-1 ml-4"></div>
                </div>
              </div>
              <div className="p-6">
                {loadingRequests ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-slate-300 border-t-slate-800"></div>
                  </div>
                ) : requestsError ? (
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
                      Failed to load requests
                    </p>
                  </div>
                ) : joinRequests.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        fill="currentColor"
                        viewBox="0 0 256 256"
                        className="text-slate-400"
                      >
                        <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm16-40a8,8,0,0,1-8,8,16,16,0,0,1-16-16V128a8,8,0,0,1,0-16,16,16,0,0,1,16,16v40A8,8,0,0,1,144,176ZM112,84a12,12,0,1,1,12,12A12,12,0,0,1,112,84Z" />
                      </svg>
                    </div>
                    <h3 className="text-base font-semibold text-slate-800 mb-1">
                      No join requests
                    </h3>
                    <p className="text-slate-500 text-sm leading-relaxed">
                      New requests will appear here when users apply to join
                      your company
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {joinRequests.map((request) => (
                      <div
                        key={request._id}
                        className="group p-4 bg-gradient-to-r from-white to-slate-50/30 border border-slate-200/60 rounded-lg hover:shadow-md hover:border-slate-300/60 transition-all duration-300"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-slate-600 to-slate-800 rounded-lg flex items-center justify-center text-white font-semibold shadow-sm">
                              {request.user?.name?.charAt(0).toUpperCase() ||
                                "U"}
                            </div>
                            <div className="flex-1">
                              <h3 className="text-base font-semibold text-slate-900 tracking-tight mb-1">
                                {request.user?.name || "Unknown User"}
                              </h3>
                              <p className="text-slate-600 font-medium text-sm mb-2">
                                {request.user?.email}
                              </p>
                              <div className="flex items-center gap-2">
                                <div
                                  className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs font-medium ${getRoleBadgeColor(
                                    request.roleTitle
                                  )}`}
                                >
                                  <div className="w-1.5 h-1.5 rounded-full bg-current opacity-60"></div>
                                  {request.roleTitle}
                                </div>
                                <div
                                  className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs font-medium ${getStatusBadgeColor(
                                    request.status
                                  )}`}
                                >
                                  <div className="w-1.5 h-1.5 rounded-full bg-current opacity-60"></div>
                                  {request.status}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-slate-500 font-medium mb-3">
                              {formatDate(request.requestedAt)}
                            </p>
                            {request.status === "pending" && (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    handleRequestMutation.mutate({
                                      requestId: request._id,
                                      status: "accepted",
                                    })
                                  }
                                  disabled={handleRequestMutation.isPending}
                                  className="h-8 px-3 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 hover:border-emerald-300 rounded-md font-medium text-xs transition-all duration-200 shadow-none hover:shadow-sm"
                                >
                                  Accept
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    handleRequestMutation.mutate({
                                      requestId: request._id,
                                      status: "rejected",
                                    })
                                  }
                                  disabled={handleRequestMutation.isPending}
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
          </TabsContent>

          {/* Team Members Tab */}
          <TabsContent value="members" className="space-y-4">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200/60 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200/60 bg-gradient-to-r from-slate-50/80 to-zinc-50/80">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      fill="currentColor"
                      viewBox="0 0 256 256"
                      className="text-white"
                    >
                      <path d="M117.25,157.92a60,60,0,1,0-66.5,0A95.83,95.83,0,0,0,3.53,195.63a8,8,0,1,0,13.4,8.74,80,80,0,0,1,134.14,0,8,8,0,0,0,13.4-8.74A95.83,95.83,0,0,0,117.25,157.92ZM40,108a44,44,0,1,1,44,44A44.05,44.05,0,0,1,40,108Zm210.27,98.63a8,8,0,0,1-11.89-10.53,64,64,0,0,0-64.76-64.76,8,8,0,1,1-8.5-13.54,80,80,0,0,1,85.15,88.83Z" />
                    </svg>
                  </div>
                  <h2 className="text-lg font-semibold text-slate-800 tracking-tight">
                    Team Members ({membersData?.count || 0})
                  </h2>
                  <div className="h-px bg-gradient-to-r from-slate-200 to-transparent flex-1 ml-4"></div>
                </div>
              </div>
              <div className="p-6">
                {loadingMembers ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-slate-300 border-t-slate-800"></div>
                  </div>
                ) : membersError ? (
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
                      Failed to load members
                    </p>
                  </div>
                ) : !membersData?.members ||
                  membersData.members.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        fill="currentColor"
                        viewBox="0 0 256 256"
                        className="text-slate-400"
                      >
                        <path d="M117.25,157.92a60,60,0,1,0-66.5,0A95.83,95.83,0,0,0,3.53,195.63a8,8,0,1,0,13.4,8.74,80,80,0,0,1,134.14,0,8,8,0,0,0,13.4-8.74A95.83,95.83,0,0,0,117.25,157.92ZM40,108a44,44,0,1,1,44,44A44.05,44.05,0,0,1,40,108Z" />
                      </svg>
                    </div>
                    <h3 className="text-base font-semibold text-slate-800 mb-1">
                      No team members
                    </h3>
                    <p className="text-slate-500 text-sm leading-relaxed">
                      Team members will appear here once they join your company
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {membersData.members.map((member) => (
                      <div
                        key={member._id}
                        className="group p-4 bg-gradient-to-r from-white to-slate-50/30 border border-slate-200/60 rounded-xl hover:shadow-md hover:border-slate-300/60 transition-all duration-300"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-slate-600 to-slate-800 rounded-lg flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                              {member.name?.charAt(0).toUpperCase() || "U"}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-sm font-semibold text-slate-900 tracking-tight">
                                  {member.name}
                                </h3>
                                {member._id === user?._id && (
                                  <div className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-slate-100 text-slate-600 text-xs font-medium rounded-md">
                                    <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
                                    You
                                  </div>
                                )}
                              </div>
                              <p className="text-slate-600 font-medium mb-2 text-xs">
                                {member.email}
                              </p>
                              <div
                                className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs font-medium ${getRoleBadgeColor(
                                  member.role
                                )}`}
                              >
                                <div className="w-1.5 h-1.5 rounded-full bg-current opacity-60"></div>
                                {member.role}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {member._id !== user?._id &&
                              canManageUser(member.role) && (
                                <>
                                  <Select
                                    defaultValue={member.role}
                                    onValueChange={(newRole) =>
                                      updateRoleMutation.mutate({
                                        userId: member._id,
                                        roleTitle: newRole,
                                      })
                                    }
                                    disabled={updateRoleMutation.isPending}
                                  >
                                    <SelectTrigger className="w-28 h-8 bg-white border-slate-200 rounded-lg hover:border-slate-300 focus:border-slate-400 text-xs font-medium transition-all duration-200">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white border-slate-200 rounded-lg shadow-lg">
                                      <SelectItem
                                        value="employee"
                                        className="text-xs font-medium text-slate-700 hover:bg-slate-50"
                                      >
                                        Employee
                                      </SelectItem>
                                      <SelectItem
                                        value="recruiter"
                                        className="text-xs font-medium text-slate-700 hover:bg-slate-50"
                                      >
                                        Recruiter
                                      </SelectItem>
                                      {companyRole === "admin" && (
                                        <SelectItem
                                          value="admin"
                                          className="text-xs font-medium text-slate-700 hover:bg-slate-50"
                                        >
                                          Admin
                                        </SelectItem>
                                      )}
                                    </SelectContent>
                                  </Select>
                                  <Button
                                    size="sm"
                                    onClick={() =>
                                      setConfirmDialog({
                                        type: "remove",
                                        member,
                                      })
                                    }
                                    className="h-8 px-3 bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 hover:border-red-300 rounded-lg font-medium transition-all duration-200 shadow-none hover:shadow-sm text-xs"
                                  >
                                    Remove
                                  </Button>
                                </>
                              )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Confirmation Dialog */}
        <Dialog
          open={!!confirmDialog}
          onOpenChange={() => setConfirmDialog(null)}
        >
          <DialogContent className="bg-white border-slate-200 rounded-xl shadow-xl max-w-md">
            <DialogHeader className="pb-3">
              <DialogTitle className="text-lg font-semibold text-slate-900 tracking-tight">
                {confirmDialog?.type === "remove" && "Remove Team Member"}
              </DialogTitle>
              <DialogDescription className="text-slate-600 leading-relaxed mt-1 text-sm">
                {confirmDialog?.type === "remove" &&
                  `Are you sure you want to remove ${confirmDialog.member?.name} from the company? This action cannot be undone.`}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="pt-4 gap-2">
              <Button
                onClick={() => setConfirmDialog(null)}
                disabled={removeMemberMutation.isPending}
                className="h-8 px-4 bg-white border border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50 rounded-lg font-medium transition-all duration-200 text-sm"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (confirmDialog?.type === "remove") {
                    removeMemberMutation.mutate(confirmDialog.member._id);
                  }
                }}
                disabled={removeMemberMutation.isPending}
                className="h-8 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-2 disabled:opacity-50 text-sm"
              >
                {removeMemberMutation.isPending && (
                  <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
                )}
                <span>
                  {removeMemberMutation.isPending ? "Removing..." : "Remove"}
                </span>
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Join Request Dialog */}
        <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
          <DialogContent className="bg-white border-slate-200 rounded-xl shadow-xl max-w-md">
            <DialogHeader className="pb-3">
              <DialogTitle className="text-lg font-semibold text-slate-900 tracking-tight">
                Send Join Request to User
              </DialogTitle>
              <DialogDescription className="text-slate-600 leading-relaxed mt-1 text-sm">
                Search for a user and select a role to send a join request to join your company.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <label className="block text-slate-700 text-sm font-medium mb-1">Search User</label>
                <input
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchTerm}
                  onChange={e => {
                    setSearchTerm(e.target.value);
                    setSelectedUser(null);
                  }}
                  placeholder="Enter name or email"
                />
                {searchLoading && <div className="text-xs text-slate-500 mt-1">Searching...</div>}
                {searchResults.length > 0 && (
                  <div className="mt-2 max-h-40 overflow-y-auto border border-slate-200 rounded-lg bg-white shadow-sm">
                    {searchResults.map(u => (
                      <div
                        key={u._id}
                        className={`px-3 py-2 cursor-pointer hover:bg-blue-50 ${selectedUser?._id === u._id ? 'bg-blue-100' : ''}`}
                        onClick={() => setSelectedUser(u)}
                      >
                        <div className="font-medium text-slate-800">{u.name}</div>
                        <div className="text-xs text-slate-500">{u.email}</div>
                      </div>
                    ))}
                  </div>
                )}
                {searchTerm && !searchLoading && searchResults.length === 0 && (
                  <div className="text-xs text-slate-500 mt-2">No users found.</div>
                )}
                {selectedUser && (
                  <div className="mt-2 text-xs text-green-700">Selected: {selectedUser.name} ({selectedUser.email})</div>
                )}
              </div>
              <div>
                <label className="block text-slate-700 text-sm font-medium mb-1">Role</label>
                <select
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={selectedRole}
                  onChange={e => setSelectedRole(e.target.value)}
                >
                  <option value="recruiter">Recruiter</option>
                  <option value="admin">Admin</option>
                  <option value="employee">Employee</option>
                </select>
              </div>
            </div>
            <DialogFooter className="pt-4 gap-2">
              <Button
                onClick={() => setJoinDialogOpen(false)}
                className="h-8 px-4 bg-white border border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50 rounded-lg font-medium transition-all duration-200 text-sm"
              >
                Cancel
              </Button>
              <Button
                onClick={() => sendUserJoinRequest.mutate({ userId: selectedUser._id, roleTitle: selectedRole })}
                disabled={!selectedUser || sendUserJoinRequest.isPending}
                className="h-8 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all duration-200 text-sm"
              >
                {sendUserJoinRequest.isPending ? "Sending..." : "Send Request"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default RoleManagement;
