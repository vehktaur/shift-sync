const DEFAULT_BACKEND_API_BASE_URL = "http://localhost:3001/api";
const DEFAULT_PROXY_API_BASE_URL = "/api/proxy";

export const getBackendApiBaseUrl = () =>
  (
    process.env.API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    DEFAULT_BACKEND_API_BASE_URL
  ).replace(/\/$/, "");

export const getApiBaseUrl = () =>
  typeof window === "undefined"
    ? getBackendApiBaseUrl()
    : DEFAULT_PROXY_API_BASE_URL;
