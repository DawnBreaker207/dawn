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

const dl = (e = []) => y(0, -19, { label: `Alice`, tags: e });

const fl = (e = {}) =>
    d(0, -7, { color: `orange`, glyph: `keyhole`, label: [`Login`, `Service`], ...e });

const pl = (e = [], t = {}) =>
    b(0, 5, { r: 2, h: 42, glyph: `user`, label: `users table`, tags: e, ...t });

const ml = (e = `attacker`, t = []) => y(13, 5, { label: e, tags: t });

const hl = (e = []) => y(13, -19, { label: `bot`, tags: e });

const gl = () => y(-12, -19, { form: `phone`, w: 5, d: 5, label: `Alice’s phone` });

const _l = (e = {}) =>
    d(13, -7, {
      s: 5,
      h: 52,
      color: `orange`,
      glyph: `globe`,
      label: [`Fake`, `Login`],
      sub: `shop-example.co`,
      ...e,
    });

const vl = () =>
    d(-12, -7, {
      s: 5,
      h: 52,
      color: `blue`,
      glyph: `idCard`,
      label: [`Identity`, `Provider`],
      sub: `e.g. Google`,
    });

const V = {
    base: {
      al: h(`alice`, `login`, [`alice`, `login`], { heads: `both` }),
      lu: h(`login`, `users`, [`login`, `users`], { heads: `both` }),
    },
    steal: (e = `stolen backup`) => ({
      st: h(`users`, `thief`, [`users`, `thief`], { style: `dashed`, label: e, labelTone: `red` }),
    }),
    bot: (e = {}) => ({ bl: h(`bot`, `login`, [`bot`, [`bot`, `login`], `login`], e) }),
  };

const yl = {
    login: { route: [`al`, `lu`], kind: `mine`, rate: 0.8, bounce: !0 },
    steal: { route: [`st`], kind: `poison`, rate: 0.7 },
    bot: (e = 4) => ({ route: [`bl`], kind: `poison`, rate: e }),
  };

const bl = (e, t, n) => S({ x: 0, y: 5, z: 0, dx: 100, dy: -235 }, e, t, { icon: n });

