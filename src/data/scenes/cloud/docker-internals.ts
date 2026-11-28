import { makeBlock, makeDevice, makeLink, makePanel, makeZone, cardAt } from '@/lib/simulator/scene-builders';

// One host for the whole lesson. A container is born (docker → containerd → runc),
// then the same app process gets wrapped step by step: namespaces decide what it can
// see, cgroups decide how much it can use. Nothing is replaced — only layered on.
//
//   docker CLI ── containerd              docker0
//                     │                      │
//                runc → shim ──────── app (in a namespace box)
//                              Linux kernel ─┘

type Tag = { text: string; tone?: string; icon?: string };
type Opts = Record<string, unknown>;

const APP = { x: 6.5, y: 5 };

const dev = () => makeDevice(-13, -10.5, { label: `docker CLI` });
const containerd = (o: Opts = {}) =>
  makeBlock(-10.5, 2.5, { s: 4.6, h: 52, color: `orange`, glyph: `boxes`, label: [`containerd`], sub: `daemon`, ...o });
const runc = (o: Opts = {}) =>
  makeBlock(2, -12, { s: 4.2, h: 50, color: `purple`, glyph: `hammer`, label: [`runc`], sub: `OCI runtime`, ...o });
const shim = (o: Opts = {}) =>
  makeBlock(2, -12, { s: 4.2, h: 50, color: `orange`, glyph: `route`, label: [`shim`], sub: `holds stdio`, ...o });
const app = (tags: Tag[] = [], o: Opts = {}) =>
  makeBlock(APP.x, APP.y, { s: 4.6, h: 54, color: `green`, glyph: `cpu`, label: [`node app`], sub: `server.js`, tags, ...o });
const kernel = (o: Opts = {}) =>
  makeBlock(15, -12, { s: 5.4, h: 46, color: `slab`, glyph: `layers`, label: [`Linux kernel`], sub: `shared by all`, ...o });
const bridge = () => makeBlock(9.5, 18, { s: 4.2, h: 48, color: `blue`, glyph: `network`, label: [`docker0`], sub: `bridge` });
// Roomy enough that the floor label runs clear of the app block (label starts at y0 + 0.55).
const box = () => makeZone({ x0: 2.5, x1: 10.5, y0: -1, y1: 10 }, `NAMESPACES`);

const links = {
  run: makeLink(`dev`, `containerd`, [`dev`, `containerd`], { heads: `both`, label: `run` }),
  runIdle: makeLink(`dev`, `containerd`, [`dev`, `containerd`], { heads: `both`, style: `off` }),
  // short vertical hop — the config.json card names what travels here
  spec: makeLink(`containerd`, `runc`, [`containerd`, `runc`]),
  clone: makeLink(`runc`, `app`, [`runc`, `app`], { label: `clone()` }),
  supervise: makeLink(`containerd`, `shim`, [`containerd`, `shim`], { heads: `both` }),
  stdio: makeLink(`shim`, `app`, [`shim`, `app`], { heads: `both`, label: `stdio` }),
  stdioQuiet: makeLink(`shim`, `app`, [`shim`, `app`], { heads: `both` }),
  syscalls: makeLink(`app`, `kernel`, [`app`, `kernel`], { heads: `both`, label: `syscalls` }),
  syscallsQuiet: makeLink(`app`, `kernel`, [`app`, `kernel`], { heads: `both` }),
  veth: makeLink(`app`, `bridge`, [`app`, `bridge`], { heads: `both`, label: `veth pair` }),
};

const card = cardAt({ x: -10.5, y: 2.5, dx: 70, dy: -250 });

/** The parts that stay on stage once the container is running. */
const running = (appTags: Tag[], extra: Opts = {}) => ({
  dev: dev(),
  containerd: containerd(),
  shim: shim(),
  app: app(appTags),
  kernel: kernel(),
  ...extra,
});

