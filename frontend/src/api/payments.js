import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL;

function authHeaders() {
  const token =
    localStorage.getItem("access_token");

  return {
    Authorization: `Bearer ${token}`,
  };
}

export async function createPayment(
  bookingId
) {
  const response = await axios.post(
    `${API_BASE_URL}/payments`,
    {
      booking_id: bookingId,
    },
    {
      headers: authHeaders(),
    }
  );

  return response.data;
}