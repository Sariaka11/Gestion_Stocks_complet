import axios from "axios"

const API_URL = "http://localhost:5000/api"

// Configuration globale
axios.defaults.headers.common["Access-Control-Allow-Origin"] = "*"

// Intercepteur pour les requêtes
axios.interceptors.request.use(
  (config) => {
    console.log("Requête envoyée:", config.url, config.method)
    return config
  },
  (error) => Promise.reject(error)
)

// Intercepteur pour les réponses
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
        "Erreur CORS ou backend non joignable. Vérifie que ton serveur est lancé et que CORS est activé."
      )
    }

    return Promise.reject(error)
  }
)

// 🔽 Fonctions API

export const getCategories = () => {
  return axios.get(`${API_URL}/Categories`)
}

// ✅ Obtenir toutes les catégories principales (ParentCategorieId == null)
export const getCategoriesPrincipales = () => {
  return axios.get(`${API_URL}/Categories/principales`)
}

// ✅ Obtenir les sous-catégories d’une catégorie donnée
export const getSousCategories = (idCategorie) => {
  return axios.get(`${API_URL}/Categories/${idCategorie}/sous-categories`)
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

export const createSousCategorie = async (data) => {
  return await axios.post(`${API_URL}/Categories`, data)
}

