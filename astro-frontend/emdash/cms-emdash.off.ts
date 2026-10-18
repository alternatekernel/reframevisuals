// EmDash disabled for this build (no EMDASH_DATABASE_URL); cms.ts never calls these.
export const listEntries = async (_collection: string): Promise<{ entries: any[]; error?: Error }> => ({ entries: [] });
export const getEntry = async (_collection: string, _slug: string): Promise<{ entry: any; error?: Error }> => ({ entry: null });
