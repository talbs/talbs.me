const swap = (html, name, pattern, replacement) => {
  const matches = html.match(new RegExp(pattern, 'g')) ?? [];
  if (matches.length !== 1) throw new Error(`404: expected one ${name} in src/index.html, found ${matches.length}`);
  return html.replace(pattern, replacement);
};

// The 404 is the landing page frozen at 4:04 a.m. `vars` is that moment's sky, so readers without JS get it too.
export function lostPage(template, line, vars) {
  const style = Object.entries(vars)
    .map(([name, value]) => `${name}: ${value}`)
    .join('; ');
  let html = template;
  html = swap(html, 'head', /<head>/, '<head>\n    <base href="/" />\n    <meta name="robots" content="noindex" />');
  html = swap(html, 'html tag', /<html\b/, `<html style="${style}"`);
  html = swap(html, 'title', /<title>[^<]*<\/title>/, '<title>Not found · Brian Talbot</title>');
  html = swap(html, 'tell state', /(<tiny-tell[^>]*?state=")\w+"/, '$1error"');
  html = swap(html, 'status line', /(id="line"\s*>)[^<]*(<\/span)/, `$1${line}$2`);
  html = swap(html, 'day row', /(id="day")\s+hidden/, '$1');
  html = swap(html, 'cloud layers', /\s*<div\s+class="veil"[^>]*><\/div>\s*<div\s+class="clouds"[^>]*><\/div>/, '');
  return html;
}
