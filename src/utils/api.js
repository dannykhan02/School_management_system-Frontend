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

  // Build the full URL
  let url = `${API_BASE_URL}/${endpoint}`;

  const response = await fetch(url, {
    method,
    headers,
    body: body && method !== "GET" ? (isFormData ? body : JSON.stringify(body)) : null,
  });

  // Try to parse JSON response
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    // Attach status to the error so you can catch validation errors
    const error = new Error(data.message || "API request failed");
    error.status = response.status;
    error.data = data;
    error.response = { data }; // Add this for compatibility with your error handling
    throw error;
  }

  return data;
};