export const dockerInternalsLesson = {
  id: `docker-internals`,
  title: `Linux Namespaces, Cgroups & Container Runtime`,
  trackId: `k8s`,
  summary: `Start one container and watch what it really is: a normal Linux process that namespaces hide and cgroups limit.`,
  minutes: 12,
  level: `beginner`,
  metrics: [`hostPid`, `containerPid`, `memory`, `cpu`],
  legend: [`req`, `res`, [`write`, `syscall`], [`fail`, `killed`]],
  goals: [
    { text: `A container is a host process`, step: 3 },
    { text: `PID namespace: its own PID 1`, step: 4 },
    { text: `Network and mount namespaces`, step: 5 },
    { text: `Cgroups limit CPU and memory`, step: 6 },
    { text: `What the OOM killer does`, step: 7 },
  ],
  steps: [
    {
      short: `docker run`,
      chapter: `setup`,
      title: `You ask for a container`,
      body: [
        `<code>docker run</code> doesn’t start anything itself. The CLI sends the request to <span class="term">containerd</span>, the daemon that manages images and containers on this machine.`,
        `Underneath everything sits one <span class="term">Linux kernel</span> — the same kernel every container on this host will share. There is no guest OS.`,
      ],
      metrics: { hostPid: `—`, containerPid: `—`, memory: `—`, cpu: `—` },
      scene: {
        entities: {
          dev: dev(),
          containerd: containerd(),
          kernel: kernel(),
          card: card(`terminal`, [`$ docker run -d --name web \\`, `    --memory 512m --cpus 0.5 \\`, `    -p 8080:3000 web:1.4`], `keyboard`),
        },
        links: { run: links.run },
        flows: [{ route: [`run`], rate: 1.2, bounce: true }],
      },
    },
    {
      short: `runc`,
      chapter: `technique`,
      title: `runc builds the box, then leaves`,
      body: [
        `containerd writes an OCI <code>config.json</code> — which namespaces, which limits, which root filesystem — and hands it to <span class="term">runc</span>.`,
        `runc asks the kernel for new namespaces with <code>clone()</code>, applies the limits, starts the app’s first process inside, and exits. Its whole job takes milliseconds.`,
      ],
      changes: [`+ runc`, `+ app process`],
      metrics: { hostPid: 2845, containerPid: `—`, memory: `—`, cpu: `—` },
      scene: {
        entities: {
          dev: dev(),
          containerd: containerd(),
          runc: runc({ tags: [{ text: `exits after start`, tone: `amber`, icon: `clock` }] }),
          app: app(),
          kernel: kernel(),
          card: card(
            `config.json (excerpt)`,
            [`"namespaces": [ "pid", "net", "mnt", "uts", "ipc" ],`, `"memory": { "limit": 536870912 },`, `"cpu":    { "quota": 50000, "period": 100000 },`, `"root":   { "path": "rootfs" }`],
            `braces`,
          ),
        },
        links: { run: links.runIdle, spec: links.spec, clone: links.clone },
        flows: [
          { route: [`spec`], rate: 1, kind: `write` },
          { route: [`clone`], rate: 1 },
        ],
      },
    },
    {
      short: `Just a process`,
      chapter: `insight`,
      title: `The container is just a process`,
      body: [
        `runc is gone. A tiny <span class="term">shim</span> stays behind as the app’s parent: it keeps stdout/stderr open and reports the exit code, so containerd can restart without killing containers.`,
        `From the host, <code>ps</code> shows the app like any other program — PID 2845, running on the same kernel, making normal <span class="term">syscalls</span>. A container is not a VM.`,
      ],
      changes: [`− runc exited`, `+ shim`, `~ app talks straight to the kernel`],
      metrics: { hostPid: 2845, containerPid: `—`, memory: `—`, cpu: `—` },
      scene: {
        entities: running([], {
          card: card(
            `host`,
            [`$ ps -ef --forest`, `root  1420     1  containerd`, `root  2810     1  containerd-shim -id web`, `= 1001  2845  2810   \\_ node server.js`],
            `scan`,
          ),
        }),
        links: { run: links.runIdle, supervise: links.supervise, stdio: links.stdio, syscalls: links.syscalls },
        flows: [
          { route: [`syscalls`], kind: `write`, rate: 1.6, bounce: true },
          { route: [`stdio`], rate: 0.6, bounce: true },
        ],
      },
    },
    {
      short: `PID ns`,
      chapter: `technique`,
      title: `Inside, it thinks it is PID 1`,
      body: [
        `The app was started in a new <span class="term">PID namespace</span>. Inside, process numbering starts again: the app is PID 1 and sees no other processes on the host.`,
        `Same process, two names: 2845 to the host, 1 to itself. It can’t see — or signal — anything outside its box.`,
      ],
      changes: [`+ namespace box`, `~ app sees PID 1`],
      metrics: { hostPid: 2845, containerPid: 1, memory: `—`, cpu: `—` },
      scene: {
        entities: running([{ text: `PID 1 inside`, tone: `violet` }], {
          box: box(),
          card: card(`inside vs outside`, [`$ docker exec web ps`, `PID  CMD`, `= 1    node server.js`, `# host ps: same process is 2845`], `eye`),
        }),
        links: { run: links.runIdle, supervise: links.supervise, stdio: links.stdioQuiet, syscalls: links.syscallsQuiet },
        flows: [{ route: [`syscalls`], kind: `write`, rate: 1.4, bounce: true }],
      },
    },
    {
      short: `NET & MNT`,
      chapter: `technique`,
      title: `Its own network and its own filesystem`,
      body: [
        `A <span class="term">network namespace</span> gives it a private <code>eth0</code>. One end of a <span class="term">veth pair</span> sits inside, the other plugs into the <code>docker0</code> bridge on the host — that is how <code>-p 8080:3000</code> reaches it.`,
        `A <span class="term">mount namespace</span> plus <code>pivot_root</code> makes the image’s files its <code>/</code>. Host disks simply aren’t in its view.`,
      ],
      changes: [`+ docker0 bridge`, `~ app gets eth0 and its own /`],
      metrics: { hostPid: 2845, containerPid: 1, memory: `—`, cpu: `—` },
      scene: {
        entities: running(
          [
            { text: `eth0 172.17.0.2`, tone: `violet` },
            { text: `/ = image`, tone: `violet` },
          ],
          {
            box: box(),
            bridge: bridge(),
            card: card(`inside the container`, [`$ ip -brief addr`, `lo     127.0.0.1/8`, `= eth0   172.17.0.2/16`, `$ ls /   # image files only`], `network`),
          },
        ),
        links: { run: links.runIdle, supervise: links.supervise, stdio: links.stdioQuiet, syscalls: links.syscallsQuiet, veth: links.veth },
        flows: [
          { route: [`veth`], rate: 2, bounce: true },
          { route: [`syscalls`], kind: `write`, rate: 1, bounce: true },
        ],
      },
    },
    {
      short: `cgroups`,
      chapter: `solution`,
      title: `Cgroups decide how much it may use`,
      body: [
        `Namespaces control what a process can <b>see</b>. <span class="term">Cgroups</span> control how much it can <b>use</b>. Docker put the app in its own cgroup with the limits from <code>docker run</code>.`,
        `The kernel enforces them on every scheduling tick: CPU above 0.5 core gets throttled, memory above 512 MB is not allowed.`,
      ],
      changes: [`~ cpu.max 0.5 core`, `~ memory.max 512 MB`],
      metrics: { hostPid: 2845, containerPid: 1, memory: `180 / 512 MB`, cpu: `0.42 / 0.5` },
      scene: {
        entities: running(
          [
            { text: `cpu 0.42 / 0.5`, tone: `green`, icon: `gauge` },
            { text: `mem 180 / 512 MB`, tone: `green`, icon: `gauge` },
          ],
          {
            box: box(),
            bridge: bridge(),
            card: card(
              `/sys/fs/cgroup/…/web`,
              [`$ cat cpu.max`, `50000 100000      # 0.5 core`, `$ cat memory.max`, `536870912         # 512 MB`],
              `gauge`,
            ),
          },
        ),
        links: { run: links.runIdle, supervise: links.supervise, stdio: links.stdioQuiet, syscalls: links.syscallsQuiet, veth: links.veth },
        flows: [
          { route: [`veth`], rate: 3, bounce: true },
          { route: [`syscalls`], kind: `write`, rate: 1.6, bounce: true },
        ],
      },
    },
    {
      short: `OOM kill`,
      chapter: `problem`,
      title: `It hits the memory limit`,
      body: [
        `A leak pushes the app to 512 MB. Memory can’t be throttled like CPU, so the kernel’s <span class="term">OOM killer</span> ends the process with SIGKILL.`,
        `The shim reports exit code <b>137</b> (128 + 9) to containerd. Docker marks the container <code>OOMKilled</code> — and the rest of the host never noticed.`,
      ],
      changes: [`− app killed (137)`, `~ host unaffected`],
      metrics: { hostPid: `—`, containerPid: `—`, memory: `512 / 512 MB`, cpu: `0 / 0.5` },
      scene: {
        entities: running([{ text: `OOMKilled · 137`, tone: `red`, icon: `skull` }], {
          app: app([{ text: `OOMKilled · 137`, tone: `red`, icon: `skull` }], { dead: 1, heat: 0 }),
          box: box(),
          bridge: bridge(),
          card: card(`dmesg`, [`! Memory cgroup out of memory:`, `! Killed process 2845 (node)`, `  total-vm:1.1GB, anon-rss:524288kB`], `alertTriangle`),
        }),
        links: { run: links.runIdle, supervise: links.supervise, stdio: links.stdioQuiet, syscalls: links.syscallsQuiet, veth: links.veth },
        flows: [{ route: [`supervise`], kind: `fail`, rate: 0.8 }],
      },
    },
    {
      short: `Recap`,
      chapter: `recap`,
      title: `Process + namespaces + cgroups`,
      body: [
        `With <code>--restart unless-stopped</code>, containerd starts a fresh process in the same box. Everything you saw is plain kernel features: a process, namespaces for what it sees, cgroups for what it uses.`,
        `That is why containers start in milliseconds and share one kernel — and why a kernel bug is everyone’s problem.`,
      ],
      changes: [`+ app restarted (new PID 3120)`],
      metrics: { hostPid: 3120, containerPid: 1, memory: `95 / 512 MB`, cpu: `0.2 / 0.5` },
      scene: {
        entities: running(
          [
            { text: `PID 1 · eth0 · /`, tone: `violet` },
            { text: `cpu · mem limited`, tone: `green`, icon: `gauge` },
          ],
          {
            box: box(),
            bridge: bridge(),
            card: card(`docker stats`, [`$ docker stats --no-stream web`, `NAME  CPU %   MEM USAGE / LIMIT`, `= web   20%     95MiB / 512MiB`], `activity`),
          },
        ),
        links: { run: links.runIdle, supervise: links.supervise, stdio: links.stdioQuiet, syscalls: links.syscallsQuiet, veth: links.veth },
        flows: [
          { route: [`veth`], rate: 2, bounce: true },
          { route: [`syscalls`], kind: `write`, rate: 1.2, bounce: true },
        ],
      },
    },
  ],
};
