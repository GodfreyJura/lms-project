import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - attach token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      const token = localStorage.getItem("token");

      if (token) {
        // Clear auth data
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        // Redirect to login
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
      }
    }

    if (error.response?.status === 403) {
      console.error("Authorization failed:", error.response.data);
    }

    return Promise.reject(error);
  }
);

export default api;