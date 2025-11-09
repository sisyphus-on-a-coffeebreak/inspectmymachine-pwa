export interface VehicleDetails {
  registration: string;
  make: string;
  model: string;
}

export interface PassData {
  passNumber: string;
  passType: 'visitor' | 'vehicle';
  visitorName?: string;
  vehicleDetails?: VehicleDetails;
  purpose: string;
  entryTime: string;
  expectedReturn?: string;
  accessCode: string;
  qrCode?: string;
  companyName?: string;
  companyLogo?: string;
}
