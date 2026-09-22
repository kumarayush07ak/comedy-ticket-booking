import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function authHeaders() {
  const token = localStorage.getItem("access_token");

  return {
    Authorization: `Bearer ${token}`,
  };
}

export async function getSeatLayout(venueId) {
  const response = await axios.get(
    `${API_BASE_URL}/venues/${venueId}/seats/layout`
  );

  return response.data;
}

export async function createOrReplaceSeatLayout(venueId, data) {
  const response = await axios.put(
    `${API_BASE_URL}/venues/${venueId}/seats/layout`,
    data,
    {
      headers: authHeaders(),
    }
  );

  return response.data;
}