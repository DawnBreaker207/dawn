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
} from '../../scene-builders';

const eo = { x0: -4.5, x1: 4.5, y0: -22, y1: -16 };

const to = (e = `people sharing photos`) => p(eo, 11, e);

const no = (e = {}) => d(0, -6, { label: [`App`, `Servers`], ...e });

const ro = (e = {}) => b(0, 6, { r: 2.1, h: 44, label: `database`, ...e });

const io = (e = {}) => b(-10, 6, { label: `metadata`, ...e });

const ao = (e = {}) =>
    d(10, 6, {
      s: 5,
      h: 40,
      color: `yellow`,
      glyph: `package`,
      label: [`Object`, `Storage`],
      ...e,
    });

const oo = (e = {}) =>
    d(21, 6, { s: 3.8, h: 30, color: `green`, glyph: `workflow`, label: [`Workers`], ...e });

const so = (e = {}) => d(10, -8, { color: `orange`, glyph: `globe`, label: [`CDN`], ...e });

const P = {
    ua: (e = {}) => h(`users`, `app`, [`users`, `app`], { heads: `both`, ...e }),
    ab: (e = {}) => h(`app`, `blob`, [`app`, `blob`], { heads: `both`, ...e }),
    ad: (e = {}) => h(`app`, `db`, [`app`, [`app`, 0], [`db`, 0], `db`], { heads: `both`, ...e }),
    ao: (e = {}) =>
      h(`app`, `obj`, [`app`, [`app`, 0], [`obj`, 0], `obj`], { heads: `both`, ...e }),
    uo: (e = {}) => h(`users`, `obj`, [`users`, [7, `users`], [7, `obj`], `obj`], e),
    oa: (e = {}) =>
      h(`obj`, `app`, [`obj`, [`obj`, 0], [`app`, 0], `app`], { style: `dashed`, ...e }),
    ow: (e = {}) => h(`obj`, `workers`, [`obj`, `workers`], { heads: `both`, ...e }),
    uc: (e = {}) => h(`users`, `cdn`, [`users`, [10, `users`], `cdn`], { heads: `both`, ...e }),
    co: (e = {}) => h(`cdn`, `obj`, [`cdn`, `obj`], { heads: `both`, ...e }),
  };

const co = (e, t, n) => S({ x: 0, y: 0, z: 0 }, e, t, { icon: n });

const lo = (e = {}) => ({
    users: to(),
    app: no(),
    db: io(),
    obj: ao(),
    workers: oo(),
    jq: ee(15.6, 6, 3, [-1, 0]),
    cdn: so(),
    ...e,
  });

const uo = (e = {}) => ({
    ua: P.ua(),
    ad: P.ad(),
    uo: P.uo(),
    oa: P.oa(),
    ow: P.ow(),
    uc: P.uc(),
    co: P.co(),
    ...e,
  });

const fo = () => [
    { route: [`uc`], rate: 3.2, bounce: !0 },
    { route: [`ua`, `ad`], rate: 1, bounce: !0 },
    { route: [`uo`], kind: `heavy`, rate: 0.6 },
    { route: [`ow`], kind: `msg`, rate: 0.6, bounce: !0 },
  ];

const po = {
    dbGrowth: `+1 GB / day`,
    appTraffic: `small requests only`,
    imgLoad: 35,
    storeCost: `$16,800`,
  };

