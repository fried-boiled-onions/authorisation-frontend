import axios from "axios";
import { HubConnectionBuilder, LogLevel } from "@microsoft/signalr";

const API_URL = "http://localhost:8080";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  console.log("Token for Axios:", token);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const registerUser = async (username, password) => {
  const response = await api.post("/api/auth/register", { username, password });
  return response.data;
};

export const loginUser = async (username, password) => {
  const response = await api.post("/api/auth/login", { username, password });
  return response.data;
};

export const getUsers = async () => {
  const response = await api.get("/api/users");
  return response.data;
};

export const getMessages = async (userId) => {
  const response = await api.get(`/api/messages/${userId}`);
  return response.data;
};

let connection = null;

export const initSignalR = () => {
  if (connection) {
    return connection; // Возвращаем существующее соединение
  }

  const token = localStorage.getItem("token");
  console.log("Token for SignalR:", token);
  if (!token) {
    throw new Error("No token found for SignalR connection");
  }

  connection = new HubConnectionBuilder()
    .withUrl(`${API_URL}/chat`, {
      accessTokenFactory: () => token,
    })
    .configureLogging(LogLevel.Information)
    .withAutomaticReconnect()
    .build();

  return connection;
};

export const getConnection = () => {
  if (!connection) {
    throw new Error("SignalR connection not initialized");
  }
  return connection;
};

export const disconnectSignalR = () => {
  if (connection) {
    connection.stop();
    connection = null;
  }
};
