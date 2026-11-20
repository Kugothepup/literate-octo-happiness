/** The video this explainer is based on. Credit it wherever the story draws on it. */
export const SOURCE_VIDEO = {
  title: 'Deep Dive 17/11/2026 – Stratosphere downwards',
  channel: 'Met Office',
  presenter: 'Alex Burkill',
  published: '17 November 2026',
  youtubeId: 'PHTrQiVpo1s',
  url: 'https://www.youtube.com/watch?v=PHTrQiVpo1s',
  /** Where the stratosphere section starts (15:33). */
  sswStartSeconds: 933,
  sswStartLabel: '15:33',
} as const;

export const sswStartUrl = `${SOURCE_VIDEO.url}&t=${SOURCE_VIDEO.sswStartSeconds}s`;
