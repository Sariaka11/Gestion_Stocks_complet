import axios from "axios"

const API_URL = "http://localhost:5000/api"

// Configuration pour CORS
axios.defaults.headers.common["Access-Control-Allow-Origin"] = "*"

// Intercepteur pour gérer les erreurs et afficher les détails
axios.interceptors.response.use(
  (response) => {
    console.log("Réponse API réussie:", response.config.url)
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

export const getAgences = () => {
  return axios.get(`${API_URL}/Agences`)
}

export const getAgenceById = (id) => {
  return axios.get(`${API_URL}/Agences/${id}`)
}

export const createAgence = (agenceData) => {
  return axios.post(`${API_URL}/Agences`, agenceData)
}

export const updateAgence = (id, agenceData) => {
  return axios.put(`${API_URL}/Agences/${id}`, agenceData)
}

export const deleteAgence = (id) => {
  return axios.delete(`${API_URL}/Agences/${id}`)
}
