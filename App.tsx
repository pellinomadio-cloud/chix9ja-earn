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
import LinkWithdrawAccount from "./components/LinkWithdrawAccount";
import HowItWorks from "./components/HowItWorks";
import NotificationFeed from "./components/NotificationFeed";
import Referrals from "./components/Referrals";
import UXTrade from "./components/UXTrade";
import Investment from "./components/Investment";
import SystemNotification from "./components/SystemNotification";
import PromoPage from "./components/PromoPage";
import { Icons } from "./components/Icons";
import { User, Plan, Transaction, RewardStatus } from "./types";
import { GoogleGenAI, Modality } from "@google/genai";
import { doc, onSnapshot, setDoc, getDoc } from "firebase/firestore";
import { db, auth } from "./firebase";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

const DEFAULT_NOTIFICATION_PREFERENCES = {
  withdrawals: true,
  transfers: true,
  airtime: true,
  rewards: true,
};

const App: React.FC = () => {
  const [initialRefCode] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get("ref") || "";
    } catch (e) {
      return "";
    }
  });

  // Global Time State for Deactivation & Subscription Logic
  const [now, setNow] = useState(Date.now());
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(true);

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

  // Periodic deletion of admin notifications older than 1 hour
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

    // Check if there are any that have expired
    const expiredCount = user.adminNotifications.filter((n) => {
      const notifTime = new Date(n.date).getTime();
      return nowMs - notifTime >= oneHour;
    }).length;

    if (expiredCount > 0) {
      // Filter out all expired ones
      const validNotifications = user.adminNotifications.filter((n) => {
        const notifTime = new Date(n.date).getTime();
        return nowMs - notifTime < oneHour;
      });

      const updatedUser = {
        ...user,
        adminNotifications: validNotifications,
      };

      setUser(updatedUser);
      saveUserToStorage(updatedUser);
    }
  }, [user, now]);

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
    "login" | "register" | "dashboard"
  >(() => {
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
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [serviceType, setServiceType] = useState<"airtime" | "data">("airtime");
  const [showWelcomeAd, setShowWelcomeAd] = useState(false);
  const [showQuizAd, setShowQuizAd] = useState(false);
  const [taskMode, setTaskMode] = useState<"quiz" | "telegram" | "all">("all");
  const [showVipNotice, setShowVipNotice] = useState(false);
  const [showWithdrawReferralAdvert, setShowWithdrawReferralAdvert] =
    useState(false);

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
      } else {
        const updatedUser = {
          ...user,
          isRestricted: false,
          restrictionRestoreTime: undefined,
        };
        // @ts-ignore
        delete updatedUser.restrictionType;

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
      activeTab === "promo"
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

          const updatedRef: User = {
            ...refData,
            balance: (refData.balance || 0) + 5000.0,
            referralCount: (refData.referralCount || 0) + 1,
            referralEarnings: (refData.referralEarnings || 0) + 5000.0,
            referredUsers: [
              ...(refData.referredUsers || []),
              email.toLowerCase(),
            ],
            transactions: [newRefTrx, ...(refData.transactions || [])],
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
    };

    saveUserToStorage(newUser);
    localStorage.setItem("chix9ja_active_session", email.toLowerCase());
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
      window.open("https://t.me/chix9jaservice", "_blank");
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

  const handleGameResult = (win: boolean) => {
    if (!user) return;
    const amount = win ? 2000 : 1000;
    const now = new Date();
    const lastQuiz = user.lastQuizTimestamp
      ? new Date(user.lastQuizTimestamp)
      : null;

    let newCount = (user.dailyQuizCount || 0) + 1;

    // Reset if it's a new day
    if (!lastQuiz || now.toDateString() !== lastQuiz.toDateString()) {
      newCount = 1;
    }

    const newTransaction: Transaction = {
      id: `trx-game-${Date.now()}`,
      type: win ? "credit" : "debit",
      amount: amount,
      description: win ? "Quiz Game Win Reward" : "Quiz Game Loss Penalty",
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

  const nowTs = Date.now();
  const twentyFourHours = 24 * 60 * 60 * 1000;
  const isClaimable =
    nowTs - rewardStatus.lastClaimedTimestamp >= twentyFourHours;

  const pageTitles: Record<string, string> = {
    loan: "UX-Trade Desk",
    "ux-trade": "UX-Trade Desk",
    finance: "Business Hub",
    reward: "Rewards",
    me: "My Profile",
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
    business_hub: "Business Hub",
    notifications: "Feed",
    receipt: "Receipt",
    link_withdraw_account: "Account Hosting",
    how_it_works: "How It Works",
  };

  if (user?.isRestricted) {
    return (
      <Restricted
        restoreTime={user.restrictionRestoreTime}
        onRestore={handleManualRestore}
      />
    );
  }

  return (
    <div className={darkMode ? "dark" : ""}>
      <div className="min-h-screen bg-black font-sans text-white transition-colors duration-200">
        <div className="max-w-md mx-auto bg-black min-h-screen relative shadow-2xl transition-colors duration-200">
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
              activeTab !== "invest" && (
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
                darkMode={darkMode}
                toggleDarkMode={toggleDarkMode}
                onLogout={handleLogout}
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
                onProceed={() => setActiveTab("upgrade_payment")}
                onBack={handleBack}
              />
            ) : activeTab === "upgrade_payment" ? (
              <UpgradePayment
                userEmail={user?.email || ""}
                onPaymentComplete={handlePaymentComplete}
              />
            ) : (activeTab === "business_hub" || activeTab === "finance") &&
              user ? (
              <BusinessHub
                user={user}
                onVipWithdraw={handleVipWithdraw}
                onLinkAccountClick={() => setActiveTab("link_withdraw_account")}
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
                onGoHome={() => setActiveTab("home")}
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
                      const notifTime = new Date(n.date).getTime();
                      return !n.isEmail && now - notifTime < 60 * 60 * 1000;
                    })
                    .map((n) => {
                      const notifTime = new Date(n.date).getTime();
                      const elapsed = now - notifTime;
                      const remainingMs = 60 * 60 * 1000 - elapsed;
                      const remainingMins = Math.max(
                        0,
                        Math.ceil(remainingMs / (60 * 1000)),
                      );

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
                                DELETING IN {remainingMins}M
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
                />
                <ActionGrid
                  onActionClick={handleGridAction}
                  balance={user?.balance || 0}
                />
                <Banner />
              </main>
            )}
          </div>
          {currentView === "dashboard" &&
            activeTab !== "ux-trade" &&
            activeTab !== "loan" &&
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
          {showWelcomeAd &&
            activeTab !== "ux-trade" &&
            activeTab !== "loan" && (
              <TelegramAd
                onJoin={() => window.open("https://t.me/chix9ja", "_blank")}
                onContinue={() => setShowWelcomeAd(false)}
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
        </div>
      </div>
    </div>
  );
};

export default App;
