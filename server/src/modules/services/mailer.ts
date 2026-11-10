import nodemailer from "nodemailer";

const port = Number(process.env.EMAIL_PORT) || 465;

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.ionos.fr",
  port,
  secure: port === 465,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const MAIL_FROM = `"Équipe WeGather" <${process.env.EMAIL_USER}>`;

export const escapeHtml = (text: string) =>
  text.replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ] as string,
  );

export const CONTACT_LINK =
  '<a href="mailto:contact@wegather.fr" style="color:#b44708;">contact@wegather.fr</a>';

const FONT = "'Be Vietnam Pro', Arial, Helvetica, sans-serif";

type MailTemplate = {
  title: string;
  // HTML de confiance : tout texte venant d'un utilisateur doit être échappé.
  paragraphs: string[];
  button?: { label: string; url: string };
  note?: string;
};

// Les messageries ignorent la plupart du CSS : mise en page en tableaux et
// styles écrits directement dans les balises.
export const renderMail = ({
  title,
  paragraphs,
  button,
  note,
}: MailTemplate) => {
  const text = paragraphs
    .map(
      (p) =>
        `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#333333;">${p}</p>`,
    )
    .join("");

  const action = button
    ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px auto 24px;">
        <tr>
          <td align="center" bgcolor="#b44708" style="border-radius:20px;background:#b44708;background-image:linear-gradient(90deg,#e98d66,#b44708);">
            <a href="${button.url}" target="_blank" style="display:inline-block;padding:13px 28px;font-family:${FONT};font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:20px;">${button.label}</a>
          </td>
        </tr>
      </table>
      <p style="margin:0 0 16px;font-size:12px;line-height:1.5;color:#888888;">Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br><a href="${button.url}" style="color:#b44708;word-break:break-all;">${button.url}</a></p>`
    : "";

  const footnote = note
    ? `<p style="margin:16px 0 0;font-size:13px;line-height:1.5;color:#666666;">${note}</p>`
    : "";

  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#f9f9f9;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f9f9f9" style="background-color:#f9f9f9;">
  <tr>
    <td align="center" style="padding:32px 16px;font-family:${FONT};">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">
        <tr>
          <td align="center" style="padding:0 0 20px;font-family:${FONT};font-size:24px;font-weight:700;color:#ff7e5f;">We<i>G</i>ather</td>
        </tr>
        <tr>
          <td bgcolor="#ffffff" style="background-color:#ffffff;border-radius:16px;padding:36px 32px;font-family:${FONT};">
            <h1 style="margin:0 0 20px;font-size:22px;line-height:1.3;color:#222222;">${title}</h1>
            ${text}
            ${action}
            ${footnote}
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:20px 8px 0;font-family:${FONT};font-size:12px;line-height:1.5;color:#999999;">
            Cet e-mail a été envoyé automatiquement, merci de ne pas y répondre.<br>
            Une question ? <a href="mailto:contact@wegather.fr" style="color:#b44708;">contact@wegather.fr</a>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
};

export default transporter;
