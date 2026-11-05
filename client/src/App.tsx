import { Outlet, ScrollRestoration } from "react-router";
import "./App.css";

function App() {
  return (
    <>
      <Outlet />
      <ScrollRestoration />
    </>
  );
}

export default App;
