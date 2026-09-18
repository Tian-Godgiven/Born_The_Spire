import type { ChangelogVersion } from './types'

export const changelogVersions: ChangelogVersion[] = [
    {
        version: '0.1.1',
        load: async () => (await import('./0.1.x/0.1.1')).changelog011
    }
]

export type { ChangelogBugFix, ChangelogEntry, ChangelogRoadmap, ChangelogVersion } from './types'
