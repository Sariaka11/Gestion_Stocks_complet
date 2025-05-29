import axios from "axios";

const API_URL = "http://localhost:5000/api";

export const getUsers = () => {
  return axios.get(`${API_URL}/Users`, {
    headers: { "Content-Type": "application/json" },
  });
};

export const getUserAgence = (userId) => {
  return axios.get(`${API_URL}/Users/${userId}/Agence`);
};

export const getUserFournitures = (userId) => {
  return axios.get(`${API_URL}/Users/${userId}/Fournitures`);
};

export const getUserById = (userId) => {
  return axios.get(`${API_URL}/Users/${userId}`);
};

export const createUser = (data) => {
  return axios.post(`${API_URL}/Users`, data, {
    headers: { "Content-Type": "application/json" },
  });
};

export const updateUser = (userId, data) => {
  return axios.put(`${API_URL}/Users/${userId}`, data, {
    headers: { "Content-Type": "application/json" },
  });
};

export const deleteUser = (userId) => {
  return axios.delete(`${API_URL}/Users/${userId}`, {
    headers: { "Content-Type": "application/json" },
  });
};

export const getAgences = () => {
  return axios.get(`${API_URL}/Agences`, {
    headers: { "Content-Type": "application/json" },
  });
};

export const createAgence = (data) => {
  return axios.post(`${API_URL}/Agences`, data, {
    headers: { "Content-Type": "application/json" },
  });
};

export const updateAgence = (agenceId, data) => {
  return axios.put(`${API_URL}/Agences/${agenceId}`, data, {
    headers: { "Content-Type": "application/json" },
  });
};

export const createUserAgence = (data) => {
  return axios.post(`${API_URL}/UserAgences`, data, {
    headers: { "Content-Type": "application/json" },
  });
};

export const updateUserAgence = (userId, data) => {
  return axios.put(`${API_URL}/UserAgences/${userId}`, data, {
    headers: { "Content-Type": "application/json" },
  });
};

export const getUserAgenceByUserId = (userId) => {
  return axios.get(`${API_URL}/UserAgences/user/${userId}`);
};

export const createAgenceFourniture = (data) => {
  return axios.post(`${API_URL}/AgenceFournitures`, data, {
    headers: { "Content-Type": "application/json" },
  });
};

export const checkEmail = (email) => {
  return axios.get(`${API_URL}/Users/check-email?email=${encodeURIComponent(email)}`);
};

// Nouvelle fonction pour récupérer les fournitures d'une agence
export const getAgenceFournitures = (agenceId) => {
  return axios.get(`${API_URL}/AgenceFournitures?agenceId=${agenceId}`, {
    headers: { "Content-Type": "application/json" },
  });
};