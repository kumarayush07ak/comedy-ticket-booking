import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function authHeaders() {
  const token = localStorage.getItem("access_token");

  return {
    Authorization: `Bearer ${token}`,
  };
}

export async function getCities() {
  const response = await axios.get(`${API_BASE_URL}/cities`);

  return response.data;
}

export async function createCity(name) {
  const response = await axios.post(
    `${API_BASE_URL}/cities`,
    {
      name,
    },
    {
      headers: authHeaders(),
    }
  );

  return response.data;
}

export async function updateCity(cityId, name) {
  const response = await axios.put(
    `${API_BASE_URL}/cities/${cityId}`,
    {
      name,
    },
    {
      headers: authHeaders(),
    }
  );

  return response.data;
}

export async function deleteCity(cityId) {
  await axios.delete(`${API_BASE_URL}/cities/${cityId}`, {
    headers: authHeaders(),
  });
}