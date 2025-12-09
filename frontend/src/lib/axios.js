import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Only clear token and redirect for specific authentication endpoints
      const isAuthEndpoint =
        error.config?.url?.includes("/auth/") ||
        error.config?.url?.includes("/login") ||
        error.config?.url?.includes("/register");

      const isLoginRoute = window.location.pathname.includes("/auth/login");

      // Only logout if it's actually an auth endpoint failure
      if (isAuthEndpoint && !isLoginRoute) {
        
        localStorage.removeItem("token");
        window.location.href = "/auth/login";
      } else {
        // For non-auth endpoints, just log the error but don't logout
        console.warn(
          "401 error on non-auth endpoint:",
          error.config?.url,
          error.response?.data
        );
      }
    }
    return Promise.reject(error);
  }
);

export default api;
