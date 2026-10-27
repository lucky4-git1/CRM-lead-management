import { describe, it, expect } from 'vitest';
import { renderTemplate } from '@/lib/template-engine';

describe('Dynamic Email Template Engine', () => {
  it('should substitute merge tags with provided customer context', () => {
    const raw = 'Hello {{ firstName }}, thank you for evaluating our CRM for {{companyName}}!';
    const rendered = renderTemplate(raw, {
      firstName: 'Sarah',
      companyName: 'Acme Corp',
    });

    expect(rendered).toBe('Hello Sarah, thank you for evaluating our CRM for Acme Corp!');
  });

  it('should safely replace missing keys with empty strings without crashing', () => {
    const raw = 'Hi {{firstName}} from {{ companyName }}, your rep is {{ ownerName }}.';
    const rendered = renderTemplate(raw, {
      firstName: 'Daniel',
    });

    expect(rendered).toBe('Hi Daniel from , your rep is .');
  });
});
