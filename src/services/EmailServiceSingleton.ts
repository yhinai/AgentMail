/**
 * Email Service Singleton
 * Ensures only one instance of EmailService exists across the application
 */

import { EmailService } from './EmailService';

let emailServiceInstance: EmailService | null = null;

export function getEmailService(): EmailService {
  if (!emailServiceInstance) {
    emailServiceInstance = new EmailService();
  }
  return emailServiceInstance;
}

export function resetEmailService(): void {
  if (emailServiceInstance) {
    emailServiceInstance.shutdown();
    emailServiceInstance = null;
  }
}
