import "./Presentation.css";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import logo from "../../assets/images/logo-wegather.png";

type User = {
  id: number;
};

function Presentation() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/auth/authVerif`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        setCurrentUser(data);
        setLoading(false);
      })
      .catch(() => {
        setCurrentUser(null);
        setLoading(false);
      });
  }, []);

  return (
    <div className="presentation-content">
      <div className="navbar-presentation">
        <section>
          <img src={logo} alt="logo-wegather" />
          <h1 className="title-presentation">
            We<i>G</i>ather
          </h1>
        </section>
        <button
          type="button"
          onClick={() => {
            if (loading) return;

            if (!currentUser?.id) {
              navigate("/connexion");
              return;
            }

            navigate("/homeevents");
          }}
        >
          Se connecter
        </button>
      </div>
      <section className="presentation-page page-hero">
        <div className="text-presentation">
          <h1 className="h1-organisez">Organisez</h1>
          <h1 className="h1-inoubliable">l'inoubliable</h1>
          <button
            type="button"
            onClick={() => {
              if (loading) return;

              if (!currentUser?.id) {
                navigate("/connexion");
                return;
              }

              navigate("/homeevents");
            }}
          >
            Créez un évenement
          </button>

          <p>Créez, gérez et partagez avec WeGather en toute simplicité.</p>
        </div>
      </section>
    </div>
  );
}

export default Presentation;
