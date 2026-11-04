import "./Presentation.css";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpRight,
  BadgeEuro,
  Book,
  Calendar,
  CalendarClock,
  CalendarPlus,
  Check,
  Clock,
  Download,
  Euro,
  Hand,
  HandCoins,
  Heart,
  History,
  ImagePlus,
  Images,
  LayoutDashboard,
  ListTodo,
  type LucideIcon,
  MapPin,
  MessageCircle,
  MessagesSquare,
  Minus,
  PiggyBank,
  Plus,
  Smile,
  Sparkles,
  Sun,
  Ticket,
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
import occasionPro from "../../assets/images/img-occasion-pro.png";
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

// Données des aperçus de la section « Tout au même endroit » : des maquettes
// en HTML qui reprennent le style de l'application, pour un événement fictif.
const sidebarMenu: { icon: LucideIcon; label: string }[] = [
  { icon: LayoutDashboard, label: "Tableau de bord" },
  { icon: MessageCircle, label: "Messagerie" },
  { icon: Book, label: "Réservation" },
  { icon: Euro, label: "Budget" },
  { icon: Images, label: "Galerie" },
];

const dashboardStats: { icon: LucideIcon; label: string; value: string }[] = [
  { icon: Calendar, label: "Dates du séjour", value: "12-14 juin" },
  { icon: Users, label: "L’équipe au complet", value: "3" },
  { icon: Book, label: "Nos réservations", value: "3" },
  { icon: PiggyBank, label: "Ton budget", value: "+82,67 €" },
];

const recentBookings = [
  { who: "Lolo", place: "L’Isle-sur-la-Sorgue", date: "13/06" },
  { who: "Camille", place: "L’Isle-sur-la-Sorgue", date: "12/06" },
  { who: "Camille", place: "Avignon", date: "12/06" },
];

const bookings: {
  icon: LucideIcon;
  type: string;
  kind: string;
  title: string;
  place: string;
  day: string;
  time: string;
}[] = [
  {
    icon: TrainFront,
    type: "Transport",
    kind: "transport",
    title: "Train",
    place: "Avignon",
    day: "12",
    time: "15:42 → 18:20",
  },
  {
    icon: Utensils,
    type: "Restaurant",
    kind: "restaurant",
    title: "Dîner à la maison",
    place: "L’Isle-sur-la-Sorgue",
    day: "12",
    time: "À 20:00",
  },
  {
    icon: Ticket,
    type: "Activité",
    kind: "activity",
    title: "Marché & balade",
    place: "L’Isle-sur-la-Sorgue",
    day: "13",
    time: "À 10:00",
  },
];

