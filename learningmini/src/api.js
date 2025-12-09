import axios from "axios";

const api = axios.create({
  baseURL: "mysql://root:yyptZbSdCfSkKGpqoKbvVCdyLemKfhHb@shortline.proxy.rlwy.net:57038/railway",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
