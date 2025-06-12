import axios from "axios";

const API_URL = "http://localhost:5000/api";

// Configuration pour CORS
axios.defaults.headers.common["Access-Control-Allow-Origin"] = "*";

// Intercepteur pour gérer les erreurs et afficher les détails
axios.interceptors.response.use(
  (response) => {
    console.log("Réponse API réussie:", response.config.url);
    return response;
  },
  (error) => {
    console.error("Erreur API détaillée:", {
      url: error.config?.url,
      code: error.code,
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
    });

    if (error.message === "Network Error") {
      console.error(
        "Possible erreur CORS ou serveur non disponible. Vérifiez que votre serveur backend est en cours d'exécution."
      );
    }

    return Promise.reject(error);
  }
);

export const getBienAgences = () => {
  return axios.get(`${API_URL}/BienAgences`);
};

export const getBienAgenceByIds = (idBien, idAgence) => {
  return axios.get(`${API_URL}/BienAgences/Bien/${idBien}/Agence/${idAgence}`);
};

export const createBienAgence = (bienAgenceData) => {
  console.log("Données envoyées dans createBienAgence:", bienAgenceData);
  return axios.post(`${API_URL}/BienAgences`, {
    idBien: bienAgenceData.idBien,
    idAgence: bienAgenceData.idAgence,
    quantite: bienAgenceData.quantite,
    dateAffectation: bienAgenceData.dateAffectation,
  });
};

export const deleteBienAgence = (idBien, idAgence, date) => {
  const formattedDate = new Date(date).toISOString().split("T")[0];
  console.log("Suppression demandée:", { idBien, idAgence, formattedDate });
  return axios.delete(`${API_URL}/BienAgences/Bien/${idBien}/Agence/${idAgence}/Date/${formattedDate}`);
};

export const getBienByAgence = (agenceId) => {
  return axios.get(`${API_URL}/BienAgences/ByAgence/${agenceId}`);
};

export const createBienConsommation = (data) => {
  console.log("Envoi de la requête POST à:", `${API_URL}/BienAgences/Consommation`, "avec les données:", data);
  return axios.post(`${API_URL}/BienAgences/Consommation`, {
    agenceId: data.agenceId,
    bienId: data.bienId,
    quantiteConso: data.quantiteConso,
    dateAffectation: data.dateAffectation
  });
};

export const addBienConsommation = (data) => {
  console.log("Envoi de la requête POST à:", `${API_URL}/BienAgences/Consommation/Add`, "avec les données:", data);
  return axios.post(`${API_URL}/BienAgences/Consommation/Add`, {
    agenceId: data.agenceId,
    bienId: data.bienId,
    quantiteConso: data.quantiteConso,
    dateAffectation: data.dateAffectation
  });
};