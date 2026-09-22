import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export async function scanTicket(qrToken) {
  const token = localStorage.getItem("access_token");

  const response = await axios.post(
    `${API_BASE_URL}/scanner/scan`,
    {
      qr_token: qrToken,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
}