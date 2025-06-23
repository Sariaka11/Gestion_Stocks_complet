"use client"

import { useState, useEffect } from "react"
import { NavLink, useLocation } from "react-router-dom"
import { Package, ChevronDown, ChevronRight, Building2, BarChart3, Users, UserPlus, LogOut, X } from "lucide-react"
import { useAuth } from "../../Context/AuthContext"
import "./ModernSidebar.css"

function ModernSidebar({ isOpen, onToggle, userType = "admin" }) {
  const [consommablesOpen, setConsommablesOpen] = useState(false)
  const [immobiliersOpen, setImmobiliersOpen] = useState(false)
  const location = useLocation()
  const { logout } = useAuth()

  // Ouvre automatiquement les sections liées à la route active
  useEffect(() => {
    if (location.pathname.includes("/consommables")) {
      setConsommablesOpen(true)
    }
    if (location.pathname.includes("/immobiliers")) {
      setImmobiliersOpen(true)
    }
  }, [location])

  const handleLogout = () => {
    logout()
    window.location.href = "/auth/login"
  }

  // Configuration des menus selon le type d'utilisateur
  const getMenuConfig = () => {
    if (userType === "admin") {
      return {
        userInfo: {
          name: "Admin",
          role: "Administrateur",
          avatar: "A",
          badge: "PRO",
        },
        menuItems: [
          {
            id: "suivi",
            icon: BarChart3,
            label: "Suivi des Stocks",
            path: "/admin/suivi-stock",
          },
          {
            id: "consommables",
            icon: Package,
            label: "Gestion des Consommables",
            hasSubmenu: true,
            submenu: [
              { label: "Stock", path: "/admin/consommables/stock" },
              { label: "Inventaire", path: "/admin/consommables/inventaire" },
              { label: "Dispatche", path: "/admin/consommables/dispatche" },
            ],
          },
          {
            id: "immobiliers",
            icon: Building2,
            label: "Gestion des Immobiliers",
            hasSubmenu: true,
            submenu: [
              { label: "Stock", path: "/admin/immobiliers/stock" },
              { label: "Inventaire", path: "/admin/immobiliers/inventaire" },
              { label: "Dispatche", path: "/admin/immobiliers/dispatche" },
              { label: "Amortissements", path: "/admin/immobiliers/amortissements" },
            ],
          },
          {
            id: "users",
            icon: Users,
            label: "Gestion des Utilisateurs",
            path: "/admin/GestionUtilisateurs",
          },
          {
            id: "register",
            icon: UserPlus,
            label: "Inscription",
            path: "/admin/register",
          },
        ],
      }
    } else {
      return {
        userInfo: {
          name: "Utilisateur",
          role: "utilisateur",
          avatar: "U",
        },
        menuItems: [
          {
            id: "consommables",
            icon: Package,
            label: "Consommables",
            hasSubmenu: true,
            submenu: [
              { label: "Stock", path: "/user/consommables/stock" },
              { label: "Consommation", path: "/user/consommables/consommation" },
            ],
          },
          {
            id: "immobiliers",
            icon: Building2,
            label: "Immobiliers",
            hasSubmenu: true,
            submenu: [
              { label: "Stock", path: "/user/immobiliers/stock" },
              { label: "Consommation", path: "/user/immobiliers/consommation" },
            ],
          },
          {
            id: "profil",
            icon: Users,
            label: "Profil",
            path: "/user/profil",
          },
        ],
      }
    }
  }

  const config = getMenuConfig()

  const toggleSubmenu = (menuId) => {
    if (menuId === "consommables") {
      setConsommablesOpen(!consommablesOpen)
    } else if (menuId === "immobiliers") {
      setImmobiliersOpen(!immobiliersOpen)
    }
  }

  const getSubmenuState = (menuId) => {
    if (menuId === "consommables") return consommablesOpen
    if (menuId === "immobiliers") return immobiliersOpen
    return false
  }

  return (
    <>
      {/* Overlay pour mobile */}
      {isOpen && <div className="sidebar-overlay" onClick={onToggle}></div>}

      {/* Sidebar */}
      <aside className={`modern-sidebar ${isOpen ? "open" : "closed"}`}>
        {/* Header avec profil utilisateur */}
        <div className="sidebar-header">
          <div className="user-profile">
            <div className="user-avatar">
              <span>{config.userInfo.avatar}</span>
              {config.userInfo.badge && <div className="user-badge">{config.userInfo.badge}</div>}
            </div>
            {isOpen && (
              <div className="user-info">
                <div className="user-name">{config.userInfo.name}</div>
                <div className="user-role">{config.userInfo.role}</div>
              </div>
            )}
          </div>

          {/* Bouton de fermeture pour mobile */}
          <button className="sidebar-close-btn" onClick={onToggle}>
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="sidebar-navigation">
          <ul className="nav-menu">
            {config.menuItems.map((item) => {
              const Icon = item.icon
              const isSubmenuOpen = getSubmenuState(item.id)

              return (
                <li key={item.id} className="nav-item">
                  {item.hasSubmenu ? (
                    <>
                      <button
                        className={`nav-button ${isSubmenuOpen ? "active" : ""}`}
                        onClick={() => toggleSubmenu(item.id)}
                        title={!isOpen ? item.label : ""}
                      >
                        <div className="nav-icon">
                          <Icon size={20} />
                        </div>
                        {isOpen && (
                          <>
                            <span className="nav-label">{item.label}</span>
                            <div className="nav-arrow">
                              {isSubmenuOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                            </div>
                          </>
                        )}
                      </button>

                      {/* Submenu */}
                      {isOpen && (
                        <ul className={`nav-submenu ${isSubmenuOpen ? "open" : ""}`}>
                          {item.submenu.map((subItem, index) => (
                            <li key={index} className="nav-subitem">
                              <NavLink
                                to={subItem.path}
                                className={({ isActive }) => `nav-sublink ${isActive ? "active" : ""}`}
                              >
                                <span className="nav-sublabel">{subItem.label}</span>
                              </NavLink>
                            </li>
                          ))}
                        </ul>
                      )}
                    </>
                  ) : (
                    <NavLink
                      to={item.path}
                      className={({ isActive }) => `nav-button ${isActive ? "active" : ""}`}
                      title={!isOpen ? item.label : ""}
                    >
                      <div className="nav-icon">
                        <Icon size={20} />
                      </div>
                      {isOpen && <span className="nav-label">{item.label}</span>}
                    </NavLink>
                  )}
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Footer avec déconnexion */}
        <div className="sidebar-footer">
          <button className="logout-button" onClick={handleLogout} title={!isOpen ? "Déconnexion" : ""}>
            <div className="nav-icon">
              <LogOut size={20} />
            </div>
            {isOpen && <span className="nav-label">Déconnexion</span>}
          </button>
        </div>
      </aside>
    </>
  )
}

export default ModernSidebar
