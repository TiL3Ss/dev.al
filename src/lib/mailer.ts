import nodemailer, { type Transporter } from 'nodemailer';

let transporter: Transporter | undefined;

function getTransporter(): Transporter {
  if (transporter) return transporter;

  const host = import.meta.env.SMTP_HOST;
  const port = Number(import.meta.env.SMTP_PORT ?? 587);
  const user = import.meta.env.SMTP_USER;
  const pass = import.meta.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error(
      'Faltan variables SMTP_HOST / SMTP_USER / SMTP_PASS. Copia .env.example a .env y completa tus credenciales SMTP.'
    );
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true para 465 (SSL), false para 587/25 (STARTTLS)
    auth: { user, pass },
  });

  return transporter;
}

export interface ContactMessage {
  name: string;
  email: string;
  message: string;
}

/** Envía el mensaje del formulario de Contacts al correo de destino. */
export async function sendContactEmail(msg: ContactMessage): Promise<void> {
  const to = import.meta.env.CONTACT_TO_EMAIL;
  if (!to) {
    throw new Error('Falta CONTACT_TO_EMAIL en las variables de entorno.');
  }

  const t = getTransporter();
  await t.sendMail({
    from: `"AL.DEV — Contacto" <${import.meta.env.SMTP_USER}>`,
    to,
    replyTo: msg.email,
    subject: `Nuevo mensaje de contacto — ${msg.name}`,
    text: `De: ${msg.name} <${msg.email}>\n\n${msg.message}`,
    html: `
      <p><strong>De:</strong> ${escapeHtml(msg.name)} &lt;${escapeHtml(msg.email)}&gt;</p>
      <p>${escapeHtml(msg.message).replace(/\n/g, '<br>')}</p>
    `,
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
