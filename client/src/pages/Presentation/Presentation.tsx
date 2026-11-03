import "./Presentation.css";
import {
  ArrowUpRight,
  BadgeEuro,
  Book,
  CalendarPlus,
  Check,
  Heart,
  Images,
  LayoutDashboard,
  type LucideIcon,
  MessagesSquare,
  Minus,
  Plus,
  Sparkles,
  Sun,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import occasionFete from "../../assets/images/img-occasion-fete.jpg";
import occasionPro from "../../assets/images/img-occasion-pro.png";
import occasionVacances from "../../assets/images/img-occasion-vacances.jpg";
import screenshotBudget from "../../assets/images/img-presentation-budget.png";
import screenshotDashboard from "../../assets/images/img-presentation-dashboard.png";
import screenshotGalerie from "../../assets/images/img-presentation-galerie.jpg";
import hero from "../../assets/images/img-presentation-hero.png";
import screenshotMessagerie from "../../assets/images/img-presentation-messagerie.png";
import screenshotReservations from "../../assets/images/img-presentation-reservations.jpg";
import logo from "../../assets/images/logo-wegather.png";

type User = {
  id: number;
};

const iconProps = {
  color: "#a53b22",
  strokeWidth: 1.7,
  absoluteStrokeWidth: true,
};

const features: { icon: LucideIcon; label: string }[] = [
  { icon: LayoutDashboard, label: "Tableau de bord" },
  { icon: MessagesSquare, label: "Messagerie" },
  { icon: Book, label: "Réservations" },
  { icon: BadgeEuro, label: "Budget" },
  { icon: Images, label: "Galerie" },
];

const occasions = [
  {
    image: occasionFete,
    category: "Soirées & repas",
    title: "La vie se fête.",
    description:
      "Un anniversaire, un dîner improvisé, une soirée qui se prolonge.",
  },
  {
    image: occasionVacances,
    category: "Week-ends & vacances",
    title: "L’ailleurs se prépare.",
    description:
      "Un week-end entre amis, des vacances en famille ou une escapade solo.",
  },
  {
    image: occasionPro,
    category: "Événements professionnels",
    title: "L’équipe se retrouve.",
    description:
      "Un séminaire, un déjeuner d’équipe, un moment hors du bureau.",
  },
];

const steps: {
  number: string;
  icon: LucideIcon;
  title: string;
  description: string;
}[] = [
  {
    number: "01",
    icon: CalendarPlus,
    title: "Lancez l’idée",
    description:
      "Créez votre événement en précisant le lieu et les dates. Ou rejoignez un événement avec votre invitation.",
  },
  {
    number: "02",
    icon: Users,
    title: "Réunissez les envies",
    description:
      "Invitez vos proches ou vos collègues. Retrouvez les infos et préparez la suite dans votre espace commun.",
  },
  {
    number: "03",
    icon: Sun,
    title: "Vivez le moment",
    description:
      "Réservations, dépenses, souvenirs : tout reste ensemble. Vous n’avez plus qu’à en profiter.",
  },
];

const faq = [
  {
    question: "Comment rejoindre un événement ?",
    answer:
      "Cliquez sur « Rejoindre un événement », puis utilisez le lien ou le code transmis par l’organisateur. Une fois l’événement rejoint, retrouvez votre tableau de bord et les outils de votre groupe.",
  },
  {
    question: "Est-ce adapté aux événements professionnels ?",
    answer:
      "Oui. Séminaires, déjeuners d’équipe ou conventions : invitez vos collègues, partagez le programme et centralisez les réservations dans le même espace.",
  },
  {
    question: "Puis-je organiser un événement en solo ?",
    answer:
      "Bien sûr. Programme, réservations, dépenses et photos restent réunis au même endroit, même si vous partez seul.",
  },
  {
    question: "Où retrouver mes réservations et mes dépenses ?",
    answer:
      "Dans l’espace de votre événement : l’onglet Réservations rassemble vos billets et confirmations, et l’onglet Budget suit qui a payé quoi.",
  },
];

function Presentation() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [openQuestion, setOpenQuestion] = useState<string | null>(
    faq[0].question,
  );

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

  const goToEvents = () => {
    if (loading) return;

    if (!currentUser?.id) {
      navigate("/connexion");
      return;
    }

    navigate("/homeevents");
  };

  return (
    <div className="presentation-content">
      <header className="navbar-presentation">
        <div className="brand-presentation">
          <img src={logo} alt="logo-wegather" />
          <span>
            We<i>G</i>ather
          </span>
        </div>
        <nav className="links-presentation">
          <a href="#possibilites">Les possibilités</a>
          <a href="#comment-ca-marche">Comment ça marche</a>
          <a href="#fonctionnalites">Les fonctionnalités</a>
        </nav>
        <button
          type="button"
          className="action-presentation"
          onClick={goToEvents}
        >
          Créer un événement
          <ArrowUpRight
            size={18}
            color="white"
            strokeWidth={1.7}
            absoluteStrokeWidth
          />
        </button>
      </header>

      <section className="hero-presentation">
        <div className="promise-presentation">
          <p className="label-presentation signature-presentation">
            <Sparkles size={17} {...iconProps} />
            Moins d’organisation, plus de moments.
          </p>
          <h1>
            Les bons moments commencent <span>bien avant.</span>
          </h1>
          <p className="hero-description-presentation">
            Une soirée, un voyage, un projet d’équipe : réunissez les bonnes
            personnes et toute l’organisation au même endroit. À plusieurs, ou
            juste pour vous.
          </p>
          <button
            type="button"
            className="action-presentation"
            onClick={goToEvents}
          >
            Créer un événement
            <ArrowUpRight
              size={18}
              color="white"
              strokeWidth={1.7}
              absoluteStrokeWidth
            />
          </button>
          <p className="hint-presentation">
            Déjà invité ? Retrouvez votre groupe avec son code.
          </p>
        </div>
        <div className="moments-presentation">
          <img
            src={hero}
            alt="Un dîner en terrasse, un feu de camp entre amis et un afterwork sur un toit"
          />
          <div className="invitation-presentation">
            <span className="symbol-presentation">
              <Heart size={20} {...iconProps} />
            </span>
            <div>
              <p>Vous organisez. Vous vous retrouvez. Vous profitez.</p>
              <p>Wegather s’occupe de garder le fil.</p>
            </div>
          </div>
        </div>
      </section>

      <div className="features-strip-presentation">
        <p>Un événement, un espace partagé.</p>
        {features.map(({ icon: Icon, label }) => (
          <span key={label}>
            <Icon size={18} {...iconProps} />
            {label}
          </span>
        ))}
      </div>

      <section id="possibilites" className="occasions-presentation">
        <div className="intro-presentation">
          <div>
            <p className="label-presentation">
              Pour les petits et les grands plans
            </p>
            <h2>Il y a toujours une bonne raison de se retrouver.</h2>
          </div>
          <p className="intro-description-presentation">
            Personnel ou professionnel, à deux, à vingt ou en solo : faites de
            la place à vos envies.
          </p>
        </div>
        <div className="occasion-cards-presentation">
          {occasions.map((occasion) => (
            <article
              key={occasion.title}
              className="occasion-card-presentation"
            >
              <img src={occasion.image} alt="" />
              <div className="occasion-text-presentation">
                <p className="occasion-category-presentation">
                  {occasion.category}
                </p>
                <div className="occasion-title-presentation">
                  <h3>{occasion.title}</h3>
                </div>
                <p>{occasion.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="comment-ca-marche" className="steps-presentation">
        <div className="steps-intro-presentation">
          <p className="label-presentation">
            Du « on fait quoi ? » au « on y est ! »
          </p>
          <h2>Trois étapes. Et c’est parti.</h2>
        </div>
        <div className="steps-list-presentation">
          {steps.map(({ number, icon: Icon, title, description }) => (
            <div key={number} className="step-presentation">
              <div className="step-marker-presentation">
                <span>{number}</span>
                <Icon size={27} {...iconProps} />
              </div>
              <h3>{title}</h3>
              <p>{description}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="fonctionnalites" className="space-presentation">
        <div className="space-intro-presentation">
          <p className="label-presentation">Tout au même endroit. Enfin.</p>
          <h2>
            Les messages ici. Les billets là.
            <br />
            Et si on réunissait tout ?
          </h2>
          <p>
            Dès que vous créez ou rejoignez un événement, votre espace est prêt.
            Cinq outils qui se complètent, du premier plan aux derniers
            souvenirs.
          </p>
        </div>

        <div className="dashboard-presentation">
          <div className="dashboard-text-presentation">
            <p className="label-presentation">01 / 05 · Tableau de bord</p>
            <h3>Une vue d’ensemble. L’esprit plus léger.</h3>
            <p>
              Dates, lieu, participants et programme : les informations
              essentielles de votre événement sont réunies dans un tableau de
              bord partagé.
            </p>
            <p className="benefit-presentation">
              <Check size={18} {...iconProps} />
              Tout le monde garde le fil.
            </p>
          </div>
          <img
            className="dashboard-preview-presentation"
            src={screenshotDashboard}
            alt="Tableau de bord de l’événement Week-end en Provence : dates, participants, réservations récentes, budget et to-do list"
            loading="lazy"
          />
        </div>

        <div className="tools-presentation">
          <article className="tool-presentation">
            <div className="tool-marker-presentation">
              <MessagesSquare size={24} {...iconProps} />
              <span>02 / 05</span>
            </div>
            <h3>Le bon message, à la bonne personne.</h3>
            <p className="tool-description-presentation">
              Échangez en direct avec les membres de l’événement. Une question,
              un détail à caler : la conversation reste à portée de main.
            </p>
            <img
              className="tool-preview-presentation"
              src={screenshotMessagerie}
              alt="Conversation de groupe dans la messagerie de l’événement"
              loading="lazy"
            />
          </article>

          <article className="tool-presentation">
            <div className="tool-marker-presentation">
              <Book size={24} {...iconProps} />
              <span>03 / 05</span>
            </div>
            <h3>Vos réservations vous suivent.</h3>
            <p className="tool-description-presentation">
              Rassemblez billets et confirmations dans l’onglet Réservations. Le
              train, le logement, les activités : retrouvez l’essentiel au bon
              moment.
            </p>
            <img
              className="tool-preview-presentation"
              src={screenshotReservations}
              alt="Page Réservations avec la prochaine réservation, les filtres et les cartes train, restaurant et activité"
              loading="lazy"
            />
          </article>

          <article className="tool-presentation">
            <div className="tool-marker-presentation">
              <BadgeEuro size={24} {...iconProps} />
              <span>04 / 05</span>
            </div>
            <h3>Les bons comptes font les bons moments.</h3>
            <p className="tool-description-presentation">
              Ajoutez les dépenses et répartissez les frais avec le tricount
              intégré. Chacun sait ce qu’il a payé et ce qu’il lui reste à
              régler.
            </p>
            <img
              className="tool-preview-presentation"
              src={screenshotBudget}
              alt="Page Budget avec le solde, les dépenses de chacun et les équilibres"
              loading="lazy"
            />
          </article>

          <article className="tool-presentation">
            <div className="tool-marker-presentation">
              <Images size={24} {...iconProps} />
              <span>05 / 05</span>
            </div>
            <h3>Le moment passe. Les souvenirs restent.</h3>
            <p className="tool-description-presentation">
              Retrouvez les photos de l’événement dans une galerie commune. Les
              grands moments et les petits détails, vus par chacun.
            </p>
            <img
              className="tool-preview-presentation"
              src={screenshotGalerie}
              alt="Galerie de l’événement avec les photos du week-end"
              loading="lazy"
            />
          </article>
        </div>

        <p className="mention-presentation">
          Aperçus illustratifs d’un événement fictif : « Week-end en Provence ».
          Illustrations réalisées par IA.
        </p>
      </section>

      <section id="faq" className="faq-presentation">
        <div className="faq-intro-presentation">
          <p className="label-presentation">On vous éclaire</p>
          <h2>Encore une petite question ?</h2>
          <p>
            L’essentiel pour faire le premier pas et préparer votre prochain bon
            moment.
          </p>
        </div>
        <div className="faq-list-presentation">
          {faq.map(({ question, answer }) => {
            const isOpen = openQuestion === question;
            return (
              <div
                key={question}
                className={`faq-item-presentation${isOpen ? " open" : ""}`}
              >
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpenQuestion(isOpen ? null : question)}
                >
                  {question}
                  {isOpen ? (
                    <Minus size={20} {...iconProps} />
                  ) : (
                    <Plus size={20} {...iconProps} />
                  )}
                </button>
                {isOpen && <p>{answer}</p>}
              </div>
            );
          })}
        </div>
      </section>

      <section className="cta-presentation">
        <Sparkles size={30} {...iconProps} />
        <h2>
          Le prochain bon moment ?
          <br />
          C’est vous qui le lancez.
        </h2>
        <p>Une idée suffit. Wegather vous aide à lui donner vie.</p>
        <button
          type="button"
          className="action-presentation"
          onClick={goToEvents}
        >
          Créer mon événement
          <ArrowUpRight
            size={18}
            color="white"
            strokeWidth={1.7}
            absoluteStrokeWidth
          />
        </button>
      </section>

      <footer className="footer-presentation">
        <div className="footer-nav-presentation">
          <div className="footer-brand-presentation">
            <div className="brand-presentation">
              <img src={logo} alt="logo-wegather" />
              <span>
                We<i>G</i>ather
              </span>
            </div>
            <p>Moins de choses à coordonner. Plus de moments à partager.</p>
          </div>
          <div className="footer-column-presentation">
            <p>Explorer Wegather</p>
            <a href="#possibilites">Les possibilités</a>
            <a href="#comment-ca-marche">Comment ça marche</a>
            <a href="#fonctionnalites">Les fonctionnalités</a>
          </div>
          <div className="footer-column-presentation">
            <p>À vous de jouer</p>
            <Link to="/register">Créer un compte</Link>
            <Link to="/connexion">Se connecter</Link>
          </div>
          <div className="footer-column-presentation">
            <p>Un coup de main ?</p>
            <a href="#faq">Questions fréquentes</a>
            <span>Nous contacter</span>
          </div>
        </div>
        <div className="footer-legal-presentation">
          <p>© 2026 Wegather. Les bons moments commencent ici.</p>
          <div>
            <Link to="/CGV">CGU / CGV</Link>
            <Link to="/mentions-legales">Mentions légales</Link>
            <Link to="/confidentialite">Confidentialité</Link>
            <span>Cookies</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Presentation;
