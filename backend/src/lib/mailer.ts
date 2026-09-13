import nodemailer from 'nodemailer';
import { config } from '../config.js';

// Mailpit locally (compose.backend.yml exposes SMTP on 1025, a web UI to
// actually read the mail on 8025); a real ESP takes over via the same
// three env vars once one exists. No mail ever leaves localhost in dev.
const transport = nodemailer.createTransport({
  host: config.SMTP_HOST,
  port: config.SMTP_PORT,
  secure: false,
});

export async function sendMail(to: string, subject: string, text: string) {
  await transport.sendMail({ from: 'NEXGO <no-reply@nexgo.local>', to, subject, text });
}
