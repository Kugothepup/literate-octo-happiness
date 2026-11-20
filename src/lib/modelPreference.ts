import type { ModelSource } from '../types/weather';

const KEY = 'ssw:model';

/**
 * Which 3D model to start with. A choice the viewer made earlier wins; otherwise devices that
 * ask to save data or look low-powered get the simple model (it skips a 4.5 MB download).
 */
export function initialModelSource(): ModelSource {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === 'glb' || saved === 'procedural') return saved;
  } catch {
    /* storage blocked: fall through to the device check */
  }
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
  const lowPower =
    nav.connection?.saveData === true ||
    (nav.deviceMemory !== undefined && nav.deviceMemory <= 4) ||
    (nav.hardwareConcurrency !== undefined && nav.hardwareConcurrency <= 4);
  return lowPower ? 'procedural' : 'glb';
}

export function saveModelSource(source: ModelSource): void {
  try {
    localStorage.setItem(KEY, source);
  } catch {
    /* storage blocked: the choice just won't be remembered */
  }
}
