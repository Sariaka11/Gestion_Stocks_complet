// ✅ Inventaire.jsx — version fonctionnelle basée sur la logique du Dispatche.jsx

"use client";

import { useEffect, useState } from "react";
import { getFournitures } from "../../../services/fournituresServices";
import {  getAgenceFournitures } from "../../../services/agenceFournituresServices";
import "./css/Inventaire.css";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";



function Inventaire() {
  const [fournitures, setFournitures] = useState([]);
  const [agenceFournitures, setAgenceFournitures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtreDate, setFiltreDate] = useState("");

  const exporterPDF = () => {
  try {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.setTextColor(150, 0, 0);
    doc.text(" Stock Enregistrés", 14, 15);

    const stockData = fournitures
      .filter((f) => !filtreDate || f.date?.startsWith(filtreDate))
      .map((f) => [
        f.nom,
        f.categorie,
        f.quantite,
        f.quantiteRestante,
        f.prixUnitaire?.toFixed(2),
        f.montant?.toFixed(2),
        f.date?.split("T")[0],
      ]);

    autoTable(doc, {
      head: [["Désignation", "Catégorie", "Qtt Ajoutée", "Qtt Restante", "PU", "Montant", "Date"]],
      body: stockData,
      startY: 20,
    });

    const yAfterStock = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(16);
    doc.text(" Répartition vers les Agences", 14, yAfterStock);

    const dispatchData = agenceFournitures
      .filter((af) => !filtreDate || af.dateAssociation?.startsWith(filtreDate))
      .map((af) => [
        af.fourniture?.nom || "-",
        af.agence?.nom || "-",
        af.quantite,
        af.dateAssociation?.split("T")[0],
      ]);

    autoTable(doc, {
      head: [["Fourniture", "Agence", "Quantité", "Date"]],
      body: dispatchData,
      startY: yAfterStock + 5,
    });

    doc.save("inventaire.pdf");
  } catch (error) {
    console.error("Erreur génération PDF :", error);
    alert("Une erreur est survenue lors de l'export.");
  }
};

  useEffect(() => {
    setLoading(true);

    Promise.all([getFournitures(), getAgenceFournitures()])
      .then(([resF, resAF]) => {
        const rawFournitures = Array.isArray(resF.data)
          ? resF.data
          : resF.data?.["$values"] || [];

        const rawAgenceFournitures = Array.isArray(resAF.data)
          ? resAF.data
          : resAF.data?.["$values"] || [];

        setFournitures(rawFournitures);
        setAgenceFournitures(rawAgenceFournitures);
      })
      .catch((err) => console.error("Erreur chargement:", err))
      .finally(() => setLoading(false));
    }, []);

  return (
    <div className="page-inventaire animation-inventaire">
      {loading ? (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p>Chargement en cours...</p>
        </div>
      ) : (
        <>
          <h1 className="titre-page">Résumé des Opérations</h1>
           <div className="filtre-barre">
              <label style={{ marginRight: "0.5rem" }}>Filtrer par date :</label>
              <input
                type="date"
                value={filtreDate}
                onChange={(e) => setFiltreDate(e.target.value)}
              />
            </div>

              <button onClick={exporterPDF}  className="bouton-export-pdf">
  📄 Exporter en PDF
</button>

          <section className="section-stock">
            <h2>📦 Stock enregistrés</h2>
            <div className="tableau-inventaire-wrapper">
              <table className="table-inventaire">
                <thead>
                  <tr>
                    <th>Désignation</th>
                    <th>Catégorie</th>
                    <th>Quantité Ajoutée</th>
                    <th>Quantité Restante</th>
                    <th>Prix Unitaire</th>
                    <th>Montant</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {fournitures
                      .filter((f) =>
                        !filtreDate || f.date?.startsWith(filtreDate)
                      )
                      .map((f) => (
                          <tr key={f.id}>
                        <td>{f.nom}</td>
                        <td>{f.categorie}</td>
                        <td>{f.quantite}</td>
                        <td>{f.quantiteRestante}</td>
                        <td>{f.prixUnitaire?.toFixed(2)}</td>
                        <td>{f.montant?.toFixed(2)}</td>
                        <td>{f.date?.split("T")[0]}</td>
                      </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="section-dispatch">
            <h2>🚚 Répartition vers les Agences</h2>
            <div className="tableau-inventaire-wrapper">
              <table className="table-inventaire">
                <thead>
                  <tr>
                    <th>Fourniture</th>
                    <th>Agence</th>
                    <th>Quantité Envoyée</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                 {agenceFournitures
                        .filter((af) =>
                          !filtreDate || af.dateAssociation?.startsWith(filtreDate)
                        )
                        .map((af, index) => ( 
                      <tr key={index}>
                        <td>{af.fourniture?.nom || "-"}</td>
                        <td>{af.agence?.nom || "-"}</td>
                        <td>{af.quantite ?? "-"}</td>
                        <td>{af.date_Association?.split("T")[0] ?? "-"}</td>
                          </tr>
                        ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

export default Inventaire;
