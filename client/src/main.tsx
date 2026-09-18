import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider, createBrowserRouter } from "react-router";

import Admin from "../src/pages/Admin/Admin";
import App from "./App";
import DashboardReport from "./components/DashboardReport/DashboardReport";
import AuthRequire from "./helper/AuthRequire";
import AuthRequireAdmin from "./helper/AuthRequireAdmin";
import AdminReport from "./pages/AdminReport/AdminReport";
import ChangePassword from "./pages/ChangePassword/ChangePassword";
import Connexion from "./pages/Connexion/Connexion";
import ForgetPassword from "./pages/ForgetPassword/ForgetPassword";
import HomeEvents from "./pages/HomeEvents/HomeEvents";
import PageCGV from "./pages/PageCGV/PageCGV";
import Presentation from "./pages/Presentation/Presentation";
import Register from "./pages/Register/Register";
import ResetPassword from "./pages/ResetPassword/ResetPassword";
import TableauDeBord from "./pages/TableauDeBord/TableauDeBord";
import UserReport from "./pages/UserReport/UserReport";

const router = createBrowserRouter([
  {
    element: <App />,
    children: [
      { path: "/", element: <Presentation /> },
      {
        path: "/homeevents",
        element: (
          <AuthRequire>
            <HomeEvents />
          </AuthRequire>
        ),
      },
      {
        path: "/tableaudebord/:eventUuid",
        element: (
          <AuthRequire>
            <TableauDeBord />
          </AuthRequire>
        ),
      },
      {
        path: "/connexion",
        element: <Connexion />,
      },
      {
        path: "/register",
        element: <Register />,
      },
      {
        path: "/forgetpassword",
        element: <ForgetPassword />,
      },
      {
        path: "/resetpassword",
        element: <ResetPassword />,
      },
      {
        path: "/events/:eventUuid/report",
        element: (
          <AuthRequire>
            <UserReport />
          </AuthRequire>
        ),
      },
      {
        path: "/admin",
        element: (
          <AuthRequireAdmin>
            <Admin />
          </AuthRequireAdmin>
        ),
      },
      {
        path: "/changepassword",
        element: <ChangePassword />,
      },
      {
        path: "/dashboardreport",
        element: (
          <AuthRequireAdmin>
            <DashboardReport />
          </AuthRequireAdmin>
        ),
      },
      {
        path: "/admin/report/:type/:id",
        element: (
          <AuthRequireAdmin>
            <AdminReport />
          </AuthRequireAdmin>
        ),
      },
      {
        path: "/CGV",
        element: (
          <AuthRequire>
            <PageCGV />
          </AuthRequire>
        ),
      },
    ],
  },
]);

const rootElement = document.getElementById("root");
if (rootElement == null) {
  throw new Error(`Your HTML Document should contain a <div id="root"></div>`);
}

createRoot(rootElement).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
