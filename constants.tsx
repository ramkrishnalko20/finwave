import { UserPortfolio, Folio, Notification, UserProfile } from './types';

export const MOCK_USER: UserProfile = {
  name: "Alexander Pierce",
  email: "alexander@finwave.com",
  avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?fit=crop&w=300&h=300",
  phone: "+91 98765 43210",
  dob: "1990-05-15",
  nominee: "Sarah Pierce (Spouse)",
  residency: "India",
  kycStatus: "Not Started"
};

export const MOCK_PORTFOLIO: UserPortfolio = {
  totalValuation: 0, 
  unrealizedGain: 0,
  unrealizedGainPercent: 0,
  investedAmount: 25000,
  cagr: 15.73,
  xirr: 12.45,
  assetAllocation: [
    { name: 'Equity', value: 85, color: '#3b82f6' },
    { name: 'Debt', value: 10, color: '#10b981' },
    { name: 'Gold', value: 5, color: '#f59e0b' },
  ]
};

export const MOCK_FOLIOS: Folio[] = [
  {
    id: 'folio_1',
    schemeCode: "120465", 
    schemeName: "Axis Bluechip Fund - Direct Plan - Growth",
    folioNumber: "10293847/55",
    investmentType: 'Lumpsum',
    planType: 'Direct',
    units: 150.25,
    investedValue: 10000.00
  },
  {
    id: 'folio_2',
    schemeCode: "102885", 
    schemeName: "SBI Bluechip Fund - Regular Plan - Growth",
    folioNumber: "99283741/02",
    investmentType: 'SIP',
    planType: 'Regular',
    units: 120.80,
    investedValue: 8000.00
  }
];

export const MOCK_NOTIFICATIONS: Notification[] = [
  { id: '1', title: 'Portfolio Updated', description: 'Your Axis Bluechip holdings were updated successfully.', time: 'Just now', read: false },
  { id: '2', title: 'Market Alert', description: 'Nifty 50 is trending upwards by 1.2% today.', time: '2h ago', read: false },
  { id: '3', title: 'Monthly Statement', description: 'Your investment statement for October is ready.', time: '1d ago', read: true },
];