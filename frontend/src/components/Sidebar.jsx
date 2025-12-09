import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import useAuthStore from "@/store/userStore";
import { useCompanyStore } from "@/store/companyStore";
import { getAvatarBackgroundStyle } from "@/utils/avatarUtils";

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { companyRole, companyId } = useCompanyStore();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isInfoExpanded, setIsInfoExpanded] = useState(false);

  // Debug: Log when user or company data changes to track updates
  useEffect(() => {
    
  }, [user?.avatarUrl, user?.name, companyId, companyRole]);

  // Check if sidebar should be visible
  const shouldShowSidebar = () => {
    // Only show for recruiters
    if (!user || user.role !== "recruiter") return false;

    return true;
  };

  // Check if user has company access
  const hasCompanyAccess = () => {
    
    return (
      companyId &&
      companyRole &&
      (companyRole === "admin" || companyRole === "recruiter")
    );
  };

  const navigationItems = [
    {
      label: "Home",
      path: "/recruiter/dashboard",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-6 h-6 flex-shrink-0"
          fill="currentColor"
          viewBox="0 0 256 256"
        >
          <path d="M218.83,103.77l-80-75.48a1.14,1.14,0,0,1-.11-.11a16,16,0,0,0-21.53,0l-.11.11L37.17,103.77A16,16,0,0,0,32,115.55V208a16,16,0,0,0,16,16H96a16,16,0,0,0,16-16V160h32v48a16,16,0,0,0,16,16h48a16,16,0,0,0,16-16V115.55A16,16,0,0,0,218.83,103.77ZM208,208H160V160a16,16,0,0,0-16-16H112a16,16,0,0,0-16,16v48H48V115.55l.11-.1L128,40l79.9,75.43.11.10Z" />
        </svg>
      ),
    },
    {
      label: "Jobs",
      path: "/jobs",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-6 h-6 flex-shrink-0"
          fill="currentColor"
          viewBox="0 0 256 256"
        >
          <path d="M216,56H176V48a24,24,0,0,0-24-24H104A24,24,0,0,0,80,48v8H40A16,16,0,0,0,24,72V200a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V72A16,16,0,0,0,216,56ZM96,48a8,8,0,0,1,8-8h48a8,8,0,0,1,8,8v8H96ZM216,72v41.61A184,184,0,0,1,128,136a184.07,184.07,0,0,1-88-22.38V72Zm0,128H40V131.64A200.19,200.19,0,0,0,128,152a200.25,200.25,0,0,0,88-20.37V200Z" />
        </svg>
      ),
    },
    {
      label: "Applications",
      path: "/recruiter/applications",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-6 h-6 flex-shrink-0"
          fill="currentColor"
          viewBox="0 0 256 256"
        >
          <path d="M227.31,73.37,182.63,28.69a16,16,0,0,0-22.63,0L36.69,152A15.86,15.86,0,0,0,32,163.31V208a16,16,0,0,0,16,16H92.69A15.86,15.86,0,0,0,104,219.31l83.67-83.66,3.48-3.48h0L227.31,96A16,16,0,0,0,227.31,73.37ZM51.31,160l90.35-90.35,16.68,16.68L68,176.68ZM48,179.31,76.69,208H48Zm48,25.38L79.31,188l90.35-90.35,16.68,16.68Zm101.37-101.37L181.37,87.31l-16.68-16.68L180.69,54.63,201.37,75.31Z" />
        </svg>
      ),
    },
    {
      label: "Explore Companies",
      path: "/recruiter/companies",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-6 h-6 flex-shrink-0"
          fill="currentColor"
          viewBox="0 0 256 256"
        >
          <path d="M184,32H72A16,16,0,0,0,56,48V224a8,8,0,0,0,11.58,7.16L128,200l60.42,31.16A8,8,0,0,0,200,224V48A16,16,0,0,0,184,32ZM184,208.84l-52.42-27.05a8,8,0,0,0-7.16,0L72,208.84V48H184Z" />
        </svg>
      ),
    },
    {
      label: "Join Company",
      path: "/recruiter/join-company",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-6 h-6 flex-shrink-0"
          fill="currentColor"
          viewBox="0 0 256 256"
        >
          <path d="M208,32H184V24a8,8,0,0,0-16,0v8H88V24a8,8,0,0,0-16,0v8H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32ZM72,48v8a8,8,0,0,0,16,0V48h80v8a8,8,0,0,0,16,0V48h24V80H48V48ZM208,208H48V96H208V208Zm-96-88v64a8,8,0,0,1-16,0V132.94l-4.42,2.22a8,8,0,0,1-7.16-14.32l16-8A8,8,0,0,1,112,120Zm59.16,30.45L152,176h16a8,8,0,0,1,0,16H136a8,8,0,0,1-6.4-12.8l28.78-38.37A8,8,0,1,0,145.07,132a8,8,0,1,1-13.85-8A24,24,0,0,1,176,140,23.76,23.76,0,0,1,171.16,150.45Z" />
        </svg>
      ),
      newRecruiterOnly: true,
    },
    {
      label: "Create Company",
      path: "/recruiter/create-company",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-6 h-6 flex-shrink-0"
          fill="currentColor"
          viewBox="0 0 256 256"
        >
          <path d="M208,32H184V24a8,8,0,0,0-16,0v8H88V24a8,8,0,0,0-16,0v8H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32ZM72,48v8a8,8,0,0,0,16,0V48h80v8a8,8,0,0,0,16,0V48h24V80H48V48ZM208,208H48V96H208V208ZM184,136a8,8,0,0,1-8,8H136v40a8,8,0,0,1-16,0V144H80a8,8,0,0,1,0-16h40V88a8,8,0,0,1,16,0v40h40A8,8,0,0,1,184,136Z" />
        </svg>
      ),
      newRecruiterOnly: true,
    },
    {
      label: "Articles",
      path: "/recruiter/articles",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-6 h-6 flex-shrink-0"
          fill="currentColor"
          viewBox="0 0 256 256"
        >
          <path d="M216,40H40A16,16,0,0,0,24,56V200a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40ZM40,56H216V88H40ZM40,200V104H216v96H40Zm32-80a8,8,0,0,1,8-8h96a8,8,0,0,1,0,16H80A8,8,0,0,1,72,120Zm0,32a8,8,0,0,1,8-8h96a8,8,0,0,1,0,16H80A8,8,0,0,1,72,152Z" />
        </svg>
      ),
    },
    {
      label: "Company Settings",
      path: "/recruiter/edit-company",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-6 h-6 flex-shrink-0"
          fill="currentColor"
          viewBox="0 0 256 256"
        >
          <path d="M128,80a48,48,0,1,0,48,48A48.05,48.05,0,0,0,128,80Zm0,80a32,32,0,1,1,32-32A32,32,0,0,1,128,160Zm88-29.84q.06-2.16,0-4.32l14.92-18.64a8,8,0,0,0,1.48-7.06,107.6,107.6,0,0,0-10.88-26.25a8,8,0,0,0-6-3.93l-23.72-2.64q-1.48-1.56-3.12-3.12L186-19.8a8,8,0,0,0-3.93-6,107.6,107.6,0,0,0-26.25-10.87a8,8,0,0,0-7.06,1.49L130.16,40q-2.16-.06-4.32,0L107.2,25.11a8,8,0,0,0-7.06-1.48A107.6,107.6,0,0,0,73.89,34.51a8,8,0,0,0-3.93,6L67.32,64.27q-1.56,1.49-3.12,3.12L40.47,70a8,8,0,0,0-6,3.93,107.6,107.6,0,0,0-10.87,26.25,8,8,0,0,0,1.49,7.06L40,125.84q-.06,2.16,0,4.32L25.11,148.8a8,8,0,0,0-1.48,7.06,107.6,107.6,0,0,0,10.88,26.25,8,8,0,0,0,6,3.93l23.72,2.64q1.49,1.56,3.12,3.12L70,215.53a8,8,0,0,0,3.93,6,107.6,107.6,0,0,0,26.25,10.87,8,8,0,0,0,7.06-1.49L125.84,216q2.16.06,4.32,0l18.64,14.92a8,8,0,0,0,7.06,1.48,107.6,107.6,0,0,0,26.25-10.88,8,8,0,0,0,3.93-6l2.64-23.72q1.56-1.48,3.12-3.12L215.53,186a8,8,0,0,0,6-3.93,107.6,107.6,0,0,0,10.87-26.25,8,8,0,0,0-1.49-7.06ZM128,192a64,64,0,1,1,64-64A64.07,64.07,0,0,1,128,192Z" />
        </svg>
      ),
      adminOnly: true,
    },
    {
      label: "Role Management",
      path: "/recruiter/role-management",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-6 h-6 flex-shrink-0"
          fill="currentColor"
          viewBox="0 0 256 256"
        >
          <path d="M117.25,157.92a60,60,0,1,0-66.5,0A95.83,95.83,0,0,0,3.53,195.63a8,8,0,1,0,13.4,8.74,80,80,0,0,1,134.14,0,8,8,0,0,0,13.4-8.74A95.83,95.83,0,0,0,117.25,157.92ZM40,108a44,44,0,1,1,44,44A44.05,44.05,0,0,1,40,108Zm210.27,98.63a8,8,0,0,1-11.89-10.53,64,64,0,0,0-64.76-64.76,8,8,0,1,1-8.5-13.54,80,80,0,0,1,85.15,88.83Z" />
        </svg>
      ),
    },
    {
      label: "Profile",
      path: "/recruiter/profile",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-6 h-6 flex-shrink-0"
          fill="currentColor"
          viewBox="0 0 256 256"
        >
          <path d="M230.92,212c-15.23-26.33-38.7-45.21-66.09-54.16a72,72,0,1,0-73.66,0C63.78,166.78,40.31,185.66,25.08,212a8,8,0,1,0,13.85,8c18.84-32.56,52.14-52,89.07-52s70.23,19.44,89.07,52a8,8,0,1,0,13.85-8ZM72,96a56,56,0,1,1,56,56A56.06,56.06,0,0,1,72,96Z" />
        </svg>
      ),
    },
    {
      label: "Settings",
      path: "/recruiter/settings",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-6 h-6 flex-shrink-0"
          fill="currentColor"
          viewBox="0 0 256 256"
        >
          <path d="M128,80a48,48,0,1,0,48,48A48.05,48.05,0,0,0,128,80Zm0,80a32,32,0,1,1,32-32A32,32,0,0,1,128,160Zm88-29.84q.06-2.16,0-4.32l14.92-18.64a8,8,0,0,0,1.48-7.06,107.6,107.6,0,0,0-10.88-26.25,8,8,0,0,0-6-3.93l-23.72-2.64q-1.48-1.56-3.12-3.12L186-19.8a8,8,0,0,0-3.93-6,107.6,107.6,0,0,0-26.25-10.87,8,8,0,0,0-7.06,1.49L130.16,40q-2.16-.06-4.32,0L107.2,25.11a8,8,0,0,0-7.06-1.48A107.6,107.6,0,0,0,73.89,34.51a8,8,0,0,0-3.93,6L67.32,64.27q-1.56,1.49-3.12,3.12L40.47,70a8,8,0,0,0-6,3.93,107.6,107.6,0,0,0-10.87,26.25,8,8,0,0,0,1.49,7.06L40,125.84q-.06,2.16,0,4.32L25.11,148.8a8,8,0,0,0-1.48,7.06,107.6,107.6,0,0,0,10.88,26.25,8,8,0,0,0,6,3.93l23.72,2.64q1.49,1.56,3.12,3.12L70,215.53a8,8,0,0,0,3.93,6,107.6,107.6,0,0,0,26.25,10.87,8,8,0,0,0,7.06-1.49L125.84,216q2.16.06,4.32,0l18.64,14.92a8,8,0,0,0,7.06,1.48,107.6,107.6,0,0,0,26.25-10.88,8,8,0,0,0,3.93-6l2.64-23.72q1.56-1.48,3.12-3.12L215.53,186a8,8,0,0,0,6-3.93,107.6,107.6,0,0,0,10.87-26.25,8,8,0,0,0-1.49-7.06ZM128,192a64,64,0,1,1,64-64A64.07,64.07,0,0,1,128,192Z" />
        </svg>
      ),
    },
  ];

  const isActivePath = (path) => {
    return location.pathname === path;
  };

  const handleNavigation = (path) => {
    
    
    navigate(path);
  };

  const handleLogout = () => {
    logout();
    navigate("/auth/login");
  };

  // Don't render sidebar if conditions aren't met
  if (!shouldShowSidebar()) {
    return null;
  }

  // Render different sidebar based on company access
  const renderNavigation = () => {
    if (!hasCompanyAccess()) {
      // Show limited options for new recruiters
      const newRecruiterItems = navigationItems.filter(
        (item) => item.newRecruiterOnly || item.label === "Profile"
      );

      return (
        <div className="flex flex-col gap-2">
          {/* Welcome message for new recruiters */}
          <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
            <h3 className="text-sm font-semibold text-blue-800 mb-1">
              Welcome to CareerConnect
            </h3>
            <p className="text-xs text-blue-600">
              Join or create a company to unlock all features
            </p>
          </div>

          {newRecruiterItems.map((item, index) => (
            <div
              key={index}
              className={`flex items-center gap-3 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors ${
                isActivePath(item.path) ? "bg-[#f0f2f5]" : ""
              } ${isCollapsed ? "justify-center px-2 py-3" : "px-3 py-2"}`}
              onClick={() => handleNavigation(item.path)}
              title={isCollapsed ? item.label : ""}
            >
              {item.icon}
              {!isCollapsed && (
                <p className="text-[#111418] text-sm font-medium">
                  {item.label}
                </p>
              )}
            </div>
          ))}

          {/* Disabled items for new recruiters */}
          <div className="border-t border-gray-200 pt-4 mt-4">
            <p className="text-xs text-gray-500 mb-3 px-3">
              Available after joining a company:
            </p>
            {navigationItems
              .filter(
                (item) =>
                  !item.newRecruiterOnly &&
                  !item.adminOnly &&
                  item.label !== "Profile"
              )
              .map((item, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-3 rounded-lg opacity-50 cursor-not-allowed ${
                    isCollapsed ? "justify-center px-2 py-3" : "px-3 py-2"
                  }`}
                  title={
                    isCollapsed
                      ? `${item.label} (Disabled)`
                      : "Join a company to unlock"
                  }
                >
                  {item.icon}
                  {!isCollapsed && (
                    <p className="text-gray-400 text-sm font-medium">
                      {item.label}
                    </p>
                  )}
                </div>
              ))}
          </div>
        </div>
      );
    }

    // Full navigation for recruiters with company access
    return (
      <div className="flex flex-col gap-2">
        {navigationItems
          .filter((item) => {
            // Hide new recruiter only items for users with company access
            if (item.newRecruiterOnly) return false;
            // Show all items that don't have adminOnly flag
            if (!item.adminOnly) return true;
            // Only show adminOnly items if user has admin role
            return companyRole === "admin";
          })
          .map((item, index) => (
            <div
              key={index}
              className={`flex items-center gap-3 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors ${
                isActivePath(item.path) ? "bg-[#f0f2f5]" : ""
              } ${isCollapsed ? "justify-center px-2 py-3" : "px-3 py-2"}`}
              onClick={() => handleNavigation(item.path)}
              title={isCollapsed ? item.label : ""}
            >
              {item.icon}
              {!isCollapsed && (
                <p className="text-[#111418] text-sm font-medium">
                  {item.label}
                </p>
              )}
            </div>
          ))}
      </div>
    );
  };

  return (
    <div
      className={`flex flex-col gap-4 bg-white p-4 h-screen border-r border-gray-200 transition-all duration-300 ${
        isCollapsed ? "w-16" : "w-80"
      }`}
    >
      <div className="flex-1">
        {/* Profile Section */}
        <div
          className={`flex gap-3 mb-4 ${isCollapsed ? "justify-center" : ""}`}
        >
          <div
            className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 flex-shrink-0"
            style={getAvatarBackgroundStyle(user.avatarUrl)}
          />
          {!isCollapsed && (
            <div className="flex flex-col">
              <h1 className="text-[#111418] text-base font-medium leading-normal">
                {user.name}
              </h1>
              <p className="text-xs text-gray-500 capitalize">
                {hasCompanyAccess()
                  ? `${companyRole} • ${user.role}`
                  : `New ${user.role}`}
              </p>
            </div>
          )}
        </div>

        {/* Navigation Links */}
        {renderNavigation()}
      </div>

      {/* Toggle and Logout Buttons */}
      <div className="border-t border-gray-200 pt-4">
        {/* Toggle Button */}
        <div
          className={`flex items-center gap-3 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors text-gray-600 ${
            isCollapsed ? "justify-center px-2 py-3" : "px-3 py-2"
          }`}
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`w-6 h-6 flex-shrink-0 transition-transform duration-300 ${
              isCollapsed ? "rotate-180" : ""
            }`}
            fill="currentColor"
            viewBox="0 0 256 256"
          >
            <path d="M181.66,133.66l-80,80a8,8,0,0,1-11.32-11.32L164.69,128,90.34,53.66a8,8,0,0,1,11.32-11.32l80,80A8,8,0,0,1,181.66,133.66Z" />
          </svg>
          {!isCollapsed && <p className="text-sm font-medium">Collapse</p>}
        </div>

        {/* Logout Button */}
        <div className="mt-2">
          <div
            className={`flex items-center gap-3 hover:bg-red-50 hover:text-red-600 rounded-lg cursor-pointer transition-colors text-gray-600 ${
              isCollapsed ? "justify-center px-2 py-3" : "px-3 py-2"
            }`}
            onClick={handleLogout}
            title={isCollapsed ? "Logout" : ""}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-6 h-6 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 256 256"
            >
              <path d="M112,216a8,8,0,0,1-8,8H48a16,16,0,0,1-16-16V48A16,16,0,0,1,48,32h56a8,8,0,0,1,0,16H48V208h56A8,8,0,0,1,112,216Zm109.66-93.66-40-40a8,8,0,0,0-11.32,11.32L196.69,120H104a8,8,0,0,0,0,16h92.69l-26.35,26.34a8,8,0,0,0,11.32,11.32l40-40A8,8,0,0,0,221.66,122.34Z" />
            </svg>
            {!isCollapsed && <p className="text-sm font-medium">Logout</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
