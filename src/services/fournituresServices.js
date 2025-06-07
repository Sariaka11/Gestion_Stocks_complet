import axios from "axios"

const API_URL = "http://localhost:5000/api"

axios.defaults.headers.common["Access-Control-Allow-Origin"] = "*"

axios.interceptors.response.use(
  (response) => {
    console.log("Réponse API réussie:", response.config.url, response.data)
    return response
  },
  (error) => {
    console.error("Erreur API détaillée:", {
      url: error.config?.url,
      method: error.config?.method,
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
    })

    if (error.message === "Network Error") {
      console.error(
        "Possible erreur CORS ou serveur non disponible. Vérifiez que votre serveur backend est en cours d'exécution et configuré pour CORS.",
      )
    }

    return Promise.reject(error)
  },
)

export const getFournitures = () => {
  return axios.get(`${API_URL}/Fournitures`)
}

export const getFournitureById = (id) => {
  return axios.get(`${API_URL}/Fournitures/${id}`)
}

export const createFourniture = (fournitureData) => {
  return axios.post(`${API_URL}/Fournitures`, fournitureData)
}

export const updateFourniture = (id, fournitureData) => {
  return axios.put(`${API_URL}/Fournitures/${id}`, fournitureData)
}

export const deleteFourniture = (id) => {
  return axios.delete(`${API_URL}/Fournitures/${id}`)
}

export const getAgences = () => {
  return axios.get(`${API_URL}/Agences`)
}

export const getAgenceFournitures = (agenceId) => {
  return axios.get(`${API_URL}/AgenceFournitures/ByAgence/${agenceId}`, {
    headers: { "Content-Type": "application/json" },
  });
};

export const getAgenceFourniture = () => {
  return axios.get(`${API_URL}/AgenceFournitures`, {
    headers: { "Content-Type": "application/json" },
  });
};

export const createEntreeFourniture = (id, entreeData) => {
  return axios.post(`${API_URL}/Fournitures/${id}/Entrees`, entreeData)
}