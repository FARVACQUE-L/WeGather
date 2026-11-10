import { MotionConfig, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import NavBar from "../../components/NavBar/NavBar";
import Profil from "../../components/Profil/Profil";
import { fadeIn, revealOnScroll, titleIn } from "./legalMotion";
import "./PageCGV.css";

const CONTACT_EMAIL = "contact@wegather.fr";

const PLANS = [
  {
    name: "Free",
    price: "Gratuit",
    hostedEvents: "2",
    reservations: "10",
    galleryPhotos: "15",
  },
  {
    name: "Premium",
    price: "Disponible prochainement",
    hostedEvents: "5",
    reservations: "10",
    galleryPhotos: "30",
  },
  {
    name: "Gold",
    price: "Disponible prochainement",
    hostedEvents: "Illimité",
    reservations: "Illimité",
    galleryPhotos: "50",
  },
];

function PageCGV() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/auth/authVerif`, {
      credentials: "include",
    })
      .then((res) => setIsLoggedIn(res.ok))
      .catch(() => setIsLoggedIn(false));
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      <div className="cgv-Layout">
        <header className="cvg-HeaderNav">
          <NavBar />
          {isLoggedIn && <Profil />}
        </header>
        <main className="cgv-Page">
          <motion.h1 {...titleIn}>
            Conditions Générales d'Utilisation et de Vente — We<i>G</i>ather
          </motion.h1>
          <motion.p className="cgv-Updated" {...fadeIn}>
            Dernière mise à jour : 3 novembre 2026
          </motion.p>

          <motion.section {...revealOnScroll} className="cgv-Intro">
            <p>
              L'éditeur du service WeGather est présenté dans les{" "}
              <Link to="/mentions-legales">mentions légales</Link>. Pour toute
              question : <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
              .
            </p>
            <p>Ce document comprend trois parties :</p>
            <nav className="cgv-Summary" aria-label="Sommaire">
              <ul>
                <li>
                  <a href="#cgu">
                    Partie 1 — Conditions Générales d'Utilisation (CGU)
                  </a>
                  , qui s'appliquent à tous les utilisateurs ;
                </li>
                <li>
                  <a href="#cgv">
                    Partie 2 — Conditions Générales de Vente (CGV)
                  </a>
                  , qui s'appliquent en plus aux formules payantes ;
                </li>
                <li>
                  <a href="#dispositions">Partie 3 — Dispositions communes</a>.
                </li>
              </ul>
            </nav>
          </motion.section>

          <motion.h2 {...revealOnScroll} id="cgu" className="cgv-Part">
            Partie 1 — Conditions Générales d'Utilisation
          </motion.h2>

          <motion.section {...revealOnScroll}>
            <h3>Article 1 — Objet</h3>
            <p>
              Les présentes Conditions Générales d'Utilisation (ci-après « CGU
              ») définissent les conditions d'accès et d'utilisation de
              l'application web WeGather (ci-après « le Service »), ainsi que
              les droits et obligations de l'éditeur du Service (ci-après «
              WeGather ») et des utilisateurs.
            </p>
            <p>
              WeGather permet d'organiser des événements à plusieurs ou seul :
              créer un événement, y inviter des participants, échanger par
              messagerie, centraliser les réservations, suivre les dépenses
              communes et partager des photos.
            </p>
          </motion.section>

          <motion.section {...revealOnScroll}>
            <h3>Article 2 — Définitions</h3>
            <ul>
              <li>
                <strong>Utilisateur :</strong> toute personne disposant d'un
                compte WeGather.
              </li>
              <li>
                <strong>Événement :</strong> espace partagé créé sur le Service,
                réunissant un organisateur et des participants.
              </li>
              <li>
                <strong>Organisateur :</strong> utilisateur qui a créé un
                événement.
              </li>
              <li>
                <strong>Participant :</strong> utilisateur qui a rejoint un
                événement grâce à son code d'invitation.
              </li>
              <li>
                <strong>Contenu :</strong> toute information publiée par un
                utilisateur sur le Service (messages, photos, dépenses,
                réservations, documents, tâches, nom d'événement, pseudo, photo
                de profil…).
              </li>
              <li>
                <strong>Formule :</strong> niveau de service attaché au compte
                (Free, Premium ou Gold), décrit dans la Partie 2.
              </li>
            </ul>
          </motion.section>

          <motion.section {...revealOnScroll}>
            <h3>Article 3 — Acceptation des CGU</h3>
            <p>
              L'inscription au Service nécessite d'accepter les présentes CGU en
              cochant la case prévue à cet effet dans le formulaire de création
              de compte. Cette acceptation vaut engagement à les respecter. Un
              utilisateur qui n'accepte pas tout ou partie des CGU doit renoncer
              à utiliser le Service.
            </p>
          </motion.section>

          <motion.section {...revealOnScroll}>
            <h3>Article 4 — Inscription et compte</h3>
            <p>
              La création d'un compte est gratuite. Elle nécessite une adresse
              e-mail valide, un pseudo et un mot de passe. L'utilisateur
              s'engage à fournir des informations exactes, à ne pas usurper
              l'identité d'un tiers et à ne créer qu'un seul compte.
            </p>
            <p>
              L'utilisateur est seul responsable de la confidentialité de son
              mot de passe et de toute action effectuée depuis son compte. En
              cas d'oubli, il peut le réinitialiser depuis la page de connexion
              grâce à un lien envoyé à son adresse e-mail. En cas d'utilisation
              frauduleuse de son compte, il doit prévenir WeGather sans délai.
            </p>
            <p>
              Le Service est destiné aux personnes majeures. Un mineur peut
              l'utiliser avec l'autorisation de son représentant légal ; avant
              15 ans, cette autorisation est obligatoire pour le traitement de
              ses données personnelles.
            </p>
          </motion.section>

          <motion.section {...revealOnScroll}>
            <h3>Article 5 — Description du Service</h3>
            <ul>
              <li>
                <strong>Événements :</strong> l'organisateur crée un événement
                (nom, dates, lieu, image) et le partage grâce à un code
                d'invitation. Toute personne disposant de ce code et d'un compte
                peut rejoindre l'événement.
              </li>
              <li>
                <strong>Tableau de bord et to-do list :</strong> chaque
                événement dispose d'un tableau de bord qui rassemble ses
                informations essentielles et d'une liste de tâches partagée.
              </li>
              <li>
                <strong>Messagerie :</strong> les participants d'un événement
                échangent en temps réel dans un espace qui leur est réservé.
              </li>
              <li>
                <strong>Réservations :</strong> les participants enregistrent
                les réservations liées à l'événement (transport, hébergement,
                restaurant, activité…) et y joignent leurs documents (billets,
                confirmations). WeGather ne réserve rien auprès des prestataires
                : les réservations sont conclues directement par l'utilisateur
                avec le prestataire, qui reste seul responsable de sa
                prestation.
              </li>
              <li>
                <strong>Budget :</strong> les participants déclarent leurs
                dépenses et le Service calcule le solde de chacun et les
                remboursements à effectuer. Il s'agit d'un outil de calcul :
                WeGather n'effectue aucun transfert d'argent entre utilisateurs
                et n'intervient pas comme intermédiaire de paiement.
              </li>
              <li>
                <strong>Galerie :</strong> les participants partagent des photos
                visibles par tous les membres de l'événement.
              </li>
              <li>
                <strong>Signalement :</strong> tout utilisateur peut signaler un
                participant ou un événement dont le comportement ou le contenu
                lui paraît contraire aux présentes CGU.
              </li>
            </ul>
            <p>
              Certaines fonctionnalités sont limitées selon la formule de
              l'utilisateur (nombre d'événements organisés, de réservations par
              événement, de photos par galerie). Ces limites sont détaillées aux
              articles 15 et 16.
            </p>
          </motion.section>

          <motion.section {...revealOnScroll}>
            <h3>Article 6 — Règles de conduite</h3>
            <p>
              L'utilisateur s'engage à utiliser le Service de manière loyale,
              conformément à sa destination et à la loi. Il s'interdit notamment
              de publier ou de partager des contenus :
            </p>
            <ul>
              <li>
                injurieux, diffamatoires, haineux, discriminatoires, violents ou
                harcelants ;
              </li>
              <li>
                pornographiques, ou portant atteinte à la dignité humaine ou à
                la protection des mineurs ;
              </li>
              <li>
                portant atteinte à la vie privée ou au droit à l'image d'autrui,
                notamment des photos de personnes publiées sans leur accord ;
              </li>
              <li>
                portant atteinte aux droits de propriété intellectuelle de tiers
                (photos, textes ou documents dont il ne détient pas les droits)
                ;
              </li>
              <li>
                à caractère publicitaire non sollicité, frauduleux ou trompeur.
              </li>
            </ul>
            <p>
              Il s'interdit également de tenter d'accéder sans autorisation aux
              comptes d'autres utilisateurs ou aux systèmes de WeGather, de
              perturber le fonctionnement du Service ou d'en extraire les
              données de manière automatisée.
            </p>
          </motion.section>

          <motion.section {...revealOnScroll}>
            <h3>Article 7 — Contenus des utilisateurs</h3>
            <p>
              L'utilisateur reste propriétaire des contenus qu'il publie et en
              est seul responsable. Les contenus d'un événement ne sont visibles
              que par l'organisateur et les participants de cet événement, ainsi
              que par les administrateurs de WeGather dans le cadre de la
              modération.
            </p>
            <p>
              Pour permettre le fonctionnement du Service, l'utilisateur accorde
              à WeGather, pour la durée de son compte, une licence gratuite et
              non exclusive lui permettant d'héberger, de reproduire et
              d'afficher ses contenus auprès des membres des événements
              concernés. Cette licence ne permet aucune autre utilisation,
              notamment commerciale.
            </p>
            <p>
              En tant qu'hébergeur au sens de la loi n° 2004-575 du 21 juin 2004
              pour la confiance dans l'économie numérique, WeGather n'exerce pas
              de contrôle préalable sur les contenus, mais retire promptement
              tout contenu manifestement illicite qui lui est signalé.
            </p>
          </motion.section>

          <motion.section {...revealOnScroll}>
            <h3>Article 8 — Signalement et modération</h3>
            <p>
              Les signalements sont examinés par les administrateurs de
              WeGather. Selon la gravité des faits, ils peuvent, après examen :
            </p>
            <ul>
              <li>supprimer un contenu ;</li>
              <li>exclure un utilisateur d'un événement ;</li>
              <li>
                bannir un événement : il n'est alors plus accessible, puis il
                est supprimé définitivement avec ses contenus un mois après son
                bannissement ;
              </li>
              <li>suspendre le compte d'un utilisateur.</li>
            </ul>
            <p>
              Sauf urgence ou manquement grave, l'utilisateur concerné peut
              présenter ses observations en écrivant à{" "}
              <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. Un
              signalement abusif peut lui-même donner lieu à des mesures.
            </p>
          </motion.section>

          <motion.section {...revealOnScroll}>
            <h3>Article 9 — Disponibilité du Service</h3>
            <p>
              WeGather met en œuvre les moyens raisonnables pour assurer l'accès
              au Service 24 heures sur 24 et 7 jours sur 7, sans garantir
              l'absence d'interruption. Le Service peut être suspendu pour
              maintenance, mise à jour ou en cas de force majeure. Dans la
              mesure du possible, les interruptions prévues sont annoncées à
              l'avance.
            </p>
          </motion.section>

          <motion.section {...revealOnScroll}>
            <h3>Article 10 — Responsabilité</h3>
            <p>
              WeGather est responsable de la bonne exécution du Service dans les
              conditions prévues par la loi. Sa responsabilité ne peut pas être
              engagée :
            </p>
            <ul>
              <li>
                pour les contenus publiés par les utilisateurs, sous réserve de
                l'article 7 ;
              </li>
              <li>
                pour les litiges entre utilisateurs, notamment sur la
                répartition ou le remboursement des dépenses ;
              </li>
              <li>
                pour les prestations des prestataires tiers (transporteurs,
                hébergeurs, restaurants…) auprès desquels l'utilisateur a
                réservé ;
              </li>
              <li>
                pour un dommage résultant d'une faute de l'utilisateur,
                notamment de la divulgation de son mot de passe, ou d'un cas de
                force majeure.
              </li>
            </ul>
            <p>
              Il est recommandé à l'utilisateur de conserver une copie de ses
              documents importants (billets, confirmations) en dehors du
              Service.
            </p>
          </motion.section>

          <motion.section {...revealOnScroll}>
            <h3>Article 11 — Données personnelles et cookies</h3>
            <p>
              WeGather traite les données personnelles des utilisateurs
              conformément au Règlement général sur la protection des données
              (RGPD) et à la loi Informatique et Libertés. Le détail de ces
              traitements figure dans la{" "}
              <Link to="/confidentialite">politique de confidentialité</Link> ;
              l'essentiel est résumé ci-dessous.
            </p>
            <ul>
              <li>
                <strong>Données traitées :</strong> adresse e-mail, pseudo, mot
                de passe (haché, jamais stocké en clair), photo de profil,
                formule, ainsi que les contenus publiés dans les événements.
              </li>
              <li>
                <strong>Finalités :</strong> fournir le Service, gérer les
                comptes et les formules, assurer la sécurité et la modération.
              </li>
              <li>
                <strong>Base légale :</strong> l'exécution du contrat que
                constituent les présentes conditions et, pour la modération,
                l'intérêt légitime de WeGather à assurer la sécurité du Service.
              </li>
              <li>
                <strong>Destinataires :</strong> les données ne sont ni vendues
                ni cédées. Elles ne sont accessibles qu'à WeGather, à ses
                prestataires techniques (hébergement, envoi d'e-mails, paiement)
                et, pour les contenus, aux membres des événements concernés.
              </li>
              <li>
                <strong>Durée de conservation :</strong> pendant toute la durée
                du compte, puis suppression, sauf obligation légale de
                conservation (notamment les données de facturation).
              </li>
            </ul>
            <p>
              L'utilisateur dispose d'un droit d'accès, de rectification,
              d'effacement, de limitation, d'opposition et de portabilité de ses
              données, qu'il exerce en écrivant à{" "}
              <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. Il peut
              également introduire une réclamation auprès de la CNIL
              (www.cnil.fr).
            </p>
            <p>
              Le Service utilise uniquement un cookie strictement nécessaire à
              son fonctionnement : il maintient la connexion de l'utilisateur
              pendant 30 jours au maximum. Ce cookie ne sert ni à la publicité
              ni à la mesure d'audience et ne nécessite donc pas de
              consentement.
            </p>
          </motion.section>

          <motion.section {...revealOnScroll}>
            <h3>Article 12 — Propriété intellectuelle</h3>
            <p>
              La marque WeGather, son logo, son interface, ses textes, ses
              illustrations et son code source sont la propriété exclusive de
              WeGather. Toute reproduction ou utilisation sans autorisation est
              interdite. L'utilisateur bénéficie seulement d'un droit
              d'utilisation du Service, personnel et non transférable, pour la
              durée de son compte.
            </p>
          </motion.section>

          <motion.section {...revealOnScroll}>
            <h3>Article 13 — Durée, suppression du compte et résiliation</h3>
            <p>
              Les CGU s'appliquent pour une durée indéterminée, à compter de
              l'inscription. L'utilisateur peut demander à tout moment la
              suppression de son compte en écrivant à{" "}
              <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> depuis
              l'adresse e-mail associée au compte. La suppression entraîne celle
              de ses données personnelles, dans les conditions de l'article 11.
              Les événements dont il est l'organisateur sont supprimés avec
              leurs contenus ; ses contenus publiés dans les événements d'autres
              organisateurs peuvent être conservés de manière anonymisée.
            </p>
            <p>
              En cas de manquement grave ou répété aux présentes CGU, WeGather
              peut suspendre ou supprimer le compte de l'utilisateur, dans les
              conditions de l'article 8. La suppression d'un compte ne donne
              lieu à aucun remboursement des sommes déjà versées, sauf
              disposition légale contraire.
            </p>
          </motion.section>

          <motion.h2 {...revealOnScroll} id="cgv" className="cgv-Part">
            Partie 2 — Conditions Générales de Vente
          </motion.h2>

          <motion.section {...revealOnScroll}>
            <h3>Article 14 — Champ d'application</h3>
            <p>
              Les présentes Conditions Générales de Vente (ci-après « CGV »)
              s'appliquent à la souscription des formules payantes Premium et
              Gold par les utilisateurs agissant en tant que consommateurs.
              Elles complètent les CGU, qui restent applicables. Toute
              souscription implique l'acceptation des CGV en vigueur à la date
              de la commande.
            </p>
          </motion.section>

          <motion.section {...revealOnScroll}>
            <h3>Article 15 — Formules et prix</h3>
            <p>
              Trois formules sont prévues. Les formules payantes Premium et Gold
              seront disponibles prochainement : leurs prix, en euros toutes
              taxes comprises, seront indiqués ici à leur ouverture.
            </p>
            <div className="cgv-TableWrapper">
              <table className="cgv-Table">
                <thead>
                  <tr>
                    <th scope="col">Formule</th>
                    <th scope="col">Prix</th>
                    <th scope="col">Événements organisés</th>
                    <th scope="col">Réservations par événement</th>
                    <th scope="col">Photos par galerie</th>
                  </tr>
                </thead>
                <tbody>
                  {PLANS.map((plan) => (
                    <tr key={plan.name}>
                      <th scope="row">{plan.name}</th>
                      <td>{plan.price}</td>
                      <td>{plan.hostedEvents}</td>
                      <td>{plan.reservations}</td>
                      <td>{plan.galleryPhotos}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p>
              Dans toutes les formules, le nombre d'événements rejoints est
              illimité et la messagerie, la to-do list, le budget partagé et le
              signalement sont inclus. WeGather peut modifier ses prix à tout
              moment ; le prix applicable est celui affiché au moment de la
              commande.
            </p>
          </motion.section>

          <motion.section {...revealOnScroll}>
            <h3>Article 16 — Limites des formules</h3>
            <p>
              Les limites de la formule s'appliquent à la création de nouveaux
              éléments. Lorsqu'une limite est atteinte, l'utilisateur ne peut
              plus créer d'élément du même type, mais conserve l'accès à ceux
              qu'il a déjà créés. Rejoindre un événement n'est jamais limité.
            </p>
          </motion.section>

          <motion.section {...revealOnScroll}>
            <h3>Article 17 — Commande</h3>
            <p>
              L'utilisateur souscrit une formule depuis la page Premium de son
              compte. Avant de valider, il prend connaissance d'un récapitulatif
              indiquant la formule choisie, son prix et, pour la formule Gold,
              la périodicité du paiement. La commande est définitive après la
              validation du paiement. WeGather confirme la souscription par
              e-mail, en y joignant les présentes conditions ou un lien vers
              celles-ci.
            </p>
          </motion.section>

          <motion.section {...revealOnScroll}>
            <h3>Article 18 — Paiement</h3>
            <p>
              Le paiement s'effectue en ligne par carte bancaire, par
              l'intermédiaire d'un prestataire de paiement sécurisé. WeGather
              n'a jamais accès aux coordonnées bancaires complètes de
              l'utilisateur et ne les conserve pas.
            </p>
            <ul>
              <li>
                <strong>Formule Premium :</strong> paiement unique, débité à la
                commande. Les avantages de la formule restent acquis tant que le
                compte existe.
              </li>
              <li>
                <strong>Formule Gold :</strong> abonnement mensuel, débité à la
                commande puis chaque mois à la même date.
              </li>
            </ul>
            <p>
              En cas d'échec d'un paiement mensuel, l'abonnement Gold est
              suspendu et le compte repasse à la formule Free jusqu'à la
              régularisation du paiement.
            </p>
          </motion.section>

          <motion.section {...revealOnScroll}>
            <h3>Article 19 — Durée et résiliation de l'abonnement Gold</h3>
            <p>
              L'abonnement Gold est conclu pour une durée d'un mois, renouvelée
              automatiquement chaque mois. L'utilisateur peut le résilier à tout
              moment, sans frais, en écrivant à{" "}
              <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. La
              résiliation prend effet à la fin de la période mensuelle en cours,
              déjà payée ; elle ne donne pas lieu à un remboursement au prorata.
            </p>
            <p>
              À la fin de l'abonnement, le compte repasse à la formule Free, ou
              à la formule Premium si l'utilisateur l'avait achetée. Les
              contenus existants sont conservés, dans les conditions de
              l'article 16.
            </p>
          </motion.section>

          <motion.section {...revealOnScroll}>
            <h3>Article 20 — Droit de rétractation</h3>
            <p>
              Conformément à l'article L221-18 du Code de la consommation,
              l'utilisateur dispose d'un délai de 14 jours à compter de la
              souscription pour se rétracter, sans avoir à se justifier. Il
              exerce ce droit en adressant à{" "}
              <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> une
              déclaration dénuée d'ambiguïté, par exemple au moyen du formulaire
              reproduit en annexe.
            </p>
            <p>
              Les avantages d'une formule sont accessibles dès la validation du
              paiement. En souscrivant, l'utilisateur demande expressément que
              le service commence avant la fin du délai de rétractation. S'il se
              rétracte, il reste redevable, conformément à l'article L221-25 du
              Code de la consommation, d'un montant proportionnel au service
              fourni jusqu'à la communication de sa décision.
            </p>
            <p>
              WeGather rembourse les sommes dues dans un délai de 14 jours à
              compter de la réception de la demande, par le même moyen de
              paiement que celui utilisé pour la commande. Le compte repasse
              alors à sa formule précédente.
            </p>
          </motion.section>

          <motion.section {...revealOnScroll}>
            <h3>Article 21 — Garantie légale de conformité</h3>
            <p>
              Les formules payantes bénéficient de la garantie légale de
              conformité des contenus et services numériques prévue aux articles
              L224-25-12 et suivants du Code de la consommation. En cas de
              défaut de conformité, l'utilisateur peut obtenir la mise en
              conformité du service ou, à défaut, une réduction du prix ou la
              résolution du contrat. Il signale le défaut à{" "}
              <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
            </p>
          </motion.section>

          <motion.h2 {...revealOnScroll} id="dispositions" className="cgv-Part">
            Partie 3 — Dispositions communes
          </motion.h2>

          <motion.section {...revealOnScroll}>
            <h3>Article 22 — Modification des conditions</h3>
            <p>
              WeGather peut modifier les présentes conditions, notamment pour
              tenir compte de l'évolution du Service ou de la réglementation.
              Les utilisateurs sont informés de toute modification importante
              par e-mail ou sur le Service, au moins 30 jours avant son entrée
              en vigueur. L'utilisateur qui refuse les nouvelles conditions peut
              supprimer son compte et, s'il est abonné à la formule Gold,
              résilier son abonnement avant leur entrée en vigueur. Les
              conditions de vente applicables à une commande restent celles en
              vigueur à sa date.
            </p>
          </motion.section>

          <motion.section {...revealOnScroll}>
            <h3>Article 23 — Droit applicable et litiges</h3>
            <p>
              Les présentes conditions sont soumises au droit français. En cas
              de litige, l'utilisateur adresse d'abord une réclamation écrite à{" "}
              <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> afin de
              rechercher une solution amiable.
            </p>
            <p>
              À défaut d'accord dans un délai de deux mois, l'utilisateur
              consommateur peut recourir gratuitement à un médiateur de la
              consommation, conformément aux articles L611-1 et suivants du Code
              de la consommation. WeGather lui communique les coordonnées du
              médiateur compétent sur simple demande. À défaut de résolution
              amiable, le litige est porté devant les juridictions françaises
              compétentes.
            </p>
          </motion.section>

          <motion.section {...revealOnScroll}>
            <h3>Article 24 — Contact</h3>
            <p>
              Pour toute question relative au Service ou aux présentes
              conditions :{" "}
              <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
            </p>
          </motion.section>

          <motion.section {...revealOnScroll} id="annexe" className="cgv-Annex">
            <h3>Annexe — Formulaire de rétractation</h3>
            <p>
              À compléter et à renvoyer uniquement si vous souhaitez vous
              rétracter de votre souscription.
            </p>
            <blockquote>
              <p>
                À l'attention de WeGather —{" "}
                <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
              </p>
              <p>
                Je vous notifie par la présente ma rétractation du contrat
                portant sur la souscription de la formule ci-dessous :
              </p>
              <ul>
                <li>Formule souscrite (Premium ou Gold) :</li>
                <li>Date de la souscription :</li>
                <li>Pseudo et adresse e-mail du compte :</li>
                <li>Date :</li>
              </ul>
            </blockquote>
          </motion.section>
        </main>
      </div>
    </MotionConfig>
  );
}

export default PageCGV;
