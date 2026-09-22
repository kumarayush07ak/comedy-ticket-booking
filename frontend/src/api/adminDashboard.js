import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export async function getAdminDashboard(token) {
  const response = await axios.get(
    `${API_BASE_URL}/admin/dashboard`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
}