import axios from "axios";

const apiClient = axios.create({
  // Use Railway's URL if it exists, otherwise fall back to localhost for local testing
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1",
});

// 1. Inject token into every outbound request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 2. Catch inbound 401 Unauthorized errors and force logout
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn("Token expired or invalid. Logging out...");
      localStorage.removeItem("token");
      window.location.reload(); // Instantly boots the user to the Login screen
    }
    return Promise.reject(error);
  },
);

// Export exactly ONCE at the very end
export default apiClient;
