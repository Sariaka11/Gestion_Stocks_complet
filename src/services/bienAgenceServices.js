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

export const getBienAgences = () => {
  return axios.get(`${API_URL}/BienAgences`)
}

export const getBienAgenceByIds = (idBien, idAgence) => {
  return axios.get(`${API_URL}/BienAgences/Bien/${idBien}/Agence/${idAgence}`)
}

export const createBienAgence = (bienAgenceData) => {
  return axios.post(`${API_URL}/BienAgences`, bienAgenceData)
}

export const deleteBienAgence = (idBien, idAgence, date) => {
  const formattedDate = new Date(date).toISOString()
  return axios.delete(`${API_URL}/BienAgences/Bien/${idBien}/Agence/${idAgence}/Date/${formattedDate}`)
}
