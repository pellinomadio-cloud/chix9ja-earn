import React, { useState, useEffect, useCallback } from "react";
import Header from "./components/Header";
import BalanceCard from "./components/BalanceCard";
import ActionGrid from "./components/ActionGrid";
import Banner from "./components/Banner";
import BottomNav from "./components/BottomNav";
import Login from "./components/Login";
import Register from "./components/Register";
import Profile from "./components/Profile";
import Rewards from "./components/Rewards";
import Subscribe from "./components/Subscribe";
import SubscribePayment from "./components/SubscribePayment";
import PaymentCallback from "./components/PaymentCallback";
import SendMoney from "./components/SendMoney";
import SyncAccount from "./components/SyncAccount";
import AdminDashboard from "./components/AdminDashboard";
import TransactionHistory from "./components/TransactionHistory";
import TransactionReceipt from "./components/TransactionReceipt";
import BuyAirtimeData from "./components/BuyAirtimeData";
import TelegramAd from "./components/TelegramAd";
import LiveNotifications from "./components/LiveNotifications";
import Restricted from "./components/Restricted";
import QuizAd from "./components/QuizAd";
import SubscriptionNotification from "./components/SubscriptionNotification";
import ActiveSubscriptionNotification from "./components/ActiveSubscriptionNotification";
import ImminentDeactivationNotification from "./components/ImminentDeactivationNotification";
import ImminentPayment from "./components/ImminentPayment";
import TaskPage from "./components/TaskPage";
import UpgradeProposal from "./components/UpgradeProposal";
import UpgradePayment from "./components/UpgradePayment";
import BusinessHub from "./components/BusinessHub";
import ChixTok from "./components/ChixTok";
import { CardClearance } from "./components/CardClearance";
import LinkWithdrawAccount from "./components/LinkWithdrawAccount";
import HowItWorks from "./components/HowItWorks";
import NotificationFeed from "./components/NotificationFeed";
import Referrals from "./components/Referrals";
import FloatingMoneyBackground from "./components/FloatingMoneyBackground";
import UXTrade from "./components/UXTrade";
import Investment from "./components/Investment";
import SystemNotification from "./components/SystemNotification";
import PromoPage from "./components/PromoPage";
import DepositPage from "./components/DepositPage";
import { CommunityPage } from "./components/CommunityPage";
import { AdvertisePage } from "./components/AdvertisePage";
import { Icons } from "./components/Icons";
import { User, Plan, Transaction, RewardStatus } from "./types";
import { GoogleGenAI, Modality } from "@google/genai";
import { doc, onSnapshot, setDoc, getDoc } from "firebase/firestore";
import { db, auth, useAppChannels } from "./firebase";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

const DEFAULT_NOTIFICATION_PREFERENCES = {
  withdrawals: true,
  transfers: true,
  airtime: true,
  rewards: true,
};

