import { motion } from "framer-motion";
import { Check, Gem } from "lucide-react";
import "./Premium.css";

type Plan = {
  name: string;
  hostedEvents: number;
  galleryPhotos: number;
  price: string;
  // Libellé du bouton d'abonnement ; absent pour la formule gratuite.
  cta?: string;
};

// Mêmes valeurs que server/src/helper/planLimits.ts.
const PLANS: Plan[] = [
  { name: "Free", hostedEvents: 2, galleryPhotos: 15, price: "Gratuit" },
  {
    name: "Premium",
    hostedEvents: 5,
    galleryPhotos: 30,
    price: "4,90 €\n(tarif unique)",
    cta: "Passer au Premium",
  },
  {
    name: "Premium+",
    hostedEvents: 10,
    galleryPhotos: 50,
    price: "9,90 € / mois",
    cta: "Passer au Premium+",
  },
];

const MAX_RESERVATIONS = 10;

// true : fonctionnalité incluse, affichée par une coche.
const FEATURES: {
  label: string;
  value: (plan: Plan) => string | number | true;
  className?: string;
}[] = [
  { label: "Événements organisés", value: (plan) => plan.hostedEvents },
  { label: "Événements rejoints", value: () => "Illimité" },
  { label: "To-do list", value: () => true },
  { label: "Messagerie en temps réel", value: () => true },
  { label: "Réservations par événement", value: () => MAX_RESERVATIONS },
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
    </motion.div>
  );
}

export default Premium;
