export interface OfficialChannel {
  id: string; name: string; type: string; url: string | null; phone: string | null; email: string | null;
  instructions: string | null; categoryInstructions: string | null; requiresGovBr: boolean;
  organization: { id: string; name: string; type: string };
}
export interface OccurrenceSummary {
  id: string; title: string;
  category: { id: string; slug: string; name: string };
  subcategory: { id: string; name: string } | null;
  status: { code: string; name: string };
  location: { lat: number; lng: number };
  address: { street: string | null; number: string | null; neighborhood: string | null };
  dates: { createdAt: string; updatedAt: string; validatedAt: string | null; resolvedAt: string | null };
  currentCycle: { number: number; startedAt: string; endedAt: string | null } | null;
  counts: { currentCycleReports: number; historicalParticipants: number };
  publicPhoto: { id: string } | null;
  officialChannel: OfficialChannel | null;
}
export interface OccurrenceDetail extends OccurrenceSummary { description: string }
export interface NearbyOccurrence extends OccurrenceSummary { distanceMeters: number }
export interface PublicReport { id: string; type: string; text: string | null; createdAt: string; editedAt: string | null }
export interface PublicHistory { id: string; previousStatus: string | null; status: string; createdAt: string }
export interface ReadPage<T> { items: T[]; page: number; size: number; hasMore: boolean }
