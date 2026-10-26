import { motion } from "framer-motion";
import { Check, Gem } from "lucide-react";
import "./Premium.css";

type Plan = {
  name: string;
  hostedEvents: number;
  galleryPhotos: number;
  reservations: number;
  price: string;
  // Libellé du bouton d'abonnement ; absent pour la formule gratuite.
  cta?: string;
};

// Mêmes valeurs que server/src/helper/planLimits.ts.
const PLANS: Plan[] = [
  {
    name: "Free",
    hostedEvents: 2,
    galleryPhotos: 15,
    reservations: 10,
    price: "Gratuit",
  },
  {
    name: "Premium",
    hostedEvents: 5,
    galleryPhotos: 30,
    reservations: 10,
    price: "4,90 €\n(tarif unique)",
    cta: "Passer au Premium",
  },
  {
    name: "Gold",
    hostedEvents: Infinity,
    galleryPhotos: 50,
    reservations: Infinity,
    price: "9,90 € / mois",
    cta: "Passer au Gold",
  },
];

// Infinity : pas de limite.
const formatLimit = (limit: number) =>
  limit === Infinity ? "Illimité" : limit;

// true : fonctionnalité incluse, affichée par une coche.
const FEATURES: {
  label: string;
  value: (plan: Plan) => string | number | true;
  className?: string;
}[] = [
  {
    label: "Événements organisés",
    value: (plan) => formatLimit(plan.hostedEvents),
  },
  { label: "Événements rejoints", value: () => "Illimité" },
  { label: "To-do list", value: () => true },
  { label: "Messagerie en temps réel", value: () => true },
  {
    label: "Réservations par événement",
    value: (plan) => formatLimit(plan.reservations),
  },
  { label: "Budget partagé", value: () => true },
  {
    label: "Galerie partagée / photos par galerie",
    value: (plan) => plan.galleryPhotos,
  },
  { label: "Signalement", value: () => true },
  {
    label: "Tarif",
    value: (plan) => plan.price,
    className: "premium-price",
  },
];

function Premium() {
  return (
    <motion.div
      className="premium"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <motion.h1
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        Premium
      </motion.h1>

      <div className="premium-table-wrapper">
        <table className="premium-table">
          <thead>
            <tr>
              <th scope="col">Fonctionnalités</th>
              {PLANS.map((plan) => (
                <th
                  key={plan.name}
                  scope="col"
                  className={plan.cta ? "is-paid" : undefined}
                >
                  {plan.cta && <Gem size={16} />}
                  {plan.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {FEATURES.map((feature) => (
              <tr key={feature.label} className={feature.className}>
                <th scope="row">{feature.label}</th>
                {PLANS.map((plan) => {
                  const value = feature.value(plan);

                  return (
                    <td key={plan.name}>
                      {value === true ? (
                        <Check
                          size={20}
                          className="premium-included"
                          aria-label="Inclus"
                        />
                      ) : (
                        value
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td />
              {PLANS.map((plan) => (
                <td key={plan.name}>
                  {plan.cta && (
                    <button type="button" className="premium-cta">
                      {plan.cta}
                    </button>
                  )}
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Sous 428px, le tableau est remplacé par une card par formule
          (Premium.css). Le tarif passe sous le nom de la formule. */}
      <div className="premium-cards">
        {PLANS.map((plan) => (
          <article
            key={plan.name}
            className={`premium-card${plan.cta ? " is-paid" : ""}`}
          >
            <header>
              <h2>
                {plan.cta && <Gem size={18} />}
                {plan.name}
              </h2>
              <p className="premium-card-price">{plan.price}</p>
            </header>

            <ul>
              {FEATURES.filter(
                (feature) => feature.className !== "premium-price",
              ).map((feature) => {
                const value = feature.value(plan);

                return (
                  <li key={feature.label}>
                    <span>{feature.label}</span>
                    {value === true ? (
                      <Check
                        size={20}
                        className="premium-included"
                        aria-label="Inclus"
                      />
                    ) : (
                      <strong>{value}</strong>
                    )}
                  </li>
                );
              })}
            </ul>

            {plan.cta && (
              <button type="button" className="premium-cta">
                {plan.cta}
              </button>
            )}
          </article>
        ))}
      </div>
    </motion.div>
  );
}

export default Premium;
