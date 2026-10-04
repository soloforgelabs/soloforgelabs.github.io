export type AccentColor = 'cyan' | 'mint' | 'amber' | 'lime' | 'rose';

export interface ProductFeature {
  title: string;
  subtitle: string;
  iconName: string;
}

export interface DownloadItem {
  label: string;
  sublabel: string;
  url: string;
  filename: string;
  size: string;
  sha256?: string;
}

export interface Product {
  id: 'blinkscribe' | 'deskscribe' | 'sizeradar' | 'foodlens' | 'pulsetrack';
  name: string;
  version: string;
  tagline: string;
  headline: string;
  category: string;
  accent: AccentColor;
  statusBadge: string;
  statusType: 'available' | 'release-ready' | 'planned';
  description: string;
  features: ProductFeature[];
  downloads: {
    primary?: DownloadItem;
    secondary?: DownloadItem;
    guideUrl?: string;
  };
  details: {
    systemRequirements: string[];
    hardwareAcceleration: string;
    privacyModel: string;
    keyHighlights: string[];
    docUrl: string;
  };
  preview: {
    title: string;
    latency: string;
    status: string;
    metaBadge: string;
    codePreview: string;
    codeLang: string;
  };
}

export interface ChangelogItem {
  id: string;
  title: string;
  tag: string;
  date: string;
  summary: string;
  bullets: string[];
  linkText?: string;
  linkUrl?: string;
  accent: AccentColor;
}
