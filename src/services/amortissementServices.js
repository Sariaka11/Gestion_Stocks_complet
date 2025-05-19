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

export const getAmortissements = () => {
  return axios.get(`${API_URL}/Amortissements`)
}

export const getAmortissementById = (id) => {
  return axios.get(`${API_URL}/Amortissements/${id}`)
}

export const getAmortissementsByBien = (idBien) => {
  return axios.get(`${API_URL}/Amortissements/Bien/${idBien}`)
}

export const getAmortissementsByAnnee = (annee) => {
  return axios.get(`${API_URL}/Amortissements/Annee/${annee}`)
}

export const deleteAmortissement = (id) => {
  return axios.delete(`${API_URL}/Amortissements/${id}`)
}

// Fonction utilitaire pour calculer un tableau d'amortissement
export const calculerTableauAmortissement = (bien) => {
  const prixAchat = bien.valeurAcquisition
  const tauxAmortissement = bien.tauxAmortissement / 100
  const dureeAmortissement = Math.ceil(1 / tauxAmortissement)
  const dateAcquisition = new Date(bien.dateAcquisition)
  const anneeAcquisition = dateAcquisition.getFullYear()

  const tableau = []
  let valeurResiduelle = prixAchat

  for (let i = 0; i < dureeAmortissement; i++) {
    const annee = anneeAcquisition + i
    const dotation = i === dureeAmortissement - 1 ? valeurResiduelle : Math.round(prixAchat * tauxAmortissement)

    valeurResiduelle = Math.max(0, valeurResiduelle - dotation)

    tableau.push({
      annee,
      baseAmortissable: prixAchat,
      dotation,
      valeurResiduelle,
      valeurNetteComptable: valeurResiduelle,
    })

    if (valeurResiduelle === 0) break
  }

  return tableau
}