// --- security ---
const xl = {
    id: `authentication`,
    title: `Authentication`,
    summary: `Proving who someone is — without becoming the reason their password leaks.`,
    minutes: 13,
    level: `intermediate`,
    metrics: [`leak`, `stuffing`, `mfa`],
    legend: [[`mine`, `Alice’s login`], `res`, [`poison`, `attacker`], `fail`],
    goals: [
      { text: `Store passwords as slow, salted hashes`, step: 1 },
      { text: `Sessions and a safe password reset`, step: 3 },
      { text: `Credential stuffing and second factors`, step: 6 },
      { text: `Phishing and passkeys`, step: 8 },
      { text: `Identity providers and short-lived tokens`, step: 10 },
    ],
    steps: [
      {
        short: `Plain text`,
        chapter: `problem`,
        title: `A table full of passwords`,
        body: [
          `Alice signs up and the login service stores her password exactly as she typed it. Logging in is a simple comparison.`,
          `Then a database backup leaks — a misconfigured bucket, a stolen laptop. Every password is readable instantly, and because people reuse passwords, the attacker can now try them on email, banking and everything else.`,
        ],
        callout: {
          kind: `warn`,
          text: `Assume your database will leak one day. The question is what an attacker can do with it.`,
        },
        metrics: { leak: `all passwords`, stuffing: `—`, mfa: `no` },
        scene: {
          entities: {
            alice: dl(),
            login: fl(),
            users: pl([{ text: `alice@… : hunter2`, tone: `red`, icon: `alert` }]),
            thief: ml(`attacker`, [{ text: `reads every password`, tone: `red`, icon: `eye` }]),
          },
          links: { ...V.base, ...V.steal() },
          flows: [yl.login, yl.steal],
        },
      },
      {
        short: `Hashing`,
        chapter: `solution`,
        title: `Store a slow, salted hash`,
        body: [
          `Never store the password itself. Store a <span class="term">hash</span>: a one-way fingerprint. At login, hash what Alice typed and compare fingerprints.`,
          `Use a hash built for passwords — <b>argon2id</b>, <b>bcrypt</b> or <b>scrypt</b>: a random <b>salt</b> per user makes identical passwords look different, and deliberate slowness (~100 ms) turns billions of guesses into years.`,
        ],
        callout: {
          kind: `warn`,
          text: `Fast hashes like MD5 or SHA-256 are the wrong tool: a graphics card tries billions per second.`,
        },
        changes: [`~ Passwords → argon2id hashes, salted per user`],
        metrics: { leak: `hashes only`, stuffing: `—`, mfa: `no` },
        scene: {
          entities: {
            alice: dl(),
            login: fl({ tags: [{ text: `hash attempt, compare`, icon: `hash` }] }),
            users: pl([{ text: `alice@… : $argon2id$…7Qe`, tone: `green`, icon: `hash` }]),
            thief: ml(`attacker`, [
              { text: `gets hashes · years to crack`, tone: `amber`, icon: `hourglass` },
            ]),
          },
          links: { ...V.base, ...V.steal() },
          flows: [yl.login, yl.steal],
        },
      },
      {
        short: `Session`,
        chapter: `technique`,
        title: `After login: a session`,
        body: [
          `Nobody wants to type a password on every click. After a successful login the service creates a <b>session</b> and gives the browser a random session id in a cookie; later requests present the cookie.`,
          `Mark it <code>HttpOnly</code> (scripts can’t read it), <code>Secure</code> (HTTPS only) and <code>SameSite</code> (not sent from other sites). Or issue a short-lived signed token — see the Stateless Services lesson.`,
        ],
        callout: {
          kind: `tip`,
          text: `Treat session ids like passwords: long, random, never in URLs or logs, and invalidated at logout.`,
        },
        changes: [`+ Session cookie after login`],
        metrics: { leak: `hashes only`, stuffing: `—`, mfa: `no` },
        scene: {
          entities: {
            alice: dl([{ text: `cookie: HttpOnly · Secure`, icon: `lock` }]),
            login: fl(),
            users: pl([{ text: `alice@… : $argon2id$…7Qe`, tone: `green`, icon: `hash` }]),
          },
          links: V.base,
          flows: [yl.login],
        },
      },
      {
        short: `Reset`,
        chapter: `technique`,
        title: `Case: the forgotten-password flow`,
        body: [
          `Password reset is a second way into every account — and often the weakest. Typical bugs: reset tokens that are guessable or never expire, and a form that says “no account with that email”, telling attackers exactly which emails are registered.`,
          `A safe flow: a long random token, single use, valid for 15 minutes; the same reply whether or not the account exists; and every existing session signed out after the change.`,
        ],
        callout: {
          kind: `warn`,
          text: `Anything that can change a password — reset, email change, support tools — needs the same care as the login itself.`,
        },
        changes: [
          `+ Reset email with a single-use token`,
          `~ Token expires after 15 min`,
          `~ Same reply for unknown emails`,
        ],
        metrics: { leak: `hashes only`, stuffing: `—`, mfa: `no` },
        scene: {
          entities: {
            alice: dl([{ text: `reset link · expires 15 min`, tone: `green`, icon: `clock` }]),
            login: fl({ tags: [{ text: `same reply for every email`, icon: `info` }] }),
            users: pl([{ text: `alice@… : $argon2id$…7Qe`, tone: `green`, icon: `hash` }]),
            mail: d(-12, -7, { color: `blue`, glyph: `mail`, label: [`Email`] }),
            card: bl(
              `A safe reset`,
              [
                `token: 32 random bytes, single use`,
                `expires after 15 minutes`,
                `same reply whether the email exists`,
                `= after the reset: revoke every session`,
              ],
              `key`,
            ),
          },
          links: {
            ...V.base,
            lm: h(`login`, `mail`, [`login`, `mail`], { label: `one-time token` }),
            ma: h(`mail`, `alice`, [`mail`, [`mail`, `alice`], `alice`], {
              label: `reset link`,
              labelAt: 0.65,
            }),
          },
          flows: [yl.login, { route: [`lm`, `ma`], kind: `msg`, rate: 0.6 }],
        },
      },
      {
        short: `Stuffing`,
        chapter: `problem`,
        title: `Credential stuffing`,
        body: [
          `A bot has a list of a billion email + password pairs leaked from <em>other</em> sites. It tries them all against your login form, thousands per second.`,
          `Your hashing is perfect — and still about 0.5% of attempts succeed, because those people reused a password. That’s thousands of accounts taken over.`,
        ],
        callout: {
          kind: `warn`,
          text: `Credential stuffing is the most common account-takeover attack. It needs no flaw in your code at all.`,
        },
        changes: [`+ Bot replaying leaked passwords`, `− ~0.5% of attempts succeed`],
        metrics: { leak: `hashes only`, stuffing: 0.5, mfa: `no` },
        scene: {
          entities: {
            alice: dl(),
            login: fl({
              heat: 0.6,
              tags: [{ text: `5,000 logins / s`, tone: `red`, icon: `activity` }],
            }),
            users: pl([{ text: `alice@… : $argon2id$…7Qe`, tone: `green`, icon: `hash` }]),
            bot: hl([{ text: `1B leaked passwords`, tone: `red`, icon: `bot` }]),
          },
          links: { ...V.base, ...V.bot({ fail: 0.9, label: `try every pair`, labelTone: `red` }) },
          flows: [yl.login, yl.bot(5)],
        },
      },
      {
        short: `Slow down`,
        chapter: `solution`,
        title: `Make guessing expensive`,
        body: [
          `Defend the form itself: <b>rate-limit</b> attempts per account and per IP address, add a challenge when traffic looks automated, and reject passwords that appear in known breach lists at signup.`,
          `Flag risky logins — a new device, a new country — and ask for extra proof.`,
        ],
        callout: {
          kind: `tip`,
          text: `Services such as Have I Been Pwned let you check a password against breaches without ever sending the password.`,
        },
        changes: [
          `+ Rate limits per account and IP`,
          `+ Breached passwords rejected`,
          `~ Successful stuffing 0.5% → 0.05%`,
        ],
        metrics: { leak: `hashes only`, stuffing: 0.05, mfa: `no` },
        scene: {
          entities: {
            alice: dl(),
            login: fl({ tags: [{ text: `5 tries / account / min`, icon: `gauge` }] }),
            users: pl([{ text: `alice@… : $argon2id$…7Qe`, tone: `green`, icon: `hash` }]),
            bot: hl([{ text: `slowed to a crawl`, tone: `amber`, icon: `ban` }]),
          },
          links: {
            ...V.base,
            ...V.bot({ fail: 0.99, label: `429 · challenge`, labelTone: `amber` }),
          },
          flows: [yl.login, yl.bot(2)],
        },
      },
      {
        short: `2nd factor`,
        chapter: `solution`,
        title: `A second factor`,
        body: [
          `<span class="term">Multi-factor authentication</span> asks for something you <em>have</em> as well as something you know: a code from an authenticator app, a push approval on your phone, or a hardware key.`,
          `A stolen password alone no longer opens the account. <b>Passkeys</b> go further: a key pair stored on the device, nothing reusable to steal or phish.`,
        ],
        callout: {
          kind: `tip`,
          text: `SMS codes are better than nothing but can be intercepted (SIM swapping). Prefer app codes, push, or passkeys.`,
        },
        changes: [`+ Approval on Alice’s phone`, `~ Stolen passwords alone stop working`],
        metrics: { leak: `hashes only`, stuffing: 0, mfa: `yes` },
        scene: {
          entities: {
            alice: dl(),
            phone: gl(),
            login: fl({ tags: [{ text: `password ✓ + phone ✓`, tone: `green`, icon: `check` }] }),
            users: pl([{ text: `alice@… : $argon2id$…7Qe`, tone: `green`, icon: `hash` }]),
            bot: hl([{ text: `no phone → blocked`, tone: `green`, icon: `ban` }]),
          },
          links: {
            ...V.base,
            ...V.bot({ fail: 1 }),
            lp: h(`login`, `phone`, [`login`, [`phone`, `login`], `phone`], {
              heads: `both`,
              label: `approve sign-in?`,
              labelAt: 0.4,
            }),
          },
          flows: [yl.login, { route: [`lp`], kind: `mine`, rate: 0.6, bounce: !0 }, yl.bot(1.2)],
        },
      },
      {
        short: `Phishing`,
        chapter: `problem`,
        title: `Case: a perfect fake login page`,
        body: [
          `An email warns of an “unusual sign-in” and links to <code>shop-example.co</code> — a pixel-perfect copy of your login page. Alice types her password <em>and</em> the one-time code from her app.`,
          `The fake site relays both to the real one within seconds and walks away with her session. Codes and push approvals stop stolen passwords, but not a phishing site that forwards them in real time.`,
        ],
        callout: {
          kind: `warn`,
          text: `Anything a person can read and type, a fake page can ask for and pass on. Training helps; it isn’t enough on its own.`,
        },
        changes: [
          `+ Fake login page relaying in real time`,
          `− Password and one-time code both captured`,
        ],
        metrics: { leak: `hashes only`, stuffing: 0, mfa: `phishable` },
        scene: {
          entities: {
            alice: dl([{ text: `typed password + code`, tone: `red`, icon: `alert` }]),
            phone: gl(),
            login: fl({ tags: [{ text: `looks like a normal login`, tone: `amber` }] }),
            users: pl([{ text: `alice@… : $argon2id$…7Qe`, tone: `green`, icon: `hash` }]),
            fake: _l({
              heat: 0.4,
              tags: [{ text: `relays in real time`, tone: `red`, icon: `alert` }],
            }),
          },
          links: {
            lu: V.base.lu,
            af: h(`alice`, `fake`, [`alice`, [`fake`, `alice`], `fake`], {
              heads: `both`,
              label: `shop-example.co`,
              labelTone: `red`,
              labelAt: 0.35,
            }),
            fl: h(`fake`, `login`, [`fake`, `login`], {
              label: `password + code`,
              labelTone: `red`,
            }),
            lp: h(`login`, `phone`, [`login`, [`phone`, `login`], `phone`], { heads: `both` }),
          },
          flows: [
            { route: [`af`, `fl`, `lu`], kind: `poison`, rate: 0.7, bounce: !0 },
            { route: [`lp`], kind: `mine`, rate: 0.4, bounce: !0 },
          ],
        },
      },
      {
        short: `Passkeys`,
        chapter: `solution`,
        title: `Passkeys: nothing to type, nothing to steal`,
        body: [
          `A <span class="term">passkey</span> (WebAuthn) replaces the password with a key pair kept on Alice’s phone or laptop. To sign in, the device signs a challenge from the site — and the signature is tied to the real domain, <code>shop.example</code>.`,
          `On the fake site her device simply has no passkey to offer. There’s nothing to type, nothing to relay, and the server only stores public keys, which are useless to a thief.`,
        ],
        callout: {
          kind: `tip`,
          text: `Passkeys sync across a person’s devices (Apple, Google, password managers), so losing a phone doesn’t lock them out.`,
        },
        changes: [
          `~ Password + code → passkey`,
          `− Fake site gets nothing usable`,
          `~ Server stores public keys only`,
        ],
        metrics: { leak: `nothing usable`, stuffing: 0, mfa: `passkey` },
        scene: {
          entities: {
            alice: dl([
              { text: `passkey · shop.example only`, tone: `green`, icon: `fingerprint` },
            ]),
            phone: gl(),
            login: fl({
              tags: [{ text: `checks signature + domain`, tone: `green`, icon: `check` }],
            }),
            users: pl([{ text: `alice@… : public key only`, tone: `green`, icon: `key` }]),
            fake: _l({
              tags: [{ text: `no passkey for this domain`, tone: `green`, icon: `ban` }],
            }),
          },
          links: {
            ...V.base,
            af: h(`alice`, `fake`, [`alice`, [`fake`, `alice`], `fake`], {
              heads: `both`,
              fail: 1,
              label: `shop-example.co`,
              labelTone: `red`,
              labelAt: 0.35,
            }),
            lp: h(`login`, `phone`, [`login`, [`phone`, `login`], `phone`], {
              heads: `both`,
              label: `sign challenge`,
              labelAt: 0.4,
            }),
          },
          flows: [
            yl.login,
            { route: [`lp`], kind: `mine`, rate: 0.5, bounce: !0 },
            { route: [`af`], kind: `poison`, rate: 0.4 },
          ],
        },
      },
      {
        short: `Use a provider`,
        chapter: `technique`,
        title: `Or let an identity provider do it`,
        body: [
          `“Sign in with Google” uses <span class="term">OpenID Connect</span> (built on OAuth 2.0). Your app sends Alice to the <b>identity provider</b>; she proves who she is there, and the provider sends back a signed <b>ID token</b> saying “this is Alice”.`,
          `Your service verifies the signature and never sees, stores or leaks a password. Companies use the same idea for single sign-on (Okta, Entra ID).`,
        ],
        callout: {
          kind: `insight`,
          text: `Authentication is hard to get right. Delegating it to a specialist is often the most secure choice.`,
        },
        changes: [`+ Identity provider`, `− Passwords no longer stored`],
        metrics: { leak: `nothing usable`, stuffing: 0, mfa: `yes` },
        scene: {
          entities: {
            alice: dl(),
            idp: vl(),
            login: fl({ tags: [{ text: `verifies ID token signature`, icon: `check` }] }),
            users: pl([
              { text: `alice@… : google-id 1042 · no password`, tone: `green`, icon: `idCard` },
            ]),
          },
          links: {
            ai: h(`alice`, `idp`, [`alice`, [-12, `alice`], `idp`], {
              heads: `both`,
              label: `sign in at provider`,
              labelAt: 0.72,
            }),
            il: h(`idp`, `login`, [`idp`, `login`], { label: `signed ID token` }),
            lu: V.base.lu,
            al: V.base.al,
          },
          flows: [
            { route: [`ai`, `il`], kind: `mine`, rate: 0.7 },
            { route: [`al`, `lu`], rate: 0.6, bounce: !0 },
          ],
        },
      },
      {
        short: `Tokens`,
        chapter: `problem`,
        title: `Case: a stolen token`,
        body: [
          `A bug logs request headers, and an attacker finds Alice’s token in the logs. A token is as good as a password while it’s valid — if it never expires, the attacker is Alice forever.`,
          `So use short-lived <b>access tokens</b> (minutes) plus a <b>refresh token</b> that is stored carefully and can be <b>revoked</b>. Logging out, or “log out everywhere”, revokes it.`,
        ],
        callout: {
          kind: `tip`,
          text: `Short expiry limits the damage of any leak. Revocation lets you end it immediately.`,
        },
        changes: [
          `+ Access tokens expire after 15 min`,
          `+ Revocable refresh tokens`,
          `− Stolen token rejected after expiry`,
        ],
        metrics: { leak: `nothing usable`, stuffing: 0, mfa: `yes` },
        scene: {
          entities: {
            alice: dl([{ text: `access 15 min · refresh revocable`, icon: `clock` }]),
            idp: vl(),
            login: fl({ tags: [{ text: `token expired → 401`, tone: `amber`, icon: `clock` }] }),
            users: pl([
              { text: `alice@… : google-id 1042 · no password`, tone: `green`, icon: `idCard` },
            ]),
            bot: hl([{ text: `token from leaked logs`, tone: `red`, icon: `key` }]),
          },
          links: {
            ai: h(`alice`, `idp`, [`alice`, [-12, `alice`], `idp`], { heads: `both` }),
            il: h(`idp`, `login`, [`idp`, `login`]),
            lu: V.base.lu,
            al: V.base.al,
            ...V.bot({ fail: 1, label: `expired token`, labelTone: `amber` }),
          },
          flows: [{ route: [`al`, `lu`], kind: `mine`, rate: 0.7, bounce: !0 }, yl.bot(1)],
        },
      },
      {
        short: `Recap`,
        chapter: `recap`,
        title: `Recap`,
        body: [
          `<ul class="takeaways">
          <li>Store passwords as <b>slow, salted hashes</b> (argon2id, bcrypt).</li>
          <li>Sessions in <b>HttpOnly, Secure</b> cookies, or short-lived tokens.</li>
          <li>Stop stuffing with <b>rate limits</b>, breach checks and a <b>second factor</b>.</li>
          <li>Make <b>password reset</b> as strong as login; <b>passkeys</b> defeat phishing.</li>
          <li>Consider an <b>identity provider</b>; keep tokens <b>short-lived and revocable</b>.</li>
        </ul>`,
        ],
        callout: {
          kind: `next`,
          text: `Next up: <b>Authorization</b> — knowing who someone is doesn’t tell you what they may do.`,
        },
        metrics: { leak: `nothing usable`, stuffing: 0, mfa: `yes` },
        scene: {
          entities: { alice: dl(), idp: vl(), login: fl(), users: pl() },
          links: {
            ai: h(`alice`, `idp`, [`alice`, [-12, `alice`], `idp`], { heads: `both` }),
            il: h(`idp`, `login`, [`idp`, `login`]),
            lu: V.base.lu,
            al: V.base.al,
          },
          flows: [{ route: [`al`, `lu`], kind: `mine`, rate: 0.7, bounce: !0 }],
        },
      },
    ],
  };

export { xl as authenticationLesson };
export default xl;