const mo = {
    id: `files`,
    title: `Files & Media`,
    summary: `Photos and videos don’t belong in your database — where they go instead, and how they get there and back.`,
    minutes: 14,
    level: `intermediate`,
    metrics: [`dbGrowth`, `appTraffic`, `imgLoad`, `storeCost`],
    legend: [
      `req`,
      `res`,
      [`heavy`, `file bytes`],
      [`msg`, `event / job`],
      [`write`, `metadata write`],
      `fail`,
    ],
    goals: [
      { text: `Bytes in object storage, metadata in the database`, step: 2 },
      { text: `Direct uploads with presigned URLs; big files in parts`, step: 4 },
      { text: `Processing, CDN delivery and adaptive video`, step: 6 },
      { text: `Keeping metadata and files in step`, step: 9 },
      { text: `Storage classes, lifecycle and private buckets`, step: 10 },
    ],
    steps: [
      {
        short: `BLOBs`,
        chapter: `setup`,
        title: `Photos in the database`,
        body: [
          `The PhotoShare app from <em>Napkin Math</em> started simply: an uploaded photo is saved as a <span class="term">BLOB</span> — a binary column — right next to its caption, owner and date. One database, one backup, one place to look.`,
          `For the first few thousand users it works perfectly well.`,
        ],
        callout: {
          kind: `insight`,
          text: `A photo is a few megabytes; the facts about it — owner, size, caption, when — are a few hundred bytes. They are very different kinds of data.`,
        },
        metrics: {
          dbGrowth: `+2 GB / day`,
          appTraffic: `every photo, both ways`,
          imgLoad: 180,
          storeCost: `—`,
        },
        scene: {
          entities: {
            users: to(),
            app: no(),
            blob: ro({ tags: [{ text: `photos as BLOBs`, icon: `database` }] }),
          },
          links: { ua: P.ua(), ab: P.ab() },
          flows: [{ route: [`ua`, `ab`], kind: `heavy`, rate: 1.2, bounce: !0 }],
        },
      },
      {
        short: `It chokes`,
        chapter: `problem`,
        title: `Two terabytes a day`,
        body: [
          `Now a million photos a day arrive at 2 MB each: <b>2 TB a day</b>, 730 TB in a year. The database, its replicas and its backups all grow by that much. A restore takes days, and every new replica has to copy everything.`,
          `Every photo view also travels through the app servers and the database. Images push the useful rows out of the database’s memory, and queries for captions and likes slow down.`,
        ],
        callout: {
          kind: `warn`,
          text: `Databases are built to search and update small records. Shipping megabytes in and out is expensive work that only gets in the way.`,
        },
        changes: [
          `~ 1 M uploads a day × 2 MB`,
          `− Database, replicas and backups balloon`,
          `− Photo views crowd out everything else`,
        ],
        metrics: {
          dbGrowth: `+2 TB / day`,
          appTraffic: `every photo, both ways`,
          imgLoad: 450,
          storeCost: `—`,
        },
        scene: {
          entities: {
            users: to(),
            app: no(_(0.85)),
            blob: ro({ ..._(0.95), tags: [{ text: `+2 TB / day`, tone: `red`, icon: `alert` }] }),
          },
          links: { ua: P.ua(), ab: P.ab() },
          flows: [{ route: [`ua`, `ab`], kind: `heavy`, rate: 3.4, bounce: !0 }],
        },
      },
      {
        short: `Object storage`,
        chapter: `solution`,
        title: `Bytes in object storage, facts in the database`,
        body: [
          `Move the bytes to <span class="term">object storage</span> — Amazon S3, Google Cloud Storage, Azure Blob Storage. It is a huge key → file store: <code>PUT</code> a file under a key like <code>photos/9f2c.jpg</code>, <code>GET</code> it back. No queries, no joins — and no practical size limit.`,
          `It copies every object across several data centres for you and costs far less per terabyte than database disks. The database keeps one small row per photo: its key, owner, size and type.`,
        ],
        callout: {
          kind: `tip`,
          text: `This split — metadata in a database, bytes in object storage — is how almost every product stores files, from profile pictures to multi-gigabyte videos.`,
        },
        changes: [
          `+ Object storage for the bytes`,
          `~ Database keeps one ~1 KB row per photo`,
          `~ Database growth 2 TB → 1 GB a day`,
        ],
        metrics: {
          dbGrowth: `+1 GB / day`,
          appTraffic: `every photo, both ways`,
          imgLoad: 260,
          storeCost: `$16,800`,
        },
        scene: {
          entities: {
            users: to(),
            app: no(),
            db: io({ tags: [{ text: `key · owner · size · type`, icon: `listOrdered` }] }),
            obj: ao({ tags: [{ text: `photos/9f2c.jpg`, icon: `file` }] }),
          },
          links: { ua: P.ua(), ad: P.ad(), ao: P.ao() },
          flows: [
            { route: [`ua`, `ao`], kind: `heavy`, rate: 1.6, bounce: !0 },
            { route: [`ua`, `ad`], rate: 1.2, bounce: !0 },
          ],
        },
      },
      {
        short: `Through servers`,
        chapter: `problem`,
        title: `Case: a 2 GB video over a phone connection`,
        body: [
          `Uploads still flow <em>through</em> the app servers on their way to storage. A 2 GB video from a phone takes minutes, and the whole time it holds a server connection and memory open — just to pass bytes along.`,
          `The app servers end up sized for bandwidth rather than for the logic they actually run, and a burst of video uploads slows everyone’s page loads.`,
        ],
        callout: {
          kind: `warn`,
          text: `If your servers only relay bytes they don’t look at, they are an expensive middle-man.`,
        },
        changes: [`+ Video uploads, up to 2 GB`, `− Each upload holds an app server for minutes`],
        metrics: {
          dbGrowth: `+1 GB / day`,
          appTraffic: `2 TB / day relayed`,
          imgLoad: 320,
          storeCost: `$16,800`,
        },
        scene: {
          entities: {
            users: to(`people uploading videos`),
            app: no({
              ..._(0.9),
              tags: [{ text: `relaying 2 GB uploads`, tone: `red`, icon: `hourglass` }],
            }),
            db: io(),
            obj: ao(),
          },
          links: { ua: P.ua(), ad: P.ad(), ao: P.ao() },
          flows: [{ route: [`ua`, `ao`], kind: `heavy`, rate: 3, speed: 0.5 }],
        },
      },
      {
        short: `Presigned`,
        chapter: `solution`,
        title: `Upload straight to storage`,
        body: [
          `Instead, the app hands out permission and gets out of the way. The phone asks “may I upload a 2 GB video?”; the app checks the user, writes a <code>pending</code> row, and replies with a <span class="term">presigned URL</span>: a link signed with the app’s key that allows <em>one</em> upload, to <em>one</em> key, for the next 15 minutes.`,
          `The phone sends the bytes directly to object storage. When the upload finishes, storage sends an event and the app marks the row <code>uploaded</code>.`,
        ],
        callout: {
          kind: `tip`,
          text: `The signature can also pin the content type and a maximum size, so the URL can’t be reused to dump anything else into your bucket.`,
        },
        changes: [
          `+ App issues a presigned URL`,
          `+ Phone uploads directly to storage`,
          `+ Storage reports “upload complete”`,
        ],
        metrics: {
          dbGrowth: `+1 GB / day`,
          appTraffic: `small requests only`,
          imgLoad: 260,
          storeCost: `$16,800`,
        },
        scene: {
          entities: {
            users: to(`people uploading videos`),
            app: no(v(0.2)),
            db: io({ tags: [{ text: `status: pending → uploaded`, icon: `refresh` }] }),
            obj: ao(),
            card: co(
              `A presigned upload`,
              [
                `PUT https://bucket…/videos/7a1e.mp4`,
                `  ?expires=900&signature=3b9f…`,
                `= one key · one upload · 15 minutes`,
                `# the app never touches the bytes`,
              ],
              `key`,
            ),
          },
          links: {
            ua: P.ua({ label: `may I upload?` }),
            ad: P.ad(),
            uo: P.uo({ label: `the bytes`, labelAt: 0.3 }),
            oa: P.oa({ label: `upload complete` }),
          },
          flows: [
            { route: [`ua`, `ad`], rate: 1, bounce: !0 },
            { route: [`uo`], kind: `heavy`, rate: 0.9 },
            { route: [`oa`], kind: `msg`, rate: 0.6 },
          ],
        },
      },
      {
        short: `In parts`,
        chapter: `technique`,
        title: `Big files: upload in parts`,
        body: [
          `One 2 GB request over a phone network rarely makes it in one piece. A <span class="term">multipart upload</span> splits the file into parts — say 10 MB each — sent in parallel, each with its own presigned URL.`,
          `A part that fails is simply sent again; a dropped connection resumes from the last part that arrived. When every part is in, one final call stitches them into a single object.`,
        ],
        callout: {
          kind: `tip`,
          text: `Parallel parts are also faster: several connections fill a link better than one. Remove abandoned, half-finished uploads automatically, or you pay to store their parts.`,
        },
        changes: [
          `~ 2 GB → 200 parts of 10 MB`,
          `+ Failed parts retried on their own`,
          `+ Uploads resume after a dropped connection`,
        ],
        metrics: {
          dbGrowth: `+1 GB / day`,
          appTraffic: `small requests only`,
          imgLoad: 260,
          storeCost: `$16,800`,
        },
        scene: {
          entities: {
            users: to(`people uploading videos`),
            app: no(v(0.2)),
            db: io(),
            obj: ao({ tags: [{ text: `parts 1–200 → one object`, icon: `merge` }] }),
            card: co(
              `Multipart upload`,
              [
                `start      → upload id + 200 URLs`,
                `part 1…200  10 MB each, 4 at a time`,
                `! part 37 failed → send part 37 again`,
                `= complete  → videos/7a1e.mp4`,
              ],
              `layers`,
            ),
          },
          links: { ua: P.ua(), ad: P.ad(), uo: P.uo({ fail: 0.12 }), oa: P.oa() },
          flows: [
            { route: [`uo`], kind: `heavy`, rate: 3.6, speed: 0.8 },
            { route: [`ua`, `ad`], rate: 0.6, bounce: !0 },
          ],
        },
      },
      {
        short: `Processing`,
        chapter: `technique`,
        title: `Make the versions people actually download`,
        body: [
          `An original is rarely what you show. Each “upload complete” event goes onto a queue (see <em>Message Queues</em>), and workers make what the app needs: thumbnails and two or three sizes of each photo, a scan for malware, and — before anything is shared — removal of the GPS location hidden in the photo’s metadata.`,
          `Videos are transcoded into several resolutions. When a worker finishes, it saves the new files and marks the row <code>ready</code>; until then the app shows “processing…”.`,
        ],
        callout: {
          kind: `warn`,
          text: `Never trust an upload. Check the real file type, size and content in the workers, not just what the client claimed.`,
        },
        changes: [
          `+ Upload events → job queue → workers`,
          `+ Thumbnails, sizes, transcodes`,
          `+ Location data stripped, malware scan`,
        ],
        metrics: {
          dbGrowth: `+1 GB / day`,
          appTraffic: `small requests only`,
          imgLoad: 120,
          storeCost: `$16,800`,
        },
        scene: {
          entities: {
            users: to(),
            app: no(v(0.2)),
            db: io({ tags: [{ text: `status: ready`, tone: `green`, icon: `check` }] }),
            obj: ao(),
            jq: ee(15.6, 6, 3, [-1, 0]),
            workers: oo({ tags: [{ text: `resize · strip GPS · transcode`, icon: `workflow` }] }),
          },
          links: {
            ua: P.ua(),
            ad: P.ad(),
            uo: P.uo(),
            oa: P.oa(),
            ow: P.ow({ label: `jobs`, labelAt: 0.25 }),
          },
          flows: [
            { route: [`uo`], kind: `heavy`, rate: 0.7 },
            { route: [`ow`], kind: `msg`, rate: 1, bounce: !0 },
            { route: [`oa`, `ad`], kind: `write`, rate: 0.6 },
          ],
        },
      },
      {
        short: `CDN`,
        chapter: `solution`,
        title: `Serve them from the edge`,
        body: [
          `Downloads far outnumber uploads, so they must not come through the app either. Photos are served by a <b>CDN</b> (see <em>Content Delivery</em>) with object storage as its origin: the first viewer in a city pulls a copy to the nearest edge, everyone after gets it from there.`,
          `Give each version a key that changes when its content does — <code>photos/9f2c_w640.webp</code> — and it can be cached for a year without ever going stale.`,
        ],
        callout: {
          kind: `tip`,
          text: `For private photos, the app hands out short-lived signed CDN URLs — the same idea as presigned uploads, in the other direction.`,
        },
        changes: [
          `+ CDN in front of object storage`,
          `~ Views served from the nearest edge`,
          `~ Photo load 120 → 35 ms`,
        ],
        metrics: po,
        scene: { entities: lo(), links: uo(), flows: fo() },
      },
      {
        short: `Video`,
        chapter: `technique`,
        title: `Video: let the player choose`,
        body: [
          `A video file is too big to download before playing, and viewers’ connections vary from second to second. So each video is cut into segments of a few seconds, encoded at several qualities — 240p up to 1080p — with a small playlist file listing them all.`,
          `The player fetches segment by segment from the CDN and picks the quality for the next one from how fast the last one arrived. A train enters a tunnel: the picture drops to 360p instead of freezing. This is <span class="term">adaptive bitrate streaming</span> (HLS or DASH).`,
        ],
        callout: {
          kind: `insight`,
          text: `Small, separately cacheable segments are also what makes video work so well on CDNs: every popular segment ends up at every edge.`,
        },
        changes: [
          `+ Each video: 4-second segments × 5 qualities`,
          `+ Player switches quality segment by segment`,
        ],
        metrics: po,
        scene: {
          entities: lo({
            cdn: so({ tags: [{ text: `segments · 4 s each`, icon: `video` }] }),
            card: co(
              `One video, five qualities`,
              [
                `1080p   5 Mbit/s`,
                ` 720p   3 Mbit/s`,
                `= 480p   1.5 Mbit/s   ← now: 2 Mbit/s link`,
                ` 360p   0.8 Mbit/s`,
                ` 240p   0.4 Mbit/s`,
              ],
              `video`,
            ),
          }),
          links: uo(),
          flows: [
            { route: [`uc`], kind: `heavy`, rate: 2.6, bounce: !0 },
            { route: [`co`], rate: 0.4, bounce: !0 },
          ],
        },
      },
      {
        short: `In step`,
        chapter: `problem`,
        title: `Case: rows without files, files without rows`,
        body: [
          `Two stores can disagree. A phone gets its presigned URL and then loses signal: the row says <code>pending</code> for ever. A user deletes a photo: the row goes, but the files stay — still costing money, and still reachable by anyone who kept the link.`,
          `Fix it like any two-system update (see <em>Sagas</em>): every row has a <b>status</b>; storage events move it forward; deletes remove the row first and queue the file deletions; and a nightly <b>cleanup job</b> clears <code>pending</code> rows older than a day and files that no row points to.`,
        ],
        callout: {
          kind: `tip`,
          text: `Deleting user data is a legal duty in many places. Make sure deletion reaches every copy: sizes, transcodes, backups and the CDN.`,
        },
        changes: [
          `+ Status on every row: pending → uploaded → ready`,
          `+ Deletes: row first, then queued file deletes`,
          `+ Nightly cleanup of orphans`,
        ],
        metrics: po,
        scene: {
          entities: lo({
            db: io({ tags: [{ text: `312 pending > 1 day`, tone: `amber`, icon: `hourglass` }] }),
            sweep: d(-10, -6, {
              s: 3.6,
              h: 28,
              color: `slab`,
              glyph: `refresh`,
              label: [`Cleanup`],
              sub: `nightly`,
            }),
          }),
          links: uo({
            sd: h(`sweep`, `db`, [`sweep`, `db`], { heads: `both` }),
            so: h(`sweep`, `obj`, [`sweep`, [`sweep`, -2], [`obj`, -2], `obj`], {
              style: `dashed`,
              label: `delete orphans`,
              labelAt: 0.35,
            }),
          }),
          flows: [
            ...fo(),
            { route: [`sd`], rate: 0.5, bounce: !0 },
            { route: [`so`], kind: `kill`, rate: 0.5 },
          ],
        },
      },
      {
        short: `Lifecycle`,
        chapter: `tradeoff`,
        title: `Old files can live somewhere cheaper`,
        body: [
          `Most photos are looked at in their first few weeks and hardly ever again. Object stores sell <b>storage classes</b>: standard for hot data, “infrequent access” for less, and archive tiers that cost a fraction as much — but charge more, or take minutes to hours, to read.`,
          `A <span class="term">lifecycle rule</span> moves objects automatically: originals older than 90 days go to an archive tier, while the small sizes people still browse stay hot.`,
        ],
        callout: {
          kind: `warn`,
          text: `Cheap storage with expensive reads is a trap for data you still read often. Check how your files are actually accessed before archiving them.`,
        },
        changes: [
          `+ Lifecycle: originals → archive after 90 days`,
          `~ Storage bill after one year $16,800 → ≈ $6,300 / month`,
        ],
        metrics: { ...po, storeCost: `≈ $6,300` },
        scene: {
          entities: lo({
            obj: ao({
              tags: [{ text: `originals > 90 days → archive`, tone: `green`, icon: `clock` }],
            }),
            card: co(
              `Storage classes · per TB-month`,
              [
                `standard            ≈ $23    hot, cheap to read`,
                `infrequent access   ≈ $12.50  pay per read`,
                `archive             ≈ $1–4   slow or costly to read`,
                `= after a year: 730 TB → ≈ $6,300 / month`,
              ],
              `dollar`,
            ),
          }),
          links: uo(),
          flows: fo(),
        },
      },
      {
        short: `Public bucket`,
        chapter: `problem`,
        title: `Case: the bucket anyone can list`,
        body: [
          `A developer makes the bucket public “to get images showing”. Months later someone discovers they can <b>list</b> it — and download every photo ever uploaded, including private ones and the originals with their location data. Leaks like this are among the most common cloud breaches.`,
          `Keep buckets private and block public access at the account level. Serve through the CDN with signed URLs, give each service a key that can touch only its own paths, and use unguessable object names as a last line, not the only one.`,
        ],
        callout: {
          kind: `warn`,
          text: `A random key is not access control. If a URL is all it takes to read a private file, that URL must expire.`,
        },
        changes: [
          `− Bucket listable by anyone`,
          `+ Public access blocked, CDN with signed URLs`,
          `+ Least-privilege keys per service`,
        ],
        metrics: { ...po, storeCost: `≈ $6,300` },
        scene: {
          entities: lo({
            spy: y(20, -8, { label: `anyone` }),
            obj: ao({ tags: [{ text: `public access blocked`, tone: `green`, icon: `lock` }] }),
          }),
          links: uo({
            so: h(`spy`, `obj`, [`spy`, [20, `obj`], `obj`], {
              fail: 1,
              label: `GET /?list`,
              labelTone: `red`,
              labelAt: 0.3,
            }),
          }),
          flows: [...fo(), { route: [`so`], kind: `poison`, rate: 0.9 }],
        },
      },
      {
        short: `Recap`,
        chapter: `recap`,
        title: `Recap`,
        body: [
          `<ul class="takeaways">
          <li><b>Bytes</b> in object storage, <b>metadata</b> in the database — joined by the object’s key.</li>
          <li>Clients upload <b>directly</b> with presigned URLs; big files go in <b>parts</b> that can be retried and resumed.</li>
          <li><b>Workers</b> make thumbnails, sizes and transcodes — and strip what shouldn’t be shared.</li>
          <li>Serve through a <b>CDN</b> with versioned keys; stream video in <b>adaptive</b> segments.</li>
          <li>Keep rows and files <b>in step</b>, move old files to <b>cheaper classes</b>, and keep buckets <b>private</b>.</li>
        </ul>`,
        ],
        callout: {
          kind: `next`,
          text: `That completes Data & Storage. Next module: <b>Communication</b> — how services talk to each other.`,
        },
        metrics: { ...po, storeCost: `≈ $6,300` },
        scene: { entities: lo(), links: uo(), flows: fo() },
      },
    ],
  };

export { mo as filesLesson };
export default mo;
