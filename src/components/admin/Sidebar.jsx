"use client"

import { useState, useEffect } from "react"
import { NavLink, useLocation } from "react-router-dom"
//import stockImage from '../../assets/logo.png'
import {
  Package,
  ChevronDown,
  ChevronRight,
  Building2,
  BarChart3,
  Users,
} from "lucide-react"
import "./Sidebar.css"

function Sidebar({ isOpen }) {
  const [consommablesOpen, setConsommablesOpen] = useState(false)
  const [immobiliersOpen, setImmobiliersOpen] = useState(false)
  const location = useLocation()

  // Ouvre automatiquement les sections liées à la route active
  useEffect(() => {
    if (location.pathname.includes("/admin/consommables")) {
      setConsommablesOpen(true)
    }
    if (location.pathname.includes("/admin/immobiliers")) {
      setImmobiliersOpen(true)
    }
  }, [location])

  return (
    <aside className={`app-sidebar ${isOpen ? "open" : "closed"}`}>
      {/* Logo */}
      {/* <div className="sidebar-header">
        <div className="logo">
          <img src={stockImage} alt="Logo" className="logo-icon" />
          <span className="logo-text">Gestion Stock</span>
        </div>
      </div> */}

      {/* Navigation principale */}
      <nav className="sidebar-nav">
        <ul className="nav-list">

          {/* Suivi des stocks */}
          <li className="nav-item">
            <NavLink
              to="/admin/suivi-stock"
              className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
            >
              <BarChart3 className="nav-icon" size={20} />
              <span>Suivi des Stocks</span>
            </NavLink>
          </li>

          {/* Consommables */}
          <li className="nav-item">
            <button
              className={`nav-link dropdown-toggle ${consommablesOpen ? "open" : ""}`}
              onClick={() => setConsommablesOpen(!consommablesOpen)}
            >
              <Package className="nav-icon" size={20} />
              <span>Gestion des Consommables</span>
              <span className="dropdown-icon">
                {consommablesOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </span>
            </button>
            <ul className={`sub-nav-list ${consommablesOpen ? "open" : ""}`}>
              <li className="sub-nav-item">
                <NavLink
                  to="/admin/consommables/stock"
                  className={({ isActive }) => isActive ? "sub-nav-link active" : "sub-nav-link"}
                >
                  Stock
                </NavLink>
              </li>
              <li className="sub-nav-item">
                <NavLink
                  to="/admin/consommables/inventaire"
                  className={({ isActive }) => isActive ? "sub-nav-link active" : "sub-nav-link"}
                >
                  Inventaire
                </NavLink>
              </li>
              <li className="sub-nav-item">
                <NavLink
                  to="/admin/consommables/dispatche"
                  className={({ isActive }) => isActive ? "sub-nav-link active" : "sub-nav-link"}
                >
                  Dispatche
                </NavLink>
              </li>
            </ul>
          </li>

          {/* Immobiliers */}
          <li className="nav-item">
            <button
              className={`nav-link dropdown-toggle ${immobiliersOpen ? "open" : ""}`}
              onClick={() => setImmobiliersOpen(!immobiliersOpen)}
            >
              <Building2 className="nav-icon" size={20} />
              <span>Gestion des Immobiliers</span>
              <span className="dropdown-icon">
                {immobiliersOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </span>
            </button>
            <ul className={`sub-nav-list ${immobiliersOpen ? "open" : ""}`}>
              <li className="sub-nav-item">
                <NavLink
                  to="/admin/immobiliers/stock"
                  className={({ isActive }) => isActive ? "sub-nav-link active" : "sub-nav-link"}
                >
                  Stock
                </NavLink>
              </li>
              <li className="sub-nav-item">
                <NavLink
                  to="/admin/immobiliers/inventaire"
                  className={({ isActive }) => isActive ? "sub-nav-link active" : "sub-nav-link"}
                >
                  Inventaire
                </NavLink>
              </li>
              <li className="sub-nav-item">
                <NavLink
                  to="/admin/immobiliers/dispatche"
                  className={({ isActive }) => isActive ? "sub-nav-link active" : "sub-nav-link"}
                >
                  Dispatche
                </NavLink>
              </li>
              <li className="sub-nav-item">
                <NavLink
                  to="/admin/immobiliers/amortissements"
                  className={({ isActive }) => isActive ? "sub-nav-link active" : "sub-nav-link"}
                >
                  Amortissements
                </NavLink>
              </li>
            </ul>
          </li>

          {/* Utilisateurs */}
          <li className="nav-item">
            <NavLink
              to="/admin/GestionUtilisateurs"
              className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
            >
              <Users className="nav-icon" size={20} />
              <span>Gestion des Utilisateurs</span>
            </NavLink>
          </li>

          <li className="nav-item">
            <NavLink
              to="/admin/register"
              className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
            >
              <Users className="nav-icon" size={20} />
              <span>Inscription</span>
            </NavLink>
          </li>

        </ul>
      </nav>

      {/* Pied de page */}
      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">A</div>
          <div className="user-details">
            <div className="user-name">Admin</div>
            <div className="user-role">Administrateur</div>
          </div>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
