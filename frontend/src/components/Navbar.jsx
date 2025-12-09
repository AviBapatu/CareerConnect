import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import useAuthStore from "@/store/userStore";
import { useCompanyStore } from "@/store/companyStore";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { LogOut, User, Bell, Settings as SettingsIcon, Check, X } from "lucide-react";
import { getAvatarBackgroundStyle } from "@/utils/avatarUtils";
import { useQuery } from "@tanstack/react-query";
import { getMyJoinRequestStatus, respondToCompanyJoinRequest } from "@/api/companyApi";

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { companyRole } = useCompanyStore();

  // Fetch company join requests for notification icon
  const { data: joinRequests = [], isLoading: loadingRequests, refetch: refetchRequests } = useQuery({
    queryKey: ["myCompanyJoinRequests"],
    queryFn: getMyJoinRequestStatus,
    enabled: !!user,
  });

  const [processingRequests, setProcessingRequests] = React.useState(new Set());

  const handleAcceptRequest = async (companyId) => {
    setProcessingRequests(prev => new Set(prev).add(companyId));
    try {
      await respondToCompanyJoinRequest(companyId, "accepted");
      refetchRequests();
      // You can add a toast notification here if you have a toast system
      
      
      // Reload the page to update the interface
      window.location.reload();
    } catch (error) {
      console.error("Error accepting request:", error);
      // You can add error toast notification here
    } finally {
      setProcessingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(companyId);
        return newSet;
      });
    }
  };

  const handleRejectRequest = async (companyId) => {
    setProcessingRequests(prev => new Set(prev).add(companyId));
    try {
      await respondToCompanyJoinRequest(companyId, "rejected");
      refetchRequests();
      // You can add a toast notification here if you have a toast system
      
      
      // Reload the page to update the interface
      window.location.reload();
    } catch (error) {
      console.error("Error rejecting request:", error);
      // You can add error toast notification here
    } finally {
      setProcessingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(companyId);
        return newSet;
      });
    }
  };

  // Check if we should show the navbar
  const shouldShowNavbar = () => {
    const isAuthPage = location.pathname.startsWith("/auth/");
    const isPublicPage = ["/about", "/contact", "/features"].includes(
      location.pathname
    );

    // Show navbar on auth pages, public pages, and homepage for unauthenticated users
    if (isAuthPage || isPublicPage || (!user && location.pathname === "/"))
      return true;

    if (!user) return false;

    // Show for candidates
    if (user.role === "candidate") return true;

    // Show for recruiters with employee role in company
    if (user.role === "recruiter" && companyRole === "employee") return true;

    return false;
  };

  const handleLogout = () => {
    logout();
    navigate("/auth/login");
  };

  const getNavigationItems = () => {
    const isAuthPage = location.pathname.startsWith("/auth/");
    const isPublicPage = ["/about", "/contact", "/features"].includes(
      location.pathname
    );

    // Show public navigation for auth pages, public pages, and homepage when not logged in
    if (isAuthPage || ((isPublicPage || location.pathname === "/") && !user)) {
      return [
        { label: "Home", href: "/" },
        { label: "About", href: "/about" },
        { label: "Features", href: "/features" },
        { label: "Contact", href: "/contact" },
      ];
    }

    // Navigation items for authenticated users
    if (user?.role === "candidate") {
      return [
        { label: "Home", href: "/candidate/home" },
        { label: "Jobs", href: "/candidate/jobs" },
        { label: "Companies", href: "/candidate/companies" },
        { label: "Career Advice", href: "/candidate/articles" },
        { label: "Applications", href: "/candidate/applications" },
      ];
    }

    if (user?.role === "recruiter" && companyRole === "employee") {
      return [
        { label: "Dashboard", href: "/recruiter/dashboard" },
        { label: "Jobs", href: "/jobs" },
        { label: "Companies", href: "/recruiter/companies" },
        { label: "Articles", href: "/recruiter/articles" },
        { label: "Profile", href: "/recruiter/profile" },
      ];
    }

    return [];
  };

  if (!shouldShowNavbar()) {
    return null;
  }

  const navigationItems = getNavigationItems();
  const isAuthPage = location.pathname.startsWith("/auth/");

  return (
    <header
      className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200/60 shadow-sm"
      style={{ fontFamily: '"Inter", "SF Pro Display", system-ui, sans-serif' }}
    >
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo Section */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center shadow-sm">
              <svg
                viewBox="0 0 48 48"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5 text-white"
              >
                <path
                  d="M36.7273 44C33.9891 44 31.6043 39.8386 30.3636 33.69C29.123 39.8386 26.7382 44 24 44C21.2618 44 18.877 39.8386 17.6364 33.69C16.3957 39.8386 14.0109 44 11.2727 44C7.25611 44 4 35.0457 4 24C4 12.9543 7.25611 4 11.2727 4C14.0109 4 16.3957 8.16144 17.6364 14.31C18.877 8.16144 21.2618 4 24 4C26.7382 4 29.123 8.16144 30.3636 14.31C31.6043 8.16144 33.9891 4 36.7273 4C40.7439 4 44 12.9543 44 24C44 35.0457 40.7439 44 36.7273 44Z"
                  fill="currentColor"
                />
              </svg>
            </div>
            <Link
              to="/"
              className="text-slate-900 text-xl font-bold tracking-tight hover:text-slate-700 transition-colors duration-200"
            >
              CareerConnect
            </Link>
          </div>

          {/* Navigation Items and User Profile Section */}
          <div className="flex items-center gap-6">
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navigationItems.map((item, index) => (
                <Link
                  key={index}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    location.pathname === item.href
                      ? "bg-slate-100 text-slate-900 shadow-sm"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                  to={item.href}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Mobile Navigation - Hamburger Menu */}
            <nav className="md:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-10 w-10 p-0 hover:bg-slate-100"
                  >
                    <svg
                      className="h-6 w-6 text-slate-600"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path d="M4 6h16M4 12h16M4 18h16"></path>
                    </svg>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-56 bg-white/95 backdrop-blur-md border-slate-200/60 shadow-xl rounded-xl p-2"
                >
                  {navigationItems.map((item, index) => (
                    <DropdownMenuItem
                      key={index}
                      onClick={() => navigate(item.href)}
                      className={`flex items-center px-3 py-3 rounded-lg transition-colors duration-200 cursor-pointer ${
                        location.pathname === item.href
                          ? "bg-slate-100 text-slate-900"
                          : "hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      <span className="text-sm font-medium">{item.label}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </nav>

            <div className="flex items-center">
              {/* Notification Bell Icon for Company Join Requests */}
              {user && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <div className="relative cursor-pointer mr-4 pr-2">
                      {" "}
                      {/* Increased right margin and added padding-right */}
                      <Bell className="w-6 h-6 text-slate-600 hover:text-slate-900 transition-colors duration-200" />
                      {joinRequests?.filter((r) => r.status === "pending")
                        .length > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] h-[18px] flex items-center justify-center font-bold">
                          {
                            joinRequests.filter((r) => r.status === "pending")
                              .length
                          }
                        </span>
                      )}
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-80 bg-white/95 backdrop-blur-md border-slate-200/60 shadow-xl rounded-xl p-2"
                  >
                    <div className="px-3 py-2 border-b border-slate-200/60 font-semibold text-slate-900 text-base">
                      Company Join Requests
                    </div>
                    {loadingRequests ? (
                      <div className="py-6 text-center text-slate-500 text-sm">
                        Loading...
                      </div>
                    ) : joinRequests?.filter((r) => r.status === "pending")
                        .length === 0 ? (
                      <div className="py-6 text-center text-slate-500 text-sm">
                        No pending requests
                      </div>
                    ) : (
                      joinRequests
                        .filter((r) => r.status === "pending")
                        .map((req, idx) => (
                          <div
                            key={req._id || idx}
                            className="flex items-center justify-between gap-2 px-3 py-2 hover:bg-slate-50 rounded-lg transition-all duration-200"
                          >
                            <div>
                              <div className="font-medium text-slate-800">
                                {req.company?.name || "Unknown Company"}
                              </div>
                              <div className="text-xs text-slate-500">
                                Role: {req.roleTitle}
                              </div>
                            </div>
                            {user.role === "candidate" ? (
                              <div className="flex gap-1">
                                <button
                                  onClick={() => handleAcceptRequest(req.company._id)}
                                  disabled={processingRequests.has(req.company._id)}
                                  className="px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 hover:border-emerald-300 rounded-md font-medium text-xs transition-all duration-200 shadow-none hover:shadow-sm flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <Check className="w-3 h-3" />
                                  {processingRequests.has(req.company._id) ? "Processing..." : "Accept"}
                                </button>
                                <button
                                  onClick={() => handleRejectRequest(req.company._id)}
                                  disabled={processingRequests.has(req.company._id)}
                                  className="px-2 py-1 bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 hover:border-red-300 rounded-md font-medium text-xs transition-all duration-200 shadow-none hover:shadow-sm flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <X className="w-3 h-3" />
                                  {processingRequests.has(req.company._id) ? "Processing..." : "Reject"}
                                </button>
                              </div>
                            ) : (
                              <Link
                                to="/profile"
                                className="ml-2 text-blue-600 hover:underline text-xs font-semibold"
                              >
                                View
                              </Link>
                            )}
                          </div>
                        ))
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              {isAuthPage ||
              (!user &&
                ["/about", "/contact", "/features", "/"].includes(
                  location.pathname
                )) ? (
                // Show login/signup buttons on auth pages, public pages, and homepage when not logged in
                <div className="flex items-center gap-2 sm:gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate("/auth/login")}
                    className={`h-9 px-3 sm:px-4 rounded-lg font-medium text-sm transition-all duration-200 ${
                      location.pathname === "/auth/login"
                        ? "bg-slate-100 text-slate-900"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    }`}
                  >
                    Login
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => navigate("/auth/signup")}
                    className="h-9 px-3 sm:px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium text-sm shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    Sign Up
                  </Button>
                </div>
              ) : user ? (
                // Show user profile dropdown for authenticated users
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <div className="group relative">
                      <div
                        className="w-10 h-10 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-slate-300 hover:ring-offset-2 transition-all duration-200 shadow-sm group-hover:shadow-md"
                        style={
                          user.avatarUrl
                            ? {
                                backgroundImage: `url(${user.avatarUrl})`,
                                backgroundSize: "cover",
                                backgroundPosition: "center",
                              }
                            : {}
                        }
                      >
                        {!user.avatarUrl && (
                          <span className="text-white font-semibold text-sm">
                            {user.firstName?.[0] || user.name?.[0] || "U"}
                          </span>
                        )}
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-64 bg-white/95 backdrop-blur-md border-slate-200/60 shadow-xl rounded-xl p-2"
                  >
                    <div className="px-3 py-3 border-b border-slate-200/60">
                      <p className="text-sm font-semibold text-slate-900 tracking-tight">
                        {user.firstName && user.lastName
                          ? `${user.firstName} ${user.lastName}`
                          : user.name || "User"}
                      </p>
                      <p className="text-xs text-slate-500 font-light mt-0.5">
                        {user.email}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-slate-100 text-slate-700 rounded-md text-xs font-medium">
                          <div className="w-1.5 h-1.5 bg-slate-400 rounded-full"></div>
                          {user.role}
                        </div>
                        {companyRole && (
                          <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-medium">
                            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                            {companyRole}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="py-1">
                      <DropdownMenuItem
                        onClick={() =>
                          navigate(
                            user.role === "candidate"
                              ? "/candidate/profile"
                              : "/recruiter/profile"
                          )
                        }
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-100 transition-colors duration-200 cursor-pointer"
                      >
                        <User className="w-4 h-4 text-slate-500" />
                        <span className="text-sm font-medium text-slate-700">
                          Profile
                        </span>
                      </DropdownMenuItem>
                      {/* Settings for candidate, similar to recruiter sidebar */}
                      {user.role === "candidate" && (
                        <DropdownMenuItem
                          onClick={() => navigate("/candidate/settings")}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-100 transition-colors duration-200 cursor-pointer"
                        >
                          <SettingsIcon className="w-4 h-4 text-slate-500" />
                          <span className="text-sm font-medium text-slate-700">
                            Settings
                          </span>
                        </DropdownMenuItem>
                      )}
                    </div>
                    <DropdownMenuSeparator className="bg-slate-200/60" />
                    <div className="py-1">
                      <DropdownMenuItem
                        onClick={() => navigate("/about")}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-100 transition-colors duration-200 cursor-pointer"
                      >
                        <span className="text-sm font-medium text-slate-700">
                          About
                        </span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => navigate("/features")}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-100 transition-colors duration-200 cursor-pointer"
                      >
                        <span className="text-sm font-medium text-slate-700">
                          Features
                        </span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => navigate("/contact")}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-100 transition-colors duration-200 cursor-pointer"
                      >
                        <span className="text-sm font-medium text-slate-700">
                          Contact
                        </span>
                      </DropdownMenuItem>
                    </div>
                    {/* Hide auto send updates for candidate */}
                    {user.role !== "candidate" && (
                      <div className="py-1">
                        {/* Example: Auto send updates toggle or menu item for non-candidates */}
                        {/* <DropdownMenuItem>Auto Send Updates</DropdownMenuItem> */}
                      </div>
                    )}
                    <div className="border-t border-slate-200/60 pt-1">
                      <DropdownMenuItem
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-red-50 transition-colors duration-200 cursor-pointer group"
                      >
                        <LogOut className="w-4 h-4 text-slate-500 group-hover:text-red-600" />
                        <span className="text-sm font-medium text-slate-700 group-hover:text-red-600">
                          Logout
                        </span>
                      </DropdownMenuItem>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;