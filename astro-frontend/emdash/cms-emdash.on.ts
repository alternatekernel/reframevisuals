import { getEmDashCollection, getEmDashEntry } from 'emdash';

export const listEntries = (collection: string) => getEmDashCollection(collection);
export const getEntry = (collection: string, slug: string) => getEmDashEntry(collection, slug);
