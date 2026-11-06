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

export default transporter;
