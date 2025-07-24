"use client";

import { useEffect, useState } from "react";
import { getAgenceFournitures } from "../../../services/fournituresServices";
import { useAuth } from "../../../Context/AuthContext";
import "./css/Stock.css";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

function UserStock() {
  const [stockItems, setStockItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [detailedItems, setDetailedItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("Tous");

  const { userAgenceId, isAuthLoading } = useAuth();

  useEffect(() => {
    const fetchStock = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await getAgenceFournitures(userAgenceId);
        const rawData = Array.isArray(response.data)
          ? response.data
          : response.data?.["$values"] || [];

        const groupedData = rawData.reduce((acc, item) => {
          const key = item.fournitureNom;
          if (!acc[key]) {
            acc[key] = {
              id: item.id,
              nom: key,
              quantite: 0,
              quantiteConso: 0,
              categorie: item.categorie || "Non catégorisé",
              disponible: false,
              details: [],
            };
          }
          acc[key].quantite += item.quantite;
          acc[key].quantiteConso += item.consoMm || 0;
          acc[key].disponible = acc[key].quantite > 0;
          acc[key].details.push({
            quantite: item.quantite,
            date: item.dateAssociation,
            quantiteConso: item.consoMm || 0,
          });
          return acc;
        }, {});

        setStockItems(Object.values(groupedData));
      } catch (err) {
        console.error("Erreur lors de la récupération des données :", err);
        setError("Erreur lors du chargement du stock. Veuillez réessayer.");
      } finally {
        setLoading(false);
      }
    };

    // Vérifier si l'authentification est terminée et si userAgenceId est défini
    if (!isAuthLoading && userAgenceId) {
      fetchStock();
    } else if (!isAuthLoading && userAgenceId === null) {
      // Si userAgenceId est explicitement null, afficher une erreur
      setError("Aucune agence associée à votre compte. Veuillez contacter l'administrateur.");
      setLoading(false);
    }
    // Si isAuthLoading est true, attendre sans rien faire
  }, [isAuthLoading, userAgenceId]);

  const handleDetailsClick = (item) => {
    setSelectedItem(item);
    setDetailedItems(item.details);
    setDetailsVisible(true);
  };

  const filteredStockItems =
    selectedCategory === "Tous"
      ? stockItems
      : stockItems.filter((item) => item.categorie === selectedCategory);

  const exportToPDF = () => {
    const doc = new jsPDF();
    autoTable(doc, {
      head: [["ID", "Nom", "Quantité", "Quantité Consommée", "Catégorie", "Disponibilité"]],
      body: filteredStockItems.map((item) => [
        item.id,
        item.nom,
        item.quantite,
        item.quantiteConso || 0,
        item.categorie,
        item.disponible ? "Disponible" : "Indisponible",
      ]),
      styles: { fontSize: 10 },
      margin: { top: 20 },
    });
    doc.save("stock_report.pdf");
  };

  if (isAuthLoading) {
    return (
      <div className="user-stock-container">
        <div className="loading-overlay">
          <p>Chargement de l'authentification...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="user-stock-container">
        <div className="loading-overlay">
          <p>Chargement du stock...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="user-stock-container">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  const categories = ["Tous", ...new Set(stockItems.map((item) => item.categorie))];

  return (
    <div className="user-stock-container">
      <div className="user-stock-header">
        <h2>Stock des consommables disponibles</h2>
        <div className="user-stock-actions">
          <div className="category-filter">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="category-select"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          <button className="btn-export" onClick={exportToPDF}>
            Exporter en PDF
          </button>
        </div>
      </div>

      <div className="user-stock-table-container">
        <table className="user-stock-table">
          <thead>
            <tr>
              <th>Nom</th>
              <th>Quantité</th>
              <th>Quantité Consommée</th>
              <th>Catégorie</th>
              <th>Disponibilité</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredStockItems.map((item) => (
              <tr key={item.id}>
                <td>{item.nom}</td>
                <td>{item.quantite}</td>
                <td>{item.quantiteConso || 0}</td>
                <td>{item.categorie}</td>
                <td>
                  <span
                    className={`status-badge ${
                      item.disponible ? "disponible" : "indisponible"
                    }`}
                  >
                    {item.disponible ? "Disponible" : "Indisponible"}
                  </span>
                </td>
                <td className="actions-cell">
                  <button
                    className="btn-details"
                    onClick={() => handleDetailsClick(item)}
                  >
                    Détails
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {detailsVisible && selectedItem && (
        <div className="modal" onClick={() => setDetailsVisible(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Détails de {selectedItem.nom}</h3>
            <table className="details-table">
              <thead>
                <tr>
                  <th>Quantité</th>
                  <th>Quantité Consommée</th>
                  <th>Date d'association</th>
                </tr>
              </thead>
              <tbody>
                {detailedItems.map((detail, index) => (
                  <tr key={index}>
                    <td>{detail.quantite}</td>
                    <td>{detail.quantiteConso || 0}</td>
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

export default UserStock;