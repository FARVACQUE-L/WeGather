import { MotionConfig, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import NavBar from "../../components/NavBar/NavBar";
import Profil from "../../components/Profil/Profil";
import { fadeIn, revealOnScroll, titleIn } from "../PageCGV/legalMotion";
import "../PageCGV/PageCGV.css";

const CONTACT_EMAIL = "wedoop3@gmail.com";

const DATA_CATEGORIES = [
  {
    category: "Compte",
    data: "Pseudo, adresse e-mail, mot de passe (haché, jamais stocké en clair), photo de profil, date d'inscription, formule (Free, Premium ou Gold).",
  },
  {
    category: "Événements",
    data: "Nom, dates, lieu, description et image de l'événement, organisateur, liste des participants, code d'invitation.",
  },
  {
    category: "Contenus partagés",
    data: "Messages, réactions et indicateurs de lecture ; photos de la galerie et « j'aime » ; réservations et documents joints (billets, confirmations) ; dépenses ; tâches de la to-do list.",
  },
  {
    category: "Signalements",
    data: "Auteur, personne ou événement signalé, description, date, captures d'écran jointes ; signalements de bugs.",
  },
  {
    category: "Formulaire de contact",
    data: "Nom, adresse e-mail, sujet et message, accessibles sans compte.",
  },
  {
    category: "Modération",
    data: "Rôle administrateur, suspension du compte, exclusion d'un événement, bannissement d'un événement.",
  },
  {
    category: "Données techniques",
    data: "Jeton de connexion (dans un cookie), jeton de réinitialisation du mot de passe, présence en ligne (calculée en direct, jamais enregistrée).",
  },
];

const PURPOSES = [
  {
    purpose: "Créer et gérer le compte, permettre la connexion",
    basis: "Exécution du contrat (CGU)",
  },
  {
    purpose:
      "Fournir les fonctionnalités : événements, messagerie, réservations, budget, galerie, to-do list",
    basis: "Exécution du contrat (CGU)",
  },
  {
    purpose:
      "Envoyer les e-mails de service (réinitialisation du mot de passe)",
    basis: "Exécution du contrat (CGU)",
  },
  {
    purpose: "Traiter les signalements, modérer les contenus et les comptes",
    basis:
      "Intérêt légitime : assurer la sécurité du Service et de ses utilisateurs",
  },
  {
    purpose: "Gérer les formules payantes et la facturation",
    basis: "Exécution du contrat (CGV) et obligations légales comptables",
  },
  {
    purpose: "Répondre aux messages envoyés par le formulaire de contact",
    basis: "Intérêt légitime : répondre aux demandes qui nous sont adressées",
  },
];

const RETENTION = [
  {
    data: "Compte et données associées",
    duration:
      "Pendant toute la durée du compte, puis suppression à la fermeture du compte.",
  },
  {
    data: "Événement et ses contenus",
    duration:
      "Jusqu'à la suppression de l'événement ou du compte de son organisateur. Un événement banni est supprimé définitivement avec ses contenus un mois après son bannissement.",
  },
  {
    data: "Lien de réinitialisation du mot de passe",
    duration: "3 minutes, ou jusqu'à son utilisation.",
  },
  {
    data: "Cookie de connexion",
    duration: "30 jours au maximum, ou jusqu'à la déconnexion.",
  },
  {
    data: "Signalements",
    duration:
      "Le temps nécessaire à leur traitement et à la prévention des récidives.",
  },
  {
    data: "Messages de contact",
    duration: "Un an au maximum après le traitement de la demande.",
  },
  {
    data: "Données de facturation (formules payantes)",
    duration:
      "10 ans à compter de la clôture de l'exercice, comme l'impose le Code de commerce.",
  },
];

function Confidentialite() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/auth/authVerif`, {
      credentials: "include",
    })
      .then((res) => setIsLoggedIn(res.ok))
      .catch(() => setIsLoggedIn(false));
  }, []);

  const contactLink = <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>;

  return (
    <MotionConfig reducedMotion="user">
      <div className="cgv-Layout">
        <header className="cvg-HeaderNav">
          <NavBar />
          {isLoggedIn && <Profil />}
        </header>
        <main className="cgv-Page">
          <motion.h1 {...titleIn}>
            Politique de confidentialité — We<i>G</i>ather
          </motion.h1>
          <motion.p className="cgv-Updated" {...fadeIn}>
            Dernière mise à jour : 3 novembre 2026
          </motion.p>

          <motion.section {...revealOnScroll} className="cgv-Intro">
            <p>
              Cette politique explique quelles données personnelles WeGather
              traite, pourquoi, avec qui elles sont partagées, combien de temps
              elles sont conservées et comment exercer vos droits. Elle
              s'applique conformément au Règlement général sur la protection des
              données (RGPD) et à la loi Informatique et Libertés.
            </p>
          </motion.section>

          <motion.section {...revealOnScroll}>
            <h3>1. Responsable du traitement</h3>
            <p>
              Le responsable du traitement est l'éditeur de WeGather, présenté
              dans les <Link to="/mentions-legales">mentions légales</Link>.
              Pour toute question sur vos données : {contactLink}.
            </p>
          </motion.section>

          <motion.section {...revealOnScroll}>
            <h3>2. Données traitées</h3>
            <p>
              WeGather ne traite que les données que vous lui fournissez en
              utilisant le Service, ou que le Service produit pour fonctionner :
            </p>
            <div className="cgv-TableWrapper">
              <table className="cgv-Table">
                <thead>
                  <tr>
                    <th scope="col">Catégorie</th>
                    <th scope="col">Données</th>
                  </tr>
                </thead>
                <tbody>
                  {DATA_CATEGORIES.map((row) => (
                    <tr key={row.category}>
                      <th scope="row">{row.category}</th>
                      <td>{row.data}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p>
              Les contenus que vous partagez peuvent contenir des données
              personnelles d'autres personnes, par exemple des photos de vos
              proches. Assurez-vous d'avoir leur accord avant de les publier.
            </p>
          </motion.section>

          <motion.section {...revealOnScroll}>
            <h3>3. Finalités et bases légales</h3>
            <div className="cgv-TableWrapper">
              <table className="cgv-Table">
                <thead>
                  <tr>
                    <th scope="col">Finalité</th>
                    <th scope="col">Base légale</th>
                  </tr>
                </thead>
                <tbody>
                  {PURPOSES.map((row) => (
                    <tr key={row.purpose}>
                      <td>{row.purpose}</td>
                      <td>{row.basis}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p>
              WeGather n'utilise pas vos données à des fins publicitaires, ne
              réalise aucun profilage et ne les vend ni ne les loue à quiconque.
            </p>
          </motion.section>

          <motion.section {...revealOnScroll}>
            <h3>4. Qui a accès à vos données</h3>
            <ul>
              <li>
                <strong>Les membres de vos événements :</strong> votre pseudo,
                votre photo de profil, votre présence en ligne et les contenus
                que vous publiez dans un événement sont affichés à son
                organisateur et à ses participants ; le Service ne les montre à
                personne d'autre.
              </li>
              <li>
                <strong>Les administrateurs de WeGather :</strong> uniquement
                pour traiter les signalements et modérer le Service.
              </li>
              <li>
                <strong>Les sous-traitants techniques</strong>, qui agissent sur
                instruction de WeGather et uniquement pour les besoins du
                Service : l'hébergeur du serveur (voir les{" "}
                <Link to="/mentions-legales">mentions légales</Link>), Google
                (service Gmail) pour l'envoi des e-mails, Discord pour la
                réception des messages du formulaire de contact par l'équipe et,
                à l'ouverture des formules payantes, le prestataire de paiement.
              </li>
              <li>
                <strong>Les autorités</strong>, uniquement sur demande légale.
              </li>
            </ul>
          </motion.section>

          <motion.section {...revealOnScroll}>
            <h3>5. Transferts hors de l'Union européenne</h3>
            <p>
              L'envoi des e-mails par Gmail, le chargement des polices de
              caractères par Google Fonts et la transmission des messages de
              contact à Discord peuvent conduire Google et Discord à traiter
              certaines données (nom, adresse e-mail, message, adresse IP) hors
              de l'Union européenne, notamment aux États-Unis. Ces transferts
              sont encadrés par le cadre de protection des données UE–États-Unis
              (Data Privacy Framework) reconnu par la Commission européenne ou,
              à défaut, par ses clauses contractuelles types.
            </p>
          </motion.section>

          <motion.section {...revealOnScroll}>
            <h3>6. Durées de conservation</h3>
            <div className="cgv-TableWrapper">
              <table className="cgv-Table">
                <thead>
                  <tr>
                    <th scope="col">Données</th>
                    <th scope="col">Durée</th>
                  </tr>
                </thead>
                <tbody>
                  {RETENTION.map((row) => (
                    <tr key={row.data}>
                      <th scope="row">{row.data}</th>
                      <td>{row.duration}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p>
              À la suppression de votre compte, vos contenus publiés dans les
              événements d'autres organisateurs peuvent être conservés de
              manière anonymisée, pour ne pas rendre incompréhensibles les
              échanges et les comptes du groupe.
            </p>
          </motion.section>

          <motion.section {...revealOnScroll}>
            <h3>7. Sécurité</h3>
            <p>
              WeGather prend des mesures adaptées pour protéger vos données :
              échanges chiffrés (HTTPS), mots de passe hachés, cookie de
              connexion inaccessible aux scripts de la page, contenus d'un
              événement affichés à ses seuls membres, et pièces jointes des
              signalements réservées aux administrateurs. Aucun système n'étant
              infaillible, en cas de violation de données présentant un risque
              pour vous, WeGather en informera la CNIL et, si nécessaire, les
              personnes concernées, dans les conditions prévues par le RGPD.
            </p>
          </motion.section>

          <motion.section
            {...revealOnScroll}
            id="cookies"
            className="cgv-Anchor"
          >
            <h3>8. Cookies</h3>
            <p>
              WeGather dépose un seul cookie, strictement nécessaire au
              fonctionnement du Service : il contient votre jeton de connexion
              et vous évite de vous reconnecter à chaque visite. Il expire au
              bout de 30 jours ou à la déconnexion. Conformément aux
              recommandations de la CNIL, ce cookie ne nécessite pas votre
              consentement.
            </p>
            <p>
              Aucun cookie publicitaire, de mesure d'audience ou de réseau
              social n'est utilisé.
            </p>
          </motion.section>

          <motion.section {...revealOnScroll}>
            <h3>9. Vos droits</h3>
            <p>Vous disposez à tout moment des droits suivants :</p>
            <ul>
              <li>
                <strong>Accès :</strong> obtenir une copie de vos données ;
              </li>
              <li>
                <strong>Rectification :</strong> corriger des données inexactes
                (votre pseudo et votre photo de profil se modifient aussi
                directement depuis votre profil) ;
              </li>
              <li>
                <strong>Effacement :</strong> demander la suppression de votre
                compte et de vos données ;
              </li>
              <li>
                <strong>Limitation et opposition :</strong> demander la
                suspension d'un traitement, ou vous opposer à un traitement
                fondé sur l'intérêt légitime ;
              </li>
              <li>
                <strong>Portabilité :</strong> recevoir vos données dans un
                format structuré et lisible par une machine ;
              </li>
              <li>
                <strong>Directives post-mortem :</strong> définir ce que
                deviennent vos données après votre décès.
              </li>
            </ul>
            <p>
              Pour exercer ces droits, écrivez à {contactLink} depuis l'adresse
              e-mail associée à votre compte. WeGather vous répond dans un délai
              d'un mois, qui peut être prolongé de deux mois pour une demande
              complexe ; vous en êtes alors informé. En cas de doute sur votre
              identité, un justificatif peut vous être demandé.
            </p>
            <p>
              Si vous estimez que vos droits ne sont pas respectés, vous pouvez
              adresser une réclamation à la CNIL (www.cnil.fr).
            </p>
          </motion.section>

          <motion.section {...revealOnScroll}>
            <h3>10. Mineurs</h3>
            <p>
              Un mineur de moins de 15 ans ne peut utiliser WeGather qu'avec
              l'accord de son représentant légal, conformément à la loi
              Informatique et Libertés. Si vous constatez qu'un enfant a créé un
              compte sans cet accord, écrivez à {contactLink} pour qu'il soit
              supprimé.
            </p>
          </motion.section>

          <motion.section {...revealOnScroll}>
            <h3>11. Modification de cette politique</h3>
            <p>
              Cette politique peut évoluer, notamment à l'ouverture des formules
              payantes. En cas de modification importante, vous en serez informé
              par e-mail ou sur le Service. Les{" "}
              <Link to="/CGV">
                conditions générales d'utilisation et de vente
              </Link>{" "}
              complètent cette politique.
            </p>
          </motion.section>
        </main>
      </div>
    </MotionConfig>
  );
}

export default Confidentialite;
