import axios from "axios";

const axiosInstance = axios.create({
    baseURL: process.env.REACT_APP_API_URL || "http://localhost:8000",
    withCredentials: false
});

console.log(process.env.REACT_APP_API_URL);
console.log("Axios instance created with base URL:", axiosInstance.defaults.baseURL);

export default axiosInstance;