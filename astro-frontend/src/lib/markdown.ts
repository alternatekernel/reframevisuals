// Server-side markdown for blog posts: same pipeline and element styling as the old react-markdown component
// (views/BlogPostPage.tsx), emitting plain HTML. Reader preferences (font size / line height) are CSS variables set on
// the article (see .post-body in styles/ui.css), so the HTML is identical for every reader.
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import { toHtml } from 'hast-util-to-html';
import { slugifyHeading } from '../utils/blog';

const SERIF = "'Charter', 'Bitstream Charter', 'Sitka Text', Cambria, Georgia, serif";
const CLASSES: Record<string, string> = {
  p: 'post-p text-[#292929] mb-7 sm:mb-8 break-words',
  ul: 'space-y-3 sm:space-y-4 my-8 sm:my-10 list-disc pl-6 sm:pl-8 text-[17px] sm:text-[20px] text-black/80',
  ol: 'space-y-3 sm:space-y-4 my-8 sm:my-10 list-decimal pl-6 sm:pl-8 text-[17px] sm:text-[20px] text-black/80',
  li: 'pl-2',
  a: 'text-brand border-b border-brand/30 hover:border-brand transition-all pb-0.5',
  strong: 'font-bold text-black',
  table: 'w-full text-left border-collapse min-w-[500px]',
  thead: 'bg-black/[0.05] border-b-2 border-black/[0.12]',
  th: 'px-6 py-4 text-[12px] font-black uppercase tracking-[0.2em] text-black/40',
  td: 'px-6 py-5 text-[16px] text-black/70 border-b border-black/[0.18] leading-relaxed',
};
const SERIF_TAGS = new Set(['p', 'ul', 'ol', 'li', 'td']);
const text = (n: any): string => (n.type === 'text' ? n.value : (n.children || []).map(text).join(''));

const COPY_ICON = {
  type: 'element', tagName: 'svg',
  properties: { xmlns: 'http://www.w3.org/2000/svg', width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
  children: [
    { type: 'element', tagName: 'rect', properties: { width: 14, height: 14, x: 8, y: 8, rx: 2, ry: 2 }, children: [] },
    { type: 'element', tagName: 'path', properties: { d: 'M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2' }, children: [] },
  ],
};

function walk(children: any[]): any[] {
  const out: any[] = [];
  for (const child of children) {
    if (child.type !== 'element') { out.push(child); continue; }
    const tag = child.tagName;
    if (tag === 'h1') continue;
    child.children = walk(child.children || []);
    if (tag === 'h2' || tag === 'h3') {
      const id = slugifyHeading(text(child));
      child.properties = {
        id,
        className: (tag === 'h2'
          ? 'group font-heading text-[24px] sm:text-[30px] font-black mt-14 sm:mt-20 mb-5 sm:mb-6 text-black tracking-tight leading-tight border-t border-black/[0.18] pt-8 sm:pt-12 break-words'
          : 'group font-heading text-[20px] sm:text-[24px] font-black mt-10 sm:mt-12 mb-4 text-black tracking-tight break-words').split(' '),
      };
      child.children = [
        { type: 'element', tagName: 'span', properties: {}, children: child.children },
        { type: 'element', tagName: 'button', properties: { type: 'button', dataCopyHeading: id, className: 'ml-2 opacity-0 group-hover:opacity-100 transition-opacity align-middle'.split(' '), ariaLabel: 'Copy heading link' }, children: [COPY_ICON] },
      ];
      out.push(child);
      continue;
    }
    if (CLASSES[tag]) {
      child.properties = { ...(child.properties || {}), className: CLASSES[tag].split(' ') };
      if (SERIF_TAGS.has(tag)) child.properties.style = `font-family: ${SERIF}`;
    }
    if (tag === 'table') {
      out.push({ type: 'element', tagName: 'div', properties: { className: 'overflow-x-auto my-12 border border-black/[0.12] rounded-lg shadow-sm'.split(' ') }, children: [child] });
      continue;
    }
    out.push(child);
  }
  return out;
}

const processor = unified().use(remarkParse).use(remarkGfm).use(remarkRehype);
export function renderMarkdown(markdown: string): string {
  const tree: any = processor.runSync(processor.parse(markdown));
  tree.children = walk(tree.children);
  return toHtml(tree);
}

// Unstyled markdown (CMS pages): plain HTML, styled by the typography plugin classes on the wrapper.
export function renderMarkdownPlain(markdown: string): string {
  return toHtml(processor.runSync(processor.parse(markdown)) as any);
}
