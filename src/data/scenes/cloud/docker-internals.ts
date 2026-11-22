// @ts-nocheck
/* eslint-disable */
import { makeBlock, makeLink, makePanel } from '@/lib/simulator/scene-builders';

export const dockerInternalsLesson = {
  id: 'docker-internals',
  title: 'Linux Namespaces, Cgroups & Container Runtime',
  trackId: 'k8s',
  badge: 'Beginner',
  summary: 'Explore how Docker isolates processes using Linux Namespaces (PID, NET, MNT) and enforces hardware resource limits using Cgroups.',
  metrics: ['namespaces', 'cgroups', 'isolation', 'oom_killer'],
  goals: [
    { text: 'Host PID Tree & Namespaces', step: 1 },
    { text: 'PID 1 Container Isolation', step: 2 },
    { text: 'Mount & Network Namespaces', step: 3 },
    { text: 'Cgroups CPU & RAM Quotas', step: 4 },
    { text: 'OOM Killer & Limits Enforcement', step: 5 },
  ],
  steps: [
    {
      title: 'The Host Process Tree',
      short: 'Host PID Namespace',
      body: [
        'Containers are not virtual machines; they are ordinary Linux processes running directly on the host kernel.',
        'At the lowest level, all container processes exist in the host root PID tree, but are bounded by kernel security boundaries.',
      ],
      scene: {
        entities: {
          host: makeBlock(-2, -16, { s: 5, h: 46, color: 'slab', label: ['Linux Host', 'Kernel 6.x'] }),
          proc1: makeBlock(-10, -4, { s: 4, h: 42, color: 'blue', label: ['Systemd', 'PID 1'] }),
          proc2: makeBlock(6, -4, { s: 4, h: 42, color: 'orange', label: ['Containerd', 'PID 1420'] }),
          shim: makeBlock(6, 12, { s: 4, h: 42, color: 'green', label: ['Containerd-Shim', 'PID 2810'] }),
          card: makePanel({ x: -12, y: 10 }, 'Host Process Inspection', [
            '$ ps -ef | grep app',
            'root  1420  1 containerd',
            'root  2810  1420 containerd-shim',
            '1001  2845  2810 node /app/server.js',
          ]),
        },
        links: {
          host_proc1: makeLink('host', 'proc1', ['host', 'proc1'], { label: 'fork/exec' }),
          host_proc2: makeLink('host', 'proc2', ['host', 'proc2'], { label: 'daemon' }),
          proc2_shim: makeLink('proc2', 'shim', ['proc2', 'shim'], { label: 'spawns' }),
        },
      },
    },
    {
      title: 'PID Namespace Virtualization',
      short: 'Isolated PID 1',
      body: [
        'A PID namespace virtualizes process IDs. Inside the container, the application process believes it is PID 1, the ancestor of all tasks.',
        'Processes inside cannot see or signal host processes outside their namespace.',
      ],
      scene: {
        entities: {
          hostKernel: makeBlock(-2, -16, { s: 5, h: 46, color: 'slab', label: ['Kernel', 'PID Manager'] }),
          nsBoundary: makeBlock(-8, -2, { s: 4, h: 42, color: 'purple', label: ['PID Namespace', 'Isolate Scope'] }),
          containerApp: makeBlock(6, -2, { s: 4, h: 42, color: 'green', label: ['Node App', 'Inside: PID 1'] }),
          hostProc: makeBlock(6, 12, { s: 4, h: 42, color: 'orange', label: ['Host View', 'Outside: PID 2845'] }),
        },
        links: {
          hostKernel_nsBoundary: makeLink('hostKernel', 'nsBoundary', ['hostKernel', 'nsBoundary'], { label: 'CLONE_NEWPID' }),
          nsBoundary_containerApp: makeLink('nsBoundary', 'containerApp', ['nsBoundary', 'containerApp'], { label: 'presents PID 1' }),
          hostKernel_hostProc: makeLink('hostKernel', 'hostProc', ['hostKernel', 'hostProc'], { label: 'tracks PID 2845' }),
        },
      },
    },
    {
      title: 'Network & Mount Namespaces',
      short: 'NET & MNT Isolation',
      body: [
        'Network Namespace gives the container its own loopback interface, private IP, and routing table connected via virtual ethernet (veth pair).',
        'Mount Namespace provides an independent filesystem root using pivot_root, preventing access to host disks.',
      ],
      scene: {
        entities: {
          netns: makeBlock(-10, -14, { s: 4, h: 42, color: 'blue', label: ['NET Namespace', 'eth0 (172.17.0.2)'] }),
          mntns: makeBlock(6, -14, { s: 4, h: 42, color: 'orange', label: ['MNT Namespace', 'Chroot / pivot_root'] }),
          vethBridge: makeBlock(-10, 6, { s: 4, h: 42, color: 'purple', label: ['docker0', 'Bridge Device'] }),
          rootfs: makeBlock(6, 6, { s: 4, h: 42, color: 'store', label: ['Container RootFS', 'Image Layers'] }),
          card: makePanel({ x: -4, y: 14 }, 'Network & Mount Setup', [
            'ip link add veth_host type veth peer ...',
            'ip link set veth_cont netns <pid>',
            'pivot_root /new_root /new_root/old',
          ]),
        },
        links: {
          netns_vethBridge: makeLink('netns', 'vethBridge', ['netns', 'vethBridge'], { label: 'veth pair' }),
          mntns_rootfs: makeLink('mntns', 'rootfs', ['mntns', 'rootfs'], { label: 'pivot_root' }),
        },
      },
    },
    {
      title: 'Control Groups (Cgroups v2)',
      short: 'CPU & RAM Enforcers',
      body: [
        'Namespaces determine what a process can see. Cgroups (Control Groups) determine how much it can use.',
        'Cgroups monitor and throttle CPU cycles, limit memory usage, and trigger the OOM Killer if a process exceeds memory.max.',
      ],
      scene: {
        entities: {
          cgroupCore: makeBlock(-2, -16, { s: 5, h: 46, color: 'slab', label: ['Cgroup v2 Tree', '/sys/fs/cgroup'] }),
          cpuLimiter: makeBlock(-10, -2, { s: 4, h: 42, color: 'blue', label: ['cpu.max', '0.5 Cores Quota'] }),
          memLimiter: makeBlock(6, -2, { s: 4, h: 42, color: 'orange', label: ['memory.max', '512MB Hard Limit'] }),
          oomKiller: makeBlock(6, 12, { s: 4, h: 42, color: 'purple', label: ['OOM Killer', 'Kill on limit!'] }),
          card: makePanel({ x: -12, y: 10 }, 'Cgroup Quotas', [
            'echo 536870912 > memory.max',
            'echo "50000 100000" > cpu.max',
            'Kernel CFS scheduler throttles',
          ]),
        },
        links: {
          cgroupCore_cpuLimiter: makeLink('cgroupCore', 'cpuLimiter', ['cgroupCore', 'cpuLimiter'], { label: 'throttles CFS' }),
          cgroupCore_memLimiter: makeLink('cgroupCore', 'memLimiter', ['cgroupCore', 'memLimiter'], { label: 'tracks usage' }),
          memLimiter_oomKiller: makeLink('memLimiter', 'oomKiller', ['memLimiter', 'oomKiller'], { label: 'exceeds threshold' }),
        },
      },
    },
    {
      title: 'Container Runtime Architecture (runc)',
      short: 'OCI Spec & runc',
      body: [
        'runc is the lightweight CLI wrapper around Linux kernel primitives adhering to the Open Container Initiative (OCI).',
        'Once runc configures namespaces, mounts the rootfs, and hands execution over to the app, runc exits while containerd-shim remains.',
      ],
      scene: {
        entities: {
          dockerCli: makeBlock(-10, -16, { s: 4, h: 42, color: 'blue', label: ['Docker CLI', 'docker run'] }),
          containerd: makeBlock(6, -16, { s: 4, h: 42, color: 'orange', label: ['containerd', 'gRPC API'] }),
          runcTool: makeBlock(-10, 4, { s: 4, h: 42, color: 'purple', label: ['runc (OCI)', 'Kernel setup'] }),
          shimProcess: makeBlock(6, 4, { s: 4, h: 42, color: 'green', label: ['containerd-shim', 'IO & exit codes'] }),
          card: makePanel({ x: -2, y: 14 }, 'OCI Architecture', [
            'Docker CLI -> containerd gRPC',
            'containerd -> runc (creates ns/cgroup)',
            'runc exits -> containerd-shim holds I/O',
          ]),
        },
        links: {
          dockerCli_containerd: makeLink('dockerCli', 'containerd', ['dockerCli', 'containerd'], { label: 'POST /containers' }),
          containerd_runcTool: makeLink('containerd', 'runcTool', ['containerd', 'runcTool'], { label: 'config.json' }),
          containerd_shimProcess: makeLink('containerd', 'shimProcess', ['containerd', 'shimProcess'], { label: 'shim detach' }),
        },
      },
    },
    {
      title: 'The Complete Container Boundary',
      short: 'Full Isolation Stack',
      body: [
        'A running container is simply an isolated process governed by Namespaces, constrained by Cgroups, and secured by Seccomp syscall filtering.',
        'This synergy provides strong isolation without the virtualization overhead of guest kernels.',
      ],
      scene: {
        entities: {
          userApp: makeBlock(-2, -18, { s: 4.5, h: 44, color: 'green', label: ['Isolated App', 'User Code'] }),
          securityRing: makeBlock(-10, -4, { s: 4, h: 42, color: 'purple', label: ['Namespaces', 'Visibility Gate'] }),
          resourceRing: makeBlock(6, -4, { s: 4, h: 42, color: 'orange', label: ['Cgroups v2', 'Resource Limits'] }),
          syscallFilter: makeBlock(-2, 12, { s: 5, h: 46, color: 'slab', label: ['Linux Host Kernel', 'Seccomp & Syscalls'] }),
          card: makePanel({ x: -12, y: 14 }, 'Container Boundary', [
            'Namespaces: PID, NET, MNT, IPC',
            'Cgroups: cpu, memory limits',
            'Seccomp: block forbidden syscalls',
          ]),
        },
        links: {
          userApp_securityRing: makeLink('userApp', 'securityRing', ['userApp', 'securityRing'], { label: 'restricted view' }),
          userApp_resourceRing: makeLink('userApp', 'resourceRing', ['userApp', 'resourceRing'], { label: 'quota enforced' }),
          securityRing_syscallFilter: makeLink('securityRing', 'syscallFilter', ['securityRing', 'syscallFilter'], { label: 'safe syscalls' }),
          resourceRing_syscallFilter: makeLink('resourceRing', 'syscallFilter', ['resourceRing', 'syscallFilter'], { label: 'kernel accounting' }),
        },
      },
    },
  ],
};
