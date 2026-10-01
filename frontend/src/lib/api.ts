import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

// 1. Sync User API
export const syncUser = async (email: string, name?: string | null) => {
  const res = await axios.post(`${BASE_URL}/api/auth/sync`, {
    email,
    name,
  });
  return res.data;
};

// 2. Fetch or Search Emails API
export const fetchUserEmails = async (userId: string, query: string = "") => {
  let url = `${BASE_URL}/api/emails/${userId}`;
  if (query.trim() !== "") {
    url = `${BASE_URL}/api/search?userId=${userId}&q=${query}`;
  }
  const res = await axios.get(url);
  return res.data;
};

// 3. Schedule Email API
export const scheduleEmailJob = async (payload: {
  userId: string;
  recipient: string;
  subject: string;
  body: string;
  scheduledTime: string;
}) => {
  const res = await axios.post(`${BASE_URL}/api/schedule`, payload);
  return res.data;
};