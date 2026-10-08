// Shared Auth, User, License, and System Types
export type UserRole = 'GUEST' | 'TRIAL' | 'LICENSED' | 'FREE_ACCESS' | 'BLOCKED' | 'ADMIN';
export type LicensePlan = 'TRIAL' | 'LICENSED' | 'GUEST' | 'PRO' | 'PREMIUM' | 'SCHOOL';

export interface UserQuota {
  easy: number;     // Số lượt Dễ dùng còn lại
  advanced: number; // Số lượt Chuyên sâu còn lại
}

export interface UserAccount {
  id: string;
  email: string;
  name: string;
  picture?: string;
  role: UserRole;
  plan: LicensePlan;
  quota: UserQuota;
  licenseKey?: string;
  licenseExpiresAt?: string | null;
  freeAccess?: boolean;
  freeAccessName?: string;
  freeAccessExpiresAt?: string | null;
  createdAt: string;
  lastActiveAt: string;
  isBlocked: boolean;
}

export interface GuestSession {
  guestId: string;
  quota: UserQuota;
  createdAt: string;
  lastActiveAt: string;
  analysisCount: number;
}

export type LicenseStatus = 'UNUSED' | 'ACTIVE' | 'EXPIRED' | 'REVOKED';

export interface BoundDevice {
  deviceId: string;
  deviceName?: string;
  boundAt: string;
  lastActiveAt?: string;
}

export interface LicenseItem {
  key: string;
  plan: LicensePlan;
  maxDevices: number;
  boundDevices?: BoundDevice[];
  assignedEmail?: string;
  customerNote?: string;
  activatedAt?: string;
  expiresAt?: string | null;
  status: LicenseStatus;
  createdReason?: string;
  createdAt?: string;
}

export interface SystemStats {
  totalGuests: number;
  totalUsers: number;
  trialUsers: number;
  licensedUsers: number;
  totalAnalyses: number;
  activeLicenses?: number;
  geminiStatus: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
  licenseApiStatus: 'CONNECTED' | 'LOCAL_FALLBACK';
}

export interface SystemSettings {
  guestEasyLimit: number;
  guestAdvancedLimit: number;
  trialEasyLimit: number;
  trialAdvancedLimit: number;
  freeAccessEnabled: boolean;
  freeAccessName: string;
  freeAccessStart: string;
  freeAccessEnd: string;
}
