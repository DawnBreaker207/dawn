// @ts-nocheck
/* eslint-disable */
import {
  makeBlock as d,
  makeBalancer as f,
  makeCrowd as p,
  makeGhost as m,
  makeLink as h,
  DEAD_STATE as g,
  makeHot as _,
  makeCool as v,
  makeDevice as y,
  makeDb as b,
  makeZone as x,
  makeQueue as ee,
  makePanel as S,
  makeUser as te,
  makeDns as ne,
  makeWebServer as re,
  makeDatabase as ie,
  URL_TAG as ae,
  LINK_TEMPLATES as C,
  CACHED_DNS_LINK as oe,
  TIMING_PANEL as se,
} from '@/lib/simulator/scene-builders';

const Sl = (e = []) => y(-12, -6, { label: `Alice · Acme`, tags: e });

const Cl = (e = []) => y(12, -6, { label: `Eve · Globex`, tags: e });

const wl = (e = []) =>
    d(0, -6, { color: `blue`, glyph: `file`, label: [`Invoices`, `API`], tags: e, pills: `below` });

const Tl = (e = [], t = {}) =>
    b(0, 6, { r: 2, h: 42, glyph: `file`, label: `invoices`, tags: e, ...t });

const El = (e = []) =>
    d(0, -18, {
      color: `yellow`,
      glyph: `shield`,
      label: [`Policy`, `Service`],
      tags: e,
      pills: `below`,
    });

const Dl = (e = [], t = {}) =>
    d(12, 6, { color: `green`, glyph: `chart`, label: [`Reports`], tags: e, ...t });

const Ol = (e = []) => b(-12, 6, { r: 1.7, h: 36, glyph: `clipboard`, label: `audit log`, tags: e });

const H = {
    base: (e = {}) => ({
      aa: h(`alice`, `api`, [`alice`, `api`], { heads: `both` }),
      ea: h(`eve`, `api`, [`eve`, `api`], { heads: `both`, ...e }),
      ad: h(`api`, `db`, [`api`, `db`], { heads: `both` }),
    }),
    policy: {
      ap: h(`api`, `policy`, [`api`, `policy`], {
        heads: `both`,
        label: `can Alice edit 1042?`,
        labelAt: 0.55,
      }),
    },
    reports: (e = {}) => ({ rd: h(`reports`, `db`, [`reports`, `db`], { heads: `both`, ...e }) }),
    audit: {
      dau: h(`db`, `audit`, [`db`, `audit`], { label: `every access recorded`, labelAt: 0.5 }),
    },
  };

const U = {
    alice: { route: [`aa`, `ad`], kind: `mine`, rate: 0.8, bounce: !0 },
    eveLeak: { route: [`ea`, `ad`], kind: `poison`, rate: 0.6, bounce: !0 },
    eveDenied: { route: [`ea`], kind: `poison`, rate: 0.6 },
    eveOwn: { route: [`ea`, `ad`], rate: 0.6, bounce: !0 },
  };

const kl = (e, t, n) => S({ x: 0, y: 6, z: 0, dx: 95, dy: -175 }, e, t, { icon: n });

const Al = (e, t, n) => S({ x: 0, y: 6, z: 0, dx: 105, dy: 28 }, e, t, { icon: n });

