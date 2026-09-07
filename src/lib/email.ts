import { Resend } from "resend";

export interface EmailSender {
  sendVerificationCode(input: { to: string; code: string }): Promise<void>;
  sendPasswordResetLink(input: { to: string; resetUrl: string }): Promise<void>;
}

const FROM = "wonderSplit <onboarding@resend.dev>";

class ResendEmailSender implements EmailSender {
  private resend = new Resend(process.env.RESEND_API_KEY);

  async sendVerificationCode({ to, code }: { to: string; code: string }): Promise<void> {
    await this.resend.emails.send({
      from: FROM,
      to,
      subject: "Tu código de verificación — wonderSplit",
      text: `Hola,\n\nTu código para verificar tu cuenta de wonderSplit es:\n\n${code}\n\nVence en 10 minutos. Si no pediste este código, podés ignorar este correo.`,
    });
  }

  async sendPasswordResetLink({ to, resetUrl }: { to: string; resetUrl: string }): Promise<void> {
    await this.resend.emails.send({
      from: FROM,
      to,
      subject: "Recuperá tu contraseña — wonderSplit",
      text: `Hola,\n\nPara elegir una contraseña nueva, entrá a este enlace:\n\n${resetUrl}\n\nVence en 30 minutos. Si no pediste esto, podés ignorar este correo.`,
    });
  }
}

export interface SentEmail {
  to: string;
  code: string;
  sentAt: Date;
}

// Dev/test double: never touches the network. Populated in-memory so tests
// can pull the plaintext code straight off a structured field, no parsing a
// rendered email body.
export const sentEmails: SentEmail[] = [];

export function resetSentEmails(): void {
  sentEmails.length = 0;
}

export interface SentResetLink {
  to: string;
  resetUrl: string;
  sentAt: Date;
}

// Same rationale as sentEmails, kept separate since the payload shape differs
// (a full URL, not a short code).
export const sentResetLinks: SentResetLink[] = [];

export function resetSentResetLinks(): void {
  sentResetLinks.length = 0;
}

class CaptureEmailSender implements EmailSender {
  async sendVerificationCode({ to, code }: { to: string; code: string }): Promise<void> {
    sentEmails.push({ to, code, sentAt: new Date() });
    console.log(`[email] verification code for ${to}: ${code}`);
  }

  async sendPasswordResetLink({ to, resetUrl }: { to: string; resetUrl: string }): Promise<void> {
    sentResetLinks.push({ to, resetUrl, sentAt: new Date() });
    console.log(`[email] password reset link for ${to}: ${resetUrl}`);
  }
}

export const emailSender: EmailSender = process.env.RESEND_API_KEY
  ? new ResendEmailSender()
  : new CaptureEmailSender();
