export const cleanMarkdown = (text) => {
  if (!text) return '';

  return text
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/###\s*/g, '')
    .replace(/##\s*/g, '')
    .replace(/#\s*/g, '')
    .replace(/^[-*+]\s+/gm, '')
    .trim();
};

export const parseSteps = (text) => {
  if (!text) return [];

  const cleaned = cleanMarkdown(text);
  const lines = cleaned.split('\n').filter(line => line.trim());

  return lines.map((line, index) => ({
    id: index,
    title: line.trim(),
    description: ''
  }));
};

export const parseEmail = (text) => {
  if (!text) return { subject: '', body: '' };

  const cleaned = cleanMarkdown(text);
  const lines = cleaned.split('\n');

  let subject = '';
  let bodyStart = 0;

  lines.forEach((line, index) => {
    if (line.toLowerCase().includes('subject:')) {
      subject = line.replace(/subject:\s*/i, '').trim();
      bodyStart = index + 1;
    }
  });

  const body = lines.slice(bodyStart).join('\n').trim();

  return { subject, body };
};
