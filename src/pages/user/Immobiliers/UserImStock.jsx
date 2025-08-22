"use client";

import { useState, useEffect } from "react";
import { getBienByAgence } from "../../../services/bienAgenceServices";
import { useAuth } from "../../../Context/AuthContext";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import "./css/Stock.css";

function UserStock() {
  const [stockItems, setStockItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("Toutes");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const { user, userAgenceId, isAuthLoading } = useAuth();

  console.log("Rendu de UserStock, user:", user, "userAgenceId:", userAgenceId, "isAuthLoading:", isAuthLoading);

  useEffect(() => {
    const fetchStock = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log("Appel de fetchStock avec userAgenceId:", userAgenceId);
        const response = await getBienByAgence(userAgenceId);
        console.log("Données brutes reçues :", response);
        const stockData = response.data;

        if (!Array.isArray(stockData)) {
          throw new Error("Les données reçues ne sont pas un tableau.");
        }

        // Regrouper les données par idBien, categorie et fonction
        const groupedStockData = stockData.reduce((acc, item) => {
          const key = `${item.IdBien}-${item.Categorie}-${item.Fonction || "N/A"}`;
          if (!acc[key]) {
            acc[key] = {
              idBien: item.IdBien,
              nomBien: item.NomBien || "N/A",
              categorie: item.Categorie || "N/A",
              fonction: item.Fonction || "N/A",
              quantite: 0,
              quantiteConso: 0,
              nomAgence: item.NomAgence || "N/A",
            };
          }
          acc[key].quantite += Number(item.Quantite) || 0;
          acc[key].quantiteConso += Number(item.QuantiteConso) || 0;
          return acc;
        }, {});

        // Convertir l'objet regroupé en tableau
        const uniqueStockData = Object.values(groupedStockData);
        console.log("Données regroupées par idBien, categorie, fonction :", uniqueStockData);

        setStockItems(uniqueStockData);
        setFilteredItems(uniqueStockData);
        const uniqueCategories = ["Toutes", ...new Set(uniqueStockData.map(item => item.categorie))];
        setCategories(uniqueCategories);
      } catch (err) {
        console.error("Erreur dans fetchStock :", err);
        setError("Erreur lors de la récupération des données : " + err.message);
      } finally {
        setLoading(false);
      }
    };

    if (isAuthLoading) {
      console.log("Authentification en cours, en attente...");
    } else if (!userAgenceId) {
      console.log("Aucun userAgenceId disponible:", { user, userAgenceId });
      setError("Aucune agence associée à votre compte. Veuillez contacter l'administrateur.");
      setLoading(false);
    } else {
      console.log("Authentification terminée, lancement de fetchStock...");
      fetchStock();
    }
  }, [isAuthLoading, userAgenceId]);

  useEffect(() => {
    if (selectedCategory === "Toutes") {
      setFilteredItems(stockItems);
    } else {
      setFilteredItems(stockItems.filter(item => item.categorie === selectedCategory));
    }
  }, [selectedCategory, stockItems]);

  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(`Rapport des Biens par Agence${selectedCategory !== "Toutes" ? ` - ${selectedCategory}` : ""}`, 14, 20);

    autoTable(doc, {
      head: [["Nom du Bien", "Catégorie", "Fonction", "Quantité", "Quantité Consommée", "Disponibilité"]],
      body: filteredItems.map(item => [
        item.NomBien || "N/A",
        item.Categorie || "N/A",
        item.Fonction || "N/A",
        item.Quantite || 0,
        item.QuantiteConso || 0,
        item.Quantite > 0 ? "Disponible" : "Indisponible",
      ]),
      startY: 30,
      styles: {
        fontSize: 10,
        cellPadding: 3,
        overflow: "linebreak",
      },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      alternateRowStyles: {
        fillColor: [240, 240, 240],
      },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 30 },
        2: { cellWidth: 30 },
        3: { cellWidth: 20 },
        4: { cellWidth: 30 },
        5: { cellWidth: 30 },
      },
    });

    const date = new Date().toISOString().slice(0, 10);
    const fileName = `stock_biens_report_${date}${selectedCategory !== "Toutes" ? `_${selectedCategory}` : ""}.pdf`;
    doc.save(fileName);
  };

  const openDetails = (item) => {
    setSelectedItem(item);
  };

  const closeDetails = () => {
    setSelectedItem(null);
  };

  if (isAuthLoading) {
    return <div className="loading-overlay">Chargement de l'authentification...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (loading) {
    return <div className="loading-overlay">Chargement des données...</div>;
  }

  return (
    <div className="user-imstock-container">
      <div className="user-imstock-header">
        <h2>Stock des Biens</h2>
        <div className="user-imstock-actions">
          <div className="search-bar">
            <div className="category-filter">
              <select
                className="category-select"
                value={selectedCategory}
                onChange={handleCategoryChange}
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button className="btn-export" onClick={exportToPDF}>
            Exporter en PDF
          </button>
        </div>
      </div>
      <div className="user-imstock-table-container">
        <table className="user-imstock-table">
          <thead>
            <tr>
              <th>Nom du Bien</th>
              <th>Catégorie</th>
              <th>Fonction</th>
              <th>Quantité</th>
              <th>Quantité Consommée</th>
              <th>Disponibilité</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((item, index) => (
              <tr key={`${item.idBien}-${item.categorie}-${item.fonction}-${index}`}>
                <td>{item.nomBien}</td>
                <td>{item.categorie}</td>
                <td>{item.fonction}</td>
                <td>{item.quantite}</td>
                <td>{item.quantiteConso || 0}</td>
                <td>
                  <span className={`status-badge ${item.quantite > 0 ? "disponible" : "indisponible"}`}>
                    {item.quantite > 0 ? "Disponible" : "Indisponible"}
                  </span>
                </td>
                <td className="actions-cell">
                  <button className="btn-details" onClick={() => openDetails(item)}>
                    Détails
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {selectedItem && (
        <div className="modal">
          <div className="modal-content">
            <h3>Détails du Bien</h3>
            <table className="details-table">
              <tbody>
                <tr>
                  <th>Nom du Bien</th>
                  <td>{selectedItem.nomBien}</td>
                </tr>
                <tr>
                  <th>Agence</th>
                  <td>{selectedItem.nomAgence}</td>
                </tr>
                <tr>
                  <th>Catégorie</th>
                  <td>{selectedItem.categorie}</td>
                </tr>
                <tr>
                  <th>Fonction</th>
                  <td>{selectedItem.fonction}</td>
                </tr>
                <tr>
                  <th>Quantité</th>
                  <td>{selectedItem.quantite}</td>
                </tr>
                <tr>
                  <th>Quantité Consommée</th>
                  <td>{selectedItem.quantiteConso || 0}</td>
                </tr>
              </tbody>
            </table>
            <button className="btn-close" onClick={closeDetails}>
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserStock;