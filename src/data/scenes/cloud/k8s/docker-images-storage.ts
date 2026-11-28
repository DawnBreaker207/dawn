import { makeBlock, makeDb, makeLink, makePanel, makeZone, cardAt, type Tag, type SceneOpts } from '@/lib/simulator/scene-builders';

// One image, one container, for the whole lesson. The image layers climb a staircase
// (base → runtime → app); the container's writable upperdir sits on top, and the running
// container sees the merged view of all of them. Later a volume appears off to the side.
//
//                                   upperdir (rw)
//                         app layer      │
//               runtime ──┘              container (merged view)
//     base ─────┘                              │
//                                         volume (survives)

const layer = (y: number, name: string, sub: string, o: SceneOpts = {}) =>
  makeBlock(-8, y, { s: 4.4, h: 48, color: `purple`, glyph: `layers`, label: [name], sub, ...o });
const base = (o: SceneOpts = {}) => layer(-16, `debian:12`, `base · 117 MB`, o);
const runtime = (o: SceneOpts = {}) => layer(-4, `node:20`, `+ 52 MB`, o);
const appLayer = (o: SceneOpts = {}) => layer(8, `COPY app/`, `+ 13 MB`, o);
const upper = (tags: Tag[] = [], o: SceneOpts = {}) =>
  makeBlock(-6, 20, { s: 4.4, h: 48, color: `yellow`, glyph: `file`, label: [`upperdir`], sub: `writable`, tags, ...o });
const container = (tags: Tag[] = [], o: SceneOpts = {}) =>
  makeBlock(11.5, 3, { s: 4.6, h: 54, color: `green`, glyph: `cpu`, label: [`container`], sub: `merged view`, tags, ...o });
const volume = (tags: Tag[] = []) => makeDb(11.5, -13, { r: 2.2, h: 46, glyph: `database`, label: `volume pgdata`, tags });
const image = () => makeZone({ x0: -11, x1: -5, y0: -21, y1: 11 }, `IMAGE · RO`);

const links = {
  parent1: makeLink(`base`, `runtime`, [`base`, `runtime`]),
  parent2: makeLink(`runtime`, `app`, [`runtime`, `app`]),
  lower: makeLink(`ctr`, `app`, [`ctr`, `app`], { heads: `both`, label: `lowerdir` }),
  lowerQuiet: makeLink(`ctr`, `app`, [`ctr`, `app`], { heads: `both` }),
  upperRw: makeLink(`ctr`, `upper`, [`ctr`, `upper`], { heads: `both`, label: `upperdir` }),
  upperQuiet: makeLink(`ctr`, `upper`, [`ctr`, `upper`], { heads: `both` }),
  copyUp: makeLink(`app`, `upper`, [`app`, `upper`], { label: `copy-up` }),
  bind: makeLink(`ctr`, `vol`, [`ctr`, `vol`], { heads: `both`, label: `/var/lib/data` }),
};

/** CLI / file cards sit in the open floor to the lower right. */
const card = cardAt({ x: 11.5, y: 3, dx: 60, dy: 60 });

const stack = () => ({ base: base(), runtime: runtime(), app: appLayer(), image: image() });

export const dockerImagesStorageLesson = {
  id: `docker-images-storage`,
  title: `Docker Images, UnionFS & OverlayFS Storage`,
  trackId: `k8s`,
  summary: `Build an image as read-only layers, start a container on top with OverlayFS, and see what copy-on-write, whiteouts and volumes really do.`,
  minutes: 12,
  level: `intermediate`,
  metrics: [`layers`, `imageSize`, `upperSize`, `persisted`],
  legend: [`req`, `res`, [`write`, `write / copy-up`], [`fail`, `deleted`]],
  goals: [
    { text: `An image is a stack of read-only layers`, step: 1 },
    { text: `OverlayFS: lowerdir, upperdir, merged`, step: 2 },
    { text: `Copy-on-write on the first change`, step: 3 },
    { text: `Volumes keep data the container loses`, step: 6 },
    { text: `Multi-stage builds shrink the stack`, step: 7 },
  ],
  steps: [
    {
      short: `Layers`,
      chapter: `setup`,
      title: `An image is a stack of layers`,
      body: [
        `Every <code>FROM</code>, <code>RUN</code> and <code>COPY</code> in a Dockerfile produces one <span class="term">layer</span>: a tarball of the files that instruction added or changed, named by the hash of its content.`,
        `Layers are <b>read-only</b> and shared. Ten images built on <code>node:20</code> store those 52 MB once.`,
      ],
      metrics: { layers: 3, imageSize: `182 MB`, upperSize: `—`, persisted: `—` },
      scene: {
        entities: {
          ...stack(),
          card: card(
            `docker history web:1.4`,
            [`$ docker history web:1.4`, `COPY app/ /app       13 MB`, `FROM node:20         52 MB`, `FROM debian:12      117 MB`],
            `layers`,
          ),
        },
        links: { parent1: links.parent1, parent2: links.parent2 },
        flows: [{ route: [`parent1`, `parent2`], kind: `write`, rate: 0.8 }],
      },
    },
    {
      short: `OverlayFS`,
      chapter: `technique`,
      title: `A container adds one thin writable layer`,
      body: [
        `<code>docker run</code> doesn’t copy the image. The <span class="term">overlay2</span> driver mounts the image layers as <code>lowerdir</code>, adds an empty <code>upperdir</code> for this container, and shows the process a single <b>merged</b> directory.`,
        `Reads fall through to the highest layer that has the file. Starting a container costs almost no disk.`,
      ],
      changes: [`+ upperdir (empty)`, `+ container (merged view)`],
      metrics: { layers: 3, imageSize: `182 MB`, upperSize: `0 B`, persisted: `—` },
      scene: {
        entities: {
          ...stack(),
          upper: upper(),
          ctr: container(),
          card: card(
            `mount | grep overlay`,
            [`overlay on /var/lib/docker/overlay2/9f…/merged`, `  lowerdir=l/APP:l/NODE:l/DEBIAN,`, `  upperdir=9f…/diff,`, `  workdir=9f…/work`],
            `scan`,
          ),
        },
        links: { parent1: links.parent1, parent2: links.parent2, lower: links.lower, upperRw: links.upperRw },
        flows: [
          { route: [`lower`], rate: 1.6, bounce: true },
          { route: [`upperRw`], rate: 0.6, bounce: true },
        ],
      },
    },
    {
      short: `Copy-up`,
      chapter: `technique`,
      title: `The first write copies the whole file up`,
      body: [
        `The app edits <code>/app/config.json</code>, which lives in a read-only layer. OverlayFS first <span class="term">copies the file up</span> into <code>upperdir</code>, then changes the copy. The image layer is untouched.`,
        `Copy-up is per file and happens once — but a 1 GB file edited by one byte is copied in full. That’s why databases don’t write into the container layer.`,
      ],
      changes: [`~ config.json copied up`, `~ upperdir 0 B → 4 KB`],
      metrics: { layers: 3, imageSize: `182 MB`, upperSize: `4 KB`, persisted: `—` },
      scene: {
        entities: {
          ...stack(),
          upper: upper([{ text: `config.json (copy)`, tone: `amber`, icon: `file` }]),
          ctr: container(),
        },
        links: { parent1: links.parent1, parent2: links.parent2, lower: links.lowerQuiet, upperRw: links.upperQuiet, copyUp: links.copyUp },
        flows: [
          { route: [`copyUp`], kind: `write`, rate: 1 },
          { route: [`upperRw`], kind: `write`, rate: 1.2, bounce: true },
        ],
      },
    },
    {
      short: `Whiteout`,
      chapter: `insight`,
      title: `Deleting a file doesn’t free image space`,
      body: [
        `<code>rm /app/debug.log</code> can’t touch the read-only layer either. OverlayFS writes a <span class="term">whiteout</span> into <code>upperdir</code> — a character device 0/0 that hides the file in the merged view.`,
        `The bytes still sit in the image. The same happens at build time: <code>RUN rm</code> in a later layer never makes an image smaller.`,
      ],
      changes: [`+ whiteout debug.log`, `~ image still 182 MB`],
      metrics: { layers: 3, imageSize: `182 MB`, upperSize: `4 KB`, persisted: `—` },
      scene: {
        entities: {
          ...stack(),
          app: appLayer({ tags: [{ text: `debug.log 9 MB`, tone: `gray` }] }),
          upper: upper([
            { text: `config.json (copy)`, tone: `amber`, icon: `file` },
            { text: `whiteout debug.log`, tone: `red`, icon: `eyeOff` },
          ]),
          ctr: container(),
          card: card(`ls -l upperdir/app`, [`$ ls -l …/9f…/diff/app`, `-rw-r--r--  1 node  4096  config.json`, `! c---------  1 root  0, 0  debug.log`], `eyeOff`),
        },
        links: { parent1: links.parent1, parent2: links.parent2, lower: links.lowerQuiet, upperRw: links.upperRw },
        flows: [{ route: [`upperRw`], kind: `write`, rate: 0.8 }],
      },
    },
    {
      short: `docker rm`,
      chapter: `problem`,
      title: `Remove the container, lose its writes`,
      body: [
        `<code>docker rm</code> deletes the container and its <code>upperdir</code> with it. Every change the app made — uploads, a SQLite file, logs — is gone.`,
        `The image is fine: the next container starts from the same clean layers. The writable layer was never meant to hold data you care about.`,
      ],
      changes: [`− upperdir deleted`, `− container removed`],
      metrics: { layers: 3, imageSize: `182 MB`, upperSize: `—`, persisted: `0 B` },
      scene: {
        entities: {
          ...stack(),
          upper: upper([{ text: `deleted`, tone: `red`, icon: `skull` }], { dead: 1, heat: 0 }),
          ctr: container([{ text: `docker rm -f web`, tone: `red` }], { dead: 1, heat: 0 }),
        },
        links: { parent1: links.parent1, parent2: links.parent2, lower: links.lowerQuiet, upperRw: links.upperQuiet },
        flows: [{ route: [`upperRw`], kind: `fail`, rate: 0.8 }],
      },
    },
    {
      short: `Volumes`,
      chapter: `solution`,
      title: `Put data in a volume, outside the layers`,
      body: [
        `A <span class="term">volume</span> is a normal directory managed by Docker and mounted straight into the container, bypassing OverlayFS: no copy-up, native disk speed.`,
        `It outlives any container. Start a new one with the same <code>-v</code> and the data is already there.`,
      ],
      changes: [`+ volume pgdata`, `+ fresh container, empty upperdir`],
      metrics: { layers: 3, imageSize: `182 MB`, upperSize: `0 B`, persisted: `2.1 GB` },
      scene: {
        entities: {
          ...stack(),
          upper: upper(),
          ctr: container(),
          vol: volume([{ text: `survives rm`, tone: `green`, icon: `check` }]),
          card: card(`terminal`, [`$ docker volume create pgdata`, `$ docker run -d \\`, `    -v pgdata:/var/lib/data web:1.4`], `keyboard`),
        },
        links: { parent1: links.parent1, parent2: links.parent2, lower: links.lowerQuiet, upperRw: links.upperQuiet, bind: links.bind },
        flows: [
          { route: [`bind`], kind: `write`, rate: 2, bounce: true },
          { route: [`lower`], rate: 0.8, bounce: true },
        ],
      },
    },
    {
      short: `Multi-stage`,
      chapter: `technique`,
      title: `Ship only what runs`,
      body: [
        `Build tools, compilers and caches don’t belong in production layers. A <span class="term">multi-stage build</span> compiles in one stage and copies just the output onto a small runtime base.`,
        `Fewer, smaller layers mean faster pulls, faster node start-up and less to patch.`,
      ],
      changes: [`~ base debian:12 → distroless`, `~ image 182 MB → 61 MB`],
      metrics: { layers: 3, imageSize: `61 MB`, upperSize: `0 B`, persisted: `2.1 GB` },
      scene: {
        entities: {
          ...stack(),
          base: layer(-16, `distroless`, `base · 21 MB`, { tags: [{ text: `no shell, no apt`, tone: `green` }] }),
          runtime: layer(-4, `node runtime`, `+ 27 MB`),
          upper: upper(),
          ctr: container(),
          vol: volume(),
          card: card(
            `Dockerfile`,
            [`FROM node:20 AS build`, `RUN npm ci && npm run build`, `FROM gcr.io/distroless/nodejs20`, `= COPY --from=build /app/dist /app`],
            `file`,
          ),
        },
        links: { parent1: links.parent1, parent2: links.parent2, lower: links.lowerQuiet, upperRw: links.upperQuiet, bind: links.bind },
        flows: [{ route: [`parent1`, `parent2`], kind: `write`, rate: 0.8 }],
      },
    },
    {
      short: `Recap`,
      chapter: `recap`,
      title: `Read-only layers, one thin writable layer`,
      body: [
        `Image layers are immutable and shared. Each container gets one private <code>upperdir</code>; OverlayFS merges them, copying files up on first write and hiding deletions with whiteouts.`,
        `Anything that must survive the container goes in a volume.`,
      ],
      changes: [`= image ro · upperdir rw · volume persistent`],
      metrics: { layers: 3, imageSize: `61 MB`, upperSize: `4 KB`, persisted: `2.1 GB` },
      scene: {
        entities: {
          ...stack(),
          base: layer(-16, `distroless`, `base · 21 MB`),
          runtime: layer(-4, `node runtime`, `+ 27 MB`),
          upper: upper([{ text: `4 KB of changes`, tone: `amber` }]),
          ctr: container(),
          vol: volume([{ text: `2.1 GB`, tone: `green` }]),
        },
        links: { parent1: links.parent1, parent2: links.parent2, lower: links.lower, upperRw: links.upperRw, bind: links.bind },
        flows: [
          { route: [`lower`], rate: 1.2, bounce: true },
          { route: [`upperRw`], kind: `write`, rate: 0.6, bounce: true },
          { route: [`bind`], kind: `write`, rate: 1.6, bounce: true },
        ],
      },
    },
  ],
};
