import { ApiClient } from '@digvation/pos-api';

export interface BusinessProfile {
  name: string | null;
  version: number;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface SellingLocation {
  id: string;
  code: string;
  name: string;
  status: 'ACTIVE' | 'INACTIVE';
  version: number;
}

interface Page<T> {
  items: T[];
}

export class BusinessSettingsApi {
  public constructor(private readonly client: ApiClient) {}

  getProfile() { return this.client.get<BusinessProfile>('/api/v1/business-profile'); }
  updateProfile(profile: BusinessProfile, name: string) { return this.client.patch<BusinessProfile>('/api/v1/business-profile', { expectedVersion: profile.version, name }); }
  listLocations() { return this.client.get<Page<SellingLocation>>('/api/v1/locations?limit=100&offset=0'); }
  createLocation(input: { code: string; name: string }) { return this.client.post<SellingLocation>('/api/v1/locations', input); }
  updateLocation(location: SellingLocation, input: { name?: string; status?: SellingLocation['status'] }) { return this.client.patch<SellingLocation>(`/api/v1/locations/${location.id}`, { expectedVersion: location.version, ...input }); }
}
