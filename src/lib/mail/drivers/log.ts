import { randomUUID } from "crypto";
import type { MailDriver, MailEnvelope, MailAddress, SendResult } from "../types";
import { formatAddress } from "../types";

export class LogDriver implements MailDriver {
  name = "log";

  async send(envelope: MailEnvelope, from: MailAddress): Promise<SendResult> {
    const recipients = envelope.to.map(formatAddress).join(", ");
    const messageId = `log-${randomUUID()}`;

    console.log(
      `[Mail:log] From: ${formatAddress(from)}\n` +
      `  To: ${recipients}\n` +
      `  Subject: ${envelope.subject}\n` +
      `  MessageId: ${messageId}`
    );

    return { success: true, messageId };
  }
}
