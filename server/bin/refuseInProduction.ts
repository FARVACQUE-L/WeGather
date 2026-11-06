export const refuseInProduction = (script: string) => {
  if (
    process.env.NODE_ENV === "production" &&
    process.env.ALLOW_DB_RESET !== "yes"
  ) {
    console.error(
      `${script} efface les données de la base : refusé avec NODE_ENV=production.\nPour confirmer, relancez avec ALLOW_DB_RESET=yes.`,
    );
    process.exit(1);
  }
};
