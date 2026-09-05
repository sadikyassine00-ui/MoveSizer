/**
 * Backwards-compatible facade for TruckSizer packing engine.
 * Modular decomposition lives in ./types, ./collision, ./compaction, ./sort, ./phases, and ./index.
 */
export * from './index';
export { packTruck as default } from './index';
