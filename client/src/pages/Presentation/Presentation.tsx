import "./Presentation.css";
import {
  ArrowUpRight,
  BadgeEuro,
  Book,
  CalendarPlus,
  Check,
  Download,
  Ellipsis,
  FileCheck,
  Heart,
  House,
  ImagePlus,
  Images,
  LayoutDashboard,
  type LucideIcon,
  MessagesSquare,
  Minus,
  Plus,
  Send,
  ShoppingBasket,
  Sparkles,
  Sun,
  TrainFront,
  Users,
  Utensils,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import galerieLavande from "../../assets/images/img-galerie-lavande.jpg";
import galerieRepas from "../../assets/images/img-galerie-repas.jpg";
import galerieVillage from "../../assets/images/img-galerie-village.jpg";
import occasionFete from "../../assets/images/img-occasion-fete.jpg";
import occasionPro from "../../assets/images/img-occasion-pro.jpg";
import occasionVacances from "../../assets/images/img-occasion-vacances.jpg";
import hero from "../../assets/images/img-presentation-hero.png";
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

const dashboardMenu: { icon: LucideIcon; label: string }[] = [
  { icon: LayoutDashboard, label: "Tableau de bord" },
  { icon: MessagesSquare, label: "Messages" },
  { icon: Book, label: "Réservations" },
  { icon: BadgeEuro, label: "Budget" },
  { icon: Images, label: "Galerie" },
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
          <div className="dashboard-preview-presentation">
            <aside className="dashboard-nav-presentation">
              <p className="dashboard-brand-presentation">wegather</p>
              <div>
                <p className="dashboard-event-presentation">
                  Week-end en Provence
                </p>
                <p className="small-presentation">
                  12–14 juin · 6 participants
                </p>
              </div>
              <ul>
                {dashboardMenu.map(({ icon: Icon, label }, index) => (
                  <li key={label} className={index === 0 ? "active" : ""}>
                    <Icon size={14} {...iconProps} />
                    {label}
                  </li>
                ))}
              </ul>
              <p className="small-presentation">← Tous mes événements</p>
            </aside>
            <div className="dashboard-main-presentation">
              <div className="dashboard-breadcrumb-presentation">
                <p className="small-presentation">
                  MES ÉVÉNEMENTS / WEEK-END EN PROVENCE
                </p>
                <span className="avatar-presentation">AL</span>
              </div>
              <div>
                <p className="dashboard-title-presentation">
                  Le week-end prend forme ☀️
                </p>
                <p className="dashboard-subtitle-presentation">
                  Les infos essentielles, sans remonter tous les messages.
                </p>
              </div>
              <div className="dashboard-summary-presentation">
                <div>
                  <p className="small-presentation">Dates du séjour</p>
                  <p>12–14 juin</p>
                </div>
                <div>
                  <p className="small-presentation">
                    Notre point de rendez-vous
                  </p>
                  <p>L’Isle-sur-la-Sorgue</p>
                </div>
                <div>
                  <p className="small-presentation">L’équipe au complet</p>
                  <p>6 personnes</p>
                </div>
              </div>
              <div className="dashboard-bottom-presentation">
                <div className="dashboard-agenda-presentation">
                  <p className="dashboard-heading-presentation">À l’agenda</p>
                  <p className="row-presentation">
                    <TrainFront size={16} {...iconProps} />
                    Arrivée en gare
                    <span>Ven. 18:30</span>
                  </p>
                  <p className="row-presentation">
                    <Utensils size={16} {...iconProps} />
                    Dîner à la maison
                    <span>Ven. 20:00</span>
                  </p>
                  <p className="row-presentation">
                    <Sun size={16} {...iconProps} />
                    Marché &amp; balade
                    <span>Sam. 10:00</span>
                  </p>
                </div>
                <div className="dashboard-todo-presentation">
                  <p>Avant de partir</p>
                  <p>✓ Maison réservée</p>
                  <p>✓ Billets ajoutés aux réservations</p>
                  <p className="todo-pending-presentation">
                    ○ Choisir le menu du vendredi
                  </p>
                </div>
              </div>
            </div>
          </div>
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
            <div className="tool-preview-presentation chat-presentation">
              <div className="chat-header-presentation">
                <div className="chat-contact-presentation">
                  <span className="avatar-presentation">CM</span>
                  <div>
                    <p>Camille</p>
                    <p className="small-presentation">Week-end en Provence</p>
                  </div>
                </div>
                <Ellipsis size={20} {...iconProps} />
              </div>
              <div className="bubble-presentation received">
                <p>J’arrive à 18h30, on fait le trajet ensemble ?</p>
                <p className="bubble-time-presentation">14:32</p>
              </div>
              <div className="bubble-presentation sent">
                <p>Oui ! Je t’attends à la gare 😊</p>
              </div>
              <div className="chat-input-presentation">
                <p>Écrire à Camille…</p>
                <Send size={17} {...iconProps} />
              </div>
            </div>
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
            <div className="tool-preview-presentation wallet-presentation">
              <div className="wallet-header-presentation">
                <p>Mes réservations</p>
                <span>+ Ajouter</span>
              </div>
              <div className="ticket-presentation">
                <TrainFront size={28} {...iconProps} />
                <div>
                  <p>Paris → Avignon</p>
                  <p className="ticket-detail-presentation">
                    Vendredi 12 juin · 15:42–18:20
                  </p>
                </div>
                <Download size={18} {...iconProps} />
              </div>
              <div className="ticket-presentation">
                <House size={28} {...iconProps} />
                <div>
                  <p>La maison des oliviers</p>
                  <p className="ticket-detail-presentation">
                    12–14 juin · Confirmation ajoutée
                  </p>
                </div>
                <FileCheck size={18} {...iconProps} />
              </div>
            </div>
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
            <div className="tool-preview-presentation expenses-presentation">
              <div className="expenses-summary-presentation">
                <div>
                  <p className="ticket-detail-presentation">
                    Dépenses du week-end
                  </p>
                  <p className="expenses-total-presentation">420,00 €</p>
                </div>
                <span>70 € / personne</span>
              </div>
              <p className="row-presentation">
                <House size={16} {...iconProps} />
                Hébergement · Alex
                <span>300,00 €</span>
              </p>
              <p className="row-presentation">
                <ShoppingBasket size={16} {...iconProps} />
                Courses · Camille
                <span>120,00 €</span>
              </p>
              <div className="balance-presentation">
                <p>Votre solde</p>
                <p>Vous devez 70,00 €</p>
              </div>
            </div>
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
            <div className="tool-preview-presentation gallery-presentation">
              <div className="wallet-header-presentation">
                <p>Les souvenirs du week-end</p>
                <ImagePlus size={18} {...iconProps} />
              </div>
              <div className="photos-presentation">
                <img src={galerieRepas} alt="Repas entre amis en terrasse" />
                <img src={galerieVillage} alt="Ruelle d’un village provençal" />
                <img
                  src={galerieLavande}
                  alt="Balade dans un champ de lavande"
                />
              </div>
              <div className="contributors-presentation">
                <span className="avatar-presentation">AL</span>
                <span className="avatar-presentation">CM</span>
                <p>Les moments de chacun, réunis.</p>
              </div>
            </div>
          </article>
        </div>

        <p className="mention-presentation">
          Aperçus illustratifs d’un événement fictif : « Week-end en Provence ».
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
            <button type="button" onClick={goToEvents}>
              Créer un événement
            </button>
            <button type="button" onClick={goToEvents}>
              Rejoindre un événement
            </button>
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
            <span>Mentions légales</span>
            <span>Confidentialité</span>
            <span>Cookies</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Presentation;
