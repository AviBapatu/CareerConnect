import { Navigate, useLocation } from "react-router-dom";
import useAuthStore from "@/store/userStore";
import LodingScreen from "./LodingScreen";

const AccessControl = ({ children, auth = false, role, companyRole }) => {
  const { user, isInitialized, token } = useAuthStore();
  const location = useLocation();

  // Debug logging for access control
  // 

  // Wait for auth initialization to complete
  if (!isInitialized) {
    // 
    return <LodingScreen />;
  }

  if (auth && !user) {
    // 
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  if (role) {
    const allowedRoles = Array.isArray(role) ? role : [role];
    // 

    if (!allowedRoles.includes(user?.role)) {
      // 
      return <Navigate to="/unauthorized" replace />;
    }
  }

  if (companyRole) {
    const allowedCompanyRoles = Array.isArray(companyRole)
      ? companyRole
      : [companyRole];

    const currentCompanyRole = user?.company?.role;

    // 

    if (
      !currentCompanyRole ||
      !allowedCompanyRoles.includes(currentCompanyRole)
    ) {
      // 
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // 
  return children;
};

export default AccessControl;
