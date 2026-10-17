const DECLARATION = /(?<=[{;])\s*(--wa-[\w-]+)\s*:([^;{}]*)(;|(?=\}))/g;
const refsIn = text => new Set([...text.matchAll(/var\(\s*(--wa-[\w-]+)/g)].map(match => match[1]));

// Drops Web Awesome tokens nothing reads: not the page CSS, not the bundled components, not another kept token.
export function pruneTokens(css, scripts) {
  const declared = new Map();
  for (const [, name, value] of css.matchAll(DECLARATION)) declared.set(name, [...(declared.get(name) ?? []), value]);
  const kept = new Set([...refsIn(css.replace(DECLARATION, '')), ...refsIn(scripts)]);
  const queue = [...kept];
  while (queue.length) {
    for (const value of declared.get(queue.pop()) ?? []) {
      for (const ref of refsIn(value)) {
        if (kept.has(ref)) continue;
        kept.add(ref);
        queue.push(ref);
      }
    }
  }
  return css.replace(DECLARATION, (match, name) => (kept.has(name) ? match : ''));
}

const GROUPING = /^\s*@(media|supports|layer|container|scope|starting-style)\b/;

function closingBrace(text, open) {
  let depth = 0;
  for (let i = open; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"' || ch === "'") i = text.indexOf(ch, i + 1);
    else if (ch === '{') depth++;
    else if (ch === '}' && --depth === 0) return i;
  }
  return text.length;
}

function selectorsOf(prelude) {
  const parts = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < prelude.length; i++) {
    if (prelude[i] === '(') depth++;
    else if (prelude[i] === ')') depth--;
    else if (prelude[i] === ',' && depth === 0) {
      parts.push(prelude.slice(start, i));
      start = i + 1;
    }
  }
  return [...parts, prelude.slice(start)].map(part => part.trim());
}

const outsideParens = selector => selector.replace(/\([^()]*(?:\([^()]*\)[^()]*)*\)/g, '()');

// Every name a page's markup and scripts could put in a class attribute. `--wa-…` custom properties aren't classes.
export const usedNames = text => new Set(text.match(/(?<![\w-])[\w-]+/g));

// Drops selectors that need a class the page never uses, and rules left with none. Inside :is() a class is one of several
// alternatives, so only Web Awesome classes are checked there.
export function pruneSelectors(css, used) {
  const usedList = [...used];
  const isUsed = selector => {
    const outside = outsideParens(selector);
    return (
      [...selector.matchAll(/\.(wa-[\w-]+)/g)].every(([, name]) => used.has(name)) &&
      [...outside.replace(/\[[^\]]*\]/g, '').matchAll(/\.([_a-zA-Z][\w-]*)/g)].every(([, name]) => used.has(name)) &&
      [...outside.matchAll(/\[class\*=["']?(wa-[\w-]+)/g)].every(([, part]) =>
        usedList.some(name => name.includes(part))
      )
    );
  };
  let out = '';
  let i = 0;
  while (i < css.length) {
    const open = css.indexOf('{', i);
    if (open === -1) return out + css.slice(i);
    const close = closingBrace(css, open);
    const statementEnd = css.lastIndexOf(';', open) + 1;
    const head = statementEnd > i ? css.slice(i, statementEnd) : '';
    const prelude = css.slice(Math.max(i, statementEnd), open);
    const body = css.slice(open + 1, close);
    if (prelude.trim().startsWith('@')) {
      out += `${head}${prelude}{${GROUPING.test(prelude) ? pruneSelectors(body, used) : body}}`;
    } else {
      const kept = selectorsOf(prelude).filter(isUsed);
      out += kept.length ? `${head}${kept.join(',')}{${body}}` : head;
    }
    i = close + 1;
  }
  return out;
}
