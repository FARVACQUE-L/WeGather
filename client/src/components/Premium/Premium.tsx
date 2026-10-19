import { motion } from "framer-motion";
import { Gem } from "lucide-react";
import "./Premium.css";

type Plan = {
  name: string;
  hostedEvents: number;
  galleryPhotos: number;
  // Libellé du bouton d'abonnement ; absent pour la formule gratuite.
  cta?: string;
};

// Mêmes valeurs que server/src/helper/planLimits.ts.
const PLANS: Plan[] = [
  { name: "Free", hostedEvents: 2, galleryPhotos: 15 },
  {
    name: "Premium",
    hostedEvents: 5,
    galleryPhotos: 30,
    cta: "Passer au Premium",
  },
  {
    name: "Premium+",
    hostedEvents: 10,
    galleryPhotos: 50,
    cta: "Passer au Premium+",
  },
];

const MAX_RESERVATIONS = 10;

const FEATURES: { label: string; value: (plan: Plan) => string | number }[] = [
  { label: "Événements organisés", value: (plan) => plan.hostedEvents },
  { label: "Photos par galerie", value: (plan) => plan.galleryPhotos },
  { label: "Réservations par événement", value: () => MAX_RESERVATIONS },
  { label: "Événements rejoints", value: () => "Illimité" },
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
              <tr key={feature.label}>
                <th scope="row">{feature.label}</th>
                {PLANS.map((plan) => (
                  <td key={plan.name}>{feature.value(plan)}</td>
                ))}
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
