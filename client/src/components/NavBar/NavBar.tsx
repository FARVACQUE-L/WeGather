import Logo from "../../assets/images/logo-wedoo.png";
import "./NavBar.css";
import { Link, useLocation } from "react-router";

function NavBar() {
  const location = useLocation();
  const navbarDesktop =
    location.pathname.startsWith("/homeevents") ||
    location.pathname.startsWith("/events/") ||
    location.pathname.startsWith("/cgv") ||
    location.pathname.startsWith("/admin/report");
  const isAdmin = location.pathname.startsWith("/admin");

  return (
    <nav className={navbarDesktop ? "desktop" : "mobile"}>
      <Link to="/homeevents" className="logo-sidebar-container">
        <img src={Logo} alt="logo-wedoo" className="logo-sidebar-image" />
        <h2 className="logo-sidebar-h2">
          We<i>G</i>ather
          {isAdmin && <span className="logo-admin-text"> Admin</span>}
        </h2>
      </Link>
    </nav>
  );
}
export default NavBar;
