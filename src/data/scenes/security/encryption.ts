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

const Ml = (e = [], t = {}) => y(0, -21, { label: `Alice · café Wi-Fi`, tags: e, ...t });

const Nl = () => d(0, -12, { s: 3, h: 30, color: `slab`, glyph: `wifi`, label: [] });

const Pl = (e = []) => y(-14, -3, { label: `Mallory · same Wi-Fi`, tags: e });

const Fl = (e = []) => f(0, -3, { tags: e, pills: `below` });

const Il = (e = []) => d(0, 6, { label: [`App`], tags: e });

const Ll = (e = [], t = {}) =>
    b(0, 15, { r: 2, h: 42, glyph: `user`, label: `customer DB`, tags: e, ...t });

const Rl = (e = []) => y(13, 15, { label: `thief`, tags: e });

const zl = () => d(0, 25, { color: `yellow`, glyph: `key`, label: [`KMS`], sub: `key service` });

const Bl = (e = []) =>
    d(-12, 6, { color: `yellow`, glyph: `keyhole`, label: [`Secrets`, `Manager`], tags: e });

const Vl = (e = []) => d(13, 6, { color: `slab`, glyph: `file`, label: [`Public`, `Repo`], tags: e });

const Hl = (e = []) => y(15, -5, { label: `scanner bot`, tags: e });

const Ul = (e = {}) => ({
    ar: h(`alice`, `router`, [`alice`, `router`], { heads: `both`, ...(e.ar || {}) }),
    rl: h(`router`, `lb`, [`router`, `lb`], { heads: `both`, ...(e.rl || {}) }),
    la: h(`lb`, `app`, [`lb`, `app`], { heads: `both`, ...(e.la || {}) }),
    ad: h(`app`, `db`, [`app`, `db`], { heads: `both`, ...(e.ad || {}) }),
  });

const Wl = () => ({
    sn: h(`router`, `mallory`, [`router`, [`mallory`, `router`], `mallory`], { style: `dashed` }),
  });

const Gl = {
    st: h(`db`, `thief`, [`db`, `thief`], {
      style: `dashed`,
      label: `backup copied`,
      labelTone: `red`,
    }),
  };

const Kl = {
    req: { route: [`ar`, `rl`, `la`, `ad`], kind: `mine`, rate: 0.9, bounce: !0 },
    sniffPlain: { route: [`sn`], kind: `poison`, rate: 0.9 },
    sniffCipher: { route: [`sn`], kind: `empty`, rate: 0.9 },
    stealPlain: { route: [`st`], kind: `poison`, rate: 0.7 },
    stealCipher: { route: [`st`], kind: `empty`, rate: 0.7 },
  };

const ql = (e = {}) => ({
    alice: Ml(e.alice),
    router: Nl(),
    lb: Fl(e.lb),
    app: Il(e.app),
    db: Ll(e.db, e.dbProps),
  });

const Jl = (e, t, n) => S({ x: -12, y: 2, z: 0, dx: -150, dy: -150 }, e, t, { icon: n });

