import nodemailer from "nodemailer";

/** Sends mail through SMTP when configured; otherwise logs it (development). */
export async function sendMail(to: string, subject: string, text: string) {
  if (!process.env.SMTP_HOST) {
    console.info(`\n[mail:dev] To: ${to}\nSubject: ${subject}\n${text}\n`);
    return;
  }
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  });
  await transport.sendMail({ from: process.env.MAIL_FROM || "no-reply@localhost", to, subject, text });
}
