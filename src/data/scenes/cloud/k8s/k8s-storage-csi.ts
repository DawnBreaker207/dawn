import { STAGE, codeCard, linkOf, makeDb, stageBlock, type Tag } from '@/lib/simulator/scene-builders';
import type { Lesson } from '@/lib/simulator/types';

// Seed → result. A database Pod needs a disk that outlives it. Every concept is its own node
// with its own id; each step adds at most two, and the last step is the finished picture.
//
//   step 1  pod ── layer (container layer, wiped)                       seed
//   step 2  pod ── pvc ── pv          (layer retires)                   + PVC, + PV
//   step 3  + sc, which provisions the PV on demand                     + StorageClass
//   step 4  + csi: controller attaches, node plugin mounts              + CSI driver
//   step 5  + sts: stable name, one PVC per Pod                         + StatefulSet
//   step 6  PVC 10Gi → 20Gi, grown online                               mutation
//
//   sts (left-top)        sc (top)          csi (top-right)
//   pod ─────────────────  pvc / layer ──── pv (right)

const pod = (tags: Tag[] = []) =>
  stageBlock(STAGE.caller, { color: `blue`, glyph: `container`, label: [`db-0`], sub: `app container`, tags });
const layer = (tags: Tag[] = []) =>
  stageBlock(STAGE.main, { color: `slab`, glyph: `layers`, label: [`container`, `layer`], sub: `writable layer`, tags });
const pvc = (sub: string, tags: Tag[] = []) =>
  stageBlock(STAGE.main, { color: `green`, glyph: `file`, label: [`PVC`], sub, tags });
const persistentVolume = (label: string, tags: Tag[] = []) =>
  makeDb(STAGE.store.x, STAGE.store.y, { r: 2.2, h: 46, glyph: `database`, label, tags });
const storageClass = (tags: Tag[] = []) =>
  stageBlock(STAGE.helper, { color: `orange`, glyph: `settings`, label: [`Storage`, `Class`], sub: `fast-ssd`, tags });
const csi = (tags: Tag[] = []) =>
  stageBlock(STAGE.alt, { color: `orange`, glyph: `cloud`, label: [`CSI`, `driver`], sub: `ebs.csi.aws`, tags });
const sts = (tags: Tag[] = []) =>
  stageBlock(STAGE.caller2, { color: `blue`, glyph: `listChecks`, label: [`Stateful`, `Set`], sub: `ordinal Pods`, tags });

const links = {
  write: linkOf(`pod`, `layer`, `writes`, false),
  mount: (label?: string) => linkOf(`pod`, `pvc`, label),
  bind: (label?: string) => linkOf(`pvc`, `pv`, label),
  provision: (label?: string) => ({ ...linkOf(`sc`, `pvc`, label, false), labelAt: 0.6 }),
  driver: (label?: string) => ({ ...linkOf(`sc`, `csi`, label, false), labelAt: 0.6 }),
  attach: (label?: string) => ({ ...linkOf(`csi`, `pv`, label, false), labelAt: 0.6 }),
  own: (label?: string) => ({ ...linkOf(`sts`, `pod`, label, false), labelAt: 0.6 }),
};

