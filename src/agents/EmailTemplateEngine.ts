// Email Template Engine - Template formatting for emails
import { OpenAIIntegration } from '../integrations/OpenAIIntegration';
import type { EmailContent } from '../types';

interface EmailTemplate {
  fontFamily: string;
  headerColor: string;
  textColor: string;
  ctaColor: string;
  footer: string;
}

interface FormattedEmail {
  subject: string;
  html: string;
  text: string;
}

export class EmailTemplateEngine {
  private templates: Map<string, EmailTemplate>;

  constructor(private openai: OpenAIIntegration) {
    this.templates = this.loadTemplates();
  }

  async format(content: any, templateName: string): Promise<FormattedEmail> {
    const template = this.templates.get(templateName) || this.templates.get('default')!;

    const html = this.renderHTML(content, template);
    const text = this.renderText(content, template);
    const subject = content.subject || `${templateName} - Message`;

    return { subject, html, text };
  }
  
  private renderHTML(content: any, template: EmailTemplate): string {
    // Sanitize HTML content
    const sanitize = (str: string) => str.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    
    return `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: ${template.fontFamily}; color: ${template.textColor}; line-height: 1.6; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: ${template.headerColor}; padding: 20px; border-radius: 8px 8px 0 0; color: white; }
    .content { background: white; padding: 20px; border: 1px solid #e0e0e0; }
    .offer { background: #f0f8ff; padding: 15px; border-left: 4px solid #4169e1; margin: 20px 0; }
    .cta { background: ${template.ctaColor}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="content">
      <p>${sanitize(content.greeting || 'Hello')}</p>
      <p>${sanitize(content.opening || '')}</p>
      ${content.offer ? `<div class="offer">${sanitize(content.offer)}</div>` : ''}
      ${content.urgency ? `<p>${sanitize(content.urgency)}</p>` : ''}
      <p>${sanitize(content.closing || '')}</p>
      ${content.signature ? `<p>${sanitize(content.signature)}</p>` : ''}
    </div>
    <div class="footer">
      ${template.footer}
    </div>
  </div>
</body>
</html>`;
  }
  
  private renderText(content: any, template: EmailTemplate): string {
    return `${content.greeting || 'Hello'}

${content.opening || ''}

${content.offer || ''}

${content.urgency || ''}

${content.closing || ''}

${content.signature || ''}

---
${template.footer}`;
  }
  
  private loadTemplates(): Map<string, EmailTemplate> {
    const templates = new Map<string, EmailTemplate>();
    
    templates.set('friendly_casual', {
      fontFamily: 'Arial, sans-serif',
      headerColor: '#4CAF50',
      textColor: '#333',
      ctaColor: '#4CAF50',
      footer: 'Sent from my iPhone'
    });
    
    templates.set('professional', {
      fontFamily: 'Helvetica, Arial, sans-serif',
      headerColor: '#2C3E50',
      textColor: '#2C3E50',
      ctaColor: '#3498DB',
      footer: 'This email and any attachments are confidential.'
    });
    
    templates.set('urgent', {
      fontFamily: 'Arial, sans-serif',
      headerColor: '#E74C3C',
      textColor: '#333',
      ctaColor: '#E74C3C',
      footer: 'Ready to move quickly'
    });
    
    templates.set('enthusiast', {
      fontFamily: 'Georgia, serif',
      headerColor: '#9B59B6',
      textColor: '#333',
      ctaColor: '#9B59B6',
      footer: 'Passionate collector'
    });
    
    templates.set('counter_offer', {
      fontFamily: 'Arial, sans-serif',
      headerColor: '#3498DB',
      textColor: '#333',
      ctaColor: '#3498DB',
      footer: 'Looking forward to your response'
    });
    
    templates.set('default', {
      fontFamily: 'Arial, sans-serif',
      headerColor: '#3498DB',
      textColor: '#333',
      ctaColor: '#3498DB',
      footer: 'AutoBazaaar'
    });
    
    return templates;
  }
}

