import axios from "axios";

import { getApiBaseUrl } from "@/lib/api/base-url";
import type { ApiErrorResponse } from "@/types/auth";

export const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export const getApiErrorMessage = (
  error: unknown,
  fallbackMessage = "Something went wrong.",
) => {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    return error.response?.data?.message ?? fallbackMessage;
  }

  return fallbackMessage;
};
