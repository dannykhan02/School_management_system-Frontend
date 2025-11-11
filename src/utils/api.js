// src/utils/api.js
export const API_BASE_URL = "http://127.0.0.1:8000/api";

export const apiRequest = async (endpoint, method = "GET", body = null) => {
  const token = localStorage.getItem("auth_token");

  const isFormData = body instanceof FormData;

  const headers = {
    Accept: "application/json",
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
    method,
    headers,
    body: body && method !== "GET" ? (isFormData ? body : JSON.stringify(body)) : null,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    // Attach status to the error so you can catch validation errors
    const error = new Error(data.message || "API request failed");
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
};
