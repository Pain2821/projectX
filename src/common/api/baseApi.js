const RAW_BASE_API_URL = process.env.REACT_APP_BACKEND_BASE_URL || "http://localhost:8080";
const BASE_API_URL = RAW_BASE_API_URL.replace(/\/+$/, "");

export default BASE_API_URL;
