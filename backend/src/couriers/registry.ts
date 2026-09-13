import { MockCourierAdapter } from './mock.js';
import type { CourierAdapter } from './types.js';

export function courierAdapter(providerCode: string): CourierAdapter {
  // Until a provider is configured with verified credentials, local/sandbox
  // providers use the deterministic adapter. Add Delhivery/Blue Dart/company
  // adapters here; no route or domain model needs to change.
  return new MockCourierAdapter(providerCode);
}
