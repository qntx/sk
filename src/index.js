// Cloudflare Worker: SKILL.md proxy for qntx GitHub projects.
// Domain: sk.qntx.fun
//
// Routes (with or without trailing /SKILL.md):
//   /                               → qntx/skills (root SKILL.md)
//   /{skill}                        → qntx/skills repo
//   /{repo}/{skill}                 → qntx/{repo} repo
//   /labs/{skill}                   → qntx-labs/skills repo
//   /labs/{repo}/{skill}            → qntx-labs/{repo} repo
//
// Examples:
//   curl -fsSL https://sk.qntx.fun/deploy
//   curl -fsSL https://sk.qntx.fun/deploy/SKILL.md
//   curl -fsSL https://sk.qntx.fun/machi/deploy
//   curl -fsSL https://sk.qntx.fun/labs/deploy

const ORGS = { labs: "qntx-labs" };
const DEFAULT_ORG = "qntx";
const DEFAULT_REPO = "skills";
const RAW = "https://raw.githubusercontent.com";
const CACHE_TTL = 3600;
const NAME_RE = /^[a-z\d](?:[a-z\d._-]*[a-z\d])?$/i;

function resolve(pathname) {
  const seg = pathname.split("/").filter(Boolean);

  if (seg.at(-1) === "SKILL.md") seg.pop();

  const org = ORGS[seg[0]] ? ORGS[seg.shift()] : DEFAULT_ORG;

  if (seg.length === 0) return `${RAW}/${org}/${DEFAULT_REPO}/main/SKILL.md`;

  if (seg.length === 1) {
    if (!NAME_RE.test(seg[0])) return null;
    return `${RAW}/${org}/${DEFAULT_REPO}/main/${seg[0]}/SKILL.md`;
  }

  if (seg.length === 2) {
    if (!NAME_RE.test(seg[0]) || !NAME_RE.test(seg[1])) return null;
    return `${RAW}/${org}/${seg[0]}/main/${seg[1]}/SKILL.md`;
  }

  return null;
}

export default {
  async fetch(request) {
    const target = resolve(new URL(request.url).pathname);
    if (!target) return new Response("Not found\n", { status: 404 });

    const resp = await fetch(target, { cf: { cacheTtl: CACHE_TTL } });
    if (!resp.ok) return new Response("Not found\n", { status: 404 });

    return new Response(resp.body, {
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "cache-control": `public, max-age=${CACHE_TTL}`,
      },
    });
  },
};
