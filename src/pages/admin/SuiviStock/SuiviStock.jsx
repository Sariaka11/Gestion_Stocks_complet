"use client"
import DashboardGraphs from "../../../components/DashboardGraphs"
import "./css/Suivi.css"

function SuiviStock() {
  return (
    <div className="suivi-stock-container">
     {/* Graphiques */}
      <div className="suivi-stock-graphs">
        <DashboardGraphs />
      </div>
    </div>
  )
}

export default SuiviStock
