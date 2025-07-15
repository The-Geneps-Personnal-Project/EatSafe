import axios from "axios";

const axiosInstance = axios.create({
    baseURL: process.env.REACT_APP_API_URL || "http://localhost:8000",
    withCredentials: false
});

export default axiosInstance;