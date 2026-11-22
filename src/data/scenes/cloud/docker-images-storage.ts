// @ts-nocheck
/* eslint-disable */
import { makeBlock, makeDb, makeLink, makePanel } from '@/lib/simulator/scene-builders';

export const dockerImagesStorageLesson = {
  id: 'docker-images-storage',
  title: 'Docker Images, UnionFS & OverlayFS Storage',
  trackId: 'k8s',
  badge: 'Intermediate',
  summary: 'Understand immutable OCI image layers, Copy-on-Write (CoW) mechanics, and how Linux OverlayFS mounts lowerdir, upperdir, and merged views.',
  metrics: ['layers', 'storage_driver', 'cow_status', 'mount_type'],
  goals: [
    { text: 'Immutable Image Layer Stacks', step: 1 },
    { text: 'OverlayFS lowerdir & upperdir', step: 2 },
    { text: 'Copy-on-Write (CoW) Triggers', step: 3 },
    { text: 'Docker Volumes & Shared Storage', step: 4 },
  ],
  steps: [
    {
      title: 'Dockerfile to Layer Stack',
      short: 'Immutable Read-Only Layers',
      body: [
        'Every Dockerfile instruction produces an immutable read-only layer identified by a SHA-256 content hash.',
        'If instructions do not change, Docker reuses cached layers across multiple images, saving disk space and network bandwidth.',
      ],
      scene: {
        entities: {
          baseLayer: makeDb(-2, 14, { r: 2.2, h: 36, color: 'slab', label: 'Layer 1: Base Alpine (3MB)' }),
          nodeLayer: makeDb(-2, 4, { r: 2.2, h: 36, color: 'blue', label: 'Layer 2: Node Runtime (40MB)' }),
          appLayer: makeDb(-2, -6, { r: 2.2, h: 36, color: 'orange', label: 'Layer 3: App Code (5MB)' }),
          card: makePanel({ x: -12, y: 4 }, 'Dockerfile Layers', [
            'FROM alpine:3.19 (3MB)',
            'RUN apk add nodejs (40MB)',
            'COPY . . (5MB)',
            'Immutable SHA256 hashes',
          ]),
        },
        links: {
          nodeLayer_baseLayer: makeLink('nodeLayer', 'baseLayer', ['nodeLayer', 'baseLayer'], { label: 'parent sha' }),
          appLayer_nodeLayer: makeLink('appLayer', 'nodeLayer', ['appLayer', 'nodeLayer'], { label: 'parent sha' }),
        },
      },
    },
    {
      title: 'OverlayFS Architecture (lowerdir & upperdir)',
      short: 'OverlayFS Composition',
      body: [
        'OverlayFS combines multiple directories into a single unified virtual filesystem.',
        'All image layers form the read-only lowerdir, while the container instance gets a private writable upperdir.',
      ],
      scene: {
        entities: {
          mergedDir: makeBlock(-2, -16, { s: 5, h: 44, color: 'green', label: ['Merged View', '/var/lib/docker/merged'] }),
          upperDir: makeBlock(-10, -2, { s: 4, h: 42, color: 'orange', label: ['Upperdir (RW)', 'Container Changes'] }),
          lowerDirs: makeBlock(6, -2, { s: 4, h: 42, color: 'slab', label: ['Lowerdir (RO)', 'Shared Image Layers'] }),
          workDir: makeBlock(-10, 12, { s: 4.4, h: 48, color: 'purple', label: ['Workdir', 'Atomic Rename Buffer'] }),
          card: makePanel({ x: 4, y: 12 }, 'Mount Command', [
            'mount -t overlay overlay \\',
            '  -o lowerdir=layers,... \\',
            '     upperdir=diff,... \\',
            '  /merged',
          ]),
        },
        links: {
          mergedDir_upperDir: makeLink('mergedDir', 'upperDir', ['mergedDir', 'upperDir'], { label: 'reads latest' }),
          mergedDir_lowerDirs: makeLink('mergedDir', 'lowerDirs', ['mergedDir', 'lowerDirs'], { label: 'falls back to' }),
          upperDir_workDir: makeLink('upperDir', 'workDir', ['upperDir', 'workDir'], { label: 'prepares writes' }),
        },
      },
    },
    {
      title: 'Copy-on-Write (CoW) Mechanics',
      short: 'Write Modification',
      body: [
        'When modifying an existing file from an image layer, OverlayFS transparently copies the entire file up to upperdir before applying edits.',
        'This leaves the underlying image layer completely unmodified, ensuring all other containers sharing this image remain unaffected.',
      ],
      scene: {
        entities: {
          readRequest: makeBlock(-10, -16, { s: 4, h: 42, color: 'blue', label: ['Container App', 'open("/app/cfg", W)'] }),
          cowEngine: makeBlock(6, -16, { s: 4, h: 42, color: 'purple', label: ['OverlayFS Driver', 'Detects RO hit'] }),
          targetUpper: makeBlock(6, 2, { s: 4, h: 42, color: 'orange', label: ['Upperdir', 'New copy written'] }),
          sourceLower: makeBlock(-10, 2, { s: 4, h: 42, color: 'slab', label: ['Lowerdir', 'Original untouched'] }),
        },
        links: {
          readRequest_cowEngine: makeLink('readRequest', 'cowEngine', ['readRequest', 'cowEngine'], { label: 'write syscall' }),
          cowEngine_sourceLower: makeLink('cowEngine', 'sourceLower', ['cowEngine', 'sourceLower'], { label: '1. read original' }),
          cowEngine_targetUpper: makeLink('cowEngine', 'targetUpper', ['cowEngine', 'targetUpper'], { label: '2. copy-up & edit' }),
        },
      },
    },
    {
      title: 'File Deletion via Whiteout Device',
      short: 'Whiteout Character Devices',
      body: [
        'Since lower image layers are strictly read-only, deleting a file cannot actually delete it from the lower layer.',
        'OverlayFS writes a special whiteout character device (char 0/0) in upperdir, blinding merged directory scans to hide the file.',
      ],
      scene: {
        entities: {
          deleteCmd: makeBlock(-2, -16, { s: 4.5, h: 42, color: 'blue', label: ['rm old_file.txt', 'Container Shell'] }),
          whiteoutNode: makeBlock(-10, 0, { s: 4, h: 42, color: 'orange', label: ['Whiteout (0,0)', 'Upperdir marker'] }),
          hiddenLower: makeBlock(6, 0, { s: 4, h: 42, color: 'slab', label: ['Hidden in Lower', 'File still on disk!'] }),
          mergedScan: makeBlock(-2, 14, { s: 5, h: 44, color: 'green', label: ['Merged Directory', 'File disappears'] }),
          card: makePanel({ x: -12, y: 12 }, 'Whiteout Mechanics', [
            '$ rm old_file.txt',
            'mknod c 0 0 old_file.txt',
            'Merged directory hides file',
          ]),
        },
        links: {
          deleteCmd_whiteoutNode: makeLink('deleteCmd', 'whiteoutNode', ['deleteCmd', 'whiteoutNode'], { label: 'mknod(0,0)' }),
          whiteoutNode_mergedScan: makeLink('whiteoutNode', 'mergedScan', ['whiteoutNode', 'mergedScan'], { label: 'masks path' }),
          hiddenLower_mergedScan: makeLink('hiddenLower', 'mergedScan', ['hiddenLower', 'mergedScan'], { label: 'suppressed' }),
        },
      },
    },
    {
      title: 'Storage Optimization & Multi-Stage Builds',
      short: 'Multi-Stage Pruning',
      body: [
        'Multi-stage builds allow developers to separate heavy compilation toolchains (compilers, SDKs) from the runtime artifact.',
        'Only final binaries are copied into scratch or distroless images, preventing bloated lowerdir layers and reducing attack surfaces.',
      ],
      scene: {
        entities: {
          buildStage: makeBlock(-10, -14, { s: 4, h: 42, color: 'slab', label: ['Builder Stage', 'Go SDK (850MB)'] }),
          binaryArtifact: makeBlock(-10, 4, { s: 4.2, h: 46, color: 'orange', label: ['Compiled Binary', 'ELF Executable (15MB)'] }),
          distrolessBase: makeBlock(6, -14, { s: 4, h: 42, color: 'blue', label: ['Distroless Base', 'Root certs only (2MB)'] }),
          finalImage: makeBlock(6, 4, { s: 4.5, h: 44, color: 'green', label: ['Production Image', 'Total Size: 17MB'] }),
          card: makePanel({ x: -2, y: 14 }, 'Multi-Stage Dockerfile', [
            'FROM golang AS builder',
            'RUN go build -o server',
            'FROM distroless',
            'COPY --from=builder /server /',
          ]),
        },
        links: {
          buildStage_binaryArtifact: makeLink('buildStage', 'binaryArtifact', ['buildStage', 'binaryArtifact'], { label: 'go build' }),
          binaryArtifact_finalImage: makeLink('binaryArtifact', 'finalImage', ['binaryArtifact', 'finalImage'], { label: 'COPY --from' }),
          distrolessBase_finalImage: makeLink('distrolessBase', 'finalImage', ['distrolessBase', 'finalImage'], { label: 'FROM base' }),
        },
      },
    },
    {
      title: 'Container Storage Driver Summary',
      short: 'Driver Best Practices',
      body: [
        'OverlayFS is designed for application code execution, not database storage.',
        'Attaching Docker Volumes or K8s PersistentVolumeClaims bypasses CoW layers and yields raw bare-metal disk throughput.',
      ],
      scene: {
        entities: {
          containerProcess: makeBlock(-2, -16, { s: 4.5, h: 42, color: 'blue', label: ['Database Container', 'PostgreSQL 16'] }),
          overlayCow: makeBlock(-10, 0, { s: 4, h: 42, color: 'orange', label: ['OverlayFS Upper', 'Logs & ephemeral writes'] }),
          directVolume: makeBlock(6, 0, { s: 4, h: 42, color: 'green', label: ['Docker Volume', 'Direct mount /data'] }),
          hostStorage: makeDb(6, 14, { r: 2.2, h: 36, color: 'store', label: 'Host NVMe Volume' }),
          card: makePanel({ x: -12, y: 12 }, 'Storage Best Practices', [
            '1. Ephemeral: code in OverlayFS',
            '2. Persistent: database in Volume',
            '3. Volume bypasses CoW penalty',
          ]),
        },
        links: {
          containerProcess_overlayCow: makeLink('containerProcess', 'overlayCow', ['containerProcess', 'overlayCow'], { label: 'CoW overhead' }),
          containerProcess_directVolume: makeLink('containerProcess', 'directVolume', ['containerProcess', 'directVolume'], { label: 'raw I/O bypass' }),
          directVolume_hostStorage: makeLink('directVolume', 'hostStorage', ['directVolume', 'hostStorage'], { label: 'native filesystem' }),
        },
      },
    },
  ],
};
