import { Outlet } from "react-router";
import "./App.css";
import usePresenceActivity from "./helper/usePresenceActivity";

function App() {
  usePresenceActivity();

  return <Outlet />;
}

export default App;
