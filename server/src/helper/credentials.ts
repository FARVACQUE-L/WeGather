export const PASSWORD_RULES_MESSAGE =
  "Le mot de passe doit contenir au moins 12 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial (@$!%*?&).";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const isValidPassword = (password: unknown): password is string =>
  typeof password === "string" &&
  password.length >= 12 &&
  password.length <= 256 &&
  /[A-Z]/.test(password) &&
  /[a-z]/.test(password) &&
  /\d/.test(password) &&
  /[@$!%*?&]/.test(password);

export const isValidEmail = (email: string) =>
  email.length <= 100 && EMAIL_PATTERN.test(email);

export const isValidUsername = (username: string) =>
  username.length >= 3 && username.length <= 45;
