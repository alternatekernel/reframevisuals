// Keyword emphasis for testimonial quotes (port of highlightText in sections/Testimonials.tsx). Returns escaped HTML.
const KEYWORDS = [
  'Amazon', 'Remove.bg', 'Photoshop', 'Reframe Visuals', 'Reframe',
  '12 hours', '3 days', '12-hour', 'clipping path', 'clipping paths',
  'background removal', 'ghost mannequin', 'color correction', 'shadow depth',
  'style guides', 'retouching', 'natural shadows', 'white backgrounds',
  'color accuracy', 'API',
];
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const regexEscape = (s: string) => s; // keywords are used as raw patterns in the original ('.' matches any char); keep identical behaviour

export function highlightHtml(text: string): string {
  let parts: { t: string; hl: boolean }[] = [{ t: text, hl: false }];
  for (const keyword of KEYWORDS) {
    const next: { t: string; hl: boolean }[] = [];
    for (const part of parts) {
      if (part.hl) { next.push(part); continue; }
      for (const sub of part.t.split(new RegExp(`(${regexEscape(keyword)})`, 'gi'))) {
        if (sub.toLowerCase() === keyword.toLowerCase()) next.push({ t: sub, hl: true });
        else if (sub) next.push({ t: sub, hl: false });
      }
    }
    parts = next;
  }
  return parts.map((p) => (p.hl ? `<span class="text-black font-semibold">${esc(p.t)}</span>` : esc(p.t))).join('');
}
