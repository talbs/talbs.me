const ENTITIES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const escape = text => String(text).replace(/[&<>"']/g, character => ENTITIES[character]);

export function validateLinks(links, sections) {
  const problems = [];
  links.forEach((link, i) => {
    const where = `links[${i}] (${link.title || 'untitled'})`;
    if (!link.title) problems.push(`${where}: no title`);
    if (!link.note) problems.push(`${where}: no note`);
    if (!link.icon) problems.push(`${where}: no icon`);
    if (!sections.includes(link.section)) problems.push(`${where}: unknown section "${link.section}"`);
    if (!link.email && !/^https:\/\//.test(link.url ?? '')) problems.push(`${where}: url must start with https://`);
  });
  for (const section of sections) {
    if (!links.some(link => link.section === section)) problems.push(`section ${section} is empty`);
  }
  return problems;
}

export function renderTray(links, sections) {
  let index = 0;
  return sections
    .map(section => {
      const id = `links-${section.toLowerCase()}`;
      const rows = links
        .filter(link => link.section === section)
        .map(link => {
          const family = link.family ? ` data-family="${escape(link.family)}"` : '';
          // An email ships as parts with no @, and page.js joins them into a mailto: link.
          const target = link.email
            ? `href="#" data-user="${escape(link.email.user)}" data-domain="${escape(link.email.domain)}"`
            : `href="${escape(link.url)}"`;
          return `<li style="--i: ${index++}"><a class="wa-font-size-s wa-font-weight-semibold" ${target}><span class="ic" data-icon="${escape(link.icon)}"${family}></span><span>${escape(link.title)}</span><span class="note wa-text-truncate">${escape(link.note)}</span></a></li>`;
        })
        .join('');
      return `<section aria-labelledby="${id}"><h2 class="heading wa-cluster wa-flex-nowrap wa-gap-s wa-text-lowercase" id="${id}">${escape(section)}</h2><ul class="launcher wa-list-plain">${rows}</ul></section>`;
    })
    .join('');
}
