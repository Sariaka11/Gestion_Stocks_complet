"use client"

import { createContext, useContext, useState, useEffect } from "react"

// Créer un contexte pour les données mockées
const MockDataContext = createContext()

// Données mockées pour les tests
const mockImmobiliers = [
  {
    idBien: 1,
    nomBien: "Ordinateur portable Dell XPS",
    dateAcquisition: "2023-01-15",
    valeurAcquisition: 1200000,
    tauxAmortissement: 25,
    statut: "actif",
    idCategorie: 1,
    codeBarre: "9781234567897",
    quantite: 1,
    categorie: { nomCategorie: "Matériel informatique", dureeAmortissement: 4 },
  },
  {
    idBien: 2,
    nomBien: "Bureau de direction",
    dateAcquisition: "2022-05-20",
    valeurAcquisition: 850000,
    tauxAmortissement: 10,
    statut: "actif",
    idCategorie: 2,
    codeBarre: "9789876543210",
    quantite: 3,
    categorie: { nomCategorie: "Mobilier", dureeAmortissement: 10 },
  },
  {
    idBien: 3,
    nomBien: "Imprimante multifonction",
    dateAcquisition: "2021-11-10",
    valeurAcquisition: 450000,
    tauxAmortissement: 20,
    statut: "actif",
    idCategorie: 1,
    codeBarre: "9785678901234",
    quantite: 2,
    categorie: { nomCategorie: "Matériel informatique", dureeAmortissement: 4 },
  },
]

const mockCategories = [
  {
    idCategorie: 1,
    nomCategorie: "Matériel informatique",
    dureeAmortissement: 4,
  },
  {
    idCategorie: 2,
    nomCategorie: "Mobilier",
    dureeAmortissement: 10,
  },
  {
    idCategorie: 3,
    nomCategorie: "Véhicules",
    dureeAmortissement: 5,
  },
]

const mockAgences = [
  {
    id: 1,
    nom: "Agence Centrale",
    adresse: "123 Avenue Principale",
    telephone: "0123456789",
  },
  {
    id: 2,
    nom: "Agence Nord",
    adresse: "45 Rue du Nord",
    telephone: "0123456790",
  },
  {
    id: 3,
    nom: "Agence Sud",
    adresse: "78 Boulevard du Sud",
    telephone: "0123456791",
  },
]

const mockAffectations = [
  {
    idBien: 1,
    idAgence: 1,
    dateAffectation: "2023-02-01",
  },
  {
    idBien: 2,
    idAgence: 2,
    dateAffectation: "2022-06-15",
  },
  {
    idBien: 3,
    idAgence: 3,
    dateAffectation: "2021-12-01",
  },
]

const mockAmortissements = [
  {
    idAmortissement: 1,
    idBien: 1,
    annee: 2023,
    montant: 300000,
    valeurResiduelle: 900000,
    dateCalcul: "2023-12-31",
  },
  {
    idAmortissement: 2,
    idBien: 1,
    annee: 2024,
    montant: 300000,
    valeurResiduelle: 600000,
    dateCalcul: "2024-12-31",
  },
  {
    idAmortissement: 3,
    idBien: 2,
    annee: 2022,
    montant: 85000,
    valeurResiduelle: 765000,
    dateCalcul: "2022-12-31",
  },
]

const mockFournitures = [
  {
    id: 1,
    nom: "Papier A4",
    description: "Ramette de papier A4 80g/m²",
    prix: 5000,
    quantiteStock: 100,
    seuilAlerte: 20,
    categorie: "Fournitures de bureau",
  },
  {
    id: 2,
    nom: "Stylo bille",
    description: "Stylo bille bleu",
    prix: 500,
    quantiteStock: 200,
    seuilAlerte: 50,
    categorie: "Fournitures de bureau",
  },
  {
    id: 3,
    nom: "Cartouche d'encre",
    description: "Cartouche d'encre noire pour imprimante HP",
    prix: 35000,
    quantiteStock: 15,
    seuilAlerte: 5,
    categorie: "Consommables informatiques",
  },
]

// Fournisseur de données mockées
export function MockDataProvider({ children }) {
  const [useMockData, setUseMockData] = useState(true) // Par défaut, utiliser les données mockées
  const [apiStatus, setApiStatus] = useState("checking")

  // Vérifier si l'API est disponible au chargement
  useEffect(() => {
    const checkApiAvailability = async () => {
      try {
        const response = await fetch("http://localhost/api/Categories", {
          method: "GET",
          mode: "cors",
          headers: {
            Accept: "application/json",
          },
        })

        if (response.ok) {
          console.log("API disponible:", response)
          setApiStatus("available")
          setUseMockData(false)
        } else {
          console.log("L'API a retourné une erreur:", response.status)
          setApiStatus("unavailable")
          setUseMockData(true)
        }
      } catch (error) {
        console.error("API non disponible:", error)
        setApiStatus("unavailable")
        setUseMockData(true)
      }
    }

    checkApiAvailability()
  }, [])

  // Fonction pour basculer entre les données réelles et mockées
  const toggleMockData = () => {
    setUseMockData((prev) => !prev)
  }

  return (
    <MockDataContext.Provider
      value={{
        useMockData,
        toggleMockData,
        apiStatus,
        mockData: {
          immobiliers: mockImmobiliers,
          categories: mockCategories,
          agences: mockAgences,
          affectations: mockAffectations,
          amortissements: mockAmortissements,
          fournitures: mockFournitures,
        },
      }}
    >
      {children}
    </MockDataContext.Provider>
  )
}

// Hook pour utiliser les données mockées
export function useMockData() {
  const context = useContext(MockDataContext)
  if (!context) {
    throw new Error("useMockData doit être utilisé à l'intérieur d'un MockDataProvider")
  }
  return context
}
