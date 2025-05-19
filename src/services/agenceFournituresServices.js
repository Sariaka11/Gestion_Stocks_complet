import axios from "../api/axios";

// 🔁 Récupérer toutes les associations agences-fournitures
export const getAgenceFournitures = () => {
  return axios.get("/AgenceFournitures");
};

// 🔁 Récupérer les fournitures d’une agence spécifique
export const getFournituresByAgence = (agenceId) => {
  return axios.get(`/AgenceFournitures/ByAgence/${agenceId}`);
};

// 🔁 Récupérer les agences pour une fourniture donnée
export const getAgencesByFourniture = (fournitureId) => {
  return axios.get(`/AgenceFournitures/ByFourniture/${fournitureId}`);
};

// ✅ Ajouter un envoi de fourniture à une agence
export const createDispatch = (data) => {
  return axios.post("/AgenceFournitures", data);
};

// ❌ Supprimer une répartition spécifique
export const deleteDispatch = (agenceId, fournitureId) => {
  return axios.delete(`/AgenceFournitures/Agence/${agenceId}/Fourniture/${fournitureId}`);
};
