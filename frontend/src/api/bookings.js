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

export async function createBooking(
  eventId,
  seatIds
) {
  const response = await axios.post(
    `${API_BASE_URL}/bookings`,
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

export async function getMyBookings() {
  const response = await axios.get(
    `${API_BASE_URL}/bookings/my-bookings`,
    {
      headers: authHeaders(),
    }
  );

  return response.data;
}

export async function cancelBooking(bookingId) {
  const response = await axios.post(
    `${API_BASE_URL}/cancellations/bookings/${bookingId}`,
    {},
    {
      headers: authHeaders(),
    }
  );

  return response.data;
}