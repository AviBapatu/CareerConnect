import { Routes, Route, Navigate } from "react-router-dom";
import Login from "../pages/auth/Login";
import Signup from "../pages/auth/Signup";
import ForgotPassword from "../pages/auth/ForgotPassword";
import ResetPassword from "../pages/auth/ResetPassword";
import CompanyChoice from "../pages/recruiter/CompanyChoice";
import LoadingScreen from "../components/LodingScreen";
import { useInitializeAuth } from "../hooks/useInitializeAuth";
import AccessControl from "../components/AccessControl";
import CreateCompany from "../pages/recruiter/CreateCompany";
import JoinCompany from "../pages/recruiter/JoinCompany";
import AuthGuard from "../components/AuthGuard";
import CandidateHomePage from "../pages/candidate/CandidateHomePage";
import JobSearchPage from "../pages/candidate/JobSearchPage";
import JobDetailPage from "../pages/candidate/JobDetailPage";
import ProfilePage from "../pages/shared/ProfilePage";
import CandidateLayout from "../layouts/CandidateLayout";
import SmartLayoutWrapper from "../components/SmartLayoutWrapper";
import useAuthStore from "../store/userStore";
import { useCompanyStore } from "../store/companyStore";
import EditProfilePage from "../pages/shared/EditProfilePage";
import JobsDashboard from "../pages/recruiter/JobsDashboard";
import ApplicationsDashboard from "../pages/recruiter/ApplicationsDashboard";
import ApplicantProfile from "../pages/recruiter/ApplicantProfile";
import PostJob from "../pages/recruiter/PostJob";
import RecruiterJobDetailPage from "../pages/recruiter/RecruiterJobDetailPage";
import MyApplicationsPage from "../pages/candidate/MyApplicationsPage";
import ExploreCompanies from "../pages/recruiter/ExploreCompanies";
import CandidateExploreCompanies from "../pages/candidate/ExploreCompanies";
import CompanyDetails from "../pages/recruiter/CompanyDetails";
import CompanyJobs from "../pages/recruiter/CompanyJobs";
import CandidateCompanyJobs from "../pages/candidate/CompanyJobs";
import ArticlesPage from "../pages/shared/ArticlesPage";
import CreateArticle from "../pages/recruiter/CreateArticle";
import ArticleDetails from "../pages/shared/ArticleDetails";
import MyArticles from "../pages/recruiter/MyArticles";
import EditArticle from "../pages/recruiter/EditArticle";
import EditCompanyDetails from "../pages/recruiter/EditCompanyDetails";
import RoleManagement from "../pages/recruiter/RoleManagement";
import RecruiterHomepage from "../pages/recruiter/RecruiterHomepage";
import AuthLayout from "../layouts/AuthLayout";
import AboutPage from "../pages/shared/AboutPage";
import ContactPage from "../pages/shared/ContactPage";
import FeaturesPage from "../pages/shared/FeaturesPage";
import PublicPageWrapper from "../components/PublicPageWrapper";
import NotFound from "../pages/shared/NotFound";
import SettingsPage from "../pages/shared/SettingsPage";
import Unauthorized from "../pages/shared/Unauthorized";
import HomePage from "../pages/shared/HomePage";
import Navbar from "../components/Navbar";

