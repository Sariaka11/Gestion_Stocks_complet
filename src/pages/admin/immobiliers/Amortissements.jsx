import { useState, useEffect } from "react";
import { Search, Filter, FileDown, Calculator, RefreshCw, AlertCircle } from "lucide-react";
import "./css/Amortissements.css";
import { getImmobiliers } from "../../../services/immobilierServices";
import { getAmortissements, calculerTableauAmortissement } from "../../../services/amortissementServices";
import { getCategories } from "../../../services/categorieServices";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

function Amortissements() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filtreDesignation, setFiltreDesignation] = useState("");
  const [filtreType, setFiltreType] = useState("");
  const [modalOuvert, setModalOuvert] = useState(false);
  const [immobilierSelectionne, setImmobilierSelectionne] = useState(null);
  const [immobiliers, setImmobiliers] = useState([]);
  const [amortissements, setAmortissements] = useState([]);
  const [categories, setCategories] = useState([]);

  // Charger les données au démarrage
  useEffect(() => {
    chargerDonnees();
    getCategories()
      .then((response) => {
        setCategories(response.data);
      })
      .catch((error) => {
        console.error("Erreur lors du chargement des catégories", error);
      });
  }, []);

  // Fonction pour charger toutes les données
  const chargerDonnees = async () => {
    setLoading(true);
    try {
      // Charger les immobiliers
      const immobiliersRes = await getImmobiliers();
      console.log("Données immobiliers brutes:", immobiliersRes.data);

      // Déterminer le format des données
      let immobiliersData = immobiliersRes.data;

      // Vérifier si les données sont dans un format spécifique (comme $values)
      if (immobiliersRes.data && typeof immobiliersRes.data === "object" && "$values" in immobiliersRes.data) {
        immobiliersData = immobiliersRes.data.$values;
      }

      // S'assurer que immobiliersData est un tableau
      if (!Array.isArray(immobiliersData)) {
        console.warn("Les données immobiliers reçues ne sont pas un tableau:", immobiliersData);
        immobiliersData = [];
      }

      // Transformer les données pour l'affichage
      const immobiliersTransformes = immobiliersData.map((item) => {
        const dateAcquisition = new Date(item.dateAcquisition || new Date());
        const today = new Date();
        const isNewThisYear = dateAcquisition.getFullYear() === today.getFullYear();

        // Calculer la VNC et l'amortissement cumulé
        let amortissementCumule = item.amortissementCumule || 0;
        let valeurNetteComptable = item.valeurNetteComptable || item.valeurAcquisition || 0;

        // Si le bien est acquis cette année, pas d'amortissement pour l'année en cours
        if (isNewThisYear) {
          amortissementCumule = 0;
          valeurNetteComptable = item.valeurAcquisition || 0;
        }

        return {
          id: item.idBien,
          codeArticle: `IMM-${String(item.idBien).padStart(3, "0")}`,
          designation: item.nomBien || "",
          typeImmobilier: item.categorie?.nomCategorie || "Non catégorisé",
          dateAcquisition: item.dateAcquisition?.split("T")[0] || "",
          dateFinAmortissement: item.dateFinAmortissement?.split("T")[0] || "",
          prixAchat: item.valeurAcquisition || 0,
          dureeAmortissement: item.categorie?.dureeAmortissement || 5,
          statut: isNewThisYear || valeurNetteComptable > 0 ? "Actif" : "Amorti",
          valeurNetteComptable,
          amortissementCumule,
          amortissements: item.amortissements
            ? item.amortissements.map((amort) => ({
                annee: amort.annee,
                baseAmortissable: item.valeurAcquisition,
                dotation: amort.montant,
                valeurNetteComptable: amort.valeurResiduelle,
                amortissementCumule: item.amortissements
                  .slice(0, item.amortissements.findIndex((a) => a.annee === amort.annee) + 1)
                  .reduce((sum, a) => sum + a.montant, 0),
              }))
            : [],
        };
      });

      console.log("Données immobiliers transformées:", immobiliersTransformes);

      // Pour chaque immobilier, si pas d'amortissements dans l'API, calculer le tableau théorique
      const immobiliersAvecAmortissements = immobiliersTransformes.map((immobilier) => {
        if (immobilier.amortissements.length === 0) {
          // Calculer un tableau d'amortissement théorique
          const tableauAmortissement = calculerTableauAmortissement(immobilier);
          return {
            ...immobilier,
            amortissements: tableauAmortissement.map((amort) => ({
              ...amort,
              amortissementCumule: tableauAmortissement
                .slice(0, tableauAmortissement.findIndex((a) => a.annee === amort.annee) + 1)
                .reduce((sum, a) => sum + a.dotation, 0),
            })),
          };
        }
        return immobilier;
      });

      setImmobiliers(immobiliersAvecAmortissements);

      // Charger les amortissements supplémentaires si nécessaire
      const amortissementsRes = await getAmortissements();

      // Déterminer le format des données
      let amortissementsData = amortissementsRes.data;

      // Vérifier si les données sont dans un format spécifique (comme $values)
      if (
        amortissementsRes.data &&
        typeof amortissementsRes.data === "object" &&
        "$values" in amortissementsRes.data
      ) {
        amortissementsData = amortissementsRes.data.$values;
      }

      // S'assurer que amortissementsData est un tableau
      if (!Array.isArray(amortissementsData)) {
        console.warn("Les données amortissements reçues ne sont pas un tableau:", amortissementsData);
        amortissementsData = [];
      }

      setAmortissements(amortissementsData);
    } catch (err) {
      console.error("Erreur lors du chargement des données:", err);
      setError("Impossible de charger les données. Veuillez réessayer plus tard.");
    } finally {
      setLoading(false);
    }
  };

  // Ouvrir le modal de détails d’amortissement
  const ouvrirModal = (immobilier) => {
    setImmobilierSelectionne(immobilier);
    setModalOuvert(true);
  };

  // Fermer le modal
  const fermerModalOuvert = () => {
    setModalOuvert(false);
    setImmobilierSelectionne(null);
  };

  // Formater le prix pour l'interface
  const formaterPrix = (valeur) => {
    return valeur.toLocaleString("fr-FR", { style: "currency", currency: "MGA" }).replace("MGA", "Ar");
  };

  // Formater le prix pour le PDF
  const formaterPrixPDF = (valeur) => {
    return valeur.toString() + " Ar";
  };

  // Exporter les données globales en PDF
  const exporterDonnees = () => {
    try {
      const doc = new jsPDF();

      // Ajouter un titre
      doc.setFontSize(16);
      doc.text("Amortissements des immobilisations", 14, 20);

      // Ajouter la date
      const today = new Date().toLocaleDateString("fr-FR");
      doc.setFontSize(12);
      doc.text(`Date d'exportation : ${today}`, 14, 30);

      // Préparer les données pour le tableau
      const tableData = immobiliersFiltres.map((item) => [
        item.codeArticle,
        item.designation,
        item.typeImmobilier,
        item.dateAcquisition,
        `${item.dureeAmortissement} ans`,
        formaterPrixPDF(item.amortissementCumule),
        formaterPrixPDF(item.valeurNetteComptable),
        item.valeurNetteComptable === 0 ? "Amorti" : "Actif",
      ]);

      // Créer le tableau avec AutoTable
      autoTable(doc, {
        startY: 40,
        head: [
          [
            "Code Article",
            "Désignation",
            "Type",
            "Date d'acquisition",
            "Durée d'amortissement",
            "Amortissement cumulé",
            "Valeur nette comptable",
            "État",
          ],
        ],
        body: tableData,
        theme: "striped",
        headStyles: { fillColor: [41, 128, 185], textColor: 255, fontSize: 10 },
        styles: { fontSize: 9 },
        columnStyles: {
          0: { cellWidth: 20 },
          1: { cellWidth: 40 },
          2: { cellWidth: 30 },
          3: { cellWidth: 20 },
          4: { cellWidth: 20 },
          5: { cellWidth: 25 },
          6: { cellWidth: 25 },
          7: { cellWidth: 15 },
        },
      });

      // Enregistrer le PDF
      doc.save(`amortissements_${today.replace(/\//g, "-")}.pdf`);
    } catch (error) {
      console.error("Erreur lors de l'exportation en PDF :", error);
      alert("Une erreur s'est produite lors de l'exportation. Veuillez réessayer.");
    }
  };

  // Exporter les détails de l'immobilisation sélectionnée en PDF
  const exporterDetails = () => {
    if (!immobilierSelectionne) return;

    try {
      const doc = new jsPDF();

      // Ajouter un titre
      doc.setFontSize(16);
      doc.text(`Tableau d'amortissement - ${immobilierSelectionne.designation}`, 14, 20);

      // Ajouter les informations générales
      doc.setFontSize(12);
      let y = 30;
      doc.text("Informations générales", 14, y);
      y += 10;

      const infoData = [
        ["Code Article", immobilierSelectionne.codeArticle],
        ["Type", immobilierSelectionne.typeImmobilier],
        ["Date d'acquisition", immobilierSelectionne.dateAcquisition],
        ["Prix d'achat", formaterPrixPDF(immobilierSelectionne.prixAchat)],
        ["Durée d'amortissement", `${immobilierSelectionne.dureeAmortissement} ans`],
        ["Date de fin d'amortissement", immobilierSelectionne.dateFinAmortissement || "Non calculée"],
        ["Taux annuel", `${(100 / immobilierSelectionne.dureeAmortissement).toFixed(2)}%`],
        ["Statut actuel", immobilierSelectionne.valeurNetteComptable === 0 ? "Amorti" : "Actif"],
      ];

      autoTable(doc, {
        startY: y,
        body: infoData,
        theme: "plain",
        styles: { fontSize: 10, cellPadding: 2 },
        columnStyles: { 0: { fontStyle: "bold", cellWidth: 50 }, 1: { cellWidth: 100 } },
      });

      // Ajouter le tableau d'amortissement
      y = doc.lastAutoTable.finalY + 10;
      doc.setFontSize(12);
      doc.text("Tableau d'amortissement", 14, y);
      y += 10;

      const tableData = immobilierSelectionne.amortissements
        .slice()
        .sort((a, b) => a.annee - b.annee)
        .map((item) => [
          item.annee,
          formaterPrixPDF(item.baseAmortissable),
          formaterPrixPDF(item.dotation),
          formaterPrixPDF(item.amortissementCumule),
          formaterPrixPDF(item.valeurNetteComptable),
        ]);

      // Ajouter la ligne de total
      tableData.push([
        "Total",
        "-",
        formaterPrixPDF(immobilierSelectionne.amortissements.reduce((sum, a) => sum + a.dotation, 0)),
        formaterPrixPDF(immobilierSelectionne.amortissementCumule),
        formaterPrixPDF(immobilierSelectionne.valeurNetteComptable),
      ]);

      autoTable(doc, {
        startY: y,
        head: [["Année", "Base amortissable", "Dotation annuelle", "Amortissement cumulé", "Valeur nette comptable"]],
        body: tableData,
        theme: "striped",
        headStyles: { fillColor: [41, 128, 185], textColor: 255, fontSize: 10 },
        styles: { fontSize: 9 },
        columnStyles: {
          0: { cellWidth: 20 },
          1: { cellWidth: 35 },
          2: { cellWidth: 35 },
          3: { cellWidth: 35 },
          4: { cellWidth: 35 },
        },
      });

      // Enregistrer le PDF
      const fileName = `amortissement_${immobilierSelectionne.codeArticle}_${new Date()
        .toLocaleDateString("fr-FR")
        .replace(/\//g, "-")}.pdf`;
      doc.save(fileName);
    } catch (error) {
      console.error("Erreur lors de l'exportation des détails en PDF :", error);
      alert("Une erreur s'est produite lors de l'exportation des détails. Veuillez réessayer.");
    }
  };

  // Filtrer les immobiliers
  const immobiliersFiltres = immobiliers.filter((item) => {
    const matchDesignation =
      (item.designation || "").toLowerCase().includes(filtreDesignation.toLowerCase()) ||
      (item.codeArticle || "").toLowerCase().includes(filtreDesignation.toLowerCase());
    const matchType = filtreType === "" || (item.typeImmobilier || "").toLowerCase() === filtreType.toLowerCase();
    return matchDesignation && matchType;
  });

  return (
    <div className="amortissements-container">
      {loading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p>Chargement en cours...</p>
        </div>
      )}

      <h2 className="page-title">Amortissements des immobilisations</h2>

      {error && (
        <div className="error-message">
          <AlertCircle size={20} />
          <span>{error}</span>
          <button onClick={chargerDonnees}>
            <RefreshCw size={16} /> Réessayer
          </button>
        </div>
      )}

      <div className="amortissements-filters">
        <div className="filter-group">
          <label>
            <Search size={16} /> Recherche:
          </label>
          <input
            type="text"
            placeholder="Rechercher par désignation ou code..."
            value={filtreDesignation}
            onChange={(e) => setFiltreDesignation(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label>
            <Filter size={16} /> Type:
          </label>
          <select value={filtreType} onChange={(e) => setFiltreType(e.target.value)}>
            <option value="">Toutes les catégories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.nomCategorie}>
                {cat.nomCategorie}
              </option>
            ))}
          </select>
        </div>

        <button className="btn-export" onClick={exporterDonnees}>
          <FileDown size={16} /> Exporter
        </button>
      </div>

      <div className="amortissements-table-container">
        <table className="amortissements-table">
          <thead>
            <tr>
              <th>Code Article</th>
              <th>Désignation</th>
              <th className="type">Type</th>
              <th>Date d'acquisition</th>
              <th>Durée d'amortissement</th>
              <th>Amortissement cumulé</th>
              <th>Valeur nette comptable</th>
              <th>État</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {immobiliersFiltres.length > 0 ? (
              immobiliersFiltres.map((item) => (
                <tr key={item.id}>
                  <td>{item.codeArticle}</td>
                  <td>{item.designation}</td>
                  <td className="type">{item.typeImmobilier}</td>
                  <td>{item.dateAcquisition}</td>
                  <td>{item.dureeAmortissement} ans</td>
                  <td>{formaterPrix(item.amortissementCumule)}</td>
                  <td>{formaterPrix(item.valeurNetteComptable)}</td>
                  <td>
                    <span className={`etat-amortissement ${item.valeurNetteComptable === 0 ? "amorti" : "actif"}`}>
                      {item.valeurNetteComptable === 0 ? "Amorti" : "Actif"}
                    </span>
                  </td>
                  <td className="actions-cell">
                    <button className="btn-detail" onClick={() => ouvrirModal(item)}>
                      <Calculator size={16} /> Détails
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="9" className="no-data">
                  {loading ? "Chargement..." : "Aucun immobilier trouvé pour les critères sélectionnés."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de détail d'amortissement */}
      {modalOuvert && immobilierSelectionne && (
        <div className="modal-overlay">
          <div className="modal-contenu modal-large">
            <h2>Tableau d'amortissement - {immobilierSelectionne.designation}</h2>

            <div className="amortissement-info">
              <div className="info-group">
                <span className="info-label">Code Article:</span>
                <span className="info-value">{immobilierSelectionne.codeArticle}</span>
              </div>
              <div className="info-group">
                <span className="info-label">Type:</span>
                <span className="info-value">{immobilierSelectionne.typeImmobilier}</span>
              </div>
              <div className="info-group">
                <span className="info-label">Date d'acquisition:</span>
                <span className="info-value">{immobilierSelectionne.dateAcquisition}</span>
              </div>
              <div className="info-group">
                <span className="info-label">Prix d'achat:</span>
                <span className="info-value">{formaterPrixPDF(immobilierSelectionne.prixAchat)} Ar</span>
              </div>
              <div className="info-group">
                <span className="info-label">Durée d'amortissement:</span>
                <span className="info-value">{immobilierSelectionne.dureeAmortissement} ans</span>
              </div>
              <div className="info-group">
                <span className="info-label">Date de fin d'amortissement:</span>
                <span className="info-value">{immobilierSelectionne.dateFinAmortissement || "Non calculée"}</span>
              </div>
            </div>

            <div className="amortissement-details">
              <h3>Informations sur l'amortissement</h3>
              <ul>
                <li>
                  <strong>Méthode :</strong> Amortissement linéaire basé sur la durée d'amortissement.
                </li>
                <li>
                  <strong>Taux annuel :</strong>{" "}
                  {(100 / immobilierSelectionne.dureeAmortissement).toFixed(2)}% (calculé comme 100 /
                  durée).
                </li>
                <li>
                  <strong>Statut actuel :</strong>{" "}
                  {immobilierSelectionne.valeurNetteComptable === 0 ? "Amorti" : "Actif"}.
                </li>
                <li>
                  <strong>Date de fin :</strong> L'immobilisation sera totalement amortie le{" "}
                  {immobilierSelectionne.dateFinAmortissement || "non défini"}.
                </li>
              </ul>
            </div>

            <div className="tableau-amortissement-container">
              <table className="tableau-amortissement">
                <thead>
                  <tr>
                    <th>Année</th>
                    <th>Base amortissable</th>
                    <th>Dotation annuelle</th>
                    <th>Amortissement cumulé</th>
                    <th>Valeur nette comptable</th>
                  </tr>
                </thead>
                <tbody>
                  {immobilierSelectionne.amortissements
                    .slice()
                    .sort((a, b) => a.annee - b.annee)
                    .map((amort, index) => (
                      <tr key={index}>
                        <td>{amort.annee}</td>
                        <td>{formaterPrix(amort.baseAmortissable)}</td>
                        <td>{formaterPrix(amort.dotation)}</td>
                        <td>{formaterPrix(amort.amortissementCumule)}</td>
                        <td>{formaterPrix(amort.valeurNetteComptable)}</td>
                      </tr>
                    ))}
                  <tr className="total-row">
                    <td>
                      <strong>Total</strong>
                    </td>
                    <td>-</td>
                    <td>
                      <strong>
                        {formaterPrixPDF(
                          immobilierSelectionne.amortissements.reduce((sum, a) => sum + a.dotation, 0)
                        )}{" "}
                        Ar
                      </strong>
                    </td>
                    <td>
                      <strong>{formaterPrixPDF(immobilierSelectionne.amortissementCumule)} Ar</strong>
                    </td>
                    <td>
                      <strong>{formaterPrixPDF(immobilierSelectionne.valeurNetteComptable)} Ar</strong>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="actions-modal">
              <button className="bouton-fermer" onClick={fermerModalOuvert}>
                Fermer
              </button>
              <button className="bouton-exporter" onClick={exporterDetails}>
                <FileDown size={16} /> Exporter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Amortissements;