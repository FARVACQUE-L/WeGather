import "./Admin.css";
import { useState } from "react";
import DashboardAdmin from "../../components/DashboardAdmin/DashboardAdmin";
import DashboardReport from "../../components/DashboardReport/DashboardReport";
import NavBar from "../../components/NavBar/NavBar";
import Profil from "../../components/Profil/Profil";
import SideBarAdmin from "../../components/SideBarAdmin/SideBarAdmin";

type ActiveComponent = "tableau" | "signalement";

function Admin() {
  // Volontairement non persisté : on entre toujours par le tableau de bord,
  // quel que soit l'onglet quitté la fois précédente.
  const [activeComponent, setActiveComponent] =
    useState<ActiveComponent>("tableau");

  const handleChangeComponent = (componentName: ActiveComponent) => {
    setActiveComponent(componentName);
  };

  return (
    <>
      <NavBar />
      <Profil />
      <div className="dashboard-page-admin">
        <SideBarAdmin
          activeComponent={activeComponent}
          handleChangeComponent={handleChangeComponent}
        />
        <main className="content">
          {activeComponent === "tableau" && <DashboardAdmin />}
          {activeComponent === "signalement" && <DashboardReport />}
        </main>
      </div>
    </>
  );
}
export default Admin;
