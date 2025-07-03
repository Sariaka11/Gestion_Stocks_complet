"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../../../Context/AuthContext"
import { getAgenceFournitures, addConsommation } from "../../../services/agenceFournituresServices"
import { createNotification } from "../../../services/notificationServices"
import { useNavigate } from "react-router-dom"
import toast, { Toaster } from "react-hot-toast"
import "./css/Consommation.css"

function UserConsommation() {
  const { user, userAgenceId } = useAuth()
  const [consommations, setConsommations] = useState([])
  const [filteredConsommations, setFilteredConsommations] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [detailsVisible, setDetailsVisible] = useState(false)
  const [selectedFourniture, setSelectedFourniture] = useState(null)
  const [detailedConsommations, setDetailedConsommations] = useState([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [addFormData, setAddFormData] = useState({ fournitureId: null, fournitureNom: "", consoMm: "" })
  const navigate = useNavigate()

  useEffect(() => {
    console.log("AuthContext dans UserConsommation:", { user, userAgenceId })
  }, [user, userAgenceId])

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)
      try {
        if (!userAgenceId) {
          setError("Aucune agence connectée.")
          setLoading(false)
          return
        }

        const response = await getAgenceFournitures(userAgenceId)
        const rawData = Array.isArray(response.data) ? response.data : response.data?.["$values"] || []

        const groupedData = rawData.reduce((acc, item) => {
          const key = item.fournitureNom
          if (!acc[key]) {
            acc[key] = {
              id: item.id,
              fournitureId: item.fournitureId,
              fournitureNom: item.fournitureNom || "Inconnu",
              quantite: item.quantite,
              consoMm: item.consoMm || 0,
              categorie: item.categorie || "Non catégorisé",
              details: [],
            }
          }
          acc[key].details.push({
            consoMm: item.consoMm || 0,
            date: item.dateAssociation,
          })
          return acc
        }, {})

        const data = Object.values(groupedData)
        setConsommations(data)
        setFilteredConsommations(data)
      } catch (error) {
        setError("Erreur lors du chargement des données.")
        console.error("Erreur:", error.message)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [userAgenceId])

  useEffect(() => {
    const filtered = consommations.filter(item =>
      item.fournitureNom.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.categorie.toLowerCase().includes(searchQuery.toLowerCase())
    )
    setFilteredConsommations(filtered)
  }, [searchQuery, consommations])

  const handleAddConsommation = (fournitureId, fournitureNom) => {
    setAddFormData({ fournitureId, fournitureNom, consoMm: "" })
    setShowAddModal(true)
  }

  const handleAddModalSubmit = async (e) => {
    e.preventDefault()
    try {
      const parsedConsoMm = Number.parseFloat(addFormData.consoMm)
      if (isNaN(parsedConsoMm) || parsedConsoMm <= 0) {
        setError("Veuillez entrer une consommation valide.")
        return
      }

      const response = await addConsommation({
        agenceId: userAgenceId,
        fournitureId: addFormData.fournitureId,
        consoMm: parsedConsoMm,
      })

      setConsommations((prev) => {
        const existing = prev.find((c) => c.fournitureNom === response.data.fournitureNom)
        if (existing) {
          existing.quantite = response.data.quantite
          existing.details.push({
            consoMm: parsedConsoMm,
            date: new Date().toISOString(),
          })
          return [...prev]
        }
        return [...prev]
      })

      setShowAddModal(false)
      setAddFormData({ fournitureId: null, fournitureNom: "", consoMm: "" })
      setError(null)
    } catch (error) {
      setError("Erreur lors de l'ajout de la consommation.")
      console.error("Erreur:", error.message)
    }
  }

  const handleAddModalChange = (e) => {
    setAddFormData({ ...addFormData, consoMm: e.target.value })
  }

  const handleDemande = async (fournitureId, fournitureNom) => {
    try {
      if (!user || !user.id) {
        console.error("Utilisateur non connecté:", { user, userAgenceId })
        setError("Vous devez être connecté pour envoyer une demande.")
        navigate("/auth/login")
        return
      }

      console.log("Envoi de la demande de notification pour:", {
        fournitureId,
        fournitureNom,
        userId: user.id,
        agenceId: userAgenceId,
      })
      const response = await createNotification({
        userId: user.id,
        userName: user.name || "Utilisateur",
        agenceId: userAgenceId,
        fournitureId,
      })
      console.log("Notification envoyée avec succès:", response.data)

      toast.success(`Demande envoyée pour ${fournitureNom} !`, {
        duration: 4000,
        position: "top-right",
        style: {
          background: "#10B981",
          color: "#fff",
          fontWeight: "500",
          borderRadius: "8px",
          boxShadow: "0 4px 12px rgba(16, 185, 129, 0.15)",
        },
        iconTheme: {
          primary: "#fff",
          secondary: "#10B981",
        },
      })
    } catch (error) {
      console.error("Erreur lors de l'envoi de la demande:", error)
      setError("Erreur lors de l'envoi de la demande.")

      toast.error("Erreur lors de l'envoi de la demande", {
        duration: 4000,
        position: "top-right",
        style: {
          background: "#EF4444",
          color: "#fff",
          fontWeight: "500",
          borderRadius: "8px",
          boxShadow: "0 4px 12px rgba(239, 68, 68, 0.15)",
        },
      })
    }
  }

  const handleDetailsClick = (item) => {
    setSelectedFourniture(item)
    setDetailedConsommations(item.details)
    setDetailsVisible(true)
  }

  const calculateTotalConsommation = (details) => {
    if (!details || details.length === 0) return 0
    return details.reduce((total, detail) => total + (detail.consoMm || 0), 0)
  }

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value)
  }

  if (loading) {
    return (
      <div className="consommation-container">
        <p>Chargement en cours...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="consommation-container">
        <div className="error-message">{error}</div>
      </div>
    )
  }

  return (
    <div className="consommation-container">
      <Toaster />

      <div className="consommation-header">
        <h2>Mes consommations</h2>
        <div className="search-bar">
          <input
            type="text"
            placeholder="Rechercher par désignation ou catégorie..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="search-input"
          />
        </div>
      </div>

      <div className="consommation-table-container">
        <table className="consommation-table">
          <thead>
            <tr>
              <th>Désignation</th>
              <th>Quantité</th>
              <th>Consommation</th>
              <th>Catégorie</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredConsommations.map((item) => (
              <tr key={item.id}>
                <td>{item.fournitureNom}</td>
                <td>{item.quantite}</td>
                <td>{calculateTotalConsommation(item.details).toFixed(2)}</td>
                <td>{item.categorie}</td>
                <td className="actions-cell">
                  <button
                    className="btn-add-cons"
                    onClick={() => handleAddConsommation(item.fournitureId, item.fournitureNom)}
                  >
                    Ajouter
                  </button>
                  <button className="btn-demande" onClick={() => handleDemande(item.fournitureId, item.fournitureNom)}>
                    Demande
                  </button>
                  <button className="btn-details" onClick={() => handleDetailsClick(item)}>
                    Détails
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <div className="modal" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Ajouter Consommation pour {addFormData.fournitureNom}</h3>
            <form onSubmit={handleAddModalSubmit}>
              <div className="modal-field">
                <label>Consommation</label>
                <input
                  type="number"
                  value={addFormData.consoMm}
                  onChange={handleAddModalChange}
                  step="0.1"
                  min="0"
                  required
                  placeholder="Entrez la consommation"
                />
              </div>
              {error && <p className="error-message">{error}</p>}
              <div className="modal-actions">
                <button type="submit" className="btn-submit">
                  Confirmer
                </button>
                <button type="button" className="btn-close" onClick={() => setShowAddModal(false)}>
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {detailsVisible && selectedFourniture && (
        <div className="modal" onClick={() => setDetailsVisible(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Détails de {selectedFourniture.fournitureNom}</h3>
            <table className="details-table">
              <thead>
                <tr>
                  <th>Consommation</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {detailedConsommations.map((detail, index) => (
                  <tr key={index}>
                    <td>{detail.consoMm}</td>
                    <td>{new Date(detail.date).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button className="btn-close" onClick={() => setDetailsVisible(false)}>
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserConsommation