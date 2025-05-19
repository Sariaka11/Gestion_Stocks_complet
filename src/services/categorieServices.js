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

    // Vérifiez si c'est une erreur CORS
    if (error.message === "Network Error") {
      console.error(
        "Possible erreur CORS ou serveur non disponible. Vérifiez que votre serveur backend est en cours d'exécution et configuré pour CORS.",
      )
    }

    return Promise.reject(error)
  },
)

// Intercepteur pour les requêtes
axios.interceptors.request.use(
  (config) => {
    console.log("Requête envoyée:", config.url, config.method)
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

export const getCategories = () => {
  return axios.get(`${API_URL}/Categories`)
}

export const getCategorieById = (id) => {
  return axios.get(`${API_URL}/Categories/${id}`)
}

export const createCategorie = (categorieData) => {
  return axios.post(`${API_URL}/Categories`, categorieData)
}

export const updateCategorie = (id, categorieData) => {
  return axios.put(`${API_URL}/Categories/${id}`, categorieData)
}

export const deleteCategorie = (id) => {
  return axios.delete(`${API_URL}/Categories/${id}`)
}
