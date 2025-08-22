"use client"

import { useState, useEffect } from "react"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

// Importez vos services API
import { getFournitures, getAgenceFourniture, getAgences } from "../services/fournituresServices"
import { getImmobiliers } from "../services/immobilierServices"
import { getAmortissements } from "../services/amortissementServices"
import { getBienAgences } from "../services/bienAgenceServices"
import { RefreshCw, AlertCircle, CheckCircle, X } from "lucide-react"
import "./DashboardGraphs.css"

const COLORS = ["#FF8C42", "#FFD23F", "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7", "#DDA0DD"]

export default function DashboardGraphs() {
  // États pour les données
  const [fournitures, setFournitures] = useState([])
  const [agenceFournitures, setAgenceFournitures] = useState([])
  const [agences, setAgences] = useState([])
  const [immobiliers, setImmobiliers] = useState([])
  const [amortissements, setAmortissements] = useState([])
  const [affectations, setAffectations] = useState([])

  // États pour les graphiques
  const [fournituresAgenceData, setFournituresAgenceData] = useState([])
  const [biensAgenceData, setBiensAgenceData] = useState([])
  const [topImmobiliersData, setTopImmobiliersData] = useState([])
  const [topFournituresData, setTopFournituresData] = useState([])
  const [dynamicsData, setDynamicsData] = useState([])
  const [activityData, setActivityData] = useState([])

  // États pour les contrôles
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [toasts, setToasts] = useState([])

  // Fonction pour afficher les toasts
  const afficherToast = (message, type) => {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => setToasts((prev) => prev.filter((toast) => toast.id !== id)), 5000)
  }

  // Fonction pour supprimer un toast
  const supprimerToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }

  // Fonction pour normaliser les données API (gérer $values)
  const normalizeApiData = (data) => {
    if (Array.isArray(data)) return data
    if (data && typeof data === "object" && "$values" in data) return data.$values
    return []
  }

  // Fonction pour charger toutes les données
  const chargerDonnees = async () => {
    setLoading(true)
    setError(null)

    try {
      console.log("Début du chargement des données...")

      // Charger toutes les données en parallèle
      const [fournituresRes, agenceFournituresRes, agencesRes, immobiliersRes, amortissementsRes, affectationsRes] =
        await Promise.all([
          getFournitures(),
          getAgenceFourniture(),
          getAgences(),
          getImmobiliers(),
          getAmortissements(),
          getBienAgences(),
        ])

      // Normaliser les données
      const rawFournitures = normalizeApiData(fournituresRes.data)
      const rawAgenceFournitures = normalizeApiData(agenceFournituresRes.data)
      const rawAgences = normalizeApiData(agencesRes.data)
      const rawImmobiliers = normalizeApiData(immobiliersRes.data)
      const rawAmortissements = normalizeApiData(amortissementsRes.data)
      const rawAffectations = normalizeApiData(affectationsRes.data)

      console.log("Données chargées:", {
        fournitures: rawFournitures.length,
        agenceFournitures: rawAgenceFournitures.length,
        agences: rawAgences.length,
        immobiliers: rawImmobiliers.length,
        amortissements: rawAmortissements.length,
        affectations: rawAffectations.length,
      })

      // Mapper les fournitures
      const mappedFournitures = rawFournitures.map((f, index) => {
        const entrees = f.EntreesFournitures || []
        const totalMontant = entrees.reduce((sum, e) => sum + e.QuantiteEntree * e.PrixUnitaire, 0)
        const totalQuantite = entrees.reduce((sum, e) => sum + e.QuantiteEntree, 0)
        const cmup = totalQuantite > 0 ? totalMontant / totalQuantite : 0

        return {
          id: f.Id || `fourniture-${index}`,
          nom: f.Nom ? f.Nom.trim() : `fourniture-${index}`,
          categorie: f.Categorie || "Non catégorisé",
          quantite: f.QuantiteRestante || 0,
          prixUnitaire: f.PrixUnitaire || 0,
          prixTotal: f.PrixTotal || 0,
          cmup: cmup || f.CMUP || 0,
          date: f.DateEntree || null,
          entreesFournitures: f.EntreesFournitures || [],
        }
      })

      // Mapper les agence-fournitures
      const mappedAgenceFournitures = rawAgenceFournitures.map((af) => ({
        ...af,
        fournitureNom: af.FournitureNom ? af.FournitureNom.trim() : "",
        agenceNom: af.AgenceNom ? af.AgenceNom.trim() : "",
        quantite: af.Quantite || 0,
        prixUnitaire: af.PrixUnitaire || 0,
        montant: (af.Quantite || 0) * (af.PrixUnitaire || 0),
        dateAssociation: af.DateAssociation || null,
      }))

      // Mapper les agences
      const mappedAgences = rawAgences.map((agence) => ({
        id: agence.Id || agence.IdAgence,
        nom: agence.Nom || agence.NomAgence || "Agence sans nom",
        adresse: agence.adresse || "",
        telephone: agence.telephone || "",
      }))

      // Mapper les immobiliers
      const mappedImmobiliers = rawImmobiliers.map((item) => {
        const amortissementsBien = rawAmortissements.filter((a) => a.idBien === item.IdBien)
        const affectationsBien = rawAffectations.filter((a) => a.idBien === item.IdBien)

        return {
          id: item.IdBien,
          codeArticle: `IMM-${String(item.idBien).padStart(3, "0")}`,
          designation: item.NomBien || "",
          codeBarre: item.CodeBarre || "0000000000000",
          prixAchat: item.ValeurAcquisition || 0,
          typeImmobilier: item.Categorie?.NomCategorie || "Non catégorisé",
          dateAcquisition: item.DateAcquisition?.split("T")[0] || "",
          quantite: item.Quantite || 1,
          statut: item.statut,
          affectations: affectationsBien,
          amortissements: amortissementsBien,
        }
      })

      // Logs pour déboguer les données mappées
      console.log("mappedImmobiliers:", mappedImmobiliers)
      console.log("rawAffectations:", rawAffectations)

      // Mettre à jour les états
      setFournitures(mappedFournitures)
      setAgenceFournitures(mappedAgenceFournitures)
      setAgences(mappedAgences)
      setImmobiliers(mappedImmobiliers)
      setAmortissements(rawAmortissements)
      setAffectations(rawAffectations)

      // Générer les données des graphiques
      genererDonneesGraphiques(
        mappedFournitures,
        mappedAgenceFournitures,
        mappedAgences,
        mappedImmobiliers,
      )

      afficherToast("Données chargées avec succès", "success")
    } catch (err) {
      console.error("Erreur chargement:", err)
      setError(` erreur lors du chargement des données: ${err.message}`)
      afficherToast("Erreur lors du chargement des données", "error")
    } finally {
      setLoading(false)
    }
  }

  // Fonction pour générer les données des graphiques
  const genererDonneesGraphiques = (fournitures, agenceFournitures, agences, immobiliers) => {
    // 1. Fournitures de toutes les agences par catégorie
    const fournituresParCategorie = fournitures.reduce((acc, f) => {
      const categorie = f.categorie || "Non catégorisé"
      if (!acc[categorie]) {
        acc[categorie] = 0
      }
      acc[categorie] += f.quantite
      return acc
    }, {})

    const fournituresAgence = Object.entries(fournituresParCategorie).map(([categorie, quantite]) => ({
      name: categorie,
      quantite: quantite,
    }))

    // 2. Biens de toutes les agences par catégorie
    const biensParCategorie = immobiliers.reduce((acc, bien) => {
      const categorie = bien.typeImmobilier || "Non catégorisé"
      if (!acc[categorie]) {
        acc[categorie] = 0
      }
      acc[categorie] += bien.quantite
      return acc
    }, {})

    let biensAgence = Object.entries(biensParCategorie).map(([categorie, quantite]) => ({
      name: categorie,
      quantite: quantite,
    }))

    // Ajouter une donnée par défaut si vide
    if (biensAgence.length === 0) {
      biensAgence = [{ name: "Aucune donnée", quantite: 0 }]
    }

    // 3. Top immobiliers (diagramme circulaire)
    const topImmobiliers = immobiliers
      .sort((a, b) => b.quantite - a.quantite)
      .slice(0, 8)
      .map((im) => ({
        name: im.designation.substring(0, 20) || `Bien ${im.id}`,
        value: im.quantite,
      }))

    // 4. Top fournitures (diagramme circulaire)
    const topFournitures = fournitures
      .sort((a, b) => b.quantite - a.quantite)
      .slice(0, 8)
      .map((f) => ({
        name: f.nom.substring(0, 20),
        value: f.quantite,
      }))

    // 5. Données d'évolution temporelle
    const derniersMois = Array.from({ length: 12 }, (_, i) => {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      return {
        month: date.toLocaleDateString("fr-FR", { month: "short" }),
        fournitures: Math.round(Math.random() * 1000 + 500),
        immobiliers: Math.round(Math.random() * 100 + 50),
        consommation: Math.round(Math.random() * 800 + 200),
      }
    }).reverse()

    // 6. Données d'activité
    const semaines = Array.from({ length: 8 }, (_, i) => {
      const semaine = `S${i + 1}`
      const data = { name: semaine }

      // Ajouter les données des top 3 fournitures
      topFournitures.slice(0, 3).forEach((f, index) => {
        data[`fourniture${index + 1}`] = Math.round(f.value * (0.7 + Math.random() * 0.6))
      })

      return data
    })

    // Mettre à jour les états des graphiques
    setFournituresAgenceData(fournituresAgence)
    setBiensAgenceData(biensAgence)
    setTopImmobiliersData(topImmobiliers)
    setTopFournituresData(topFournitures)
    setDynamicsData(derniersMois)
    setActivityData(semaines)
    console.log("biensAgenceData:", biensAgence) // Log pour débogage
  }

  // Charger les données au montage
  useEffect(() => {
    chargerDonnees()
  }, [])

  if (loading) {
    return (
      <div className="loading-container">
        <RefreshCw className="loading-spinner" size={40} />
        <div className="loading-text">Chargement des données...</div>
      </div>
    )
  }

  return (
    <div className="dashboard-container">
      {/* Système de toasts */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            {toast.type === "success" && <CheckCircle size={20} />}
            {toast.type === "error" && <AlertCircle size={20} />}
            <span>{toast.message}</span>
            <button onClick={() => supprimerToast(toast.id)} className="toast-close">
              <X size={16} />
            </button>
          </div>
        ))}
      </div>

      {/* En-tête avec contrôles */}
      <div className="dashboard-header-controls">
        <div>
          <h2 className="dashboard-title">Tableau de Bord</h2>
        </div>
        <div className="dashboard-controls">
          <button onClick={chargerDonnees} disabled={loading} className="custom-button">
            <RefreshCw size={16} className={loading ? "spinning" : ""} />
            {loading ? "Chargement..." : "Actualiser"}
          </button>
        </div>
      </div>

      {/* Affichage des erreurs */}
      {error && <div className="error-message">{error}</div>}

      {/* Ligne 1 : Deux graphiques côte à côte */}
      <div className="charts-row">
        <div className="chart-card">
          <div className="card-header">
            <h3 className="card-title">Fournitures par Catégorie</h3>
            <p className="card-description">Toutes les agences</p>
          </div>
          <div className="card-content">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={fournituresAgenceData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => [`${value} unités`, "Quantité"]} />
                <Bar dataKey="quantite" fill="#45B7D1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="chart-card">
          <div className="card-header">
            <h3 className="card-title">Biens par Catégorie</h3>
            <p className="card-description">Toutes les agences</p>
          </div>
          <div className="card-content">
            {biensAgenceData.length === 0 || (biensAgenceData.length === 1 && biensAgenceData[0].name === "Aucune donnée") ? (
              <div className="no-data-message">Aucune donnée disponible.</div>
            ) : (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={biensAgenceData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value} unités`, "Quantité"]} />
                  <Bar dataKey="quantite" fill="#FF8C42" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Ligne 2 : Deux graphiques côte à côte */}
      <div className="charts-row">
        <div className="chart-card">
          <div className="card-header">
            <h3 className="card-title">Top Immobiliers</h3>
            <p className="card-description">Les biens les plus importants par quantité</p>
          </div>
          <div className="card-content">
            <ResponsiveContainer width="100%" height={400}>
              <PieChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <Pie
                  data={topImmobiliersData}
                  cx="50%"
                  cy="50%"
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {topImmobiliersData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} unités`, "Quantité"]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="chart-card">
          <div className="card-header">
            <h3 className="card-title">Top Fournitures</h3>
            <p className="card-description">Les fournitures les plus importantes</p>
          </div>
          <div className="card-content">
            <ResponsiveContainer width="100%" height={400}>
              <PieChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <Pie
                  data={topFournituresData}
                  cx="50%"
                  cy="50%"
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {topFournituresData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} unités`, "Quantité"]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Ligne 3 : Graphique en pleine largeur */}
      <div className="charts-row-full">
        <div className="chart-card-full">
          <div className="card-header">
            <h3 className="card-title">Évolution sur 12 Mois</h3>
            <p className="card-description">Tendances des stocks et consommation</p>
          </div>
          <div className="card-content">
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={dynamicsData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="fournitures" stroke="#45B7D1" strokeWidth={3} name="Fournitures" />
                <Line type="monotone" dataKey="immobiliers" stroke="#FF6B6B" strokeWidth={3} name="Immobiliers" />
                <Line type="monotone" dataKey="consommation" stroke="#FFD23F" strokeWidth={3} name="Consommation" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Ligne 4 : Graphique en pleine largeur */}
      <div className="charts-row-full">
        <div className="chart-card-full">
          <div className="card-header">
            <h3 className="card-title">Activité Hebdomadaire</h3>
            <p className="card-description">Évolution des principales fournitures sur 8 semaines</p>
          </div>
          <div className="card-content">
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={activityData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="fourniture1"
                  stackId="1"
                  stroke="#45B7D1"
                  fill="#45B7D1"
                  name="Fourniture 1"
                />
                <Area
                  type="monotone"
                  dataKey="fourniture2"
                  stackId="1"
                  stroke="#FF6B6B"
                  fill="#FF6B6B"
                  name="Fourniture 2"
                />
                <Area
                  type="monotone"
                  dataKey="fourniture3"
                  stackId="1"
                  stroke="#FFD23F"
                  fill="#FFD23F"
                  name="Fourniture 3"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}