export const k8sStorageCsiLesson: Lesson = {
  id: 'k8s-storage-csi',
  title: 'Persistent Storage: PV, PVC, StorageClass & CSI Driver',
  summary:
    'Start with a Pod whose disk vanishes, then add a claim, a volume, a StorageClass, a CSI driver and a StatefulSet — ending with durable storage that keeps its identity and grows online.',
  minutes: 14,
  level: 'advanced',
  metrics: ['claim', 'binding', 'state', 'size'],
  legend: [[`req`, `I/O`], [`write`, `provision / attach`], [`fail`, `data lost`]],
  goals: [
    { text: 'See why container storage is ephemeral', step: 1 },
    { text: 'Separate the claim (PVC) from the volume (PV)', step: 2 },
    { text: 'Provision disks on demand with a StorageClass', step: 3 },
    { text: 'Follow the CSI provision, attach and mount pipeline', step: 4 },
    { text: 'Keep stable identity with a StatefulSet', step: 5 },
    { text: 'Grow a volume online', step: 6 },
  ],
  steps: [
    {
      short: 'Ephemeral',
      chapter: 'problem',
      title: 'Seed: a container’s disk dies with it',
      body: [
        `A container’s filesystem is a writable layer on top of its image. When the container crashes or the Pod is rescheduled to another node, that layer is thrown away — and so is any data written there.`,
        `<code>emptyDir</code> volumes live as long as the Pod, but still vanish with it. A database needs storage whose lifetime is <em>independent</em> of any one Pod. We will build that, one piece per step.`,
      ],
      metrics: { claim: 'none', binding: 'n/a', state: 'ephemeral', size: 'node disk' },
      scene: {
        entities: {
          pod: pod([{ text: `crashed`, tone: `red`, icon: `alert` }]),
          layer: layer([{ text: `wiped on restart`, tone: `red` }]),
          card: codeCard(`Data gone`, [`$ kubectl exec db-0 -- sh -c 'echo 42 > /data/x'`, `$ kubectl delete pod db-0`, `$ kubectl exec db-0 -- cat /data/x`, `! No such file or directory`]),
        },
        links: { write: links.write },
        flows: [{ route: ['write'], kind: 'fail', rate: 1 }],
      },
    },
    {
      short: 'PVC · PV',
      chapter: 'technique',
      title: 'Claim a volume; don’t care which',
      body: [
        `Kubernetes splits storage into two objects. A <span class="term">PersistentVolume</span> (PV) is a piece of real storage — an EBS disk, an NFS share. A <span class="term">PersistentVolumeClaim</span> (PVC) is a Pod’s <em>request</em>: “10 GiB, ReadWriteOnce”.`,
        `The control plane <b>binds</b> a matching PV to the claim, and the Pod mounts the claim by name. The developer never names the disk; the admin never reads the app’s YAML. The container layer is no longer where data lives.`,
      ],
      changes: [`+ PVC`, `+ PV (bound)`, `- container layer`],
      metrics: { claim: '10Gi RWO', binding: 'Bound', state: 'durable', size: '10 GiB' },
      scene: {
        entities: {
          pod: pod([{ text: `mounts data`, tone: `green` }]),
          pvc: pvc(`data · 10Gi`, [{ text: `Bound`, tone: `green` }]),
          pv: persistentVolume(`PV · EBS disk`, [{ text: `pv-0a1f · 10 GiB`, tone: `gray` }]),
          card: codeCard(`The request`, [`kind: PersistentVolumeClaim`, `spec: { accessModes: [ReadWriteOnce], resources: { requests: { storage: 10Gi } } }`, `$ kubectl get pvc data`, `STATUS: Bound   VOLUME: pv-0a1f`]),
        },
        links: { mount: links.mount(`mounts`), bind: links.bind(`bound`) },
        flows: [{ route: ['mount', 'bind'], rate: 1.2, bounce: true }],
      },
    },
    {
      short: 'StorageClass',
      chapter: 'solution',
      title: 'StorageClass: disks on demand',
      body: [
        `Pre-creating a PV for every claim doesn’t scale. A <span class="term">StorageClass</span> names a provisioner and its settings (type gp3, IOPS, encryption). When a PVC asks for that class, the disk is <b>created automatically</b>.`,
        `<code>volumeBindingMode: WaitForFirstConsumer</code> delays creation until the Pod is scheduled, so the disk lands in the same availability zone as the node.`,
      ],
      changes: [`+ StorageClass`, `~ PV created on demand`],
      metrics: { claim: '10Gi gp3', binding: 'dynamic', state: 'provisioned', size: '10 GiB' },
      scene: {
        entities: {
          pod: pod(),
          pvc: pvc(`class: fast-ssd`, [{ text: `Pending → Bound`, tone: `amber` }]),
          pv: persistentVolume(`PV · EBS disk`, [{ text: `created now`, tone: `green`, icon: `zap` }]),
          sc: storageClass([{ text: `gp3 · encrypted`, tone: `violet` }]),
          card: codeCard(`The class`, [`kind: StorageClass`, `provisioner: ebs.csi.aws.com`, `parameters: { type: gp3, encrypted: "true" }`, `volumeBindingMode: WaitForFirstConsumer`]),
        },
        links: { mount: links.mount(`claims`), bind: links.bind(`creates`), provision: links.provision(`provisions`) },
        flows: [{ route: ['provision'], kind: 'write', rate: 1 }, { route: ['bind'], kind: 'write', rate: 1 }],
      },
    },
    {
      short: 'CSI',
      chapter: 'technique',
      title: 'CSI: provision, attach, mount',
      body: [
        `The <span class="term">Container Storage Interface</span> is the plug between Kubernetes and any storage system. The class’s provisioner is a CSI driver: its controller side <b>provisions</b> and <b>attaches</b> the disk to the node (a cloud API call), and its node side <b>formats and mounts</b> it into the Pod.`,
        `Because the driver lives outside Kubernetes’ own code, new storage systems ship without waiting for a Kubernetes release.`,
      ],
      changes: [`+ CSI driver`, `~ PV attached to node`, `~ PVC mounted at /data`],
      metrics: { claim: '10Gi', binding: 'attached', state: 'mounted', size: '10 GiB' },
      scene: {
        entities: {
          pod: pod([{ text: `/data mounted`, tone: `green` }]),
          pvc: pvc(`data · 10Gi`, [{ text: `ext4`, tone: `violet` }]),
          pv: persistentVolume(`PV · EBS disk`, [{ text: `attached /dev/xvdf`, tone: `green` }]),
          sc: storageClass([{ text: `gp3 · encrypted`, tone: `violet` }]),
          csi: csi([{ text: `AttachVolume`, tone: `violet` }]),
          card: codeCard(`Events on the Pod`, [`$ kubectl describe pod db-0 | tail -4`, `Normal  SuccessfulAttachVolume  AttachVolume.Attach succeeded`, `Normal  Pulled  Container image already present`, `= attach (controller) → mount (node)`]),
        },
        links: { mount: links.mount(`mount`), bind: links.bind(`bound`), provision: links.provision(), driver: links.driver(`provisioner`), attach: links.attach() },
        flows: [{ route: ['driver'], kind: 'write', rate: 1 }, { route: ['attach'], kind: 'write', rate: 1 }, { route: ['mount'], rate: 1.2, bounce: true }],
      },
    },
    {
      short: 'StatefulSet',
      chapter: 'technique',
      title: 'StatefulSet: a Pod keeps its name and disk',
      body: [
        `A Deployment treats Pods as interchangeable. A <span class="term">StatefulSet</span> gives each Pod a stable ordinal name (<code>db-0</code>, <code>db-1</code>), a stable DNS name and its <b>own PVC</b> created from <code>volumeClaimTemplates</code>.`,
        `If <code>db-0</code> is rescheduled it comes back with the same name and re-attaches the same disk, <code>data-db-0</code>. Pods start in order and stop in reverse.`,
      ],
      changes: [`+ StatefulSet`, `~ PVC: data-db-0`],
      metrics: { claim: 'data-db-0/1', binding: 'per Pod', state: 'stable id', size: '2 × 10 GiB' },
      scene: {
        entities: {
          pod: pod([{ text: `stable name`, tone: `green` }]),
          pvc: pvc(`data-db-0`, [{ text: `follows db-0`, tone: `green` }]),
          pv: persistentVolume(`PV · EBS disk`, [{ text: `attached /dev/xvdf`, tone: `green` }]),
          sc: storageClass([{ text: `gp3 · encrypted`, tone: `violet` }]),
          csi: csi([{ text: `AttachVolume`, tone: `violet` }]),
          sts: sts([{ text: `db-0 · db-1`, tone: `violet` }]),
          card: codeCard(`One claim per Pod`, [`kind: StatefulSet`, `spec: { serviceName: db, replicas: 2,`, `  volumeClaimTemplates: [{ metadata: { name: data }, spec: { resources: { requests: { storage: 10Gi } } } }] }`]),
        },
        links: { mount: links.mount(`data-db-0`), bind: links.bind(`same disk`), provision: links.provision(), driver: links.driver(), attach: links.attach(), own: links.own() },
        flows: [{ route: ['mount', 'bind'], rate: 1.2, bounce: true }, { route: ['own'], kind: 'write', rate: 1 }],
      },
    },
    {
      short: 'Expand',
      chapter: 'recap',
      title: 'Result: durable, named and growable',
      body: [
        `Running out of space? With <code>allowVolumeExpansion: true</code> on the class, edit the PVC’s request from 10Gi to 20Gi. The CSI controller grows the cloud disk, then the node plugin grows the filesystem — usually while the Pod keeps running.`,
        `You can only expand, never shrink. For anything important, keep snapshots (<code>VolumeSnapshot</code>) before resizing. Claim, volume, class, driver and StatefulSet now work as one storage pipeline.`,
      ],
      changes: [`~ PVC 10Gi → 20Gi`, `~ PV 10 → 20 GiB`, `~ csi: resizer`],
      metrics: { claim: '20Gi', binding: 'Bound', state: 'expanding', size: '10 → 20 GiB' },
      scene: {
        entities: {
          pod: pod([{ text: `still running`, tone: `green` }]),
          pvc: pvc(`data-db-0`, [{ text: `10Gi → 20Gi`, tone: `amber`, icon: `gauge` }]),
          pv: persistentVolume(`PV · EBS disk`, [{ text: `20 GiB`, tone: `green` }]),
          sc: storageClass([{ text: `expansion: true`, tone: `violet` }]),
          csi: csi([{ text: `resizer: online`, tone: `violet` }]),
          sts: sts([{ text: `db-0 · db-1`, tone: `violet` }]),
          card: codeCard(`Resize`, [`$ kubectl patch pvc data -p '{"spec":{"resources":{"requests":{"storage":"20Gi"}}}}'`, `$ kubectl get pvc data -w`, `CAPACITY: 10Gi → 20Gi   (FileSystemResizePending → ok)`]),
        },
        links: { mount: links.mount(`I/O`), bind: links.bind(`resize`), provision: links.provision(), driver: links.driver(), attach: links.attach(), own: links.own() },
        flows: [{ route: ['attach'], kind: 'write', rate: 1 }, { route: ['mount'], rate: 1.2, bounce: true }],
      },
    },
  ],
};