const Yl = {
    id: `encryption`,
    title: `Encryption & Secrets`,
    summary: `Protecting data on the wire, on disk, and the keys and passwords your services use.`,
    minutes: 13,
    level: `intermediate`,
    metrics: [`inTransit`, `atRest`, `secrets`],
    legend: [
      [`mine`, `Alice’s request`],
      `res`,
      [`poison`, `readable by attacker`],
      [`empty`, `encrypted (unreadable)`],
    ],
    goals: [
      { text: `TLS, certificates and renewing them`, step: 2 },
      { text: 'Encryption inside the data center', step: 5 },
      { text: `Rotating keys`, step: 6 },
      { text: `Keeping secrets out of code`, step: 8 },
      { text: `Tokenization and end-to-end encryption`, step: 10 },
    ],
    steps: [
      {
        short: `Café Wi-Fi`,
        chapter: `problem`,
        title: `Plain HTTP on café Wi-Fi`,
        body: [
          `Alice logs in from a café. The site uses plain <code>http://</code>, so her password and session cookie travel as readable text through the Wi-Fi router and a dozen networks beyond it.`,
          `Mallory, on the same Wi-Fi, records the traffic and reads everything — and could even change pages on the way back.`,
        ],
        callout: {
          kind: `warn`,
          text: `Anyone on the path — Wi-Fi, ISP, a compromised router — can read and alter unencrypted traffic.`,
        },
        metrics: { inTransit: `no`, atRest: `no`, secrets: `—` },
        scene: {
          entities: {
            ...ql({
              alice: [{ text: `http:// · password in clear`, tone: `red`, icon: `eyeOff` }],
            }),
            mallory: Pl([{ text: `reads: alice / hunter2`, tone: `red`, icon: `eye` }]),
          },
          links: { ...Ul(), ...Wl() },
          flows: [Kl.req, Kl.sniffPlain],
        },
      },
      {
        short: `TLS`,
        chapter: `solution`,
        title: `TLS: encrypt the wire`,
        body: [
          `With HTTPS, <span class="term">TLS</span> encrypts everything between Alice’s browser and the site. During the handshake the server presents a <b>certificate</b>, signed by a certificate authority the browser trusts, proving it really is <code>shop.example</code>.`,
          `Mallory still copies every packet — but sees only random-looking bytes, and can’t alter them without detection.`,
        ],
        callout: {
          kind: `tip`,
          text: `Certificates are free and automatic with Let’s Encrypt. Add HSTS so browsers never fall back to http://.`,
        },
        changes: [`+ TLS certificate on the load balancer`, `~ Mallory sees only ciphertext`],
        metrics: { inTransit: `outside only`, atRest: `no`, secrets: `—` },
        scene: {
          entities: {
            ...ql({
              alice: [{ text: `https:// · encrypted`, tone: `green`, icon: `lock` }],
              lb: [{ text: `certificate: shop.example`, icon: `fileKey` }],
            }),
            mallory: Pl([{ text: `sees random bytes`, tone: `green`, icon: `eyeOff` }]),
          },
          links: { ...Ul({ ar: { label: `TLS`, labelAt: 0.5 }, rl: { label: `TLS` } }), ...Wl() },
          flows: [Kl.req, Kl.sniffCipher],
        },
      },
      {
        short: `Expired`,
        chapter: `problem`,
        title: `Case: the certificate expired at 3 a.m.`,
        body: [
          `Certificates have an expiry date. This one was renewed by hand once a year — by someone who has since left. At 03:00 it expires, every browser shows a full-page security warning, and most users leave.`,
          `An outage caused by a date. Fix: automatic renewal with ACME (Let’s Encrypt, or your cloud’s certificate manager), and an alert 30 days before any certificate expires.`,
        ],
        callout: {
          kind: `tip`,
          text: `Short-lived certificates (90 days or less) force automation — and limit the damage if a private key ever leaks.`,
        },
        changes: [
          `− Certificate expired 03:00`,
          `− Browsers block the site`,
          `~ Fix: auto-renew + expiry alerts`,
        ],
        metrics: { inTransit: `outside only`, atRest: `no`, secrets: `—` },
        scene: {
          entities: {
            ...ql({
              alice: [{ text: `“Your connection is not private”`, tone: `red`, icon: `alert` }],
              lb: [{ text: `certificate expired 03:00`, tone: `red`, icon: `clock` }],
            }),
            card: Jl(
              `Never expire by surprise`,
              [
                `! renewed by hand, once a year`,
                `= ACME: auto-renew every 60 days`,
                `= alert 30 days before any expiry`,
                `# check every endpoint, not just www`,
              ],
              `fileKey`,
            ),
          },
          links: Ul({ ar: { fail: 0.8 } }),
          flows: [{ route: [`ar`, `rl`, `la`, `ad`], kind: `mine`, rate: 0.9, bounce: !0 }],
        },
      },
      {
        short: `Inside too`,
        chapter: `technique`,
        title: `Encrypt inside the data center too`,
        body: [
          `The load balancer <b>terminates</b> TLS — and traditionally sent plain traffic onward, trusting the internal network. But one compromised machine inside could then read everything.`,
          `Modern systems assume no network is trusted (<b>zero trust</b>): services talk over <span class="term">mutual TLS</span>, where both sides present certificates, so every hop is encrypted and every caller is identified.`,
        ],
        callout: {
          kind: `tip`,
          text: `A service mesh can add mTLS between all services automatically, with short-lived certificates it rotates for you.`,
        },
        changes: [`~ LB → app → DB over mutual TLS`, `+ Every service has its own certificate`],
        metrics: { inTransit: `yes`, atRest: `no`, secrets: `—` },
        scene: {
          entities: {
            ...ql({ app: [{ text: `mTLS · own certificate`, tone: `green`, icon: `fileKey` }] }),
            mallory: Pl([{ text: `sees random bytes`, tone: `green`, icon: `eyeOff` }]),
          },
          links: { ...Ul({ la: { label: `mTLS` }, ad: { label: `mTLS` } }), ...Wl() },
          flows: [Kl.req, Kl.sniffCipher],
        },
      },
      {
        short: `Stolen backup`,
        chapter: `problem`,
        title: `The stolen backup`,
        body: [
          `Every byte on the wire is now safe. Then a database backup is left in a storage bucket that was accidentally made public, and someone copies it.`,
          `Encryption in transit does nothing here: the data on disk — every customer’s name, address and order history — is readable.`,
        ],
        callout: {
          kind: `warn`,
          text: `Disks get lost, snapshots get shared, buckets get misconfigured. Data at rest needs its own protection.`,
        },
        changes: [`− Backup in a public bucket`, `− Copied and readable`],
        metrics: { inTransit: `yes`, atRest: `no`, secrets: `—` },
        scene: {
          entities: {
            ...ql({ db: [{ text: `backup in public bucket`, tone: `red`, icon: `alert` }] }),
            thief: Rl([{ text: `reads every customer`, tone: `red`, icon: `eye` }]),
          },
          links: { ...Ul({ la: { label: `mTLS` }, ad: { label: `mTLS` } }), ...Gl },
          flows: [Kl.req, Kl.stealPlain],
        },
      },
      {
        short: `At rest`,
        chapter: `solution`,
        title: `Encrypt at rest, keep keys elsewhere`,
        body: [
          `Encrypt disks, database files and backups. The trick is the key: if it sits next to the data, a thief takes both. So keys live in a separate <span class="term">key management service</span> (KMS), which never hands out its master key.`,
          `With <b>envelope encryption</b>, data is encrypted with a data key, and the data key is itself encrypted by the KMS. Every use of a key is logged, and access can be revoked.`,
        ],
        callout: {
          kind: `tip`,
          text: `Cloud databases and storage encrypt at rest with a checkbox. For very sensitive fields, also encrypt in the application.`,
        },
        changes: [
          `+ Data and backups encrypted (AES-256)`,
          `+ Keys held by a KMS`,
          `~ Stolen copy is unreadable`,
        ],
        metrics: { inTransit: `yes`, atRest: `yes`, secrets: `—` },
        scene: {
          entities: {
            ...ql({ db: [{ text: `encrypted · AES-256`, tone: `green`, icon: `lock` }] }),
            thief: Rl([{ text: `only ciphertext`, tone: `green`, icon: `eyeOff` }]),
            kms: zl(),
            card: Jl(
              `Envelope encryption`,
              [
                `data  —encrypted with→  data key`,
                `data key —encrypted by→ KMS master key`,
                `= steal the disk: no usable key`,
                `# rotate keys, audit every use`,
              ],
              `key`,
            ),
          },
          links: {
            ...Ul({ la: { label: `mTLS` }, ad: { label: `mTLS` } }),
            ...Gl,
            dk: h(`db`, `kms`, [`db`, `kms`], { heads: `both`, label: `unwrap data key` }),
          },
          flows: [Kl.req, Kl.stealCipher, { route: [`dk`], kind: `write`, rate: 0.4, bounce: !0 }],
        },
      },
      {
        short: `Rotation`,
        chapter: `technique`,
        title: `Rotating keys without re-encrypting everything`,
        body: [
          `Keys should change regularly — and immediately if one might have leaked. Re-encrypting terabytes of data would take days.`,
          `Envelope encryption makes it cheap: create a new master key in the KMS and <b>re-wrap</b> each small data key with it. The data itself is never touched, and new writes simply get fresh data keys.`,
        ],
        callout: {
          kind: `tip`,
          text: `Most KMSs rotate master keys automatically every year and keep old versions to unwrap older data keys.`,
        },
        changes: [
          `+ Master key v2 in the KMS`,
          `~ Data keys re-wrapped (KB, not TB)`,
          `~ Data untouched`,
        ],
        metrics: { inTransit: `yes`, atRest: `yes`, secrets: `—` },
        scene: {
          entities: {
            ...ql({ db: [{ text: `data keys re-wrapped · v2`, tone: `green`, icon: `refresh` }] }),
            kms: zl(),
            card: Jl(
              `Rotating keys`,
              [
                `new master key v2 in the KMS`,
                `re-wrap each data key: kilobytes`,
                `= the data is never re-encrypted`,
                `# new writes use fresh data keys`,
              ],
              `refresh`,
            ),
          },
          links: {
            ...Ul({ la: { label: `mTLS` }, ad: { label: `mTLS` } }),
            dk: h(`db`, `kms`, [`db`, `kms`], { heads: `both`, label: `re-wrap data keys` }),
          },
          flows: [Kl.req, { route: [`dk`], kind: `write`, rate: 1.2, bounce: !0 }],
        },
      },
      {
        short: `Leaked key`,
        chapter: `problem`,
        title: `Case: a secret in the code`,
        body: [
          `A developer hard-codes the payment provider’s API key in the source to test something, and the repository is public. Bots scan public repositories continuously: the key is found and used within minutes.`,
          `Deleting the line doesn’t help — it’s in the git history forever. The only fix is to <b>revoke</b> the key and issue a new one.`,
        ],
        callout: {
          kind: `warn`,
          text: `Secrets in code end up in repos, builds, logs and laptops. Treat any secret that touched git as compromised.`,
        },
        changes: [`+ API key committed to a public repo`, `− Found by a scanner bot in minutes`],
        metrics: { inTransit: `yes`, atRest: `yes`, secrets: `source code` },
        scene: {
          entities: {
            ...ql({ app: [{ text: `API key in source code`, tone: `red`, icon: `key` }] }),
            kms: zl(),
            repo: Vl([{ text: `sk_live_… in history`, tone: `red`, icon: `alert` }]),
            bot: Hl([{ text: `key found in 4 min`, tone: `red`, icon: `bot` }]),
          },
          links: {
            ...Ul({ la: { label: `mTLS` }, ad: { label: `mTLS` } }),
            dk: h(`db`, `kms`, [`db`, `kms`], { heads: `both` }),
            ap: h(`app`, `repo`, [`app`, `repo`], { label: `git push` }),
            rb: h(`repo`, `bot`, [`repo`, [`bot`, `repo`], `bot`], {
              style: `dashed`,
              label: `scraped`,
              labelTone: `red`,
            }),
          },
          flows: [
            Kl.req,
            { route: [`ap`], kind: `write`, rate: 0.4 },
            { route: [`rb`], kind: `poison`, rate: 0.8 },
          ],
        },
      },
      {
        short: `Vault`,
        chapter: `solution`,
        title: `A secrets manager`,
        body: [
          `Keep secrets out of code entirely. The app fetches them at startup from a <span class="term">secrets manager</span> (HashiCorp Vault, AWS Secrets Manager), proving its own identity to get only the secrets it needs.`,
          `Secrets are rotated regularly — or issued short-lived on demand — and scanners in CI block any commit that looks like a key.`,
        ],
        callout: {
          kind: `tip`,
          text: `Never log secrets, and keep them out of error messages and environment dumps.`,
        },
        changes: [
          `+ Secrets manager`,
          `~ App fetches secrets at startup`,
          `+ Automatic rotation · secret scanning in CI`,
        ],
        metrics: { inTransit: `yes`, atRest: `yes`, secrets: `secrets manager` },
        scene: {
          entities: {
            ...ql({ app: [{ text: `no secrets in code`, tone: `green`, icon: `check` }] }),
            kms: zl(),
            vault: Bl([{ text: `rotated every 30 days`, icon: `refresh` }]),
            repo: Vl([{ text: `secret scan: clean`, tone: `green`, icon: `check` }]),
          },
          links: {
            ...Ul({ la: { label: `mTLS` }, ad: { label: `mTLS` } }),
            dk: h(`db`, `kms`, [`db`, `kms`], { heads: `both` }),
            av: h(`app`, `vault`, [`app`, `vault`], { heads: `both`, label: `fetch at startup` }),
            ap: h(`app`, `repo`, [`app`, `repo`], { label: `git push` }),
          },
          flows: [
            Kl.req,
            { route: [`av`], kind: `write`, rate: 0.5, bounce: !0 },
            { route: [`ap`], rate: 0.3 },
          ],
        },
      },
      {
        short: `Tokenize`,
        chapter: `technique`,
        title: `Case: card numbers — tokenize them`,
        body: [
          `Card numbers are the most valuable data you could hold, and every system that stores or even sees them must meet strict rules (PCI DSS). Encrypting them still leaves you holding them.`,
          `Better: don’t hold them. The checkout sends the card to a payment provider, which stores it and returns a <span class="term">token</span> like <code>tok_4f2c</code>. Your database, logs and analytics only ever see tokens — worthless to a thief.`,
        ],
        callout: {
          kind: `insight`,
          text: `The safest sensitive data is data you never store. Ask whether you need it at all before deciding how to protect it.`,
        },
        changes: [
          `+ Payment provider holds the real card numbers`,
          `~ Database stores tokens only`,
          `− Card numbers in your systems`,
        ],
        metrics: { inTransit: `yes`, atRest: `yes`, secrets: `secrets manager` },
        scene: {
          entities: {
            ...ql({
              app: [{ text: `never sees card numbers`, tone: `green`, icon: `check` }],
              db: [{ text: `card: tok_4f2c`, tone: `green`, icon: `creditCard` }],
            }),
            kms: zl(),
            pp: d(-12, 15, {
              color: `purple`,
              glyph: `creditCard`,
              label: [`Payment`, `Provider`],
              tags: [{ text: `holds real card numbers`, icon: `lock` }],
            }),
            thief: Rl([{ text: `steals tokens · useless`, tone: `green`, icon: `eyeOff` }]),
          },
          links: {
            ...Ul({ la: { label: `mTLS` }, ad: { label: `mTLS` } }),
            dk: h(`db`, `kms`, [`db`, `kms`], { heads: `both` }),
            pt: h(`app`, `pp`, [`app`, [-6, `app`], [-6, `pp`], `pp`], {
              heads: `both`,
              label: `card → token`,
              labelAt: 0.45,
            }),
            ...Gl,
          },
          flows: [Kl.req, { route: [`pt`], kind: `mine`, rate: 0.5, bounce: !0 }, Kl.stealCipher],
        },
      },
      {
        short: `End-to-end`,
        chapter: `technique`,
        title: `End-to-end: even the server can’t read it`,
        body: [
          `For private messages you can go further. With <span class="term">end-to-end encryption</span>, Alice’s phone encrypts each message with Bob’s public key; only Bob’s phone holds the private key to decrypt it.`,
          `The chat server stores and forwards ciphertext. A breach of the server — or a request to hand over messages — reveals nothing readable.`,
          `<small>That’s the idea in one line. Real protocols use the key pairs to agree on a fresh secret key for every message, so a key stolen later can’t unlock old conversations (<b>forward secrecy</b>).</small>`,
        ],
        callout: {
          kind: `insight`,
          text: `The trade-off: the server can’t search, filter or back up readable messages, and losing your device can mean losing history. Signal and WhatsApp use the Signal protocol.`,
        },
        changes: [`+ Messages encrypted on the device`, `~ Server relays only ciphertext`],
        metrics: { inTransit: `end-to-end`, atRest: `yes`, secrets: `secrets manager` },
        scene: {
          entities: {
            alice: Ml([{ text: `encrypt with Bob’s public key`, icon: `lock` }], {
              form: `phone`,
              w: 5,
              d: 5,
              label: `Alice`,
            }),
            chat: d(0, -6, {
              glyph: `message`,
              label: [`Chat`, `Server`],
              tags: [{ text: `sees only ciphertext`, tone: `green`, icon: `eyeOff` }],
            }),
            bob: y(13, -6, {
              form: `phone`,
              w: 5,
              d: 5,
              label: `Bob`,
              tags: [{ text: `decrypt with private key`, icon: `key` }],
            }),
          },
          links: {
            ac: h(`alice`, `chat`, [`alice`, `chat`]),
            cb: h(`chat`, `bob`, [`chat`, `bob`]),
          },
          flows: [{ route: [`ac`, `cb`], kind: `empty`, rate: 0.9 }],
        },
      },
      {
        short: `Recap`,
        chapter: `recap`,
        title: `Recap`,
        body: [
          `<ul class="takeaways">
          <li><b>TLS</b> everywhere outside; <b>mTLS</b> between services inside.</li>
          <li>Encrypt <b>at rest</b>, with keys held separately in a <b>KMS</b>.</li>
          <li>Automate <b>certificate renewal</b>; rotate keys by <b>re-wrapping</b> data keys.</li>
          <li>Keep secrets in a <b>secrets manager</b>, rotate them, scan for leaks.</li>
          <li><b>Tokenize</b> what you’d rather not hold at all, like card numbers.</li>
          <li><b>End-to-end</b> encryption when even the server shouldn’t read the data.</li>
        </ul>`,
        ],
        callout: {
          kind: `next`,
          text: `That completes Security. Next module: <b>Shipping</b> — testing changes and getting them to production safely.`,
        },
        metrics: { inTransit: `yes`, atRest: `yes`, secrets: `secrets manager` },
        scene: {
          entities: { ...ql(), kms: zl(), vault: Bl() },
          links: {
            ...Ul({ ar: { label: `TLS` }, la: { label: `mTLS` }, ad: { label: `mTLS` } }),
            dk: h(`db`, `kms`, [`db`, `kms`], { heads: `both` }),
            av: h(`app`, `vault`, [`app`, `vault`], { heads: `both` }),
          },
          flows: [Kl.req, { route: [`av`], kind: `write`, rate: 0.4, bounce: !0 }],
        },
      },
    ],
  };

export { Yl as encryptionLesson };
export default Yl;
