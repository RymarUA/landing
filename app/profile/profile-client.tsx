// @ts-nocheck
"use client";
/**
 * app/profile/profile-client.tsx
 *
 * Personal cabinet with OTP phone login.
 *
 * Flow:
 *  1. GET /api/auth/me → if authenticated, skip to profile view
 *  2. Enter phone → POST /api/auth/send-otp
 *  3. Enter 6-digit OTP → POST /api/auth/verify-otp → sets httpOnly cookie
 *  4. Profile view: show orders fetched from Sitniks CRM (TODO when CRM is live)
 *  5. Logout → POST /api/auth/logout
 */

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo
} from "react";
import { useResponsive } from "@/hooks/use-responsive";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ShopNovaPoshta } from "@/components/shop-novaposhta";
import { ProductNotificationsWidget } from "@/components/product-notifications-widget";
import NextImage from "next/image";
import { 
  User, Phone, Mail, KeyRound, LogOut, Package, ChevronLeft,
  Loader2, CheckCircle, RefreshCw, ShoppingBag,
  AlertCircle, ChevronRight, Heart, Copy, Truck, RotateCcw,
  Shield, X, Edit3, Plus, Tag, Sparkles, Users
} from "lucide-react";
import { useWishlist } from "@/components/wishlist-context";
import { useCart } from "@/components/cart-context";
import { blurProps } from "@/lib/utils";
// import { siteConfig } from "@/lib/site-config";
import { ShopFooter } from "@/components/shop-footer";
import { useLocalStorage } from "@/hooks/use-isomorphic";
import { fetchNPCities, fetchNPWarehouses } from "@/lib/novaposhta-api";
import type { NPCity, NPWarehouse } from "@/lib/types";


/* ─── Types ──────────────────────────────────────────── */
type Step = "loading" | "auth-method" | "email" | "phone" | "otp" | "profile" | "add-phone";

/** Normalize email for API: lowercase, trimmed */
function normalizeEmailForApi(email: string): string {
  return email.toLowerCase().trim();
}

const EMAIL_VALID = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function isValidEmail(email: string): boolean {
  return EMAIL_VALID.test(email);
}

/** Normalize phone for API: always +380XXXXXXXXX (13 chars) */
function normalizePhoneForApi(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("38")) return "+" + digits;
  if (digits.length >= 10) {
    const tail = digits.slice(-10);
    if (tail.startsWith("0")) return "+38" + tail;
    if (tail.length === 9) return "+380" + tail;
  }
  if (digits.length === 9) return "+380" + digits;
  return "";
}

const PHONE_VALID = /^\+380\d{9}$/;
function isValidPhone(phone: string): boolean {
  const normalized = normalizePhoneForApi(phone);
  return normalized.length === 13 && PHONE_VALID.test(normalized);
}

/** Format display phone: +38 (067) 123-45-67 — only digits, max 10 (0XX...) */
function formatPhoneDisplay(digitsOnly: string): string {
  const digits = digitsOnly.replace(/\D/g, "").slice(0, 10);
  if (!digits.length) return "";
  
  // Build format progressively based on digit count
  let formatted = "+38 (";
  
  formatted += digits.slice(0, Math.min(3, digits.length));
  
  if (digits.length > 3) {
    formatted += ") " + digits.slice(3, Math.min(6, digits.length));
  }
  
  if (digits.length > 6) {
    formatted += "-" + digits.slice(6, Math.min(8, digits.length));
  }
  
  if (digits.length > 8) {
    formatted += "-" + digits.slice(8, 10);
  }
  
  return formatted;
}

interface Order {
  id: string | number;
  createdAt: string;
  status: string;
  total: number;
  trackingNumber?: string;
  items: Array<{ id?: number; name: string; quantity: number; price: number; image?: string }>;
  managerComment?: string; // Комментарий менеджера с информацией об оплате
}

// Функция для определения способа оплаты из комментария менеджера
function getPaymentMethod(order: Order): { label: string; icon: string; color: string } {
  const comment = order.managerComment?.toLowerCase() || '';
  
  // Проверяем различные варианты указания оплаты карткой
  if (
    comment.includes('оплата: картка') || 
    comment.includes('оплата:card') || 
    comment.includes('оплата: онлайн') ||
    comment.includes('online') ||
    comment.includes('wayforpay') ||
    comment.includes('картка') && comment.includes('оплата')
  ) {
    return {
      label: 'Картка онлайн',
      icon: '💳',
      color: 'text-green-700 bg-green-50 border-green-200'
    };
  }
  
  // По умолчанию - наложенный платеж
  return {
    label: 'Наложений платіж',
    icon: '💵',
    color: 'text-amber-700 bg-amber-50 border-amber-200'
  };
}

/* ─── Status label map ───────────────────────────────── */
const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  "Новий":            { label: "Новий",            color: "text-sky-600 bg-sky-50 border-sky-100" },
  "Очікує оплати":    { label: "Очікує оплати",    color: "text-amber-600 bg-amber-50 border-amber-100" },
  "Оплачено":         { label: "Оплачено",         color: "text-green-600 bg-green-50 border-green-100" },
  "Відправлено":      { label: "Відправлено",       color: "text-blue-600 bg-blue-50 border-blue-100" },
  "У відділенні":     { label: "У відділенні",      color: "text-green-700 bg-green-100 border-green-200" },
  "Доставлено":       { label: "Доставлено",        color: "text-[#2E7D32] bg-[#2E7D32]/10 border-[#2E7D32]/20" },
  "Скасовано":        { label: "Скасовано",         color: "text-red-600 bg-red-50 border-red-100" },
};

function statusStyle(status: string) {
  return STATUS_LABELS[status] ?? { label: status, color: "text-gray-600 bg-gray-50 border-gray-100" };
}

const PROFILE_NAME_KEY = "fhm_profile_name";
const PROFILE_LAST_NAME_KEY = "fhm_profile_last_name";
const PROFILE_ADDRESS_KEY = "fhm_profile_address";
const PROFILE_CITY_KEY = "fhm_profile_city";
const PROFILE_CITY_REF_KEY = "fhm_profile_city_ref";
const PROFILE_WAREHOUSE_KEY = "fhm_profile_warehouse";
const PROFILE_WAREHOUSE_REF_KEY = "fhm_profile_warehouse_ref";

/* ─── Promo Code System ─────────────────────────────── */
interface PromoCode {
  code: string;
  discount: number;
  expiresAt: Date;
  used: boolean;
  minOrder: number;
  description: string;
  type: 'tier' | 'personalized' | 'referral';
}

const PROMO_TIER = {
  NEW: "FIRST5",    // 5% за регистрацию
  ACTIVE: "FIRST10", // 10% за первую покупку
  LOYAL: "LOYAL15"   // 15% за 3+ покупки
} as const;

const PERSONALIZED_PROMOS = {
  ABANDONED_CART: "COMEBACK10",      // 10% за брошенную корзину
  SEASONAL: "SEASONAL15",           // 15% сезонная скидка
  BIRTHDAY: "BIRTHDAY20",           // 20% на день рождения
  REENGAGE: "WELCOME_BACK12"        // 12% для возвращающихся пользователей
} as const;

const REFERRAL_PROMOS = {
  REFERRER: "REFER_FRIEND15",       // 15% тому, кто привел друга
  REFERRAL: "FRIEND_WELCOME10"      // 10% новому пользователю по реферальной ссылке
} as const;

type PromoTier = keyof typeof PROMO_TIER;
type PersonalizedPromo = keyof typeof PERSONALIZED_PROMOS;
type ReferralPromo = keyof typeof REFERRAL_PROMOS;

// Generate promo code with expiry
const generatePromoCode = (tier: PromoTier, type: 'tier' | 'personalized' | 'referral' = 'tier'): PromoCode => {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
  
  const baseCode = type === 'tier' ? PROMO_TIER[tier] : '';
  const discount = tier === 'NEW' ? 5 : tier === 'ACTIVE' ? 10 : 15;
  
  return {
    code: baseCode,
    discount,
    expiresAt,
    used: false,
    minOrder: 500,
    description: tier === 'NEW' ? 'Знижка для нових клієнтів' : 
                tier === 'ACTIVE' ? 'Знижка за першу покупку' : 
                'Знижка для постійних клієнтів',
    type
  };
};

// Generate personalized promo codes
const generatePersonalizedPromo = (type: PersonalizedPromo, _customData?: any): PromoCode => {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000); // 14 days
  
  const promoConfig = {
    ABANDONED_CART: { discount: 10, minOrder: 300, description: 'З поверненням! Знижка на ваше замовлення' },
    SEASONAL: { discount: 15, minOrder: 800, description: 'Сезонна знижка на обрані товари' },
    BIRTHDAY: { discount: 20, minOrder: 500, description: 'З днем народження! Подарунок від нас' },
    REENGAGE: { discount: 12, minOrder: 400, description: 'Ми сумували! Раді бачити знову' }
  };
  
  const config = promoConfig[type];
  
  return {
    code: PERSONALIZED_PROMOS[type],
    discount: config.discount,
    expiresAt,
    used: false,
    minOrder: config.minOrder,
    description: config.description,
    type: 'personalized' as const
  };
};

// Generate referral promo codes
const generateReferralPromo = (type: ReferralPromo): PromoCode => {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000); // 60 days
  
  const promoConfig = {
    REFERRER: { discount: 15, minOrder: 1000, description: 'Дякуємо за рекомендацию!' },
    REFERRAL: { discount: 10, minOrder: 300, description: 'Знижка для друзів' }
  };
  
  const config = promoConfig[type];
  
  return {
    code: REFERRAL_PROMOS[type],
    discount: config.discount,
    expiresAt,
    used: false,
    minOrder: config.minOrder,
    description: config.description,
    type: 'referral' as const
  };
};

