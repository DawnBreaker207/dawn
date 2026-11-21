// Static WorkbenchLesson for the JVM Heap & GC tab.
// 4 steps mirror the GC lifecycle: Allocation → Minor GC → Promotion → Full GC.
// The interactive heap simulation (Eden/S0/S1/Old pool cards) lives in the canvas slot.

import type { WorkbenchLesson } from '@/types/workbench';

export const jvmLesson: WorkbenchLesson = {
  title: 'HotSpot Heap & Generational ZGC',
  subtitle: 'TLAB Fast Path · Aging S0/S1 → Tenured',
  steps: [
    {
      title: 'Eden Space — TLAB Allocation',
      short: 'Allocation',
      body: [
        'New objects land in Eden via Thread-Local Allocation Buffers (TLABs) — a pointer bump, O(1). Eden is 64 MB.',
        'Each thread owns a private TLAB region inside Eden. Allocations into TLAB never need a CAS or mutex; they are as fast as stack allocation.',
      ],
      why: 'TLABs eliminate allocation contention between threads. Sharing one bump pointer across all threads would require a CAS per allocation — a hotspot on JVMs with hundreds of threads.',
      metrics: { 'Eden': '64 MB', 'Alloc': 'O(1)', 'Method': 'TLAB bump' },
    },
    {
      title: 'Minor GC — Survivor Evacuation',
      short: 'Minor GC',
      body: [
        'Eden fills → G1/ZGC copies live objects to S0 or S1 survivor space (16 MB each). Each surviving object ages (age++). Dead objects are reclaimed instantly.',
        'Typically completes in < 1 ms with G1. ZGC extends this to concurrent evacuation with no STW pause.',
      ],
      why: 'Weak Generational Hypothesis: 90% of objects die as infants (request-scoped, event handlers). Scanning a small Eden over and over is far cheaper than scanning the whole heap.',
      metrics: { 'S0/S1': '16 MB each', 'Pause': '< 1 ms (G1)', 'Age': '++ per copy' },
    },
    {
      title: 'Promotion — Tenured Objects',
      short: 'Promotion',
      body: [
        'Objects surviving 15 Minor GCs (default threshold) are promoted to Old Gen (Tenured, 128 MB). Very large objects bypass Eden entirely and land directly in Old Gen.',
      ],
      why: 'Separating short-lived (Young Gen) from long-lived (Old Gen) lets Minor GC skip the whole tenured region. The promotion threshold (15) is a tunable based on object lifetimes.',
      metrics: { 'Age limit': '15', 'Old Gen': '128 MB', 'Large obj': 'direct' },
    },
    {
      title: 'Full GC — Stop The World',
      short: 'Full GC',
      body: [
        'Old Gen fills → Full GC freezes all application threads, traces from roots, compacts heap. All live objects are relocated, all dead space reclaimed.',
        'G1 reduces full GC to a rare fallback; ZGC and Shenandoah handle Old Gen collection concurrently with sub-ms pauses.',
      ],
      why: 'Without compaction, Old Gen would fragment over time (many small dead gaps, no large contiguous range for a big allocation). STW guarantees a consistent heap view across all threads.',
      metrics: { 'Old Gen': '128 MB', 'STW': '> 100 ms (CMS)', 'ZGC': '< 1 ms' },
    },
  ],
  goals: [
    { text: 'Trace an object from allocation to collection', step: 1 },
    { text: 'Understand why TLABs make allocation thread-safe and fast', step: 1 },
    { text: 'Read a Minor GC log and identify pause source', step: 2 },
    { text: 'Know when promotion happens and how to tune the threshold', step: 3 },
    { text: 'Choose the right GC algorithm for your workload', step: 4 },
  ],
};
