// Converts simple, stateless React section/view files (.tsx) into .astro files.
//   node scripts/codemod-astro.mjs <file.tsx>...   (writes <file>.astro next to each input; prints a report)
// Handled: className/htmlFor, <Link to>, framer-motion entrance props -> data-reveal, key props, Helmet JSON-LD.
// Refused (reported, file left alone): hooks, event handlers, AnimatePresence, x/scale/hover/variants animation, children props.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { basename, dirname, join, relative } from 'node:path';

const files = process.argv.slice(2);
const report = [];

// ---- helpers -------------------------------------------------------------------------------
// Finds the end index (exclusive) of a balanced {...} / (...) group starting at `start` (the opening char).
function balanced(src, start) {
  const open = src[start];
  const close = { '{': '}', '(': ')', '[': ']' }[open];
  let depth = 0;
  for (let i = start; i < src.length; i++) {
    const c = src[i];
    // A quote only starts a JS string after an operator/opening punctuation; in JSX text (apostrophes) it is plain text.
    let pj = i - 1;
    while (pj >= start && /\s/.test(src[pj])) pj--;
    const prev = pj >= start ? src[pj] : '=';
    if ((c === '"' || c === "'" || c === '`') && (c === '`' || /[=(,:[{?&|!+\-;]/.test(prev))) {
      const q = c;
      i++;
      while (i < src.length && src[i] !== q) { if (src[i] === '\\') i++; if (q === '`' && src[i] === '$' && src[i + 1] === '{') { i = balanced(src, i + 1) - 1; } i++; }
      continue;
    }
    if (c === '/' && src[i + 1] === '/') { while (i < src.length && src[i] !== '\n') i++; continue; }
    if (c === '/' && src[i + 1] === '*') { i = src.indexOf('*/', i) + 1; continue; }
    if (c === open) depth++;
    else if (c === close) { depth--; if (depth === 0) return i + 1; }
  }
  throw new Error('unbalanced ' + open);
}

// Parses the attribute list of an opening tag. `s` starts right after the tag name; returns { attrs, end, selfClose }.
function parseTag(src, from) {
  const attrs = [];
  let i = from;
  for (;;) {
    while (/\s/.test(src[i])) i++;
    if (src[i] === '/' && src[i + 1] === '>') return { attrs, end: i + 2, selfClose: true };
    if (src[i] === '>') return { attrs, end: i + 1, selfClose: false };
    if (src[i] === '{') { // spread attribute
      const e = balanced(src, i);
      attrs.push({ spread: src.slice(i, e) });
      i = e;
      continue;
    }
    const m = /^[A-Za-z_:][\w:.-]*/.exec(src.slice(i));
    if (!m) throw new Error('bad attribute at: ' + src.slice(i, i + 40));
    const name = m[0];
    i += name.length;
    while (/\s/.test(src[i])) i++;
    if (src[i] !== '=') { attrs.push({ name, value: null }); continue; }
    i++;
    while (/\s/.test(src[i])) i++;
    let value;
    if (src[i] === '{') { const e = balanced(src, i); value = src.slice(i, e); i = e; }
    else { const q = src[i]; const e = src.indexOf(q, i + 1); value = src.slice(i, e + 1); i = e + 1; }
    attrs.push({ name, value });
  }
}

const num = (s, key) => { const m = new RegExp(`\\b${key}:\\s*(-?[\\d.]+)`).exec(s || ''); return m ? Number(m[1]) : undefined; };

function unsupportedMotion(attrs) {
  const bad = ['whileHover', 'whileTap', 'whileFocus', 'whileDrag', 'variants', 'layout', 'layoutId', 'exit', 'drag', 'custom'];
  return attrs.find((a) => bad.includes(a.name));
}

function stripEarlyJsxReturns(code) {
  let out = '';
  let i = 0;
  const re = /\bif\s*\(/g;
  let m;
  while ((m = re.exec(code))) {
    const condEnd = balanced(code, m.index + m[0].length - 1);
    let j = condEnd;
    while (/\s/.test(code[j])) j++;
    let end = -1;
    if (code[j] === '{') {
      const e = balanced(code, j);
      if (/^\{\s*return\s*\(?\s*</.test(code.slice(j, e))) end = e;
    } else if (/^return\s*\(?\s*</.test(code.slice(j))) {
      const nl = code.indexOf(';', j);
      end = nl + 1;
    }
    if (end > -1) { out += code.slice(i, m.index); i = end; re.lastIndex = end; }
  }
  return out + code.slice(i);
}

// className/htmlFor -> class/for on lowercase (HTML) tags only; React components keep their props.
function renameHtmlAttrs(src) {
  let out = '';
  let i = 0;
  const re = /<([a-z][\w-]*)(?=[\s/>])/g;
  let m;
  while ((m = re.exec(src))) {
    let tag;
    try { tag = parseTag(src, m.index + m[0].length); } catch { continue; }
    out += src.slice(i, m.index + m[0].length);
    let attrText = src.slice(m.index + m[0].length, tag.end);
    // rename only top-level attribute names, using the parsed positions
    let pos = 0, rebuilt = '';
    for (const a of tag.attrs) {
      if (!a.name) continue;
      const idx = attrText.indexOf(a.name, pos);
      if (idx < 0) continue;
      const nn = a.name === 'className' ? 'class' : a.name === 'htmlFor' ? 'for' : a.name;
      rebuilt += attrText.slice(pos, idx) + nn;
      pos = idx + a.name.length;
    }
    rebuilt += attrText.slice(pos);
    out += rebuilt;
    i = tag.end;
    re.lastIndex = tag.end;
  }
  return out + src.slice(i);
}

// <Button asChild variant size className><Link to=..>..</Link></Button> -> <a href=.. class={cx(buttonVariants({..}), ..)}>..</a>
// (Radix Slot cannot merge props across the Astro/React boundary, so the styling is applied directly.)
function rewriteAsChild(src, state) {
  let out = '';
  let i = 0;
  const re = /<Button(?=[\s>])/g;
  let m;
  while ((m = re.exec(src))) {
    const tag = parseTag(src, m.index + m[0].length);
    if (!tag.attrs.some((a) => a.name === 'asChild') || tag.selfClose) continue;
    const rest = src.slice(tag.end);
    const cm = /^\s*<(Link|a)(?=[\s>])/.exec(rest);
    if (!cm) { state.issues.push('asChild child not a link'); continue; }
    const childOpen = tag.end + cm[0].length;
    const child = parseTag(src, childOpen);
    const closeRe = new RegExp(`</${cm[1]}>\\s*</Button>`);
    const closeM = closeRe.exec(src.slice(child.end));
    if (!closeM) { state.issues.push('asChild close not found'); continue; }
    const content = src.slice(child.end, child.end + closeM.index);
    const val = (a) => (a.value.startsWith('{') ? a.value.slice(1, -1) : a.value);
    const get = (n) => tag.attrs.find((a) => a.name === n);
    const vp = ['variant', 'size', 'shape'].filter((n) => get(n)).map((n) => `${n}: ${val(get(n))}`).join(', ');
    const classes = [`buttonVariants({ ${vp} })`];
    const bc = get('className'); if (bc) classes.push(val(bc));
    const cc = child.attrs.find((a) => a.name === 'className' || a.name === 'class'); if (cc) classes.push(val(cc));
    const others = child.attrs.filter((a) => a !== cc).map((a) => (a.spread ? a.spread : a.value === null ? a.name : `${a.name === 'to' ? 'href' : a.name}=${a.value}`)).join(' ');
    const extra = tag.attrs.filter((a) => !['asChild', 'variant', 'size', 'shape', 'className'].includes(a.name));
    if (extra.length) state.issues.push('Button extra props: ' + extra.map((a) => a.name).join(','));
    out += src.slice(i, m.index) + `<a ${others} class={cx(${classes.join(', ')})}>${content}</a>`;
    i = child.end + closeM.index + closeM[0].length;
    re.lastIndex = i;
    state.usesButtonVariants = true;
  }
  return out + src.slice(i);
}

// ---- motion.* tag rewriting ------------------------------------------------------------------
function rewriteMotion(src, issues) {
  let out = '';
  let i = 0;
  const re = /<motion\.([a-zA-Z0-9]+)(?=[\s/>])/g;
  const closers = [];
  let m;
  while ((m = re.exec(src))) {
    out += src.slice(i, m.index);
    const tag = m[1];
    const { attrs, end, selfClose } = parseTag(src, m.index + m[0].length);
    const bad = unsupportedMotion(attrs);
    if (bad) { issues.push(`motion prop ${bad.name}`); }
    const get = (n) => attrs.find((a) => a.name === n)?.value;
    const initial = get('initial');
    const animate = get('animate');
    const whileInView = get('whileInView');
    const transition = get('transition');
    if (initial && /x:|scale:|rotate:|width|height/.test(initial)) issues.push('non-opacity/y initial animation');
    if (animate && !/opacity:\s*1\b/.test(animate) && !whileInView) issues.push('custom animate target');
    const kept = attrs.filter((a) => !['initial', 'animate', 'whileInView', 'viewport', 'transition', 'key', 'exit', 'style'].includes(a.name) || a.spread);
    const style = get('style');
    const vars = [];
    if (initial || whileInView || animate) {
      const delay = /delay:\s*([^,}]+)/.exec(transition || '')?.[1]?.trim();
      const dur = num(transition, 'duration');
      const y = num(initial, 'y');
      if (delay && delay !== '0') vars.push(`'--reveal-delay': \`\${${delay}}s\``);
      if (dur !== undefined && dur !== 0.5) vars.push(`'--reveal-duration': '${dur}s'`);
      if (y !== undefined && y !== 20) vars.push(`'--reveal-y': '${y}px'`);
    }
    let styleAttr = '';
    const styleInner = style ? style.replace(/^\{\{?/, '').replace(/\}?\}$/, '').trim() : '';
    if (vars.length || styleInner) styleAttr = ` style={{ ${[...vars, styleInner].filter(Boolean).join(', ')} }}`;
    const reveal = initial || whileInView || animate ? (whileInView || !animate ? ' data-reveal' : ' data-reveal="load"') : '';
    const keptStr = kept.map((a) => (a.spread ? a.spread : a.value === null ? a.name : `${a.name}=${a.value}`)).join(' ');
    out += `<${tag}${keptStr ? ' ' + keptStr : ''}${reveal}${styleAttr}${selfClose ? ' />' : '>'}`;
    if (!selfClose) closers.push(tag);
    i = end;
    re.lastIndex = end;
  }
  out += src.slice(i);
  return out.replace(/<\/motion\.([a-zA-Z0-9]+)>/g, '</$1>');
}

// ---- main conversion -------------------------------------------------------------------------
function convert(file) {
  const src = readFileSync(file, 'utf8').replace(/^﻿/, '');
  const name = basename(file, '.tsx');
  const issues = [];

  if (/\buse[A-Z]\w*\(/.test(src.replace(/useLocation|useParams/g, ''))) issues.push('hooks');
  if (/\bon[A-Z][A-Za-z]*=\{/.test(src)) issues.push('event handlers');
  if (/AnimatePresence|useInView|useScroll|useTransform|useAnimation/.test(src.replace(/import[^;]*;/g, ''))) issues.push('advanced framer');
  if (/\bchildren\b/.test(src)) issues.push('children');
  if (/window\.|document\./.test(src)) issues.push('browser globals');
  if (issues.length) return { name, issues };

  // Component: `const Name = (props?) => { ...stmts; return (JSX); };` or `=> (JSX)`.
  const compRe = new RegExp(`(?:const|function)\\s+${name}\\b[^=({]*(?:=\\s*)?(?:\\(([^)]*)\\))?\\s*(?::[^=]+)?(?:=>)?\\s*([{(])`);
  const cm = compRe.exec(src);
  if (!cm) return { name, issues: ['component pattern not found'] };
  const bodyOpen = cm.index + cm[0].length - 1;
  const bodyEnd = balanced(src, bodyOpen);
  let before = src.slice(0, cm.index);
  let body = src.slice(bodyOpen + 1, bodyEnd - 1);
  let jsx, inner = '';
  if (cm[2] === '{') {
    const rm = /\breturn\s*\(/.exec(body);
    if (!rm) return { name, issues: ['return ( not found'] };
    const p0 = rm.index + rm[0].length - 1;
    const p1 = balanced(body, p0);
    jsx = body.slice(p0 + 1, p1 - 1);
    inner = body.slice(0, rm.index);
  } else {
    jsx = body;
  }

  // Props
  const props = cm[1]?.trim();
  let propsLine = '';
  if (props) {
    const dm = /^\{([^}]*)\}/.exec(props);
    if (dm) propsLine = `const {${dm[1]}} = Astro.props;\n`;
    else issues.push('non-destructured props');
  }
  if (issues.length) return { name, issues };

  // Imports + top-level code before the component
  before = before
    .replace(/import\s+(?:React\s*,?\s*)?(?:\{[^}]*\}\s*from\s*)?['"]react['"];?\n?/g, '')
    .replace(/import[^;]*from\s*['"]framer-motion['"];?\n?/g, '')
    .replace(/import[^;]*from\s*['"]react-router-dom['"];?\n?/g, '')
    .replace(/import[^;]*from\s*['"]react-helmet-async['"];?\n?/g, '');
  const after = src.slice(bodyEnd).replace(/^\s*;?/, '');
  const tail = after.replace(/export\s+default\s+\w+;?/, '').trim();

  // JSX rewrites
  const state = { issues, usesButtonVariants: false };
  jsx = rewriteAsChild(jsx, state);
  jsx = rewriteMotion(jsx, issues);
  jsx = jsx
    .replace(/<Link\b([^>]*?)\bto=/g, '<a$1href=')
    .replace(/<\/Link>/g, '</a>')
    .replace(/\s+key=\{[^}]*\}/g, '');

  jsx = renameHtmlAttrs(jsx);

  // Helmet: keep only JSON-LD scripts
  jsx = jsx.replace(/<Helmet>([\s\S]*?)<\/Helmet>/g, (_, inside) => {
    const out = [];
    const re = /<script type="application\/ld\+json">\s*\{([\s\S]*?)\}\s*<\/script>/g;
    let m;
    while ((m = re.exec(inside))) out.push(`<script type="application/ld+json" set:html={${m[1].trim()}} />`);
    return out.join('\n');
  });

  if (/<Link\b|motion\./.test(jsx)) issues.push('leftover Link/motion');
  inner = stripEarlyJsxReturns(inner);
  if (/(?:return|=>)\s*\(?\s*<[A-Za-z]/.test(before + inner)) issues.push('JSX inside frontmatter helpers');
  if (issues.length) return { name, issues };

  // Unreachable "not found"/redirect early returns: routes come from getStaticPaths over the same data, so drop them.
  inner = inner
    .replace(/const\s*\{\s*pathname\s*\}\s*=\s*useLocation\(\);?/g, 'const pathname = Astro.url.pathname;')
    .replace(/const\s+(\w+)\s*=\s*useLocation\(\);?/g, 'const $1 = { pathname: Astro.url.pathname };')
    .replace(/(const\s*\{[^}]*\}\s*=\s*)useParams(?:<[^>]*>)?\(\);?/g, '$1Astro.params;');
  if (/useLocation|useParams/.test(inner)) issues.push('unhandled routing hook');
  if (issues.length) return { name, issues };

  if (state.usesButtonVariants) {
    const rel = relative(dirname(file), 'src/components/ui/button').replace(/\\/g, '/');
    before += `\nimport { buttonVariants } from '${rel.startsWith('.') ? rel : './' + rel}';\n`;
    if (!/\bcx\b.*from/.test(before)) before += `import { cx } from '${relative(dirname(file), 'src/utils/theme').replace(/\\/g, '/')}';\n`;
  }
  const fm = [before.trim(), tail, propsLine, inner.trim()].filter(Boolean).join('\n\n');
  const astro = `---\n${fm}\n---\n${jsx.trim()}\n`;
  writeFileSync(join(dirname(file), `${name}.astro`), astro);
  return { name, issues: [] };
}

for (const f of files) {
  try { report.push(convert(f)); } catch (e) { report.push({ name: basename(f), issues: ['error: ' + e.message] }); }
}
for (const r of report) console.log(r.issues.length ? `SKIP ${r.name}: ${[...new Set(r.issues)].join(', ')}` : `OK   ${r.name}.astro`);
