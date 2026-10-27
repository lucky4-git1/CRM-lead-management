export function renderTemplate(
  template: string,
  variables: Record<string, string | number | null | undefined>
): string {
  let output = template;

  for (const [key, val] of Object.entries(variables)) {
    const safeVal = val !== null && val !== undefined ? String(val) : '';
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    output = output.replace(regex, safeVal);
  }

  // Remove any remaining unresolved {{ tag }} placeholders
  output = output.replace(/{{\s*[\w.-]+\s*}}/g, '');

  return output;
}
