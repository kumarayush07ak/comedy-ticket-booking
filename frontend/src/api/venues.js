import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function authHeaders() {
  const token = localStorage.getItem("access_token");

  return {
    Authorization: `Bearer ${token}`,
  };
}

export async function getVenues() {
  const response = await axios.get(`${API_BASE_URL}/venues`);

  return response.data;
}

export async function getVenuesByCity(cityId) {
  const response = await axios.get(
    `${API_BASE_URL}/venues/city/${cityId}`
  );

  return response.data;
}

export async function createVenue(data) {
  const response = await axios.post(
    `${API_BASE_URL}/venues`,
    data,
    {
      headers: authHeaders(),
    }
  );

  return response.data;
}

export async function updateVenue(venueId, data) {
  const response = await axios.put(
    `${API_BASE_URL}/venues/${venueId}`,
    data,
    {
      headers: authHeaders(),
    }
  );

  return response.data;
}

export async function deleteVenue(venueId) {
  await axios.delete(`${API_BASE_URL}/venues/${venueId}`, {
    headers: authHeaders(),
  });
}