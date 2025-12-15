import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL || "http://localhost:3000",
  withCredentials: true, // send the httpOnly cookie
});

axiosInstance.interceptors.request.use((config) => {
    const uid = localStorage.getItem("uid");
    if(uid){
      config.headers.Authorization = `Bearer ${uid}`;
    }
    return config;
  },
  (error)=> Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only redirect on 401 for non-auth endpoints to prevent infinite loops
    if (
      error.response?.status === 401 &&
      !error.config?.url?.includes("/auth/")
    ) {
      const url = error.config?.url || "";
      const isAuthRoute = url.includes("/user/login") ||
                    url.includes("/user/signup") ||
                      url.includes("/user/verify");
      if (!isAuthRoute) {
        localStorage.removeItem("uid");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance; 