import NavBar from "../../components/NavBar/NavBar";
import Profil from "../../components/Profil/Profil";
import "./PageCGV.css";

function PageCGV() {
  return (
    <div className="cgv-Layout">
      <header className="cvg-HeaderNav">
        <NavBar />
        <Profil />
      </header>
      <main className="cgv-Page">
        <h1>
          Conditions Générales de Vente et d'Utilisation — We<i>G</i>ather
        </h1>
        <p className="cgv-Updated">Dernière mise à jour : 03 juillet 2026</p>

        <section>
          <h2>Article 1 — Objet</h2>
          <p>
            Les présentes Conditions Générales de Vente et d'Utilisation
            (ci-après « CGV ») régissent l'accès et l'utilisation de
            l'application WeGather (ci-après « le Service »), éditée par la
            WeGatherCorp, dont le siège social est situé à Toulouse.
          </p>
          <p>
            WeGather permet à ses utilisateurs de créer des événements,
            d'inviter des participants, de communiquer via un chat dédié à
            chaque événement, de partager des photos, de suivre et répartir des
            dépenses de groupe, et d'effectuer des réservations liées à
            l'événement (restaurants, activités, hébergements, etc.) auprès de
            prestataires tiers.
          </p>
        </section>

        <section>
          <h2>Article 2 — Acceptation des CGV</h2>
          <p>
            La création d'un compte WeGather implique l'acceptation pleine et
            entière des présentes CGV. Si l'utilisateur n'accepte pas tout ou
            partie de ces conditions, il doit renoncer à l'inscription et à
            l'utilisation du Service.
          </p>
        </section>

        <section>
          <h2>Article 3 — Accès au Service et création de compte</h2>
          <p>
            L'accès à WeGather nécessite la création d'un compte personnel.
            L'utilisateur s'engage à fournir des informations exactes et à jour,
            et à ne pas usurper l'identité d'un tiers. Il est seul responsable
            de la confidentialité de ses identifiants de connexion.
          </p>
          <p>
            WeGather est accessible aux personnes physiques majeures capables de
            contracter, ainsi qu'aux mineurs disposant de l'autorisation de leur
            représentant légal, sous réserve des conditions spécifiques définies
            par les plateformes de distribution.
          </p>
        </section>

        <section>
          <h2>Article 4 — Description des fonctionnalités</h2>
          <ul>
            <li>
              <strong>Création d'événements :</strong> l'utilisateur peut créer
              un événement, en définir les paramètres (date, lieu, participants)
              et inviter d'autres utilisateurs.
            </li>
            <li>
              <strong>Chat dédié :</strong> chaque événement dispose d'un espace
              de discussion réservé aux participants invités.
            </li>
            <li>
              <strong>Gestion des dépenses :</strong> les participants peuvent
              ajouter, répartir et suivre les dépenses liées à l'événement. Ce
              module est un outil de calcul et de suivi ; WeGather n'effectue
              aucun transfert d'argent entre utilisateurs et n'intervient pas
              comme intermédiaire de paiement.
            </li>
            <li>
              <strong>Partage de photos :</strong> les participants peuvent
              ajouter des photos à l'événement, visibles par les autres
              participants invités.
            </li>
            <li>
              <strong>Réservations :</strong> WeGather peut permettre
              d'effectuer des réservations pour faciliter vos évènements
              (restaurants, activités, etc.). Dans ce cas, le contrat de
              réservation est conclu directement entre l'utilisateur et le
              prestataire tiers ; WeGather agit uniquement en tant
              qu'intermédiaire technique et n'est pas partie à cette
              transaction.
            </li>
          </ul>
        </section>
        <section>
          <h2>Article 5 — Obligations et responsabilité de l'utilisateur</h2>
          <p>
            L'utilisateur s'engage à utiliser WeGather conformément à sa
            destination et à la réglementation en vigueur. Il s'engage notamment
            à ne pas publier de contenu illicite, injurieux, diffamatoire, ou
            portant atteinte aux droits de tiers via le chat ou le partage de
            photos.
          </p>
          <p>
            L'utilisateur est seul responsable des dépenses qu'il déclare et des
            réservations qu'il effectue via le Service.
          </p>
        </section>

        <section>
          <h2>Article 6 — Responsabilité de WeGather</h2>
          <p>
            WeGather met en œuvre les moyens raisonnables pour assurer un accès
            continu et sécurisé au Service, sans garantie d'absence
            d'interruption ou d'erreur. WeGather ne saurait être tenu
            responsable :
          </p>
          <ul>
            <li>
              des litiges entre utilisateurs concernant la répartition des
              dépenses ;
            </li>
            <li>
              des manquements des prestataires tiers dans le cadre des
              réservations effectuées via le Service ;
            </li>
            <li>
              d'une interruption du Service due à un cas de force majeure ou à
              une maintenance nécessaire.
            </li>
          </ul>
        </section>

        <section>
          <h2>Article 7 — Données personnelles</h2>
          <p>
            Le traitement des données personnelles collectées dans le cadre de
            l'utilisation de WeGather est décrit dans la{" "}
            <a href="/politique-de-confidentialite">
              Politique de Confidentialité
            </a>
            , accessible depuis l'application. Conformément au RGPD,
            l'utilisateur dispose d'un droit d'accès, de rectification,
            d'effacement et de portabilité de ses données, exerçable à l'adresse
            wedoop3@gmail.com.
          </p>
        </section>

        <section>
          <h2>Article 8 — Propriété intellectuelle</h2>
          <p>
            L'ensemble des éléments composant WeGather (marque, logo, interface,
            code source) est protégé par le droit de la propriété intellectuelle
            et demeure la propriété exclusive de WeGather. Les contenus publiés
            par les utilisateurs (photos, messages) restent leur propriété, sous
            réserve d'une licence d'utilisation accordée à WeGather pour les
            besoins du fonctionnement du Service.
          </p>
        </section>

        <section>
          <h2>Article 9 — Résiliation</h2>
          <p>
            L'utilisateur peut supprimer son compte à tout moment depuis les
            paramètres de l'application. WeGather se réserve le droit de
            suspendre ou résilier un compte en cas de manquement grave aux
            présentes CGV, après notification préalable sauf urgence
            caractérisée.
          </p>
        </section>

        <section>
          <h2>Article 10 — Modification des CGV</h2>
          <p>
            WeGather se réserve le droit de modifier les présentes CGV à tout
            moment. Les utilisateurs seront informés de toute modification
            substantielle. La poursuite de l'utilisation du Service après
            modification vaut acceptation des nouvelles CGV.
          </p>
        </section>

        <section>
          <h2>Article 11 — Droit applicable et litiges</h2>
          <p>
            Les présentes CGV sont soumises au droit français. En cas de litige,
            une solution amiable sera recherchée en priorité. À défaut, et
            conformément à la réglementation applicable, l'utilisateur
            consommateur peut recourir gratuitement à un médiateur de la
            consommation. Les tribunaux compétents seront ceux désignés par le
            droit commun.
          </p>
        </section>

        <section>
          <h2>Article 12 — Contact</h2>
          <p>
            Pour toute question relative aux présentes CGV : wedoop3@gmail.com
          </p>
        </section>
      </main>
    </div>
  );
}

export default PageCGV;
