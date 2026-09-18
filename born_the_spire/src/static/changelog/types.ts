export interface ChangelogBugFix {
    summary: string
    contributor: string
}

export interface ChangelogRoadmap {
    next: string[]
    later: string[]
}

export interface ChangelogEntry {
    version: string
    systems: string[]
    fixes: ChangelogBugFix[]
    roadmap: ChangelogRoadmap
}

export interface ChangelogVersion {
    version: string
    load: () => Promise<ChangelogEntry>
}
