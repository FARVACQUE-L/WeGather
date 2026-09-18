import "./SideBarAdmin.css";
import { LayoutDashboard, TriangleAlert } from "lucide-react";

type SideBarAdminProps = {
  activeComponent: "tableau" | "signalement";
  handleChangeComponent: (componentName: "tableau" | "signalement") => void;
};

import Logo from "../../assets/images/logo-wedoo.png";

function SideBarAdmin({
  activeComponent,
  handleChangeComponent,
}: SideBarAdminProps) {
  return (
    <nav className="sidebar-admin">
      <button
        type="button"
        className="logo-sidebar-container"
        aria-label="Aller au tableau de bord"
        onClick={() => handleChangeComponent("tableau")}
      >
        <img src={Logo} alt="logo-wedoo" className="logo-sidebar-image" />
        <h2 className="logo-sidebar-h2">
          We<i>G</i>ather <span className="logo-admin-text"> Admin</span>
        </h2>
      </button>
      <ul className="sidebar-menu">
        <li className={activeComponent === "tableau" ? "active" : ""}>
          <button
            type="button"
            onClick={() => handleChangeComponent("tableau")}
          >
            <LayoutDashboard size={20} className="layout" />
            <span>Tableau de bord</span>
          </button>
        </li>
        <li className={activeComponent === "signalement" ? "active" : ""}>
          <button
            type="button"
            onClick={() => handleChangeComponent("signalement")}
          >
            <TriangleAlert size={20} className="signal" />
            <span>Signalement</span>
          </button>
        </li>
      </ul>
    </nav>
  );
}
export default SideBarAdmin;
