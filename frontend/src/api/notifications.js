import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function authHeaders() {
  const token = localStorage.getItem("access_token");

  return {
    Authorization: `Bearer ${token}`,
  };
}

export async function getNotifications() {
  const response = await axios.get(`${API_BASE_URL}/notifications`, {
    headers: authHeaders(),
  });

  return response.data;
}

export async function markNotificationAsRead(notificationId) {
  const response = await axios.post(
    `${API_BASE_URL}/notifications/${notificationId}/read`,
    {},
    {
      headers: authHeaders(),
    }
  );

  return response.data;
}