const expenses = [
  { name: "Maison", author: "Alex", amount: "+300,00 €", positive: true },
  { name: "Courses", author: "Camille", amount: "-124,00 €", positive: false },
  { name: "Train", author: "Camille", amount: "-150,00 €", positive: false },
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
          <div
            className="dashboard-preview-presentation mock-presentation"
            role="img"
            aria-label="Tableau de bord de l’événement Week-end en Provence : dates, participants, réservations récentes, budget et to-do list"
          >
            <aside className="mock-sidebar">
              <p className="mock-brand">
                <img src={logo} alt="" />
                WeGather
              </p>
              <ul>
                {sidebarMenu.map(({ icon: Icon, label }, index) => (
                  <li key={label} className={index === 0 ? "active" : ""}>
                    <Icon size={13} strokeWidth={1.8} />
                    {label}
                  </li>
                ))}
              </ul>
            </aside>
            <div className="mock-main">
              <span className="mock-avatar mock-avatar-corner">C</span>
              <p className="mock-title">Week-end en Provence</p>
              <div className="mock-greeting">
                <div>
                  <p>
                    Salut, Camille <Hand size={14} strokeWidth={1.8} />
                  </p>
                  <p className="mock-muted">
                    Les infos essentielles, sans remonter tous les messages.
                  </p>
                </div>
                <span className="mock-button">Code de l’événement</span>
              </div>
              <div className="mock-stats">
                {dashboardStats.map(({ icon: Icon, label, value }) => (
                  <div key={label}>
                    <p className="mock-muted">
                      <Icon size={11} strokeWidth={1.8} />
                      {label}
                    </p>
                    <p>{value}</p>
                  </div>
                ))}
              </div>
              <div className="mock-dashboard-bottom">
                <div className="mock-panel mock-recent">
                  <p className="mock-panel-title">
                    <CalendarClock size={12} strokeWidth={1.8} />
                    Réservations récentes
                    <span>Voir tout</span>
                  </p>
                  <div className="mock-table">
                    <p className="mock-table-head">
                      <span>Organisateur</span>
                      <span>Lieu</span>
                      <span>Date</span>
                      <span>Statut</span>
                    </p>
                    {recentBookings.map(({ who, place, date }) => (
                      <p key={`${who}-${date}-${place}`}>
                        <span>
                          <span className="mock-avatar mock-avatar-small">
                            {who[0]}
                          </span>
                          {who}
                        </span>
                        <span>{place}</span>
                        <span>{date}</span>
                        <span>
                          <span className="mock-status">À venir</span>
                        </span>
                      </p>
                    ))}
                  </div>
                </div>
                <div className="mock-panel mock-todo">
                  <p className="mock-panel-title">
                    <ListTodo size={12} strokeWidth={1.8} />
                    To-do list
                  </p>
                  <p className="mock-todo-row">
                    <span className="mock-checkbox" />
                    Choisir le menu de vendredi
                  </p>
                  <p className="mock-todo-row done">
                    <span className="mock-checkbox">
                      <Check size={8} strokeWidth={3} />
                    </span>
                    Maison réservée
                  </p>
                  <p className="mock-todo-row done">
                    <span className="mock-checkbox">
                      <Check size={8} strokeWidth={3} />
                    </span>
                    Billets ajoutés
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
            <h3>Tout le groupe. Une seule conversation.</h3>
            <p className="tool-description-presentation">
              Échangez en direct avec les membres de l’événement. Une question,
              un détail à caler : la conversation reste à portée de main.
            </p>
            <div
              className="tool-preview-presentation mock-presentation mock-chat"
              role="img"
              aria-label="Conversation de groupe dans la messagerie de l’événement"
            >
              <p className="mock-day">Aujourd’hui</p>
              <div className="mock-message received">
                <span className="mock-avatar">A</span>
                <p className="mock-bubble">
                  <span className="mock-author">Alex</span>
                  Hello tout le monde ! On fait le trajet ensemble ?
                  <span className="mock-time">13:55</span>
                </p>
              </div>
              <div className="mock-message sent">
                <p className="mock-bubble">Oui, je t’attends à la gare 😊</p>
                <span className="mock-time">13:57</span>
              </div>
              <div className="mock-message received">
                <span className="mock-avatar">L</span>
                <p className="mock-bubble">
                  <span className="mock-author">Lolo</span>
                  Je vous rejoins pour le dîner 🍝
                  <span className="mock-time">14:02</span>
                </p>
              </div>
              <p className="mock-chat-input">
                <Plus size={14} strokeWidth={1.8} />
                Écrire un message…
                <Smile size={14} strokeWidth={1.8} />
              </p>
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
            <div
              className="tool-preview-presentation mock-presentation mock-bookings"
              role="img"
              aria-label="Page Réservations avec la prochaine réservation, les filtres et les cartes train, restaurant et activité"
            >
              <div className="mock-next">
                <span className="mock-next-icon">
                  <TrainFront size={14} strokeWidth={1.8} />
                </span>
                <div>
                  <p className="mock-next-label">Prochaine réservation</p>
                  <p className="mock-next-title">Train</p>
                  <p>Ven. 12 juin · 15:42 → 18:20 · Avignon</p>
                </div>
              </div>
              <p className="mock-filters">
                <span className="active">Tout</span>
                <span>Transport</span>
                <span>Restaurant</span>
                <span>Activité</span>
              </p>
              <div className="mock-booking-cards">
                {bookings.map(
                  ({ icon: Icon, type, kind, title, place, day, time }) => (
                    <div key={title} className="mock-booking-card">
                      <div className={`mock-booking-cover ${kind}`}>
                        <Icon size={22} strokeWidth={1.5} />
                        <span className="mock-booking-date">
                          {day}
                          <span>Juin</span>
                        </span>
                      </div>
                      <div className="mock-booking-body">
                        <span className={`mock-tag ${kind}`}>{type}</span>
                        <p className="mock-muted">
                          <Clock size={9} strokeWidth={2} />
                          {time}
                        </p>
                        <p className="mock-booking-title">{title}</p>
                        <p className="mock-booking-place">
                          <MapPin size={9} strokeWidth={2} />
                          {place}
                        </p>
                      </div>
                    </div>
                  ),
                )}
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
            <div
              className="tool-preview-presentation mock-presentation mock-budget"
              role="img"
              aria-label="Page Budget avec le solde, les dépenses de chacun et les équilibres"
            >
              <div className="mock-budget-top">
                <div className="mock-balance">
                  <p>On te doit</p>
                  <p className="mock-balance-amount">82,67 €</p>
                  <p className="mock-balance-update">
                    <History size={10} strokeWidth={2} />
                    Mise à jour il y a 4 jours
                  </p>
                  <span className="mock-balance-button">
                    <HandCoins size={10} strokeWidth={2} />
                    Équilibrer les comptes
                  </span>
                </div>
                <div className="mock-totals">
                  <p className="positive">
                    <span>
                      <ArrowDown size={9} strokeWidth={2.4} />
                      Dépenses globales
                    </span>
                    574,00 €
                  </p>
                  <p className="negative">
                    <span>
                      <ArrowUp size={9} strokeWidth={2.4} />
                      Mes dépenses
                    </span>
                    274,00 €
                  </p>
                </div>
              </div>
              <p className="mock-heading">Dépenses</p>
              {expenses.map(({ name, author, amount, positive }) => (
                <p key={name} className="mock-row">
                  <span>
                    <strong>{name}</strong>
                    <span className="mock-muted"> · {author}</span>
                  </span>
                  <span className={positive ? "positive" : "negative"}>
                    {amount}
                  </span>
                </p>
              ))}
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
            <div
              className="tool-preview-presentation mock-presentation mock-gallery"
              role="img"
              aria-label="Galerie de l’événement avec les photos du week-end"
            >
              <p className="mock-gallery-actions">
                <span className="mock-button-outline">
                  <Download size={10} strokeWidth={2} />
                  Tout télécharger
                </span>
                <span className="mock-button">
                  <ImagePlus size={10} strokeWidth={2} />
                  Ajouter une photo
                </span>
              </p>
              <div className="mock-photos">
                <img src={galerieLavande} alt="" loading="lazy" />
                <img src={galerieVillage} alt="" loading="lazy" />
                <img src={galerieRepas} alt="" loading="lazy" />
              </div>
            </div>
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
            <Link to="/contact">Nous contacter</Link>
          </div>
        </div>
        <div className="footer-legal-presentation">
          <p>© 2026 Wegather. Les bons moments commencent ici.</p>
          <div>
            <Link to="/CGV">CGU / CGV</Link>
            <Link to="/mentions-legales">Mentions légales</Link>
            <Link to="/confidentialite">Confidentialité</Link>
            <Link to="/confidentialite#cookies">Cookies</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Presentation;
