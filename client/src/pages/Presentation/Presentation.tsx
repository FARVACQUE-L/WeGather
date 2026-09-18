import "./Presentation.css";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import budget from "../../assets/images/logo-feature-budget.png";
import gallerie from "../../assets/images/logo-feature-gallerie.png";
import messagerie from "../../assets/images/logo-feature-messagerie.png";
import reservation from "../../assets/images/logo-feature-reservation.png";
import todo from "../../assets/images/logo-feature-todo.png";
import note from "../../assets/images/logo-info-note.png";
import user from "../../assets/images/logo-info-user.png";
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
      <section className="presentation-page page-features">
        <div className="features-wegather-presentation">
          <div className="feature-presentation-1">
            <img
              src={messagerie}
              alt="logo-feature"
              className="logo-feature-presentation"
            />
            <h4>Messagerie</h4>
            <p>
              Communiquez facilement avec vos invités directement dans vos
              évenenements.
            </p>
          </div>
          <div className="feature-presentation-2">
            <img
              src={reservation}
              alt="logo-feature"
              className="logo-feature-presentation"
            />
            <h4>Plannification Intuitive</h4>
            <p>Plannifier vos évenements en quelques clics.</p>
          </div>
          <div className="feature-presentation-3">
            <img
              src={budget}
              alt="logo-feature"
              className="logo-feature-presentation"
            />
            <h4>Suivi de Budget</h4>
            <p>
              Les bons comptes font les bons amis, suivez votre budget en temps
              réel.
            </p>
          </div>
          <div className="feature-presentation-4">
            <img
              src={gallerie}
              alt="logo-feature"
              className="logo-feature-presentation"
            />
            <h4>Galerie Partagée</h4>
            <p>
              Centralisez les souvenirs de votre évenement dans une galerie
              partagée accessible à tous vos invités.
            </p>
          </div>
          <div className="feature-presentation-5">
            <img
              src={todo}
              alt="logo-feature"
              className="logo-feature-presentation"
            />
            <h4>Liste de Taches</h4>
            <p>
              Ne manquez aucun details grace à notre liste de taches
              collaborative.
            </p>
          </div>
        </div>
      </section>
      <section className="presentation-page page-cards">
        <div className="exemple-cards-presentation">
          <h2 className="title-cards-presentation">
            Organisé pour chaque Occasion
          </h2>
          <p>
            Des dinners intimes aux grands galas, orchetrez chaque details pour
            profiter du moment
          </p>
          <div className="cards-presentation">
            <div className="card-presentation-1">
              <h2>Escapade Romantique</h2>
              <p>Couché de soleil, champagne et toast dans une villa pour 2.</p>
            </div>
            <div className="card-presentation-2">
              <h2>Camping entre Amis</h2>
              <p>
                Partagez un moment autour d'un feu et dormez sous la belle
                etoile.
              </p>
            </div>
            <div className="card-presentation-3">
              <h2>Evenement d'entreprise</h2>
              <p>Organisez des conventions, formation et bien plus encore.</p>
            </div>
            <div className="card-presentation-4">
              <h2>Retraite Bien-etre</h2>
              <p>Offrez vous une pause bien méritée.</p>
            </div>
          </div>
        </div>
      </section>
      <section className="presentation-page page-infos">
        <div className="infos-wegather-presentation">
          <div className="info-wegather-presentation">
            <img src={reservation} alt="logo-info" />
            <h4>500+</h4>
            <p>Evenement crée</p>
          </div>
          <div className="info-wegather-presentation">
            <img src={user} alt="logo-info" />
            <h4>12K</h4>
            <p>Utilisateurs</p>
          </div>
          <div className="info-wegather-presentation">
            <img src={note} alt="logo-info" />
            <h4>4.9/5</h4>
            <p>Satisfaction</p>
          </div>
        </div>
        <footer className="footer-presentation">
          <p>copyright 2026 WeGather. Tous droits réservés.</p>
          <Link to="/cgv" className="footer-presentation-link">
            CGV
          </Link>
        </footer>
      </section>
    </div>
  );
}

export default Presentation;
