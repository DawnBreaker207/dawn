// @ts-nocheck
/* eslint-disable */
import { makeBlock, makeDb, makeLink, makePanel } from '@/lib/simulator/scene-builders';

export const k8sStorageCsiLesson = {
  id: 'k8s-storage-csi',
  title: 'Persistent Storage: PV, PVC, StorageClass & CSI Driver',
  trackId: 'k8s',
  badge: 'Advanced',
  summary: 'Master Kubernetes persistent storage: PersistentVolumeClaims (PVC), declarative StorageClasses, Container Storage Interface (CSI) RPC workflow (Provision, Attach, Mount), and volume expansion.',
  metrics: ['pv_status', 'access_mode', 'csi_driver', 'capacity'],
  goals: [
    { text: 'Ephemeral Container Disk Pitfalls', step: 1 },
    { text: 'Decoupled PV & PVC Contracts', step: 2 },
    { text: 'Dynamic StorageClass Provisioning', step: 3 },
    { text: 'CSI Attach & Mount Pipeline', step: 4 },
    { text: 'Online Volume Expansion Flow', step: 5 },
  ],
  steps: [
    {
      title: 'The Storage Problem: Ephemeral Pods',
      short: 'State Loss on Crash',
      body: [
        'Pods in Kubernetes are ephemeral and disposable. When a Pod restarts or is rescheduled to a new node, its local container writable layer is wiped clean.',
        'Stateful workloads (PostgreSQL, Kafka, Elasticsearch) require durable storage that survives Pod restarts and node terminations.',
      ],
      scene: {
        entities: {
          crashingPod: makeBlock(-10, -14, { s: 4.2, h: 42, color: 'purple', label: ['Ephemeral Pod', 'Dies & Reboots'] }),
          wipedDisk: makeBlock(6, -14, { s: 4, h: 42, color: 'slab', label: ['Upperdir Layer', 'Data Cleared!'] }),
          lostState: makeDb(-2, 4, { r: 2, h: 32, color: 'slab', label: 'Missing DB State' }),
        },
        links: {
          crashingPod_wipedDisk: makeLink('crashingPod', 'wipedDisk', ['crashingPod', 'wipedDisk'], { label: 'process killed' }),
          wipedDisk_lostState: makeLink('wipedDisk', 'lostState', ['wipedDisk', 'lostState'], { label: 'lost on crash' }),
        },
      },
    },
    {
      title: 'Decoupled Contract: PV and PVC',
      short: 'Claim vs Volume',
      body: [
        'Kubernetes decouples storage demand from physical implementation:',
        'The application developer writes a `PersistentVolumeClaim` (PVC) requesting 100Gi, while the cluster binds it to an available `PersistentVolume` (PV) without the developer needing to know the underlying cloud disk details.',
      ],
      scene: {
        entities: {
          devPvc: makeBlock(-10, -14, { s: 4.2, h: 42, color: 'blue', label: ['PVC Request', '100Gi RWO'] }),
          pvcController: makeBlock(-2, -2, { s: 4.8, h: 44, color: 'purple', label: ['PV/PVC Binder', 'Status: Bound'] }),
          physicalPv: makeDb(6, 12, { r: 2.2, h: 36, color: 'store', label: 'PersistentVolume (PV)' }),
          card: makePanel({ x: -12, y: 12 }, 'PV/PVC Contract', [
            'PVC: Developer request',
            'PV: Actual storage resource',
            'Binder: 1-to-1 match',
          ]),
        },
        links: {
          devPvc_pvcController: makeLink('devPvc', 'pvcController', ['devPvc', 'pvcController'], { label: 'finds matching PV' }),
          pvcController_physicalPv: makeLink('pvcController', 'physicalPv', ['pvcController', 'physicalPv'], { label: 'binds 1-to-1' }),
        },
      },
    },
    {
      title: 'Dynamic Provisioning with StorageClass',
      short: 'On-Demand Disk Creation',
      body: [
        'Manual static PV creation does not scale. A `StorageClass` defines a blueprint for dynamic provisioning.',
        'When a PVC references `storageClassName: fast-ssd`, Kubernetes automatically invokes the CSI driver to create a real EBS volume or GCP Persistent Disk on the fly.',
      ],
      scene: {
        entities: {
          appPvc: makeBlock(-10, -16, { s: 4, h: 42, color: 'blue', label: ['App PVC', 'storageClass: fast-ssd'] }),
          storageClass: makeBlock(6, -16, { s: 4.5, h: 44, color: 'orange', label: ['StorageClass', 'Provisioner: AWS EBS'] }),
          csiProvisioner: makeBlock(-2, 2, { s: 4.8, h: 44, color: 'purple', label: ['CSI Provisioner', 'Calls Cloud API'] }),
          createdDisk: makeDb(-2, 16, { r: 2.2, h: 36, color: 'green', label: 'Cloud Disk (vol-0123)' }),
          card: makePanel({ x: -12, y: 12 }, 'Dynamic Provisioning', [
            'StorageClass: fast-ssd',
            'provisioner: ebs.csi.aws.com',
            'Disk created on-demand',
          ]),
        },
        links: {
          appPvc_storageClass: makeLink('appPvc', 'storageClass', ['appPvc', 'storageClass'], { label: 'claims class' }),
          storageClass_csiProvisioner: makeLink('storageClass', 'csiProvisioner', ['storageClass', 'csiProvisioner'], { label: 'triggers creation' }),
          csiProvisioner_createdDisk: makeLink('csiProvisioner', 'createdDisk', ['csiProvisioner', 'createdDisk'], { label: 'CreateVolume()' }),
        },
      },
    },
    {
      title: 'Container Storage Interface (CSI) Workflow',
      short: 'Provision, Attach, Mount',
      body: [
        'The CSI driver executes a three-stage lifecycle to connect remote storage:',
        '1. **Attach:** Attaches block device to the host node.',
        '2. **Format/Stage:** Creates a filesystem on the raw device.',
        '3. **Mount:** Bind-mounts the filesystem path into the container namespace.',
      ],
      scene: {
        entities: {
          csiController: makeBlock(-12, -14, { s: 4, h: 42, color: 'purple', label: ['CSI Controller', '1. ControllerPublish'] }),
          cloudDisk: makeDb(4, -14, { r: 2.2, h: 36, color: 'store', label: 'EBS Volume' }),
          csiNodePlugin: makeBlock(-12, 4, { s: 4, h: 42, color: 'blue', label: ['CSI Node Plugin', '2. NodeStage (format)'] }),
          containerTarget: makeBlock(4, 4, { s: 4, h: 42, color: 'green', label: ['Pod Mount', '3. NodePublish (/data)'] }),
          card: makePanel({ x: -2, y: 16 }, 'CSI Workflow', [
            '1. ControllerPublish (Attach)',
            '2. NodeStage (mkfs.ext4)',
            '3. NodePublish (mount -o bind)',
          ]),
        },
        links: {
          csiController_cloudDisk: makeLink('csiController', 'cloudDisk', ['csiController', 'cloudDisk'], { label: 'attach to VM' }),
          cloudDisk_csiNodePlugin: makeLink('cloudDisk', 'csiNodePlugin', ['cloudDisk', 'csiNodePlugin'], { label: 'raw /dev/xvdf' }),
          csiNodePlugin_containerTarget: makeLink('csiNodePlugin', 'containerTarget', ['csiNodePlugin', 'containerTarget'], { label: 'mount -o bind' }),
        },
      },
    },
    {
      title: 'StatefulSets & Stable Identity',
      short: 'Ordered Identifiers',
      body: [
        'Deployments share or randomly assign PVCs. StatefulSets guarantee ordered, persistent identities (`kafka-0`, `kafka-1`).',
        'Each pod replica gets its own dedicated PVC through `volumeClaimTemplates`. If `kafka-0` dies, its replacement pod binds back to the exact same disk volume.',
      ],
      scene: {
        entities: {
          statefulPod0: makeBlock(-10, -14, { s: 4, h: 42, color: 'blue', label: ['kafka-0 Pod', 'Ordinal: 0'] }),
          statefulPod1: makeBlock(6, -14, { s: 4, h: 42, color: 'blue', label: ['kafka-1 Pod', 'Ordinal: 1'] }),
          pv0: makeDb(-10, 4, { r: 2, h: 34, color: 'green', label: 'kafka-data-kafka-0' }),
          pv1: makeDb(6, 4, { r: 2, h: 34, color: 'green', label: 'kafka-data-kafka-1' }),
          card: makePanel({ x: -2, y: 14 }, 'volumeClaimTemplates', [
            'Ordered pods: kafka-0, 1',
            'Dedicated PVC per replica',
            'Replacement reattaches disk',
          ]),
        },
        links: {
          statefulPod0_pv0: makeLink('statefulPod0', 'pv0', ['statefulPod0', 'pv0'], { label: 'stable 1-1 binding' }),
          statefulPod1_pv1: makeLink('statefulPod1', 'pv1', ['statefulPod1', 'pv1'], { label: 'stable 1-1 binding' }),
        },
      },
    },
    {
      title: 'Kubernetes Storage Summary',
      short: 'Complete Storage Stack',
      body: [
        'With CSI abstraction and dynamic StorageClasses, Kubernetes unifies local NVMe disks, cloud block storage (EBS), distributed filesystems (EFS/NFS), and object stores into a seamless API.',
      ],
      scene: {
        entities: {
          developerSpec: makeBlock(-10, -14, { s: 4, h: 42, color: 'blue', label: ['App Developer', 'Writes PVC spec'] }),
          storageClassHub: makeBlock(6, -14, { s: 4, h: 42, color: 'orange', label: ['StorageClass Hub', 'Dynamic Orchestrator'] }),
          csiBridge: makeBlock(-10, 4, { s: 4, h: 42, color: 'purple', label: ['CSI Standards', 'gRPC Driver API'] }),
          cloudArray: makeDb(6, 4, { r: 2.2, h: 36, color: 'store', label: 'Storage Arrays (NVMe/EBS)' }),
          card: makePanel({ x: -2, y: 14 }, 'Storage Architecture', [
            'PVC: developer claim',
            'StorageClass: dynamic broker',
            'CSI: vendor driver standard',
          ]),
        },
        links: {
          developerSpec_storageClassHub: makeLink('developerSpec', 'storageClassHub', ['developerSpec', 'storageClassHub'], { label: 'requests capacity' }),
          storageClassHub_csiBridge: makeLink('storageClassHub', 'csiBridge', ['storageClassHub', 'csiBridge'], { label: 'invokes driver' }),
          csiBridge_cloudArray: makeLink('csiBridge', 'cloudArray', ['csiBridge', 'cloudArray'], { label: 'provisions disk' }),
        },
      },
    },
  ],
};
