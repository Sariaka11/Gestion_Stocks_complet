import axios from "../api/axios";

const API_URL = 'http://localhost:5000/api/AgenceFournitures';

export const getAgenceFournitures = async (agenceId) => {
  try {
    const response = await axios.get(`${API_URL}/ByAgence/${agenceId}`);
    return response;
  } catch (error) {
    console.error('Erreur lors de la récupération des agence-fournitures:', error);
    throw error;
  }
};

export const createAgenceFourniture = async (data) => {
  try {
    console.log('Envoi de la requête POST à:', API_URL, 'avec les données:', data);
    const response = await axios.post(API_URL, data, { timeout: 15000 });
    console.log('Réponse reçue:', response.data);
    return response;
  } catch (error) {
    console.error('Erreur lors de la création de l\'agence-fourniture:', {
      message: error.message,
      code: error.code,
      response: error.response ? {
        status: error.response.status,
        data: error.response.data
      } : null
    });
    throw error;
  }
};

export const createConsommation = async (data) => {
  try {
    console.log('Envoi de la requête POST à:', `${API_URL}/Consommation`, 'avec les données:', data);
    const response = await axios.post(`${API_URL}/Consommation`, {
      agenceId: data.agenceId,
      fournitureId: data.fournitureId,
      consoMm: data.consoMm
    }, { timeout: 15000 });
    console.log('Réponse reçue:', response.data);
    return response;
  } catch (error) {
    console.error('Erreur lors de la création de la consommation:', {
      message: error.message,
      code: error.code,
      response: error.response ? {
        status: error.response.status,
        data: error.response.data
      } : null
    });
    throw error;
  }
};

export const addConsommation = async (data) => {
  try {
    console.log('Envoi de la requête POST à:', `${API_URL}/Consommation/Add`, 'avec les données:', data);
    const response = await axios.post(`${API_URL}/Consommation/Add`, {
      agenceId: data.agenceId,
      fournitureId: data.fournitureId,
      consoMm: data.consoMm
    }, { timeout: 15000 });
    console.log('Réponse reçue:', response.data);
    return response;
  } catch (error) {
    console.error('Erreur lors de l\'ajout de la consommation:', {
      message: error.message,
      code: error.code,
      response: error.response ? {
        status: error.response.status,
        data: error.response.data
      } : null
    });
    throw error;
  }
};

export const updateAgenceFourniture = async (agenceId, fournitureId, quantite) => {
  try {
    const response = await axios.put(`${API_URL}/Agence/${agenceId}/Fourniture/${fournitureId}`, { quantite });
    return response;
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'agence-fourniture:', error);
    throw error;
  }
};

export const deleteAgenceFourniture = async (agenceId, fournitureId) => {
  try {
    const response = await axios.delete(`${API_URL}/Agence/${agenceId}/Fourniture/${fournitureId}`);
    return response;
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'agence-fourniture:', error);
    throw error;
  }
};