// Builds a WorkbenchLesson for the Java Concurrency tab from SubTopic[] data.
// SubTopic already has explain/why/flow/diagram/code — we map them to WorkbenchLesson.steps.
// The code/flow/diagram fields are NOT part of WorkbenchLesson; they stay in the
// Technical Specs accordion inside the component.

import type { SubTopic } from '@/scripts/lab/java/java-tabs';
import type { WorkbenchLesson } from '@/types/workbench';

export function buildConcurrencyLesson(subs: SubTopic[]): WorkbenchLesson {
  return {
    title: 'Java Concurrency',
    subtitle: 'Java 21 · Object Header Lock Word',
    steps: subs.map(sub => ({
      title: sub.label,
      short: sub.label,
      body: [sub.explain],
      why: sub.why,
    })),
    goals: [
      { text: 'Understand thread lifecycle and monitor semantics', step: 1 },
      { text: 'Size thread pools for CPU-bound vs IO-bound workloads', step: 2 },
      { text: 'Compose async pipelines with CompletableFuture', step: 3 },
      { text: 'Scale to millions of tasks with virtual threads (JDK 21)', step: 4 },
    ],
  };
}
