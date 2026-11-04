import { Outlet, ScrollRestoration } from "react-router";
import "./App.css";

// ScrollRestoration : une nouvelle page s'ouvre en haut (ou sur l'ancre de
// son adresse, comme /confidentialite#cookies), et le retour arrière
// retrouve la position quittée.
function App() {
  return (
    <>
      <Outlet />
      <ScrollRestoration />
    </>
  );
}

export default App;
