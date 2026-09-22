import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export async function registerUser(name, email, password) {
  const response = await axios.post(
    `${API_BASE_URL}/auth/register`,
    {
      name,
      email,
      password,
    }
  );

  return response.data;
}

export async function loginUser(email, password) {
  const response = await axios.post(
    `${API_BASE_URL}/auth/login`,
    {
      email,
      password,
    }
  );

  return response.data;
}

export async function getCurrentUser(token) {
  const response = await axios.get(
    `${API_BASE_URL}/auth/me`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
}