// "use client"

// import { useState, useEffect } from "react"
// import { NavLink, useLocation } from "react-router-dom"
// import {  Package, ChevronDown, ChevronRight, Building2, User } from "lucide-react"
// import "../admin/Sidebar.css"


// function UserSidebar({ isOpen }) {
//   const [consommablesOpen, setConsommablesOpen] = useState(false)
//   const [immobiliersOpen, setImmobiliersOpen] = useState(false)
//   const location = useLocation()

//   // Ouvre automatiquement les sections liées à la route active
//   useEffect(() => {
//     if (location.pathname.includes("/user/consommables")) {
//       setConsommablesOpen(true)
//     }
//     if (location.pathname.includes("/user/immobiliers")) {
//       setImmobiliersOpen(true)
//     }
//   }, [location])

//   return (
//     <aside className={`app-sidebar ${isOpen ? "open" : "closed"}`}>
//       {/* Navigation */}
//       <nav className="sidebar-nav">
//         <ul className="nav-list">
//           {/* Consommables */}
//           <li className="nav-item">
//             <button
//               className={`nav-link dropdown-toggle ${consommablesOpen ? "open" : ""}`}
//               onClick={() => setConsommablesOpen(!consommablesOpen)}
//             >
//               <Package className="nav-icon" size={20} />
//               <span>Consommables</span>
//               <span className="dropdown-icon">
//                 {consommablesOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
//               </span>
//             </button>
//             <ul className={`sub-nav-list ${consommablesOpen ? "open" : ""}`}>
//               <li className="sub-nav-item">
//                 <NavLink
//                   to="/user/consommables/stock"
//                   className={({ isActive }) => isActive ? "sub-nav-link active" : "sub-nav-link"}
//                 >
//                   Stock
//                 </NavLink>
//               </li>
//               <li className="sub-nav-item">
//                 <NavLink
//                   to="/user/consommables/consommation"
//                   className={({ isActive }) => isActive ? "sub-nav-link active" : "sub-nav-link"}
//                 >
//                   Consommation
//                 </NavLink>
//               </li>
//               {/* <li className="sub-nav-item">
//                 <NavLink
//                   to="/user/consommables/demande"
//                   className={({ isActive }) => isActive ? "sub-nav-link active" : "sub-nav-link"}
//                 >
//                   Demande
//                 </NavLink>
//               </li> */}
//             </ul>
//           </li>

//           {/* Immobiliers */}
//           <li className="nav-item">
//             <button
//               className={`nav-link dropdown-toggle ${immobiliersOpen ? "open" : ""}`}
//               onClick={() => setImmobiliersOpen(!immobiliersOpen)}
//             >
//               <Building2 className="nav-icon" size={20} />
//               <span>Immobiliers</span>
//               <span className="dropdown-icon">
//                 {immobiliersOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
//               </span>
//             </button>
//             <ul className={`sub-nav-list ${immobiliersOpen ? "open" : ""}`}>
//               <li className="sub-nav-item">
//                 <NavLink
//                   to="/user/immobiliers/stock"
//                   className={({ isActive }) => isActive ? "sub-nav-link active" : "sub-nav-link"}
//                 >
//                   Stock
//                 </NavLink>
//               </li>
//               <li className="sub-nav-item">
//                 <NavLink
//                   to="/user/immobiliers/consommation"
//                   className={({ isActive }) => isActive ? "sub-nav-link active" : "sub-nav-link"}
//                 >
//                   Consommation
//                 </NavLink>
//               </li>
//               {/* <li className="sub-nav-item">
//                 <NavLink
//                   to="/user/immobiliers/demande"
//                   className={({ isActive }) => isActive ? "sub-nav-link active" : "sub-nav-link"}
//                 >
//                   Demande
//                 </NavLink>
//               </li> */}
//             </ul>
//           </li>

//           {/* Profil */}
//           <li className="nav-item">
//             <NavLink
//               to="/user/profil"
//               className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
//             >
//               <User className="nav-icon" size={20} />
//               <span>Profil</span>
//             </NavLink>
//           </li>
//         </ul>
//       </nav>

//       {/* Pied de page */}
//       <div className="sidebar-footer">
//         <div className="user-info">
//           <div className="user-avatar">U</div>
//           <div className="user-details">
//             <div className="user-name">Utilisateur</div>
//             <div className="user-role">Utilisateur</div>
//           </div>
//         </div>
//       </div>
//     </aside>
//   )
// }

// export default UserSidebar