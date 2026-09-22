import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export async function getTicketByBooking(bookingId) {
  const token = localStorage.getItem("access_token");

  const response = await axios.get(
    `${API_BASE_URL}/tickets/booking/${bookingId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
}