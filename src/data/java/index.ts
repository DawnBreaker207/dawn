import type { SimCase, VizCfg } from '@/scripts/lab/java/sim-engine';
import { CONCURRENCY_CASES, CONCURRENCY_VIZ } from './concurrency';
import { JVM_CASES, JVM_VIZ } from './jvm-memory';
import { COLLECTIONS_CASES, COLLECTIONS_VIZ } from './collections';
import { ENTERPRISE_CASES, ENTERPRISE_VIZ } from './enterprise';

export const SIMCASES: Record<string, SimCase[]> = {
  ...CONCURRENCY_CASES,
  ...JVM_CASES,
  ...COLLECTIONS_CASES,
  ...ENTERPRISE_CASES,
};

export const SIM_VIZ: Record<string, VizCfg[]> = {
  ...CONCURRENCY_VIZ,
  ...JVM_VIZ,
  ...COLLECTIONS_VIZ,
  ...ENTERPRISE_VIZ,
};
