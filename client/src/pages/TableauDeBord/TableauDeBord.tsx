import { useState } from "react";
import Dashboard from "../../components/Dashboard/Dashboard.tsx";
import Galerie from "../../components/Galerie/Galerie";
import Messagerie from "../../components/Messagerie/Messagerie";
import NavBar from "../../components/NavBar/NavBar.tsx";
import SideBar from "../../components/SideBar/SideBar";

import "./TableauDeBord.css";

import Budget from "../../components/Budget/Budget.tsx";
import Profil from "../../components/Profil/Profil.tsx";
import Reservation from "../../components/Reservation/Reservation.tsx";

type ActiveComponent =
  | "tableau"
  | "messagerie"
  | "reservation"
  | "budget"
  | "galerie";

function TableauDeBord() {
  // Volontairement non persisté : on entre toujours dans un événement par son
  // tableau de bord, quel que soit l'onglet quitté la fois précédente.
  const [activeComponent, setActiveComponent] =
    useState<ActiveComponent>("tableau");

  const handleChangeComponent = (componentName: ActiveComponent) => {
    setActiveComponent(componentName);
  };

  return (
    <>
      <NavBar />
      <Profil />
      <div className="dashboard-page">
        <SideBar
          activeComponent={activeComponent}
          handleChangeComponent={handleChangeComponent}
        />
        <main className="content">
          {activeComponent === "tableau" && <Dashboard />}
          {activeComponent === "messagerie" && <Messagerie />}
          {activeComponent === "reservation" && <Reservation />}
          {activeComponent === "budget" && <Budget />}
          {activeComponent === "galerie" && <Galerie />}
        </main>
      </div>
    </>
  );
}
export default TableauDeBord;