const jl = {
    id: `authorization`,
    title: `Authorization`,
    summary: `Knowing who someone is doesn’t tell you what they may see or do. Checking that, everywhere.`,
    minutes: 13,
    level: `intermediate`,
    metrics: [`exposed`, `checks`, `privilege`],
    legend: [
      [`mine`, `Alice`],
      [`poison`, `Eve (outsider)`],
      [`req`, `Eve, own data`],
      `res`,
      `fail`,
    ],
    goals: [
      { text: `Broken object-level authorization`, step: 0 },
      { text: `Ownership checks and field allow-lists`, step: 2 },
      { text: `Row-level security in the database`, step: 3 },
      { text: `Roles, relationships and central policy`, step: 6 },
      { text: `Least privilege and confused deputies`, step: 10 },
      { text: `Audit logs`, step: 11 },
    ],
    steps: [
      {
        short: `Change the URL`,
        chapter: `problem`,
        title: `Logged in is not the same as allowed`,
        body: [
          `Eve, from another company, is a legitimate user. She opens her invoice at <code>/invoices/1042</code>, changes the number to <code>1043</code> — and sees an invoice belonging to Acme.`,
          `The API checked that she was <em>logged in</em>, never that this invoice was <em>hers</em>. This is broken object-level authorization — the most common API security flaw.`,
        ],
        callout: {
          kind: `warn`,
          text: `Hiding a button in the UI is not authorization. Attackers call your API directly, with any id they like.`,
        },
        metrics: { exposed: `yes`, checks: `login only`, privilege: `everything` },
        scene: {
          entities: {
            alice: Sl(),
            eve: Cl([{ text: `GET /invoices/1043 → Acme’s!`, tone: `red`, icon: `eye` }]),
            api: wl([{ text: `checks: logged in? ✓`, tone: `amber` }]),
            db: Tl([{ text: `1043 · Acme · $48,200`, tone: `violet` }]),
          },
          links: H.base(),
          flows: [U.alice, U.eveLeak],
        },
      },
      {
        short: `Ownership`,
        chapter: `solution`,
        title: `Check ownership on every request`,
        body: [
          `Every lookup must be scoped to who is asking: fetch invoice 1043 <em>only if</em> it belongs to the caller’s organisation. For Eve that finds nothing, and she gets <code>404 Not Found</code>.`,
          `Deny by default: any endpoint that forgets the check should fail closed, not open.`,
        ],
        callout: {
          kind: `tip`,
          text: `Answer 404, not 403, for other people’s objects — don’t confirm they exist. Random ids (UUIDs) help, but are no substitute for the check.`,
        },
        changes: [`+ Queries scoped to the caller’s organisation`, `~ Eve’s request → 404`],
        metrics: { exposed: `no`, checks: `every request`, privilege: `everything` },
        scene: {
          entities: {
            alice: Sl(),
            eve: Cl([{ text: `/invoices/1043 → 404`, tone: `green`, icon: `ban` }]),
            api: wl([{ text: `checks: owner = caller’s org`, tone: `green`, icon: `shield` }]),
            db: Tl(),
            card: Al(
              `Scope every query`,
              [
                `SELECT * FROM invoices`,
                ` WHERE id = 1043`,
                `   AND org_id = :caller_org`,
                `= Eve (Globex) → no row → 404`,
              ],
              `shield`,
            ),
          },
          links: H.base({ fail: 1 }),
          flows: [U.alice, U.eveDenied],
        },
      },
      {
        short: `Mass assign`,
        chapter: `problem`,
        title: `Case: “role”: “admin”`,
        body: [
          `Eve edits her own profile — that’s allowed. But the API takes the JSON body and saves every field in it. So she adds <code>"role": "admin"</code> to the request and promotes herself.`,
          `This is <span class="term">mass assignment</span>. Fix: each endpoint has an allow-list of fields it may change, and roles change only through a separate admin-only endpoint.`,
        ],
        callout: {
          kind: `warn`,
          text: `Frameworks that bind request bodies straight onto database models make this easy to get wrong. Be explicit about writable fields.`,
        },
        changes: [
          `+ Eve sends an extra “role” field`,
          `− API saves it · Eve is admin`,
          `~ Fix: allow-list writable fields`,
        ],
        metrics: { exposed: `yes`, checks: `every request`, privilege: `everything` },
        scene: {
          entities: {
            alice: Sl(),
            eve: Cl([{ text: `PATCH /me { "role": "admin" }`, tone: `red`, icon: `alert` }]),
            api: wl([{ text: `saves every field sent`, tone: `red` }]),
            db: Tl([{ text: `eve · role = admin!`, tone: `red`, icon: `alert` }], { heat: 0.5 }),
            card: kl(
              `Allow-list writable fields`,
              [
                `! update(user, request.body)`,
                `= update(user, pick(body, "name", "email"))`,
                `# role: admin-only endpoint`,
              ],
              `filter`,
            ),
          },
          links: H.base(),
          flows: [U.alice, { route: [`ea`, `ad`], kind: `poison`, rate: 0.6, bounce: !0 }],
        },
      },
      {
        short: `Row-level`,
        chapter: `technique`,
        title: `Let the database enforce tenants too`,
        body: [
          `Ownership checks live in application code, so one query that forgets <code>AND org_id = …</code> brings the leak right back. Add a second layer: <span class="term">row-level security</span> in the database.`,
          `The app tells each connection which organisation it is serving; the database then filters every query by that org. Even <code>SELECT * FROM invoices</code> only returns the caller’s rows.`,
        ],
        callout: {
          kind: `insight`,
          text: `Defence in depth: assume any single check will eventually be forgotten, and make sure a second one is there.`,
        },
        changes: [`+ Row-level security on invoices`, `~ App sets the caller’s org per connection`],
        metrics: { exposed: `no`, checks: `app + database`, privilege: `everything` },
        scene: {
          entities: {
            alice: Sl(),
            eve: Cl([{ text: `Globex rows only`, tone: `green`, icon: `filter` }]),
            api: wl([{ text: `SET app.org = caller’s org`, icon: `shield` }]),
            db: Tl([{ text: `row-level security: org_id`, tone: `green`, icon: `filter` }]),
            card: kl(
              `The database filters too`,
              [
                `CREATE POLICY tenant ON invoices`,
                `  USING (org_id = current_org())`,
                `= SELECT * FROM invoices`,
                `#   → only the caller’s organisation`,
              ],
              `filter`,
            ),
          },
          links: H.base(),
          flows: [U.alice, U.eveOwn],
        },
      },
      {
        short: `Roles`,
        chapter: `technique`,
        title: `Roles: what each kind of user may do`,
        body: [
          `Inside Acme, people need different powers: some only view invoices, some edit them, a few approve large ones. Rather than list permissions per person, group them into <span class="term">roles</span> and give each person a role — role-based access control (RBAC).`,
          `Alice is an accountant: she can edit invoices but not approve them.`,
        ],
        callout: {
          kind: `tip`,
          text: `Keep roles few and meaningful. Hundreds of special-case roles become impossible to reason about.`,
        },
        changes: [`+ Roles: viewer, accountant, approver, admin`],
        metrics: { exposed: `no`, checks: `every request`, privilege: `everything` },
        scene: {
          entities: {
            alice: Sl([{ text: `role: accountant`, icon: `idCard` }]),
            eve: Cl(),
            api: wl([{ text: `role allows “edit”? ✓`, tone: `green`, icon: `shield` }]),
            db: Tl(),
          },
          links: H.base(),
          flows: [U.alice, U.eveOwn],
        },
      },
      {
        short: `Sharing`,
        chapter: `technique`,
        title: `Relationships: sharing and teams`,
        body: [
          `Roles struggle with sharing: “Alice can see this folder because it was shared with her team”. <b>Relationship-based</b> access (ReBAC) stores facts like “invoice 1042 is in folder Q3”, “Q3 is shared with team Finance”, “Alice is in Finance”, and follows the chain.`,
          `This is how Google Docs-style sharing works at scale.`,
        ],
        callout: {
          kind: `insight`,
          text: `Google’s Zanzibar paper popularised this model; SpiceDB and OpenFGA are open-source versions.`,
        },
        changes: [`+ Permissions derived from relationships`],
        metrics: { exposed: `no`, checks: `every request`, privilege: `everything` },
        scene: {
          entities: {
            alice: Sl([{ text: `member of team Finance`, icon: `users` }]),
            eve: Cl(),
            api: wl([{ text: `follows the relationship chain`, tone: `green`, icon: `waypoints` }]),
            db: Tl(),
            card: Al(
              `Why can Alice view 1042?`,
              [
                `invoice 1042  in      folder Q3`,
                `folder Q3     shared  team Finance`,
                `team Finance  member  alice`,
                `= alice may view invoice 1042`,
              ],
              `waypoints`,
            ),
          },
          links: H.base(),
          flows: [U.alice, U.eveOwn],
        },
      },
      {
        short: `Policy`,
        chapter: `technique`,
        title: `Decide in one place`,
        body: [
          `Permission checks scattered as if-statements across twenty services drift apart, and nobody can answer “who can approve invoices?”. Instead, each service asks a <span class="term">policy service</span>: “may Alice edit invoice 1042?”, and enforces the yes or no.`,
          `The rules live in one place, are tested like code, and every decision can be logged.`,
        ],
        callout: {
          kind: `tip`,
          text: `Tools: Open Policy Agent (Rego), AWS Cedar, or a permissions service like SpiceDB. Cache decisions briefly to keep calls fast.`,
        },
        changes: [`+ Central policy service`, `~ API asks, then enforces`],
        metrics: { exposed: `no`, checks: `central policy`, privilege: `everything` },
        scene: {
          entities: {
            alice: Sl([{ text: `role: accountant`, icon: `idCard` }]),
            eve: Cl(),
            api: wl(),
            db: Tl(),
            policy: El([{ text: `allow: edit · deny: approve`, tone: `green`, icon: `check` }]),
          },
          links: { ...H.base(), ...H.policy },
          flows: [U.alice, U.eveOwn, { route: [`ap`], rate: 1, bounce: !0 }],
        },
      },
      {
        short: `Master key`,
        chapter: `problem`,
        title: `Case: a service with keys to everything`,
        body: [
          `The reports service connects to the database with the admin account — it was quickest to set up. One day a SQL-injection bug is found in a report filter.`,
          `Because the service could read <em>every</em> table, the attacker dumps users, password hashes and payment details too — not just invoices.`,
        ],
        callout: {
          kind: `warn`,
          text: `A component’s permissions define the blast radius of its bugs.`,
        },
        changes: [
          `+ Reports service with admin DB credentials`,
          `− Injection bug exposes every table`,
        ],
        metrics: { exposed: `yes`, checks: `central policy`, privilege: `everything` },
        scene: {
          entities: {
            alice: Sl(),
            eve: Cl(),
            api: wl(),
            db: Tl([{ text: `users · payments · invoices dumped`, tone: `red`, icon: `alert` }], {
              heat: 0.5,
            }),
            policy: El(),
            reports: Dl([{ text: `admin creds · injection bug`, tone: `red`, icon: `key` }], {
              heat: 0.4,
            }),
          },
          links: { ...H.base(), ...H.policy, ...H.reports() },
          flows: [U.alice, { route: [`rd`], kind: `poison`, rate: 1.2, bounce: !0 }],
        },
      },
      {
        short: `Least privilege`,
        chapter: `solution`,
        title: `Least privilege`,
        body: [
          `Give every service — and every person — only the access its job needs. The reports service gets a <b>read-only</b> account that can see the invoices view and nothing else; each service has its own credentials and identity.`,
          `The same injection bug now leaks, at worst, invoices the service could already read — and alarms fire when it tries anything else.`,
        ],
        callout: {
          kind: `tip`,
          text: `Apply it everywhere: database grants, cloud IAM roles, API scopes, and staff access (time-limited, approved, logged).`,
        },
        changes: [`~ Reports: read-only, invoices view only`, `+ Separate credentials per service`],
        metrics: { exposed: `no`, checks: `central policy`, privilege: `least privilege` },
        scene: {
          entities: {
            alice: Sl(),
            eve: Cl(),
            api: wl(),
            db: Tl(),
            policy: El(),
            reports: Dl([
              { text: `read-only · invoices view`, tone: `green`, icon: `key` },
              { text: `users table: denied`, tone: `green`, icon: `ban` },
            ]),
          },
          links: { ...H.base(), ...H.policy, ...H.reports() },
          flows: [U.alice, { route: [`rd`], rate: 1, bounce: !0 }],
        },
      },
      {
        short: `Deputy`,
        chapter: `problem`,
        title: `Case: the confused deputy`,
        body: [
          `Alice asks for a report of invoices over $10,000. The API hands the job to the reports service, which queries with <em>its own</em> identity — and it may read every tenant’s invoices. Alice’s report includes Globex’s.`,
          `The reports service was tricked into using its authority on someone else’s behalf: a <span class="term">confused deputy</span>.`,
        ],
        callout: {
          kind: `warn`,
          text: `Whenever a service acts for a user, ask: whose permissions apply here — the service’s or the user’s?`,
        },
        changes: [`+ Report runs as the reports service`, `− Alice sees other tenants’ invoices`],
        metrics: { exposed: `yes`, checks: `central policy`, privilege: `least privilege` },
        scene: {
          entities: {
            alice: Sl([{ text: `report includes Globex!`, tone: `red`, icon: `alert` }]),
            api: wl(),
            db: Tl(),
            policy: El(),
            reports: Dl([{ text: `own identity · all tenants`, tone: `red`, icon: `key` }], {
              heat: 0.4,
            }),
          },
          links: {
            aa: H.base().aa,
            ad: H.base().ad,
            ...H.policy,
            ar: h(`api`, `reports`, [`api`, [`reports`, `api`], `reports`], {
              heads: `both`,
              label: `run report`,
              labelAt: 0.4,
            }),
            ...H.reports(),
          },
          flows: [{ route: [`aa`, `ar`, `rd`], kind: `mine`, rate: 0.7, bounce: !0 }],
        },
      },
      {
        short: `On behalf`,
        chapter: `solution`,
        title: `Act as the user, not as yourself`,
        body: [
          `Pass the user’s identity along: the API forwards Alice’s token (or exchanges it for a narrower one), and the reports service runs the query <em>as Alice</em> — with her organisation and her permissions.`,
          `The service’s own powerful credentials are only used for things no user asked for, like nightly maintenance.`,
        ],
        callout: {
          kind: `tip`,
          text: `OAuth token exchange and service meshes can carry the end user’s identity across every hop automatically.`,
        },
        changes: [
          `~ Alice’s token passed to Reports`,
          `~ Query runs with Alice’s permissions`,
          `− Other tenants’ data`,
        ],
        metrics: { exposed: `no`, checks: `central policy`, privilege: `least privilege` },
        scene: {
          entities: {
            alice: Sl([{ text: `only Acme invoices`, tone: `green`, icon: `check` }]),
            api: wl(),
            db: Tl(),
            policy: El(),
            reports: Dl([{ text: `acts as Alice · Acme only`, tone: `green`, icon: `userCheck` }]),
          },
          links: {
            aa: H.base().aa,
            ad: H.base().ad,
            ...H.policy,
            ar: h(`api`, `reports`, [`api`, [`reports`, `api`], `reports`], {
              heads: `both`,
              label: `Alice’s token`,
              labelAt: 0.4,
            }),
            ...H.reports(),
          },
          flows: [
            { route: [`aa`, `ar`, `rd`], kind: `mine`, rate: 0.7, bounce: !0 },
            { route: [`ap`], rate: 0.6, bounce: !0 },
          ],
        },
      },
      {
        short: `Audit`,
        chapter: `technique`,
        title: `Audit logs: who saw what`,
        body: [
          `Finally, record every access to sensitive data — who, what, when, from where — in an append-only <span class="term">audit log</span> that the people being audited can’t edit.`,
          `It answers “who looked at this customer’s invoices?” after an incident, and powers alerts: a support agent opening 5,000 invoices in ten minutes is worth a page.`,
        ],
        callout: {
          kind: `insight`,
          text: `Audit logs are also required by most compliance standards (SOC 2, HIPAA, GDPR requests).`,
        },
        changes: [`+ Append-only audit log`, `+ Alert on unusual access`],
        metrics: { exposed: `no`, checks: `central policy`, privilege: `least privilege` },
        scene: {
          entities: {
            alice: Sl(),
            eve: Cl(),
            api: wl(),
            db: Tl(),
            policy: El(),
            reports: Dl([{ text: `read-only · invoices view`, tone: `green`, icon: `key` }]),
            audit: Ol([{ text: `alice viewed 1042 · 09:14`, icon: `clipboard` }]),
          },
          links: { ...H.base(), ...H.policy, ...H.reports(), ...H.audit },
          flows: [U.alice, U.eveOwn, { route: [`dau`], kind: `write`, rate: 1.2 }],
        },
      },
      {
        short: `Recap`,
        chapter: `recap`,
        title: `Recap`,
        body: [
          `<ul class="takeaways">
          <li>Check that the caller may access <b>this object</b>, on every request.</li>
          <li>Use <b>roles</b> for kinds of users, <b>relationships</b> for sharing.</li>
          <li>Decide in a <b>central policy</b>; enforce in each service.</li>
          <li>Allow-list writable fields; add <b>row-level security</b> as a second layer.</li>
          <li>Grant <b>least privilege</b>; act <b>as the user</b>, not as the service; keep an <b>audit log</b>.</li>
        </ul>`,
        ],
        callout: {
          kind: `next`,
          text: `Next up: <b>Encryption & Secrets</b> — protecting data on the wire, on disk, and the keys themselves.`,
        },
        metrics: { exposed: `no`, checks: `central policy`, privilege: `least privilege` },
        scene: {
          entities: {
            alice: Sl(),
            eve: Cl(),
            api: wl(),
            db: Tl(),
            policy: El(),
            reports: Dl(),
            audit: Ol(),
          },
          links: { ...H.base(), ...H.policy, ...H.reports(), ...H.audit },
          flows: [
            U.alice,
            U.eveOwn,
            { route: [`ap`], rate: 0.8, bounce: !0 },
            { route: [`dau`], kind: `write`, rate: 1 },
          ],
        },
      },
    ],
  };

export { jl as authorizationLesson };
export default jl;
