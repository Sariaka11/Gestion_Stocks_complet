import { useState, useEffect } from "react";
import { useAuth } from "../../../Context/AuthContext";
import { getBienByAgence, createBienConsommation, addBienConsommation } from "../../../services/bienAgenceServices";
import "./css/Consommation.css";

function UserBienConsommation() {
  const { userAgenceId } = useAuth();
  const [consommations, setConsommations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    bienId: "",
    quantiteConso: "",
    dateAffectation: ""
  });
  const [biens, setBiens] = useState([]);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [selectedBien, setSelectedBien] = useState(null);
  const [detailedConsommations, setDetailedConsommations] = useState([]);

  // Charger les données
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        if (!userAgenceId) {
          setError("Aucune agence connectée.");
          setLoading(false);
          return;
        }

        // Charger les biens
        const biensResponse = await fetchBiens();
        setBiens(biensResponse || [
          { id: 1, nomBien: "Ordinateur", categorie: { nomCategorie: "Informatique" } },
          { id: 2, nomBien: "Imprimante", categorie: { nomCategorie: "Équipement" } }
        ]);

        // Charger les consommations
        const response = await getBienByAgence(userAgenceId);
        const rawData = Array.isArray(response.data) ? response.data : response.data?.["$values"] || [];

        // Regrouper par nomBien
        const groupedData = rawData.reduce((acc, item) => {
          const key = item.nomBien || item.immobilisation?.nomBien;
          if (!acc[key]) {
            acc[key] = {
              id: `${item.idBien}-${item.idAgence}`,
              bienId: item.idBien,
              nomBien: item.nomBien || item.immobilisation?.nomBien || "Inconnu",
              quantite: item.quantite,
              quantiteConso: item.quantiteConso || 0,
              categorie: item.categorie || item.immobilisation?.categorie?.nomCategorie || "Non catégorisé",
              details: [],
              immobilisation: item.immobilisation
            };
          }
          acc[key].details.push({
            quantiteConso: item.quantiteConso || 0,
            date: item.dateAffectation
          });
          return acc;
        }, {});

        setConsommations(Object.values(groupedData));
      } catch (error) {
        setError("Erreur lors du chargement des données.");
        console.error("Erreur:", error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userAgenceId]);

  // Fonction pour récupérer les biens
  const fetchBiens = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/Immobilisations");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return Array.isArray(data) ? data : data["$values"] || [];
    } catch (error) {
      console.error("Erreur lors de la récupération des biens:", error);
      return [];
    }
  };

  // Calculer l'amortissement annuel
  const calculateAmortissement = (item) => {
    const immobilisation = item.immobilisation;
    if (!immobilisation?.categorie?.dureeAmortissement || !immobilisation?.valeurAcquisition) return "N/A";
    const duree = immobilisation.categorie.dureeAmortissement;
    const valeurAcquisition = immobilisation.valeurAcquisition;
    return (valeurAcquisition / duree).toFixed(2);
  };

  // Gérer les changements dans le formulaire
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Soumettre une nouvelle consommation
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const bienId = parseInt(formData.bienId);
      const quantiteConso = parseFloat(formData.quantiteConso);
      const dateAffectation = formData.dateAffectation;

      if (isNaN(bienId) || bienId <= 0) {
        setError("Veuillez sélectionner un bien valide.");
        return;
      }
      if (isNaN(quantiteConso) || quantiteConso <= 0) {
        setError("La consommation doit être un nombre positif.");
        return;
      }
      if (!dateAffectation) {
        setError("Veuillez sélectionner une date valide.");
        return;
      }

      const response = await createBienConsommation({
        agenceId: userAgenceId,
        bienId: bienId,
        quantiteConso: quantiteConso,
        dateAffectation: dateAffectation
      });
      setConsommations((prev) => {
        const existing = prev.find(c => c.nomBien === (response.data.nomBien || response.data.immobilisation?.nomBien));
        if (existing) {
          existing.quantite = response.data.quantite;
          existing.quantiteConso = response.data.quantiteConso;
          existing.details.push({ quantiteConso: response.data.quantiteConso, date: response.data.dateAffectation });
          existing.immobilisation = response.data.immobilisation;
          return [...prev];
        }
        return [...prev, {
          id: `${response.data.idBien}-${response.data.idAgence}`,
          bienId: response.data.idBien,
          nomBien: response.data.nomBien || response.data.immobilisation?.nomBien || "Inconnu",
          quantite: response.data.quantite,
          quantiteConso: response.data.quantiteConso,
          categorie: response.data.categorie || response.data.immobilisation?.categorie?.nomCategorie,
          details: [{ quantiteConso: response.data.quantiteConso, date: response.data.dateAffectation }],
          immobilisation: response.data.immobilisation
        }];
      });
      setFormData({ bienId: "", quantiteConso: "", dateAffectation: "" });
      setShowForm(false);
      setError(null);
    } catch (error) {
      setError(`Erreur lors de la création de la consommation: ${error.message}`);
      console.error("Erreur:", error);
    }
  };

  // Ajouter une consommation à un bien existant
  const handleAddConsommation = async (bienId, nomBien) => {
    try {
      const quantiteConso = prompt("Entrez la consommation :");
      const parsedQuantiteConso = parseFloat(quantiteConso);
      if (!quantiteConso || isNaN(parsedQuantiteConso) || parsedQuantiteConso <= 0) {
        alert("Veuillez entrer une consommation valide.");
        return;
      }

      // Utiliser la date actuelle au format YYYY-MM-DD
      const dateAffectation = new Date().toISOString().split("T")[0];

      const response = await addBienConsommation({
        agenceId: userAgenceId,
        bienId,
        quantiteConso: parsedQuantiteConso,
        dateAffectation
      });
      setConsommations((prev) => {
        const existing = prev.find(c => c.nomBien === (response.data.nomBien || response.data.immobilisation?.nomBien));
        if (existing) {
          existing.quantite = response.data.quantite;
          existing.quantiteConso = response.data.quantiteConso;
          existing.details.push({ quantiteConso: response.data.quantiteConso, date: response.data.dateAffectation });
          existing.immobilisation = response.data.immobilisation;
        }
        return [...prev];
      });
    } catch (error) {
      setError("Erreur lors de l'ajout de la consommation.");
      console.error("Erreur:", error.message);
    }
  };

  // Afficher les détails
  const handleDetailsClick = (item) => {
    setSelectedBien(item);
    setDetailedConsommations(item.details);
    setDetailsVisible(true);
  };

  // Filtrer les biens pour le select
  const filteredBiens = biens.filter(bien =>
    consommations.some(c => c.bienId === (bien.idBien || bien.id))
  );

  if (loading) {
    return <div className="consommation-container"><p>Chargement en cours...</p></div>;
  }

  if (error) {
    return <div className="consommation-container"><div className="error-message">{error}</div></div>;
  }

  return (
    <div className="consommation-container">
      <div className="consommation-header">
        <h2>Mes consommations</h2>
        <button className="btn-add" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Annuler" : "Nouvelle consommation"}
        </button>
      </div>

      {showForm && (
        <div className="consommation-form">
          <form onSubmit={handleSubmit}>
            <div>
              <label>Bien</label>
              <select
                name="bienId"
                value={formData.bienId}
                onChange={handleInputChange}
                required
              >
                <option value="">Sélectionner un bien</option>
                {filteredBiens.map((bien) => (
                  <option key={bien.idBien || bien.id} value={bien.idBien || bien.id}>
                    {bien.nomBien || bien.nom}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label>Consommation</label>
              <input
                type="number"
                name="quantiteConso"
                value={formData.quantiteConso}
                onChange={handleInputChange}
                step="0.1"
                min="0"
                required
              />
            </div>
            <div>
              <label>Date</label>
              <input
                type="date"
                name="dateAffectation"
                value={formData.dateAffectation}
                onChange={handleInputChange}
                required
              />
            </div>
            <button type="submit" className="btn-submit">Ajouter</button>
            {error && <p className="error-message">{error}</p>}
          </form>
        </div>
      )}

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
            {consommations.map((item) => (
              <tr key={item.id}>
                <td>{item.nomBien}</td>
                <td>{item.quantite}</td>
                <td>{item.quantiteConso ?? "N/A"}</td>
                <td>{calculateAmortissement(item)}</td>
                <td>{item.categorie}</td>
                <td className="actions-cell">
                  <button
                    className="btn-add-cons"
                    onClick={() => handleAddConsommation(item.bienId, item.nomBien)}
                  >
                    Ajouter
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
  );
}

export default UserBienConsommation;