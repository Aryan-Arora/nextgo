import { createHash } from 'node:crypto';
import type { CourierAdapter, CourierBookingRequest, CourierBookingResult } from './types.js';

// Deterministic local adapter. A production provider adapter implements this
// exact contract and is selected only after its credentials pass verification.
export class MockCourierAdapter implements CourierAdapter {
  constructor(readonly providerCode: string) {}
  async book(request: CourierBookingRequest): Promise<CourierBookingResult> {
    const digest = createHash('sha256').update(`${this.providerCode}:${request.reference}`).digest('hex').toUpperCase();
    return { providerShipmentId: `mock_${digest.slice(0, 16)}`, awb: `NXG${digest.slice(0, 12)}`, labelAvailable: true };
  }
  async cancel(): Promise<void> {}
}