/* ─── Main component ─────────────────────────────────── */
export function ProfileClient({ allProducts = [] }: { allProducts?: Array<{ id: number; name: string; price: number; image: string; sizes?: string[] }> }) {
  const { is } = useResponsive();
  const [step, setStep]     = useState<Step>("loading");
  const [authMethod, setAuthMethod] = useState<"email" | "phone">("email");
  const [email, setEmail]   = useState("");
  const [phone, setPhone]   = useState("");
  const [otp, setOtp]       = useState(["", "", "", "", "", ""]);
  const [loggedEmail, setLoggedEmail] = useState("");
  const [loggedPhone, setLoggedPhone] = useState("");
  const [profileName, setProfileName] = useLocalStorage<string>(PROFILE_NAME_KEY, "");
  const [profileLastName, setProfileLastName] = useLocalStorage<string>(PROFILE_LAST_NAME_KEY, "");
  const [profileAddress, setProfileAddress] = useLocalStorage<string>(PROFILE_ADDRESS_KEY, "");
  const [profileCity, setProfileCity] = useLocalStorage<string>(PROFILE_CITY_KEY, "");
  const [profileCityRef, setProfileCityRef] = useLocalStorage<string>(PROFILE_CITY_REF_KEY, "");
  const [profileWarehouse, setProfileWarehouse] = useLocalStorage<string>(PROFILE_WAREHOUSE_KEY, "");
  const [profileWarehouseRef, setProfileWarehouseRef] = useLocalStorage<string>(PROFILE_WAREHOUSE_REF_KEY, "");
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [error, setError]   = useState("");
  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [busy, setBusy]     = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const [copiedPromo, setCopiedPromo] = useState(false);
  const [showPromoBlock, setShowPromoBlock] = useState(false);
  const [popupSeen] = useLocalStorage<string>("fhm_popup_seen", "");
  const [copiedTTN, setCopiedTTN] = useState<string | null>(null);
  const [userPromoCode, setUserPromoCode] = useState<PromoCode | null>(null);
  const [, setPromoTier] = useState<PromoTier | null>(null);
  const [personalizedPromos, setPersonalizedPromos] = useState<PromoCode[]>([]);
  const [referralPromos, setReferralPromos] = useState<PromoCode[]>([]);
  const [userReferralCode, setUserReferralCode] = useState<string | null>(null);
  const [referralStats, setReferralStats] = useState({
    referralCount: 0,
    totalReward: 0,
    pendingReferrals: 0
  });
  const [, setUserBehavior] = useState({
    abandonedCart: false,
    lastSeen: new Date(),
    totalViews: 0,
    favoriteCategories: [] as string[],
    timeOnSite: 0 // minutes
  });
  const [sitniksCustomer, setSitniksCustomer] = useState<any>(null);
  const [, setCustomerLoading] = useState(false);
  const [showTracking, setShowTracking] = useState(false);
  const [trackingTtn, setTrackingTtn] = useState<string | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: "",
    lastName: "",
    email: "",
    phone: "",
    city: "",
    cityRef: "",
    warehouse: "",
    warehouseRef: ""
  });
  const [isChangingPhone, setIsChangingPhone] = useState(false);
  const [newPhone, setNewPhone] = useState("");
  const [phoneOtp, setPhoneOtp] = useState(["", "", "", "", "", ""]);
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [phoneOtpMode, setPhoneOtpMode] = useState<"add" | "change" | null>(null);
  const [pendingPhoneForOtp, setPendingPhoneForOtp] = useState<string | null>(null);
  const [phoneResendIn, setPhoneResendIn] = useState(0);
  const phoneTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [cityResults, setCityResults] = useState<NPCity[]>([]);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [citySearchError, setCitySearchError] = useState("");
  const [citySearchLoading, setCitySearchLoading] = useState(false);
  const citySearchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const citySearchRequestId = useRef(0);
  const [warehouseOptions, setWarehouseOptions] = useState<NPWarehouse[]>([]);
  const [warehouseLoading, setWarehouseLoading] = useState(false);
  // const [showWarehouseDropdown, setShowWarehouseDropdown] = useState(false);
  // const warehouseSearchRequestId = useRef(0);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [warehouseError, setWarehouseError] = useState<string>("");
  const warehouseSearchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warehouseDropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    return () => {
      const cityTimeout = citySearchTimeoutRef.current;
      if (cityTimeout) clearTimeout(cityTimeout);
      const warehouseTimeout = warehouseSearchTimeoutRef.current;
      if (warehouseTimeout) clearTimeout(warehouseTimeout);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!warehouseDropdownRef.current) return;
      if (!warehouseDropdownRef.current.contains(event.target as Node)) {
        // Dropdown closed
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const loadWarehouses = useCallback(async (cityRef: string, presetWarehouseRef?: string) => {
    if (!cityRef) {
      setWarehouseOptions([]);
      setWarehouseLoading(false);
      return;
    }
    setWarehouseLoading(true);
    setWarehouseError("");
    try {
      const list = await fetchNPWarehouses(cityRef, "");
      setWarehouseOptions(list);
      if (!list.length) {
        setWarehouseError("Відділень не знайдено");
      }
      if (presetWarehouseRef) {
        const preset = list.find((wh) => wh.Ref === presetWarehouseRef);
        if (preset) {
          setEditFormData((prev) => ({ ...prev, warehouse: preset.Description, warehouseRef: preset.Ref }));
        } else {
          setEditFormData((prev) => ({ ...prev, warehouse: "", warehouseRef: "" }));
        }
      }
    } catch (error) {
      console.error("[profile] Failed to load warehouses:", error);
      setWarehouseOptions([]);
      setWarehouseError("Помилка завантаження відділень");
    } finally {
      setWarehouseLoading(false);
    }
  }, []);

  const handleCitySearch = useCallback((value: string) => {
    setEditFormData((prev) => ({
      ...prev,
      city: value,
      cityRef: "",
      warehouse: "",
      warehouseRef: ""
    }));
    setWarehouseOptions([]);
    setWarehouseError("");
    const timeout = warehouseSearchTimeoutRef.current;
    if (timeout) {
      clearTimeout(timeout);
    }
    if (!value || value.length < 2) {
      setCityResults([]);
      setShowCityDropdown(false);
      setCitySearchError(value ? "Введіть мінімум 2 символи" : "");
      return;
    }
    if (citySearchTimeoutRef.current) clearTimeout(citySearchTimeoutRef.current);
    const requestId = ++citySearchRequestId.current;
    citySearchTimeoutRef.current = setTimeout(async () => {
      setCitySearchLoading(true);
      setCitySearchError("");
      try {
        const results = await fetchNPCities(value);
        if (requestId === citySearchRequestId.current) {
          setCityResults(results);
          setShowCityDropdown(true);
          if (!results.length) setCitySearchError("Місто не знайдено");
        }
      } catch (error) {
        console.error("[profile] City search failed:", error);
        if (requestId === citySearchRequestId.current) {
          setCityResults([]);
          setShowCityDropdown(false);
          setCitySearchError("Помилка пошуку міста");
        }
      } finally {
        if (requestId === citySearchRequestId.current) {
          setCitySearchLoading(false);
        }
      }
    }, 350);
  }, []);

  const handleCitySelect = useCallback((city: NPCity) => {
    setEditFormData((prev) => ({
      ...prev,
      city: city.Description,
      cityRef: city.Ref,
      warehouse: "",
      warehouseRef: ""
    }));
    setShowCityDropdown(false);
    setCityResults([]);
    setCitySearchError("");
    loadWarehouses(city.Ref);
  }, [loadWarehouses]);

  useEffect(() => {
    if (loggedPhone) {
      setNewPhone("");
    }
  }, [loggedPhone]);

  const otpString = otp.join("");
  const router = useRouter();
  const { count: wishlistCount, ids: wishlistIds, hydrated: wishlistHydrated } = useWishlist();
  const { addItem, updateQuantity } = useCart();
  const PLACEHOLDER_IMG = "https://lrggyvioreorxttbasgi.supabase.co/storage/v1/object/public/app-assets/9586/images/1772177782851-sneakers-hero";

  // Create a Set of valid product IDs for quick lookup
  const validProductIds = useMemo(() => new Set(allProducts.map(p => p.id)), [allProducts]);

  // Safe link component that handles navigation errors
  const SafeProductLink = ({ children, productId, ...props }: { children: React.ReactNode; productId: number; } & React.ComponentProps<typeof Link>) => {
    const isValid = validProductIds.has(productId);
    
    if (!isValid) {
      return <span className="text-gray-600">{children}</span>;
    }
    
    return <Link href={`/product/${productId}`} {...props}>{children}</Link>;
  };

  useEffect(() => {
    // Profile name is handled by useLocalStorage hook
  }, [step]);
  useEffect(() => {
    if (step !== "profile") return;
    setShowPromoBlock(!!popupSeen);
  }, [step, popupSeen]);

  /* ── Track user behavior for personalized promos ── */
  const trackUserBehavior = useCallback(() => {
    // Check for abandoned cart
    const cartItems = JSON.parse(localStorage.getItem('cart') || '[]');
    const hasAbandonedCart = cartItems.length > 0;
    
    // Check time since last visit
    const lastVisit = localStorage.getItem('fhm_last_visit');
    const daysSinceLastVisit = lastVisit ? Math.floor((Date.now() - parseInt(lastVisit)) / (1000 * 60 * 60 * 24)) : 0;
    
    // Get favorite categories from wishlist/view history
    const wishlistItems = JSON.parse(localStorage.getItem('wishlist') || '[]');
    const favoriteCategories = Array.from(new Set(wishlistItems.map((item: any) => item.category).filter(Boolean)));
    
    // Calculate time on site
    const sessionStart = sessionStorage.getItem('fhm_session_start');
    const timeOnSite = sessionStart ? Math.floor((Date.now() - parseInt(sessionStart)) / (1000 * 60)) : 0;
    
    // Update current visit
    localStorage.setItem('fhm_last_visit', Date.now().toString());
    if (!sessionStart) {
      sessionStorage.setItem('fhm_session_start', Date.now().toString());
    }
    
    setUserBehavior(prev => ({
      ...prev,
      abandonedCart: hasAbandonedCart,
      lastSeen: new Date(),
      favoriteCategories,
      timeOnSite: prev.timeOnSite + timeOnSite
    }));
    
    return { hasAbandonedCart, daysSinceLastVisit, favoriteCategories, timeOnSite };
  }, []);
  
  /* ── Generate personalized promos based on behavior ── */
  const generatePersonalizedPromos = useCallback((behavior: any) => {
    const promos: PromoCode[] = [];
    
    // Abandoned cart promo
    if (behavior.abandonedCart) {
      promos.push(generatePersonalizedPromo('ABANDONED_CART'));
    }
    
    // Re-engagement promo (haven't visited in 7+ days)
    if (behavior.daysSinceLastVisit >= 7) {
      promos.push(generatePersonalizedPromo('REENGAGE'));
    }
    
    // Seasonal promo (check current season)
    const currentMonth = new Date().getMonth();
    if (currentMonth >= 2 && currentMonth <= 4) { // Spring
      promos.push(generatePersonalizedPromo('SEASONAL'));
    } else if (currentMonth >= 10 || currentMonth <= 1) { // Winter
      promos.push(generatePersonalizedPromo('SEASONAL'));
    }
    
    // Birthday promo (if we have birthday info)
    // TODO: Add birthday field to profile
    
    setPersonalizedPromos(promos);
  }, []);
  
  /* ── Generate referral promos ── */
  const generateReferralPromos = useCallback(() => {
    const promos: PromoCode[] = [];
    
    // Generate referral codes for user to share
    if (userReferralCode) {
      promos.push(generateReferralPromo('REFERRER'));
    }
    
    setReferralPromos(promos);
  }, [userReferralCode]);
  
  /* ── Load Sitniks customer data ── */
  const loadSitniksCustomer = useCallback(async (abortController?: AbortController) => {
    setCustomerLoading(true);
    try {
      const res = await fetch("/api/profile/customer", { 
        signal: abortController?.signal 
      });
      
      if (!res.ok) {
        if (!abortController?.signal.aborted) setSitniksCustomer(null);
        return;
      }
      
      const data = await res.json();
      
      if (!abortController?.signal.aborted) {
        setSitniksCustomer(data.customer);
      }
    } catch (error) {
      // Don't log abort errors as they're expected during cleanup
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }
      console.error("[profile] Failed to load Sitniks customer:", error);
      if (!abortController?.signal.aborted) setSitniksCustomer(null);
    } finally {
      if (!abortController?.signal.aborted) setCustomerLoading(false);
    }
  }, []);
  
  /* ── Handle referral link from URL ── */
  const handleReferralLink = useCallback(async (referralCode: string) => {
    if (!loggedEmail || sitniksCustomer?.referredBy) return;
    
    try {
      // Find referrer by code
      const referrerResponse = await fetch('/api/referral/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referralCode })
      });
      
      if (referrerResponse.ok) {
        await referrerResponse.json();
        
        // Update current customer with referrer info in comment
        const updateResponse = await fetch('/api/profile/customer', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ comment: `Referred by: ${referralCode}` })
        });
        
        if (updateResponse.ok) {
          console.log(`[profile] Applied referral: ${referralCode}`);
          // Reload customer data
          loadSitniksCustomer();
        }
      }
    } catch (error) {
      console.error('[profile] Failed to apply referral:', error);
    }
  }, [loggedEmail, sitniksCustomer, loadSitniksCustomer]);
  
  /* ── Generate referral code for user ── */
  const generateUserReferralCode = useCallback(async () => {
    if (!sitniksCustomer?.id || sitniksCustomer.referralCode) return;
    
    try {
      // Generate unique referral code
      const response = await fetch('/api/referral/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: sitniksCustomer.id })
      });
      
      if (response.ok) {
        const { referralCode } = await response.json();
        setUserReferralCode(referralCode);
        
        // Update referral promos
        generateReferralPromos();
      }
    } catch (error) {
      console.error('[profile] Failed to generate referral code:', error);
    }
  }, [sitniksCustomer, generateReferralPromos]);
  
  /* ── Determine user promo tier ── */
  const determinePromoTier = useCallback((): PromoTier | null => {
    if (!sitniksCustomer) return null;
    
    const ordersCount = sitniksCustomer.ordersCount || 0;
    const hasProfileName = profileName.trim().length > 0;
    const hasPhone = loggedPhone.length > 0;
    
    // LOYAL: 3+ purchases
    if (ordersCount >= 3) return 'LOYAL';
    
    // ACTIVE: First purchase + profile completion
    if (ordersCount >= 1 && hasProfileName && hasPhone) return 'ACTIVE';
    
    // NEW: Just registered or viewed popup
    if (popupSeen || hasProfileName) return 'NEW';
    
    return null;
  }, [sitniksCustomer, profileName, loggedPhone, popupSeen]);
  
  /* ── Update referral code when customer data loads ── */
  useEffect(() => {
    if (sitniksCustomer) {
      // Extract referral code from comment
      const comment = sitniksCustomer.comment || '';
      const referralMatch = comment.match(/Referral code: (REF_[^\s]+)/);
      
      if (referralMatch) {
        setUserReferralCode(referralMatch[1]);
      } else {
        // Generate new referral code
        generateUserReferralCode();
      }
      
      // Set referral stats (simplified)
      setReferralStats({
        referralCount: 0,
        totalReward: 0,
        pendingReferrals: 0
      });
      
      // Generate referral promos
      generateReferralPromos();
    }
  }, [sitniksCustomer, generateUserReferralCode, generateReferralPromos]);
  
  /* ── Check for referral parameter in URL ── */
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');
    
    if (refCode && loggedEmail && sitniksCustomer && !sitniksCustomer.comment?.includes('Referred by:')) {
      handleReferralLink(refCode);
    }
  }, [loggedEmail, sitniksCustomer, handleReferralLink]);
  
  /* ── Update promo code based on tier and behavior ── */
  useEffect(() => {
    if (step !== "profile") return;
    
    // Track user behavior
    const behavior = trackUserBehavior();
    
    // Generate personalized promos
    generatePersonalizedPromos(behavior);
    
    // Generate referral promos
    generateReferralPromos();
    
    // Determine tier-based promo
    const tier = determinePromoTier();
    setPromoTier(tier);
    
    if (tier) {
      const promo = generatePromoCode(tier, 'tier');
      setUserPromoCode(promo);
      setShowPromoBlock(true);
    } else {
      setUserPromoCode(null);
      setShowPromoBlock(false);
    }
  }, [step, determinePromoTier, trackUserBehavior, generatePersonalizedPromos, generateReferralPromos]);
  
  /* ── Load orders from API (AbortController prevents setState on unmount) ── */
  const loadOrders = useCallback(async (_phone: string, abortController?: AbortController) => {
    console.log("[profile] loadOrders called with phone:", _phone);
    setOrdersLoading(true);
    try {
      const res = await fetch("/api/profile/orders", { 
        signal: abortController?.signal 
      });
      
      if (!res.ok) {
        if (!abortController?.signal.aborted) setOrders([]);
        return;
      }
      
      const data = await res.json();
      
      console.log("[profile] API Response status:", res.status);
      console.log("[profile] Raw API response:", data);
      
      if (!abortController?.signal.aborted) {
        console.log("[profile] Orders array:", data.orders);
        console.log("[profile] Orders length:", data.orders?.length);
        // Transform Sitniks orders to our Order interface
        const transformedOrders: Order[] = (data.orders || []).map((order: any) => {
          console.log("[profile] Processing order:", order);
          return {
          id: order.orderNumber || order.id,
          createdAt: order.createdAt,
          status: order.status?.title || order.status?.name || order.status || 'В обробці',
          total: order.totalPrice || order.totalAmount || order.total || 0,
          trackingNumber: order.trackingNumber,
          items: (order.products || order.offers || []).map((item: any) => {
            // Debug: log productVariation structure
            console.log("[profile] Product item:", item);
            console.log("[profile] Product variation:", item.productVariation);
            console.log("[profile] Product variation images:", item.productVariation?.images);
            console.log("[profile] Product variation attachments:", item.productVariation?.attachments);
            
            // Get image from productVariation if available
            let imageUrl = PLACEHOLDER_IMG;
            if (item.productVariation?.images && item.productVariation.images.length > 0) {
              const firstImage = item.productVariation.images[0];
              console.log("[profile] First image object:", firstImage);
              imageUrl = firstImage.url || firstImage.src || firstImage.path || PLACEHOLDER_IMG;
              console.log("[profile] Found image from productVariation:", imageUrl);
            }
            // Try attachments as fallback
            else if (item.productVariation?.attachments && item.productVariation.attachments.length > 0) {
              const firstAttachment = item.productVariation.attachments[0];
              console.log("[profile] First attachment object:", firstAttachment);
              imageUrl = firstAttachment.url || firstAttachment.src || firstAttachment.path || PLACEHOLDER_IMG;
              console.log("[profile] Found image from attachments:", imageUrl);
            }
            // Fallback to other image fields
            imageUrl = imageUrl || item.image || item.preview || item.photo || item.imageUrl || PLACEHOLDER_IMG;
            
            return {
              id: item.productVariation?.productId || item.product?.id || item.productId || item.productVariationId || item.id,
              name: item.title || item.name,
              quantity: item.quantity || 1, // Default to 1 if not specified
              price: item.offerPrice || item.price,
              image: imageUrl,
            };
          }),
          };
        });
        
        // Debug: Log the mapping between different ID fields
        transformedOrders.forEach((order, orderIndex) => {
          order.items.forEach((item, itemIndex) => {
            console.log(`[profile] Order ${orderIndex} Item ${itemIndex} ID mapping:`, {
              productId: item.productId,
              productVariationId: item.productVariationId,
              productVariationProductId: item.productVariation?.productId,
              mainProductId: item.product?.id,
              finalId: item.id,
              itemName: item.name,
              isValid: validProductIds.has(item.id)
            });
          });
        });
        
        setOrders(transformedOrders);
      }
    } catch (error) {
      // Don't log abort errors as they're expected during cleanup
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }
      console.error("[profile] Failed to load orders:", error);
      if (!abortController?.signal.aborted) setOrders([]);
    } finally {
      if (!abortController?.signal.aborted) setOrdersLoading(false);
    }
  }, [validProductIds]);

  /* ── Check existing session ── */
  useEffect(() => {
    const abortController = new AbortController();
    
    (async () => {
      try {
        const res = await fetch("/api/auth/me", { signal: abortController.signal });
        if (res.ok) {
          const data = await res.json();
          console.log("[profile] User data from /api/auth/me:", data);
          setLoggedEmail(data.email || "");
          setLoggedPhone(data.phone || "");
          console.log("[profile] User phone:", data.phone);
          setStep("profile");
          if (data.phone) {
            console.log("[profile] Calling loadOrders with phone:", data.phone);
            loadOrders(data.phone, abortController);
          } else {
            console.log("[profile] No phone found for user, skipping loadOrders");
          }
          loadSitniksCustomer(abortController);
        } else {
          setStep("auth-method");
        }
      } catch {
        if (!abortController.signal.aborted) {
          setStep("auth-method");
        }
      }
    })();
    
    return () => { 
      if (!abortController.signal.aborted) {
        abortController.abort(); 
      }
    };
  }, [loadOrders, loadSitniksCustomer]);

  /* ── Resend countdown ── */
  const startResendTimer = useCallback(() => {
    setResendIn(60);
    timerRef.current = setInterval(() => {
      setResendIn((v) => {
        if (v <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return v - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  /* ── Step 1: Send OTP ── */
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (authMethod === "email") {
      // DEV MODE: Skip OTP for testing
      if (email === "dev@test.com") {
        try {
          const res = await fetch("/api/auth/dev-login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
          });
          if (res.ok) {
            const data = await res.json();
            setLoggedEmail(data.email);
            setStep("profile");
            setError("");
            setEmailError("");
            return;
          }
        } catch (error) {
          console.error("Dev login failed:", error);
        }
      }
      
      const normalized = normalizeEmailForApi(email);
      if (!isValidEmail(email)) {
        setEmailError("Email некоректний");
        setError("Введіть коректну email адресу");
        return;
      }
      
      setBusy(true);
      setError("");
      setEmailError("");
      try {
        const res = await fetch("/api/auth/send-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: normalized }),
        });
        const data = await res.json();
        if (!res.ok) {
          if (res.status === 429) {
            throw new Error(data.error ?? "Спробуйте ще раз через 60 с.");
          }
          throw new Error(data.error ?? "Помилка відправлення коду. Спробуйте ще раз.");
        }
        setStep("otp");
        startResendTimer();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Помилка. Спробуйте ще раз.");
      } finally {
        setBusy(false);
      }
    } else {
      // Phone method
      const normalized = normalizePhoneForApi(phone);
      if (!isValidPhone(phone)) {
        setPhoneError("Номер некоректний");
        setError("Введіть коректний номер телефону");
        return;
      }
      
      setBusy(true);
      setError("");
      setPhoneError("");
      try {
        const res = await fetch("/api/auth/send-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: normalized }),
        });
        const data = await res.json();
        if (!res.ok) {
          if (res.status === 429) {
            throw new Error(data.error ?? "Спробуйте ще раз через 60 с.");
          }
          throw new Error(data.error ?? "Помилка відправлення коду. Спробуйте ще раз.");
        }
        setStep("otp");
        startResendTimer();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Помилка. Спробуйте ще раз.");
      } finally {
        setBusy(false);
      }
    }
  };

  /* ── Resend OTP ── */
  const handleResend = async () => {
    setBusy(true);
    setError("");
    try {
      let requestBody: { email?: string; phone?: string };
      
      if (authMethod === "email") {
        const normalized = normalizeEmailForApi(email);
        requestBody = { email: normalized };
      } else {
        const normalized = normalizePhoneForApi(phone);
        requestBody = { phone: normalized };
      }
      
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 429) {
          throw new Error(data.error ?? "Спробуйте ще раз через 60 с.");
        }
        throw new Error(data.error ?? "Помилка відправлення коду. Спробуйте ще раз.");
      }
      // Reset OTP input and restart timer
      setOtp(["", "", "", "", "", ""]);
      startResendTimer();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Помилка. Спробуйте ще раз.");
    } finally {
      setBusy(false);
    }
  };

  /* ── Step 2: Verify OTP ── */
  const handleVerifyOtp = useCallback(async (e: React.FormEvent | { preventDefault: () => void }) => {
    e.preventDefault();
    if (otpString.length !== 6) return;
    setBusy(true);
    setError("");
    try {
      let requestBody: { email?: string; phone?: string; otp: string };
      
      if (authMethod === "email") {
        requestBody = { email: normalizeEmailForApi(email), otp: otpString };
      } else {
        requestBody = { phone: normalizePhoneForApi(phone), otp: otpString };
      }
      
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Невірний код");
      setLoggedEmail(data.email || "");
      setLoggedPhone(data.phone || "");
      setStep("profile");
      if (data.phone) {
        loadOrders(data.phone, undefined);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Помилка перевірки. Спробуйте ще раз.");
    } finally {
      setBusy(false);
    }
  }, [otpString, email, phone, authMethod, loadOrders]);

  const lastAutoSubmittedOtp = useRef("");
  useEffect(() => {
    if (otpString.length < 6) lastAutoSubmittedOtp.current = "";
  }, [otpString]);
  /* ── Auto-submit OTP when 6 digits entered ── */
  useEffect(() => {
    if (otpString.length !== 6 || busy) return;
    if (lastAutoSubmittedOtp.current === otpString) return;
    lastAutoSubmittedOtp.current = otpString;
    handleVerifyOtp({ preventDefault: () => {} } as React.FormEvent);
  }, [otpString, busy, handleVerifyOtp]);

  /* ── Logout (with optional confirmation) ── */
  const [confirmLogout, setConfirmLogout] = useState(false);
  const handleLogout = async () => {
    if (!confirmLogout) {
      setConfirmLogout(true);
      return;
    }
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (!res.ok) throw new Error("Logout failed");
    } catch {
      window.location.href = "/profile";
      return;
    }
    setConfirmLogout(false);
    setLoggedPhone("");
    setOrders([]);
    setOtp(["", "", "", "", "", ""]);
    setEmail("");
    window.location.href = "/profile";
  };

  /* ── Phone change functions ── */
  const startPhoneChangeTimer = useCallback(() => {
    if (phoneTimerRef.current) clearInterval(phoneTimerRef.current);
    setPhoneResendIn(60);
    phoneTimerRef.current = setInterval(() => {
      setPhoneResendIn((v) => {
        if (v <= 1) {
          clearInterval(phoneTimerRef.current!);
          return 0;
        }
        return v - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => () => { 
    if (phoneTimerRef.current) clearInterval(phoneTimerRef.current); 
  }, []);

  const resetPhoneOtpFlow = useCallback(() => {
    setPhoneOtp(["", "", "", "", "", ""]);
    setPhoneOtpSent(false);
    setPhoneOtpMode(null);
    setPendingPhoneForOtp(null);
    setPhoneResendIn(0);
    if (phoneTimerRef.current) {
      clearInterval(phoneTimerRef.current);
      phoneTimerRef.current = null;
    }
  }, []);

  const handleChangePhone = async () => {
    const normalized = normalizePhoneForApi(newPhone);
    if (!isValidPhone(newPhone)) {
      setError("Номер некоректний");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/auth/send-phone-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: normalized }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Помилка відправки коду. Спробуйте ще раз.");
      }
      setPhoneOtp(["", "", "", "", "", ""]);
      setPendingPhoneForOtp(normalized);
      setPhoneOtpMode("change");
      setPhoneOtpSent(true);
      startPhoneChangeTimer();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Помилка. Спробуйте ще раз.");
    } finally {
      setBusy(false);
    }
  };

  const handleVerifyPhoneOtp = async () => {
    const otpString = phoneOtp.join("");
    if (otpString.length !== 6 || !pendingPhoneForOtp) {
      if (!pendingPhoneForOtp) {
        setError("Введіть номер телефону та отримайте код ще раз.");
      }
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/auth/update-phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: pendingPhoneForOtp, otp: otpString }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Невірний код");
      setLoggedPhone(pendingPhoneForOtp);
      loadOrders(pendingPhoneForOtp, undefined);
      if (phoneOtpMode === "add") {
        setPhone("");
        setStep("profile");
      } else {
        setNewPhone("");
        setIsChangingPhone(false);
      }
      resetPhoneOtpFlow();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Помилка перевірки. Спробуйте ще раз.");
    } finally {
      setBusy(false);
    }
  };

  const handleCancelPhoneChange = () => {
    setIsChangingPhone(false);
    setNewPhone("");
    resetPhoneOtpFlow();
    setError("");
  };

  const handleBackToProfile = useCallback(() => {
    resetPhoneOtpFlow();
    setPhone("");
    setPhoneError("");
    setError("");
    setStep("profile");
  }, [resetPhoneOtpFlow]);

  const handleBackToPhoneEntry = useCallback(() => {
    setPhoneOtp(["", "", "", "", "", ""]);
    setPhoneOtpSent(false);
    setPendingPhoneForOtp(null);
    setError("");
    setPhoneError("");
  }, []);

  /* ── Profile editing functions ── */
  const handleStartEditProfile = () => {
    setEditFormData({
      name: profileName || "",
      lastName: profileLastName || "",
      email: loggedEmail,
      phone: loggedPhone,
      city: profileCity || "",
      cityRef: profileCityRef || "",
      warehouse: profileWarehouse || "",
      warehouseRef: profileWarehouseRef || ""
    });
    setWarehouseError("");
    if (profileCityRef) {
      loadWarehouses(profileCityRef, profileWarehouseRef);
    } else {
      setWarehouseOptions([]);
      setWarehouseError("");
    }
    setCityResults([]);
    setShowCityDropdown(false);
    setCitySearchError("");
    setIsEditingProfile(true);
  };

  const handleSaveProfile = () => {
    if (!editFormData.cityRef) {
      setCitySearchError("Оберіть місто доставки");
      return;
    }
    if (!editFormData.warehouseRef) {
      setWarehouseError("Оберіть відділення або поштомат");
      return;
    }
    // Update profile name
    if (editFormData.name !== profileName) {
      setProfileName(editFormData.name);
    }
    // Update profile last name
    if (editFormData.lastName !== profileLastName) {
      setProfileLastName(editFormData.lastName);
    }
    const formattedAddress = `${editFormData.city}, ${editFormData.warehouse}`;
    if (formattedAddress !== profileAddress) {
      setProfileAddress(formattedAddress);
    }
    setProfileCity(editFormData.city);
    setProfileCityRef(editFormData.cityRef);
    setProfileWarehouse(editFormData.warehouse);
    setProfileWarehouseRef(editFormData.warehouseRef);
    // TODO: Update email, phone when APIs are available
    setWarehouseOptions([]);
    setIsEditingProfile(false);
  };

  const handleCancelEdit = () => {
    setIsEditingProfile(false);
    setCityResults([]);
    setShowCityDropdown(false);
    setCitySearchError("");
    setWarehouseOptions([]);
    setWarehouseError("");
    const timeout = warehouseSearchTimeoutRef.current;
    if (timeout) {
      clearTimeout(timeout);
    }
  };

  /* ════════════════════════════════════════════════════════
     RENDER
     ════════════════════════════════════════════════════════ */

  if (step === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 size={36} className="text-emerald-600 animate-spin" />
      </div>
    );
  }

  /* ── AUTH METHOD STEP ── */
  if (step === "auth-method") {
    return (
      <div className="min-h-screen bg-gray-50 py-16 px-4 transition-opacity duration-300">
        <div className="max-w-md mx-auto">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-700 mb-8">
            <ChevronLeft size={16} />
            На головну
          </Link>

          <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-[#2E7D32] to-[#1B5E20]" />
            <div className="p-8">
              <div className="w-16 h-16 bg-[#2E7D32]/10 rounded-full flex items-center justify-center mx-auto mb-5">
                <User size={30} className="text-[#2E7D32]" />
              </div>
              <h1 className="text-2xl font-black text-gray-900 text-center mb-1">Особистий кабінет</h1>
              <p className="text-sm text-gray-500 text-center mb-7 leading-relaxed">
                Оберіть спосіб входу в особистий кабінет
              </p>

              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    setAuthMethod("email");
                    setStep("email");
                    setError("");
                    setEmailError("");
                  }}
                  disabled={busy}
                  className="flex items-center justify-center gap-3 bg-[#2E7D32] hover:bg-[#1B5E20] disabled:opacity-60 disabled:cursor-not-allowed text-white font-black py-4 rounded-2xl transition-colors shadow-lg shadow-[#2E7D32]/20"
                >
                  <Mail size={20} />
                  <span>Вхід через Email</span>
                </button>

                <button
                  onClick={() => {
                    setAuthMethod("phone");
                    setStep("phone");
                    setError("");
                    setPhoneError("");
                  }}
                  disabled={busy}
                  className="flex items-center justify-center gap-3 bg-gray-600 hover:bg-gray-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-black py-4 rounded-2xl transition-colors shadow-lg shadow-gray-600/20"
                >
                  <Phone size={20} />
                  <span>Вхід через Телефон</span>
                </button>
              </div>

              <p className="text-xs text-gray-400 text-center mt-6 leading-relaxed">
                Email: швидкий та надійний спосіб<br />
                Телефон: SMS або Telegram повідомлення
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── EMAIL STEP ── */
  if (step === "email") {
    return (
      <div className="min-h-screen bg-gray-50 py-16 px-4 transition-opacity duration-300">
        <div className="max-w-md mx-auto">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-700 mb-8">
            <ChevronLeft size={16} />
            На головну
          </Link>

          <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-[#2E7D32] to-[#1B5E20]" />
            <div className="p-8">
              <div className="w-16 h-16 bg-[#2E7D32]/10 rounded-full flex items-center justify-center mx-auto mb-5">
                <Mail size={30} className="text-[#2E7D32]" />
              </div>
              <h1 className="text-2xl font-black text-gray-900 text-center mb-1">Особистий кабінет</h1>
              <p className="text-sm text-gray-500 text-center mb-7 leading-relaxed">
                Введіть вашу email адресу. Ми надішлемо код підтвердження для входу.
              </p>

              <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-gray-700">Email адреса</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setEmailError("");
                      setError("");
                    }}
                    onBlur={() => {
                      if (email.trim() && !isValidEmail(email)) setEmailError("Email некоректний");
                      else setEmailError("");
                    }}
                    placeholder="example@email.com"
                    disabled={busy}
                    autoComplete="email"
                    className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition disabled:opacity-60 disabled:cursor-not-allowed ${emailError ? "border-red-400 bg-red-50/50" : "border-gray-200"}`}
                  />
                  {emailError && (
                    <p className="text-sm text-red-600 flex items-center gap-1.5">
                      <AlertCircle size={14} className="flex-shrink-0" />
                      {emailError}
                    </p>
                  )}
                </div>

                {error && (
                  <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5 text-sm text-red-600">
                    <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={busy || !email.trim() || !isValidEmail(email)}
                  className="flex items-center justify-center gap-2 bg-[#2E7D32] hover:bg-[#1B5E20] disabled:opacity-60 disabled:cursor-not-allowed text-white font-black py-3.5 rounded-2xl transition-colors shadow-lg shadow-[#2E7D32]/20"
                >
                  {busy ? <Loader2 size={18} className="animate-spin" /> : <Mail size={18} />}
                  {busy ? "Відправляємо…" : "Отримати код"}
                </button>
              </form>

              <p className="text-xs text-gray-400 text-center mt-5 leading-relaxed">
                Код підтвердження буде надіслано на вказану email адресу.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── PHONE STEP ── */
  if (step === "phone") {
    return (
      <div className="min-h-screen bg-gray-50 py-16 px-4 transition-opacity duration-300">
        <div className="max-w-md mx-auto">
          <button
            onClick={() => { setStep("auth-method"); setError(""); setPhoneError(""); setPhone(""); }}
            className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-700 mb-8"
          >
            <ChevronLeft size={16} />
            Назад до вибору способу
          </button>

          <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-gray-600 to-gray-700" />
            <div className="p-8">
              <div className="w-16 h-16 bg-gray-600/10 rounded-full flex items-center justify-center mx-auto mb-5">
                <Phone size={30} className="text-gray-600" />
              </div>
              <h1 className="text-2xl font-black text-gray-900 text-center mb-1">Вхід через телефон</h1>
              <p className="text-sm text-gray-500 text-center mb-7 leading-relaxed">
                Введіть ваш номер телефону. Ми надішлемо SMS або Telegram повідомлення з кодом підтвердження.
              </p>

              <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-gray-700">Номер телефону</label>
                  <input
                    type="tel"
                    value={formatPhoneDisplay(phone)}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, "");
                      setPhone(digits);
                      setPhoneError("");
                      setError("");
                    }}
                    placeholder="+38 (0XX) XXX-XX-XX"
                    disabled={busy}
                    autoComplete="tel"
                    className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 transition disabled:opacity-60 disabled:cursor-not-allowed ${phoneError ? "border-red-400 bg-red-50/50" : "border-gray-200"}`}
                  />
                  {phoneError && (
                    <p className="text-sm text-red-600 flex items-center gap-1.5">
                      <AlertCircle size={14} className="flex-shrink-0" />
                      {phoneError}
                    </p>
                  )}
                </div>

                {error && (
                  <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5 text-sm text-red-600">
                    <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={busy || !phone.trim() || !isValidPhone(phone)}
                  className="flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-black py-3.5 rounded-2xl transition-colors shadow-lg shadow-gray-600/20"
                >
                  {busy ? <Loader2 size={18} className="animate-spin" /> : <Phone size={18} />}
                  {busy ? "Відправляємо…" : "Отримати код"}
                </button>
              </form>

              <p className="text-xs text-gray-400 text-center mt-5 leading-relaxed">
                Код підтвердження буде надіслано через SMS або Telegram.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── OTP STEP ── */
  if (step === "otp") {
    const setOtpDigit = (index: number, value: string) => {
      const digit = value.replace(/\D/g, "").slice(-1);
      setError("");
      setOtp((prev) => {
        const next = [...prev];
        next[index] = digit;
        return next;
      });
      if (digit && index < 5) otpRefs.current[index + 1]?.focus();
    };
    const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace" && !otp[index] && index > 0) {
        otpRefs.current[index - 1]?.focus();
        setOtp((prev) => {
          const next = [...prev];
          next[index - 1] = "";
          return next;
        });
      }
    };
    return (
      <div className="min-h-screen bg-gray-50 py-16 px-4 transition-opacity duration-300">
        <div className="max-w-md mx-auto">
          <button
            onClick={() => { 
              setStep(authMethod === "email" ? "email" : "phone"); 
              setError(""); 
              authMethod === "email" ? setEmailError("") : setPhoneError(""); 
              setOtp(["", "", "", "", "", ""]); 
            }}
            className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-700 mb-8"
          >
            <ChevronLeft size={16} />
            Змінити {authMethod === "email" ? "email" : "телефон"}
          </button>

          <div className={`bg-white rounded-3xl shadow-xl overflow-hidden`}>
            <div className={`h-1.5 bg-gradient-to-r ${authMethod === "email" ? "from-[#2E7D32] to-[#1B5E20]" : "from-gray-600 to-gray-700"}`} />
            <div className="p-8">
              <div className={`w-16 h-16 ${authMethod === "email" ? "bg-[#2E7D32]/10" : "bg-gray-600/10"} rounded-full flex items-center justify-center mx-auto mb-5`}>
                <KeyRound size={30} className={authMethod === "email" ? "text-[#2E7D32]" : "text-gray-600"} />
              </div>
              <h1 className="text-2xl font-black text-gray-900 text-center mb-1">Введіть код</h1>
              <p className="text-sm text-gray-500 text-center mb-1 leading-relaxed">
                Код надіслано на {authMethod === "email" ? "email" : "телефон"}
              </p>
              <p className="text-sm font-black text-gray-900 text-center mb-7">
                {authMethod === "email" ? email : formatPhoneDisplay(phone)}
              </p>

              <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-gray-700">6-значний код</label>
                  <div className="flex justify-center gap-2 sm:gap-3">
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                      <input
                        key={i}
                        ref={(el) => { otpRefs.current[i] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={otp[i]}
                        onChange={(e) => setOtpDigit(i, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(i, e)}
                        disabled={busy}
                        className={`w-11 h-12 sm:w-12 sm:h-14 text-center text-xl font-black rounded-xl border-2 border-gray-200 focus:outline-none ${authMethod === "email" ? "focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200" : "focus:border-gray-500 focus:ring-2 focus:ring-gray-200"} transition disabled:opacity-60`}
                      />
                    ))}
                  </div>
                </div>

                {error && (
                  <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5 text-sm text-red-600">
                    <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={busy || otpString.length !== 6}
                  className={`flex items-center justify-center gap-2 ${authMethod === "email" ? "bg-[#2E7D32] hover:bg-[#1B5E20]" : "bg-gray-600 hover:bg-gray-700"} disabled:opacity-60 disabled:cursor-not-allowed text-white font-black py-3.5 rounded-2xl transition-colors shadow-lg ${authMethod === "email" ? "shadow-[#2E7D32]/20" : "shadow-gray-600/20"}`}
                >
                  {busy ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                  {busy ? "Перевіряємо…" : "Підтвердити"}
                </button>
              </form>

              <div className="flex items-center justify-center gap-2 mt-5">
                <button
                  onClick={handleResend}
                  disabled={resendIn > 0 || busy}
                  className={`flex items-center gap-1.5 text-sm ${authMethod === "email" ? "hover:text-emerald-600" : "hover:text-gray-600"} text-gray-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium`}
                >
                  <RefreshCw size={14} />
                  {resendIn > 0 ? `Повторний код через ${resendIn}с` : "Надіслати код ще раз"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── ADD PHONE STEP ── */
  if (step === "add-phone") {
    const handleAddPhone = async (e: React.FormEvent) => {
      e.preventDefault();
      const normalized = normalizePhoneForApi(phone);
      if (!isValidPhone(phone)) {
        setPhoneError("Номер некоректний");
        setError("Введіть номер у форматі +38 (0XX) XXX-XX-XX");
        return;
      }
      setBusy(true);
      setError("");
      setPhoneError("");
      try {
        const res = await fetch("/api/auth/send-phone-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: normalized }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error ?? "Помилка відправки коду. Спробуйте ще раз.");
        }
        setPhoneOtp(["", "", "", "", "", ""]);
        setPendingPhoneForOtp(normalized);
        setPhoneOtpMode("add");
        setPhoneOtpSent(true);
        startPhoneChangeTimer();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Помилка. Спробуйте ще раз.");
      } finally {
        setBusy(false);
      }
    };

    return (
      <div className="min-h-screen bg-gray-50 py-16 px-4 transition-opacity duration-300">
        <div className="max-w-md mx-auto">
          <button
            onClick={handleBackToProfile}
            className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-700 mb-8"
          >
            <ChevronLeft size={16} />
            Назад до профілю
          </button>

          <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-blue-600 to-blue-700" />
            <div className="p-8">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-5">
                <Shield size={30} className="text-blue-600" />
              </div>
              <h1 className="text-2xl font-black text-gray-900 text-center mb-1">Підтвердження телефону</h1>
              <p className="text-sm text-gray-500 text-center mb-7 leading-relaxed">
                Додайте номер телефону для отримання замовлень та сповіщень про доставку.
              </p>

              {phoneOtpSent && phoneOtpMode === "add" ? (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-gray-700">Код підтвердження</label>
                    <p className="text-xs text-gray-500">Код надіслано на номер {pendingPhoneForOtp ?? phone}</p>
                    <div className="flex justify-center gap-2 sm:gap-3">
                      {[0, 1, 2, 3, 4, 5].map((i) => (
                        <input
                          key={i}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={phoneOtp[i]}
                          onChange={(e) => {
                            const digit = e.target.value.replace(/\D/g, "").slice(-1);
                            setError("");
                            setPhoneOtp((prev) => {
                              const next = [...prev];
                              next[i] = digit;
                              return next;
                            });
                            
                            // Auto-focus next input
                            if (digit && i < 5) {
                              setTimeout(() => {
                                otpInputRefs.current[i + 1]?.focus();
                              }, 0);
                            }
                          }}
                          onKeyDown={(e) => {
                            // Handle backspace to go to previous input
                            if (e.key === "Backspace" && !phoneOtp[i] && i > 0) {
                              setTimeout(() => {
                                otpInputRefs.current[i - 1]?.focus();
                              }, 0);
                            }
                          }}
                          ref={(el) => (otpInputRefs.current[i] = el)}
                          disabled={busy}
                          className="w-11 h-12 sm:w-12 sm:h-14 text-center text-xl font-black rounded-xl border-2 border-gray-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition disabled:opacity-60"
                        />
                      ))}
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5 text-sm text-red-600">
                      <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                      {error}
                    </div>
                  )}

                  <button
                    onClick={handleVerifyPhoneOtp}
                    disabled={busy || phoneOtp.join("").length !== 6}
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-black py-3.5 rounded-2xl transition-colors shadow-lg shadow-blue-200"
                  >
                    {busy ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                    {busy ? "Перевіряємо…" : "Підтвердити"}
                  </button>

                  <div className="flex items-center justify-center gap-2 flex-wrap">
                    <button
                      onClick={handleAddPhone}
                      disabled={phoneResendIn > 0 || busy}
                      className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium"
                    >
                      <RefreshCw size={14} />
                      {phoneResendIn > 0 ? `Повторний код через ${phoneResendIn}с` : "Надіслати код ще раз"}
                    </button>
                    <button
                      onClick={handleBackToPhoneEntry}
                      className="text-sm text-gray-400 hover:text-gray-700 transition-colors font-medium"
                    >
                      Змінити номер
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleAddPhone} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-gray-700">Номер телефону</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/\D/g, "");
                        if (!raw.length) {
                          setPhone("");
                          setPhoneError("");
                          setError("");
                          return;
                        }
                        let ten = raw.length === 12 && raw.startsWith("38") ? raw.slice(2) : raw.slice(-10);
                        if (ten.length === 10 && ten.startsWith("8")) ten = "0" + ten.slice(1);
                        else if (ten.length === 9 && !ten.startsWith("0")) ten = "0" + ten;
                        setPhone(formatPhoneDisplay(ten));
                        setPhoneError("");
                        setError("");
                      }}
                      onBlur={() => {
                        if (phone.trim() && !isValidPhone(phone)) setPhoneError("Номер некоректний");
                        else setPhoneError("");
                      }}
                      placeholder="+38 (067) 123-45-67"
                      disabled={busy}
                      autoComplete="tel"
                      className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition disabled:opacity-60 disabled:cursor-not-allowed ${phoneError ? "border-red-400 bg-red-50/50" : "border-gray-200"}`}
                    />
                    {phoneError && (
                      <p className="text-sm text-red-600 flex items-center gap-1.5">
                        <AlertCircle size={14} className="flex-shrink-0" />
                        {phoneError}
                      </p>
                    )}
                  </div>

                  {error && (
                    <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5 text-sm text-red-600">
                      <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={busy || !phone.trim() || !isValidPhone(phone)}
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-black py-3.5 rounded-2xl transition-colors shadow-lg shadow-blue-200"
                  >
                    {busy ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                    {busy ? "Додаємо…" : "Додати номер"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── PROFILE STEP ── */
  return (
    <div className={`
      min-h-screen bg-gray-50 flex flex-col
      ${is.mobile ? 'pb-20' : ''}
    `}>
      <motion.div className={`
        flex-1 
        ${is.mobile ? 'py-6 px-4' : 'py-10 px-4'}
      `} layout>
        <div className={`
          mx-auto
          ${is.mobile ? 'max-w-full' : 'max-w-2xl'}
        `}>

        {/* Header */}
        <div className={`
          flex items-center justify-between 
          ${is.mobile ? 'mb-6 flex-col gap-4' : 'mb-8'}
        `}>
          <div className={is.mobile ? 'text-center' : ''}>
            <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700">
              <ChevronLeft size={is.mobile ? 18 : 15} />
              На головну
            </Link>
            <h1 className={`
              font-black text-gray-900
              ${is.mobile ? 'text-xl mt-2' : 'text-2xl'}
            `}>Особистий кабінет</h1>
          </div>
          <div className={`
            flex items-center gap-2
            ${is.mobile ? 'w-full justify-between' : ''}
          `}>
            <button
              onClick={handleLogout}
              className={`
                flex items-center gap-1.5 text-sm font-semibold transition-colors
                ${confirmLogout ? "text-red-600 hover:text-red-700" : "text-gray-400 hover:text-red-500"}
                ${is.mobile ? 'flex-1 justify-center py-2 border border-gray-200 rounded-lg' : ''}
              `}>
              <LogOut size={is.mobile ? 18 : 15} />
              <span className={is.mobile ? '' : ''}>{confirmLogout ? "Так, вийти" : "Вийти"}</span>
            </button>
            {confirmLogout && (
              <button
                type="button"
                onClick={() => setConfirmLogout(false)}
                className={`
                  text-sm text-gray-500 hover:text-gray-700
                  ${is.mobile ? 'flex-1 justify-center py-2 border border-gray-200 rounded-lg' : ''}
                `}>
                Скасувати
              </button>
            )}
          </div>
        </div>

        {/* Product Notifications Widget */}
        <ProductNotificationsWidget />

        {/* Sitniks Customer Stats */}
        {sitniksCustomer && (
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-3xl p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <ShoppingBag size={18} className="text-emerald-600" />
              <h3 className="font-black text-gray-900">Статистика покупок</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-black text-emerald-600">{sitniksCustomer.ordersCount || 0}</p>
                <p className="text-xs text-gray-600 font-medium">Замовлень</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-black text-emerald-600">
                  {sitniksCustomer.totalSpent ? sitniksCustomer.totalSpent.toLocaleString("uk-UA") : 0}
                </p>
                <p className="text-xs text-gray-600 font-medium">Витрачено, грн</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-black text-emerald-600">
                  {sitniksCustomer.averageOrderValue ? Math.round(sitniksCustomer.averageOrderValue).toLocaleString("uk-UA") : 0}
                </p>
                <p className="text-xs text-gray-600 font-medium">Середній чек, грн</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-black text-emerald-600">
                  {sitniksCustomer.lastOrderDate ? new Date(sitniksCustomer.lastOrderDate).toLocaleDateString("uk-UA", { day: "numeric", month: "short" }) : "-"}
                </p>
                <p className="text-xs text-gray-600 font-medium">Останнє замовлення</p>
              </div>
            </div>
            {sitniksCustomer.createdAt && (
              <p className="text-xs text-gray-500 text-center mt-3">
                Клієнт з {new Date(sitniksCustomer.createdAt).toLocaleDateString("uk-UA", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            )}
          </div>
        )}

        {/* User card */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-[#2E7D32]/10 rounded-full flex items-center justify-center flex-shrink-0">
              <User size={28} className="text-[#2E7D32]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-0.5">Мій профіль</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-black text-gray-900 text-lg">
                      {profileName.trim() ? `Привіт, ${profileName.trim()}!` : loggedEmail}
                    </p>
                    {/* Статус аккаунта */}
                    {loggedPhone ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#2E7D32]/10 text-[#2E7D32] text-xs font-bold rounded-full border border-[#2E7D32]/20">
                        <Shield size={11} />
                        Верифіковано
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-bold rounded-full border border-gray-200">
                        <AlertCircle size={11} />
                        Не верифіковано
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-green-600 font-semibold flex items-center gap-1 mt-0.5">
                    <CheckCircle size={11} />
                    Підтверджена пошта
                  </p>
                </div>
                <button
                  onClick={handleStartEditProfile}
                  className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900 rounded-xl transition-colors text-sm font-medium"
                >
                  <Edit3 size={14} />
                  Редагувати
                </button>
              </div>
              
              {/* Show input field only when no name is set */}
              {!profileName.trim() && (
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => {
                    const v = e.target.value;
                    setProfileName(v);
                  }}
                  placeholder="Додати ім'я"
                  className="mt-2 w-full max-w-[200px] px-2 py-1 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              )}
            </div>
          </div>
        </div>

        {/* Address Card */}
        {(profileCity && profileWarehouse) || profileAddress.trim() ? (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Truck size={28} className="text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-0.5">Адреса доставки</p>
                <p className="font-medium text-gray-900 text-sm break-words">
                  {profileCity && profileWarehouse ? `${profileCity}, ${profileWarehouse}` : profileAddress.trim()}
                </p>
              </div>
              <button
                onClick={handleStartEditProfile}
                className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900 rounded-xl transition-colors text-sm font-medium"
              >
                <Edit3 size={14} />
                Змінити
              </button>
            </div>
          </div>
        ) : null}

        {/* Edit Profile Modal */}
        <AnimatePresence mode="wait">
          {isEditingProfile && (
            <motion.div
              key="edit-profile-modal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
              onClick={handleCancelEdit}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ type: "spring", duration: 0.3 }}
                className="bg-white rounded-3xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-black text-gray-900">Редагувати профіль</h2>
                    <button
                      onClick={handleCancelEdit}
                      className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                    >
                      <X size={20} className="text-gray-500" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    {/* Name Fields */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-semibold text-gray-700">Ім&apos;я</label>
                      <input
                        type="text"
                        value={editFormData.name}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Введіть ім&apos;я"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-semibold text-gray-700">Прізвище</label>
                      <input
                        type="text"
                        value={editFormData.lastName}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, lastName: e.target.value }))}
                        placeholder="Введіть фамілію"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                      />
                    </div>

                    {/* Email Field */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-semibold text-gray-700">Email</label>
                      <input
                        type="email"
                        value={editFormData.email}
                        disabled
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
                      />
                      <p className="text-xs text-gray-500">Email не можна змінити</p>
                    </div>

                    {/* Phone Field */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-semibold text-gray-700">Телефон</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="tel"
                          value={newPhone}
                          onChange={(e) => {
                            const value = e.target.value;
                            // Extract only digits
                            let digits = value.replace(/\D/g, "");
                            
                            // Remove leading "38" if user is typing it (we add it automatically)
                            if (digits.startsWith("38") && digits.length > 2) {
                              digits = digits.slice(2);
                            }
                            
                            // If empty, clear
                            if (!digits) {
                              setNewPhone("");
                              setError("");
                              return;
                            }
                            
                            // Limit to 10 digits (Ukrainian phone without country code)
                            digits = digits.slice(0, 10);
                            
                            // Format and save
                            setNewPhone(formatPhoneDisplay(digits));
                            setError("");
                          }}
                          onFocus={() => {
                            // When focusing, if showing logged phone, clear it to allow new input
                            if (!newPhone && loggedPhone) {
                              setNewPhone("");
                            }
                          }}
                          placeholder="+38 (067) 123-45-67"
                          className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                        />
                        <button
                          onClick={loggedPhone ? () => setIsChangingPhone(true) : handleChangePhone}
                          disabled={loggedPhone ? false : (!newPhone.trim() || !isValidPhone(newPhone) || busy)}
                          className="px-3 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors text-sm"
                        >
                          {loggedPhone ? "Змінити" : "Додати"}
                        </button>
                      </div>
                      <p className="text-xs text-gray-500">{loggedPhone ? "Натисніть «Змінити» для оновлення номера" : "Натисніть «Додати» для додавання номера"}</p>
                    </div>

                    {/* Address Field */}
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-semibold text-gray-700">Місто доставки</label>
                        <div className="relative">
                          <input
                            type="text"
                            value={editFormData.city}
                            onChange={(e) => handleCitySearch(e.target.value)}
                            placeholder="Почніть вводити назву міста"
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                            autoComplete="off"
                          />
                          {citySearchLoading && (
                            <Loader2 size={16} className="absolute right-3 top-3 animate-spin text-emerald-600" />
                          )}
                          {showCityDropdown && cityResults.length > 0 && (
                            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-2xl shadow-2xl max-h-60 overflow-y-auto">
                              {cityResults.map((city) => (
                                <button
                                  key={city.Ref}
                                  type="button"
                                  onClick={() => handleCitySelect(city)}
                                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center gap-2"
                                >
                                  <Truck size={14} className="text-gray-400" />
                                  {city.Description}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        {(citySearchError) && (
                          <p className="text-xs text-red-500">{citySearchError}</p>
                        )}
                        <div className="flex flex-wrap gap-2">
                          <span className="text-xs font-semibold text-gray-400 w-full">Популярні міста:</span>
                          {(["Київ", "Одеса", "Харків", "Дніпро", "Львів"] as const).map((cityName) => (
                            <button
                              key={cityName}
                              type="button"
                              className="px-3 py-1.5 rounded-lg border text-xs font-semibold text-gray-600 hover:border-emerald-400 hover:text-emerald-600 transition"
                              onClick={() => {
                                handleCitySearch(cityName);
                                setTimeout(() => {
                                  const match = cityResults.find((c) => c.Description === cityName);
                                  if (match) handleCitySelect(match);
                                }, 0);
                              }}
                            >
                              {cityName}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-semibold text-gray-700">Відділення / поштомат</label>
                        <div className="relative">
                          <select
                            value={editFormData.warehouseRef}
                            onChange={(e) => handleWarehousePick({ Ref: e.target.value, Description: e.target.value })}
                            disabled={!editFormData.cityRef || warehouseLoading}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition disabled:bg-gray-50"
                          >
                            <option value="">
                              {editFormData.cityRef ? (warehouseLoading ? "Завантаження..." : "Оберіть відділення") : "Спочатку оберіть місто"}
                            </option>
                            {warehouseOptions.map((warehouse) => (
                              <option key={warehouse.Ref} value={warehouse.Ref}>
                                {warehouse.Description}
                              </option>
                            ))}
                          </select>
                          <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">▼</div>
                        </div>
                        {(warehouseError) && (
                          <p className="text-xs text-red-500">{warehouseError}</p>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">Адреса буде збережена для майбутніх замовлень</p>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={handleCancelEdit}
                      className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors"
                    >
                      Скасувати
                    </button>
                    <button
                      onClick={handleSaveProfile}
                      className="flex-1 px-4 py-3 bg-[#2E7D32] hover:bg-[#1B5E20] text-white font-black rounded-xl transition-colors shadow-lg shadow-[#2E7D32]/20"
                    >
                      Зберегти
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Change Phone Modal */}
        <AnimatePresence mode="wait">
          {isChangingPhone && (
            <motion.div
              key="change-phone-modal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
              onClick={handleCancelPhoneChange}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ type: "spring", duration: 0.3 }}
                className="bg-white rounded-3xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-black text-gray-900">Змінити номер телефону</h2>
                    <button
                      onClick={handleCancelPhoneChange}
                      className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                    >
                      <X size={20} className="text-gray-500" />
                    </button>
                  </div>

                  {!phoneOtpSent ? (
                    // Step 1: Enter new phone number
                    <div className="space-y-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-semibold text-gray-700">Новий номер телефону</label>
                        <input
                          type="tel"
                          value={newPhone}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/\D/g, "");
                            if (!raw.length) {
                              setNewPhone("");
                              setError("");
                              return;
                            }
                            let ten = raw.length === 12 && raw.startsWith("38") ? raw.slice(2) : raw.slice(-10);
                            if (ten.length === 10 && ten.startsWith("8")) ten = "0" + ten.slice(1);
                            else if (ten.length === 9 && !ten.startsWith("0")) ten = "0" + ten;
                            setNewPhone(formatPhoneDisplay(ten));
                            setError("");
                          }}
                          placeholder="+38 (067) 123-45-67"
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                        />
                      </div>

                      {error && (
                        <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5 text-sm text-red-600">
                          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                          {error}
                        </div>
                      )}

                      <button
                        onClick={handleChangePhone}
                        disabled={busy || !newPhone.trim() || !isValidPhone(newPhone)}
                        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-black py-3.5 rounded-2xl transition-colors shadow-lg shadow-blue-200"
                      >
                        {busy ? <Loader2 size={18} className="animate-spin" /> : <Phone size={18} />}
                        {busy ? "Відправляємо…" : "Додати"}
                      </button>
                    </div>
                  ) : (
                    // Step 2: Enter OTP code
                    <div className="space-y-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-semibold text-gray-700">Код підтвердження</label>
                        <p className="text-xs text-gray-500">Код надіслано на номер {newPhone}</p>
                        <div className="flex justify-center gap-2 sm:gap-3">
                          {[0, 1, 2, 3, 4, 5].map((i) => (
                            <input
                              key={i}
                              type="text"
                              inputMode="numeric"
                              maxLength={1}
                              value={phoneOtp[i]}
                              onChange={(e) => {
                                const digit = e.target.value.replace(/\D/g, "").slice(-1);
                                setError("");
                                setPhoneOtp((prev) => {
                                  const next = [...prev];
                                  next[i] = digit;
                                  return next;
                                });
                              }}
                              disabled={busy}
                              className="w-11 h-12 sm:w-12 sm:h-14 text-center text-xl font-black rounded-xl border-2 border-gray-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition disabled:opacity-60"
                            />
                          ))}
                        </div>
                      </div>

                      {error && (
                        <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5 text-sm text-red-600">
                          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                          {error}
                        </div>
                      )}

                      <button
                        onClick={handleVerifyPhoneOtp}
                        disabled={busy || phoneOtp.join("").length !== 6}
                        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-black py-3.5 rounded-2xl transition-colors shadow-lg shadow-blue-200"
                      >
                        {busy ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                        {busy ? "Перевіряємо…" : "Підтвердити"}
                      </button>

                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={handleChangePhone}
                          disabled={phoneResendIn > 0 || busy}
                          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium"
                        >
                          <RefreshCw size={14} />
                          {phoneResendIn > 0 ? `Повторний код через ${phoneResendIn}с` : "Надіслати код ще раз"}
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={handleCancelPhoneChange}
                      className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors"
                    >
                      Скасувати
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Phone verification block */}
        {!loggedPhone && (
          <div className="bg-blue-50 border border-blue-200 rounded-3xl p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Phone size={18} className="text-blue-600" />
                  <h3 className="font-black text-gray-900">Підтвердіть телефон</h3>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  Додайте номер телефону для отримання замовлень та сповіщень
                </p>
              </div>
              <button
                onClick={() => setStep("add-phone")}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-xl transition-colors text-sm"
              >
                <Plus size={14} />
                Додати
              </button>
            </div>
          </div>
        )}

        {/* Wishlist block */}
        {wishlistHydrated && (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Heart size={18} className="text-orange-500 fill-orange-500" />
                <h2 className="text-lg font-black text-gray-900">Список бажань</h2>
              </div>
              <Link
                href="/wishlist"
                className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
              >
                {wishlistCount} {wishlistCount === 1 ? "товар" : wishlistCount >= 5 ? "товарів" : "товари"}
                <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        )}

        {/* Personalized Promos Section */}
        {personalizedPromos.length > 0 && (
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-3xl p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <Sparkles size={18} className="text-white" />
              </div>
              <h3 className="font-black text-gray-900">Персональні пропозиції</h3>
            </div>
            <div className="space-y-3">
              {personalizedPromos.map((promo, index) => (
                <div key={index} className="bg-white/80 backdrop-blur rounded-2xl p-4 border border-purple-100">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-semibold text-purple-700 text-sm">{promo.description}</p>
                      <p className="text-xs text-gray-500">Мін. замовлення {promo.minOrder} грн</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-black text-purple-700">-{promo.discount}%</p>
                      <p className="text-xs text-gray-400">до {promo.expiresAt.toLocaleDateString("uk-UA", { day: "numeric", month: "short" })}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="text-sm font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded">{promo.code}</code>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(promo.code);
                        setCopiedPromo(true);
                        setTimeout(() => setCopiedPromo(false), 2000);
                      }}
                      className="text-xs font-semibold text-purple-600 hover:text-purple-700"
                    >
                      {copiedPromo ? "Скопійовано!" : "Копіювати"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Referral Section */}
        {referralPromos.length > 0 && (
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-3xl p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                <Users size={18} className="text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-black text-gray-900">Запросіть друзів</h3>
                <p className="text-xs text-gray-500">Отримайте 15% від кожного замовлення друга</p>
              </div>
            </div>
            
            {/* Referral Stats */}
            {referralStats.referralCount > 0 && (
              <div className="bg-white/60 backdrop-blur rounded-xl p-3 mb-4 border border-blue-100">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-lg font-black text-blue-600">{referralStats.referralCount}</p>
                    <p className="text-xs text-gray-600">Запрошено</p>
                  </div>
                  <div>
                    <p className="text-lg font-black text-green-600">{referralStats.totalReward} грн</p>
                    <p className="text-xs text-gray-600">Зароблено</p>
                  </div>
                  <div>
                    <p className="text-lg font-black text-amber-600">{referralStats.pendingReferrals}</p>
                    <p className="text-xs text-gray-600">Очікує</p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="space-y-3">
              {referralPromos.map((promo, index) => (
                <div key={index} className="bg-white/80 backdrop-blur rounded-2xl p-4 border border-blue-100">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-semibold text-blue-700 text-sm">{promo.description}</p>
                      <p className="text-xs text-gray-500">Поділіться з друзями та отримайте знижку</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-black text-blue-700">-{promo.discount}%</p>
                      <p className="text-xs text-gray-400">до {promo.expiresAt.toLocaleDateString("uk-UA", { day: "numeric", month: "short" })}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="text-sm font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">{userReferralCode || promo.code}</code>
                    <button
                      type="button"
                      onClick={() => {
                        const code = userReferralCode || promo.code;
                        navigator.clipboard.writeText(code);
                        setCopiedPromo(true);
                        setTimeout(() => setCopiedPromo(false), 2000);
                      }}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                    >
                      {copiedPromo ? "Скопійовано!" : "Копіювати"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const referralUrl = `${window.location.origin}/?ref=${userReferralCode || promo.code}`;
                        navigator.clipboard.writeText(referralUrl);
                        setCopiedPromo(true);
                        setTimeout(() => setCopiedPromo(false), 2000);
                      }}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                    >
                      {copiedPromo ? "Посилання скопійовано!" : "Копіювати посилання"}
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    Посилання: <code className="bg-gray-100 px-1 rounded">{window.location.origin}/?ref={userReferralCode || promo.code}</code>
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
        {showPromoBlock && userPromoCode && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-3xl p-6 mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center">
                  <Tag size={18} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700">Ваш промокод</p>
                  <p className="text-xs text-gray-500">{userPromoCode.description}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black text-amber-700">-{userPromoCode.discount}%</p>
                <p className="text-xs text-gray-500">Мін. замовлення {userPromoCode.minOrder} грн</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xl font-black text-amber-700 tracking-widest flex-1">{userPromoCode.code}</span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(userPromoCode.code);
                  setCopiedPromo(true);
                  setTimeout(() => setCopiedPromo(false), 2000);
                }}
                className="flex items-center gap-1.5 text-sm font-semibold text-amber-700 hover:text-amber-800 bg-white px-3 py-2 rounded-xl border border-amber-200 transition-colors"
              >
                <Copy size={14} />
                {copiedPromo ? "Скопійовано!" : "Копіювати"}
              </button>
            </div>
            <div className="mt-3 pt-3 border-t border-amber-200">
              <p className="text-xs text-gray-500 text-center">
                Діє до {userPromoCode.expiresAt.toLocaleDateString("uk-UA", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>
          </div>
        )}

        {/* Orders section */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-5">
            <ShoppingBag size={18} className="text-emerald-600" />
            <h2 className="text-lg font-black text-gray-900">Мої замовлення</h2>
          </div>

          {ordersLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={28} className="text-emerald-600 animate-spin" />
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package size={36} className="text-gray-300" />
              </div>
              <p className="font-bold text-gray-500 mb-1">Замовлень поки немає</p>
              <p className="text-sm text-gray-400 mb-6 max-w-xs mx-auto leading-relaxed">
                Ваші майбутні замовлення з каталогу будуть відображатися тут.
              </p>
              <Link
                href="/#catalog"
                className="inline-flex items-center gap-2 bg-[#2E7D32] hover:bg-[#1B5E20] text-white font-bold py-3 px-6 rounded-2xl transition-colors shadow-lg shadow-[#2E7D32]/20 text-sm"
              >
                Перейти до каталогу
                <ChevronRight size={15} />
              </Link>
              {wishlistHydrated && wishlistIds.size > 0 && allProducts.length > 0 && (
                <div className="mt-10 text-left">
                  <p className="text-sm font-semibold text-gray-700 mb-3">Можливо, вас зацікавить...</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {allProducts.filter((p) => wishlistIds.has(p.id)).slice(0, 4).map((product) => (
                      <Link key={product.id} href={`/product/${product.id}`} className="block rounded-xl border border-gray-100 overflow-hidden bg-white hover:shadow-md transition-shadow">
                        <div className="aspect-square relative bg-gray-100">
                          <NextImage 
                            src={product.image || ''} 
                            alt={product.name || 'Товар'} 
                            fill 
                            sizes="120px" 
                            className="object-cover" 
                            {...blurProps()}
                            onError={(e) => {
                              console.log('[Profile] Wishlist image error:', product.image);
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        </div>
                        <div className="p-2">
                          <p className="text-xs font-bold text-gray-900 truncate">{product.name}</p>
                          <p className="text-xs font-semibold text-emerald-600">{product.price.toLocaleString("uk-UA")} грн</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {orders.map((order) => {
                const { label, color } = statusStyle(order.status);
                return (
                  <div key={order.id} className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden">
                    {/* Order Header */}
                    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 px-6 py-4 border-b border-emerald-100">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <ShoppingBag size={16} className="text-emerald-600" />
                            <p className="font-black text-gray-900 text-lg">Замовлення #{order.id}</p>
                          </div>
                          <p className="text-xs text-gray-500">
                            {new Date(order.createdAt).toLocaleDateString("uk-UA", {
                              day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit"
                            })}
                          </p>
                        </div>
                        <span className={`text-sm font-bold px-4 py-2 rounded-full border ${color}`}>
                          {label}
                        </span>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="p-6">
                      <div className="space-y-4">
                        {order.items.map((item, i) => {
                          const isValidProduct = item.id && validProductIds.has(item.id);
                          
                          // Debug: Log each item's validation
                          console.log(`[profile] Order item ${i}:`, {
                            itemId: item.id,
                            itemName: item.name,
                            isValid: isValidProduct,
                            inValidIds: item.id && validProductIds.has(item.id)
                          });
                          
                          return (
                            <div key={i} className={`flex gap-4 p-4 bg-gray-50 rounded-2xl ${isValidProduct ? 'hover:bg-gray-100 transition-colors' : 'opacity-75'}`}>
                              {/* Product Image */}
                              <div className="w-20 h-20 bg-white rounded-xl overflow-hidden flex-shrink-0 border border-gray-100">
                                <div className="w-full h-full relative">
                                  {item.image && item.image !== PLACEHOLDER_IMG && typeof item.image === 'string' ? (
                                    <NextImage
                                      src={item.image}
                                      alt={item.name || 'Товар'}
                                      fill
                                      sizes="80px"
                                      className="object-cover"
                                      {...blurProps()}
                                      onError={(e) => {
                                        console.log('[Profile] Image load error:', item.image);
                                        e.currentTarget.style.display = 'none';
                                      }}
                                    />
                                  ) : (
                                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                                      <Package size={24} className="text-gray-300" />
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              {/* Product Details */}
                              <div className="flex-1 min-w-0">
                                <h4 className={`font-bold text-sm mb-1 line-clamp-2 ${isValidProduct ? 'text-gray-900 hover:text-orange-500 transition-colors cursor-pointer' : 'text-gray-600'}`}>
                                  {item.id ? (
                                    <SafeProductLink productId={item.id} className="block">
                                      {item.name}
                                    </SafeProductLink>
                                  ) : (
                                    <span>{item.name}</span>
                                  )}
                                </h4>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-500">Кількість:</span>
                                    <span className="text-sm font-semibold text-gray-700">{item.quantity} шт.</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-black text-emerald-600 text-sm">
                                      {(item.price * item.quantity).toLocaleString("uk-UA")} грн
                                    </span>
                                    {!isValidProduct && (
                                      <span className="text-xs text-gray-400 bg-gray-200 px-2 py-1 rounded">
                                        Недоступно
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Order Total */}
                      <div className="mt-6 pt-4 border-t border-gray-100">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-500">Сума замовлення</p>
                            <p className="text-2xl font-black text-gray-900 mt-1">
                              {order.total.toLocaleString("uk-UA")} грн
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-400 mb-2">Оплата:</p>
                            <span className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border ${getPaymentMethod(order).color}`}>
                              <span className="text-sm">{getPaymentMethod(order).icon}</span>
                              {getPaymentMethod(order).label}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Tracking Number Display */}
                      {order.trackingNumber && (
                        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                          <p className="text-xs text-gray-600 font-semibold mb-1">Номер ТТН:</p>
                          <div className="flex items-center gap-2">
                            <code className="text-sm font-bold text-blue-700">{order.trackingNumber}</code>
                            <button
                              type="button"
                              onClick={async () => {
                                await navigator.clipboard?.writeText(order.trackingNumber!);
                                setCopiedTTN(order.trackingNumber!);
                                setTimeout(() => setCopiedTTN(null), 2000);
                              }}
                              className="text-blue-600 hover:text-blue-700 transition-colors"
                            >
                              {copiedTTN === order.trackingNumber ? (
                                <CheckCircle size={14} className="text-green-600" />
                              ) : (
                                <Copy size={14} />
                              )}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="mt-6 flex flex-wrap gap-2">
                        {/* Show Track Order button for active orders (not delivered/cancelled) */}
                        {(order.status !== "Доставлено" && order.status !== "Скасовано") ? (
                          <button
                            type="button"
                            onClick={() => {
                              setTrackingTtn(order.trackingNumber || null);
                              setShowTracking(true);
                              // Scroll to tracking section
                              setTimeout(() => {
                                const element = document.querySelector('[data-tracking-section]');
                                if (element) {
                                  element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                }
                              }, 100);
                            }}
                            className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 px-4 rounded-xl transition-colors text-sm border border-gray-300"
                          >
                            <Truck size={14} />
                            Відстежити замовлення
                          </button>
                        ) : (
                          /* Show Repeat Order button only for completed orders */
                          <button
                            type="button"
                            onClick={() => {
                              order.items.forEach((item, idx) => {
                                const id = item.id ?? -(Number(order.id) * 1000 + idx);
                                addItem({
                                  id,
                                  name: item.name,
                                  price: item.price,
                                  image: item.image ?? PLACEHOLDER_IMG,
                                  size: null,
                                });
                                if (item.quantity > 1) updateQuantity(id, item.quantity);
                              });
                              router.push("/checkout");
                            }}
                            className="inline-flex items-center gap-2 bg-[#2E7D32] hover:bg-[#1B5E20] text-white font-semibold py-2.5 px-4 rounded-xl transition-colors text-sm shadow-sm"
                          >
                            <RotateCcw size={14} />
                            Повторити
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        </div>

        {/* Tracking Section - Hidden by default, shown with animation */}
        <motion.div
          layout
          initial={{ opacity: 0, height: 0, y: -30 }}
          animate={{ 
            opacity: showTracking ? 1 : 0, 
            height: showTracking ? "auto" : 0,
            y: showTracking ? 0 : -30 
          }}
          transition={{ 
            opacity: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
            height: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
            y: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }
          }}
          className="border-t border-gray-200 pt-8 overflow-hidden"
          data-tracking-section
        >
          <div className="w-full max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-gray-900">Відстеження посилки</h2>
              <button
                type="button"
                onClick={() => setShowTracking(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <ShopNovaPoshta initialTtn={trackingTtn || undefined} fullWidth={true} />
          </div>
        </motion.div>
      </motion.div>
      <ShopFooter />
    </div>
  );
}