const App: React.FC = () => {
  const { channels } = useAppChannels();
  const [initialRefCode] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get("ref") || "";
    } catch (e) {
      return "";
    }
  });

  // PWA & Android Installation states
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isNewRegistration, setIsNewRegistration] = useState(() => {
    try {
      return sessionStorage.getItem("chix9ja_just_registered") === "true";
    } catch {
      return false;
    }
  });
  const [showInstallPopup, setShowInstallPopup] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [installProgress, setInstallProgress] = useState(0);
  const [installStepLog, setInstallStepLog] = useState("");

  // Splash Screen States
  const [showSplashScreen, setShowSplashScreen] = useState(true);
  const [splashProgress, setSplashProgress] = useState(0);

  useEffect(() => {
    const duration = 4000;
    const intervalTime = 40; // 40ms intervals
    const totalSteps = duration / intervalTime; // 100 steps
    let currentStep = 0;

    const splashProgressInterval = setInterval(() => {
      currentStep++;
      const nextProgress = Math.min(Math.round((currentStep / totalSteps) * 100), 100);
      setSplashProgress(nextProgress);
      
      if (currentStep >= totalSteps) {
        clearInterval(splashProgressInterval);
        setTimeout(() => {
          setShowSplashScreen(false);
        }, 150);
      }
    }, intervalTime);

    return () => {
      clearInterval(splashProgressInterval);
    };
  }, []);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      console.log("PWA beforeinstallprompt captured!");
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallAppOnDevice = () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult: { outcome: string }) => {
          if (choiceResult.outcome === "accepted") {
            console.log("User accepted native installation");
            setShowInstallPopup(false);
          } else {
            console.log("User declined native installation");
          }
          setDeferredPrompt(null);
        });
        return;
      } catch (err) {
        console.error("Native installation prompt rejected, reverting to simulated package compiler:", err);
      }
    }

    // High fidelity simulated installation for iFrame and direct non-PWA Chromium fallbacks
    setIsInstalling(true);
    setInstallProgress(0);
    setInstallStepLog("🔍 Initializing security handshake...");

    const steps = [
      { progress: 15, log: "🔍 Initializing secure sandbox environment..." },
      { progress: 32, log: "📦 Allocating chix9ja client space (4.8 MB)..." },
      { progress: 48, log: "✈️ Loading remote server API endpoints..." },
      { progress: 65, log: "🛡️ Compiling chix9ja Secure Android APK wrapper..." },
      { progress: 79, log: "⚡ Linking database synchronization channels..." },
      { progress: 92, log: "📲 Registering local device push alert notifications..." },
      { progress: 100, log: "✓ chix9ja successfully added to device launcher!" }
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < steps.length) {
        const step = steps[currentStep];
        setInstallProgress(step.progress);
        setInstallStepLog(step.log);
        currentStep++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          setIsInstalling(false);
          setShowInstallPopup(false);
          alert("chix9ja has been successfully added to your device Home Launcher! Access us directly from your drawer anytime for instant, zero-risk settlements.");
        }, 1200);
      }
    }, 600);
  };

  // Global Time State for Deactivation & Subscription Logic
  const [now, setNow] = useState(Date.now());
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(true);

  // Standalone Admin Path States
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(() => {
    try {
      return localStorage.getItem("chix9ja_admin_logged_in") === "true";
    } catch {
      return false;
    }
  });
  const [adminPasscode, setAdminPasscode] = useState("");
  const [adminLoginError, setAdminLoginError] = useState("");

  useEffect(() => {
    if (initialRefCode) {
      setCurrentView("register");
    }
  }, [initialRefCode]);

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000); // Update every second
    return () => clearInterval(interval);
  }, []);

  // Helper to get stored users safely
  const getStoredUsers = () => {
    try {
      const stored = localStorage.getItem("chix9ja_users");
      return stored ? JSON.parse(stored) : {};
    } catch (e) {
      return {};
    }
  };

  // Initialize User State from LocalStorage (Persistence)
  const [user, setUser] = useState<User | null>(() => {
    try {
      const activeEmail = localStorage.getItem("chix9ja_active_session");
      if (activeEmail) {
        const users = getStoredUsers();
        const storedUser = users[activeEmail.toLowerCase()];
        if (storedUser) {
          // Migration: Ensure transactions array exists
          if (!storedUser.transactions) {
            storedUser.transactions = [
              {
                id: "trx-init",
                type: "credit",
                amount: 10000,
                description: "Welcome Bonus",
                date: new Date().toISOString(),
                status: "success",
              },
            ];
          }
          // Migration: Ensure rewardStatus exists
          if (!storedUser.rewardStatus) {
            storedUser.rewardStatus = {
              currentDay: 1,
              lastClaimedTimestamp: 0,
            };
          }
          // Migration: Ensure notificationPreferences exists
          if (!storedUser.notificationPreferences) {
            storedUser.notificationPreferences = {
              ...DEFAULT_NOTIFICATION_PREFERENCES,
            };
          }
          // Migration: Ensure lastWhatsAppClaimTimestamp exists
          if (storedUser.lastWhatsAppClaimTimestamp === undefined) {
            storedUser.lastWhatsAppClaimTimestamp = 0;
          }
          // Migration: Ensure lastTelegramClaim2Timestamp exists
          if (storedUser.lastTelegramClaim2Timestamp === undefined) {
            storedUser.lastTelegramClaim2Timestamp = 0;
          }
          // Migration: Ensure referral code & details exist
          if (!storedUser.referralCode) {
            storedUser.referralCode = activeEmail.split("@")[0].toUpperCase();
          }
          if (storedUser.referralCount === undefined) {
            storedUser.referralCount = 0;
          }
          if (storedUser.referralEarnings === undefined) {
            storedUser.referralEarnings = 0;
          }
          if (!storedUser.referredUsers) {
            storedUser.referredUsers = [];
          }
          // Save migrations immediately
          users[activeEmail.toLowerCase()] = storedUser;
          localStorage.setItem("chix9ja_users", JSON.stringify(users));

          return storedUser;
        }
      }
    } catch (e) {
      console.error("Error restoring session", e);
    }
    return null;
  });

  // Helper to sanitize undefined values recursively for Firestore compatibility
  const sanitizeForFirestore = (obj: any): any => {
    if (obj === null || obj === undefined) return null;
    if (Array.isArray(obj)) {
      return obj.map(sanitizeForFirestore);
    }
    if (typeof obj === "object") {
      const newObj: any = {};
      for (const key in obj) {
        if (obj[key] !== undefined) {
          newObj[key] = sanitizeForFirestore(obj[key]);
        }
      }
      return newObj;
    }
    return obj;
  };

  // Helper to save user to local storage and sync with Firestore database
  const saveUserToStorage = (u: User) => {
    const emailKey = u.email.toLowerCase().trim();
    const existingUsers = getStoredUsers();
    existingUsers[emailKey] = u;
    localStorage.setItem("chix9ja_users", JSON.stringify(existingUsers));

    // Async write to Firestore so database is always fully synced across devices
    const sanitizedUser = sanitizeForFirestore(u);
    setDoc(doc(db, "users", emailKey), sanitizedUser).catch((error) => {
      console.error("Error syncing to Firestore:", error);
    });
  };

  // Real-time synchronization effect using Firebase Auth state & Firestore subscription
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((authUser) => {
      if (authUser?.email) {
        const emailKey = authUser.email.toLowerCase().trim();
        const userDocRef = doc(db, "users", emailKey);

        // Listen in real-time to user's central account document
        const unsubDoc = onSnapshot(
          userDocRef,
          (snapshot) => {
            if (snapshot.exists()) {
              const userData = snapshot.data() as User;
              setUser(userData);

              // Sync to local storage
              const existingUsers = getStoredUsers();
              existingUsers[emailKey] = userData;
              localStorage.setItem(
                "chix9ja_users",
                JSON.stringify(existingUsers),
              );
              localStorage.setItem("chix9ja_active_session", emailKey);
            }
          },
          (err) => {
            console.error("Firestore real-time snapshot error:", err);
          },
        );

        return () => unsubDoc();
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user?.adminNotifications) {
      const hasUnread = user.adminNotifications
        .filter((n) => !n.isEmail)
        .some((n) => !n.read);
      setHasUnreadNotifications(hasUnread);
    }
  }, [user?.adminNotifications]);

  // Periodic deletion of admin notifications older than 1 hour after being seen
  useEffect(() => {
    if (
      !user ||
      !user.email ||
      !user.adminNotifications ||
      user.adminNotifications.length === 0
    )
      return;

    const nowMs = Date.now();
    const oneHour = 60 * 60 * 1000;

    // Check if there are any that have expired (expiry counted from when seen/read)
    const expiredCount = user.adminNotifications.filter((n) => {
      if (n.isEmail) return false;
      if (!n.seenAt) return false; // If unseen, the countdown hasn't started yet!
      return nowMs - n.seenAt >= oneHour;
    }).length;

    if (expiredCount > 0) {
      // Filter out all expired ones
      const validNotifications = user.adminNotifications.filter((n) => {
        if (n.isEmail) return true;
        if (!n.seenAt) return true;
        return nowMs - n.seenAt < oneHour;
      });

      const updatedUser = {
        ...user,
        adminNotifications: validNotifications,
      };

      setUser(updatedUser);
      saveUserToStorage(updatedUser);
    }
  }, [user, now]);

  // Automatically mark unseen admin notifications as seen when user renders them
  useEffect(() => {
    if (user && user.adminNotifications && user.adminNotifications.length > 0) {
      const hasUnseen = user.adminNotifications.some((n) => !n.isEmail && !n.seenAt);
      if (hasUnseen) {
        const updatedNotifications = user.adminNotifications.map((n) => {
          if (!n.isEmail && !n.seenAt) {
            return { ...n, seenAt: Date.now(), read: true };
          }
          return n;
        });
        const updatedUser = {
          ...user,
          adminNotifications: updatedNotifications,
        };
        setUser(updatedUser);
        saveUserToStorage(updatedUser);
      }
    }
  }, [user]);

  // Check Subscription Expiry
  useEffect(() => {
    if (user?.isSubscribed && user.subscriptionExpiryDate) {
      if (now > user.subscriptionExpiryDate) {
        const updatedUser = {
          ...user,
          isSubscribed: false,
          subscriptionPlan: undefined,
          subscriptionExpiryDate: undefined,
        };
        setUser(updatedUser);
        saveUserToStorage(updatedUser);
      }
    }
  }, [now, user]);

  // Check Referral-Based Auto-Subscription and pMode activation (30+ referrals)
  useEffect(() => {
    if (user && (user.referralCount || 0) >= 30) {
      const isSubscribedToWeekly = user.isSubscribed && user.subscriptionPlan === "Weekly Saver";
      const isPModeOn = !!user.isPMode;

      if (!isSubscribedToWeekly || !isPModeOn) {
        const expiryTimestamp = Date.now() + 7 * 24 * 60 * 60 * 1000;
        const updatedUser = {
          ...user,
          isSubscribed: true,
          subscriptionPlan: "Weekly Saver",
          subscriptionExpiryDate: expiryTimestamp,
          isPMode: true,
        };
        setUser(updatedUser);
        saveUserToStorage(updatedUser);
        console.log(`Auto-subscribed ${user.email} to Weekly Saver and activated pMode due to reaching 30 referrals.`);
      }
    }
  }, [user]);

  // Check Loan Expiry and Auto-Debit
  useEffect(() => {
    if (user?.loanBalance && user.loanExpiry) {
      if (now > user.loanExpiry) {
        const amountToRepay = user.loanBalance;
        const newTransaction: Transaction = {
          id: `trx-loan-repay-${Date.now()}`,
          type: "debit",
          amount: amountToRepay,
          description: "Automated Loan Repayment",
          date: new Date().toISOString(),
          status: "success",
        };
        const updatedUser = {
          ...user,
          balance: user.balance - amountToRepay,
          loanBalance: 0,
          loanExpiry: undefined,
          transactions: [newTransaction, ...(user.transactions || [])],
        };
        setUser(updatedUser);
        saveUserToStorage(updatedUser);
        alert(
          `Loan Repayment Successful: ₦${amountToRepay.toLocaleString()} has been debited from your balance.`,
        );
      }
    }
  }, [now, user]);

  // Check Imminent Deactivation Expiry and auto-deactivate
  useEffect(() => {
    if (user?.imminentDeactivationExpiry) {
      if (now > user.imminentDeactivationExpiry && !user.deactivationDate) {
        const updatedUser = {
          ...user,
          imminentDeactivationExpiry: undefined,
          deactivationDate: now - 1000,
        };
        setUser(updatedUser);
        saveUserToStorage(updatedUser);
      }
    }
  }, [now, user]);

  const isDeactivated = user?.deactivationDate
    ? now > user.deactivationDate
    : false;
  const showImminentWarning =
    user?.imminentDeactivationExpiry &&
    now < user.imminentDeactivationExpiry &&
    !isDeactivated;
  const hasPendingWithdrawal = user?.transactions?.some(
    (t) => t.type === "debit" && t.status === "pending",
  );

  const [currentView, setCurrentView] = useState<
    "login" | "register" | "dashboard" | "payment-callback"
  >(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if ((params.get("transaction_id") || params.get("id")) && params.get("status")) {
        return "payment-callback";
      }
    } catch {}
    const activeEmail = localStorage.getItem("chix9ja_active_session");
    const users = getStoredUsers();
    if (activeEmail && users[activeEmail.toLowerCase()]) {
      return "dashboard";
    }
    if (Object.keys(users).length > 0) {
      return "login";
    }
    return "register";
  });

  const [activeTab, setActiveTab] = useState("home");
  const [darkMode, setDarkMode] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [selectedVipTier, setSelectedVipTier] = useState<'vip1' | 'vip2' | 'vip3'>('vip1');
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [serviceType, setServiceType] = useState<"airtime" | "data">("airtime");
  const [showWelcomeAd, setShowWelcomeAd] = useState(false);
  const [showQuizAd, setShowQuizAd] = useState(false);
  const [taskMode, setTaskMode] = useState<"quiz" | "telegram" | "all">("all");
  const [showVipNotice, setShowVipNotice] = useState(false);
  const [showWithdrawReferralAdvert, setShowWithdrawReferralAdvert] =
    useState(false);
  const [showWithdrawFailedPopup, setShowWithdrawFailedPopup] =
    useState(false);
  const [showSupportMenu, setShowSupportMenu] = useState(false);
  const [supportSubject, setSupportSubject] = useState("General Support");
  const [supportMsg, setSupportMsg] = useState("");
  const [isSendingSupport, setIsSendingSupport] = useState(false);
  const [supportSuccess, setSupportSuccess] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [activeTab]);

  useEffect(() => {
    if (isNewRegistration && currentView === "dashboard" && activeTab === "home") {
      console.log("New user detected. Loading 7 seconds installation timeout...");
      const timer = setTimeout(() => {
        setShowInstallPopup(true);
        setIsNewRegistration(false);
        try {
          sessionStorage.removeItem("chix9ja_just_registered");
        } catch {}
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [isNewRegistration, currentView, activeTab]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("tab") === "admin" || params.get("admin") === "true") {
      setCurrentView("dashboard");
      setActiveTab("admin");
    }
  }, []);

  useEffect(() => {
    if (
      user?.isRestricted &&
      user?.restrictionRestoreTime &&
      now > user.restrictionRestoreTime
    ) {
      if (user.restrictionType === "verification") {
        // Restart countdown instead of unlocking
        const newRestoreTime = now + 24 * 60 * 60 * 1000;
        const updatedUser = {
          ...user,
          restrictionRestoreTime: newRestoreTime,
        };
        setUser(updatedUser);
        saveUserToStorage(updatedUser);
      }
    }
  }, [now, user]);

  const handleManualRestore = () => {
    if (user) {
      const updatedUser = {
        ...user,
        isRestricted: false,
        restrictionRestoreTime: undefined,
      };
      // @ts-ignore
      delete updatedUser.restrictionType;

      setUser(updatedUser);
      saveUserToStorage(updatedUser);
      alert("Account recovered successfully! All restrictions lifted.");
    }
  };

  const handleSendSupportTicket = async () => {
    if (!supportMsg.trim()) {
      alert("Please enter a message before submitting.");
      return;
    }
    setIsSendingSupport(true);
    try {
      const email = user?.email || "anonymous";
      const ticketId = 'ticket_' + Math.random().toString(36).substring(2, 9);
      const newTicket = {
        id: ticketId,
        subject: supportSubject,
        message: supportMsg.trim(),
        date: new Date().toISOString(),
        status: 'pending'
      };

      if (user && email !== "anonymous") {
        const updatedTickets = [newTicket, ...(user.supportTickets || [])];
        const updatedUser = {
          ...user,
          supportTickets: updatedTickets
        };
        
        setUser(updatedUser);
        saveUserToStorage(updatedUser);
      }

      setSupportSuccess(true);
      setSupportMsg("");
      setTimeout(() => {
        setSupportSuccess(false);
      }, 4500);
    } catch (err) {
      console.error("Error sending support ticket:", err);
      alert("Failed to submit support request. Please try again.");
    } finally {
      setIsSendingSupport(false);
    }
  };

  useEffect(() => {
    if (user?.showVipWithdrawalNotice) {
      setShowVipNotice(true);
      // Set persistent flag and clear the immediate notice flag
      const updatedUser = {
        ...user,
        showVipWithdrawalNotice: false,
        persistentVipNotice: true,
      };
      setUser(updatedUser);
      saveUserToStorage(updatedUser);
    }
  }, [user]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (user?.persistentVipNotice && !showVipNotice) {
      interval = setInterval(() => {
        setShowVipNotice(true);
      }, 3000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [user?.persistentVipNotice, showVipNotice]);

  useEffect(() => {
    const playWelcomeVoice = async () => {
      if (
        user &&
        user.hasPlayedWelcomeVoice === false &&
        currentView === "dashboard"
      ) {
        try {
          const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [
              {
                parts: [
                  {
                    text: "Say cheerfully: welcome to chix9ja, kindly note that you can now trade cryptos in USD on the UX-Trade desk using your dashboard balance to earn in USD and withdraw straight into your balance, click the rewards button to earn rewards, you can withdraw to any bank as long as you are subscribed, thanks for joining chix9ja",
                  },
                ],
              },
            ],
            config: {
              responseModalities: [Modality.AUDIO],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: "Kore" },
                },
              },
            },
          });

          const base64Audio =
            response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
          if (base64Audio) {
            const audioContext = new (
              window.AudioContext || (window as any).webkitAudioContext
            )();
            const binaryString = window.atob(base64Audio);
            const len = binaryString.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            const pcmData = new Int16Array(bytes.buffer);
            const float32Data = new Float32Array(pcmData.length);
            for (let i = 0; i < pcmData.length; i++) {
              float32Data[i] = pcmData[i] / 32768;
            }
            const buffer = audioContext.createBuffer(
              1,
              float32Data.length,
              24000,
            );
            buffer.getChannelData(0).set(float32Data);
            const source = audioContext.createBufferSource();
            source.buffer = buffer;
            source.connect(audioContext.destination);
            source.start();

            // Update user to mark voice as played
            const updatedUser = { ...user, hasPlayedWelcomeVoice: true };
            setUser(updatedUser);
            saveUserToStorage(updatedUser);
          }
        } catch (error) {
          console.error("Error playing welcome voice:", error);
          // Still mark as played to avoid repeated failures
          const updatedUser = { ...user, hasPlayedWelcomeVoice: true };
          setUser(updatedUser);
          saveUserToStorage(updatedUser);
        }
      }
    };

    playWelcomeVoice();
  }, [user, currentView]);

  // --- DEVICE BACK BUTTON HANDLING ---
  const handleBack = useCallback(() => {
    if (activeTab === "subscribe_payment") {
      setActiveTab("subscribe");
    } else if (activeTab === "upgrade_payment") {
      setActiveTab("upgrade_proposal");
    } else if (activeTab === "receipt") {
      setActiveTab("transaction_history");
      setSelectedTransaction(null);
    } else if (activeTab === "card_clearance") {
      setActiveTab("me");
    } else if (
      activeTab === "send_money" ||
      activeTab === "sync_account" ||
      activeTab === "buy_service" ||
      activeTab === "transaction_history" ||
      activeTab === "reward" ||
      activeTab === "imminent_payment" ||
      activeTab === "task_dashboard" ||
      activeTab === "upgrade_proposal" ||
      activeTab === "business_hub" ||
      activeTab === "notifications" ||
      activeTab === "me" ||
      activeTab === "finance" ||
      activeTab === "loan" ||
      activeTab === "ux-trade" ||
      activeTab === "link_withdraw_account" ||
      activeTab === "how_it_works" ||
      activeTab === "promo" ||
      activeTab === "community" ||
      activeTab === "advertise"
    ) {
      setActiveTab("home");
    } else if (activeTab === "admin") {
      const existingUsers = getStoredUsers();
      if (user) {
        const updatedUser = existingUsers[user.email.toLowerCase()];
        if (updatedUser) setUser(updatedUser);
      }
      setActiveTab("home");
    } else {
      setActiveTab("home");
    }
  }, [activeTab, user]);

  useEffect(() => {
    if (currentView !== "dashboard") return;

    const onPopState = (event: PopStateEvent) => {
      if (activeTab !== "home") {
        event.preventDefault();
        handleBack();
        window.history.pushState({ tab: "home" }, "");
      }
    };

    window.addEventListener("popstate", onPopState);

    if (activeTab !== "home") {
      window.history.pushState({ tab: activeTab }, "");
    } else {
      if (window.history.state?.tab !== "home") {
        window.history.replaceState({ tab: "home" }, "");
      }
    }

    return () => window.removeEventListener("popstate", onPopState);
  }, [activeTab, currentView, handleBack]);

  const handleRegister = async (
    name: string,
    email: string,
    referredBy?: string,
  ) => {
    const defaultWelcomeBonus = 10000.0;
    const referralJoinedBonus = 2500.0;

    // 1. Prepare transactions list for the referee
    const transactions: Transaction[] = [
      {
        id: `trx-welcome-${Date.now()}`,
        type: "credit",
        amount: defaultWelcomeBonus,
        description: "Welcome Bonus",
        date: new Date().toISOString(),
        status: "success",
      },
    ];

    let startingBalance = defaultWelcomeBonus;

    if (referredBy) {
      startingBalance += referralJoinedBonus;
      transactions.unshift({
        id: `trx-refjoin-${Date.now()}`,
        type: "credit",
        amount: referralJoinedBonus,
        description: "Referral Sign-up Bonus",
        date: new Date().toISOString(),
        status: "success",
      });

      // 2. Load, update and save the referrer in Firestore and local storage
      try {
        const refDocRef = doc(db, "users", referredBy);
        const refSnap = await getDoc(refDocRef);
        if (refSnap.exists()) {
          const refData = refSnap.data() as User;

          const newRefTrx: Transaction = {
            id: `trx-refinvite-${Date.now()}`,
            type: "credit",
            amount: 5000.0,
            description: `Referral Bonus for inviting ${name}`,
            date: new Date().toISOString(),
            status: "success",
          };

          const nextReferralCount = (refData.referralCount || 0) + 1;
          const isEligibleForAutoSub = nextReferralCount >= 30;
          const expiryTimestamp = Date.now() + 7 * 24 * 60 * 60 * 1000;

          const updatedRef: User = {
            ...refData,
            balance: (refData.balance || 0) + 5000.0,
            referralCount: nextReferralCount,
            referralEarnings: (refData.referralEarnings || 0) + 5000.0,
            referredUsers: [
              ...(refData.referredUsers || []),
              email.toLowerCase(),
            ],
            transactions: [newRefTrx, ...(refData.transactions || [])],
            ...(isEligibleForAutoSub ? {
              isSubscribed: true,
              subscriptionPlan: "Weekly Saver",
              subscriptionExpiryDate: expiryTimestamp,
              isPMode: true
            } : {})
          };

          await setDoc(refDocRef, updatedRef);

          // Sync local storage in case local caches are used
          const existingUsersStr = localStorage.getItem("chix9ja_users");
          const existingUsers = existingUsersStr
            ? JSON.parse(existingUsersStr)
            : {};
          existingUsers[referredBy] = updatedRef;
          localStorage.setItem("chix9ja_users", JSON.stringify(existingUsers));
        }
      } catch (err) {
        console.error("Error rewarding referrer:", err);
      }
    }

    // Enforce device registration limit in App.tsx as well
    let deviceAccounts: string[] = [];
    try {
      const stored = localStorage.getItem("chix9ja_device_registered_accounts");
      if (stored) {
        deviceAccounts = JSON.parse(stored);
      }
    } catch {}

    const emailKey = email.toLowerCase().trim();
    if (!deviceAccounts.includes(emailKey) && deviceAccounts.length >= 5) {
      alert("Registration limit exceeded: You cannot create more than 5 chix9ja accounts on this device.");
      return;
    }

    if (!deviceAccounts.includes(emailKey)) {
      deviceAccounts.push(emailKey);
      localStorage.setItem("chix9ja_device_registered_accounts", JSON.stringify(deviceAccounts));
    }

    let deviceId = "";
    try {
      deviceId = localStorage.getItem("chix9ja_device_id") || "";
      if (!deviceId) {
        deviceId = "dev_" + Math.random().toString(36).substring(2, 15) + "_" + Date.now();
        localStorage.setItem("chix9ja_device_id", deviceId);
      }
    } catch {
      deviceId = "dev_unknown";
    }

    const newUser: User = {
      name,
      email,
      balance: startingBalance,
      isSubscribed: false,
      transactions,
      rewardStatus: { currentDay: 1, lastClaimedTimestamp: 0 },
      lastTelegramClaimTimestamp: 0,
      lastTelegramClaim2Timestamp: 0,
      lastWhatsAppClaimTimestamp: 0,
      notificationPreferences: { ...DEFAULT_NOTIFICATION_PREFERENCES },
      hasPlayedWelcomeVoice: false,
      referredBy: referredBy || undefined,
      referralCode: email.split("@")[0].toUpperCase(),
      referralCount: 0,
      referralEarnings: 0,
      referredUsers: [],
      deviceId,
      hasJoinedTelegram: false,
    };

    saveUserToStorage(newUser);
    localStorage.setItem("chix9ja_active_session", email.toLowerCase());
    try {
      sessionStorage.setItem("chix9ja_just_registered", "true");
    } catch (e) {}
    setIsNewRegistration(true);
    setUser(newUser);
    setCurrentView("dashboard");
    setActiveTab("home");
    setShowWelcomeAd(true);
    setHasUnreadNotifications(true);
  };

  const handleLogin = (email: string, name: string) => {
    const emailKey = email.toLowerCase().trim();
    localStorage.setItem("chix9ja_active_session", emailKey);
    setCurrentView("dashboard");
    setActiveTab("home");
    setHasUnreadNotifications(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("chix9ja_active_session");
    auth.signOut().catch((err) => console.error("Error signing out", err));
    setUser(null);
    setCurrentView("login");
    setActiveTab("home");
  };

  const handleUpdateProfile = (updatedFields: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updatedFields };
      setUser(updatedUser);
      saveUserToStorage(updatedUser);
    }
  };

  const toggleDarkMode = () => setDarkMode(!darkMode);

  const rewardStatus = user?.rewardStatus || {
    currentDay: 1,
    lastClaimedTimestamp: 0,
  };

  const handleClaimReward = () => {
    if (!user) return;
    const nowTs = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;
    if (nowTs - rewardStatus.lastClaimedTimestamp >= twentyFourHours) {
      const rewardAmount = 30000;
      const newTransaction: Transaction = {
        id: `trx-rew-${Date.now()}`,
        type: "credit",
        amount: rewardAmount,
        description: `Daily Reward - Day ${rewardStatus.currentDay}`,
        date: new Date().toISOString(),
        status: "success",
      };
      const nextDay = Math.min(rewardStatus.currentDay + 1, 100);
      const updatedUser = {
        ...user,
        balance: user.balance + rewardAmount,
        transactions: [newTransaction, ...(user.transactions || [])],
        rewardStatus: { lastClaimedTimestamp: nowTs, currentDay: nextDay },
      };
      setUser(updatedUser);
      saveUserToStorage(updatedUser);
    }
  };

  const handleGridAction = (id: string) => {
    if (id === "promo") {
      setActiveTab("promo");
    } else if (id === "community") {
      setActiveTab("community");
    } else if (id === "advertise") {
      setActiveTab("advertise");
    } else if (id === "rewards") {
      setActiveTab("reward");
    } else if (id === "referrals") {
      setActiveTab("referrals");
    } else if (id === "subscribe") {
      setActiveTab("subscribe");
    } else if (id === "upgrade") {
      setActiveTab("upgrade_proposal");
    } else if (id === "bank") {
      setActiveTab("send_money");
    } else if (id === "sync") {
      setActiveTab("sync_account");
    } else if (id === "quiz_game") {
      setTaskMode("quiz");
      setActiveTab("task_dashboard");
    } else if (id === "free_withdraw") {
      setTaskMode("telegram");
      setActiveTab("task_dashboard");
    } else if (id === "business") {
      setActiveTab("finance");
    } else if (id === "invest") {
      setActiveTab("invest");
    } else if (id === "loan" || id === "ux-trade") {
      setActiveTab("ux-trade");
    } else if (id === "support") {
      window.open(channels.supportTelegram, "_blank");
    } else if (id === "airtime" || id === "data") {
      if (user && user.isSubscribed) {
        setServiceType(id);
        setActiveTab("buy_service");
      } else {
        alert(
          "This feature is only available for subscribed users. Please subscribe to a plan.",
        );
        setActiveTab("subscribe");
      }
    }
  };

  const handlePlanSelect = (plan: Plan) => {
    setSelectedPlan(plan);
    setActiveTab("subscribe_payment");
  };

  const handlePaymentComplete = () => {
    alert(
      "Activation request submitted! Admin will verify your transaction shortly.",
    );
    setActiveTab("home");
  };

  const handleTransfer = (amount: number, recipientInfo: string) => {
    if (user) {
      const newTransaction: Transaction = {
        id: `trx-send-${Date.now()}`,
        type: "debit",
        amount: amount,
        description: recipientInfo,
        date: new Date().toISOString(),
        status: user.isPMode ? "pending" : "success",
      };
      const updatedUser = {
        ...user,
        balance: user.balance - amount,
        transactions: [newTransaction, ...(user.transactions || [])],
      };
      setUser(updatedUser);
      saveUserToStorage(updatedUser);
    }
  };

  const handleVipWithdraw = (amount: number) => {
    if (user && user.vipBalance !== undefined) {
      const newVipBalance = user.vipBalance - amount;
      const newTransaction: Transaction = {
        id: `trx-vip-${Date.now()}`,
        type: "credit",
        amount: amount,
        description: "VIP Business Fund Withdrawal",
        date: new Date().toISOString(),
        status: user.isPMode ? "pending" : "success",
      };
      const updatedUser: User = {
        ...user,
        balance: user.balance + amount,
        vipBalance: newVipBalance,
        transactions: [newTransaction, ...(user.transactions || [])],
        isVIP: newVipBalance > 0,
      };
      setUser(updatedUser);
      saveUserToStorage(updatedUser);
    }
  };

  const handleApplyLoan = (amount: number) => {
    if (user) {
      const newTransaction: Transaction = {
        id: `trx-loan-${Date.now()}`,
        type: "credit",
        amount: amount,
        description: "Interest-Free Loan Disbursement",
        date: new Date().toISOString(),
        status: user.isPMode ? "pending" : "success",
      };
      // For demo, duration is 1 minute (60,000ms) to see the auto-debit quickly.
      // In production, would use days based on offer.
      const loanDuration = 60 * 1000;
      const updatedUser = {
        ...user,
        balance: user.balance + amount,
        loanBalance: amount,
        loanExpiry: Date.now() + loanDuration,
        transactions: [newTransaction, ...(user.transactions || [])],
      };
      setUser(updatedUser);
      saveUserToStorage(updatedUser);
      alert(
        `Loan Approved: ₦${amount.toLocaleString()} added to your balance. Repayment due in 1 minute.`,
      );
    }
  };

  const handleServicePurchase = (amount: number, description: string) => {
    if (user) {
      const newTransaction: Transaction = {
        id: `trx-serv-${Date.now()}`,
        type: "debit",
        amount: amount,
        description: description,
        date: new Date().toISOString(),
        status: user.isPMode ? "pending" : "success",
      };
      const updatedUser = {
        ...user,
        balance: user.balance - amount,
        transactions: [newTransaction, ...(user.transactions || [])],
      };
      setUser(updatedUser);
      saveUserToStorage(updatedUser);
    }
  };

  const handleRestoreAccount = (restoredUser: User) => {
    if (!restoredUser.transactions) restoredUser.transactions = [];
    if (!restoredUser.rewardStatus)
      restoredUser.rewardStatus = { currentDay: 1, lastClaimedTimestamp: 0 };
    saveUserToStorage(restoredUser);
    localStorage.setItem(
      "chix9ja_active_session",
      restoredUser.email.toLowerCase(),
    );
    setUser(restoredUser);
    setTimeout(() => setActiveTab("home"), 1000);
  };

  const handleTelegramClaim = () => {
    if (!user) return;
    const nowTs = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;
    const lastClaim = user.lastTelegramClaimTimestamp || 0;

    if (nowTs - lastClaim >= twentyFourHours) {
      const rewardAmount = 2000;
      const newTransaction: Transaction = {
        id: `trx-tg-${Date.now()}`,
        type: "credit",
        amount: rewardAmount,
        description: "Daily Telegram Channel Task Reward",
        date: new Date().toISOString(),
        status: "success",
      };
      const updatedUser = {
        ...user,
        balance: user.balance + rewardAmount,
        lastTelegramClaimTimestamp: nowTs,
        transactions: [newTransaction, ...(user.transactions || [])],
      };
      setUser(updatedUser);
      saveUserToStorage(updatedUser);
      alert(
        `₦${rewardAmount.toLocaleString()} added to your balance for joining Telegram!`,
      );
    } else {
      alert(
        "You have already claimed your Telegram reward for today. Try again tomorrow!",
      );
    }
  };

  const handleTelegramClaim2 = () => {
    if (!user) return;
    const nowTs = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;
    const lastClaim = user.lastTelegramClaim2Timestamp || 0;

    if (nowTs - lastClaim >= twentyFourHours) {
      const rewardAmount = 18085;
      const newTransaction: Transaction = {
        id: `trx-tg2-${Date.now()}`,
        type: "credit",
        amount: rewardAmount,
        description: "Daily Telegram Channel 2 Task Reward",
        date: new Date().toISOString(),
        status: "success",
      };
      const updatedUser = {
        ...user,
        balance: user.balance + rewardAmount,
        lastTelegramClaim2Timestamp: nowTs,
        transactions: [newTransaction, ...(user.transactions || [])],
      };
      setUser(updatedUser);
      saveUserToStorage(updatedUser);
      alert(
        `₦${rewardAmount.toLocaleString()} added to your balance for joining Telegram!`,
      );
    } else {
      alert(
        "You have already claimed your Telegram reward for today. Try again tomorrow!",
      );
    }
  };

  const handleWhatsAppClaim = () => {
    if (!user) return;
    const nowTs = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;
    const lastClaim = user.lastWhatsAppClaimTimestamp || 0;

    if (nowTs - lastClaim >= twentyFourHours) {
      const rewardAmount = 9600;
      const newTransaction: Transaction = {
        id: `trx-wa-${Date.now()}`,
        type: "credit",
        amount: rewardAmount,
        description: "Daily WhatsApp Channel Task Reward",
        date: new Date().toISOString(),
        status: "success",
      };
      const updatedUser = {
        ...user,
        balance: user.balance + rewardAmount,
        lastWhatsAppClaimTimestamp: nowTs,
        transactions: [newTransaction, ...(user.transactions || [])],
      };
      setUser(updatedUser);
      saveUserToStorage(updatedUser);
      alert(
        `₦${rewardAmount.toLocaleString()} added to your balance for joining WhatsApp channel!`,
      );
    } else {
      alert(
        "You have already claimed your WhatsApp reward for today. Try again tomorrow!",
      );
    }
  };

  const handleDailyWaitlistJoin = () => {
    if (!user) return;
    const nowTs = Date.now();
    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    const lastJoined = user.dailyWaitlistJoinedAt || 0;

    if (nowTs - lastJoined < oneWeek) {
      const remainingMs = oneWeek - (nowTs - lastJoined);
      const remainingDays = Math.floor(remainingMs / (24 * 60 * 60 * 1000));
      const remainingHours = Math.floor((remainingMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
      alert(`You can only join the Users Promo Waitlist once per week! Next attempt available in ${remainingDays}d ${remainingHours}h.`);
      return;
    }

    const updatedUser = {
      ...user,
      dailyWaitlistJoinedAt: nowTs,
      dailyWaitlistClaimedAt: undefined,
    };
    setUser(updatedUser);
    saveUserToStorage(updatedUser);
    alert("🎉 Successfully joined the Users Promo Waitlist! In 1 hour, your ₦500,000 credit will be ready to claim on your dashboard!");
  };

  const handleDailyWaitlistClaim = () => {
    if (!user || !user.dailyWaitlistJoinedAt) return;
    const nowTs = Date.now();
    const oneHour = 60 * 60 * 1000;
    const elapsed = nowTs - user.dailyWaitlistJoinedAt;

    if (elapsed < oneHour) {
      const remainingMins = Math.ceil((oneHour - elapsed) / (60 * 1000));
      alert(`Your 1-hour waitlist period is still active! Please check back in ${remainingMins} minute(s).`);
      return;
    }

    if (user.dailyWaitlistClaimedAt && user.dailyWaitlistClaimedAt >= user.dailyWaitlistJoinedAt) {
      alert("You have already claimed your ₦500,000 promo reward for this week!");
      return;
    }

    const rewardAmount = 500000;
    const newTransaction: Transaction = {
      id: `trx-waitlist-${Date.now()}`,
      type: "credit",
      amount: rewardAmount,
      description: "Users Promo Waitlist 1-Hour Reward",
      date: new Date().toISOString(),
      status: "success",
    };

    const updatedUser = {
      ...user,
      balance: user.balance + rewardAmount,
      dailyWaitlistClaimedAt: nowTs,
      transactions: [newTransaction, ...(user.transactions || [])],
    };

    setUser(updatedUser);
    saveUserToStorage(updatedUser);
    alert(`💰 CONGRATULATIONS! ₦${rewardAmount.toLocaleString()} has been credited to your dashboard balance!`);
  };

  const handleBiggyWinClaim = () => {
    if (!user) return;
    const nowTs = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;
    const lastClaim = user.lastBiggyWinClaimTimestamp || 0;

    if (nowTs - lastClaim >= twentyFourHours) {
      const rewardAmount = 10980;
      const newTransaction: Transaction = {
        id: `trx-bw-${Date.now()}`,
        type: "credit",
        amount: rewardAmount,
        description: "BIGGY WIN Daily Task Reward",
        date: new Date().toISOString(),
        status: "success",
      };
      const updatedUser = {
        ...user,
        balance: user.balance + rewardAmount,
        lastBiggyWinClaimTimestamp: nowTs,
        transactions: [newTransaction, ...(user.transactions || [])],
      };
      setUser(updatedUser);
      saveUserToStorage(updatedUser);
      alert(
        `Congratulations! ₦${rewardAmount.toLocaleString()} BIGGY WIN claimed!`,
      );
    } else {
      alert(
        "You have already claimed your BIGGY WIN reward for today. Try again tomorrow!",
      );
    }
  };

  const handleGameRewardsClaim = () => {
    if (!user) return;
    const nowTs = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;
    const lastClaim = user.lastGameRewardsClaimTimestamp || 0;

    if (nowTs - lastClaim >= twentyFourHours) {
      const rewardAmount = 5500;
      const newTransaction: Transaction = {
        id: `trx-gr-${Date.now()}`,
        type: "credit",
        amount: rewardAmount,
        description: "Daily GAME REWARDS Task Reward",
        date: new Date().toISOString(),
        status: "success",
      };
      const updatedUser = {
        ...user,
        balance: user.balance + rewardAmount,
        lastGameRewardsClaimTimestamp: nowTs,
        transactions: [newTransaction, ...(user.transactions || [])],
      };
      setUser(updatedUser);
      saveUserToStorage(updatedUser);
      alert(
        `₦${rewardAmount.toLocaleString()} GAME REWARDS added to your balance!`,
      );
    } else {
      alert(
        "You have already claimed your GAME REWARDS for today. Try again tomorrow!",
      );
    }
  };

  const handleGameResult = (win: boolean, customAmount?: number, customDesc?: string) => {
    if (!user) return;
    const amount = customAmount !== undefined ? customAmount : (win ? 2000 : 1000);
    const now = new Date();
    const lastQuiz = user.lastQuizTimestamp
      ? new Date(user.lastQuizTimestamp)
      : null;

    let newCount = (user.dailyQuizCount || 0) + 1;

    // Reset if it's a new day
    if (!lastQuiz || now.toDateString() !== lastQuiz.toDateString()) {
      newCount = 1;
    }

    const description = customDesc || (win ? "Quiz Game Win Reward" : "Quiz Game Loss Penalty");

    const newTransaction: Transaction = {
      id: `trx-game-${Date.now()}`,
      type: win ? "credit" : "debit",
      amount: amount,
      description: description,
      date: new Date().toISOString(),
      status: "success",
    };

    const newBalance = win ? user.balance + amount : user.balance - amount;

    const updatedUser = {
      ...user,
      balance: newBalance,
      dailyQuizCount: newCount,
      lastQuizTimestamp: now.getTime(),
      transactions: [newTransaction, ...(user.transactions || [])],
    };
    setUser(updatedUser);
    saveUserToStorage(updatedUser);

    if (win) {
      alert(`Congratulations! You won ₦${amount.toLocaleString()}!`);
    } else {
      alert(
        `Oops! You lost. ₦${amount.toLocaleString()} has been deducted from your balance.`,
      );
    }
  };

  useEffect(() => {
    if (currentView !== "dashboard" || !user) return;

    const adsShownKey = `chix9ja_trade_ad_views_${user.email.toLowerCase()}`;
    const initialShown = parseInt(localStorage.getItem(adsShownKey) || "0", 10);
    if (initialShown >= 2) {
      return;
    }

    const interval = setInterval(() => {
      const currentShown = parseInt(
        localStorage.getItem(adsShownKey) || "0",
        10,
      );
      if (currentShown < 2) {
        setShowQuizAd(true);
        localStorage.setItem(adsShownKey, (currentShown + 1).toString());
      } else {
        clearInterval(interval);
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [currentView, user?.email]);

  if (currentView === "register")
    return (
      <div className={darkMode ? "dark" : ""}>
        <Register
          onRegister={handleRegister}
          onSwitchToLogin={() => setCurrentView("login")}
          defaultReferralCode={initialRefCode}
        />
      </div>
    );
  if (currentView === "login")
    return (
      <div className={darkMode ? "dark" : ""}>
        <Login
          onLogin={handleLogin}
          onSwitchToRegister={() => setCurrentView("register")}
        />
      </div>
    );
  if (currentView === "payment-callback")
    return (
      <PaymentCallback
        onVerificationComplete={() => {
          const activeEmail = localStorage.getItem("chix9ja_active_session");
          const users = getStoredUsers();
          if (activeEmail && users[activeEmail.toLowerCase()]) {
            setUser(users[activeEmail.toLowerCase()]);
            setCurrentView("dashboard");
          } else {
            setCurrentView("login");
          }
        }}
      />
    );

  const nowTs = Date.now();
  const twentyFourHours = 24 * 60 * 60 * 1000;
  const isClaimable =
    nowTs - rewardStatus.lastClaimedTimestamp >= twentyFourHours;

  const pageTitles: Record<string, string> = {
    community: "VIP Community",
    advertise: "Advertise Campaign",
    loan: "UX-Trade Desk",
    "ux-trade": "UX-Trade Desk",
    finance: "ChixTok Tutorials",
    reward: "Rewards",
    me: "My Profile",
    card_clearance: "Bank Payment Card Clearance",
    referrals: "Referrals Control",
    subscribe: "Subscribe",
    subscribe_payment: "Payment Details",
    send_money: "Withdraw",
    buy_service: serviceType === "airtime" ? "Buy Airtime" : "Buy Data",
    sync_account: "Sync Account",
    admin: "Admin Panel",
    transaction_history: "Transactions",
    imminent_payment: "Activation",
    invest: "Investment",
    task_dashboard:
      taskMode === "quiz"
        ? "Quiz Game"
        : taskMode === "telegram"
          ? "Task"
          : "Tasks",
    upgrade_proposal: "VIP Membership",
    upgrade_payment: "Confirm VIP Status",
    business_hub: "ChixTok Tutorials",
    chixtok: "ChixTok Tutorials",
    notifications: "Feed",
    receipt: "Receipt",
    link_withdraw_account: "Account Hosting",
    how_it_works: "How It Works",
    deposit: "Deposit Funds",
  };

  // Intercept and render standalone full-screen Admin Portal for /admin routes
  const isAdminRoute = window.location.pathname === "/admin" || window.location.pathname.startsWith("/admin/");

  if (isAdminRoute) {
    const handleAdminLogin = (e: React.FormEvent) => {
      e.preventDefault();
      const code = adminPasscode.trim().toUpperCase();
      if (code === "9090" || code === "CHIX9090" || code === "ADMIN" || code === "CHIXADMIN" || code === "CHIX9JA") {
        localStorage.setItem("chix9ja_admin_logged_in", "true");
        setIsAdminLoggedIn(true);
        setAdminLoginError("");
      } else {
        setAdminLoginError("Invalid Administrator Passcode. Please try again.");
      }
    };

    if (!isAdminLoggedIn) {
      return (
        <div className="min-h-screen bg-zinc-950 font-sans text-white flex items-center justify-center p-6 relative overflow-hidden">
          {/* Neon background decorations */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-glow/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-fuchsia-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="w-full max-w-md bg-zinc-900/85 backdrop-blur-xl border border-zinc-800 rounded-3xl p-8 shadow-2xl relative z-10">
            {/* Header / Brand */}
            <div className="text-center space-y-3 mb-8">
              <div className="w-16 h-16 bg-gradient-to-tr from-green-light to-green-glow rounded-2xl flex items-center justify-center mx-auto shadow-green-lg">
                <Icons.Lock size={28} className="text-black stroke-[2.5]" />
              </div>
              <div>
                <h1 className="text-2xl font-black uppercase tracking-wider text-white">
                  Chix9ja Admin
                </h1>
                <p className="text-[10px] text-zinc-500 font-mono tracking-widest uppercase mt-1">
                  Secure Administrative Console
                </p>
              </div>
            </div>

            <form onSubmit={handleAdminLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400">
                  Access Code
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 font-mono text-sm font-black">
                    #
                  </span>
                  <input
                    type="password"
                    value={adminPasscode}
                    onChange={(e) => setAdminPasscode(e.target.value)}
                    placeholder="Enter admin passcode"
                    className="w-full pl-9 pr-4 py-4 bg-black/50 border border-zinc-800 focus:border-green-glow/50 rounded-2xl text-sm font-bold tracking-widest text-center text-white outline-none transition-all placeholder:text-zinc-700 uppercase"
                    autoFocus
                  />
                </div>
                {adminLoginError && (
                  <p className="text-xs text-red-500 font-medium text-center bg-red-950/20 border border-red-900/30 p-3 rounded-xl">
                    ⚠️ {adminLoginError}
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-green-glow text-black font-black rounded-2xl shadow-lg hover:shadow-green-glow/20 hover:scale-[1.01] active:scale-[0.99] transition-all uppercase tracking-widest text-xs"
              >
                Sign In to Dashboard
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-zinc-800 text-center space-y-2">
              <button
                onClick={() => {
                  window.location.href = '/';
                }}
                className="text-xs text-zinc-400 hover:text-white font-semibold transition-colors uppercase tracking-wider flex items-center justify-center gap-1.5 mx-auto"
              >
                <Icons.Home size={14} />
                Return to main application
              </button>
              <p className="text-[9px] text-zinc-600 font-mono">
                Unauthorized access to this panel is strictly monitored and logged.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-black font-sans text-white transition-colors duration-200">
        <header className="bg-zinc-950 border-b border-zinc-900 px-6 py-4 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-tr from-green-light to-green-glow rounded-xl flex items-center justify-center shadow-md">
                <Icons.Lock size={18} className="text-black stroke-[2.5]" />
              </div>
              <div>
                <h1 className="text-lg font-black uppercase tracking-wider text-white">Chix9ja Central Management</h1>
                <p className="text-[9px] text-green-glow font-mono tracking-widest uppercase">STANDALONE SYSTEM CONTROLS • ACTIVE ADMIN SESSION</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => {
                  window.location.href = '/';
                }}
                className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 text-zinc-300 text-xs font-black rounded-xl uppercase tracking-wider transition-all flex items-center gap-1.5"
              >
                <Icons.Home size={14} />
                Go to Main App
              </button>
              <button
                onClick={() => {
                  localStorage.removeItem("chix9ja_admin_logged_in");
                  setIsAdminLoggedIn(false);
                }}
                className="px-4 py-2.5 bg-red-950/30 hover:bg-red-900/40 border border-red-900/40 text-red-400 text-xs font-black rounded-xl uppercase tracking-wider transition-all"
              >
                Logout Session
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-6 py-8">
          <AdminDashboard onBack={() => {
            window.location.href = '/';
          }} />
        </main>
      </div>
    );
  }

  if (showSplashScreen) {
    return (
      <div className="min-h-screen bg-[#130f04] font-sans text-white flex flex-col items-center justify-center p-6 select-none relative overflow-hidden transition-colors duration-200">
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-green-glow/5 blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 translate-y-1/2 w-96 h-96 rounded-full bg-amber-500/5 blur-[150px] pointer-events-none"></div>

        {/* Ambient Grid Accent */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_at_center,black_60%,transparent_100%)] pointer-events-none"></div>

        <div className="flex flex-col items-center max-w-sm w-full space-y-10 z-10 animate-in fade-in zoom-in-95 duration-700">
          
          {/* Animated Logo */}
          <div className="relative">
            {/* Outer dotted spinning ring */}
            <div className="absolute -inset-6 border border-dashed border-green-glow/20 rounded-full animate-[spin_20s_linear_infinite]"></div>
            
            {/* Middle glowing decorative ring */}
            <div className="absolute -inset-3 border border-green-glow/40 rounded-full animate-[spin_10s_linear_infinite_reverse]"></div>
            
            {/* Pulse flare */}
            <div className="absolute inset-0 bg-green-glow/25 rounded-full blur-xl scale-95 animate-pulse"></div>

            {/* Core Circle */}
            <div className="relative w-28 h-28 sm:w-32 sm:h-32 bg-green-glow rounded-full flex items-center justify-center shadow-[0_0_60px_rgba(0,255,65,0.5)] border border-green-light/40 transform hover:scale-105 transition-all duration-300">
              <span className="text-black font-black text-4xl sm:text-5xl italic tracking-tighter drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">Cx</span>
            </div>
          </div>

          {/* Branding Texts */}
          <div className="text-center space-y-3">
            <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-[0.2em] bg-gradient-to-r from-white via-green-glow to-white bg-clip-text text-transparent drop-shadow-[0_2px_10px_rgba(0,255,65,0.2)] animate-[pulse_2.5s_infinite]">
              chix9ja
            </h1>
            <p className="text-[10px] sm:text-xs text-zinc-500 font-mono tracking-[0.25em] uppercase leading-relaxed max-w-xs mx-auto">
              Secure Instant Settlement Node
            </p>
          </div>

          {/* Loader Container */}
          <div className="flex flex-col items-center space-y-3 pt-6 w-full max-w-[240px]">
            {/* Percentage Display */}
            <div className="font-mono text-xs sm:text-sm font-black text-green-glow tracking-widest text-glow-green">
              {String(splashProgress).padStart(3, '0')}%
            </div>
            
            {/* Linear Progress Bar */}
            <div className="w-full h-1.5 bg-zinc-950 border border-zinc-850 rounded-full overflow-hidden relative shadow-inner">
              <div 
                className="h-full bg-gradient-to-r from-green-light to-green-glow shadow-[0_0_8px_#00FF41] rounded-full transition-all duration-75 ease-out"
                style={{ width: `${splashProgress}%` }}
              ></div>
            </div>
          </div>

          {/* Bottom Security Seals */}
          <div className="pt-8 flex flex-col items-center space-y-2">
            <div className="flex items-center gap-1.5 text-[8px] sm:text-[9px] text-zinc-600 font-mono uppercase tracking-[0.2em]">
              <Icons.ShieldCheck size={11} className="text-green-glow" />
              <span>CBN Licensed Partner Gateway</span>
            </div>
            <p className="text-[8px] text-zinc-700 font-mono">SYSTEM VERSION 4.12.0 • ONLINE</p>
          </div>
        </div>
      </div>
    );
  }

  if (user?.isRestricted) {
    return (
      <Restricted
        restoreTime={user.restrictionRestoreTime}
        customRecoveryCode={user.banRecoveryCode}
        onRestore={handleManualRestore}
        vendorTelegramLink={channels.vendorTelegram}
      />
    );
  }

  return (
    <div className={darkMode ? "dark" : ""}>
      <div className="min-h-screen bg-black font-sans text-white transition-colors duration-200 relative">
        <FloatingMoneyBackground />
        <div className="max-w-md mx-auto bg-black/90 min-h-screen relative shadow-2xl transition-colors duration-200 z-10">
          <div className="pb-24">
            {activeTab !== "reward" &&
              activeTab !== "admin" &&
              activeTab !== "imminent_payment" &&
              activeTab !== "task_dashboard" &&
              activeTab !== "business_hub" &&
              activeTab !== "finance" &&
              activeTab !== "notifications" &&
              activeTab !== "receipt" &&
              activeTab !== "loan" &&
              activeTab !== "ux-trade" &&
              activeTab !== "invest" &&
              activeTab !== "community" &&
              activeTab !== "advertise" &&
              activeTab !== "card_clearance" &&
              activeTab !== "deposit" && (
                <Header
                  userName={user?.name}
                  profileImage={user?.profileImage}
                  onLogout={handleLogout}
                  showBack={activeTab !== "home"}
                  onBack={handleBack}
                  pageTitle={pageTitles[activeTab]}
                  hasUnread={hasUnreadNotifications}
                  isSubscribed={user?.isSubscribed}
                  isVIP={user?.isVIP}
                  onNotificationClick={() => {
                    setActiveTab("notifications");
                    setHasUnreadNotifications(false);
                  }}
                  onInfoClick={() => setActiveTab("how_it_works")}
                />
              )}
            {activeTab === "me" ? (
              <Profile
                user={user!}
                onUpdateProfile={handleUpdateProfile}
                onLinkAccountClick={() => setActiveTab("link_withdraw_account")}
                onCardClearanceClick={() => setActiveTab("card_clearance")}
                darkMode={darkMode}
                toggleDarkMode={toggleDarkMode}
                onLogout={handleLogout}
                vendorTelegramLink={channels.vendorTelegram}
              />
            ) : activeTab === "card_clearance" && user ? (
              <CardClearance
                user={user}
                onUpdateProfile={handleUpdateProfile}
                onBack={handleBack}
              />
            ) : activeTab === "referrals" && user ? (
              <Referrals user={user} onBack={handleBack} />
            ) : activeTab === "reward" ? (
              <Rewards
                currentDay={rewardStatus.currentDay}
                canClaim={isClaimable}
                onClaim={handleClaimReward}
                lastClaimedTimestamp={rewardStatus.lastClaimedTimestamp}
                onBack={handleBack}
              />
            ) : (activeTab === "loan" || activeTab === "ux-trade") && user ? (
              <UXTrade
                user={user}
                onUpdateUser={handleUpdateProfile}
                onBack={handleBack}
              />
            ) : activeTab === "invest" && user ? (
              <Investment
                user={user}
                onBack={handleBack}
                onUpdateUser={handleUpdateProfile}
              />
            ) : activeTab === "subscribe" ? (
              <Subscribe
                onPlanSelect={handlePlanSelect}
                userBalance={user?.balance || 0}
              />
            ) : activeTab === "subscribe_payment" && selectedPlan ? (
              <SubscribePayment
                plan={selectedPlan}
                userEmail={user?.email || ""}
                onPaymentComplete={handlePaymentComplete}
              />
            ) : activeTab === "upgrade_proposal" ? (
              <UpgradeProposal
                user={user}
                onProceed={(tier) => {
                  setSelectedVipTier(tier);
                  setActiveTab("upgrade_payment");
                }}
                onGoToSubscribe={() => setActiveTab("subscribe")}
                onGoToWithdraw={() => setActiveTab("send_money")}
                onBack={handleBack}
              />
            ) : activeTab === "upgrade_payment" ? (
              <UpgradePayment
                userEmail={user?.email || ""}
                selectedVipTier={selectedVipTier}
                user={user}
                onPaymentComplete={handlePaymentComplete}
                onBack={() => setActiveTab("upgrade_proposal")}
              />
            ) : (activeTab === "business_hub" || activeTab === "finance" || activeTab === "chixtok") &&
              user ? (
              <ChixTok
                user={user}
                onUpdateUser={(updated) => {
                  setUser(updated);
                  saveUserToStorage(updated);
                }}
                onNavigateToDeposit={() => setActiveTab("deposit")}
                onBack={handleBack}
              />
            ) : activeTab === "link_withdraw_account" && user ? (
              <LinkWithdrawAccount
                user={user}
                onBack={() => setActiveTab("home")}
              />
            ) : activeTab === "how_it_works" ? (
              <HowItWorks
                onBack={handleBack}
                onPlayQuiz={() => {
                  setTaskMode("quiz");
                  setActiveTab("task_dashboard");
                }}
                onSubscribe={() => setActiveTab("subscribe")}
              />
            ) : activeTab === "notifications" ? (
              <NotificationFeed
                user={user!}
                onUpdateUser={handleUpdateProfile}
                onBack={handleBack}
              />
            ) : activeTab === "community" ? (
              <CommunityPage
                user={user!}
                onBack={handleBack}
                onGoToUpgrade={() => setActiveTab("upgrade_proposal")}
              />
            ) : activeTab === "advertise" ? (
              <AdvertisePage
                user={user!}
                onBack={handleBack}
                onGoToSubscribe={() => setActiveTab("subscribe")}
              />
            ) : activeTab === "promo" ? (
              <PromoPage
                user={user!}
                onUpdateUser={handleUpdateProfile}
                onBack={handleBack}
                onGoToSubscribe={() => setActiveTab("subscribe")}
              />
            ) : activeTab === "send_money" ? (
              <SendMoney
                user={user!}
                onTransfer={handleTransfer}
                onSubscribeRedirect={() => setActiveTab("subscribe")}
                onGoHome={(showFailedMessage) => {
                  setActiveTab("home");
                  if (showFailedMessage === true) {
                    setShowWithdrawFailedPopup(true);
                  }
                }}
                onRequestFreeWithdrawal={() =>
                  setShowWithdrawReferralAdvert(true)
                }
              />
            ) : activeTab === "buy_service" ? (
              <BuyAirtimeData
                type={serviceType}
                user={user!}
                onPurchase={handleServicePurchase}
                onBack={() => setActiveTab("home")}
              />
            ) : activeTab === "deposit" && user ? (
              <DepositPage
                user={user}
                onBack={handleBack}
                onUpdateUser={handleUpdateProfile}
                onViewHistory={() => setActiveTab("transaction_history")}
              />
            ) : activeTab === "sync_account" ? (
              <SyncAccount user={user!} onRestore={handleRestoreAccount} />
            ) : activeTab === "admin" ? (
              <AdminDashboard onBack={handleBack} />
            ) : activeTab === "transaction_history" ? (
              <TransactionHistory
                user={user!}
                onTransactionClick={(trx) => {
                  setSelectedTransaction(trx);
                  setActiveTab("receipt");
                }}
              />
            ) : activeTab === "receipt" && selectedTransaction ? (
              <TransactionReceipt
                transaction={selectedTransaction}
                userName={user?.name || "User"}
                onBack={() => {
                  setSelectedTransaction(null);
                  setActiveTab("transaction_history");
                }}
              />
            ) : activeTab === "imminent_payment" ? (
              <ImminentPayment user={user!} onBack={handleBack} />
            ) : activeTab === "task_dashboard" ? (
              <TaskPage
                user={user!}
                onTelegramClaim={handleTelegramClaim}
                onTelegramClaim2={handleTelegramClaim2}
                onWhatsAppClaim={handleWhatsAppClaim}
                onDailyWaitlistJoin={handleDailyWaitlistJoin}
                onDailyWaitlistClaim={handleDailyWaitlistClaim}
                onBiggyWinClaim={handleBiggyWinClaim}
                onGameRewardsClaim={handleGameRewardsClaim}
                onGameResult={handleGameResult}
                onBack={handleBack}
                mode={taskMode}
              />
            ) : (
              <main className="px-4 py-2 space-y-4 animate-in fade-in duration-500">
                {user?.adminNotifications &&
                  user.adminNotifications
                    .filter((n) => {
                      if (n.isEmail) return false;
                      if (!n.seenAt) return true; // Keep unseen notifications
                      return now - n.seenAt < 60 * 60 * 1000;
                    })
                    .map((n) => {
                      const remainingMins = n.seenAt
                        ? Math.max(0, Math.ceil((60 * 60 * 1000 - (now - n.seenAt)) / (60 * 1000)))
                        : 60;

                      return (
                        <div
                          key={n.id}
                          className="bg-black border-2 border-green-glow rounded-xl p-4 shadow-green space-y-3 relative overflow-hidden animate-in slide-in-from-top-4 duration-500"
                        >
                          <div className="absolute top-0 right-0 w-32 h-32 bg-green-glow/5 rounded-full blur-2xl pointer-events-none" />

                          <div className="flex items-center justify-between relative z-10">
                            <div className="flex items-center space-x-2">
                              <span className="flex h-2 w-2 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-glow opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-glow"></span>
                              </span>
                              <span className="text-[11px] font-black uppercase tracking-widest text-green-glow text-glow-green">
                                ADMIN MESSAGE
                              </span>
                            </div>
                            <div className="flex items-center space-x-1 text-gray-400 bg-gray-950 px-2 py-0.5 rounded-md text-[10px] font-bold border border-gray-800">
                              <Icons.Clock
                                size={11}
                                className="text-green-glow"
                              />
                              <span className="uppercase tracking-wider">
                                {n.seenAt ? `DELETING IN ${remainingMins}M` : "NOT SEEN YET"}
                              </span>
                            </div>
                          </div>

                          <p className="text-white text-xs font-bold leading-relaxed whitespace-pre-line pr-1 relative z-10">
                            {n.message}
                          </p>
                        </div>
                      );
                    })}
                {hasUnreadNotifications && (
                  <div
                    onClick={() => {
                      setActiveTab("notifications");
                      setHasUnreadNotifications(false);
                    }}
                    className="bg-green-glow text-black p-3 rounded-xl shadow-lg flex items-center justify-between cursor-pointer border border-green-dark animate-in slide-in-from-top-4 duration-500"
                  >
                    <div className="flex items-center space-x-2">
                      <Icons.MessageCircle
                        fill="currentColor"
                        size={18}
                        className="text-black/70"
                      />
                      <span className="text-sm font-black uppercase tracking-tight">
                        New Message Arrived
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="text-[10px] font-bold bg-black/10 px-2 py-0.5 rounded">
                        VIEW FEED
                      </span>
                      <Icons.ChevronRight size={14} />
                    </div>
                  </div>
                )}
                {user?.isVIP && !user?.isSubscribed && (
                  <div className="bg-gradient-to-r from-green-glow to-green-dark text-black p-3 rounded-xl shadow-md flex items-center justify-between animate-in slide-in-from-top-4 duration-500">
                    <div className="flex items-center space-x-2">
                      <Icons.Zap
                        fill="currentColor"
                        size={20}
                        className="text-black/70"
                      />
                      <span className="text-sm font-black uppercase tracking-tight">
                        VIP MODE ACTIVE
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-bold opacity-80">
                        BUSINESS FUNDS
                      </span>
                      <span className="text-xs font-black bg-black/20 px-2 py-0.5 rounded">
                        ₦{(user.vipBalance || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}
                {isDeactivated && (
                  <div className="bg-black text-white p-4 rounded-xl shadow-lg mb-4 flex items-start space-x-3 animate-pulse border-2 border-red-600">
                    <Icons.Ban
                      className="flex-shrink-0 text-red-500"
                      size={24}
                    />
                    <div>
                      <h3 className="font-bold text-sm uppercase tracking-wide text-red-500">
                        Account Deactivated
                      </h3>
                      <p className="text-xs mt-1 font-medium leading-relaxed">
                        User must pay 20,000 naira to activate account, using a
                        POS.
                      </p>
                    </div>
                  </div>
                )}
                {showImminentWarning && user?.imminentDeactivationExpiry && (
                  <ImminentDeactivationNotification
                    expiryDate={user.imminentDeactivationExpiry}
                  />
                )}
                {user?.hasDeclinedReceiptWarning && (
                  <div className="fixed inset-0 z-[250] flex items-center justify-center px-6 bg-black/95 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-zinc-950 border-2 border-red-500 rounded-3xl p-8 w-full max-w-sm text-center space-y-6 shadow-[0_0_80px_rgba(239,68,68,0.35)] relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent"></div>

                      <div className="flex justify-center">
                        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center border-2 border-red-500/20 animate-pulse">
                          <Icons.AlertTriangle size={44} className="text-red-500" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h2 className="text-xl font-black text-white uppercase tracking-wider font-mono">
                          ⚠️ PROOF DECLINED
                        </h2>
                        <p className="text-red-500 font-bold text-xs uppercase tracking-widest font-mono">
                          CRITICAL WARNING NOTICE
                        </p>
                      </div>

                      <div className="bg-red-950/20 p-5 rounded-2xl border border-red-900/40 text-left">
                        <p className="text-xs font-bold leading-relaxed text-red-200 uppercase font-mono tracking-normal">
                          Dear member, your submitted payment proof receipt has been <span className="underline decoration-red-500 font-black text-white">REJECTED</span> by our automatic verification node.
                        </p>
                        <p className="text-xs font-black mt-3 leading-relaxed text-red-400 font-mono uppercase">
                          WARNING: SUBMITTING WRONG OR INAUTHENTIC PAYMENT RECEIPTS WILL LEAD TO AN INSTANT AND PERMANENT BAN OF YOUR CHIX9JA ACCOUNT AND IP ADDRESS.
                        </p>
                      </div>

                      <button
                        onClick={async () => {
                          const lowerEmail = user.email.toLowerCase().trim();
                          const updatedUser = {
                            ...user,
                            hasDeclinedReceiptWarning: false
                          };
                          setUser(updatedUser);
                          
                          // Save locally
                          const freshUsersStr = localStorage.getItem('chix9ja_users');
                          if (freshUsersStr) {
                            const freshUsers = JSON.parse(freshUsersStr);
                            freshUsers[lowerEmail] = updatedUser;
                            localStorage.setItem('chix9ja_users', JSON.stringify(freshUsers));
                          }
                          
                          try {
                            const { doc, setDoc } = await import('firebase/firestore');
                            const { db } = await import('./firebase');
                            await setDoc(doc(db, 'users', lowerEmail), { hasDeclinedReceiptWarning: false }, { merge: true });
                          } catch (e) {
                            console.error("Error clearing declined warning on Firestore:", e);
                          }
                        }}
                        className="w-full py-4 bg-red-650 hover:bg-red-500 text-white font-extrabold rounded-2xl shadow-lg transition-all active:scale-95 uppercase tracking-widest text-xs font-mono"
                      >
                        I AGREE & UNDERSTAND
                      </button>

                      <div className="flex items-center justify-center space-x-2 text-[9px] text-zinc-650 font-bold uppercase tracking-wider font-mono">
                        <Icons.ShieldCheck size={12} className="text-red-500" />
                        <span>Chix9ja Central Security Grid</span>
                      </div>
                    </div>
                  </div>
                )}
                {!user?.isSubscribed &&
                  !isDeactivated &&
                  !showImminentWarning && (
                    <SubscriptionNotification
                      onSubscribe={() => setActiveTab("subscribe")}
                    />
                  )}
                {user?.isSubscribed &&
                  user?.subscriptionExpiryDate &&
                  !isDeactivated &&
                  !showImminentWarning && (
                    <ActiveSubscriptionNotification
                      planName={user.subscriptionPlan || "Premium Plan"}
                      expiryDate={user.subscriptionExpiryDate}
                    />
                  )}
                {hasPendingWithdrawal && !isDeactivated && (
                  <div
                    onClick={() => setActiveTab("upgrade_proposal")}
                    className="bg-blue-600 text-white p-4 rounded-xl shadow-lg mb-4 flex items-start space-x-3 cursor-pointer animate-in slide-in-from-top-4 duration-500 border-l-4 border-blue-400"
                  >
                    <div className="p-2 bg-white/20 rounded-lg">
                      <Icons.Upgrade size={20} className="text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm uppercase tracking-wide">
                        Withdrawal Pending
                      </h3>
                      <p className="text-xs mt-1 font-medium leading-relaxed">
                        Upgrade to VIP to remove your transaction on pending so
                        your alerts drop immediately.
                      </p>
                    </div>
                  </div>
                )}
                <BalanceCard
                  balance={user?.balance || 0}
                  isSubscribed={user?.isSubscribed}
                  isVIP={user?.isVIP}
                  subscriptionPlan={user?.subscriptionPlan}
                  onAdminClick={() => setActiveTab("admin")}
                  onHistoryClick={() => setActiveTab("transaction_history")}
                  onDepositClick={() => setActiveTab("deposit")}
                />
                <ActionGrid
                  onActionClick={handleGridAction}
                  balance={user?.balance || 0}
                />

                {/* Dynamic App Installation Action Card */}
                <div 
                  onClick={() => setShowInstallPopup(true)}
                  className="bg-zinc-950 border border-zinc-800 p-4 rounded-3xl flex items-center justify-between cursor-pointer hover:border-green-glow/50 transition-all group relative overflow-hidden shadow-lg"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-green-glow/5 rounded-full blur-2xl pointer-events-none group-hover:bg-green-glow/10 transition-all" />
                  <div className="flex items-center space-x-3.5 z-10">
                    <div className="w-11 h-11 bg-green-glow/10 border border-green-glow/20 rounded-2xl flex items-center justify-center text-green-glow group-hover:scale-105 transition-transform">
                      <Icons.Download size={20} className="stroke-[2.2]" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-extrabold text-white text-xs uppercase tracking-wider flex items-center space-x-2">
                        <span>Install chix9ja App</span>
                        <span className="flex h-1.5 w-1.5 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-glow opacity-80"></span>
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-glow"></span>
                        </span>
                      </h3>
                      <p className="text-[10px] text-gray-400 mt-0.5 font-bold uppercase tracking-tight leading-none font-mono">
                        Instant Settlements & Fast Android Access
                      </p>
                    </div>
                  </div>
                  <div className="p-1 bg-zinc-900 border border-zinc-800 rounded-lg text-gray-400 group-hover:text-green-glow group-hover:border-green-glow/30 transition-all z-10">
                    <Icons.ChevronRight size={15} />
                  </div>
                </div>

                <Banner />
              </main>
            )}
          </div>
          {currentView === "dashboard" &&
            activeTab === "home" &&
            user?.notificationPreferences && (
              <LiveNotifications preferences={user.notificationPreferences} />
            )}
          {currentView === "dashboard" &&
            activeTab !== "ux-trade" &&
            activeTab !== "loan" &&
            !user?.isSubscribed && <SystemNotification />}
          {activeTab !== "admin" &&
            activeTab !== "imminent_payment" &&
            activeTab !== "task_dashboard" &&
            activeTab !== "notifications" &&
            activeTab !== "receipt" && (
              <BottomNav
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                user={user}
              />
            )}
          {showVipNotice &&
            activeTab !== "ux-trade" &&
            activeTab !== "loan" && (
              <div className="fixed inset-0 z-[200] flex items-center justify-center px-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
                <div className="bg-gray-900 border border-green-glow/30 rounded-3xl p-8 w-full max-w-sm text-center space-y-6 shadow-[0_0_50px_rgba(0,255,127,0.2)] relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-glow to-transparent"></div>

                  <div className="flex justify-center">
                    <div className="w-20 h-20 bg-green-glow/20 rounded-full flex items-center justify-center animate-bounce">
                      <Icons.Reward size={44} className="text-green-glow" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-2xl font-black text-white uppercase tracking-tight">
                      Congratulations!
                    </h2>
                    <p className="text-green-glow font-bold text-sm">
                      {user?.isAccountLinkedVerified
                        ? "Withdrawal Account Linked"
                        : "Your Withdrawal is Successful"}
                    </p>
                  </div>

                  <div className="bg-black/40 p-5 rounded-2xl border border-gray-800">
                    <p className="text-sm font-medium leading-relaxed text-gray-300">
                      {user?.isAccountLinkedVerified
                        ? "Congratulations for linking your withdrawal account! For your alert to be verified, you will need to invest on chix9ja, that's all."
                        : "Congratulations for making your first withdrawal! For your alert to be verified, you will need to invest on chix9ja, that's all."}
                    </p>
                  </div>

                  <button
                    onClick={() => setShowVipNotice(false)}
                    className="w-full py-4 bg-green-glow text-black font-black rounded-2xl shadow-lg hover:shadow-green-glow/20 transition-all active:scale-95 uppercase tracking-widest"
                  >
                    GOT IT!
                  </button>

                  <div className="flex items-center justify-center space-x-2 text-[10px] text-gray-500 font-bold uppercase">
                    <Icons.ShieldCheck size={12} className="text-green-glow" />
                    <span>Secure Verification System</span>
                  </div>
                </div>
              </div>
            )}
          {(showWelcomeAd || (user && user.hasJoinedTelegram === false)) &&
            activeTab !== "ux-trade" &&
            activeTab !== "loan" && (
              <TelegramAd
                onJoin={() => {
                  window.open(channels.telegramChannel, "_blank");
                  if (user) {
                    handleUpdateProfile({ hasJoinedTelegram: true });
                  }
                }}
                onContinue={() => {
                  setShowWelcomeAd(false);
                  if (user) {
                    handleUpdateProfile({ hasJoinedTelegram: true });
                  }
                }}
              />
            )}
          {showWithdrawReferralAdvert &&
            activeTab !== "ux-trade" &&
            activeTab !== "loan" && (
              <div className="fixed inset-0 z-[200] flex items-center justify-center px-6 bg-black/85 backdrop-blur-sm animate-in fade-in duration-300">
                <div className="bg-gray-900 border border-amber-500/30 rounded-3xl p-8 w-full max-w-sm text-center space-y-6 shadow-[0_0_50px_rgba(245,158,11,0.25)] relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent"></div>

                  <div className="flex justify-center">
                    <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center animate-pulse">
                      <Icons.Gift size={44} className="text-amber-500" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-2xl font-black text-white uppercase tracking-tight">
                      Free Withdrawal?
                    </h2>
                    <p className="text-amber-500 font-bold text-xs uppercase tracking-wider">
                      Special Referral Offer
                    </p>
                  </div>

                  <div className="bg-black/50 p-6 rounded-2xl border border-gray-800/80">
                    <p className="text-sm font-bold leading-relaxed text-gray-200">
                      Need free withdrawal? Get up to 30 referrals and withdraw
                      freely!
                    </p>
                  </div>

                  <div className="flex flex-col space-y-3">
                    <button
                      onClick={() => {
                        setShowWithdrawReferralAdvert(false);
                        setActiveTab("referrals");
                      }}
                      className="w-full py-4 bg-amber-500 text-black font-black rounded-2xl shadow-lg hover:shadow-amber-500/20 hover:bg-amber-400 transition-all active:scale-95 uppercase tracking-widest text-xs font-sans"
                    >
                      Proceed to Referrals
                    </button>

                    <button
                      onClick={() => {
                        setShowWithdrawReferralAdvert(false);
                        setActiveTab("subscribe");
                      }}
                      className="w-full py-3 bg-gray-800 text-white font-bold rounded-2xl hover:bg-gray-700 transition-all active:scale-95 text-xs font-sans"
                    >
                      Or Subscribe to Premium
                    </button>

                    <button
                      onClick={() => setShowWithdrawReferralAdvert(false)}
                      className="text-gray-500 hover:text-gray-300 text-xs font-semibold py-1 transition-colors font-sans"
                    >
                      Close
                    </button>
                  </div>

                  <div className="flex items-center justify-center space-x-2 text-[9px] text-gray-500 font-bold uppercase tracking-wider">
                    <Icons.ShieldCheck size={12} className="text-amber-500" />
                    <span>Verified Referral Program</span>
                  </div>
                </div>
              </div>
            )}
          {showWithdrawFailedPopup && (
            <div className="fixed inset-0 z-[260] flex items-center justify-center px-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
              <div className="bg-gray-950 border border-red-800/40 rounded-3xl p-6 w-full max-w-sm text-center space-y-4 shadow-[0_0_50px_rgba(239,68,68,0.25)] relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent"></div>
                
                <div className="flex justify-center">
                  <div className="w-16 h-16 rounded-full bg-red-950/40 border border-red-500/30 flex items-center justify-center text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)] animate-pulse">
                    <Icons.AlertTriangle size={32} />
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-black text-white uppercase tracking-tight">
                    Withdrawal Failed
                  </h3>
                  <p className="text-xs text-gray-400 leading-relaxed font-medium">
                    withdraw failed because user is not a subscribed member
                  </p>
                </div>

                <div className="pt-2 space-y-2">
                  <button
                    onClick={() => {
                      setShowWithdrawFailedPopup(false);
                      setActiveTab("subscribe");
                    }}
                    className="w-full py-3 bg-amber-400 hover:bg-amber-500 text-black font-extrabold rounded-full text-xs shadow-md transition-all active:scale-95"
                  >
                    Subscribe Now
                  </button>
                  <button
                    onClick={() => setShowWithdrawFailedPopup(false)}
                    className="w-full py-3 bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-white font-bold rounded-full text-xs transition-all border border-gray-800"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
          {showInstallPopup && (
            <div className="fixed inset-0 z-[250] flex items-center justify-center px-6 bg-black/85 backdrop-blur-sm animate-in fade-in duration-300">
              <div className="bg-gray-900 border-2 border-green-glow/40 rounded-3xl p-8 w-full max-w-sm text-center space-y-6 shadow-[0_0_60px_rgba(0,255,163,0.3)] relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-transparent via-green-glow to-transparent"></div>

                {!isInstalling ? (
                  <>
                    <div className="flex justify-center">
                      <div className="w-24 h-24 rounded-full bg-gradient-to-b from-amber-300 via-yellow-400 to-amber-600 p-[3px] shadow-[0_0_25px_rgba(0,255,163,0.3)] animate-pulse relative">
                        {/* Green Polished interior of the coin */}
                        <div className="w-full h-full rounded-full bg-gradient-to-tr from-emerald-950 via-emerald-900 to-teal-950 flex items-center justify-center border border-yellow-500/30 overflow-hidden relative">
                          {/* Inner gold circular rim line */}
                          <div className="absolute inset-2.5 rounded-full border border-dashed border-yellow-500/40" />
                          
                          {/* ₦ Naira Symbol inside */}
                          <span className="text-4xl font-black font-sans bg-clip-text text-transparent bg-gradient-to-b from-amber-100 via-yellow-400 to-amber-500 drop-shadow-[0_3px_6px_rgba(0,0,0,0.6)] select-none">
                            ₦
                          </span>
                        </div>
                        
                        {/* Verified Badge / Notification dot */}
                        <span className="absolute -bottom-1 -right-1 flex h-6 w-6">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-glow opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-6 w-6 bg-green-glow border-2 border-gray-900 flex items-center justify-center text-[10px] text-black font-black">
                            ✓
                          </span>
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="inline-flex items-center space-x-1 px-3 py-1 bg-green-glow/15 rounded-full border border-green-glow/25 text-[10px] text-green-glow font-mono font-black uppercase tracking-wider">
                        🤖 Android Optimization Detected
                      </div>
                      <h2 className="text-2xl font-black text-white uppercase tracking-tight">
                        Install chix9ja
                      </h2>
                      <p className="text-xs text-gray-400 leading-relaxed font-medium">
                        Get instant, lightning-fast settlements, live alerts, and frictionless USD/crypto trading right from your device drawer. Only 4.8 MB.
                      </p>
                    </div>

                    <div className="bg-black/55 p-4 rounded-2xl border border-gray-800 text-left space-y-2 font-mono text-[11px] text-gray-400">
                      <div className="flex justify-between border-b border-gray-800/50 pb-1.5">
                        <span>Package Name:</span>
                        <span className="text-white font-bold">com.chix9ja.pwa</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-800/50 pb-1.5">
                        <span>Security Check:</span>
                        <span className="text-emerald-400 font-bold flex items-center">
                          ✓ Play Protect Safe
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Network Mode:</span>
                        <span className="text-green-glow font-bold">Zero-Risk Secure Node</span>
                      </div>
                    </div>

                    <div className="flex flex-col space-y-3 pt-2">
                      <button
                        onClick={handleInstallAppOnDevice}
                        className="w-full py-4 bg-green-glow hover:bg-green-dark text-black font-black rounded-2xl shadow-lg hover:shadow-green-glow/30 transition-all active:scale-95 uppercase tracking-widest text-xs font-sans flex items-center justify-center space-x-2"
                      >
                        <Icons.Download size={16} />
                        <span>Install on Android Device</span>
                      </button>

                      <button
                        onClick={() => {
                          setShowInstallPopup(false);
                          try {
                            sessionStorage.removeItem("chix9ja_just_registered");
                          } catch {}
                        }}
                        className="w-full py-3 bg-gray-800/50 text-gray-400 font-bold rounded-2xl hover:bg-gray-800 text-xs transition-colors"
                      >
                        Maybe Later
                      </button>
                    </div>

                    <div className="flex items-center justify-center space-x-2 text-[9px] text-gray-500 font-bold uppercase tracking-wider">
                      <Icons.ShieldCheck size={11} className="text-green-glow" />
                      <span>verified android installer</span>
                    </div>
                  </>
                ) : (
                  <div className="space-y-6 py-4 animate-fade-in duration-300">
                    <div className="flex justify-center">
                      <div className="relative flex items-center justify-center">
                        <svg className="w-24 h-24 transform -rotate-90">
                          <circle
                            cx="48"
                            cy="48"
                            r="42"
                            stroke="#1f2937"
                            strokeWidth="6"
                            fill="transparent"
                          />
                          <circle
                            cx="48"
                            cy="48"
                            r="42"
                            stroke="#00ffa3"
                            strokeWidth="6"
                            fill="transparent"
                            strokeDasharray={263.89}
                            strokeDashoffset={263.89 - (263.89 * installProgress) / 100}
                            className="transition-all duration-300 ease-out"
                          />
                        </svg>
                        <span className="absolute text-xl font-black text-white font-mono">
                          {installProgress}%
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-lg font-black text-white uppercase tracking-tight">
                        Installing App...
                      </h3>
                      <p className="text-[11px] text-green-glow font-mono animate-pulse min-h-[16px]">
                        {installStepLog}
                      </p>
                    </div>

                    <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-green-glow h-full transition-all duration-300 ease-out"
                        style={{ width: `${installProgress}%` }}
                      ></div>
                    </div>

                    <div className="text-[10px] text-gray-500 font-mono">
                      Please do not lock your screen or close chix9ja during connection synchronizing.
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          {showQuizAd &&
            !showWelcomeAd &&
            activeTab !== "ux-trade" &&
            activeTab !== "loan" &&
            activeTab !== "imminent_payment" && (
              <QuizAd
                onStart={() => {
                  setShowQuizAd(false);
                  setActiveTab("ux-trade");
                }}
                onClose={() => setShowQuizAd(false)}
              />
            )}

          {/* Interactive Floating Support Toggle Widget */}
          {currentView === "dashboard" && activeTab !== "admin" && (
            <div className="fixed bottom-22 left-1/2 -translate-x-1/2 w-full max-w-md pointer-events-none z-[100] h-0">
              <div className="absolute bottom-0 right-4 pointer-events-auto flex items-center group">
                {/* Elegant hover tooltip badge */}
                <div className="mr-2 bg-zinc-950/90 text-green-glow text-[9px] font-mono font-black uppercase tracking-widest px-3 py-1.5 rounded-2xl border border-green-glow/20 shadow-[0_0_15px_rgba(0,255,163,0.15)] flex items-center space-x-1.5 whitespace-nowrap pointer-events-none select-none transition-all duration-300 opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100">
                  <span>Telegram Support</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-green-glow animate-pulse" />
                </div>

                {/* Floating Support Button with glowing pulse/ping effect and hover animations */}
                <button 
                  onClick={() => window.open(channels.supportTelegram, "_blank")}
                  aria-label="Contact Telegram Support"
                  className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer shadow-lg relative bg-gradient-to-tr from-green-light to-green-glow text-black shadow-[0_0_25px_rgba(0,255,163,0.35)] hover:shadow-[0_0_35px_rgba(0,255,163,0.55)] border border-green-glow/50"
                >
                  <span className="absolute inset-0 rounded-full bg-green-glow/30 animate-ping opacity-75"></span>
                  <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3 z-20">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-85"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border border-black"></span>
                  </span>
                  <Icons.Support size={20} className="stroke-[2.5] relative z-10 animate-pulse text-black" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
