export interface BrandConfig {
  name: string;
  tagline?: string;
  logoUrl?: string;
  websiteUrl?: string;
  colours: {
    primary: string;
    accent: string;
    navy: string;
    dark: string;
    surface: string;
    light: string;
    warning: string;
    danger: string;
    success: string;
  };
  defaults: {
    currency: 'GBP' | 'USD' | 'EUR';
    region: string;
  };
  featureRequests: {
    enabled: boolean;
    fallbackEmail?: string;
  };
}

const brand: BrandConfig = {
  name: 'Sentinel Cost Calculator',
  tagline: 'Microsoft Sentinel SIEM — Pricing Estimator',
  websiteUrl: 'https://www.cloudsecurityinsider.com',
  colours: {
    primary: '#a218ff',
    accent: '#ff2371',
    navy: '#001048',
    dark: '#191c26',
    surface: '#1e2130',
    light: '#f3f1ef',
    warning: '#ca792d',
    danger: '#b4190e',
    success: '#4d8965',
  },
  defaults: {
    currency: 'GBP',
    region: 'uksouth',
  },
  featureRequests: {
    enabled: true,
    fallbackEmail: 'feedback@example.com',
  },
};

export default brand;
