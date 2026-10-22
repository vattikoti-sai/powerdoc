
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8080",
  headers: {
    "Content-Type": "application/json",
  },
});

export const getStations = () => api.get("/stations");
export const getUsers = () => api.get("/users");
export const getBookings = () => api.get("/bookings");

export const createBooking = (booking) =>
  api.post("/bookings", booking);

export const getUserBookings = (userId) =>
  api.get(`/bookings/user/${userId}`);

export default api;
