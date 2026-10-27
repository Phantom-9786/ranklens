export type Audit = { id: string; domain: string; category: string; score: number; issues: number; pages: number; label: string };
export const audits: Audit[] = [
  { id: 'studio-north', domain: 'studio-north.example', category: 'Creative portfolio', score: 82, issues: 12, pages: 24, label: 'SN' },
  { id: 'field-notes', domain: 'field-notes.example', category: 'Independent publication', score: 67, issues: 23, pages: 48, label: 'FN' },
  { id: 'evergreen', domain: 'evergreen.example', category: 'Small business', score: 94, issues: 4, pages: 16, label: 'EG' },
];
export const findings = [
  { title: 'Give every page a unique description', detail: 'Several sample pages are missing a clear meta description.', severity: 'High', count: 6, category: 'Content' },
  { title: 'Make your images more accessible', detail: 'Add descriptive alternative text to meaningful images.', severity: 'Medium', count: 4, category: 'Accessibility' },
  { title: 'Bring clarity to page headings', detail: 'Use one descriptive primary heading for each page.', severity: 'Medium', count: 2, category: 'Structure' },
];
