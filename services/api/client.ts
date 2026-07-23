import axios, { AxiosError, AxiosRequestConfig } from "axios";

// Base URL for API calls — relative on the client (same-origin, so the
// browser attaches the NextAuth session cookie automatically — no bearer
// token to inject here), absolute when called from the server (RSC/route
// handlers), since there's no relative host to resolve against there.
function getBaseUrl() {
  if (typeof window !== "undefined") return "";
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

export class ApiError extends Error {
  status?: number;
  details?: unknown;

  constructor(message: string, status?: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

type ErrorPayload = { error?: string; message?: string; details?: unknown };

const instance = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    // Deliberately no default Content-Type here: axios already JSON-encodes
    // plain object bodies (and sets Content-Type: application/json) on its
    // own, and leaves FormData bodies alone so the browser can set the
    // correct multipart boundary. Forcing application/json at the instance
    // level would break every multipart upload (see uploadApi).
    Accept: "application/json",
  },
});

// Normalizes every failed request into one error shape, so callers can
// always do `catch (err) { toast.error(err instanceof Error ? err.message : "...") }`
// instead of re-deriving the error message from a raw response each time.
instance.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ErrorPayload>) => {
    const status = error.response?.status;
    const payload = error.response?.data;
    const message = payload?.error || payload?.message || error.message || "Request failed";
    return Promise.reject(new ApiError(message, status, payload?.details ?? payload));
  }
);

async function get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const res = await instance.get<T>(url, config);
  return res.data;
}

async function post<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const res = await instance.post<T>(url, body, config);
  return res.data;
}

async function put<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const res = await instance.put<T>(url, body, config);
  return res.data;
}

async function patch<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const res = await instance.patch<T>(url, body, config);
  return res.data;
}

async function del<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const res = await instance.delete<T>(url, config);
  return res.data;
}

export const apiClient = { get, post, put, patch, delete: del, instance };
