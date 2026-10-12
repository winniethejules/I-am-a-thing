/**
 * The match's settings, three-free: what the leader sets before (and during) a match, read by the
 * rules and the game. Synced over the link by the SDK's `Setup` (the leader sets them, everyone sees them).
 */
import type { Settings, SetupSpec } from '@voxelparty/sdk/core';

export interface MatchRules {
  /** Seconds a vätte may stay one thing before it's forced to turn into another, at random (0: never). */
  shift: number;
}

export const OPTIONS = {
    shift: {
      label: 'Tvingad förvandling',
      choices: [
        { value: 0, label: 'Av', blurb: 'Vättarna väljer själva vad de är.' },
        { value: 30, label: 'Var 30:e sekund', blurb: 'Varje vätte blir något nytt av sig själv, och måste passa in där den står.' },
        { value: 60, label: 'Varje minut', blurb: 'Det blir svårt: en ny sak varje minut, oavsett var du står.' },
      ],
      default: 0,
      hint: 'Ett slumpmässigt nytt föremål. Smälter in-mätaren visar om du passar in.',
    },
} satisfies Settings;

/** The setup's spec: the leader's options (no picks, no teams). */
export const SETTINGS: SetupSpec<typeof OPTIONS, Record<string, never>> = { options: OPTIONS };
