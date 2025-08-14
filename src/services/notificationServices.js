import axios from "axios";

const API_URL = "http://localhost:5000/api";

export const createNotification = (data) => {
  console.log("Envoi de la requête POST à:", `${API_URL}/Notifications`, "avec les données:", JSON.stringify(data));
  return axios.post(`${API_URL}/Notifications`, {
    userId: data.userId,
    userName: data.userName,
    agenceId: data.agenceId,
    fournitureId: data.fournitureId,
    bienId: data.bienId
  });
};

export const getNotifications = (userId, isAdmin = false) => {
  console.log("Envoi de la requête GET à:", `${API_URL}/Notifications`, "avec les paramètres:", { userId, isAdmin });
  return axios.get(`${API_URL}/Notifications`, {
    params: { userId, isAdmin }
  });
};

export const markNotificationAsRead = (notificationId) => {
  console.log("Envoi de la requête PUT à:", `${API_URL}/Notifications/${notificationId}/mark-as-read`);
  return axios.put(`${API_URL}/Notifications/${notificationId}/mark-as-read`);
};