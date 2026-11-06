import { MotionConfig, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import NavBar from "../../components/NavBar/NavBar";
import Profil from "../../components/Profil/Profil";
import { fadeIn, revealOnScroll, titleIn } from "../PageCGV/legalMotion";
import "../PageCGV/PageCGV.css";

const CONTACT_EMAIL = "contact@wegather.fr";

const HOSTING = {
  name: "IONOS SARL",
  address: "7, place de la Gare, BP 70109, 57200 Sarreguemines Cedex, France",
  phone: "09 70 80 89 11",
};

function MentionsLegales() {
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
            Mentions légales — We<i>G</i>ather
          </motion.h1>
          <motion.p className="cgv-Updated" {...fadeIn}>
            Dernière mise à jour : 6 novembre 2026
          </motion.p>

          <motion.section {...revealOnScroll}>
            <h3>Éditeur du site</h3>
            <p>
              WeGather est un projet en cours de développement, édité à titre
              non professionnel par son fondateur. Conformément à la loi n°
              2004-575 du 21 juin 2004 pour la confiance dans l'économie
              numérique, l'éditeur, qui agit à titre non professionnel, a
              communiqué les éléments permettant de l'identifier à son
              hébergeur.
            </p>
            <p>
              Aucune société n'est encore immatriculée. La société qui
              exploitera WeGather sera créée lors du lancement des formules
              payantes : sa dénomination, sa forme juridique, son capital, son
              siège social et son numéro d'immatriculation seront alors publiés
              sur cette page.
            </p>
            <p>Contact : {contactLink}</p>
          </motion.section>

          <motion.section {...revealOnScroll}>
            <h3>Directeur de la publication</h3>
            <p>
              Le directeur de la publication est le fondateur du projet
              WeGather, joignable à l'adresse {contactLink}.
            </p>
          </motion.section>

          <motion.section {...revealOnScroll}>
            <h3>Hébergement</h3>
            <p>
              WeGather est hébergé sur un serveur privé virtuel (VPS).
              {HOSTING.name === "" &&
                " Les coordonnées de l'hébergeur seront précisées prochainement."}
            </p>
            {HOSTING.name !== "" && (
              <ul>
                <li>
                  <strong>Hébergeur :</strong> {HOSTING.name}
                </li>
                {HOSTING.address !== "" && (
                  <li>
                    <strong>Adresse :</strong> {HOSTING.address}
                  </li>
                )}
                {HOSTING.phone !== "" && (
                  <li>
                    <strong>Téléphone :</strong> {HOSTING.phone}
                  </li>
                )}
              </ul>
            )}
          </motion.section>

          <motion.section {...revealOnScroll}>
            <h3>Signaler un contenu illicite</h3>
            <p>
              Les contenus publiés par les utilisateurs (messages, photos,
              documents…) relèvent de leur seule responsabilité. Dans le
              Service, un participant ou un événement se signale avec le bouton
              prévu à cet effet. Toute personne peut aussi signaler un contenu
              manifestement illicite en écrivant à {contactLink}, en indiquant :
            </p>
            <ul>
              <li>ses nom, prénom et adresse e-mail ;</li>
              <li>
                la description du contenu et l'endroit précis où il se trouve
                (événement, page, date) ;
              </li>
              <li>
                les raisons pour lesquelles ce contenu lui paraît illicite.
              </li>
            </ul>
            <p>
              L'éditeur retire promptement tout contenu manifestement illicite
              qui lui est ainsi signalé. Un signalement abusif, effectué dans le
              but de faire retirer un contenu licite, peut être sanctionné par
              la loi.
            </p>
          </motion.section>

          <motion.section {...revealOnScroll}>
            <h3>Propriété intellectuelle</h3>
            <p>
              Le nom WeGather, son logo, son interface, ses textes et son code
              source sont protégés par le droit de la propriété intellectuelle.
              Toute reproduction ou réutilisation, totale ou partielle, sans
              autorisation préalable est interdite.
            </p>
            <p>
              Les illustrations de la page de présentation ont été réalisées par
              intelligence artificielle. Les aperçus de l'application qui y
              figurent montrent un événement fictif.
            </p>
            <p>
              Les contenus publiés par les utilisateurs restent leur propriété,
              dans les conditions prévues par les{" "}
              <Link to="/CGV">conditions générales d'utilisation</Link>.
            </p>
          </motion.section>

          <motion.section {...revealOnScroll}>
            <h3>Données personnelles et cookies</h3>
            <p>
              Les données personnelles des utilisateurs sont traitées
              conformément au Règlement général sur la protection des données
              (RGPD). Les données traitées, leurs finalités, leur durée de
              conservation et les droits des utilisateurs sont décrits dans la{" "}
              <Link to="/confidentialite">politique de confidentialité</Link>.
              Ces droits s'exercent en écrivant à {contactLink} ; une
              réclamation peut également être adressée à la CNIL (www.cnil.fr).
            </p>
            <p>
              Le site utilise uniquement un cookie strictement nécessaire à son
              fonctionnement, qui maintient la connexion de l'utilisateur
              pendant 30 jours au maximum. Aucun cookie publicitaire ou de
              mesure d'audience n'est déposé.
            </p>
          </motion.section>

          <motion.section {...revealOnScroll}>
            <h3>Crédits</h3>
            <ul>
              <li>
                <strong>Icônes :</strong> Lucide (lucide.dev), sous licence ISC.
              </li>
              <li>
                <strong>Police de caractères :</strong> Be Vietnam Pro, via
                Google Fonts, sous licence SIL Open Font License.
              </li>
              <li>
                <strong>Illustrations :</strong> réalisées par intelligence
                artificielle.
              </li>
            </ul>
          </motion.section>

          <motion.section {...revealOnScroll}>
            <h3>Droit applicable</h3>
            <p>
              Les présentes mentions légales sont soumises au droit français.
            </p>
          </motion.section>
        </main>
      </div>
    </MotionConfig>
  );
}

export default MentionsLegales;
