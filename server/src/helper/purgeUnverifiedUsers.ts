import userRepository from "../modules/user/userRepository";

const ONE_HOUR = 60 * 60 * 1000;

// Supprime les comptes dont l'adresse e-mail n'a pas été confirmée avant
// l'expiration du lien (24 h après le dernier envoi). Un compte non confirmé
// ne peut pas se connecter : il n'a donc ni événement ni contenu.
export const purgeUnverifiedUsers = async () => {
  try {
    const userIds = await userRepository.readExpiredUnverifiedIds();
    let deleted = 0;

    for (const userId of userIds) {
      try {
        await userRepository.deleteUnverified(userId);
        deleted += 1;
      } catch (err) {
        console.error(`Échec de la suppression du compte ${userId} :`, err);
      }
    }

    if (deleted) {
      console.info(`${deleted} compte(s) non confirmé(s) supprimé(s)`);
    }
  } catch (err) {
    console.error("Échec de la purge des comptes non confirmés :", err);
  }
};

export const startUnverifiedUsersPurge = () => {
  purgeUnverifiedUsers();
  setInterval(purgeUnverifiedUsers, ONE_HOUR);
};
