import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Wallet,
  CreditCard,
  TrendingUp,
  Calendar,
  Plus,
  Search,
  Download,
  Upload,
  FileSpreadsheet,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Edit3,
  X,
  Check,
  ShieldCheck,
  Clock,
  Receipt,
  Zap,
  RefreshCw,
  ChevronRight,
  BarChart3,
  RotateCcw,
  Flame,
  Smartphone,
  Monitor,
  Share,
  PlusSquare,
  SlidersHorizontal,
  Globe,
  Lock,
  CheckCheck
} from 'lucide-react';

// --- CONSTANTS & CONFIG ---
const STORAGE_KEY = 'vaultflow_offline_tracker_v1';

const CURRENCIES = {
  INR: { symbol: '₹', code: 'INR', name: 'Indian Rupee (₹)', locale: 'en-IN' },
  USD: { symbol: '$', code: 'USD', name: 'US Dollar ($)', locale: 'en-US' },
  EUR: { symbol: '€', code: 'EUR', name: 'Euro (€)', locale: 'de-DE' },
  GBP: { symbol: '£', code: 'GBP', name: 'British Pound (£)', locale: 'en-GB' },
};

const CATEGORIES = [
  { id: 'Food & Dining', label: 'Food & Dining', color: '#f59e0b', bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30' },
  { id: 'Groceries', label: 'Groceries', color: '#10b981', bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  { id: 'Transport', label: 'Transport & Fuel', color: '#3b82f6', bg: 'bg-blue-500/15', text: 'text-blue-400', border: 'border-blue-500/30' },
  { id: 'Shopping', label: 'Shopping', color: '#ec4899', bg: 'bg-pink-500/15', text: 'text-pink-400', border: 'border-pink-500/30' },
  { id: 'Bills & Utilities', label: 'Bills & Utilities', color: '#8b5cf6', bg: 'bg-violet-500/15', text: 'text-violet-400', border: 'border-violet-500/30' },
  { id: 'Tech & Subs', label: 'Tech & Subscriptions', color: '#06b6d4', bg: 'bg-cyan-500/15', text: 'text-cyan-400', border: 'border-cyan-500/30' },
  { id: 'Entertainment', label: 'Entertainment', color: '#f43f5e', bg: 'bg-rose-500/15', text: 'text-rose-400', border: 'border-rose-500/30' },
  { id: 'Health', label: 'Health & Fitness', color: '#14b8a6', bg: 'bg-teal-500/15', text: 'text-teal-400', border: 'border-teal-500/30' },
  { id: 'Travel', label: 'Travel', color: '#6366f1', bg: 'bg-indigo-500/15', text: 'text-indigo-400', border: 'border-indigo-500/30' },
  { id: 'Other', label: 'Other', color: '#94a3b8', bg: 'bg-slate-500/15', text: 'text-slate-300', border: 'border-slate-500/30' },
];

const SPEND_TYPES = [
  { id: 'Need', label: 'Need (Essential)', desc: 'Groceries, commute, medicine', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', hex: '#10b981' },
  { id: 'Want', label: 'Want (Discretionary)', desc: 'Dining out, gadgets, leisure', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', hex: '#f59e0b' },
  { id: 'Fixed', label: 'Fixed / Recurring', desc: 'Rent, broadband, subscriptions', color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/30', hex: '#6366f1' },
];

const PAYMENT_METHODS = [
  { id: 'UPI', label: 'UPI / QR' },
  { id: 'Credit Card', label: 'Credit Card' },
  { id: 'Debit / Cash', label: 'Debit / Cash' },
  { id: 'Bank Transfer', label: 'Bank Transfer' },
];

const DEFAULT_CARDS = [
  {
    id: 'cc-hdfc-infinia',
    name: 'HDFC Infinia Metal',
    last4: '4829',
    limit: 300000,
    statementDay: 18,
    dueDay: 5,
    rewardRate: 3.3,
    gradient: 'from-slate-800 via-indigo-950 to-slate-900',
    accent: '#818cf8'
  },
  {
    id: 'cc-icici-amazon',
    name: 'ICICI Amazon Pay',
    last4: '9014',
    limit: 150000,
    statementDay: 25,
    dueDay: 12,
    rewardRate: 2.0,
    gradient: 'from-amber-950/90 via-slate-900 to-slate-950',
    accent: '#fbbf24'
  },
  {
    id: 'cc-sbi-cashback',
    name: 'SBI Cashback Card',
    last4: '3310',
    limit: 120000,
    statementDay: 10,
    dueDay: 28,
    rewardRate: 5.0,
    gradient: 'from-cyan-950 via-blue-950 to-slate-900',
    accent: '#38bdf8'
  }
];

const DEFAULT_QUICK_PRESETS = [
  { id: 'qp-1', title: 'Morning Filter Coffee & Snack', amount: 120, category: 'Food & Dining', spendType: 'Want', paymentMethod: 'UPI' },
  { id: 'qp-2', title: 'Metro / Auto Commute', amount: 160, category: 'Transport', spendType: 'Need', paymentMethod: 'UPI' },
  { id: 'qp-3', title: 'Quick Veggies & Milk', amount: 340, category: 'Groceries', spendType: 'Need', paymentMethod: 'UPI' },
  { id: 'qp-4', title: 'Online Order (Credit Card)', amount: 1450, category: 'Shopping', spendType: 'Want', paymentMethod: 'Credit Card' },
];

// Helper to get YYYY-MM-DD in local timezone
const toLocalISO = (dateObj = new Date()) => {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Generate realistic sample data anchored around today's date
const generateSampleData = (cards = DEFAULT_CARDS) => {
  const today = new Date();
  const daysAgo = (n) => {
    const d = new Date(today);
    d.setDate(today.getDate() - n);
    return toLocalISO(d);
  };

  const c1 = cards[0]?.id || 'cc-hdfc-infinia';
  const c2 = cards[1]?.id || 'cc-icici-amazon';
  const c3 = cards[2]?.id || 'cc-sbi-cashback';

  return [
    {
      id: 'exp-sample-1',
      title: 'Specialty Cold Brew & Croissant',
      amount: 380,
      date: daysAgo(0),
      category: 'Food & Dining',
      spendType: 'Want',
      paymentMethod: 'UPI',
      cardId: null,
      ccBillType: 'Floating',
      emiMonths: 1,
      cashbackEst: 0,
      reimbursable: false,
      reimbursed: false,
      cardSettled: false,
      note: 'Morning work session'
    },
    {
      id: 'exp-sample-2',
      title: 'Amazon Mechanical Keycaps & USB-C Hub',
      amount: 4299,
      date: daysAgo(0),
      category: 'Shopping',
      spendType: 'Want',
      paymentMethod: 'Credit Card',
      cardId: c2,
      ccBillType: 'Floating',
      emiMonths: 1,
      cashbackEst: 215,
      reimbursable: false,
      reimbursed: false,
      cardSettled: false,
      note: '5% Prime cashback applied'
    },
    {
      id: 'exp-sample-3',
      title: 'Weekly Organic Groceries & Fruits',
      amount: 1840,
      date: daysAgo(1),
      category: 'Groceries',
      spendType: 'Need',
      paymentMethod: 'Credit Card',
      cardId: c1,
      ccBillType: 'Floating',
      emiMonths: 1,
      cashbackEst: 60,
      reimbursable: false,
      reimbursed: false,
      cardSettled: false,
      note: 'Fresh produce stockup'
    },
    {
      id: 'exp-sample-4',
      title: 'Uber Airport Drop (Client Visit)',
      amount: 860,
      date: daysAgo(1),
      category: 'Transport',
      spendType: 'Need',
      paymentMethod: 'Credit Card',
      cardId: c1,
      ccBillType: 'Floating',
      emiMonths: 1,
      cashbackEst: 28,
      reimbursable: true,
      reimbursed: false,
      cardSettled: false,
      note: 'Claim in monthly office expense sheet'
    },
    {
      id: 'exp-sample-5',
      title: 'Fiber Gigabit Broadband & OTT Bundle',
      amount: 1415,
      date: daysAgo(2),
      category: 'Bills & Utilities',
      spendType: 'Fixed',
      paymentMethod: 'Credit Card',
      cardId: c3,
      ccBillType: 'Recurring',
      emiMonths: 1,
      cashbackEst: 70,
      reimbursable: false,
      reimbursed: false,
      cardSettled: false,
      note: 'Monthly auto-debit on card'
    },
    {
      id: 'exp-sample-6',
      title: 'Dinner with Friends at Pan-Asian Bistro',
      amount: 2650,
      date: daysAgo(3),
      category: 'Food & Dining',
      spendType: 'Want',
      paymentMethod: 'Credit Card',
      cardId: c1,
      ccBillType: 'Floating',
      emiMonths: 1,
      cashbackEst: 88,
      reimbursable: false,
      reimbursed: false,
      cardSettled: false,
      note: 'Dineout Pay discount'
    },
    {
      id: 'exp-sample-7',
      title: 'Shell Full Tank Petrol',
      amount: 3100,
      date: daysAgo(4),
      category: 'Transport',
      spendType: 'Need',
      paymentMethod: 'UPI',
      cardId: null,
      ccBillType: 'Floating',
      emiMonths: 1,
      cashbackEst: 0,
      reimbursable: false,
      reimbursed: false,
      cardSettled: false,
      note: 'Highway commute'
    },
    {
      id: 'exp-sample-8',
      title: 'Cloud Storage & AI Pro Subscriptions',
      amount: 1950,
      date: daysAgo(5),
      category: 'Tech & Subs',
      spendType: 'Fixed',
      paymentMethod: 'Credit Card',
      cardId: c3,
      ccBillType: 'Recurring',
      emiMonths: 1,
      cashbackEst: 97,
      reimbursable: false,
      reimbursed: false,
      cardSettled: false,
      note: 'Monthly dev tools'
    },
    {
      id: 'exp-sample-9',
      title: 'Ergonomic Office Chair Upgrade (EMI 1/6)',
      amount: 3500,
      date: daysAgo(6),
      category: 'Shopping',
      spendType: 'Want',
      paymentMethod: 'Credit Card',
      cardId: c2,
      ccBillType: 'EMI',
      emiMonths: 6,
      cashbackEst: 0,
      reimbursable: false,
      reimbursed: false,
      cardSettled: false,
      note: 'No-cost EMI 6 months'
    },
    {
      id: 'exp-sample-10',
      title: 'Electricity Bill Payment',
      amount: 2480,
      date: daysAgo(8),
      category: 'Bills & Utilities',
      spendType: 'Fixed',
      paymentMethod: 'UPI',
      cardId: null,
      ccBillType: 'Floating',
      emiMonths: 1,
      cashbackEst: 0,
      reimbursable: false,
      reimbursed: false,
      cardSettled: false,
      note: 'State power portal'
    },
    {
      id: 'exp-sample-11',
      title: 'Pharmacy & Whey Protein Isolate',
      amount: 3200,
      date: daysAgo(10),
      category: 'Health',
      spendType: 'Need',
      paymentMethod: 'Credit Card',
      cardId: c3,
      ccBillType: 'Floating',
      emiMonths: 1,
      cashbackEst: 160,
      reimbursable: false,
      reimbursed: false,
      cardSettled: true,
      note: 'Already settled in early bill payment'
    },
    {
      id: 'exp-sample-12',
      title: 'Apartment Maintenance & Society Fee',
      amount: 4500,
      date: daysAgo(12),
      category: 'Bills & Utilities',
      spendType: 'Fixed',
      paymentMethod: 'Bank Transfer',
      cardId: null,
      ccBillType: 'Floating',
      emiMonths: 1,
      cashbackEst: 0,
      reimbursable: false,
      reimbursed: false,
      cardSettled: false,
      note: 'NEFT transfer'
    }
  ];
};

export default function App() {
  // --- STATE INITIALIZATION WITH LOCALSTORAGE ---
  const [dataLoaded, setDataLoaded] = useState(false);
  const [expenses, setExpenses] = useState([]);
  const [cards, setCards] = useState(DEFAULT_CARDS);
  const [settlementHistory, setSettlementHistory] = useState([]);
  const [settings, setSettings] = useState({
    currency: 'INR',
    monthlyBudget: 60000,
    bankBalance: 115000, // For "True Disposable Bank Balance" shield calculation
    quickPresets: DEFAULT_QUICK_PRESETS,
  });

  // Navigation & View States
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'credit-cards' | 'ledger' | 'setup'
  const [timeframe, setTimeframe] = useState('daily'); // 'daily' | 'weekly' | 'monthly'
  const [selectedDayISO, setSelectedDayISO] = useState(toLocalISO(new Date()));
  const [iphoneFrameMode, setIphoneFrameMode] = useState(true); // Toggle iPhone preview frame on laptop screens

  // iOS Slide-Up Add/Edit Sheet State
  const [addSheetOpen, setAddSheetOpen] = useState(false);

  // Expense Form State
  const [editingId, setEditingId] = useState(null);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(toLocalISO(new Date()));
  const [category, setCategory] = useState('Food & Dining');
  const [spendType, setSpendType] = useState('Need');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  // Conditional Credit Card Form Fields
  const [selectedCardId, setSelectedCardId] = useState(DEFAULT_CARDS[0].id);
  const [ccBillType, setCcBillType] = useState('Floating'); // 'Floating' | 'EMI' | 'Recurring'
  const [emiMonths, setEmiMonths] = useState(3);
  const [cashbackEst, setCashbackEst] = useState('');
  const [reimbursable, setReimbursable] = useState(false);
  const [note, setNote] = useState('');

  // Filters & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [filterPayment, setFilterPayment] = useState('ALL');
  const [filterSpendType, setFilterSpendType] = useState('ALL');

  // Modals & UI Notifications
  const [toast, setToast] = useState(null);
  const [budgetModalOpen, setBudgetModalOpen] = useState(false);
  const [cardModalOpen, setCardModalOpen] = useState(false);
  const [settleModalCard, setSettleModalCard] = useState(null);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [iosGuideModalOpen, setIosGuideModalOpen] = useState(false);

  // New/Edit Card Modal Fields
  const [cardForm, setCardForm] = useState({
    id: null,
    name: '',
    last4: '',
    limit: 100000,
    statementDay: 15,
    dueDay: 5,
    rewardRate: 1.5,
    gradient: 'from-slate-800 via-indigo-950 to-slate-900',
  });

  const titleInputRef = useRef(null);
  const fileInputRef = useRef(null);

  // Toast helper
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 3400);
  };

  // --- LOAD & PERSIST LOCALSTORAGE ---
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.expenses)) setExpenses(parsed.expenses);
        if (Array.isArray(parsed.cards) && parsed.cards.length > 0) {
          setCards(parsed.cards);
          setSelectedCardId(parsed.cards[0].id);
        }
        if (Array.isArray(parsed.settlementHistory)) setSettlementHistory(parsed.settlementHistory);
        if (parsed.settings) {
          setSettings((prev) => ({ ...prev, ...parsed.settings }));
        }
      } else {
        // First visit: load sample data so the user can immediately explore charts & CC center
        const initialExpenses = generateSampleData(DEFAULT_CARDS);
        setExpenses(initialExpenses);
      }
    } catch (e) {
      console.error('Error loading from localStorage:', e);
    } finally {
      setDataLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!dataLoaded) return;
    try {
      const payload = {
        expenses,
        cards,
        settlementHistory,
        settings,
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      console.error('Error saving to localStorage:', e);
    }
  }, [expenses, cards, settlementHistory, settings, dataLoaded]);

  // --- KEYBOARD SHORTCUTS (N or / to focus Quick Add) ---
  useEffect(() => {
    const handleKeyDown = (e) => {
      const tag = document.activeElement?.tagName?.toLowerCase();
      const isTyping = tag === 'input' || tag === 'textarea' || tag === 'select';
      if (!isTyping && (e.key === 'n' || e.key === 'N' || e.key === '/')) {
        e.preventDefault();
        setEditingId(null);
        setAddSheetOpen(true);
        setTimeout(() => titleInputRef.current?.focus(), 100);
      }
      if (e.key === 'Escape') {
        document.activeElement?.blur();
        setAddSheetOpen(false);
        setBudgetModalOpen(false);
        setCardModalOpen(false);
        setSettleModalCard(null);
        setConfirmClearOpen(false);
        setIosGuideModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Auto-calculate estimated cashback when amount or card changes
  useEffect(() => {
    if (paymentMethod === 'Credit Card' && amount && !editingId) {
      const card = cards.find((c) => c.id === selectedCardId);
      if (card && card.rewardRate) {
        const est = Math.round((Number(amount) * Number(card.rewardRate)) / 100);
        setCashbackEst(String(est));
      }
    }
  }, [amount, selectedCardId, paymentMethod, cards, editingId]);

  // --- CURRENCY FORMATTER ---
  const cur = CURRENCIES[settings.currency] || CURRENCIES.INR;
  const formatMoney = (val) => {
    const num = Number(val) || 0;
    try {
      return new Intl.NumberFormat(cur.locale, {
        style: 'currency',
        currency: cur.code,
        maximumFractionDigits: 0,
      }).format(num);
    } catch {
      return `${cur.symbol}${num.toLocaleString()}`;
    }
  };

  // --- ADD / UPDATE EXPENSE ---
  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setAmount('');
    setDate(toLocalISO(new Date()));
    setCashbackEst('');
    setReimbursable(false);
    setNote('');
    setCcBillType('Floating');
  };

  const openNewExpenseSheet = () => {
    resetForm();
    setAddSheetOpen(true);
    setTimeout(() => titleInputRef.current?.focus(), 120);
  };

  const handleSaveExpense = (e) => {
    e.preventDefault();
    const numericAmount = parseFloat(amount);
    if (!title.trim() || isNaN(numericAmount) || numericAmount <= 0) {
      showToast('Enter a valid title & positive amount', 'error');
      return;
    }

    const isCC = paymentMethod === 'Credit Card';
    const expensePayload = {
      id: editingId || `exp-${Date.now()}`,
      title: title.trim(),
      amount: numericAmount,
      date: date || toLocalISO(new Date()),
      category,
      spendType,
      paymentMethod,
      cardId: isCC ? (selectedCardId || cards[0]?.id) : null,
      ccBillType: isCC ? ccBillType : 'Floating',
      emiMonths: isCC && ccBillType === 'EMI' ? Number(emiMonths) || 3 : 1,
      cashbackEst: isCC ? Number(cashbackEst) || 0 : 0,
      reimbursable: Boolean(reimbursable),
      reimbursed: false,
      cardSettled: false,
      note: note.trim(),
    };

    if (editingId) {
      setExpenses((prev) =>
        prev.map((item) =>
          item.id === editingId
            ? { ...expensePayload, cardSettled: item.cardSettled, reimbursed: item.reimbursed }
            : item
        )
      );
      showToast(`Updated "${expensePayload.title}"`);
    } else {
      setExpenses((prev) => [expensePayload, ...prev]);
      showToast(
        isCC
          ? `Added ${formatMoney(numericAmount)} to ${cards.find((c) => c.id === expensePayload.cardId)?.name || 'Card'}`
          : `Logged ${formatMoney(numericAmount)} (${paymentMethod})`
      );
    }

    resetForm();
    setAddSheetOpen(false);
  };

  const handleEditExpense = (exp) => {
    setEditingId(exp.id);
    setTitle(exp.title);
    setAmount(String(exp.amount));
    setDate(exp.date);
    setCategory(exp.category);
    setSpendType(exp.spendType || 'Need');
    setPaymentMethod(exp.paymentMethod);
    if (exp.cardId) setSelectedCardId(exp.cardId);
    setCcBillType(exp.ccBillType || 'Floating');
    setEmiMonths(exp.emiMonths || 3);
    setCashbackEst(String(exp.cashbackEst || 0));
    setReimbursable(Boolean(exp.reimbursable));
    setNote(exp.note || '');
    setAddSheetOpen(true);
  };

  const handleDeleteExpense = (id) => {
    setExpenses((prev) => prev.filter((item) => item.id !== id));
    if (editingId === id) setEditingId(null);
    showToast('Expense removed', 'info');
  };

  const handleQuickPreset = (preset) => {
    setTitle(preset.title);
    setAmount(String(preset.amount));
    setCategory(preset.category);
    setSpendType(preset.spendType);
    setPaymentMethod(preset.paymentMethod);
    setDate(toLocalISO(new Date()));
    if (!addSheetOpen) setAddSheetOpen(true);
    showToast(`Loaded "${preset.title}"`, 'info');
  };

  // --- CREDIT CARD BILL SETTLEMENT (WITHOUT DOUBLE COUNTING) ---
  const handleSettleCardBill = (cardId, deductFromBank = true) => {
    const card = cards.find((c) => c.id === cardId);
    const unsettledForCard = expenses.filter(
      (e) => e.paymentMethod === 'Credit Card' && e.cardId === cardId && !e.cardSettled
    );
    const totalSettled = unsettledForCard.reduce((acc, e) => acc + e.amount, 0);

    if (totalSettled <= 0) {
      showToast('No outstanding balance to settle on this card.', 'info');
      setSettleModalCard(null);
      return;
    }

    // Mark all current unsettled transactions on this card as settled
    setExpenses((prev) =>
      prev.map((e) =>
        e.paymentMethod === 'Credit Card' && e.cardId === cardId && !e.cardSettled
          ? { ...e, cardSettled: true, settledAt: toLocalISO(new Date()) }
          : e
      )
    );

    // Optionally update the user's liquid bank balance so their bank shield stays accurate
    if (deductFromBank) {
      setSettings((prev) => ({
        ...prev,
        bankBalance: Math.max(0, (Number(prev.bankBalance) || 0) - totalSettled),
      }));
    }

    // Record in settlement history log
    const settlementEntry = {
      id: `settle-${Date.now()}`,
      cardId,
      cardName: card?.name || 'Credit Card',
      amount: totalSettled,
      count: unsettledForCard.length,
      date: toLocalISO(new Date()),
      txIds: unsettledForCard.map((u) => u.id),
    };
    setSettlementHistory((prev) => [settlementEntry, ...prev]);
    setSettleModalCard(null);
    showToast(`Settled ${formatMoney(totalSettled)} for ${card?.name} without duplicate expense counting!`);
  };

  // Undo a settlement if needed
  const handleUndoSettlement = (settlement) => {
    setExpenses((prev) =>
      prev.map((e) =>
        settlement.txIds.includes(e.id) ? { ...e, cardSettled: false } : e
      )
    );
    setSettlementHistory((prev) => prev.filter((s) => s.id !== settlement.id));
    showToast(`Reopened ${settlement.count} transactions on ${settlement.cardName}`, 'info');
  };

  // --- ANALYTICS & SAFE-TO-SPEND ENGINE ---
  const analytics = useMemo(() => {
    const now = new Date();
    const todayISO = toLocalISO(now);
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    // Days in current month & remaining days (inclusive of today)
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const currentDayOfMonth = now.getDate();
    const remainingDaysInMonth = Math.max(1, daysInMonth - currentDayOfMonth + 1);

    // Start of current week (Monday)
    const dayOfWeek = now.getDay(); // 0 is Sun, 1 is Mon
    const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const mondayDate = new Date(now);
    mondayDate.setDate(now.getDate() - diffToMonday);
    mondayDate.setHours(0, 0, 0, 0);
    const mondayISO = toLocalISO(mondayDate);

    // Filter expenses for current month
    const monthPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
    const monthExpenses = expenses.filter((e) => e.date.startsWith(monthPrefix));
    const todayExpenses = expenses.filter((e) => e.date === todayISO);

    // Week expenses (Monday through Sunday of current week)
    const sundayDate = new Date(mondayDate);
    sundayDate.setDate(mondayDate.getDate() + 6);
    const sundayISO = toLocalISO(sundayDate);
    const weekExpenses = expenses.filter((e) => e.date >= mondayISO && e.date <= sundayISO);

    const totalMonthSpent = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
    const totalTodaySpent = todayExpenses.reduce((sum, e) => sum + e.amount, 0);
    const totalWeekSpent = weekExpenses.reduce((sum, e) => sum + e.amount, 0);

    // Safe-to-Spend Metric:
    // Calculate remaining budget before today's spend or using current remaining budget across remaining days
    const remainingBudget = settings.monthlyBudget - totalMonthSpent;
    const safeToSpendDaily = Math.max(0, Math.round(remainingBudget / remainingDaysInMonth));
    const idealDailyBudget = Math.round(settings.monthlyBudget / daysInMonth);
    const weeklyTarget = idealDailyBudget * 7;

    // Spend Type Split (Need / Want / Fixed) for this month
    const spendTypeTotals = { Need: 0, Want: 0, Fixed: 0 };
    monthExpenses.forEach((e) => {
      const st = e.spendType || 'Need';
      spendTypeTotals[st] = (spendTypeTotals[st] || 0) + e.amount;
    });

    // Payment Method Split for this month
    const paymentTotals = { 'UPI': 0, 'Credit Card': 0, 'Debit / Cash': 0, 'Bank Transfer': 0 };
    monthExpenses.forEach((e) => {
      paymentTotals[e.paymentMethod] = (paymentTotals[e.paymentMethod] || 0) + e.amount;
    });

    // Category Breakdown for this month
    const categoryMap = {};
    monthExpenses.forEach((e) => {
      categoryMap[e.category] = (categoryMap[e.category] || 0) + e.amount;
    });
    const categoryBreakdown = CATEGORIES.map((cat) => ({
      ...cat,
      amount: categoryMap[cat.id] || 0,
      percentage: totalMonthSpent > 0 ? Math.round(((categoryMap[cat.id] || 0) / totalMonthSpent) * 100) : 0,
    })).filter((c) => c.amount > 0).sort((a, b) => b.amount - a.amount);

    // Last 7 Days Strip (for Daily View)
    const last7Days = Array.from({ length: 7 }, (_, idx) => {
      const d = new Date(now);
      d.setDate(now.getDate() - (6 - idx));
      const iso = toLocalISO(d);
      const dayExps = expenses.filter((e) => e.date === iso);
      const total = dayExps.reduce((s, e) => s + e.amount, 0);
      return {
        iso,
        shortDay: d.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNum: d.getDate(),
        total,
        count: dayExps.length,
        isToday: iso === todayISO,
      };
    });

    // Monday - Sunday Bar Chart (for Weekly View)
    const weekDaysChart = Array.from({ length: 7 }, (_, idx) => {
      const d = new Date(mondayDate);
      d.setDate(mondayDate.getDate() + idx);
      const iso = toLocalISO(d);
      const dayExps = expenses.filter((e) => e.date === iso);
      const total = dayExps.reduce((s, e) => s + e.amount, 0);
      const ccTotal = dayExps.filter((e) => e.paymentMethod === 'Credit Card').reduce((s, e) => s + e.amount, 0);
      return {
        iso,
        label: d.toLocaleDateString('en-US', { weekday: 'short' }),
        fullDate: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        total,
        ccTotal,
        directTotal: total - ccTotal,
        isToday: iso === todayISO,
      };
    });

    // Monthly Daily Burn-Rate Curve (Days 1..daysInMonth)
    let runningTotal = 0;
    const burnCurve = Array.from({ length: daysInMonth }, (_, idx) => {
      const dayNum = idx + 1;
      const iso = `${monthPrefix}-${String(dayNum).padStart(2, '0')}`;
      const daySum = monthExpenses.filter((e) => e.date === iso).reduce((s, e) => s + e.amount, 0);
      if (dayNum <= currentDayOfMonth) {
        runningTotal += daySum;
      }
      return {
        dayNum,
        iso,
        daySum,
        cumulative: dayNum <= currentDayOfMonth ? runningTotal : null,
        idealCumulative: Math.round((settings.monthlyBudget / daysInMonth) * dayNum),
      };
    });

    // Credit Card Liability & Per-Card Metrics
    const cardMetrics = cards.map((card) => {
      const cardAllUnsettled = expenses.filter(
        (e) => e.paymentMethod === 'Credit Card' && e.cardId === card.id && !e.cardSettled
      );
      const outstanding = cardAllUnsettled.reduce((s, e) => s + e.amount, 0);
      const utilization = card.limit > 0 ? Math.round((outstanding / card.limit) * 1000) / 10 : 0;
      const cashbackEarned = expenses
        .filter((e) => e.paymentMethod === 'Credit Card' && e.cardId === card.id)
        .reduce((s, e) => s + (Number(e.cashbackEst) || 0), 0);

      // Calculate days until next statement date
      let nextStatementDate = new Date(currentYear, currentMonth, card.statementDay || 15);
      if (nextStatementDate < now) {
        nextStatementDate = new Date(currentYear, currentMonth + 1, card.statementDay || 15);
      }
      const daysToStatement = Math.max(0, Math.ceil((nextStatementDate - now) / (1000 * 60 * 60 * 24)));

      return {
        ...card,
        outstanding,
        utilization,
        cashbackEarned,
        daysToStatement,
        unsettledCount: cardAllUnsettled.length,
        unsettledTx: cardAllUnsettled,
      };
    });

    const totalCCUnsettled = cardMetrics.reduce((s, c) => s + c.outstanding, 0);
    const totalCCLimit = cardMetrics.reduce((s, c) => s + (Number(c.limit) || 0), 0);
    const overallUtilization = totalCCLimit > 0 ? Math.round((totalCCUnsettled / totalCCLimit) * 1000) / 10 : 0;
    const totalCashbackEarned = cardMetrics.reduce((s, c) => s + c.cashbackEarned, 0);
    const totalReimbursablePending = expenses
      .filter((e) => e.reimbursable && !e.reimbursed)
      .reduce((s, e) => s + e.amount, 0);

    // True Unencumbered Bank Balance (Bank Balance minus Unsettled Credit Card Bills)
    const trueDisposableBank = (Number(settings.bankBalance) || 0) - totalCCUnsettled;

    return {
      todayISO,
      daysInMonth,
      currentDayOfMonth,
      remainingDaysInMonth,
      totalMonthSpent,
      totalTodaySpent,
      totalWeekSpent,
      remainingBudget,
      safeToSpendDaily,
      idealDailyBudget,
      weeklyTarget,
      spendTypeTotals,
      paymentTotals,
      categoryBreakdown,
      last7Days,
      weekDaysChart,
      burnCurve,
      cardMetrics,
      totalCCUnsettled,
      totalCCLimit,
      overallUtilization,
      totalCashbackEarned,
      totalReimbursablePending,
      trueDisposableBank,
    };
  }, [expenses, cards, settings]);

  // --- FILTERED EXPENSES FOR LEDGER ---
  const filteredExpenses = useMemo(() => {
    return expenses
      .filter((e) => {
        if (filterCategory !== 'ALL' && e.category !== filterCategory) return false;
        if (filterPayment !== 'ALL' && e.paymentMethod !== filterPayment) return false;
        if (filterSpendType !== 'ALL' && e.spendType !== filterSpendType) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = e.title.toLowerCase().includes(q);
          const matchCat = e.category.toLowerCase().includes(q);
          const matchNote = (e.note || '').toLowerCase().includes(q);
          return matchTitle || matchCat || matchNote;
        }
        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [expenses, filterCategory, filterPayment, filterSpendType, searchQuery]);

  // --- DATA BACKUP / RESTORE / CSV EXPORT ---
  const handleBackupJSON = () => {
    const payload = {
      app: 'VaultFlow Personal Expense & Credit Card Tracker',
      version: 1,
      exportedAt: new Date().toISOString(),
      expenses,
      cards,
      settlementHistory,
      settings,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expense-tracker-backup-${toLocalISO(new Date())}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Backup JSON downloaded to your laptop!');
  };

  const handleRestoreJSON = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (Array.isArray(parsed.expenses)) setExpenses(parsed.expenses);
        if (Array.isArray(parsed.cards)) setCards(parsed.cards);
        if (Array.isArray(parsed.settlementHistory)) setSettlementHistory(parsed.settlementHistory);
        if (parsed.settings) setSettings((prev) => ({ ...prev, ...parsed.settings }));
        showToast('Restored backup successfully!');
      } catch {
        showToast('Invalid JSON backup file.', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleExportCSV = () => {
    const headers = [
      'Date',
      'Title',
      'Amount',
      'Category',
      'SpendType',
      'PaymentMethod',
      'CreditCard',
      'BillType',
      'CardSettled',
      'Reimbursable',
      'CashbackEst',
      'Note'
    ];
    const rows = expenses.map((e) => {
      const cardName = e.cardId ? cards.find((c) => c.id === e.cardId)?.name || '' : '';
      const escapeCSV = (val) => `"${String(val ?? '').replace(/"/g, '""')}"`;
      return [
        e.date,
        escapeCSV(e.title),
        e.amount,
        escapeCSV(e.category),
        e.spendType || 'Need',
        e.paymentMethod,
        escapeCSV(cardName),
        e.ccBillType || '',
        e.cardSettled ? 'Yes' : 'No',
        e.reimbursable ? 'Yes' : 'No',
        e.cashbackEst || 0,
        escapeCSV(e.note || '')
      ].join(',');
    });
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expenses-export-${toLocalISO(new Date())}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Exported CSV spreadsheet!');
  };

  const handleLoadSampleData = () => {
    const sample = generateSampleData(cards);
    setExpenses(sample);
    showToast('Sample data loaded! Explore Daily, Weekly, Monthly & Credit Card views.');
  };

  const handleSaveCard = (e) => {
    e.preventDefault();
    if (!cardForm.name.trim()) {
      showToast('Please enter a card name.', 'error');
      return;
    }
    const newCard = {
      ...cardForm,
      id: cardForm.id || `cc-${Date.now()}`,
      limit: Number(cardForm.limit) || 100000,
      statementDay: Math.min(28, Math.max(1, Number(cardForm.statementDay) || 15)),
      dueDay: Math.min(28, Math.max(1, Number(cardForm.dueDay) || 5)),
      rewardRate: Number(cardForm.rewardRate) || 1.0,
    };
    if (cardForm.id) {
      setCards((prev) => prev.map((c) => (c.id === cardForm.id ? newCard : c)));
      showToast(`Updated ${newCard.name}`);
    } else {
      setCards((prev) => [...prev, newCard]);
      setSelectedCardId(newCard.id);
      showToast(`Added ${newCard.name} to your Credit Card wallet!`);
    }
    setCardModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500/30 selection:text-indigo-200 flex flex-col items-center justify-start">
      {/* LAPTOP TOP UTILITY BAR: SWITCH BETWEEN iPHONE PREVIEW FRAME & FULL VIEW */}
      <div className="hidden md:flex w-full max-w-[1360px] mx-auto px-6 py-2.5 items-center justify-between text-xs text-slate-400 border-b border-slate-900">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            iOS PWA Offline Engine Active
          </span>
          <span>•</span>
          <span>Press <kbd className="px-1.5 py-0.5 bg-slate-900 border border-slate-800 rounded text-slate-200 font-mono">N</kbd> to quick-log</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIosGuideModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/30 font-medium transition"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>How to Install on iPhone</span>
          </button>

          <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800">
            <button
              onClick={() => setIphoneFrameMode(true)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition ${
                iphoneFrameMode ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>iPhone Frame</span>
            </button>
            <button
              onClick={() => setIphoneFrameMode(false)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition ${
                !iphoneFrameMode ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Full Width</span>
            </button>
          </div>
        </div>
      </div>

      {/* MAIN APP CONTAINER (iPhone Frame on Desktop when toggled, or Edge-to-Edge on real iPhone) */}
      <div
        className={`w-full transition-all duration-300 relative flex flex-col bg-slate-950 ${
          iphoneFrameMode
            ? 'md:max-w-[430px] md:my-4 md:h-[860px] md:rounded-[48px] md:border-[10px] md:border-slate-900 md:shadow-[0_25px_70px_-15px_rgba(0,0,0,0.85)] md:overflow-hidden min-h-screen md:min-h-0'
            : 'max-w-[960px] min-h-screen'
        }`}
      >
        {/* iOS Dynamic Island / Status Bar Header (Visible in iPhone Frame mode) */}
        {iphoneFrameMode && (
          <div className="hidden md:flex items-center justify-between px-7 pt-2.5 pb-1 bg-slate-950 text-[11px] font-semibold text-slate-200 shrink-0 select-none">
            <span>9:41</span>
            <div className="w-24 h-5 rounded-full bg-black border border-slate-800/80 flex items-center justify-end pr-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500/80" />
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-300">
              <span>5G</span>
              <span className="px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">100%</span>
            </div>
          </div>
        )}

        {/* TOAST NOTIFICATION */}
        {toast && (
          <div className="fixed md:absolute top-14 left-4 right-4 z-50 flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-2xl border shadow-2xl backdrop-blur-xl bg-slate-900/95 border-indigo-500/40 text-slate-100 animate-fadeIn">
            <div className="flex items-center gap-2.5 min-w-0">
              {toast.type === 'error' ? (
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              ) : toast.type === 'info' ? (
                <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              )}
              <span className="text-xs font-medium truncate">{toast.message}</span>
            </div>
            <button onClick={() => setToast(null)} className="text-slate-400 hover:text-white shrink-0">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* STICKY iOS APP HEADER */}
        <header className="sticky top-0 z-20 px-4 pt-3 pb-2.5 bg-slate-950/85 backdrop-blur-xl border-b border-slate-900/90 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-600 to-emerald-500 p-[1px] shadow-md shadow-indigo-500/10">
              <div className="w-full h-full bg-slate-950 rounded-[15px] flex items-center justify-center">
                <Wallet className="w-4 h-4 text-indigo-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-base font-bold tracking-tight text-white">VaultFlow</h1>
                <span className="px-1.5 py-0.2 text-[9px] font-semibold uppercase rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                  Offline
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Safe-to-Spend: <strong className="text-emerald-300">{formatMoney(analytics.safeToSpendDaily)}/d</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setBudgetModalOpen(true)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] font-medium text-slate-300 flex items-center gap-1"
              title="Edit Monthly Budget & Bank Shield"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>{formatMoney(analytics.trueDisposableBank)}</span>
            </button>

            <button
              onClick={openNewExpenseSheet}
              className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/25"
              title="Quick Log Expense"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* SCROLLABLE VIEWPORT BODY */}
        <main className="flex-1 overflow-y-auto px-4 pt-3 pb-28 space-y-4">
          {/* =========================================================
              TAB 1: DASHBOARD (HERO CARDS + SEGMENTED DAILY/WEEKLY/MONTHLY)
             ========================================================= */}
          {activeTab === 'dashboard' && (
            <>
              {/* iOS HERO WALLET CARD: SAFE-TO-SPEND + BANK SHIELD + CC FLOAT */}
              <div className="rounded-3xl bg-gradient-to-br from-indigo-950/90 via-slate-900 to-slate-900 border border-indigo-500/30 p-4 shadow-xl space-y-3.5">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-300 flex items-center gap-1">
                      <Zap className="w-3 h-3 text-amber-400" /> Safe-to-Spend Today
                    </span>
                    <div className="text-3xl font-extrabold text-white tracking-tight mt-0.5">
                      {formatMoney(analytics.safeToSpendDaily)}
                      <span className="text-xs font-normal text-slate-400 ml-1">/ day</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setBudgetModalOpen(true)}
                    className="px-2.5 py-1 rounded-full bg-slate-950/70 border border-slate-800 text-[11px] text-slate-300 hover:text-white flex items-center gap-1"
                  >
                    <span>Budget: {formatMoney(settings.monthlyBudget)}</span>
                    <Edit3 className="w-2.5 h-2.5 text-indigo-400" />
                  </button>
                </div>

                {/* Progress bar for Today vs Safe Daily Allowance */}
                <div>
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="text-slate-300">
                      Spent Today: <strong className="text-white">{formatMoney(analytics.totalTodaySpent)}</strong>
                    </span>
                    <span className="text-slate-400">{analytics.remainingDaysInMonth} days left in month</span>
                  </div>
                  <div className="w-full h-2 bg-slate-950/80 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        analytics.totalTodaySpent > analytics.safeToSpendDaily ? 'bg-amber-400' : 'bg-emerald-400'
                      }`}
                      style={{
                        width: `${Math.min(
                          100,
                          analytics.safeToSpendDaily > 0
                            ? (analytics.totalTodaySpent / analytics.safeToSpendDaily) * 100
                            : 0
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                {/* 3-Pillar Mini Pill Row: Month Spend | CC Float | Real Free Bank */}
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <div className="rounded-2xl bg-slate-950/75 border border-slate-800/80 p-2.5">
                    <div className="text-[10px] text-slate-400">Month Burn</div>
                    <div className="text-xs font-bold text-white mt-0.5 truncate">
                      {formatMoney(analytics.totalMonthSpent)}
                    </div>
                  </div>
                  <div
                    onClick={() => setActiveTab('credit-cards')}
                    className="cursor-pointer rounded-2xl bg-amber-500/10 border border-amber-500/30 p-2.5 active:scale-95 transition"
                  >
                    <div className="text-[10px] text-amber-300 flex items-center justify-between">
                      <span>Card Float</span>
                      <ChevronRight className="w-3 h-3" />
                    </div>
                    <div className="text-xs font-bold text-amber-200 mt-0.5 truncate">
                      {formatMoney(analytics.totalCCUnsettled)}
                    </div>
                  </div>
                  <div
                    onClick={() => setBudgetModalOpen(true)}
                    className="cursor-pointer rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-2.5 active:scale-95 transition"
                  >
                    <div className="text-[10px] text-emerald-300">True Bank Free</div>
                    <div className="text-xs font-bold text-emerald-200 mt-0.5 truncate">
                      {formatMoney(analytics.trueDisposableBank)}
                    </div>
                  </div>
                </div>
              </div>

              {/* 1-TAP QUICK PRESETS BAR (Horizontal Scrollable iOS Pills) */}
              <div>
                <div className="flex items-center justify-between mb-1.5 px-0.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    1-Tap Quick Log
                  </span>
                  <button
                    onClick={openNewExpenseSheet}
                    className="text-[11px] text-indigo-400 font-medium"
                  >
                    + Custom Expense
                  </button>
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {settings.quickPresets.map((qp) => (
                    <button
                      key={qp.id}
                      onClick={() => handleQuickPreset(qp)}
                      className="shrink-0 px-3 py-2 rounded-2xl bg-slate-900 hover:bg-slate-800 active:scale-95 border border-slate-800 flex items-center gap-2 transition"
                    >
                      <span className="text-xs font-medium text-slate-200">
                        {qp.title.split(' ').slice(0, 2).join(' ')}
                      </span>
                      <span className="text-xs font-bold text-indigo-400">
                        {cur.symbol}{qp.amount}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* iOS SEGMENTED CONTROL: DAILY | WEEKLY | MONTHLY */}
              <div className="rounded-3xl bg-slate-900/90 border border-slate-800/90 p-4 space-y-4">
                <div className="grid grid-cols-3 bg-slate-950 p-1 rounded-2xl border border-slate-800">
                  {[
                    { id: 'daily', label: 'Daily' },
                    { id: 'weekly', label: 'Weekly' },
                    { id: 'monthly', label: 'Monthly' },
                  ].map((tf) => (
                    <button
                      key={tf.id}
                      onClick={() => setTimeframe(tf.id)}
                      className={`py-1.5 rounded-xl text-xs font-semibold transition-all ${
                        timeframe === tf.id
                          ? 'bg-indigo-600 text-white shadow'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {tf.label}
                    </button>
                  ))}
                </div>

                {/* DAILY VIEW: 7-Day Interactive Strip + Selected Day Breakdown */}
                {timeframe === 'daily' && (
                  <div className="space-y-3.5">
                    <div className="grid grid-cols-7 gap-1.5">
                      {analytics.last7Days.map((d) => {
                        const isSelected = selectedDayISO === d.iso;
                        const overSafe = d.total > analytics.safeToSpendDaily && analytics.safeToSpendDaily > 0;
                        return (
                          <button
                            key={d.iso}
                            onClick={() => setSelectedDayISO(d.iso)}
                            className={`py-2 px-1 rounded-2xl border text-center transition flex flex-col items-center ${
                              isSelected
                                ? 'bg-indigo-600/25 border-indigo-500 text-white shadow'
                                : 'bg-slate-950/80 border-slate-800/80 text-slate-300'
                            }`}
                          >
                            <span className="text-[9px] uppercase text-slate-400">
                              {d.isToday ? 'Now' : d.shortDay.slice(0, 3)}
                            </span>
                            <span className="text-xs font-bold my-0.5">{d.dayNum}</span>
                            <span
                              className={`text-[9px] font-semibold truncate max-w-full ${
                                d.total === 0
                                  ? 'text-slate-600'
                                  : overSafe
                                  ? 'text-amber-400'
                                  : 'text-emerald-400'
                              }`}
                            >
                              {d.total > 0 ? `${cur.symbol}${d.total}` : '—'}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Selected Day Transactions */}
                    {(() => {
                      const dayExps = expenses.filter((e) => e.date === selectedDayISO);
                      const daySum = dayExps.reduce((s, e) => s + e.amount, 0);
                      const ccSum = dayExps
                        .filter((e) => e.paymentMethod === 'Credit Card')
                        .reduce((s, e) => s + e.amount, 0);
                      return (
                        <div className="rounded-2xl bg-slate-950/90 border border-slate-800/80 p-3 space-y-2.5">
                          <div className="flex items-center justify-between text-xs border-b border-slate-800/80 pb-2">
                            <span className="text-slate-400 font-medium">{selectedDayISO}</span>
                            <div className="flex items-center gap-2.5">
                              <span className="text-white font-bold">{formatMoney(daySum)}</span>
                              {ccSum > 0 && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300">
                                  CC: {formatMoney(ccSum)}
                                </span>
                              )}
                            </div>
                          </div>

                          {dayExps.length === 0 ? (
                            <div className="py-5 text-center text-xs text-slate-500">
                              No spend logged on this day. Zero-spend win! 🎉
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {dayExps.map((item) => (
                                <div
                                  key={item.id}
                                  onClick={() => handleEditExpense(item)}
                                  className="cursor-pointer flex items-center justify-between p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800/80 border border-slate-800/70 transition"
                                >
                                  <div className="min-w-0 pr-2">
                                    <div className="text-xs font-semibold text-white truncate">
                                      {item.title}
                                    </div>
                                    <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                                      <span>{item.category}</span>
                                      <span>•</span>
                                      <span className={item.paymentMethod === 'Credit Card' ? 'text-amber-300' : ''}>
                                        {item.paymentMethod}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="text-xs font-bold text-white shrink-0">
                                    {formatMoney(item.amount)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* WEEKLY VIEW: Mon-Sun Stacked Bar Chart (Direct vs Credit Card) */}
                {timeframe === 'weekly' && (
                  <div className="space-y-3.5">
                    <div className="flex items-center justify-between bg-slate-950/80 p-3 rounded-2xl border border-slate-800">
                      <div>
                        <div className="text-[10px] text-slate-400">This Week (Mon–Sun)</div>
                        <div className="text-lg font-bold text-white">{formatMoney(analytics.totalWeekSpent)}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] text-slate-400">Weekly Pace Target</div>
                        <div className="text-xs font-semibold text-indigo-300">{formatMoney(analytics.weeklyTarget)}</div>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-950/70 rounded-2xl border border-slate-800">
                      <div className="flex items-center justify-end gap-3 text-[10px] mb-2">
                        <span className="flex items-center gap-1 text-indigo-300">
                          <span className="w-2 h-2 rounded-sm bg-indigo-500" /> UPI/Direct
                        </span>
                        <span className="flex items-center gap-1 text-amber-300">
                          <span className="w-2 h-2 rounded-sm bg-amber-500" /> Credit Card
                        </span>
                      </div>
                      <div className="grid grid-cols-7 gap-2 items-end h-36 pt-4">
                        {(() => {
                          const maxDay = Math.max(
                            analytics.idealDailyBudget * 1.5,
                            ...analytics.weekDaysChart.map((d) => d.total),
                            1
                          );
                          return analytics.weekDaysChart.map((d) => {
                            const totalHeightPct = Math.min(100, Math.round((d.total / maxDay) * 100));
                            const ccPctOfBar = d.total > 0 ? Math.round((d.ccTotal / d.total) * 100) : 0;
                            return (
                              <div key={d.iso} className="flex flex-col items-center h-full justify-end">
                                <div className="w-full max-w-[30px] bg-slate-900 rounded-t-lg h-24 flex flex-col justify-end overflow-hidden border border-slate-800/70">
                                  <div
                                    style={{ height: `${totalHeightPct}%` }}
                                    className="w-full flex flex-col justify-end transition-all duration-300"
                                  >
                                    {d.ccTotal > 0 && (
                                      <div style={{ height: `${ccPctOfBar}%` }} className="w-full bg-amber-500" />
                                    )}
                                    <div style={{ height: `${100 - ccPctOfBar}%` }} className="w-full bg-indigo-500" />
                                  </div>
                                </div>
                                <div className={`text-[10px] mt-1.5 font-medium ${d.isToday ? 'text-indigo-400 font-bold' : 'text-slate-400'}`}>
                                  {d.label}
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>
                  </div>
                )}

                {/* MONTHLY VIEW: Burn Curve + Need/Want/Fixed + Top Categories */}
                {timeframe === 'monthly' && (
                  <div className="space-y-4">
                    <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
                      <div className="flex items-center justify-between text-[11px] mb-2">
                        <span className="font-semibold text-slate-300">Monthly Burn Curve vs Budget</span>
                        <span className="text-indigo-400 font-bold">{formatMoney(analytics.totalMonthSpent)}</span>
                      </div>
                      {(() => {
                        const width = 360;
                        const height = 120;
                        const pad = 14;
                        const maxVal = Math.max(settings.monthlyBudget, analytics.totalMonthSpent, 1000);
                        const ptsActual = [];
                        const ptsIdeal = [];

                        analytics.burnCurve.forEach((pt, i) => {
                          const x = pad + (i / Math.max(1, analytics.burnCurve.length - 1)) * (width - pad * 2);
                          const yIdeal = height - pad - (pt.idealCumulative / maxVal) * (height - pad * 2);
                          ptsIdeal.push(`${x},${yIdeal}`);
                          if (pt.cumulative !== null) {
                            const yActual = height - pad - (pt.cumulative / maxVal) * (height - pad * 2);
                            ptsActual.push(`${x},${yActual}`);
                          }
                        });

                        return (
                          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-28 overflow-visible">
                            <polyline
                              fill="none"
                              stroke="#475569"
                              strokeWidth="1.5"
                              strokeDasharray="4 4"
                              points={ptsIdeal.join(' ')}
                            />
                            {ptsActual.length > 1 && (
                              <polyline
                                fill="none"
                                stroke="#818cf8"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                points={ptsActual.join(' ')}
                              />
                            )}
                          </svg>
                        );
                      })()}
                    </div>

                    {/* Need / Want / Fixed Lifestyle Split */}
                    <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2.5">
                      <div className="text-[11px] font-semibold text-slate-300">Need / Want / Fixed Split</div>
                      {SPEND_TYPES.map((st) => {
                        const val = analytics.spendTypeTotals[st.id] || 0;
                        const pct = analytics.totalMonthSpent > 0 ? Math.round((val / analytics.totalMonthSpent) * 100) : 0;
                        return (
                          <div key={st.id} className="space-y-1">
                            <div className="flex justify-between text-[11px]">
                              <span className={st.color}>{st.label}</span>
                              <span className="text-slate-200 font-semibold">{formatMoney(val)} ({pct}%)</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: st.hex }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Top Categories */}
                    <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
                      <div className="text-[11px] font-semibold text-slate-300">Top Categories</div>
                      {analytics.categoryBreakdown.slice(0, 5).map((cat) => (
                        <div key={cat.id} className="space-y-1">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-slate-300">{cat.label}</span>
                            <span className="text-slate-200 font-medium">{formatMoney(cat.amount)} ({cat.percentage}%)</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${cat.percentage}%`, backgroundColor: cat.color }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* RECENT EXPENSES PREVIEW ON DASHBOARD */}
              <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Recent Activity
                  </h3>
                  <button
                    onClick={() => setActiveTab('ledger')}
                    className="text-xs text-indigo-400 font-medium flex items-center gap-0.5"
                  >
                    <span>See All ({expenses.length})</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-2">
                  {expenses.slice(0, 5).map((exp) => {
                    const isCC = exp.paymentMethod === 'Credit Card';
                    const cardObj = exp.cardId ? cards.find((c) => c.id === exp.cardId) : null;
                    return (
                      <div
                        key={exp.id}
                        onClick={() => handleEditExpense(exp)}
                        className="cursor-pointer flex items-center justify-between p-3 rounded-2xl bg-slate-950/85 hover:bg-slate-950 border border-slate-800/80 transition"
                      >
                        <div className="min-w-0 pr-2">
                          <div className="text-xs font-semibold text-white truncate">{exp.title}</div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5 flex-wrap">
                            <span>{exp.date}</span>
                            <span>•</span>
                            <span className={isCC ? 'text-amber-300 font-medium' : ''}>{exp.paymentMethod}</span>
                            {isCC && cardObj && (
                              <span className="text-slate-400">({cardObj.name.split(' ')[0]})</span>
                            )}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-xs font-bold text-white">{formatMoney(exp.amount)}</div>
                          {isCC && (
                            <span
                              className={`text-[9px] px-1.5 py-0.2 rounded ${
                                exp.cardSettled ? 'bg-emerald-500/15 text-emerald-300' : 'bg-amber-500/15 text-amber-300'
                              }`}
                            >
                              {exp.cardSettled ? 'Settled' : 'Float'}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* =========================================================
              TAB 2: APPLE WALLET-STYLE CREDIT CARD COMMAND CENTER
             ========================================================= */}
          {activeTab === 'credit-cards' && (
            <div className="space-y-4">
              {/* Summary Liability Header Card */}
              <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950/60 to-slate-900 border border-indigo-500/30 p-4 shadow-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                      <CreditCard className="w-3.5 h-3.5" /> Credit Card Command Center
                    </span>
                    <h2 className="text-lg font-bold text-white mt-0.5">
                      {formatMoney(analytics.totalCCUnsettled)} Unsettled
                    </h2>
                  </div>
                  <button
                    onClick={() => {
                      setCardForm({
                        id: null,
                        name: '',
                        last4: '',
                        limit: 150000,
                        statementDay: 15,
                        dueDay: 5,
                        rewardRate: 2.0,
                        gradient: 'from-slate-800 via-indigo-950 to-slate-900',
                      });
                      setCardModalOpen(true);
                    }}
                    className="px-3 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1 shadow"
                  >
                    <Plus className="w-3.5 h-3.5" /> Card
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                  <div className="p-2 rounded-2xl bg-slate-950/70 border border-slate-800">
                    <div className="text-[10px] text-slate-400">Utilization</div>
                    <div className={`text-xs font-bold mt-0.5 ${analytics.overallUtilization > 30 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {analytics.overallUtilization}%
                    </div>
                  </div>
                  <div className="p-2 rounded-2xl bg-slate-950/70 border border-slate-800">
                    <div className="text-[10px] text-slate-400">Total Limit</div>
                    <div className="text-xs font-bold text-white mt-0.5">{formatMoney(analytics.totalCCLimit)}</div>
                  </div>
                  <div className="p-2 rounded-2xl bg-slate-950/70 border border-slate-800">
                    <div className="text-[10px] text-slate-400">Est. Rewards</div>
                    <div className="text-xs font-bold text-emerald-300 mt-0.5">{formatMoney(analytics.totalCashbackEarned)}</div>
                  </div>
                </div>
              </div>

              {/* Stack of Credit Cards */}
              {analytics.cardMetrics.map((card) => {
                const highUtil = card.utilization > 30;
                return (
                  <div
                    key={card.id}
                    className="rounded-3xl bg-slate-900/95 border border-slate-800 overflow-hidden shadow-xl"
                  >
                    {/* Apple Wallet Metallic Card Top */}
                    <div className={`p-4 bg-gradient-to-br ${card.gradient} border-b border-slate-800`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-sm font-bold text-white">{card.name}</div>
                          <div className="text-[11px] font-mono text-slate-300 mt-0.5">
                            •••• {card.last4 || '4000'} • {card.rewardRate}% rewards
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setCardForm(card);
                            setCardModalOpen(true);
                          }}
                          className="p-1.5 rounded-xl bg-slate-950/40 text-slate-200 hover:text-white"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-baseline justify-between mt-4">
                        <div>
                          <div className="text-[10px] uppercase text-slate-300/80">Unsettled Float</div>
                          <div className="text-2xl font-extrabold text-white">{formatMoney(card.outstanding)}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] text-slate-300">Limit: {formatMoney(card.limit)}</div>
                          <div className="text-[11px] text-emerald-300 font-medium">
                            Stmt in {card.daysToStatement}d (Day {card.statementDay})
                          </div>
                        </div>
                      </div>

                      {/* 30% Credit Score Utilization Bar */}
                      <div className="mt-3">
                        <div className="flex justify-between text-[10px] mb-1">
                          <span className="text-slate-200">Utilization: <strong>{card.utilization}%</strong></span>
                          <span className={highUtil ? 'text-rose-300 font-semibold' : 'text-emerald-300'}>
                            {highUtil ? '⚠️ >30% Credit Score Alert' : 'Healthy (<30%)'}
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-950/70 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${highUtil ? 'bg-rose-500' : 'bg-emerald-400'}`}
                            style={{ width: `${Math.min(100, card.utilization)}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Unsettled Charges & 1-Tap Non-Duplicate Bill Settlement */}
                    <div className="p-3.5 space-y-2.5">
                      {card.unsettledTx.length > 0 ? (
                        <div className="space-y-1.5 max-h-36 overflow-y-auto">
                          {card.unsettledTx.map((tx) => (
                            <div
                              key={tx.id}
                              onClick={() => handleEditExpense(tx)}
                              className="cursor-pointer flex items-center justify-between text-xs px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800/80"
                            >
                              <div className="truncate pr-2">
                                <span className="text-slate-200">{tx.title}</span>
                                <span className="text-[10px] text-slate-500 ml-1.5">{tx.date}</span>
                              </div>
                              <span className="font-semibold text-amber-300 shrink-0">{formatMoney(tx.amount)}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-2 text-xs text-slate-500">
                          Zero unsettled charges on this card.
                        </div>
                      )}

                      <button
                        disabled={card.outstanding <= 0}
                        onClick={() => setSettleModalCard(card)}
                        className={`w-full py-2.5 px-4 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                          card.outstanding > 0
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 active:scale-98'
                            : 'bg-slate-800/80 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>
                          {card.outstanding > 0
                            ? `Settle / Pay Bill (${formatMoney(card.outstanding)})`
                            : 'Bill Settled'}
                        </span>
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Settled Bills History */}
              {settlementHistory.length > 0 && (
                <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-4 space-y-2.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Settled Card Bills (No Duplicate Spend)
                  </h3>
                  {settlementHistory.map((sh) => (
                    <div
                      key={sh.id}
                      className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs"
                    >
                      <div>
                        <div className="font-semibold text-white">{sh.cardName}</div>
                        <div className="text-[10px] text-slate-400">{sh.count} charges settled on {sh.date}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-emerald-400">{formatMoney(sh.amount)}</span>
                        <button
                          onClick={() => handleUndoSettlement(sh)}
                          className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-amber-300"
                          title="Undo settlement"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* =========================================================
              TAB 3: FULL SEARCHABLE LEDGER / HISTORY
             ========================================================= */}
          {activeTab === 'ledger' && (
            <div className="space-y-3.5">
              <div className="rounded-3xl bg-slate-900/95 border border-slate-800 p-3.5 space-y-2.5">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search expenses, notes, categories..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-3 gap-1.5">
                  <select
                    value={filterPayment}
                    onChange={(e) => setFilterPayment(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-2 py-1.5 text-[11px] text-slate-300"
                  >
                    <option value="ALL">All Modes</option>
                    {PAYMENT_METHODS.map((pm) => (
                      <option key={pm.id} value={pm.id}>{pm.label}</option>
                    ))}
                  </select>

                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-2 py-1.5 text-[11px] text-slate-300"
                  >
                    <option value="ALL">All Categories</option>
                    {CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>

                  <select
                    value={filterSpendType}
                    onChange={(e) => setFilterSpendType(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-2 py-1.5 text-[11px] text-slate-300"
                  >
                    <option value="ALL">All Types</option>
                    {SPEND_TYPES.map((s) => (
                      <option key={s.id} value={s.id}>{s.id}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                {filteredExpenses.length === 0 ? (
                  <div className="text-center py-12 rounded-3xl bg-slate-900/50 border border-dashed border-slate-800">
                    <p className="text-xs text-slate-400">No matching expenses found.</p>
                  </div>
                ) : (
                  filteredExpenses.map((exp) => {
                    const catObj = CATEGORIES.find((c) => c.id === exp.category) || CATEGORIES[CATEGORIES.length - 1];
                    const isCC = exp.paymentMethod === 'Credit Card';
                    const cardObj = exp.cardId ? cards.find((c) => c.id === exp.cardId) : null;
                    return (
                      <div
                        key={exp.id}
                        className="flex items-center justify-between gap-2 p-3 rounded-2xl bg-slate-900/95 border border-slate-800/90"
                      >
                        <div
                          onClick={() => handleEditExpense(exp)}
                          className="cursor-pointer min-w-0 flex-1"
                        >
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium border ${catObj.bg} ${catObj.text} ${catObj.border}`}>
                              {exp.category}
                            </span>
                            <span className="text-xs font-semibold text-white truncate">{exp.title}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-1 flex-wrap">
                            <span>{exp.date}</span>
                            <span>•</span>
                            <span className={isCC ? 'text-amber-300 font-medium' : ''}>{exp.paymentMethod}</span>
                            {isCC && cardObj && <span>({cardObj.name.split(' ')[0]})</span>}
                            {isCC && (
                              <span className={`px-1.5 py-0.2 rounded ${exp.cardSettled ? 'bg-emerald-500/15 text-emerald-300' : 'bg-amber-500/15 text-amber-300'}`}>
                                {exp.cardSettled ? 'Settled' : 'Float'}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <div className="text-right">
                            <div className="text-xs font-bold text-white">{formatMoney(exp.amount)}</div>
                            {exp.cashbackEst > 0 && (
                              <div className="text-[9px] text-emerald-400">+{formatMoney(exp.cashbackEst)}</div>
                            )}
                          </div>
                          <button
                            onClick={() => handleDeleteExpense(exp.id)}
                            className="p-1.5 rounded-xl bg-slate-950 text-slate-500 hover:text-rose-400"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* =========================================================
              TAB 4: iPHONE DEPLOYMENT GUIDE, OFFLINE BACKUP & SETUP
             ========================================================= */}
          {activeTab === 'setup' && (
            <div className="space-y-4">
              {/* iPhone PWA Install & Free Hosting Card */}
              <div className="rounded-3xl bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-900 border border-indigo-500/40 p-4 shadow-xl space-y-3">
                <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold uppercase tracking-wider">
                  <Smartphone className="w-4 h-4" /> Use on Your iPhone (Full-Screen Offline App)
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  You don't need an $99/year Apple Developer account or the App Store! You can host this single file for free and install it directly onto your iPhone Home Screen in 2 minutes:
                </p>

                <div className="space-y-2 text-xs">
                  <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
                    <div className="font-bold text-white flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-emerald-400" /> Step 1: Host for Free (60 Seconds)
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Deploy this React app for free on <strong>Vercel</strong>, <strong>Netlify Drop</strong> (app.netlify.com/drop), or <strong>Cloudflare Pages</strong>. It gives you a private HTTPS link (e.g. <code>my-vaultflow.vercel.app</code>).
                    </p>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
                    <div className="font-bold text-white flex items-center gap-1.5">
                      <Share className="w-3.5 h-3.5 text-indigo-400" /> Step 2: Open in iPhone Safari & "Add to Home Screen"
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Open your link in <strong>Safari on iPhone</strong> → tap the bottom <strong>Share icon</strong> → scroll down and tap <strong>"Add to Home Screen"</strong>. It now launches full-screen like a native iOS app and works offline!
                    </p>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
                    <div className="font-bold text-white flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-amber-400" /> 100% Private on Your Device
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Even when hosted on a public URL, your expenses are saved <strong>strictly inside your iPhone's local storage</strong>—nobody else visiting the link can ever see your numbers.
                    </p>
                  </div>
                </div>
              </div>

              {/* Offline Data Ownership: JSON Backup / Restore / CSV */}
              <div className="rounded-3xl bg-slate-900/95 border border-slate-800 p-4 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Data Backup & Sync (Laptop ↔ iPhone)
                </h3>
                <p className="text-[11px] text-slate-400">
                  Since data lives offline on your device, use <strong>Backup JSON</strong> to AirDrop or save your data to iCloud Drive, or transfer between your laptop and iPhone.
                </p>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleBackupJSON}
                    className="p-3 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800 flex items-center justify-center gap-2 text-xs font-semibold text-indigo-300"
                  >
                    <Download className="w-4 h-4" /> Backup JSON
                  </button>

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-3 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800 flex items-center justify-center gap-2 text-xs font-semibold text-emerald-300"
                  >
                    <Upload className="w-4 h-4" /> Restore JSON
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleRestoreJSON}
                    className="hidden"
                  />

                  <button
                    onClick={handleExportCSV}
                    className="p-3 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800 flex items-center justify-center gap-2 text-xs font-semibold text-amber-300"
                  >
                    <FileSpreadsheet className="w-4 h-4" /> Export CSV
                  </button>

                  <button
                    onClick={handleLoadSampleData}
                    className="p-3 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800 flex items-center justify-center gap-2 text-xs font-semibold text-slate-300"
                  >
                    <RefreshCw className="w-4 h-4" /> Sample Data
                  </button>
                </div>
              </div>

              {/* Currency, Budget & Reset */}
              <div className="rounded-3xl bg-slate-900/95 border border-slate-800 p-4 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Preferences & Currency
                </h3>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-300">Currency</span>
                  <select
                    value={settings.currency}
                    onChange={(e) => setSettings((prev) => ({ ...prev, currency: e.target.value }))}
                    className="bg-slate-950 border border-slate-800 text-xs rounded-xl px-3 py-2 text-white"
                  >
                    {Object.values(CURRENCIES).map((c) => (
                      <option key={c.code} value={c.code}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                  <span className="text-xs text-slate-300">Monthly Budget & Bank Shield</span>
                  <button
                    onClick={() => setBudgetModalOpen(true)}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 text-xs font-medium"
                  >
                    Configure
                  </button>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                  <span className="text-xs text-rose-300">Reset All Local Data</span>
                  <button
                    onClick={() => setConfirmClearOpen(true)}
                    className="px-3 py-1.5 rounded-xl bg-rose-500/15 text-rose-300 border border-rose-500/30 text-xs font-medium"
                  >
                    Clear All
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* =========================================================
            iOS FROSTED GLASS BOTTOM TAB BAR + FLOATING '+' BUTTON
           ========================================================= */}
        <nav className="sticky bottom-0 z-30 bg-slate-950/90 backdrop-blur-2xl border-t border-slate-800/90 px-3 pt-2 pb-5 flex items-center justify-around shrink-0">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition ${
              activeTab === 'dashboard' ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            <span className="text-[10px] font-semibold">Summary</span>
          </button>

          <button
            onClick={() => setActiveTab('credit-cards')}
            className={`relative flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition ${
              activeTab === 'credit-cards' ? 'text-amber-400' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <CreditCard className="w-5 h-5" />
            <span className="text-[10px] font-semibold">Cards</span>
            {analytics.totalCCUnsettled > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-400 absolute top-1 right-3" />
            )}
          </button>

          {/* Center Prominent '+' Button */}
          <button
            onClick={openNewExpenseSheet}
            className="-mt-6 w-13 h-13 p-3.5 rounded-full bg-gradient-to-tr from-indigo-600 via-violet-600 to-indigo-500 text-white shadow-xl shadow-indigo-600/40 border-4 border-slate-950 active:scale-95 transition flex items-center justify-center"
            aria-label="Log Expense"
          >
            <Plus className="w-6 h-6" />
          </button>

          <button
            onClick={() => setActiveTab('ledger')}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition ${
              activeTab === 'ledger' ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Receipt className="w-5 h-5" />
            <span className="text-[10px] font-semibold">History</span>
          </button>

          <button
            onClick={() => setActiveTab('setup')}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition ${
              activeTab === 'setup' ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Smartphone className="w-5 h-5" />
            <span className="text-[10px] font-semibold">iOS / Data</span>
          </button>
        </nav>

        {/* =========================================================
            iOS SLIDE-UP BOTTOM SHEET: LOG / EDIT EXPENSE + CC PANEL
           ========================================================= */}
        {addSheetOpen && (
          <div className="fixed md:absolute inset-0 z-50 bg-black/75 backdrop-blur-sm flex flex-col justify-end">
            <div className="bg-slate-900 border-t border-slate-800 rounded-t-[32px] p-5 max-h-[90%] overflow-y-auto shadow-2xl space-y-4 animate-fadeIn">
              {/* Sheet Drag Handle & Header */}
              <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto -mt-1 mb-1" />
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white">
                  {editingId ? 'Edit Expense' : 'Log Expense'}
                </h3>
                <button
                  onClick={() => setAddSheetOpen(false)}
                  className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveExpense} className="space-y-3.5">
                {/* Amount & Date */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      Amount ({cur.symbol})
                    </label>
                    <input
                      type="number"
                      inputMode="decimal"
                      step="any"
                      required
                      placeholder="0"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full rounded-2xl bg-slate-950 border border-slate-800 focus:border-indigo-500 px-3.5 py-2.5 text-base font-bold text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">Date</label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full rounded-2xl bg-slate-950 border border-slate-800 focus:border-indigo-500 px-3 py-2.5 text-xs text-slate-200 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    Description
                  </label>
                  <input
                    ref={titleInputRef}
                    type="text"
                    required
                    placeholder="Coffee, Groceries, Uber, Amazon..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full rounded-2xl bg-slate-950 border border-slate-800 focus:border-indigo-500 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none"
                  />
                </div>

                {/* Payment Method Pills (Triggers Conditional Credit Card Section) */}
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1.5">
                    Payment Method
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {PAYMENT_METHODS.map((pm) => {
                      const active = paymentMethod === pm.id;
                      const isCC = pm.id === 'Credit Card';
                      return (
                        <button
                          key={pm.id}
                          type="button"
                          onClick={() => setPaymentMethod(pm.id)}
                          className={`py-2.5 px-3 rounded-2xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition ${
                            active
                              ? isCC
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow'
                                : 'bg-indigo-600/25 text-indigo-200 border-indigo-500/50 shadow'
                              : 'bg-slate-950 border-slate-800 text-slate-400'
                          }`}
                        >
                          {isCC && <CreditCard className="w-3.5 h-3.5 text-amber-400" />}
                          <span>{pm.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* CONDITIONAL CREDIT CARD DRAWER */}
                {paymentMethod === 'Credit Card' && (
                  <div className="rounded-2xl bg-gradient-to-br from-indigo-950/70 via-slate-950 to-amber-950/30 border border-amber-500/40 p-3.5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5" /> Credit Card Details
                      </span>
                      <span className="text-[10px] text-amber-200/80">Tracked in Card Float</span>
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-300 mb-1">Select Card Swiped</label>
                      <select
                        value={selectedCardId}
                        onChange={(e) => setSelectedCardId(e.target.value)}
                        className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-white"
                      >
                        {cards.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} (••{c.last4}) — {c.rewardRate}% rewards
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5">
                      {['Floating', 'Recurring', 'EMI'].map((bt) => (
                        <button
                          key={bt}
                          type="button"
                          onClick={() => setCcBillType(bt)}
                          className={`py-1.5 rounded-xl text-[11px] font-semibold border ${
                            ccBillType === bt
                              ? 'bg-amber-500/20 text-amber-200 border-amber-500/40'
                              : 'bg-slate-900 text-slate-400 border-slate-800'
                          }`}
                        >
                          {bt === 'Floating' ? 'Unbilled' : bt}
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-slate-300 mb-1">
                          Est. Cashback ({cur.symbol})
                        </label>
                        <input
                          type="number"
                          value={cashbackEst}
                          onChange={(e) => setCashbackEst(e.target.value)}
                          className="w-full rounded-xl bg-slate-900 border border-slate-800 px-2.5 py-1.5 text-xs text-emerald-300"
                        />
                      </div>
                      <div className="flex items-end pb-1">
                        <label className="flex items-center gap-2 text-xs text-slate-300">
                          <input
                            type="checkbox"
                            checked={reimbursable}
                            onChange={(e) => setReimbursable(e.target.checked)}
                            className="rounded border-slate-700 bg-slate-900 text-indigo-500"
                          />
                          <span>Reimbursable</span>
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {/* Category & Need/Want/Fixed Row */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full rounded-2xl bg-slate-950 border border-slate-800 px-3 py-2.5 text-xs text-white"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c.id} value={c.id}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">Spend Type</label>
                    <div className="grid grid-cols-3 gap-1">
                      {SPEND_TYPES.map((st) => (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() => setSpendType(st.id)}
                          className={`py-2 rounded-xl text-[11px] font-semibold border ${
                            spendType === st.id
                              ? `${st.bg} ${st.color} ${st.border}`
                              : 'bg-slate-950 border-slate-800 text-slate-400'
                          }`}
                        >
                          {st.id}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/25 flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingId ? 'Save Changes' : 'Save Expense'}</span>
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: iPHONE DEPLOYMENT & INSTALL GUIDE */}
      {iosGuideModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-indigo-400" />
                <span>Install on Your iPhone (Free)</span>
              </h3>
              <button onClick={() => setIosGuideModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <p>
                Because iOS Safari blocks raw local HTML files from using persistent offline storage properly, the best way to use this on your iPhone is to host it on a free static link and add it to your Home Screen:
              </p>
              <ol className="list-decimal list-inside space-y-2 text-slate-300">
                <li>
                  <strong>Deploy for Free:</strong> Push this React project to <strong>Vercel</strong>, <strong>Netlify</strong>, or <strong>GitHub Pages</strong> (100% free tier).
                </li>
                <li>
                  <strong>Open in iPhone Safari:</strong> Visit your deployed URL on your iPhone.
                </li>
                <li>
                  <strong>Tap Share → "Add to Home Screen":</strong> Safari installs VaultFlow onto your iPhone home screen with its own icon. It opens full-screen without browser bars and stores all data locally on your iPhone!
                </li>
              </ol>
            </div>
            <button
              onClick={() => setIosGuideModalOpen(false)}
              className="w-full py-2.5 rounded-2xl bg-indigo-600 text-white text-xs font-bold"
            >
              Got It!
            </button>
          </div>
        </div>
      )}

      {/* MODAL 1: EDIT BUDGET & BANK BALANCE SHIELD */}
      {budgetModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Budget & Bank Shield Settings</h3>
              <button onClick={() => setBudgetModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-300 mb-1">
                  Monthly Target Budget ({cur.symbol})
                </label>
                <input
                  type="number"
                  value={settings.monthlyBudget}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, monthlyBudget: Number(e.target.value) || 0 }))
                  }
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-300 mb-1">
                  Current Liquid Bank Balance ({cur.symbol}) — for Bank Shield
                </label>
                <input
                  type="number"
                  value={settings.bankBalance}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, bankBalance: Number(e.target.value) || 0 }))
                  }
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-white"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setBudgetModalOpen(false);
                  showToast('Saved budget & bank balance settings!');
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD / EDIT CREDIT CARD */}
      {cardModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveCard}
            className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">
                {cardForm.id ? 'Edit Credit Card' : 'Add New Credit Card'}
              </h3>
              <button
                type="button"
                onClick={() => setCardModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-300 mb-1">Card Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., HDFC Infinia, Amex Platinum, SBI Cashback"
                  value={cardForm.name}
                  onChange={(e) => setCardForm({ ...cardForm, name: e.target.value })}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Last 4 Digits</label>
                  <input
                    type="text"
                    maxLength={4}
                    placeholder="4829"
                    value={cardForm.last4}
                    onChange={(e) => setCardForm({ ...cardForm, last4: e.target.value })}
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Credit Limit ({cur.symbol})</label>
                  <input
                    type="number"
                    value={cardForm.limit}
                    onChange={(e) => setCardForm({ ...cardForm, limit: e.target.value })}
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Statement Day (1-28)</label>
                  <input
                    type="number"
                    min={1}
                    max={28}
                    value={cardForm.statementDay}
                    onChange={(e) => setCardForm({ ...cardForm, statementDay: e.target.value })}
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Default Reward Rate (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={cardForm.rewardRate}
                    onChange={(e) => setCardForm({ ...cardForm, rewardRate: e.target.value })}
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-white"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCardModalOpen(false)}
                className="px-3 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
              >
                Save Card
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 3: SETTLE CREDIT CARD BILL CONFIRMATION */}
      {settleModalCard && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">
                Settle {settleModalCard.name} Bill
              </h3>
              <button onClick={() => setSettleModalCard(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              You are about to mark <strong>{settleModalCard.unsettledCount} unsettled transactions</strong> totaling{' '}
              <strong className="text-emerald-300">{formatMoney(settleModalCard.outstanding)}</strong> as paid.
            </p>
            <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-xs text-indigo-200">
              ✓ <strong>No Double Counting:</strong> Your monthly category spending analytics remain untouched, while your card's outstanding liability drops to {cur.symbol}0.
            </div>
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                onClick={() => handleSettleCardBill(settleModalCard.id, true)}
                className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
              >
                Settle & Deduct from Bank Shield
              </button>
              <button
                onClick={() => handleSettleCardBill(settleModalCard.id, false)}
                className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium"
              >
                Settle Only
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: CONFIRM CLEAR ALL DATA */}
      {confirmClearOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Clear All Expense Data?</h3>
            <p className="text-xs text-slate-400">
              This will clear all logged expenses and settlement history from your browser's local storage. Tip: Download a JSON backup first if you want to keep a copy.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmClearOpen(false)}
                className="px-3 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setExpenses([]);
                  setSettlementHistory([]);
                  setConfirmClearOpen(false);
                  showToast('Cleared all expenses', 'info');
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold"
              >
                Yes, Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}