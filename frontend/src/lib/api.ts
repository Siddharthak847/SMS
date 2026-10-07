import axios from "axios";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// ---------------------------------------------------------------------------
// Request interceptor – reliably attach the JWT access token.
// Use .set() which works correctly with Axios's AxiosHeaders class.
// ---------------------------------------------------------------------------
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.set("Authorization", `Bearer ${token}`);
    }
  }
  return config;
});

// ---------------------------------------------------------------------------
// Response interceptor – always reject with a real Error object so that
// every catch block in the app can reliably read err.message.
// ---------------------------------------------------------------------------
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      return Promise.reject(
        new Error(
          "Backend server is currently offline or unreachable. Please verify system connections."
        )
      );
    }
    const data = error.response?.data;
    const detail =
      (typeof data === "string" ? data : null) ||
      data?.detail ||
      data?.message ||
      error.message ||
      "An unexpected error occurred.";
    return Promise.reject(
      new Error(typeof detail === "string" ? detail : JSON.stringify(detail))
    );
  }
);
