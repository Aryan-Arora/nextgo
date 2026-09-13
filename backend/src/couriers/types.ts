export type CourierBookingRequest = { reference: string; destinationPincode: string; weightG: number; paymentMode: 'prepaid' | 'cod'; codAmountPaise: number };
export type CourierBookingResult = { providerShipmentId: string; awb: string; labelAvailable: boolean };
export type CourierAdapter = {
  providerCode: string;
  book(request: CourierBookingRequest): Promise<CourierBookingResult>;
  cancel(providerShipmentId: string): Promise<void>;
};
