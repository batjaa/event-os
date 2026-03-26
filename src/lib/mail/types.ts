export type MailAddress = {
  email: string;
  name?: string;
};

/** Format a MailAddress as "Name <email>" or just "email". */
export function formatAddress(addr: MailAddress): string {
  return addr.name ? `${addr.name} <${addr.email}>` : addr.email;
}

export type MailEnvelope = {
  to: MailAddress[];
  subject: string;
  html: string;
  text?: string;
  tags?: string[];
};

export type SendResult = {
  success: boolean;
  messageId?: string;
  error?: string;
};

export interface MailDriver {
  name: string;
  send(envelope: MailEnvelope, from: MailAddress): Promise<SendResult>;
}

export type Mailable = {
  subject: string;
  html: string;
  text?: string;
  tags?: string[];
};
