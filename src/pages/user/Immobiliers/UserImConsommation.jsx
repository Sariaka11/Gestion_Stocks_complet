"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../../../Context/AuthContext"
import { getBienByAgence, addBienConsommation } from "../../../services/bienAgenceServices"
import { createNotification } from "../../../services/notificationServices"
import { useNavigate } from "react-router-dom"
import toast, { Toaster } from "react-hot-toast"
import "./css/Consommation.css"

function UserBienConsommation() {
  const { user, userAgenceId } = useAuth()
  const [consommations, setConsommations] = useState([])
  const [filteredConsommations, setFilteredConsommations] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [detailsVisible, setDetailsVisible] = useState(false)
  const [selectedBien, setSelectedBien] = useState(null)
  const [detailedConsommations, setDetailedConsommations] = useState([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [addFormData, setAddFormData] = useState({ bienId: null, nomBien: "", quantiteConso: "" })
  const navigate = useNavigate()

  useEffect(() => {
    console.log("AuthContext dans UserBienConsommation:", { user, userAgenceId })
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

        const response = await getBienByAgence(userAgenceId)
        const rawData = Array.isArray(response.data) ? response.data : response.data?.["$values"] || []

        const groupedData = rawData.reduce((acc, item) => {
          const key = item.nomBien || item.immobilisation?.nomBien
          if (!acc[key]) {
            acc[key] = {
              id: `${item.idBien}-${item.idAgence}`,
              bienId: item.idBien,
              nomBien: item.nomBien || item.immobilisation?.nomBien || "Inconnu",
              quantite: item.quantite,
              quantiteConso: item.quantiteConso || 0,
              categorie: item.categorie || item.immobilisation?.categorie?.nomCategorie || "Non catégorisé",
              details: [],
              immobilisation: item.immobilisation,
            }
          }
          acc[key].details.push({
            quantiteConso: item.quantiteConso || 0,
            date: item.dateAffectation,
          })
          return acc
        }, {})

        setConsommations(Object.values(groupedData))
        setFilteredConsommations(Object.values(groupedData))
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
      item.nomBien.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.categorie.toLowerCase().includes(searchQuery.toLowerCase())
    )
    setFilteredConsommations(filtered)
  }, [searchQuery, consommations])

  const calculateAmortissement = (item) => {
    const immobilisation = item.immobilisation
    if (!immobilisation?.categorie?.dureeAmortissement || !immobilisation?.valeurAcquisition) return "N/A"
    const duree = immobilisation.categorie.dureeAmortissement
    const valeurAcquisition = immobilisation.valeurAcquisition
    return (valeurAcquisition / duree).toFixed(2)
  }

  const handleAddConsommation = (bienId, nomBien) => {
    setAddFormData({ bienId, nomBien, quantiteConso: "" })
    setShowAddModal(true)
  }

  const handleAddModalSubmit = async (e) => {
    e.preventDefault()
    try {
      const parsedQuantiteConso = Number.parseFloat(addFormData.quantiteConso)
      if (isNaN(parsedQuantiteConso) || parsedQuantiteConso <= 0) {
        toast.error("Veuillez entrer une consommation valide.", {
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
        return
      }

      // Trouver le bien dans consommations pour vérifier la quantité disponible
      const bien = consommations.find(
        (item) => item.bienId === addFormData.bienId
      )
      if (!bien) {
        toast.error("Bien non trouvé.", {
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
        return
      }

      if (bien.quantite === 0) {
        toast.error(`${addFormData.nomBien} est indisponible.`, {
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
        return
      }

      if (parsedQuantiteConso > bien.quantite) {
        toast.error(
          `La consommation (${parsedQuantiteConso}) dépasse la quantité disponible (${bien.quantite}).`,
          {
            duration: 4000,
            position: "top-right",
            style: {
              background: "#EF4444",
              color: "#fff",
              fontWeight: "500",
              borderRadius: "8px",
              boxShadow: "0 4px 12px rgba(239, 68, 68, 0.15)",
            },
          }
        )
        return
      }

      const dateAffectation = new Date().toISOString().split("T")[0]

      const response = await addBienConsommation({
        agenceId: userAgenceId,
        bienId: addFormData.bienId,
        quantiteConso: parsedQuantiteConso,
        dateAffectation,
      })

      setConsommations((prev) => {
        const existing = prev.find(
          (c) => c.nomBien === (response.data.nomBien || response.data.immobilisation?.nomBien),
        )
        if (existing) {
          existing.quantite = response.data.quantite
          existing.quantiteConso = response.data.quantiteConso
          existing.details.push({
            quantiteConso: parsedQuantiteConso,
            date: response.data.dateAffectation,
          })
          existing.immobilisation = response.data.immobilisation
          return [...prev]
        }
        return [...prev]
      })

      setShowAddModal(false)
      setAddFormData({ bienId: null, nomBien: "", quantiteConso: "" })
      setError(null)

      toast.success(`Consommation ajoutée pour ${addFormData.nomBien} !`, {
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
      setError("Erreur lors de l'ajout de la consommation.")
      console.error("Erreur:", error.message)
      toast.error("Erreur lors de l'ajout de la consommation.", {
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

  const handleAddModalChange = (e) => {
    setAddFormData({ ...addFormData, quantiteConso: e.target.value })
  }

  const handleDemande = async (bienId, nomBien) => {
    try {
      if (!user || !user.id) {
        console.error("Utilisateur non connecté:", { user, userAgenceId })
        setError("Vous devez être connecté pour envoyer une demande.")
        navigate("/auth/login")
        return
      }

      console.log("Envoi de la demande de notification pour:", {
        bienId,
        nomBien,
        userId: user.id,
        agenceId: userAgenceId,
      })
      const response = await createNotification({
        userId: user.id,
        userName: user.name || "Utilisateur",
        agenceId: userAgenceId,
        bienId,
      })
      console.log("Notification envoyée avec succès:", response.data)

      toast.success(`Demande envoyée pour ${nomBien} !`, {
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
    setSelectedBien(item)
    setDetailedConsommations(item.details)
    setDetailsVisible(true)
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
              <th>Amortissement</th>
              <th>Catégorie</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredConsommations.map((item) => (
              <tr key={item.id}>
                <td>{item.nomBien}</td>
                <td>{item.quantite}</td>
                <td>{item.quantiteConso ?? "N/A"}</td>
                <td>{calculateAmortissement(item)}</td>
                <td>{item.categorie}</td>
                <td className="actions-cell">
                  <button className="btn-add-cons" onClick={() => handleAddConsommation(item.bienId, item.nomBien)}>
                    Ajouter
                  </button>
                  <button className="btn-demande" onClick={() => handleDemande(item.bienId, item.nomBien)}>
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
            <h3>Ajouter Consommation pour {addFormData.nomBien}</h3>
            <form onSubmit={handleAddModalSubmit}>
              <div className="modal-field">
                <label>Quantité Consommée</label>
                <input
                  type="number"
                  value={addFormData.quantiteConso}
                  onChange={handleAddModalChange}
                  step="0.1"
                  min="0"
                  required
                  placeholder="Entrez la quantité"
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

      {detailsVisible && selectedBien && (
        <div className="modal" onClick={() => setDetailsVisible(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Détails de {selectedBien.nomBien}</h3>
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
                    <td>{detail.quantiteConso}</td>
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

export default UserBienConsommation