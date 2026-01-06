
export interface UserPortfolio {
  totalValuation: number;
  unrealizedGain: number;
  unrealizedGainPercent: number;
  investedAmount: number;
  cagr: number;
  xirr: number;
  assetAllocation: {
    name: string;
    value: number;
    color: string;
  }[];
}

export interface Folio {
  id: string;
  schemeCode: string;
  schemeName: string;
  folioNumber: string;
  investmentType: 'SIP' | 'Lumpsum';
  planType: 'Regular' | 'Direct';
  sipDate?: number;
  units: number;
  investedValue: number;
  currentValue?: number;
  returns?: number;
  returnsPercent?: number;
}

export interface UserProfile {
  name: string;
  email: string;
  avatar: string;
  phone: string;
  dob: string;
  nominee: string;
  residency: string;
  kycStatus: 'Verified' | 'Pending' | 'Not Started';
}

export interface ChartData {
  date: string;
  nav: number;
}

export interface Notification {
  id: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
}

export interface CartItem {
  schemeCode: string;
  schemeName: string;
  planType: 'Regular' | 'Direct';
}
