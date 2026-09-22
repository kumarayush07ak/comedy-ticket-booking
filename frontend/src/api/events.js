import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function authHeaders() {
  const token = localStorage.getItem("access_token");

  return {
    Authorization: `Bearer ${token}`,
  };
}

export async function getEvents(params = {}) {
  const response = await axios.get(`${API_BASE_URL}/events`, {
    params,
  });

  return response.data;
}

export async function getEvent(eventId) {
  const response = await axios.get(
    `${API_BASE_URL}/events/${eventId}`
  );

  return response.data;
}

export async function getEventSeats(eventId) {
  const response = await axios.get(
    `${API_BASE_URL}/events/${eventId}/seats`
  );

  return response.data;
}

export async function createEvent(data) {
  const response = await axios.post(
    `${API_BASE_URL}/events`,
    data,
    {
      headers: authHeaders(),
    }
  );

  return response.data;
}


export async function cancelEvent(eventId) {
  const response = await axios.post(
    `${API_BASE_URL}/event-cancellations/${eventId}`,
    {},
    {
      headers: authHeaders(),
    }
  );

  return response.data;
}