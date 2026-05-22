
import { LucideIcon } from 'lucide-react';

export interface MenuItem {
  id: string;
  label: string;
  icon: LucideIcon;
  color?: string;
  badge?: string;
}

export interface Transaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  date: string; // ISO string
  status: 'success' | 'pending' | 'failed';
}

export interface RewardStatus {
  currentDay: number;
  lastClaimedTimestamp: number;
}

export type NotificationType = 'withdrawals' | 'transfers' | 'airtime' | 'rewards';

export interface SystemNotificationItem {
  id: string;
  message: string;
  date: string; // ISO string
  read?: boolean;
}

export interface NotificationPreferences {
  withdrawals: boolean;
  transfers: boolean;
  airtime: boolean;
  rewards: boolean;
}

export interface User {
  name: string;
  email: string;
  balance: number;
  profileImage?: string;
  isSubscribed?: boolean;
  subscriptionPlan?: string;
  subscriptionExpiryDate?: number;
  transactions?: Transaction[];
  rewardStatus?: RewardStatus;
  deactivationDate?: number; // Timestamp when deactivation takes effect
  imminentDeactivationExpiry?: number; // Timestamp when 20m warning expires
  isVIP?: boolean;
  vipBalance?: number;
  loanBalance?: number;
  loanExpiry?: number;
  isPMode?: boolean;
  isVMode?: boolean; // Verification mode for subscriptions
  vModeSubscriptionUsed?: boolean;
  vModeVipUsed?: boolean;
  vModeInvestmentUsed?: boolean;
  isInvestmentIdUsed?: boolean;
  isRestricted?: boolean;
  restrictionType?: 'verification' | 'other';
  restrictionRestoreTime?: number;
  pendingInvestmentStep?: 'account_details' | 'verification_payment' | null;
  notificationPreferences?: NotificationPreferences;
  lastTelegramClaimTimestamp?: number;
  lastTelegramClaim2Timestamp?: number;
  lastWhatsAppClaimTimestamp?: number;
  lastBiggyWinClaimTimestamp?: number;
  lastGameRewardsClaimTimestamp?: number;
  dailyQuizCount?: number;
  lastQuizTimestamp?: number;
  hasPlayedWelcomeVoice?: boolean;
  showVipWithdrawalNotice?: boolean;
  persistentVipNotice?: boolean;
  referredBy?: string;
  referralCode?: string;
  referredUsers?: string[];
  referralEarnings?: number;
  referralCount?: number;
  pendingActivation?: 'subscription_weekly' | 'subscription_monthly' | 'subscription_yearly' | 'vip' | 'link_account' | 'investment' | 'imminent_payment' | null;
  pendingPaymentProof?: string; // Base64 string representing the uploaded image
  pendingPaymentDate?: string; // ISO String of when proof was uploaded
  pendingPaymentAmount?: number; // The amount paid
  isAccountLinkedVerified?: boolean;
  adminNotifications?: SystemNotificationItem[];
}

export interface Plan {
  id: string;
  name: string;
  price: string;
  amount: string; // For email body clarity
  duration: string;
  recommended?: boolean;
}
