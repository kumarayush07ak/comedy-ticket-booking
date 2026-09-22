import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function authHeaders() {
  const token = localStorage.getItem("access_token");

  return {
    Authorization: `Bearer ${token}`,
  };
}

export async function holdSeats(eventId, seatIds) {
  const response = await axios.post(
    `${API_BASE_URL}/reservations/hold`,
    {
      event_id: eventId,
      seat_ids: seatIds,
    },
    {
      headers: authHeaders(),
    }
  );

  return response.data;
}