"use client"
import DashboardGraphs from "../../../components/DashboardGraphs"
import "./css/Suivi.css"

function SuiviStock() {
  return (
    <div className="suivi-stock-container">
      {/* Header avec titre */}
      {/* <div className="suivi-stock-header">
        <h1 className="suivi-stock-title">Suivi des Stocks</h1>
        <p className="suivi-stock-subtitle">
          Tableau de bord analytique pour le suivi en temps réel de vos stocks et inventaires
        </p>
      </div> */}

      {/* Graphiques */}
      <div className="suivi-stock-graphs">
        <DashboardGraphs />
      </div>
    </div>
  )
}

export default SuiviStock
