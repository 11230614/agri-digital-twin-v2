import { defineStore } from 'pinia';
import { shallowRef } from 'vue';
import type { SceneSnapshot } from '../app/ports/scene';

/** Read-only UI projection; the Runtime owns the actual state. */
export const useDiagnosticsStore=defineStore('diagnostics',()=>{
  const snapshot=shallowRef<SceneSnapshot>();
  const project=(value:SceneSnapshot)=>{snapshot.value=value;};
  return {snapshot,project};
});