const AppRouter = () => {
  const { loading } = useInitializeAuth();

  

  if (loading) {
    
    return <LoadingScreen />;
  }

  
  return (
    <Routes>
      {/* Public Auth Routes - redirect to dashboard if already logged in */}
      <Route
        path="/auth/login"
        element={
          <AuthGuard requireAuth={false} redirectTo="/dashboard">
            <AuthLayout>
              <Login />
            </AuthLayout>
          </AuthGuard>
        }
      />
      <Route
        path="/auth/signup"
        element={
          <AuthGuard requireAuth={false} redirectTo="/dashboard">
            <AuthLayout>
              <Signup />
            </AuthLayout>
          </AuthGuard>
        }
      />
      <Route
        path="/auth/forgot-password"
        element={
          <AuthGuard requireAuth={false} redirectTo="/dashboard">
            <AuthLayout>
              <ForgotPassword />
            </AuthLayout>
          </AuthGuard>
        }
      />
      <Route
        path="/auth/reset-password/:token/:id"
        element={
          <AuthGuard requireAuth={false} redirectTo="/dashboard">
            <AuthLayout>
              <ResetPassword />
            </AuthLayout>
          </AuthGuard>
        }
      />

      {/* Public Pages */}
      <Route
        path="/about"
        element={
          <PublicPageWrapper>
            <AboutPage />
          </PublicPageWrapper>
        }
      />
      <Route
        path="/contact"
        element={
          <PublicPageWrapper>
            <ContactPage />
          </PublicPageWrapper>
        }
      />
      <Route
        path="/features"
        element={
          <PublicPageWrapper>
            <FeaturesPage />
          </PublicPageWrapper>
        }
      />
      <Route
        path="/"
        element={
          <PublicPageWrapper>
            <HomePage />
          </PublicPageWrapper>
        }
      />

      {/* Legacy routes - redirect to new auth routes */}
      <Route path="/login" element={<Navigate to="/auth/login" replace />} />
      <Route path="/signup" element={<Navigate to="/auth/signup" replace />} />

      {/* Protected Routes */}

      <Route
        path="/recruiter/company-choice"
        element={
          <AccessControl auth={true} role="recruiter">
            <SmartLayoutWrapper>
              <CompanyChoice />
            </SmartLayoutWrapper>
          </AccessControl>
        }
      />

      <Route
        path="/recruiter/create-company"
        element={
          <AccessControl auth={true} role="recruiter">
            <SmartLayoutWrapper>
              <CreateCompany />
            </SmartLayoutWrapper>
          </AccessControl>
        }
      />

      <Route
        path="/recruiter/join-company"
        element={
          <AccessControl auth={true} role="recruiter">
            <SmartLayoutWrapper>
              <JoinCompany />
            </SmartLayoutWrapper>
          </AccessControl>
        }
      />

      <Route
        path="/recruiter/dashboard"
        element={
          <AccessControl auth={true} role="recruiter">
            <SmartLayoutWrapper>
              <RecruiterDashboardWrapper />
            </SmartLayoutWrapper>
          </AccessControl>
        }
      />

      {/* Recruiter Homepage */}
      <Route
        path="/recruiter/home"
        element={
          <AccessControl auth={true} role="recruiter">
            <SmartLayoutWrapper>
              <RecruiterHomepage />
            </SmartLayoutWrapper>
          </AccessControl>
        }
      />

      {/* Candidate Routes */}
      <Route
        path="/candidate/home"
        element={
          <AccessControl auth={true} role="candidate">
            <CandidateLayout>
              <CandidateHomePage />
            </CandidateLayout>
          </AccessControl>
        }
      />

      <Route
        path="/candidate/jobs"
        element={
          <AccessControl auth={true} role="candidate">
            <CandidateLayout>
              <JobSearchPage />
            </CandidateLayout>
          </AccessControl>
        }
      />

      <Route
        path="/candidate/applications"
        element={
          <AccessControl auth={true} role="candidate">
            <CandidateLayout>
              <MyApplicationsPage />
            </CandidateLayout>
          </AccessControl>
        }
      />

      <Route
        path="/candidate/companies"
        element={
          <AccessControl auth={true} role="candidate">
            <CandidateExploreCompanies />
          </AccessControl>
        }
      />

      <Route
        path="/candidate/company/:companyId"
        element={
          <AccessControl auth={true} role="candidate">
            <CandidateLayout>
              <CompanyDetails />
            </CandidateLayout>
          </AccessControl>
        }
      />

      <Route
        path="/candidate/company/:companyId/jobs"
        element={
          <AccessControl auth={true} role="candidate">
            <CandidateLayout>
              <CandidateCompanyJobs />
            </CandidateLayout>
          </AccessControl>
        }
      />

      {/* Job Detail Route - Available to candidates */}
      <Route
        path="/job/:jobId"
        element={
          <AccessControl auth={true} role="candidate">
            <CandidateLayout>
              <JobDetailPage />
            </CandidateLayout>
          </AccessControl>
        }
      />

      {/* Jobs Routes - Available to both candidates and recruiters */}
      <Route
        path="/jobs"
        element={
          <AccessControl auth={true}>
            <SmartLayoutWrapper>
              <JobsDashboard />
            </SmartLayoutWrapper>
          </AccessControl>
        }
      />

      {/* Applications Dashboard - Only for recruiters */}
      <Route
        path="/recruiter/applications"
        element={
          <AccessControl auth={true} role="recruiter">
            <SmartLayoutWrapper requiresRecruiterRole={true}>
              <ApplicationsDashboard />
            </SmartLayoutWrapper>
          </AccessControl>
        }
      />

      {/* Articles - Recruiter */}
      <Route
        path="/recruiter/articles"
        element={
          <AccessControl auth={true} role="recruiter">
            <SmartLayoutWrapper>
              <ArticlesPage />
            </SmartLayoutWrapper>
          </AccessControl>
        }
      />

      {/* Create Article - Recruiter */}
      <Route
        path="/recruiter/articles/create"
        element={
          <AccessControl auth={true} role="recruiter">
            <SmartLayoutWrapper>
              <CreateArticle />
            </SmartLayoutWrapper>
          </AccessControl>
        }
      />

      {/* My Articles - Recruiter */}
      <Route
        path="/recruiter/my-articles"
        element={
          <AccessControl auth={true} role="recruiter">
            <SmartLayoutWrapper>
              <MyArticles />
            </SmartLayoutWrapper>
          </AccessControl>
        }
      />

      {/* Edit Article - Recruiter */}
      <Route
        path="/recruiter/articles/edit/:articleId"
        element={
          <AccessControl auth={true} role="recruiter">
            <SmartLayoutWrapper>
              <EditArticle />
            </SmartLayoutWrapper>
          </AccessControl>
        }
      />

      {/* Article Details - Recruiter */}
      <Route
        path="/recruiter/articles/:articleId"
        element={
          <AccessControl auth={true} role="recruiter">
            <SmartLayoutWrapper>
              <ArticleDetails />
            </SmartLayoutWrapper>
          </AccessControl>
        }
      />

      {/* Articles - Candidate */}
      <Route
        path="/candidate/articles"
        element={
          <AccessControl auth={true} role="candidate">
            <CandidateLayout>
              <ArticlesPage />
            </CandidateLayout>
          </AccessControl>
        }
      />

      {/* Article Details - Candidate */}
      <Route
        path="/candidate/articles/:articleId"
        element={
          <AccessControl auth={true} role="candidate">
            <CandidateLayout>
              <ArticleDetails />
            </CandidateLayout>
          </AccessControl>
        }
      />

      {/* Applicant Profile - Only for recruiters */}
      <Route
        path="/recruiter/applicant/:userId"
        element={
          <AccessControl auth={true} role="recruiter">
            <ApplicantProfile />
          </AccessControl>
        }
      />

      {/* Post Job Route - Only for recruiters */}
      <Route
        path="/recruiter/post-job"
        element={
          <AccessControl auth={true} role="recruiter">
            <SmartLayoutWrapper requiresRecruiterRole={true}>
              <PostJob />
            </SmartLayoutWrapper>
          </AccessControl>
        }
      />

      {/* Edit Job Route - Only for recruiters */}
      <Route
        path="/recruiter/edit-job/:jobId"
        element={
          <AccessControl auth={true} role="recruiter">
            <PostJob />
          </AccessControl>
        }
      />

      {/* View Job Details Route - Only for recruiters */}
      <Route
        path="/recruiter/job/:jobId"
        element={
          <AccessControl auth={true} role="recruiter">
            <SmartLayoutWrapper>
              <RecruiterJobDetailPage />
            </SmartLayoutWrapper>
          </AccessControl>
        }
      />

      {/* Explore Companies Route - Only for recruiters */}
      <Route
        path="/recruiter/companies"
        element={
          <AccessControl auth={true} role="recruiter">
            <SmartLayoutWrapper>
              <ExploreCompanies />
            </SmartLayoutWrapper>
          </AccessControl>
        }
      />

      {/* Company Details Route - Only for recruiters */}
      <Route
        path="/recruiter/company/:companyId"
        element={
          <AccessControl auth={true} role="recruiter">
            <SmartLayoutWrapper>
              <CompanyDetails />
            </SmartLayoutWrapper>
          </AccessControl>
        }
      />

      {/* Company Jobs Route - Only for recruiters */}
      <Route
        path="/recruiter/company/:companyId/jobs"
        element={
          <AccessControl auth={true} role="recruiter">
            <SmartLayoutWrapper>
              <CompanyJobs />
            </SmartLayoutWrapper>
          </AccessControl>
        }
      />

      {/* Edit Company Details Route - Only for recruiters */}
      <Route
        path="/recruiter/company/:companyId/edit"
        element={
          <AccessControl auth={true} role="recruiter">
            <EditCompanyDetails />
          </AccessControl>
        }
      />

      <Route
        path="/recruiter/edit-company"
        element={
          <AccessControl auth={true} role="recruiter">
            <SmartLayoutWrapper requiresRecruiterRole={true}>
              <EditCompanyDetails />
            </SmartLayoutWrapper>
          </AccessControl>
        }
      />

      <Route
        path="/recruiter/role-management"
        element={
          <AccessControl auth={true} role="recruiter">
            <SmartLayoutWrapper requiresRecruiterRole={true}>
              <RoleManagement />
            </SmartLayoutWrapper>
          </AccessControl>
        }
      />

      {/* Settings - Recruiter */}
      <Route
        path="/recruiter/settings"
        element={
          <AccessControl auth={true} role="recruiter">
            <SmartLayoutWrapper>
              <SettingsPage />
            </SmartLayoutWrapper>
          </AccessControl>
        }
      />

      {/* Settings - Candidate */}
      <Route
        path="/candidate/settings"
        element={
          <AccessControl auth={true} role="candidate">
            <CandidateLayout>
              <SettingsPage />
            </CandidateLayout>
          </AccessControl>
        }
      />

      {/* Profile Routes */}
      <Route
        path="/profile"
        element={
          <AccessControl auth={true}>
            <SmartLayoutWrapper>
              <ProfilePage />
            </SmartLayoutWrapper>
          </AccessControl>
        }
      />
      <Route
        path="/profile/edit"
        element={
          <AccessControl auth={true}>
            <SmartLayoutWrapper>
              <EditProfilePage />
            </SmartLayoutWrapper>
          </AccessControl>
        }
      />

      <Route
        path="/recruiter/profile"
        element={
          <AccessControl auth={true} role="recruiter">
            <SmartLayoutWrapper>
              <ProfilePage />
            </SmartLayoutWrapper>
          </AccessControl>
        }
      />

      <Route
        path="/candidate/profile"
        element={
          <AccessControl auth={true} role="candidate">
            <CandidateLayout>
              <ProfilePage />
            </CandidateLayout>
          </AccessControl>
        }
      />

      {/* Dashboard Route - redirect based on role */}
      <Route
        path="/dashboard"
        element={
          <AccessControl auth={true}>
            <DashboardWrapper />
          </AccessControl>
        }
      />

      {/* Home Page Route */}
      <Route
        path="/"
        element={
          <>
            <Navbar />
            <HomePage />
          </>
        }
      />

      {/* Unauthorized Route */}
      <Route
        path="/"
        element={
          <>
            <Navbar />
            <HomePage />
          </>
        }
      />

      {/* Unauthorized Route */}
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Default redirects */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const DashboardWrapper = () => {
  const user = useAuthStore((s) => s.user);

  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  // Redirect based on user role
  if (user.role === "recruiter") {
    return <Navigate to="/recruiter/dashboard" replace />;
  } else if (user.role === "candidate") {
    return <Navigate to="/candidate/home" replace />;
  }

  // Fallback
  return <Navigate to="/auth/login" replace />;
};

const RecruiterDashboardWrapper = () => {
  const user = useAuthStore((s) => s.user);
  const { companyId } = useCompanyStore();

  const hasCompany = companyId || user?.company;

  if (!hasCompany) {
    return <Navigate to="/recruiter/company-choice" replace />;
  }

  // If user has company but store doesn't have it, update the store
  if (user?.company && !companyId) {
    useCompanyStore.getState().setCompanyData(user.company, user.companyRole);
  }

  return <RecruiterHomepage />;
};

export default AppRouter;
