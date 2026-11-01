import React, { useCallback, useEffect, useState } from 'react';
import {
  Activity, ArrowDownRight, ArrowUpRight, Baby, Bell, Building2, CalendarDays,
  CheckCircle2, ChevronDown, ChevronLeft, CircleHelp, Command, Download, FileText,
  Globe2, LayoutDashboard, LockKeyhole, LogOut, Menu, Moon, RefreshCw, Search,
  Settings2, ShieldCheck, Sparkles, Users, X, Zap, ChartNoAxesCombined, HeartPulse,
  ClipboardList, UserRoundCog, BookOpen, Package, Clock3, TrendingUp,
  Store, Handshake, Boxes, ShoppingCart, History, CreditCard
} from 'lucide-react';
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis
} from 'recharts';
import { supabaseClient } from '../services/supabaseService';
import './AdminPortal.css';

type Snapshot = {
  generated_at: string;
  period_days: number;
  kpis: {
    users_total: number; families_total: number; children_total: number;
    child_records_total: number; pending_invitations: number; catalog_active: number;
    new_users_period: number; staff_total: number; staff_planned: number;
  };
  signup_series: { date: string; count: number }[];
  recent_users: { id: string; name: string; role: string; country: string; created_at: string }[];
  recent_families: { id: string; name: string; country: string; city: string; created_at: string }[];
  record_mix: { type: string; count: number }[];
  recent_admin_events: { id: number; action: string; target_type: string | null; target_id: string | null; created_at: string }[];
  staff_directory: { id: string; employee_code: string; name: string; email: string; phone: string | null; department: string; title: string; status: string; cohort: string }[];
};
type DirectoryUser = { id:string; name:string; role:string|null; email:string|null; phone:string|null; country:string; verified:boolean; family_id:string|null; family_name:string|null; created_at:string; updated_at:string };
type DirectoryFamily = { id:string; name:string; country:string; city:string; currency:string; active_parent:string; created_at:string; updated_at:string; members_count:number; children_count:number; pending_invitations:number };
type CatalogItem = { id:string; code:string; title:string; name:string; name_en:string; item_type:string; kind:string; description:string|null; category:string; category_label:string; country:string; city:string; price_egp:number; price_sar:number; is_active:boolean; is_sponsored:boolean; emoji:string; created_at:string; updated_at:string };
type AuditEvent = { id:number; action:string; target_type:string|null; target_id:string|null; actor_auth_user_id:string|null; actor_email:string|null; created_at:string };
type StaffDirectory = { id:string; employee_code:string; name:string; email:string; phone:string|null; department:string; title:string; status:string; cohort:string; manager_id:string|null; manager_name:string|null; account_linked:boolean; start_date:string|null; created_at:string; updated_at:string };
type AdminFamilyDetail = { id:string; name:string; country:string; city:string; currency:string; active_parent:string; created_at:string; updated_at:string; members:{id:string;name:string;role:string|null;email:string|null;phone:string|null;verified:boolean;created_at:string}[]; children:{id:string;name:string;age_stage:string;gender:string|null;birth:string|null;interests:string|null;passions_or_heroes:string|null;emoji:string;growth_height_cm:number|null;growth_weight_kg:number|null;life_records_count:number;last_record_at:string|null}[]; invitations:{id:string;partner_name:string;partner_email:string;partner_phone:string;partner_role:string;method:string;status:string;verified:boolean;expires_at:string;accepted_at:string|null;invited_by_name:string|null}[]; record_summary:{type:string;count:number;last_record_at:string}[] };
type AdminUserDetail = { user:{id:string;name:string;role:string|null;email:string|null;phone:string|null;country:string;verified:boolean;auth_linked:boolean;created_at:string;updated_at:string}; family:AdminFamilyDetail|null };
type AnalyticsSnapshot = { generated_at:string; period_days:number; metrics:{users_total:number;verified_users:number;users_with_family:number;families_total:number;families_with_children:number;families_with_records:number;active_families_period:number;records_period:number;invitations_total:number;invitations_pending:number;invitations_accepted:number;invitation_acceptance_rate:number}; country_mix:{country:string;count:number}[]; role_mix:{role:string;count:number}[]; invitation_funnel:{status:string;count:number}[]; activity_series:{date:string;count:number}[] };

type PageKey = 'overview' | 'analytics' | 'users' | 'families' | 'team' | 'access' | 'content' | 'store' | 'security' | 'settings';
type B2BPartner = {id:string;partner_code:string;legal_name:string;display_name:string;partner_type:string;tax_number:string|null;country:string;city:string;contact_name:string|null;email:string|null;phone:string|null;website:string|null;status:string;currency:string;payment_terms_days:number;credit_limit:number;notes:string|null};
type B2BProduct = {id:string;sku:string;partner_id:string|null;partner_name:string;name_ar:string;name_en:string;description:string|null;category:string;unit:string;min_order_qty:number;cost_price:number;wholesale_price:number;retail_price:number;currency:string;tax_rate:number;stock_qty:number|null;reserved_qty:number;reorder_level:number;price_tiers:{min_qty:number;unit_price:number}[];country:string;city:string|null;status:string};
type B2BOrder = {id:string;order_no:string;status:string;currency:string;subtotal:number;tax_total:number;total:number;requested_delivery_date:string|null;created_at:string;buyer_name:string};
type B2BQuote = {id:string;quote_no:string;order_id:string;order_no:string;status:string;valid_until:string|null;subtotal:number;tax_total:number;total:number;terms:string|null;created_at:string;buyer_name:string};
type B2BInvoice = {id:string;invoice_no:string;order_id:string;order_no:string;status:string;currency:string;total:number;amount_paid:number;balance_due:number;due_date:string|null;issued_at:string|null;created_at:string;buyer_name:string};
type B2BInventoryMovement = {id:number;movement_type:string;quantity_delta:number;reference:string;notes:string;created_at:string};
type RBACPermission = {permission_key:string;area:string;action:string;description:string};
type RBACRole = {role_key:string;display_name:string;description:string;is_system:boolean;permission_keys:string[]};
type RBACStaff = {id:string;employee_code:string;name:string;email:string;department:string;status:string;role_key:string;auth_user_id:string|null;account_linked:boolean};
type RBACOverride = {auth_user_id:string;staff_id:string|null;staff_name:string|null;permission_key:string;effect:string};
type RBACSnapshot = {roles:RBACRole[];permissions:RBACPermission[];staff:RBACStaff[];overrides:RBACOverride[]};
type AdminRbacSnapshot = {roles:{role_key:string;display_name:string;description:string;is_system:boolean;permission_keys:string[]}[];permissions:{permission_key:string;area:string;action:string;description:string}[];staff:{id:string;employee_code:string;name:string;email:string;department:string;status:string;role_key:string;auth_user_id:string|null;account_linked:boolean}[];overrides:{auth_user_id:string;staff_id:string|null;staff_name:string|null;permission_key:string;effect:'grant'|'deny'}[]};
type B2BStoreSnapshot = {metrics:{partners_total:number;partners_active:number;products_total:number;products_active:number;products_low_stock:number;orders_total:number;orders_open:number;quotes_pending:number;invoices_unpaid:number};partners_total:number;partners:B2BPartner[];products_total:number;products:B2BProduct[];orders:B2BOrder[];quotes_total:number;quotes:B2BQuote[];invoices_total:number;invoices:B2BInvoice[]};
const NAV: { id: PageKey; ar: string; en: string; icon: React.ElementType; group: string }[] = [
  { id: 'overview', ar: 'الرؤية العامة', en: 'Overview', icon: LayoutDashboard, group: 'main' },
  { id: 'analytics', ar: 'التحليلات والتقارير', en: 'Analytics & Reports', icon: ChartNoAxesCombined, group: 'main' },
  { id: 'users', ar: 'المستخدمون', en: 'Users', icon: Users, group: 'manage' },
  { id: 'families', ar: 'الأسر والأطفال', en: 'Families & Children', icon: Baby, group: 'manage' },
  { id: 'content', ar: 'المحتوى والخدمات', en: 'Content & Services', icon: BookOpen, group: 'manage' },
  { id: 'store', ar: 'المتجر وإدارة B2B', en: 'B2B Store & Commerce', icon: Store, group: 'manage' },
  { id: 'team', ar: 'فريق العمل', en: 'Team & Workforce', icon: UserRoundCog, group: 'manage' },
  { id: 'access', ar: 'الأدوار والصلاحيات', en: 'Roles & Permissions', icon: ShieldCheck, group: 'manage' },
  { id: 'security', ar: 'الأمان وسجل النشاط', en: 'Security & Audit', icon: ShieldCheck, group: 'system' },
  { id: 'settings', ar: 'إعدادات المنصة', en: 'Platform Settings', icon: Settings2, group: 'system' },
];

const COLORS = ['#0d9488', '#0284c7', '#f97316', '#8b5cf6', '#e86a3d', '#64748b'];
const number = (n: number) => new Intl.NumberFormat('en-US').format(n || 0);
const dateLabel = (v: string, en: boolean) => new Date(v).toLocaleDateString(en ? 'en-US' : 'ar-SA', { day: 'numeric', month: 'short' });
const recordLabel = (v: string, en: boolean) => {
  const map: Record<string, [string,string]> = {
    sleep_log: ['النوم', 'Sleep'], education: ['التعليم', 'Education'], nutrition: ['التغذية', 'Nutrition'],
    sports: ['الرياضة', 'Sports'], routine: ['الروتين', 'Routine'], growth_measurement: ['النمو', 'Growth'],
    vaccination: ['التطعيمات', 'Vaccinations'], medical_event: ['حدث صحي', 'Health event'],
    milestone: ['إنجاز', 'Milestone'], hobby: ['الهوايات', 'Hobbies'], emotional_social: ['المزاج', 'Mood'],
    memory: ['الذكريات', 'Memories'], daily_note: ['ملاحظة يومية', 'Daily note'], other: ['أخرى', 'Other']
  };
  return map[v]?.[en ? 1 : 0] || v;
};
const deptLabel = (v: string, en: boolean) => {
  const map: Record<string,[string,string]> = {
    executive:['الإدارة التنفيذية','Executive'], operations:['العمليات','Operations'], sales:['المبيعات','Sales'],
    marketing:['التسويق','Marketing'], customer_success:['نجاح العملاء','Customer success'],
    content:['المحتوى','Content'], product:['المنتج','Product'], engineering:['التقنية','Engineering'],
    finance:['المالية','Finance'], hr:['الموارد البشرية','People & culture']
  };
  return map[v]?.[en ? 1 : 0] || v;
};

export default function AdminPortal() {
  const [lang, setLang] = useState<'ar'|'en'>('ar');
  const [dark, setDark] = useState(false);
  const [page, setPage] = useState<PageKey>('overview');
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [period, setPeriod] = useState(30);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [mobileNav, setMobileNav] = useState(false);
  const [query, setQuery] = useState('');
  const [toast, setToast] = useState('');
  const [staffModal, setStaffModal] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [savingStaff, setSavingStaff] = useState(false);
  const [staffForm, setStaffForm] = useState({ fullName:'', email:'', phone:'', department:'operations', jobTitle:'', cohort:'first_50', status:'planned', managerId:'' });
  const [staffRows, setStaffRows] = useState<StaffDirectory[]>([]);
  const [rbacSnapshot, setRbacSnapshot] = useState<AdminRbacSnapshot|null>(null);
  const [rbacLoading, setRbacLoading] = useState(false);
  const [rbacSaving, setRbacSaving] = useState(false);
  const [rbacRoleKey, setRbacRoleKey] = useState('sales_manager');
  const [rbacPermissionDraft, setRbacPermissionDraft] = useState<string[]>([]);
  const [rbacStaffId, setRbacStaffId] = useState('');
  const [rbacPermissionKey, setRbacPermissionKey] = useState('');
  const [rbacEffect, setRbacEffect] = useState<'grant'|'deny'|'inherit'>('inherit');
  const [userRows, setUserRows] = useState<DirectoryUser[]>([]);
  const [familyRows, setFamilyRows] = useState<DirectoryFamily[]>([]);
  const [directoryTotal, setDirectoryTotal] = useState(0);
  const [directoryPage, setDirectoryPage] = useState(0);
  const [directoryLoading, setDirectoryLoading] = useState(false);
  const [catalogRows, setCatalogRows] = useState<CatalogItem[]>([]);
  const [b2bStore, setB2bStore] = useState<B2BStoreSnapshot | null>(null);
  const [storeTab, setStoreTab] = useState<'partners'|'products'|'orders'>('partners');
  const [storeModal, setStoreModal] = useState<'partner'|'product'|null>(null);
  const [inventoryProduct, setInventoryProduct] = useState<B2BProduct|null>(null);
  const [inventoryRows, setInventoryRows] = useState<B2BInventoryMovement[]>([]);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [paymentInvoice, setPaymentInvoice] = useState<B2BInvoice|null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const [savingPayment, setSavingPayment] = useState(false);
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [orderBuyerId, setOrderBuyerId] = useState('');
  const [orderDeliveryDate, setOrderDeliveryDate] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [orderLines, setOrderLines] = useState([{productId:'',quantity:'1'}]);
  const [savingOrder, setSavingOrder] = useState(false);
  const [documentModal, setDocumentModal] = useState<{kind:'quote'|'invoice';order:B2BOrder}|null>(null);
  const [documentDate, setDocumentDate] = useState('');
  const [documentTerms, setDocumentTerms] = useState('');
  const [savingDocument, setSavingDocument] = useState(false);
  const [rbacSnapshot, setRbacSnapshot] = useState<RBACSnapshot|null>(null);
  const [rbacLoading, setRbacLoading] = useState(false);
  const [rbacSaving, setRbacSaving] = useState(false);
  const [selectedRbacRole, setSelectedRbacRole] = useState('employee');
  const [selectedPermissionKeys, setSelectedPermissionKeys] = useState<string[]>([]);
  const [overrideStaff, setOverrideStaff] = useState<RBACStaff|null>(null);
  const [overridePermission, setOverridePermission] = useState('');
  const [overrideEffect, setOverrideEffect] = useState<'inherit'|'grant'|'deny'>('inherit');
  const [overrideSaving, setOverrideSaving] = useState(false);
  const [editingStoreId, setEditingStoreId] = useState<string|null>(null);
  const [savingStore, setSavingStore] = useState(false);
  const [storeForm, setStoreForm] = useState({legalName:'',displayName:'',partnerType:'supplier',taxNumber:'',country:'SA',city:'',contactName:'',email:'',phone:'',website:'',partnerStatus:'prospect',currency:'SAR',paymentTermsDays:'0',creditLimit:'0',notes:'',partnerId:'',nameAr:'',nameEn:'',description:'',category:'general',unit:'piece',minOrderQty:'1',costPrice:'0',wholesalePrice:'0',retailPrice:'0',taxRate:'15',stockQty:'',reorderLevel:'0',priceTiers:'[]',productCountry:'SA',productCity:'',productStatus:'draft'});
  const [auditRows, setAuditRows] = useState<AuditEvent[]>([]);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [userDetail, setUserDetail] = useState<AdminUserDetail | null>(null);
  const [familyDetail, setFamilyDetail] = useState<AdminFamilyDetail | null>(null);
  const [analyticsSnapshot, setAnalyticsSnapshot] = useState<AnalyticsSnapshot | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [catalogModal, setCatalogModal] = useState(false);
  const [editingCatalogId, setEditingCatalogId] = useState<string | null>(null);
  const [savingCatalog, setSavingCatalog] = useState(false);
  const [catalogForm, setCatalogForm] = useState({ title:'', nameEn:'', itemType:'product', category:'toys', categoryLabel:'ألعاب وتنمية', description:'', country:'ALL', city:'', priceEgp:'0', priceSar:'0', emoji:'🧸', isSponsored:false, isActive:true });
  const en = lang === 'en';
  const t = (ar: string, english: string) => en ? english : ar;

  useEffect(() => {
    document.documentElement.lang = en ? 'en' : 'ar';
    document.documentElement.dir = en ? 'ltr' : 'rtl';
    document.documentElement.dataset.theme = 'dad';
    document.documentElement.dataset.colorMode = dark ? 'dark' : 'light';
    document.title = en ? 'Nekbaar | Control Center' : 'نكبر | مركز القيادة';
  }, [en, dark]);

  const loadSnapshot = useCallback(async (days = period, quiet = false) => {
    if (!supabaseClient) return;
    if (!quiet) setLoading(true);
    else setRefreshing(true);
    const { data, error } = await supabaseClient.rpc('admin_get_dashboard_snapshot', { p_period_days: days });
    if (error) {
      setToast(t('تعذر تحديث بيانات اللوحة. تحقق من الاتصال والصلاحيات.','Could not refresh dashboard data. Check connection and access.'));
    } else if (data) {
      setSnapshot(data as Snapshot);
    }
    setLoading(false);
    setRefreshing(false);
  }, [period, en]);

  const verify = useCallback(async () => {
    if (!supabaseClient) { setChecking(false); setAuthError(t('خدمة البيانات غير متاحة حالياً.','Data service is unavailable.')); return; }
    setChecking(true);
    const { data: sessionData } = await supabaseClient.auth.getSession();
    if (!sessionData.session) { setAuthorized(false); setChecking(false); setLoading(false); return; }
    const { data, error } = await supabaseClient.rpc('admin_verify_session');
    const allowed = !error && Boolean(data?.authorized && data?.role === 'super_admin');
    setAuthorized(allowed);
    setChecking(false);
    if (allowed) await loadSnapshot(period);
  }, [period, loadSnapshot, en]);

  useEffect(() => {
    void verify();
    if (!supabaseClient) return;
    const { data } = supabaseClient.auth.onAuthStateChange((_event, session) => {
      if (!session) { setAuthorized(false); setSnapshot(null); }
      else window.setTimeout(() => { void verify(); }, 0);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!authorized) return;
    void loadSnapshot(period);
  }, [period]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(''), 3600);
    return () => window.clearTimeout(id);
  }, [toast]);

  const login = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!supabaseClient) return;
    setAuthError('');
    const { error } = await supabaseClient.auth.signInWithPassword({ email: email.trim(), password });
    if (error) { setAuthError(error.message); return; }
    await verify();
  };
  const logout = async () => {
    await supabaseClient?.auth.signOut();
    setAuthorized(false);
    setSnapshot(null);
  };

  const k = snapshot?.kpis;
  const loadDirectory = useCallback(async () => {
    if (!supabaseClient || (page !== 'users' && page !== 'families')) return;
    setDirectoryLoading(true);
    const args = { p_search: query.trim() || null, p_limit: 25, p_offset: directoryPage * 25 };
    if (page === 'users') {
      const { data, error } = await supabaseClient.rpc('admin_get_user_directory', args);
      if (error) setToast(t('تعذر تحميل دليل المستخدمين: ','Could not load user directory: ') + error.message);
      else {
        const result = data as { items?: DirectoryUser[]; total_count?: number };
        setUserRows(Array.isArray(result?.items) ? result.items : []);
        setDirectoryTotal(Number(result?.total_count || 0));
      }
    } else {
      const { data, error } = await supabaseClient.rpc('admin_get_family_directory', args);
      if (error) setToast(t('تعذر تحميل دليل الأسر: ','Could not load family directory: ') + error.message);
      else {
        const result = data as { items?: DirectoryFamily[]; total_count?: number };
        setFamilyRows(Array.isArray(result?.items) ? result.items : []);
        setDirectoryTotal(Number(result?.total_count || 0));
      }
    }
    setDirectoryLoading(false);
  }, [page, query, directoryPage, en]);

  useEffect(() => {
    if (authorized && (page === 'users' || page === 'families')) void loadDirectory();
  }, [authorized, page, loadDirectory]);

  const openUserDetail = async (id:string) => {
    if (!supabaseClient) return;
    setDetailModalOpen(true); setDetailLoading(true); setUserDetail(null); setFamilyDetail(null);
    const { data, error } = await supabaseClient.rpc('admin_get_user_detail', { p_user_id:id });
    setDetailLoading(false);
    if (error) { setDetailModalOpen(false); setToast(t('تعذر تحميل تفاصيل المستخدم: ','Could not load user details: ') + error.message); return; }
    setUserDetail(data as AdminUserDetail);
  };

  const openFamilyDetail = async (id:string) => {
    if (!supabaseClient) return;
    setDetailModalOpen(true); setDetailLoading(true); setUserDetail(null); setFamilyDetail(null);
    const { data, error } = await supabaseClient.rpc('admin_get_family_detail', { p_family_id:id });
    setDetailLoading(false);
    if (error) { setDetailModalOpen(false); setToast(t('تعذر تحميل تفاصيل الأسرة: ','Could not load family details: ') + error.message); return; }
    setFamilyDetail(data as AdminFamilyDetail);
  };

  const closeDetailModal = () => { setDetailModalOpen(false); setUserDetail(null); setFamilyDetail(null); };

  const loadRbacSnapshot = useCallback(async () => {
    if(!supabaseClient||page!=='access')return;setRbacLoading(true);
    const {data,error}=await supabaseClient.rpc('admin_get_rbac_snapshot');
    if(error)setToast(t('تعذر تحميل الأدوار والصلاحيات: ','Could not load roles and permissions: ')+error.message);
    else setRbacSnapshot(data as AdminRbacSnapshot);
    setRbacLoading(false);
  },[page,en]);
  useEffect(()=>{if(authorized&&page==='access')void loadRbacSnapshot();},[authorized,page,loadRbacSnapshot]);
  useEffect(()=>{const role=rbacSnapshot?.roles.find(r=>r.role_key===rbacRoleKey);if(role)setRbacPermissionDraft(role.permission_keys||[]);},[rbacSnapshot,rbacRoleKey]);
  useEffect(()=>{if(!rbacStaffId&&rbacSnapshot?.staff.length){const linked=rbacSnapshot.staff.find(s=>s.account_linked);if(linked)setRbacStaffId(linked.id);}},[rbacSnapshot,rbacStaffId]);
  const saveRolePermissions = async () => {
    if(!supabaseClient||rbacSaving)return;setRbacSaving(true);
    const {error}=await supabaseClient.rpc('admin_save_role_permissions',{p_role_key:rbacRoleKey,p_permission_keys:rbacPermissionDraft});
    setRbacSaving(false);if(error)setToast(t('تعذر حفظ صلاحيات الدور: ','Could not save role permissions: ')+error.message);else{setToast(t('تم حفظ صلاحيات الدور.','Role permissions saved.'));await loadRbacSnapshot();}
  };
  const assignStaffRole = async (staffId:string,roleKey:string) => {
    if(!supabaseClient)return;const {error}=await supabaseClient.rpc('admin_save_staff_role',{p_staff_id:staffId,p_role_key:roleKey});
    if(error)setToast(t('تعذر تغيير دور الموظف: ','Could not change staff role: ')+error.message);else{setToast(t('تم تحديث دور الموظف.','Staff role updated.'));await loadRbacSnapshot();}
  };
  const saveStaffOverride = async () => {
    if(!supabaseClient||!rbacStaffId||!rbacPermissionKey)return;setRbacSaving(true);
    const {error}=await supabaseClient.rpc('admin_save_staff_permission_override',{p_staff_id:rbacStaffId,p_permission_key:rbacPermissionKey,p_effect:rbacEffect});
    setRbacSaving(false);if(error)setToast(t('تعذر حفظ الاستثناء: ','Could not save override: ')+error.message);else{setToast(t('تم تحديث الاستثناء الفردي.','Individual permission override updated.'));await loadRbacSnapshot();}
  };

  const loadStaffDirectory = useCallback(async () => {
    if (!supabaseClient || page !== 'team') return;
    setDirectoryLoading(true);
    const { data, error } = await supabaseClient.rpc('admin_get_staff_directory', { p_search: query.trim() || null, p_limit: 100, p_offset: 0 });
    if (error) setToast(t('تعذر تحميل هيكل الفريق: ','Could not load workforce directory: ') + error.message);
    else {
      const result = data as { items?: StaffDirectory[]; total_count?: number };
      setStaffRows(Array.isArray(result?.items) ? result.items : []);
      setDirectoryTotal(Number(result?.total_count || 0));
    }
    setDirectoryLoading(false);
  }, [page, query, en]);

  useEffect(() => { if (authorized && page === 'team') void loadStaffDirectory(); }, [authorized, page, loadStaffDirectory]);

  const loadRbacSnapshot = useCallback(async () => {
    if(!supabaseClient)return;setRbacLoading(true);
    const {data,error}=await supabaseClient.rpc('admin_get_rbac_snapshot');
    setRbacLoading(false);
    if(error){setToast(t('تعذر تحميل الأدوار والصلاحيات: ','Could not load roles and permissions: ')+error.message);return;}
    setRbacSnapshot(data as RBACSnapshot);
  },[en]);
  useEffect(()=>{if(authorized&&page==='team')void loadRbacSnapshot();},[authorized,page,loadRbacSnapshot]);
  useEffect(()=>{const role=rbacSnapshot?.roles.find(r=>r.role_key===selectedRbacRole);if(role)setSelectedPermissionKeys(role.permission_keys||[]);},[rbacSnapshot,selectedRbacRole]);

  const saveStaffRole = async (staffId:string,roleKey:string) => {
    if(!supabaseClient)return;const {error}=await supabaseClient.rpc('admin_save_staff_role',{p_staff_id:staffId,p_role_key:roleKey});
    if(error){setToast(t('تعذر تعيين دور الموظف: ','Could not assign staff role: ')+error.message);return;}
    setToast(t('تم تحديث دور الموظف وتسجيل العملية.','Staff role updated and audited.'));await Promise.all([loadRbacSnapshot(),loadStaffDirectory()]);
  };
  const saveRolePermissions = async () => {
    if(!supabaseClient||selectedRbacRole==='super_admin'||rbacSaving)return;setRbacSaving(true);
    const {error}=await supabaseClient.rpc('admin_save_role_permissions',{p_role_key:selectedRbacRole,p_permission_keys:selectedPermissionKeys});setRbacSaving(false);
    if(error){setToast(t('تعذر حفظ صلاحيات الدور: ','Could not save role permissions: ')+error.message);return;}
    setToast(t('تم حفظ مصفوفة الصلاحيات.','Role permission matrix saved.'));await loadRbacSnapshot();
  };
  const saveStaffOverride = async (event:React.FormEvent) => {
    event.preventDefault();if(!supabaseClient||!overrideStaff||overrideSaving)return;setOverrideSaving(true);
    const {error}=await supabaseClient.rpc('admin_save_staff_permission_override',{p_staff_id:overrideStaff.id,p_permission_key:overridePermission,p_effect:overrideEffect});setOverrideSaving(false);
    if(error){setToast(t('تعذر حفظ الاستثناء: ','Could not save permission override: ')+error.message);return;}
    setOverrideStaff(null);setToast(t('تم تحديث الاستثناء الفردي وتسجيله.','Individual permission override saved and audited.'));await loadRbacSnapshot();
  };

  const loadAnalytics = useCallback(async () => {
    if (!supabaseClient || page !== 'analytics') return;
    setAnalyticsLoading(true);
    const { data, error } = await supabaseClient.rpc('admin_get_analytics_snapshot', { p_period_days: period });
    if (error) setToast(t('تعذر تحميل التحليلات: ','Could not load analytics: ') + error.message);
    else setAnalyticsSnapshot(data as AnalyticsSnapshot);
    setAnalyticsLoading(false);
  }, [page, period, en]);

  useEffect(() => { if (authorized && page === 'analytics') void loadAnalytics(); }, [authorized, page, period, loadAnalytics]);

  const exportSnapshot = () => {
    if (!snapshot) return;
    const rows = [
      ['metric','value'], ...Object.entries(snapshot.kpis).map(([key,value]) => [key,String(value)]),
      ['generated_at',snapshot.generated_at]
    ];
    const csv = rows.map(row => row.map(cell => '"' + String(cell).replace(/"/g,'""') + '"').join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url; anchor.download = 'nekbaar-platform-overview.csv'; anchor.click();
    URL.revokeObjectURL(url);
    setToast(t('تم تجهيز تقرير المؤشرات.','KPI report exported.'));
  };

  const openStaffModal = (staff?: StaffDirectory) => {
    setEditingStaffId(staff?.id || null);
    setStaffForm(staff ? {
      fullName: staff.name || '', email: staff.email || '', phone: staff.phone || '',
      department: staff.department || 'operations', jobTitle: staff.title || '',
      cohort: staff.cohort || 'first_50', status: staff.status || 'planned', managerId: staff.manager_id || ''
    } : { fullName:'', email:'', phone:'', department:'operations', jobTitle:'', cohort:'first_50', status:'planned', managerId:'' });
    setStaffModal(true);
  };
  const saveStaff = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!supabaseClient || savingStaff) return;
    setSavingStaff(true);
    const { error } = await supabaseClient.rpc('admin_save_staff_hierarchy', {
      p_id: editingStaffId, p_full_name: staffForm.fullName, p_email: staffForm.email,
      p_department: staffForm.department, p_job_title: staffForm.jobTitle,
      p_phone: staffForm.phone || null, p_cohort: staffForm.cohort,
      p_employment_status: staffForm.status, p_manager_id: staffForm.managerId || null
    });
    setSavingStaff(false);
    if (error) {
      setToast(t('تعذر حفظ الموظف: ','Could not save employee: ') + error.message);
      return;
    }
    setStaffModal(false);
    setToast(editingStaffId ? t('تم تحديث بيانات الموظف.','Employee updated.') : t('تمت إضافة الموظف إلى الهيكل.','Employee added to workforce.'));
    await loadStaffDirectory();
    await loadSnapshot(period, true);
  };

  const loadB2BStore = useCallback(async () => {
    if (!supabaseClient || page !== 'store') return;
    setDirectoryLoading(true);
    const { data, error } = await supabaseClient.rpc('admin_get_b2b_store_snapshot', { p_search:query.trim()||null, p_limit:50, p_offset:directoryPage*50 });
    if (error) setToast(t('تعذر تحميل إدارة المتجر: ','Could not load B2B store: ') + error.message);
    else setB2bStore(data as B2BStoreSnapshot);
    setDirectoryLoading(false);
  }, [page,query,directoryPage,en]);

  useEffect(() => { if (authorized && page === 'store') void loadB2BStore(); }, [authorized,page,loadB2BStore]);

  const openStoreModal = (kind:'partner'|'product', row?:B2BPartner|B2BProduct) => {
    setStoreModal(kind); setEditingStoreId(row?.id||null);
    if (kind==='partner' && row && 'partner_code' in row) setStoreForm(v=>({...v,legalName:row.legal_name,displayName:row.display_name,partnerType:row.partner_type,taxNumber:row.tax_number||'',country:row.country,city:row.city,contactName:row.contact_name||'',email:row.email||'',phone:row.phone||'',website:row.website||'',partnerStatus:row.status,currency:row.currency,paymentTermsDays:String(row.payment_terms_days),creditLimit:String(row.credit_limit),notes:row.notes||''}));
    else if(kind==='product' && row && 'sku' in row) setStoreForm(v=>({...v,partnerId:row.partner_id||'',nameAr:row.name_ar,nameEn:row.name_en,description:row.description||'',category:row.category,unit:row.unit,minOrderQty:String(row.min_order_qty),costPrice:String(row.cost_price),wholesalePrice:String(row.wholesale_price),retailPrice:String(row.retail_price),currency:row.currency,taxRate:String(row.tax_rate),stockQty:row.stock_qty===null?'':String(row.stock_qty),reorderLevel:String(row.reorder_level||0),priceTiers:JSON.stringify(row.price_tiers||[],null,2),productCountry:row.country,productCity:row.city||'',productStatus:row.status}));
    else setStoreForm(v=>({...v,legalName:'',displayName:'',partnerType:'supplier',taxNumber:'',country:'SA',city:'',contactName:'',email:'',phone:'',website:'',partnerStatus:'prospect',currency:'SAR',paymentTermsDays:'0',creditLimit:'0',notes:'',partnerId:'',nameAr:'',nameEn:'',description:'',category:'general',unit:'piece',minOrderQty:'1',costPrice:'0',wholesalePrice:'0',retailPrice:'0',taxRate:'15',stockQty:'',reorderLevel:'0',priceTiers:'[]',productCountry:'SA',productCity:'',productStatus:'draft'}));
  };

  const saveStoreRecord = async (event:React.FormEvent) => {
    event.preventDefault(); if(!supabaseClient||savingStore||!storeModal)return; setSavingStore(true);
    const rpc=storeModal==='partner'?'admin_save_b2b_partner':'admin_save_b2b_product_v2';
    let priceTiers:{min_qty:number;unit_price:number}[]=[];
    if(storeModal==='product'){try{priceTiers=JSON.parse(storeForm.priceTiers||'[]');if(!Array.isArray(priceTiers)||priceTiers.some(x=>!Number.isFinite(Number(x.min_qty))||Number(x.min_qty)<=0||!Number.isFinite(Number(x.unit_price))||Number(x.unit_price)<0))throw new Error('Invalid tiers');}catch{setSavingStore(false);setToast(t('شرائح الأسعار غير صحيحة. راجع صيغة JSON.','Invalid price tiers. Check the JSON format.'));return;}}
    const args=storeModal==='partner'?{p_id:editingStoreId,p_legal_name:storeForm.legalName,p_display_name:storeForm.displayName,p_partner_type:storeForm.partnerType,p_tax_number:storeForm.taxNumber||null,p_country:storeForm.country,p_city:storeForm.city,p_contact_name:storeForm.contactName||null,p_email:storeForm.email||null,p_phone:storeForm.phone||null,p_website:storeForm.website||null,p_status:storeForm.partnerStatus,p_currency:storeForm.currency,p_payment_terms_days:Number(storeForm.paymentTermsDays||0),p_credit_limit:Number(storeForm.creditLimit||0),p_notes:storeForm.notes||null}:{p_id:editingStoreId,p_partner_id:storeForm.partnerId||null,p_name_ar:storeForm.nameAr,p_name_en:storeForm.nameEn,p_description:storeForm.description||null,p_category:storeForm.category,p_unit:storeForm.unit,p_min_order_qty:Number(storeForm.minOrderQty||1),p_cost_price:Number(storeForm.costPrice||0),p_wholesale_price:Number(storeForm.wholesalePrice||0),p_retail_price:Number(storeForm.retailPrice||0),p_currency:storeForm.currency,p_tax_rate:Number(storeForm.taxRate||0),p_stock_qty:storeForm.stockQty===''?null:Number(storeForm.stockQty),p_country:storeForm.productCountry,p_city:storeForm.productCity||null,p_status:storeForm.productStatus,p_price_tiers:priceTiers,p_reorder_level:Number(storeForm.reorderLevel||0)};
    const {error}=await supabaseClient.rpc(rpc,args); setSavingStore(false);
    if(error){setToast(t('تعذر حفظ بيانات المتجر: ','Could not save store record: ')+error.message);return;}
    setStoreModal(null);setToast(storeModal==='partner'?t('تم حفظ بيانات الشريك التجاري.','Business partner saved.'):t('تم حفظ بيانات المنتج التجاري.','B2B product saved.'));
    await loadB2BStore();
  };

  const createB2BOrder = async (event:React.FormEvent) => {
    event.preventDefault();if(!supabaseClient||savingOrder)return;setSavingOrder(true);
    const items=orderLines.filter(x=>x.productId&&Number(x.quantity)>0).map(x=>({product_id:x.productId,quantity:Number(x.quantity)}));
    if(!orderBuyerId||!items.length){setSavingOrder(false);setToast(t('اختر العميل التجاري ومنتجاً واحداً على الأقل.','Select a business buyer and at least one product.'));return;}
    const {data,error}=await supabaseClient.rpc('admin_create_b2b_order',{p_buyer_partner_id:orderBuyerId,p_items:items,p_requested_delivery_date:orderDeliveryDate||null,p_notes:orderNotes||null});setSavingOrder(false);
    if(error){setToast(t('تعذر إنشاء طلب الشركة: ','Could not create B2B order: ')+error.message);return;}
    setOrderModalOpen(false);setOrderBuyerId('');setOrderDeliveryDate('');setOrderNotes('');setOrderLines([{productId:'',quantity:'1'}]);
    setToast(t('تم إنشاء طلب الشركة وحساب الأسعار والضريبة.','B2B order created with calculated pricing and tax.'));await loadB2BStore();
  };

  const createB2BDocument = async (event:React.FormEvent) => {
    event.preventDefault();if(!supabaseClient||!documentModal||savingDocument)return;setSavingDocument(true);
    const isQuote=documentModal.kind==='quote';
    const {error}=await supabaseClient.rpc(isQuote?'admin_create_b2b_quote':'admin_create_b2b_invoice',isQuote?{p_order_id:documentModal.order.id,p_valid_until:documentDate||null,p_terms:documentTerms||null}:{p_order_id:documentModal.order.id,p_due_date:documentDate||null});
    setSavingDocument(false);if(error){setToast(t('تعذر إنشاء المستند التجاري: ','Could not create commercial document: ')+error.message);return;}
    setDocumentModal(null);setDocumentDate('');setDocumentTerms('');setToast(isQuote?t('تم إنشاء عرض السعر.','Quotation created.'):t('تم إنشاء الفاتورة.','Invoice created.'));await loadB2BStore();
  };

  const openInventoryHistory = async (product:B2BProduct) => {
    if(!supabaseClient)return;setInventoryProduct(product);setInventoryRows([]);setInventoryLoading(true);
    const {data,error}=await supabaseClient.rpc('admin_get_b2b_product_inventory_history',{p_product_id:product.id,p_limit:50});
    setInventoryLoading(false);
    if(error){setInventoryProduct(null);setToast(t('تعذر تحميل حركة المخزون: ','Could not load stock history: ')+error.message);return;}
    setInventoryRows(Array.isArray(data)?data as B2BInventoryMovement[]:[]);
  };

  const recordInvoicePayment = async (event:React.FormEvent) => {
    event.preventDefault();if(!supabaseClient||!paymentInvoice||savingPayment)return;setSavingPayment(true);
    const {error}=await supabaseClient.rpc('admin_record_b2b_invoice_payment',{p_invoice_id:paymentInvoice.id,p_amount:Number(paymentAmount),p_note:paymentNote||null});
    setSavingPayment(false);
    if(error){setToast(t('تعذر تسجيل الدفعة: ','Could not record payment: ')+error.message);return;}
    setPaymentInvoice(null);setPaymentAmount('');setPaymentNote('');setToast(t('تم تسجيل الدفعة وتحديث رصيد الفاتورة.','Payment recorded and invoice balance updated.'));await loadB2BStore();
  };

  const updateB2BDocumentStatus = async (entity:'quote'|'invoice',id:string,status:string) => {
    if(!supabaseClient)return;const {error}=await supabaseClient.rpc('admin_update_b2b_document_status',{p_entity:entity,p_id:id,p_status:status,p_note:null});
    if(error)setToast(t('تعذر تحديث المستند: ','Could not update document: ')+error.message);else{setToast(t('تم تحديث المستند وتسجيل الإجراء.','Document updated and audited.'));await loadB2BStore();}
  };
  const updateB2BOrderStatus = async (orderId:string,status:string) => {
    if(!supabaseClient)return;
    const {error}=await supabaseClient.rpc('admin_update_b2b_order_status',{p_order_id:orderId,p_status:status,p_notes:null});
    if(error){setToast(t('تعذر تحديث حالة الطلب: ','Could not update order status: ')+error.message);return;}
    setToast(t('تم تحديث حالة الطلب وتسجيل الإجراء.','Order status updated and audited.'));
    await loadB2BStore();
  };

  const loadCatalog = useCallback(async () => {
    if (!supabaseClient || page !== 'content') return;
    setDirectoryLoading(true);
    const { data, error } = await supabaseClient.rpc('admin_get_catalog_directory', {
      p_search: query.trim() || null, p_limit: 25, p_offset: directoryPage * 25
    });
    if (error) setToast(t('تعذر تحميل الكتالوج: ','Could not load catalog: ') + error.message);
    else {
      const result = data as { items?: CatalogItem[]; total_count?: number };
      setCatalogRows(Array.isArray(result?.items) ? result.items : []);
      setDirectoryTotal(Number(result?.total_count || 0));
    }
    setDirectoryLoading(false);
  }, [page, query, directoryPage, en]);

  useEffect(() => {
    if (authorized && page === 'content') void loadCatalog();
  }, [authorized, page, loadCatalog]);

  const openCatalogModal = (item?: CatalogItem) => {
    setEditingCatalogId(item?.id || null);
    setCatalogForm(item ? {
      title:item.title || item.name || '', nameEn:item.name_en || '', itemType:item.item_type || 'product',
      category:item.category || 'toys', categoryLabel:item.category_label || '', description:item.description || '',
      country:item.country || 'ALL', city:item.city || '', priceEgp:String(item.price_egp ?? 0),
      priceSar:String(item.price_sar ?? 0), emoji:item.emoji || '🧸', isSponsored:Boolean(item.is_sponsored), isActive:Boolean(item.is_active)
    } : { title:'', nameEn:'', itemType:'product', category:'toys', categoryLabel:'ألعاب وتنمية', description:'', country:'ALL', city:'', priceEgp:'0', priceSar:'0', emoji:'🧸', isSponsored:false, isActive:true });
    setCatalogModal(true);
  };

  const saveCatalogItem = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!supabaseClient || savingCatalog) return;
    setSavingCatalog(true);
    const { error } = await supabaseClient.rpc('admin_save_catalog_item', {
      p_id:editingCatalogId, p_title:catalogForm.title, p_name_en:catalogForm.nameEn,
      p_item_type:catalogForm.itemType, p_category:catalogForm.category,
      p_category_label:catalogForm.categoryLabel, p_description:catalogForm.description,
      p_country:catalogForm.country, p_city:catalogForm.city,
      p_price_egp:Number(catalogForm.priceEgp || 0), p_price_sar:Number(catalogForm.priceSar || 0),
      p_emoji:catalogForm.emoji, p_is_sponsored:catalogForm.isSponsored, p_is_active:catalogForm.isActive
    });
    setSavingCatalog(false);
    if (error) { setToast(t('تعذر حفظ العنصر: ','Could not save item: ') + error.message); return; }
    setCatalogModal(false);
    setToast(editingCatalogId ? t('تم تحديث عنصر الكتالوج.','Catalog item updated.') : t('تمت إضافة عنصر الكتالوج.','Catalog item created.'));
    await loadCatalog();
    await loadSnapshot(period,true);
  };

  const toggleCatalogStatus = async (item: CatalogItem) => {
    if (!supabaseClient) return;
    const { error } = await supabaseClient.rpc('admin_save_catalog_item', {
      p_id:item.id, p_title:item.title || item.name, p_name_en:item.name_en,
      p_item_type:item.item_type || item.kind, p_category:item.category,
      p_category_label:item.category_label, p_description:item.description || '',
      p_country:item.country, p_city:item.city, p_price_egp:Number(item.price_egp || 0),
      p_price_sar:Number(item.price_sar || 0), p_emoji:item.emoji,
      p_is_sponsored:Boolean(item.is_sponsored), p_is_active:!item.is_active
    });
    if (error) setToast(t('تعذر تغيير حالة النشر: ','Could not change publish status: ') + error.message);
    else {
      setToast(item.is_active ? t('تم إيقاف نشر العنصر.','Item unpublished.') : t('تم نشر العنصر.','Item published.'));
      await loadCatalog();
      await loadSnapshot(period,true);
    }
  };


  const loadAudit = useCallback(async () => {
    if (!supabaseClient || page !== 'security') return;
    setDirectoryLoading(true);
    const { data, error } = await supabaseClient.rpc('admin_get_audit_directory', {
      p_search: query.trim() || null, p_limit: 25, p_offset: directoryPage * 25
    });
    if (error) setToast(t('تعذر تحميل سجل التدقيق: ','Could not load audit trail: ') + error.message);
    else {
      const result = data as { items?: AuditEvent[]; total_count?: number };
      setAuditRows(Array.isArray(result?.items) ? result.items : []);
      setDirectoryTotal(Number(result?.total_count || 0));
    }
    setDirectoryLoading(false);
  }, [page, query, directoryPage, en]);

  useEffect(() => {
    if (authorized && page === 'security') void loadAudit();
  }, [authorized, page, loadAudit]);

  const heading = NAV.find(item => item.id === page);
  const subtitle = page === 'overview'
    ? t('صورة موحدة لصحة المنصة ونموها وتشغيلها.','A unified view of platform health, growth and operations.')
    : t('بيانات تشغيلية فعلية من قاعدة بيانات نكبر.','Live operational data from Nekbaar database.');

  if (checking) return <div className="admin-loading"><div className="admin-loader-mark"><Sparkles size={25}/></div><span>{t('جارٍ التحقق من صلاحية الإدارة…','Verifying administrator access…')}</span></div>;

  if (!authorized) return (
    <div className="admin-login-wrap" dir={en ? 'ltr' : 'rtl'}>
      <div className="admin-login-orbit orbit-one"/><div className="admin-login-orbit orbit-two"/>
      <form className="admin-login-card" onSubmit={login}>
        <div className="admin-brand-lockup"><div className="admin-brand-mark"><Sparkles size={25}/></div><div><strong>نكبر <span>NEKBAAR</span></strong><small>{t('مركز القيادة والتحكم','CONTROL CENTER')}</small></div></div>
        <div className="admin-login-kicker"><LockKeyhole size={14}/> {t('دخول إداري محمي','SECURE ADMIN ACCESS')}</div>
        <h1>{t('أهلاً بعودتك','Welcome back')}</h1>
        <p>{t('سجّل الدخول بحساب المالك المعتمد للوصول إلى لوحة التحكم.','Sign in with the verified owner account to access the control center.')}</p>
        <label>{t('البريد الإلكتروني','Email address')}<input type="email" autoComplete="username" value={email} onChange={e=>setEmail(e.target.value)} placeholder="owner@nekbaar.com" required/></label>
        <label>{t('كلمة المرور','Password')}<input type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••••••" required/></label>
        {authError && <div className="admin-auth-error">{authError}</div>}
        <button className="admin-primary-btn" type="submit">{t('دخول إلى مركز القيادة','Enter control center')} <ChevronLeft size={17}/></button>
        <div className="admin-login-foot"><ShieldCheck size={15}/> {t('الوصول محصور في حسابات الإدارة المصرح بها','Access restricted to authorized platform administrators')}</div>
      </form>
      <button className="admin-language-float" onClick={()=>setLang(en?'ar':'en')}>{en?'العربية':'English'}</button>
    </div>
  );

  const Sidebar = () => (
    <aside className={'admin-sidebar ' + (mobileNav ? 'is-open' : '')}>
      <div className="admin-sidebar-brand">
        <div className="admin-brand-mark"><Sparkles size={23}/></div>
        <div><strong>نكبر <span>NEKBAAR</span></strong><small>{t('مركز القيادة','CONTROL CENTER')}</small></div>
        <button className="admin-mobile-close" onClick={()=>setMobileNav(false)}><X size={19}/></button>
      </div>
      <div className="admin-workspace-pill"><span className="admin-online-dot"/><div><b>{t('المنصة الرئيسية','Main workspace')}</b><small>{t('بيئة الإنتاج','Production environment')}</small></div><ChevronDown size={15}/></div>
      {(['main','manage','system'] as const).map(group => <div className="admin-nav-group" key={group}>
        <div className="admin-nav-label">{group==='main'?t('الرئيسية','MAIN'):group==='manage'?t('إدارة المنصة','MANAGEMENT'):t('الحوكمة والنظام','GOVERNANCE')}</div>
        {NAV.filter(item=>item.group===group).map(item=>{const Icon=item.icon;return <button key={item.id} onClick={()=>{setPage(item.id);setMobileNav(false);setQuery('');setDirectoryPage(0);}} className={'admin-nav-item '+(page===item.id?'active':'')}><Icon size={18}/><span>{t(item.ar,item.en)}</span>{item.id==='security'&&snapshot?.recent_admin_events?.length?<i>{snapshot.recent_admin_events.length}</i>:null}</button>})}
      </div>)}
      <div className="admin-sidebar-spacer"/>
      <div className="admin-sidebar-capacity"><div className="capacity-head"><span>{t('خطة التوسع','TEAM CAPACITY')}</span><TrendingUp size={15}/></div><strong>50 <small>/ 150</small></strong><div className="capacity-track"><i/></div><p>{t('المرحلة الأولى ثم التوسع للمرحلة الثانية','Phase 1, then scale to phase 2')}</p></div>
      <div className="admin-profile"><div className="admin-avatar">SA</div><div><b>{t('مالك المنصة','Platform owner')}</b><small>Super Admin</small></div><button onClick={logout} title={t('تسجيل الخروج','Sign out')}><LogOut size={17}/></button></div>
    </aside>
  );

  const MetricCard = ({label,value,detail,icon:Icon,tone}:{label:string;value:number;detail:string;icon:React.ElementType;tone:string}) => (
    <article className="admin-metric-card"><div className={'metric-icon '+tone}><Icon size={19}/></div><span className="metric-label">{label}</span><strong>{loading?'—':number(value)}</strong><small>{detail}</small></article>
  );

  return (
    <div className={'admin-app '+(dark?'admin-dark':'')} dir={en?'ltr':'rtl'}>
      <Sidebar/>
      {mobileNav&&<button className="admin-mobile-scrim" onClick={()=>setMobileNav(false)} aria-label="Close navigation"/>}
      <div className="admin-main">
        <header className="admin-topbar">
          <div className="admin-topbar-left"><button className="admin-menu-btn" onClick={()=>setMobileNav(true)}><Menu size={20}/></button><div className="admin-breadcrumb"><span>{t('نكبر','Nekbaar')}</span><ChevronLeft size={14}/><b>{heading?t(heading.ar,heading.en):'—'}</b></div></div>
          <div className="admin-topbar-actions"><div className="admin-live-state"><span/> {t('النظام يعمل','Systems operational')}</div><button className="admin-icon-btn" onClick={()=>setDark(v=>!v)} title={t('الوضع الليلي','Dark mode')}><Moon size={18}/></button><button className="admin-icon-btn" onClick={()=>setLang(en?'ar':'en')}>{en?'ع':'EN'}</button><button className="admin-icon-btn" onClick={()=>void loadSnapshot(period,true)} title={t('تحديث','Refresh')}><RefreshCw size={17} className={refreshing?'admin-spin':''}/></button><div className="admin-top-avatar">SA</div></div>
        </header>
        <main className="admin-content">
          <section className="admin-page-heading"><div><div className="admin-eyebrow"><span/><span>{t('لوحة الإدارة المركزية','CENTRAL ADMINISTRATION')}</span></div><h1>{page==='overview'?t('مركز قيادة نكبر','Nekbaar Control Center'):heading?t(heading.ar,heading.en):''}</h1><p>{subtitle}</p></div><div className="admin-heading-actions"><label className="admin-period-select"><CalendarDays size={16}/><select value={period} onChange={e=>setPeriod(Number(e.target.value))}><option value={7}>{t('آخر 7 أيام','Last 7 days')}</option><option value={30}>{t('آخر 30 يوم','Last 30 days')}</option><option value={90}>{t('آخر 90 يوم','Last 90 days')}</option></select><ChevronDown size={14}/></label><button className="admin-export-btn" onClick={exportSnapshot}><Download size={16}/>{t('تصدير','Export')}</button></div></section>

          {page==='overview' && <>
            <section className="admin-welcome-banner"><div className="welcome-copy"><div className="welcome-chip"><Sparkles size={13}/>{t('نظرة المالك','OWNER OVERVIEW')}</div><h2>{t('كل تفاصيل نكبر، في مكان واحد.','Everything about Nekbaar. One command center.')}</h2><p>{t('تابع النمو، افهم سلوك الاستخدام، وراقب التشغيل من لوحة واحدة مبنية على بيانات الإنتاج.','Track growth, understand usage, and oversee operations from one live production dashboard.')}</p><div className="welcome-meta"><span><CheckCircle2 size={15}/>{t('متصل بقاعدة البيانات','Database connected')}</span><span><Clock3 size={15}/>{snapshot?new Date(snapshot.generated_at).toLocaleTimeString(en?'en-US':'ar-SA',{hour:'2-digit',minute:'2-digit'}):'—'}</span></div></div><div className="welcome-art"><div className="welcome-ring ring-a"/><div className="welcome-ring ring-b"/><div className="welcome-orb"><Command size={40}/></div><div className="welcome-float float-a"><Users size={18}/></div><div className="welcome-float float-b"><Activity size={18}/></div></div></section>
            <section className="admin-kpi-grid">
              <MetricCard label={t('حسابات المستخدمين','Registered users')} value={k?.users_total||0} detail={t('إجمالي الحسابات المسجلة','Total registered accounts')} icon={Users} tone="teal"/>
              <MetricCard label={t('الأسر المسجلة','Registered families')} value={k?.families_total||0} detail={t('مساحات أسرية على المنصة','Family spaces on platform')} icon={Building2} tone="blue"/>
              <MetricCard label={t('ملفات الأطفال','Child profiles')} value={k?.children_total||0} detail={t('ملفات مرتبطة بالأسر','Profiles linked to families')} icon={Baby} tone="coral"/>
              <MetricCard label={t('سجلات الحياة','Life records')} value={k?.child_records_total||0} detail={t('أحداث يومية محفوظة','Saved daily events')} icon={HeartPulse} tone="purple"/>
            </section>
            <section className="admin-two-col">
              <article className="admin-panel admin-chart-panel"><div className="panel-heading"><div><h3>{t('نمو التسجيلات','Registration growth')}</h3><p>{t('حسابات جديدة حسب يوم الإنشاء','New accounts by creation date')}</p></div><span className="panel-badge"><TrendingUp size={14}/>{t('نمو المستخدمين','User growth')}</span></div><div className="chart-area">{loading?<div className="admin-chart-skeleton"/>:<ResponsiveContainer width="100%" height="100%"><AreaChart data={snapshot?.signup_series||[]} margin={{top:10,right:8,left:-18,bottom:0}}><defs><linearGradient id="signupGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#0d9488" stopOpacity={0.28}/><stop offset="95%" stopColor="#0d9488" stopOpacity={0.015}/></linearGradient></defs><CartesianGrid strokeDasharray="3 5" vertical={false} stroke="var(--admin-border)"/><XAxis dataKey="date" tickFormatter={v=>dateLabel(v,en)} tickLine={false} axisLine={false} tick={{fontSize:11,fill:'var(--admin-muted)'}} minTickGap={25}/><YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{fontSize:11,fill:'var(--admin-muted)'}}/><Tooltip labelFormatter={v=>dateLabel(String(v),en)} contentStyle={{borderRadius:12,border:'1px solid var(--admin-border)',background:'var(--admin-surface)',color:'var(--admin-text)',fontFamily:'inherit'}}/><Area type="monotone" dataKey="count" name={t('حسابات جديدة','New accounts')} stroke="#0d9488" strokeWidth={3} fill="url(#signupGradient)" activeDot={{r:5,strokeWidth:0}}/></AreaChart></ResponsiveContainer>}</div></article>
              <article className="admin-panel admin-health-panel"><div className="panel-heading"><div><h3>{t('نبض المنصة','Platform pulse')}</h3><p>{t('مؤشرات التشغيل الحالية','Current operating indicators')}</p></div><Activity size={19} className="panel-heading-icon"/></div><div className="pulse-list"><div><span className="pulse-icon teal"><Users size={17}/></span><span>{t('مستخدمون جدد خلال الفترة','New users in period')}</span><b>{number(k?.new_users_period||0)}</b></div><div><span className="pulse-icon blue"><Bell size={17}/></span><span>{t('دعوات أسرية معلقة','Pending family invitations')}</span><b>{number(k?.pending_invitations||0)}</b></div><div><span className="pulse-icon coral"><Package size={17}/></span><span>{t('عناصر الكتالوج النشطة','Active catalog items')}</span><b>{number(k?.catalog_active||0)}</b></div><div><span className="pulse-icon purple"><UserRoundCog size={17}/></span><span>{t('موظفون نشطون','Active employees')}</span><b>{number(k?.staff_total||0)}</b></div></div><div className="pulse-foot"><span className="admin-online-dot"/>{t('المؤشرات تُقرأ مباشرة من قاعدة البيانات','Metrics read directly from the database')}</div></article>
            </section>
            <section className="admin-two-col bottom-grid">
              <article className="admin-panel"><div className="panel-heading"><div><h3>{t('أحدث المستخدمين','Recent users')}</h3><p>{t('آخر الحسابات المسجلة في النظام','Latest accounts registered')}</p></div><button className="panel-link" onClick={()=>setPage('users')}>{t('عرض الكل','View all')} <ChevronLeft size={14}/></button></div><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>{t('المستخدم','User')}</th><th>{t('النوع','Role')}</th><th>{t('الدولة','Country')}</th><th>{t('التاريخ','Date')}</th></tr></thead><tbody>{(snapshot?.recent_users||[]).map(u=><tr key={u.id}><td><div className="table-person"><span className="person-avatar">{(u.name||'N').slice(0,1)}</span><b>{u.name||t('مستخدم جديد','New user')}</b></div></td><td><span className="role-pill">{u.role==='father'?t('أب','Father'):u.role==='mother'?t('أم','Mother'):u.role}</span></td><td>{u.country||'—'}</td><td>{dateLabel(u.created_at,en)}</td></tr>)}{!snapshot?.recent_users?.length&&<tr><td colSpan={4} className="admin-empty-cell">{t('لا توجد حسابات بعد','No user accounts yet')}</td></tr>}</tbody></table></div></article>
              <article className="admin-panel"><div className="panel-heading"><div><h3>{t('الأسر المضافة حديثاً','Recently added families')}</h3><p>{t('نظرة على أحدث المساحات الأسرية','Latest family spaces')}</p></div><button className="panel-link" onClick={()=>setPage('families')}>{t('عرض الكل','View all')} <ChevronLeft size={14}/></button></div><div className="admin-family-list">{(snapshot?.recent_families||[]).map(f=><div className="admin-family-row" key={f.id}><span className="family-symbol"><Building2 size={17}/></span><div><b>{f.name||t('أسرة جديدة','New family')}</b><small><Globe2 size={12}/>{f.city} · {f.country}</small></div><time>{dateLabel(f.created_at,en)}</time></div>)}{!snapshot?.recent_families?.length&&<div className="admin-empty-cell">{t('لا توجد أسر بعد','No families yet')}</div>}</div></article>
            </section>
          </>}

          {page==='analytics' && <>
            <section className="admin-kpi-grid four">
              <MetricCard label={t('حسابات موثقة','Verified accounts')} value={analyticsSnapshot?.metrics.verified_users||0} detail={t('من إجمالي المستخدمين','Of all registered users')} icon={ShieldCheck} tone="teal"/>
              <MetricCard label={t('مستخدمون داخل أسر','Users in families')} value={analyticsSnapshot?.metrics.users_with_family||0} detail={t('حسابات مرتبطة بمساحة أسرية','Accounts linked to a family')} icon={Users} tone="blue"/>
              <MetricCard label={t('أسر لديها أطفال','Families with children')} value={analyticsSnapshot?.metrics.families_with_children||0} detail={t('من إجمالي الأسر المسجلة','Of all registered families')} icon={Baby} tone="coral"/>
              <MetricCard label={t('أسر نشطة خلال الفترة','Active families in period')} value={analyticsSnapshot?.metrics.active_families_period||0} detail={t('أسر سجلت نشاط حياة','Families with life-record activity')} icon={Activity} tone="purple"/>
            </section>
            <section className="admin-analytics-grid">
              <article className="admin-panel wide"><div className="panel-heading"><div><h3>{t('منحنى اكتساب المستخدمين','User acquisition trend')}</h3><p>{t('بيانات فعلية حسب تاريخ إنشاء الحساب','Actual account creation data')}</p></div></div><div className="chart-area tall"><ResponsiveContainer width="100%" height="100%"><AreaChart data={snapshot?.signup_series||[]}><defs><linearGradient id="analyticsGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#0284c7" stopOpacity={0.25}/><stop offset="100%" stopColor="#0284c7" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 5" vertical={false} stroke="var(--admin-border)"/><XAxis dataKey="date" tickFormatter={v=>dateLabel(v,en)} tickLine={false} axisLine={false}/><YAxis allowDecimals={false} tickLine={false} axisLine={false}/><Tooltip/><Area dataKey="count" stroke="#0284c7" strokeWidth={3} fill="url(#analyticsGradient)"/></AreaChart></ResponsiveContainer></div></article>
              <article className="admin-panel"><div className="panel-heading"><div><h3>{t('التوزيع حسب الدولة','Users by country')}</h3><p>{t('مبني على الدولة المسجلة في الحسابات','Based on registered account country')}</p></div></div><div className="chart-area tall"><ResponsiveContainer width="100%" height="100%"><BarChart data={analyticsSnapshot?.country_mix||[]} layout="vertical" margin={{left:4,right:12}}><CartesianGrid strokeDasharray="3 5" horizontal={false} stroke="var(--admin-border)"/><XAxis type="number" allowDecimals={false} hide/><YAxis type="category" dataKey="country" width={44} tickLine={false} axisLine={false}/><Tooltip/><Bar dataKey="count" name={t('المستخدمون','Users')} fill="#0d9488" radius={[0,8,8,0]}/></BarChart></ResponsiveContainer>{!analyticsSnapshot?.country_mix?.length&&<p className="admin-empty-cell">{t('لا توجد بيانات كافية','No data available')}</p>}</div></article>
              <article className="admin-panel"><div className="panel-heading"><div><h3>{t('أنواع سجلات الأطفال','Child record mix')}</h3><p>{t('توزيع السجلات المحفوظة فعلياً','Distribution of saved records')}</p></div></div><div className="chart-area donut"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={snapshot?.record_mix||[]} dataKey="count" nameKey="type" innerRadius={60} outerRadius={90} paddingAngle={3}>{(snapshot?.record_mix||[]).map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}</Pie><Tooltip formatter={(v,n,props)=>[v,recordLabel(String(props.payload.type),en)]}/></PieChart></ResponsiveContainer></div><div className="admin-legend">{(snapshot?.record_mix||[]).map((r,i)=><div key={r.type}><i style={{background:COLORS[i%COLORS.length]}}/><span>{recordLabel(r.type,en)}</span><b>{number(r.count)}</b></div>)}{!snapshot?.record_mix?.length&&<p className="admin-empty-cell">{t('ستظهر الأنواع بعد تسجيل بيانات حقيقية','Record categories appear as real data is collected')}</p>}</div></article>
              <article className="admin-panel"><div className="panel-heading"><div><h3>{t('النشاط اليومي للأسر','Daily family activity')}</h3><p>{t('عدد سجلات الحياة حسب تاريخ حدوثها','Life records by occurrence date')}</p></div></div><div className="chart-area tall"><ResponsiveContainer width="100%" height="100%"><AreaChart data={analyticsSnapshot?.activity_series||[]}><CartesianGrid strokeDasharray="3 5" vertical={false} stroke="var(--admin-border)"/><XAxis dataKey="date" tickFormatter={v=>dateLabel(v,en)} tickLine={false} axisLine={false}/><YAxis allowDecimals={false} tickLine={false} axisLine={false}/><Tooltip/><Area dataKey="count" stroke="#0d9488" fill="#0d9488" fillOpacity={0.12}/></AreaChart></ResponsiveContainer>{!analyticsSnapshot?.metrics.records_period&&<p className="admin-empty-cell">{t('لا توجد سجلات حياة خلال الفترة المحددة حتى الآن','No life records during the selected period yet')}</p>}</div></article>
              <article className="admin-panel"><div className="panel-heading"><div><h3>{t('مسار دعوات أولياء الأمور','Co-parent invitation funnel')}</h3><p>{t('الحالات المسجلة في قاعدة البيانات','Statuses recorded in the database')}</p></div></div><div className="admin-legend">{(analyticsSnapshot?.invitation_funnel||[]).map(item=><div key={item.status}><span>{item.status}</span><b>{number(item.count)}</b></div>)}{!analyticsSnapshot?.invitation_funnel?.length&&<p className="admin-empty-cell">{t('لا توجد دعوات حتى الآن','No invitations yet')}</p>}</div><div className="scale-stat"><span>{t('معدل قبول الدعوات','Invitation acceptance rate')}</span><b>{(analyticsSnapshot?.metrics.invitation_acceptance_rate||0).toFixed(1)}%</b><small>{number(analyticsSnapshot?.metrics.invitations_accepted||0)} / {number(analyticsSnapshot?.metrics.invitations_total||0)} {t('دعوة','invitations')}</small></div></article>
              <article className="admin-panel"><div className="panel-heading"><div><h3>{t('مؤشرات حجم المنصة','Platform scale')}</h3><p>{t('الوضع الحالي مقابل أهداف التوسع','Current position against scale targets')}</p></div></div><div className="scale-stat"><span>{t('الموظفون النشطون','Active employees')}</span><b>{number(k?.staff_total||0)}</b><small>{t('المرحلة الأولى: 50 موظفاً','Phase 1: 50 employees')}</small><div className="scale-track"><i style={{width:Math.min(100,((k?.staff_total||0)/50)*100)+'%'}}/></div></div><div className="scale-stat"><span>{t('المستهدف بعد 12 شهراً','12-month target')}</span><b>150</b><small>{t('إجمالي السعة المستهدفة للفريق','Total planned team capacity')}</small><div className="scale-track"><i style={{width:Math.min(100,((k?.staff_total||0)/150)*100)+'%'}}/></div></div></article>
            </section>
            {analyticsLoading&&<div className="directory-loading">{t('جارٍ تحديث التحليلات…','Refreshing analytics…')}</div>}
          </>}

          {page==='users' && <section className="admin-panel"><div className="panel-heading"><div><h3>{t('دليل المستخدمين','User directory')}</h3><p>{t('بحث مباشر في جميع الحسابات المسجلة','Search across all registered accounts')}</p></div><label className="admin-search"><Search size={16}/><input value={query} onChange={e=>{setQuery(e.target.value);setDirectoryPage(0);}} placeholder={t('ابحث بالاسم أو البريد أو الهاتف أو الأسرة…','Search name, email, phone or family…')}/></label></div><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>{t('المستخدم','User')}</th><th>{t('بيانات التواصل','Contact')}</th><th>{t('الدور','Role')}</th><th>{t('الأسرة','Family')}</th><th>{t('الدولة','Country')}</th><th>{t('التحقق','Verified')}</th><th>{t('التسجيل','Registered')}</th></tr></thead><tbody>{userRows.map(u=><tr key={u.id}><td><div className="table-person"><span className="person-avatar">{(u.name||'N').slice(0,1)}</span><button className="admin-text-action" onClick={()=>void openUserDetail(u.id)}>{u.name||'—'}</button></div></td><td><div className="directory-contact">{u.email||'—'}<small>{u.phone||'—'}</small></div></td><td><span className="role-pill">{u.role==='father'?t('أب','Father'):u.role==='mother'?t('أم','Mother'):u.role||'—'}</span></td><td>{u.family_name||t('غير مرتبط','Not linked')}</td><td>{u.country||'—'}</td><td><span className={'directory-verified '+(u.verified?'is-verified':'')}>{u.verified?t('موثق','Verified'):t('غير موثق','Unverified')}</span></td><td>{dateLabel(u.created_at,en)}</td></tr>)}{!directoryLoading&&!userRows.length&&<tr><td colSpan={7} className="admin-empty-cell">{t('لا توجد نتائج مطابقة','No matching accounts')}</td></tr>}</tbody></table>{directoryLoading&&<div className="directory-loading">{t('جارٍ تحميل البيانات…','Loading records…')}</div>}</div><div className="admin-pagination"><span>{t('إجمالي الحسابات','Total accounts')}: <b>{number(directoryTotal)}</b></span><div><button disabled={directoryPage===0||directoryLoading} onClick={()=>setDirectoryPage(p=>Math.max(0,p-1))}>{t('السابق','Previous')}</button><small>{directoryTotal?directoryPage+1:0} / {Math.max(1,Math.ceil(directoryTotal/25))}</small><button disabled={(directoryPage+1)*25>=directoryTotal||directoryLoading} onClick={()=>setDirectoryPage(p=>p+1)}>{t('التالي','Next')}</button></div></div></section>}

          {page==='families' && <section className="admin-panel"><div className="panel-heading"><div><h3>{t('دليل الأسر','Family directory')}</h3><p>{t('جميع المساحات الأسرية مع ملخص الأعضاء والأطفال والدعوات','All family workspaces with members, children and invitation summary')}</p></div><label className="admin-search"><Search size={16}/><input value={query} onChange={e=>{setQuery(e.target.value);setDirectoryPage(0);}} placeholder={t('ابحث باسم الأسرة أو المدينة أو الدولة…','Search family, city or country…')}/></label></div><div className="admin-family-grid">{familyRows.map(f=><article className="family-admin-card" key={f.id}><span className="family-symbol"><Building2 size={20}/></span><h4>{f.name||t('أسرة جديدة','New family')}</h4><p><Globe2 size={13}/>{f.city||'—'} · {f.country||'—'} · {f.currency||'—'}</p><div className="family-card-stats"><span><Users size={14}/><b>{number(f.members_count)}</b>{t('أولياء','Parents')}</span><span><Baby size={14}/><b>{number(f.children_count)}</b>{t('أطفال','Children')}</span><span><Bell size={14}/><b>{number(f.pending_invitations)}</b>{t('دعوات معلقة','Pending')}</span></div><small>{t('تاريخ الإنشاء','Created')}: {dateLabel(f.created_at,en)}</small><button className="admin-text-action family-detail-action" onClick={()=>void openFamilyDetail(f.id)}>{t('عرض تفاصيل الأسرة','View family details')} <ChevronLeft size={14}/></button></article>)}{!directoryLoading&&!familyRows.length&&<div className="admin-empty-cell">{t('لا توجد أسر مطابقة','No matching families')}</div>}</div>{directoryLoading&&<div className="directory-loading">{t('جارٍ تحميل البيانات…','Loading records…')}</div>}<div className="admin-pagination"><span>{t('إجمالي الأسر','Total families')}: <b>{number(directoryTotal)}</b></span><div><button disabled={directoryPage===0||directoryLoading} onClick={()=>setDirectoryPage(p=>Math.max(0,p-1))}>{t('السابق','Previous')}</button><small>{directoryTotal?directoryPage+1:0} / {Math.max(1,Math.ceil(directoryTotal/25))}</small><button disabled={(directoryPage+1)*25>=directoryTotal||directoryLoading} onClick={()=>setDirectoryPage(p=>p+1)}>{t('التالي','Next')}</button></div></div></section>}

          {page==='team' && <><section className="admin-kpi-grid three"><MetricCard label={t('موظفون نشطون','Active employees')} value={k?.staff_total||0} detail={t('على قوة العمل حالياً','Currently on workforce')} icon={Users} tone="teal"/><MetricCard label={t('قيد التجهيز','Planned / invited')} value={k?.staff_planned||0} detail={t('سجلات فريق قيد الإعداد','Team records being prepared')} icon={Clock3} tone="blue"/><MetricCard label={t('سعة المرحلة الأولى','Phase 1 capacity')} value={50} detail={t('هدف أول 6 شهور','First 6-month target')} icon={TrendingUp} tone="coral"/></section><section className="admin-panel"><div className="panel-heading"><div><h3>{t('هيكل فريق العمل','Workforce directory')}</h3><p>{t('إدارة الموظفين حسب الإدارات، حالات التوظيف، وخطة التوسع','Manage employees by department, employment status and scale plan')}</p></div><label className="admin-search"><Search size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder={t('ابحث بالاسم أو البريد أو الإدارة…','Search name, email or department…')}/></label><button className="admin-add-btn" onClick={()=>openStaffModal()}><Users size={15}/>{t('إضافة موظف','Add employee')}</button></div>{staffRows.length?<div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>{t('الموظف','Employee')}</th><th>{t('البريد','Email')}</th><th>{t('الإدارة','Department')}</th><th>{t('المسمى الوظيفي','Job title')}</th><th>{t('المدير المباشر','Manager')}</th><th>{t('حساب الدخول','Login account')}</th><th>{t('الدور والصلاحية','Role')}</th><th>{t('الحالة','Status')}</th><th>{t('المرحلة','Cohort')}</th><th>{t('إجراء','Action')}</th></tr></thead><tbody>{staffRows.map(s=><tr key={s.id}><td><b>{s.name}</b><small className="table-sub">{s.employee_code}</small></td><td>{s.email}</td><td>{deptLabel(s.department,en)}</td><td>{s.title||'—'}</td><td>{s.manager_name||t('بدون مدير','No manager')}</td><td><span className={'directory-verified '+(s.account_linked?'is-verified':'')}>{s.account_linked?t('مرتبط','Linked'):t('غير مرتبط','Not linked')}</span></td><td><select className="rbac-staff-role-select" value={rbacSnapshot?.staff.find(x=>x.id===s.id)?.role_key||'employee'} onChange={e=>void saveStaffRole(s.id,e.target.value)}>{(rbacSnapshot?.roles||[]).filter(r=>r.role_key!=='super_admin').map(r=><option key={r.role_key} value={r.role_key}>{r.display_name}</option>)}</select></td><td><span className={'status-pill '+s.status}>{s.status}</span></td><td>{s.cohort==='first_50'?t('أول 50','First 50'):t('حتى 150','Next 150')}</td><td><div className="catalog-actions"><button className="admin-edit-btn" onClick={()=>openStaffModal(s)}>{t('تعديل','Edit')}</button><button className="admin-edit-btn" disabled={!s.account_linked} onClick={()=>{const rbacStaff=rbacSnapshot?.staff.find(x=>x.id===s.id);if(rbacStaff){setOverrideStaff(rbacStaff);setOverridePermission(rbacSnapshot?.permissions[0]?.permission_key||'dashboard.view');setOverrideEffect('inherit');}}}>{t('استثناءات','Overrides')}</button></div></td></tr>)}</tbody></table></div>:<div className="team-empty"><div className="team-empty-icon"><UserRoundCog size={28}/></div><h3>{t('مساحة فريقك جاهزة للنمو','Your workforce space is ready to grow')}</h3><p>{t('ابدأ بإضافة أعضاء الفريق وتحديد الإدارة والمسمى الوظيفي وحالة التوظيف. يمكن ربط حساب الدخول لاحقاً عند تفعيل دعوات البريد.','Add team members and assign departments, job titles and employment status. Login accounts can be linked later when email invitations are enabled.')}</p><button className="admin-add-btn centered" onClick={()=>openStaffModal()}><Users size={15}/>{t('إضافة أول موظف','Add first employee')}</button><div className="team-targets"><span><b>50</b>{t('موظفاً · أول 6 شهور','employees · first 6 months')}</span><span><b>150</b>{t('موظفاً · خلال 12 شهراً','employees · by month 12')}</span></div></div>}</section>
          <section className="admin-panel rbac-panel"><div className="panel-heading"><div><h3>{t('الأدوار ومصفوفة الصلاحيات','Roles & permission matrix')}</h3><p>{t('تحكم في صلاحيات كل دور، ثم عيّن الدور المناسب لكل موظف. صلاحيات Super Admin محمية ولا يمكن تعديلها من هذه الشاشة.','Configure each role and assign it to staff. Super Admin permissions are protected.')}</p></div><div className="rbac-role-toolbar"><select value={selectedRbacRole} onChange={e=>setSelectedRbacRole(e.target.value)}>{(rbacSnapshot?.roles||[]).map(r=><option key={r.role_key} value={r.role_key}>{r.display_name}</option>)}</select><button className="admin-primary-btn" disabled={rbacLoading||rbacSaving||selectedRbacRole==='super_admin'} onClick={()=>void saveRolePermissions()}>{rbacSaving?t('جارٍ الحفظ…','Saving…'):t('حفظ صلاحيات الدور','Save role permissions')}</button></div></div>{rbacLoading?<div className="directory-loading">{t('جارٍ تحميل مصفوفة الصلاحيات…','Loading permission matrix…')}</div>:<><div className="rbac-summary"><span>{number(rbacSnapshot?.roles.length||0)} {t('أدوار','roles')}</span><span>{number(rbacSnapshot?.permissions.length||0)} {t('صلاحية','permissions')}</span><span>{number(rbacSnapshot?.staff.filter(x=>x.account_linked).length||0)} {t('حساب موظف مرتبط','linked staff accounts')}</span></div><div className="rbac-permission-grid">{(rbacSnapshot?.permissions||[]).map(p=><label className="rbac-permission" key={p.permission_key}><input type="checkbox" checked={selectedPermissionKeys.includes(p.permission_key)} disabled={selectedRbacRole==='super_admin'} onChange={e=>setSelectedPermissionKeys(v=>e.target.checked?[...v,p.permission_key]:v.filter(x=>x!==p.permission_key))}/><span><b>{p.permission_key}</b><small>{p.description}</small></span><em>{p.area}</em></label>)}</div>{selectedRbacRole==='super_admin'&&<p className="rbac-protected-note">{t('دور المالك محمي بالكامل. لا يمكن تغيير صلاحياته أو إسناده للموظفين.','The owner role is protected and cannot be edited or assigned to staff.')}</p>}</>}</section></>}

          {page==='store' && <>
            <section className="admin-kpi-grid four">
              <MetricCard label={t('الشركاء التجاريون','Business partners')} value={b2bStore?.metrics.partners_total||0} detail={t('موردون وموزعون وعملاء شركات','Suppliers, distributors and corporate buyers')} icon={Handshake} tone="teal"/>
              <MetricCard label={t('شركاء نشطون','Active partners')} value={b2bStore?.metrics.partners_active||0} detail={t('حسابات تجارية معتمدة','Approved business accounts')} icon={Building2} tone="blue"/>
              <MetricCard label={t('مخزون منخفض','Low stock')} value={b2bStore?.metrics.products_low_stock||0} detail={t('وصل إلى حد إعادة الطلب','At reorder threshold')} icon={Boxes} tone="coral"/>
              <MetricCard label={t('طلبات مفتوحة','Open orders')} value={b2bStore?.metrics.orders_open||0} detail={t('طلبات تحتاج متابعة تشغيلية','Orders requiring operations follow-up')} icon={ShoppingCart} tone="purple"/>
            </section>
            <section className="admin-panel b2b-store-panel">
              <div className="panel-heading"><div><h3>{t('إدارة المتجر والعلاقات التجارية','B2B Store & Trade Operations')}</h3><p>{t('إدارة الموردين والشركاء والمنتجات التجارية وطلبات الشركات من مركز واحد.','Manage suppliers, partners, trade products and corporate orders in one place.')}</p></div><div className="catalog-heading-actions"><label className="admin-search"><Search size={16}/><input value={query} onChange={e=>{setQuery(e.target.value);setDirectoryPage(0);}} placeholder={t('ابحث في الشركاء والمنتجات…','Search partners and products…')}/></label>{storeTab!=='orders'?<button className="admin-add-btn" onClick={()=>openStoreModal(storeTab==='partners'?'partner':'product')}>{storeTab==='partners'?<Handshake size={15}/>:<Package size={15}/>} {storeTab==='partners'?t('إضافة شريك','Add partner'):t('إضافة منتج','Add product')}</button>:<button className="admin-add-btn" onClick={()=>{setOrderModalOpen(true);setOrderBuyerId('');setOrderLines([{productId:'',quantity:'1'}]);}}><ShoppingCart size={15}/>{t('إنشاء طلب B2B','Create B2B order')}</button>}</div></div>
              <div className="b2b-tabs"><button className={storeTab==='partners'?'active':''} onClick={()=>{setStoreTab('partners');setDirectoryPage(0);}}><Handshake size={15}/>{t('الشركاء والموردون','Partners & suppliers')} <b>{number(b2bStore?.metrics.partners_total||0)}</b></button><button className={storeTab==='products'?'active':''} onClick={()=>{setStoreTab('products');setDirectoryPage(0);}}><Boxes size={15}/>{t('منتجات الجملة','Wholesale products')} <b>{number(b2bStore?.metrics.products_total||0)}</b></button><button className={storeTab==='orders'?'active':''} onClick={()=>setStoreTab('orders')}><ShoppingCart size={15}/>{t('الطلبات والعروض','Orders & quotes')} <b>{number(b2bStore?.metrics.orders_total||0)}</b></button></div>
              {storeTab==='partners'&&<div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>{t('الشريك','Partner')}</th><th>{t('النوع','Type')}</th><th>{t('جهة التواصل','Contact')}</th><th>{t('السوق','Market')}</th><th>{t('شروط الدفع','Payment terms')}</th><th>{t('الحالة','Status')}</th><th>{t('إجراء','Action')}</th></tr></thead><tbody>{(b2bStore?.partners||[]).map(p=><tr key={p.id}><td><b>{p.display_name}</b><small className="table-sub">{p.partner_code} · {p.legal_name}</small></td><td>{p.partner_type}</td><td><span className="directory-contact">{p.contact_name||'—'}<small>{p.email||p.phone||'—'}</small></span></td><td>{p.city||'—'} · {p.country}</td><td>{p.payment_terms_days} {t('يوم','days')} · {p.currency} {number(p.credit_limit)}</td><td><span className={'status-pill '+p.status}>{p.status}</span></td><td><button className="admin-edit-btn" onClick={()=>openStoreModal('partner',p)}>{t('تعديل','Edit')}</button></td></tr>)}{!directoryLoading&&!(b2bStore?.partners||[]).length&&<tr><td colSpan={7} className="admin-empty-cell">{t('لا يوجد شركاء تجاريون بعد. أضف أول مورد أو عميل شركات.','No business partners yet. Add your first supplier or corporate buyer.')}</td></tr>}</tbody></table></div>}
              {storeTab==='products'&&<div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>{t('المنتج','Product')}</th><th>SKU</th><th>{t('المورد','Supplier')}</th><th>{t('الحد الأدنى','MOQ')}</th><th>{t('تكلفة / جملة / تجزئة','Cost / Wholesale / Retail')}</th><th>{t('المخزون','Stock')}</th><th>{t('الحالة','Status')}</th><th>{t('إجراء','Action')}</th></tr></thead><tbody>{(b2bStore?.products||[]).map(p=><tr key={p.id}><td><b>{p.name_ar}</b><small className="table-sub">{p.name_en||p.category}</small></td><td><code>{p.sku}</code></td><td>{p.partner_name}</td><td>{number(p.min_order_qty)} {p.unit}</td><td><span className="catalog-price">{number(p.cost_price)} / {number(p.wholesale_price)} / {number(p.retail_price)} {p.currency}</span><small className="table-sub">{t('ضريبة','Tax')} {p.tax_rate}% · {p.price_tiers?.length||0} {t('شرائح كمية','volume tiers')}</small></td><td>{p.stock_qty===null?t('غير محدد','Not tracked'):<><b>{number(p.stock_qty-p.reserved_qty)} {t('متاح','available')}</b><small className="table-sub">{t('إجمالي','On hand')}: {number(p.stock_qty)} · {t('محجوز','Reserved')}: {number(p.reserved_qty)}</small>{p.stock_qty-p.reserved_qty<=p.reorder_level&&<small className="stock-warning">{t('عند حد إعادة الطلب','At reorder threshold')}</small>}</>}</td><td><span className={'status-pill '+p.status}>{p.status}</span></td><td><div className="catalog-actions"><button className="admin-edit-btn" onClick={()=>openStoreModal('product',p)}>{t('تعديل','Edit')}</button><button className="admin-edit-btn" onClick={()=>void openInventoryHistory(p)}><History size={12}/>{t('حركة المخزون','Stock history')}</button></div></td></tr>)}{!directoryLoading&&!(b2bStore?.products||[]).length&&<tr><td colSpan={8} className="admin-empty-cell">{t('لا توجد منتجات B2B بعد. أضف منتجًا واربطه بمورد عند الحاجة.','No B2B products yet. Add a product and link a supplier when needed.')}</td></tr>}</tbody></table></div>}
              {storeTab==='orders'&&<><div className="b2b-order-summary"><div><span>{t('عروض الأسعار المعلقة','Pending quotes')}</span><b>{number(b2bStore?.metrics.quotes_pending||0)}</b></div><div><span>{t('فواتير غير مسددة','Unpaid invoices')}</span><b>{number(b2bStore?.metrics.invoices_unpaid||0)}</b></div><div><span>{t('إجمالي عروض الأسعار','All quotes')}</span><b>{number(b2bStore?.quotes_total||0)}</b></div><div><span>{t('إجمالي الفواتير','All invoices')}</span><b>{number(b2bStore?.invoices_total||0)}</b></div></div><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>{t('رقم الطلب','Order')}</th><th>{t('العميل التجاري','Business buyer')}</th><th>{t('تاريخ الطلب','Date')}</th><th>{t('التسليم المتوقع','Requested delivery')}</th><th>{t('الإجمالي','Total')}</th><th>{t('الحالة','Status')}</th><th>{t('المستندات','Documents')}</th></tr></thead><tbody>{(b2bStore?.orders||[]).map(o=><tr key={o.id}><td><code>{o.order_no}</code></td><td>{o.buyer_name}</td><td>{dateLabel(o.created_at,en)}</td><td>{o.requested_delivery_date||'—'}</td><td>{number(o.total)} {o.currency}</td><td><select className="b2b-order-status-select" defaultValue={o.status} onChange={e=>void updateB2BOrderStatus(o.id,e.target.value)}><option value={o.status}>{o.status}</option>{(({inquiry:['quote_sent','cancelled'],quote_sent:['approved','cancelled'],approved:['processing','cancelled'],processing:['shipped','cancelled'],shipped:['delivered']} as Record<string,string[]>)[o.status]||[]).map(next=><option key={next} value={next}>{next}</option>)}</select></td><td><div className="catalog-actions">{['inquiry','quote_sent'].includes(o.status)&&<button className="admin-edit-btn" onClick={()=>{setDocumentModal({kind:'quote',order:o});setDocumentDate('');setDocumentTerms('');}}>{t('عرض سعر','Quote')}</button>}{['approved','processing','shipped','delivered'].includes(o.status)&&<button className="admin-edit-btn" onClick={()=>{setDocumentModal({kind:'invoice',order:o});setDocumentDate('');setDocumentTerms('');}}>{t('فاتورة','Invoice')}</button>}</div></td></tr>)}{!(b2bStore?.orders||[]).length&&<tr><td colSpan={7} className="admin-empty-cell">{t('لا توجد طلبات شركات حتى الآن. ستظهر هنا الاستفسارات والطلبات وعروض الأسعار والفواتير بمجرد بدء التعاملات.','No corporate orders yet. Inquiries, orders, quotes and invoices will appear here as trade activity begins.')}</td></tr>}</tbody></table></div>
                <div className="b2b-document-grid">
                  <section className="b2b-document-card"><div className="panel-heading"><div><h3>{t('عروض الأسعار','Quotations')}</h3><p>{t('متابعة حالة العرض وصلاحيته','Track quote status and validity')}</p></div></div><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>{t('العرض','Quote')}</th><th>{t('العميل','Buyer')}</th><th>{t('الإجمالي','Total')}</th><th>{t('الصلاحية','Valid until')}</th><th>{t('الحالة','Status')}</th></tr></thead><tbody>{(b2bStore?.quotes||[]).map(q=><tr key={q.id}><td><b>{q.quote_no}</b><small className="table-sub">{q.order_no}</small></td><td>{q.buyer_name}</td><td>{number(q.total)}</td><td>{q.valid_until||'—'}</td><td><select className="b2b-order-status-select" value={q.status} onChange={e=>void updateB2BDocumentStatus('quote',q.id,e.target.value)}>{['draft','sent','accepted','rejected','expired'].map(s=><option key={s}>{s}</option>)}</select></td></tr>)}{!b2bStore?.quotes?.length&&<tr><td colSpan={5} className="admin-empty-cell">{t('لا توجد عروض أسعار بعد.','No quotations yet.')}</td></tr>}</tbody></table></div></section>
                  <section className="b2b-document-card"><div className="panel-heading"><div><h3>{t('الفواتير والتحصيل','Invoices & collections')}</h3><p>{t('متابعة المستحقات وحالة الفاتورة','Track receivables and invoice status')}</p></div></div><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>{t('الفاتورة','Invoice')}</th><th>{t('العميل','Buyer')}</th><th>{t('الإجمالي','Total')}</th><th>{t('المسدد','Paid')}</th><th>{t('المتبقي','Balance')}</th><th>{t('الحالة','Status')}</th></tr></thead><tbody>{(b2bStore?.invoices||[]).map(i=><tr key={i.id}><td><b>{i.invoice_no}</b><small className="table-sub">{i.order_no}</small></td><td>{i.buyer_name}</td><td>{number(i.total)} {i.currency}</td><td>{number(i.amount_paid)} {i.currency}</td><td>{number(i.balance_due)} {i.currency}</td><td><div className="catalog-actions"><select className="b2b-order-status-select" value={i.status} onChange={e=>void updateB2BDocumentStatus('invoice',i.id,e.target.value)}>{['draft','issued','overdue','void'].map(s=><option key={s}>{s}</option>)}</select>{i.status!=='draft'&&i.status!=='void'&&i.balance_due>0&&<button className="admin-edit-btn" onClick={()=>{setPaymentInvoice(i);setPaymentAmount(String(i.balance_due));setPaymentNote('');}}><CreditCard size={12}/>{t('تسجيل دفعة','Record payment')}</button>}</div></td></tr>)}{!b2bStore?.invoices?.length&&<tr><td colSpan={6} className="admin-empty-cell">{t('لا توجد فواتير بعد.','No invoices yet.')}</td></tr>}</tbody></table></div></section>
                </div></>}
              {directoryLoading&&<div className="directory-loading">{t('جارٍ تحديث بيانات المتجر…','Loading store data…')}</div>}
            </section>
          </>}

          {page==='access'&&<div className="rbac-layout">
  <section className="admin-panel"><div className="panel-heading"><div><h3>{t('مصفوفة الأدوار والصلاحيات','Role permission matrix')}</h3><p>{t('حدد ما يستطيع كل دور رؤيته أو إدارته. صلاحيات المالك الكاملة ثابتة ولا يمكن منحها لدور آخر.','Define what each role can view or manage. Owner-level access is fixed and cannot be assigned to another role.')}</p></div></div>
    {rbacLoading?<div className="directory-loading">{t('جارٍ تحميل إعدادات الوصول…','Loading access configuration…')}</div>:<>
      <div className="rbac-role-picker"><label>{t('الدور','Role')}<select value={rbacRoleKey} onChange={e=>setRbacRoleKey(e.target.value)}>{(rbacSnapshot?.roles||[]).filter(r=>r.role_key!=='super_admin').map(r=><option key={r.role_key} value={r.role_key}>{r.display_name} · {r.role_key}</option>)}</select></label><p>{rbacSnapshot?.roles.find(r=>r.role_key===rbacRoleKey)?.description||''}</p></div>
      <div className="rbac-permission-grid">{(rbacSnapshot?.permissions||[]).map(p=><label className="rbac-permission-item" key={p.permission_key}><input type="checkbox" checked={rbacPermissionDraft.includes(p.permission_key)} onChange={e=>setRbacPermissionDraft(v=>e.target.checked?[...v,p.permission_key]:v.filter(x=>x!==p.permission_key))}/><span><b>{p.permission_key}</b><small>{p.description}</small></span><caption>{p.area}</caption></label>)}</div>
      <div className="admin-modal-actions"><span className="rbac-selected-count">{rbacPermissionDraft.length} {t('صلاحية محددة','permissions selected')}</span><button className="admin-primary-btn" disabled={rbacSaving||rbacRoleKey==='super_admin'} onClick={()=>void saveRolePermissions()}>{rbacSaving?t('جارٍ الحفظ…','Saving…'):t('حفظ صلاحيات الدور','Save role permissions')}</button></div>
    </>}
  </section>
  <section className="admin-panel"><div className="panel-heading"><div><h3>{t('تعيين أدوار الموظفين','Assign staff roles')}</h3><p>{t('اربط كل موظف بالدور المناسب. حساب الموظف لا يحصل على دخول إداري قبل ربطه وتفعيل حسابه.','Assign each employee an appropriate role. No staff account receives admin access until linked and activated.')}</p></div></div>
    <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>{t('الموظف','Staff member')}</th><th>{t('الإدارة','Department')}</th><th>{t('حساب الدخول','Account')}</th><th>{t('الدور الحالي','Current role')}</th><th>{t('تعيين الدور','Assign role')}</th></tr></thead><tbody>{(rbacSnapshot?.staff||[]).map(s=><tr key={s.id}><td><b>{s.name}</b><small className="table-sub">{s.employee_code} · {s.email}</small></td><td>{deptLabel(s.department,en)}</td><td><span className={'directory-verified '+(s.account_linked?'is-verified':'')}>{s.account_linked?t('مرتبط','Linked'):t('غير مرتبط','Not linked')}</span></td><td>{s.role_key}</td><td><select className="rbac-role-select" value={s.role_key} onChange={e=>void assignStaffRole(s.id,e.target.value)}>{(rbacSnapshot?.roles||[]).filter(r=>r.role_key!=='super_admin').map(r=><option key={r.role_key} value={r.role_key}>{r.display_name}</option>)}</select></td></tr>)}{!rbacSnapshot?.staff.length&&<tr><td colSpan={5} className="admin-empty-cell">{t('أضف الموظفين من صفحة فريق العمل، ثم ارجع لتعيين أدوارهم.','Add employees in Team & Workforce, then return here to assign their roles.')}</td></tr>}</tbody></table></div>
  </section>
  <section className="admin-panel"><div className="panel-heading"><div><h3>{t('استثناءات الصلاحيات الفردية','Individual permission overrides')}</h3><p>{t('امنح أو امنع صلاحية لموظف بعينه دون تغيير صلاحيات بقية أصحاب الدور.','Grant or deny one permission for a specific employee without changing the role for everyone else.')}</p></div></div>
    <div className="rbac-override-form"><label>{t('الموظف المرتبط بحساب','Linked staff account')}<select value={rbacStaffId} onChange={e=>setRbacStaffId(e.target.value)}><option value="">{t('اختر موظفاً','Select staff')}</option>{(rbacSnapshot?.staff||[]).filter(s=>s.account_linked).map(s=><option key={s.id} value={s.id}>{s.name} · {s.employee_code}</option>)}</select></label><label>{t('الصلاحية','Permission')}<select value={rbacPermissionKey} onChange={e=>setRbacPermissionKey(e.target.value)}><option value="">{t('اختر صلاحية','Select permission')}</option>{(rbacSnapshot?.permissions||[]).map(p=><option key={p.permission_key} value={p.permission_key}>{p.permission_key}</option>)}</select></label><label>{t('التأثير','Effect')}<select value={rbacEffect} onChange={e=>setRbacEffect(e.target.value as 'grant'|'deny'|'inherit')}><option value="grant">{t('منح','Grant')}</option><option value="deny">{t('منع','Deny')}</option><option value="inherit">{t('العودة للدور','Inherit from role')}</option></select></label><button className="admin-primary-btn" disabled={rbacSaving||!rbacStaffId||!rbacPermissionKey} onClick={()=>void saveStaffOverride()}>{t('حفظ الاستثناء','Save override')}</button></div>
    <div className="rbac-override-list">{(rbacSnapshot?.overrides||[]).map(o=><div key={o.auth_user_id+o.permission_key}><b>{o.staff_name||o.auth_user_id}</b><span>{o.permission_key}</span><badge color={o.effect==='deny'?'danger':'success'}>{o.effect}</badge></div>)}{!rbacSnapshot?.overrides.length&&<p className="admin-empty-cell">{t('لا توجد استثناءات فردية حالياً.','No individual overrides configured.')}</p>}</div>
  </section>
</div>}

          {page==='content' && <><section className="admin-kpi-grid embedded"><MetricCard label={t('عناصر الكتالوج النشطة','Published catalog items')} value={k?.catalog_active||0} detail={t('عناصر ظاهرة في التطبيق','Items visible in the app')} icon={Package} tone="teal"/><MetricCard label={t('سجلات حياة الأطفال','Child life records')} value={k?.child_records_total||0} detail={t('محتوى أنشأته الأسر','Family-created records')} icon={ClipboardList} tone="blue"/></section><section className="admin-panel"><div className="panel-heading"><div><h3>{t('إدارة المحتوى والخدمات','Content & services management')}</h3><p>{t('إدارة عناصر الكتالوج الفعلية مع النشر والإيقاف وسجل تدقيق لكل تعديل','Manage live catalog items, publishing and changes with audit logging')}</p></div><div className="catalog-heading-actions"><label className="admin-search"><Search size={16}/><input value={query} onChange={e=>{setQuery(e.target.value);setDirectoryPage(0);}} placeholder={t('ابحث بالاسم أو الكود أو التصنيف…','Search title, code or category…')}/></label><button className="admin-add-btn" onClick={()=>openCatalogModal()}><Package size={15}/>{t('إضافة عنصر','Add item')}</button></div></div><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>{t('العنصر','Item')}</th><th>{t('الكود','Code')}</th><th>{t('النوع','Type')}</th><th>{t('التصنيف','Category')}</th><th>{t('الدولة / المدينة','Market')}</th><th>{t('السعر EGP / SAR','Price EGP / SAR')}</th><th>{t('النشر','Publishing')}</th><th>{t('إجراءات','Actions')}</th></tr></thead><tbody>{catalogRows.map(item=><tr key={item.id}><td><div className="catalog-item-name"><span>{item.emoji||'📦'}</span><div><b>{item.title||item.name}</b><small>{item.name_en||'—'}</small></div></div></td><td><code>{item.code}</code></td><td>{item.item_type||item.kind}</td><td>{item.category_label||item.category}</td><td>{item.country||'ALL'} · {item.city||'—'}</td><td><span className="catalog-price">{number(Number(item.price_egp||0))} / {number(Number(item.price_sar||0))}</span></td><td><span className={'directory-verified '+(item.is_active?'is-verified':'')}>{item.is_active?t('منشور','Published'):t('متوقف','Unpublished')}</span></td><td><div className="catalog-actions"><button className="admin-edit-btn" onClick={()=>openCatalogModal(item)}>{t('تعديل','Edit')}</button><button className="admin-edit-btn" onClick={()=>void toggleCatalogStatus(item)}>{item.is_active?t('إيقاف','Unpublish'):t('نشر','Publish')}</button></div></td></tr>)}{!directoryLoading&&!catalogRows.length&&<tr><td colSpan={8} className="admin-empty-cell">{t('لا توجد عناصر كتالوج حتى الآن. أضف أول منتج أو خدمة من هنا.','No catalog items yet. Add the first product or service here.')}</td></tr>}</tbody></table>{directoryLoading&&<div className="directory-loading">{t('جارٍ تحميل الكتالوج…','Loading catalog…')}</div>}</div><div className="admin-pagination"><span>{t('إجمالي العناصر','Total items')}: <b>{number(directoryTotal)}</b></span><div><button disabled={directoryPage===0||directoryLoading} onClick={()=>setDirectoryPage(p=>Math.max(0,p-1))}>{t('السابق','Previous')}</button><small>{directoryTotal?directoryPage+1:0} / {Math.max(1,Math.ceil(directoryTotal/25))}</small><button disabled={(directoryPage+1)*25>=directoryTotal||directoryLoading} onClick={()=>setDirectoryPage(p=>p+1)}>{t('التالي','Next')}</button></div></div></section></>}

          {page==='security' && <section className="admin-security-layout"><article className="admin-panel"><div className="panel-heading"><div><h3>{t('سجل إجراءات الإدارة','Administrative audit trail')}</h3><p>{t('سجل كامل قابل للبحث، مع هوية المنفذ والهدف والتوقيت','Searchable audit history with actor, target and timestamp')}</p></div><label className="admin-search"><Search size={16}/><input value={query} onChange={e=>{setQuery(e.target.value);setDirectoryPage(0);}} placeholder={t('ابحث بالإجراء أو الموظف أو الهدف…','Search action, actor or target…')}/></label></div><div className="audit-table-list">{auditRows.map(event=><div className="audit-row" key={event.id}><span><ShieldCheck size={16}/></span><div className="audit-event-main"><b>{event.action}</b><small>{event.actor_email||t('حساب إداري','Admin account')} · {event.target_type||'—'} · {event.target_id||'—'}</small></div><time>{new Date(event.created_at).toLocaleString(en?'en-US':'ar-SA',{dateStyle:'medium',timeStyle:'short'})}</time></div>)}{!directoryLoading&&!auditRows.length&&<div className="team-empty compact"><div className="team-empty-icon"><ShieldCheck size={25}/></div><h3>{t('لا توجد إجراءات مسجلة','No audit events yet')}</h3><p>{t('كل إضافة أو تعديل إداري جديد سيظهر هنا تلقائياً. سجل التدقيق غير قابل للتعديل أو الحذف.','New administrative changes appear here automatically. Audit records cannot be edited or deleted.')}</p></div>}{directoryLoading&&<div className="directory-loading">{t('جارٍ تحميل سجل التدقيق…','Loading audit events…')}</div>}</div><div className="admin-pagination"><span>{t('إجمالي الإجراءات','Total events')}: <b>{number(directoryTotal)}</b></span><div><button disabled={directoryPage===0||directoryLoading} onClick={()=>setDirectoryPage(p=>Math.max(0,p-1))}>{t('السابق','Previous')}</button><small>{directoryTotal?directoryPage+1:0} / {Math.max(1,Math.ceil(directoryTotal/25))}</small><button disabled={(directoryPage+1)*25>=directoryTotal||directoryLoading} onClick={()=>setDirectoryPage(p=>p+1)}>{t('التالي','Next')}</button></div></div></article><article className="admin-panel"><div className="panel-heading"><div><h3>{t('حالة الحماية','Security posture')}</h3><p>{t('ضوابط الوصول الأساسية','Core access controls')}</p></div></div><div className="security-check"><CheckCircle2/><div><b>{t('التحقق من صلاحية Super Admin','Super Admin verification')}</b><small>{t('يتم من قاعدة البيانات عند كل جلسة','Verified from database each session')}</small></div><span>{t('مفعل','Active')}</span></div><div className="security-check"><LockKeyhole/><div><b>{t('مخطط الإدارة خاص','Private admin schema')}</b><small>{t('غير مكشوف مباشرة للمتصفح','Not directly exposed to browser')}</small></div><span>{t('مفعل','Active')}</span></div><div className="security-check"><FileText/><div><b>{t('سجل التدقيق غير قابل للتعديل','Append-only audit log')}</b><small>{t('منع UPDATE و DELETE على السجل','UPDATE and DELETE blocked')}</small></div><span>{t('مفعل','Active')}</span></div><div className="security-advisory"><b>{t('ملاحظة أمنية','Security note')}</b><p>{t('وظائف الإدارة تعمل بصلاحية مرتفعة داخل قاعدة البيانات، لكنها تتحقق من هوية المالك ودوره قبل أي قراءة أو تعديل. تنبيهات الفحص الآلي لهذه الوظائف تُراجع مع هذا الشرط الأمني، ولا تعني وحدها وجود وصول غير مصرح به.','Admin RPCs run with elevated database privileges but verify the owner identity and role before any read or write. Automated linter warnings are assessed alongside these authorization checks and do not alone indicate unauthorized access.')}</p></div></article></section>}

          {page==='settings' && <section className="admin-panel"><div className="panel-heading"><div><h3>{t('إعدادات المنصة','Platform settings')}</h3><p>{t('التهيئة العامة ومفاتيح التحكم ستدار تدريجياً من هنا','Platform-wide configuration and controls will be managed here in stages')}</p></div></div><div className="settings-placeholder"><Settings2 size={28}/><h3>{t('طبقة إعدادات المنصة','Platform configuration layer')}</h3><p>{t('تم فصل لوحة الإدارة عن واجهة الأسرة وتأمين دخولها. سنضيف إعدادات الخصائص، الخطط والاشتراكات، حدود الاستخدام، مزودي الذكاء الاصطناعي، والتنبيهات بعد استكمال واجهات الإدارة وربط كل إجراء بتسجيل تدقيق.','The admin portal is separated from the family app and access is secured. Feature flags, plans, subscriptions, usage limits, AI providers and notifications will be added after their workflows are implemented with audit logging.')}</p></div></section>}

          <footer className="admin-footer"><span>© 2026 NEKBAAR · {t('مساحة تجمعنا.. وبحبهم نكبر','A space that brings us together, where love helps us grow')}</span><span><span className="admin-online-dot"/> {t('بيانات الإنتاج','Production data')}</span></footer>
        </main>
      </div>
      {detailModalOpen&&<div className="admin-modal-backdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)closeDetailModal();}}><section className="admin-staff-modal admin-detail-modal"><div className="admin-modal-head"><div><span className="admin-modal-kicker">{t('ملف الإدارة','ADMIN PROFILE')}</span><h2>{detailLoading?t('جارٍ تحميل التفاصيل…','Loading details…'):userDetail?.user.name||familyDetail?.name||t('تفاصيل السجل','Record details')}</h2><p>{t('عرض آمن للبيانات المرتبطة دون كشف مفاتيح الدعوات أو تفاصيل السجلات الخاصة.','A secure view of linked data without exposing invitation tokens or private record contents.')}</p></div><button type="button" className="admin-icon-btn" onClick={closeDetailModal}><X size={17}/></button></div>{detailLoading?<div className="directory-loading">{t('جارٍ تحميل الملف…','Loading profile…')}</div>:<div className="admin-detail-body">{userDetail&&<section className="admin-detail-section"><h3>{t('بيانات المستخدم','User information')}</h3><div className="admin-detail-grid"><div><small>{t('الاسم','Name')}</small><b>{userDetail.user.name}</b></div><div><small>{t('البريد الإلكتروني','Email')}</small><b>{userDetail.user.email||'—'}</b></div><div><small>{t('الهاتف','Phone')}</small><b>{userDetail.user.phone||'—'}</b></div><div><small>{t('الدور','Role')}</small><b>{userDetail.user.role||'—'}</b></div><div><small>{t('الدولة','Country')}</small><b>{userDetail.user.country||'—'}</b></div><div><small>{t('حالة التحقق','Verification')}</small><b>{userDetail.user.verified?t('موثق','Verified'):t('غير موثق','Unverified')}</b></div><div><small>{t('حساب الدخول','Auth account')}</small><b>{userDetail.user.auth_linked?t('مرتبط','Linked'):t('غير مرتبط','Not linked')}</b></div><div><small>{t('تاريخ التسجيل','Registered')}</small><b>{new Date(userDetail.user.created_at).toLocaleString(en?'en-US':'ar-SA')}</b></div></div></section>}{(userDetail?.family||familyDetail)&&(()=>{const f=userDetail?.family||familyDetail!;return <><section className="admin-detail-section"><h3>{t('المساحة الأسرية','Family workspace')}</h3><div className="admin-detail-grid"><div><small>{t('اسم الأسرة','Family name')}</small><b>{f.name}</b></div><div><small>{t('الموقع','Location')}</small><b>{f.city} · {f.country}</b></div><div><small>{t('العملة','Currency')}</small><b>{f.currency}</b></div><div><small>{t('ولي الأمر النشط','Active parent')}</small><b>{f.active_parent}</b></div><div><small>{t('تاريخ الإنشاء','Created')}</small><b>{dateLabel(f.created_at,en)}</b></div></div></section><section className="admin-detail-section"><h3>{t('أولياء الأمور','Parents')} · {f.members.length}</h3><div className="admin-detail-list">{f.members.map(m=><div key={m.id}><b>{m.name}</b><small>{m.role||'—'} · {m.email||'—'} · {m.phone||'—'}</small><span>{m.verified?t('موثق','Verified'):t('غير موثق','Unverified')}</span></div>)}{!f.members.length&&<small>{t('لا يوجد أعضاء مرتبطون','No linked members')}</small>}</div></section><section className="admin-detail-section"><h3>{t('ملفات الأطفال','Child profiles')} · {f.children.length}</h3><div className="admin-detail-children">{f.children.map(ch=><article key={ch.id}><span>{ch.emoji||'🧒'}</span><div><b>{ch.name}</b><small>{ch.age_stage} · {ch.gender||'—'} · {ch.birth||'—'}</small><small>{t('الاهتمامات','Interests')}: {ch.interests||ch.passions_or_heroes||'—'}</small><small>{t('سجلات الحياة','Life records')}: {number(ch.life_records_count)} · {ch.last_record_at?dateLabel(ch.last_record_at,en):'—'}</small><small>{ch.growth_height_cm?`${ch.growth_height_cm} cm`:''}{ch.growth_weight_kg?` · ${ch.growth_weight_kg} kg`:''}</small></div></article>)}{!f.children.length&&<small>{t('لا توجد ملفات أطفال','No child profiles')}</small>}</div></section><section className="admin-detail-section"><h3>{t('سجل أنواع الحياة','Life record summary')}</h3><div className="admin-detail-chips">{f.record_summary.map(r=><span key={r.type}>{recordLabel(r.type,en)} · {number(r.count)}</span>)}{!f.record_summary.length&&<small>{t('لا توجد سجلات حتى الآن','No life records yet')}</small>}</div></section><section className="admin-detail-section"><h3>{t('الدعوات الأسرية','Family invitations')} · {f.invitations.length}</h3><div className="admin-detail-list">{f.invitations.map(inv=><div key={inv.id}><b>{inv.partner_name}</b><small>{inv.partner_email} · {inv.partner_phone} · {inv.partner_role}</small><span>{inv.status}{inv.verified?' · '+t('موثق','Verified'):''}</span></div>)}{!f.invitations.length&&<small>{t('لا توجد دعوات','No invitations')}</small>}</div></section></>;})()}</div>}<div className="admin-modal-actions"><button className="admin-primary-btn" type="button" onClick={closeDetailModal}>{t('إغلاق','Close')}</button></div></section></div>}
      {staffModal&&<div className="admin-modal-backdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setStaffModal(false);}}><form className="admin-staff-modal" onSubmit={saveStaff}><div className="admin-modal-head"><div><span className="admin-modal-kicker">{t('إدارة الفريق','WORKFORCE')}</span><h2>{editingStaffId?t('تعديل بيانات الموظف','Edit employee'):t('إضافة موظف جديد','Add a new employee')}</h2><p>{t('سجّل بيانات الموظف الأساسية وحدد مكانه في الهيكل.','Enter employee details and assign their place in the organization.')}</p></div><button type="button" className="admin-icon-btn" onClick={()=>setStaffModal(false)}><X size={17}/></button></div><div className="admin-staff-form-grid"><label>{t('الاسم بالكامل','Full name')}<input required value={staffForm.fullName} onChange={e=>setStaffForm(v=>({...v,fullName:e.target.value}))}/></label><label>{t('البريد الإلكتروني','Email')}<input required type="email" value={staffForm.email} onChange={e=>setStaffForm(v=>({...v,email:e.target.value}))}/></label><label>{t('رقم الهاتف','Phone')}<input value={staffForm.phone} onChange={e=>setStaffForm(v=>({...v,phone:e.target.value}))}/></label><label>{t('الإدارة','Department')}<select value={staffForm.department} onChange={e=>setStaffForm(v=>({...v,department:e.target.value}))}>{['executive','operations','sales','marketing','customer_success','content','product','engineering','finance','hr'].map(d=><option key={d} value={d}>{deptLabel(d,en)}</option>)}</select></label><label>{t('المسمى الوظيفي','Job title')}<input value={staffForm.jobTitle} onChange={e=>setStaffForm(v=>({...v,jobTitle:e.target.value}))}/></label><label>{t('خطة التوسع','Growth cohort')}<select value={staffForm.cohort} onChange={e=>setStaffForm(v=>({...v,cohort:e.target.value}))}><option value="first_50">{t('أول 50 موظف','First 50 employees')}</option><option value="next_150">{t('التوسع حتى 150','Scale to 150')}</option></select></label><label>{t('حالة التوظيف','Employment status')}<select value={staffForm.status} onChange={e=>setStaffForm(v=>({...v,status:e.target.value}))}><option value="planned">{t('مخطط','Planned')}</option><option value="invited">{t('تمت دعوته','Invited')}</option><option value="active">{t('نشط','Active')}</option><option value="on_leave">{t('إجازة','On leave')}</option><option value="inactive">{t('غير نشط','Inactive')}</option><option value="terminated">{t('انتهى التعاقد','Terminated')}</option></select></label><label>{t('المدير المباشر','Direct manager')}<select value={staffForm.managerId} onChange={e=>setStaffForm(v=>({...v,managerId:e.target.value}))}><option value="">{t('بدون مدير مباشر','No direct manager')}</option>{staffRows.filter(s=>s.id!==editingStaffId&&['active','on_leave'].includes(s.status)).map(s=><option key={s.id} value={s.id}>{s.name} · {s.employee_code}</option>)}</select></label></div><p className="admin-form-note">{t('سيتم ربط حساب الدخول تلقائياً إذا وُجد حساب مسجل بنفس البريد وكان البريد مؤكداً. إرسال دعوة بريدية سيتم تفعيله في خطوة منفصلة بعد التحقق من إعدادات البريد.','An existing account is linked automatically only when the same email is already verified. Email invitations will be enabled separately after mail configuration is verified.')}</p><div className="admin-modal-actions"><button type="button" className="admin-cancel-btn" onClick={()=>setStaffModal(false)}>{t('إلغاء','Cancel')}</button><button className="admin-primary-btn" type="submit" disabled={savingStaff}>{savingStaff?t('جارٍ الحفظ…','Saving…'):t('حفظ بيانات الموظف','Save employee')}</button></div></form></div>}
      {storeModal&&<div className="admin-modal-backdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setStoreModal(null);}}><form className="admin-staff-modal b2b-modal" onSubmit={saveStoreRecord}><div className="admin-modal-head"><div><span className="admin-modal-kicker">{t('التجارة بين الشركات','B2B COMMERCE')}</span><h2>{storeModal==='partner'?(editingStoreId?t('تعديل شريك تجاري','Edit business partner'):t('إضافة شريك تجاري','Add business partner')):(editingStoreId?t('تعديل منتج B2B','Edit B2B product'):t('إضافة منتج B2B','Add B2B product'))}</h2><p>{t('كل التعديلات محفوظة في قاعدة بيانات الإدارة ومسجلة في سجل التدقيق.','Changes are stored in the private admin database and written to the audit log.')}</p></div><button type="button" className="admin-icon-btn" onClick={()=>setStoreModal(null)}><X size={17}/></button></div>
      {storeModal==='partner'?<div className="admin-staff-form-grid"><label>{t('الاسم القانوني','Legal name')}<input required value={storeForm.legalName} onChange={e=>setStoreForm(v=>({...v,legalName:e.target.value}))}/></label><label>{t('الاسم التجاري','Trade name')}<input value={storeForm.displayName} onChange={e=>setStoreForm(v=>({...v,displayName:e.target.value}))}/></label><label>{t('نوع الشريك','Partner type')}<select value={storeForm.partnerType} onChange={e=>setStoreForm(v=>({...v,partnerType:e.target.value}))}><option value="supplier">{t('مورد','Supplier')}</option><option value="distributor">{t('موزع','Distributor')}</option><option value="retailer">{t('تاجر تجزئة','Retailer')}</option><option value="service_provider">{t('مقدم خدمة','Service provider')}</option><option value="corporate_buyer">{t('عميل شركات','Corporate buyer')}</option></select></label><label>{t('الرقم الضريبي','Tax number')}<input value={storeForm.taxNumber} onChange={e=>setStoreForm(v=>({...v,taxNumber:e.target.value}))}/></label><label>{t('الدولة','Country code')}<input value={storeForm.country} onChange={e=>setStoreForm(v=>({...v,country:e.target.value.toUpperCase()}))}/></label><label>{t('المدينة','City')}<input value={storeForm.city} onChange={e=>setStoreForm(v=>({...v,city:e.target.value}))}/></label><label>{t('مسؤول التواصل','Contact person')}<input value={storeForm.contactName} onChange={e=>setStoreForm(v=>({...v,contactName:e.target.value}))}/></label><label>{t('البريد','Email')}<input type="email" value={storeForm.email} onChange={e=>setStoreForm(v=>({...v,email:e.target.value}))}/></label><label>{t('الهاتف','Phone')}<input value={storeForm.phone} onChange={e=>setStoreForm(v=>({...v,phone:e.target.value}))}/></label><label>{t('الموقع الإلكتروني','Website')}<input value={storeForm.website} onChange={e=>setStoreForm(v=>({...v,website:e.target.value}))}/></label><label>{t('حالة الشريك','Partner status')}<select value={storeForm.partnerStatus} onChange={e=>setStoreForm(v=>({...v,partnerStatus:e.target.value}))}><option value="prospect">Prospect</option><option value="onboarding">Onboarding</option><option value="active">Active</option><option value="suspended">Suspended</option><option value="archived">Archived</option></select></label><label>{t('العملة','Currency')}<select value={storeForm.currency} onChange={e=>setStoreForm(v=>({...v,currency:e.target.value}))}><option>SAR</option><option>EGP</option><option>AED</option><option>KWD</option><option>QAR</option><option>BHD</option><option>OMR</option><option>USD</option></select></label><label>{t('أجل السداد بالأيام','Payment terms (days)')}<input type="number" min="0" max="365" value={storeForm.paymentTermsDays} onChange={e=>setStoreForm(v=>({...v,paymentTermsDays:e.target.value}))}/></label><label>{t('حد الائتمان','Credit limit')}<input type="number" min="0" step="0.01" value={storeForm.creditLimit} onChange={e=>setStoreForm(v=>({...v,creditLimit:e.target.value}))}/></label><label className="catalog-description">{t('ملاحظات','Notes')}<textarea rows={3} value={storeForm.notes} onChange={e=>setStoreForm(v=>({...v,notes:e.target.value}))}/></label></div>:<div className="admin-staff-form-grid"><label>{t('اسم المنتج بالعربية','Product name (Arabic)')}<input required value={storeForm.nameAr} onChange={e=>setStoreForm(v=>({...v,nameAr:e.target.value}))}/></label><label>{t('اسم المنتج بالإنجليزية','Product name (English)')}<input value={storeForm.nameEn} onChange={e=>setStoreForm(v=>({...v,nameEn:e.target.value}))}/></label><label>{t('المورد','Supplier')}<select value={storeForm.partnerId} onChange={e=>setStoreForm(v=>({...v,partnerId:e.target.value}))}><option value="">{t('بدون مورد مرتبط','No linked supplier')}</option>{(b2bStore?.partners||[]).filter(p=>p.partner_type==='supplier'||p.partner_type==='distributor').map(p=><option key={p.id} value={p.id}>{p.display_name} · {p.partner_code}</option>)}</select></label><label>{t('التصنيف','Category')}<input value={storeForm.category} onChange={e=>setStoreForm(v=>({...v,category:e.target.value}))}/></label><label>{t('وحدة القياس','Unit')}<input value={storeForm.unit} onChange={e=>setStoreForm(v=>({...v,unit:e.target.value}))}/></label><label>{t('الحد الأدنى للطلب','Minimum order quantity')}<input type="number" min="0.001" step="0.001" value={storeForm.minOrderQty} onChange={e=>setStoreForm(v=>({...v,minOrderQty:e.target.value}))}/></label><label>{t('تكلفة الوحدة','Unit cost')}<input type="number" min="0" step="0.01" value={storeForm.costPrice} onChange={e=>setStoreForm(v=>({...v,costPrice:e.target.value}))}/></label><label>{t('سعر الجملة','Wholesale price')}<input type="number" min="0" step="0.01" value={storeForm.wholesalePrice} onChange={e=>setStoreForm(v=>({...v,wholesalePrice:e.target.value}))}/></label><label>{t('سعر التجزئة','Retail price')}<input type="number" min="0" step="0.01" value={storeForm.retailPrice} onChange={e=>setStoreForm(v=>({...v,retailPrice:e.target.value}))}/></label><label>{t('العملة','Currency')}<select value={storeForm.currency} onChange={e=>setStoreForm(v=>({...v,currency:e.target.value}))}><option>SAR</option><option>EGP</option><option>AED</option><option>KWD</option><option>QAR</option><option>USD</option></select></label><label>{t('الضريبة %','Tax rate %')}<input type="number" min="0" max="100" step="0.01" value={storeForm.taxRate} onChange={e=>setStoreForm(v=>({...v,taxRate:e.target.value}))}/></label><label>{t('المخزون المتاح','Available stock')}<input type="number" min="0" step="0.001" value={storeForm.stockQty} onChange={e=>setStoreForm(v=>({...v,stockQty:e.target.value}))} placeholder={t('اتركه فارغاً لعدم التتبع','Leave blank to disable tracking')}/></label><label>{t('حد إعادة الطلب','Reorder threshold')}<input type="number" min="0" step="0.001" value={storeForm.reorderLevel} onChange={e=>setStoreForm(v=>({...v,reorderLevel:e.target.value}))}/></label><label className="catalog-description">{t('شرائح أسعار الكميات (JSON)','Volume price tiers (JSON)')}<textarea rows={3} value={storeForm.priceTiers} onChange={e=>setStoreForm(v=>({...v,priceTiers:e.target.value}))} placeholder='[{"min_qty":10,"unit_price":95},{"min_qty":50,"unit_price":88}]'/></label><label>{t('الدولة','Country')}<input value={storeForm.productCountry} onChange={e=>setStoreForm(v=>({...v,productCountry:e.target.value.toUpperCase()}))}/></label><label>{t('المدينة','City')}<input value={storeForm.productCity} onChange={e=>setStoreForm(v=>({...v,productCity:e.target.value}))}/></label><label>{t('حالة المنتج','Product status')}<select value={storeForm.productStatus} onChange={e=>setStoreForm(v=>({...v,productStatus:e.target.value}))}><option value="draft">Draft</option><option value="active">Active</option><option value="out_of_stock">Out of stock</option><option value="discontinued">Discontinued</option></select></label><label className="catalog-description">{t('الوصف','Description')}<textarea rows={3} value={storeForm.description} onChange={e=>setStoreForm(v=>({...v,description:e.target.value}))}/></label></div>}
      <div className="admin-modal-actions"><button type="button" className="admin-cancel-btn" onClick={()=>setStoreModal(null)}>{t('إلغاء','Cancel')}</button><button className="admin-primary-btn" type="submit" disabled={savingStore}>{savingStore?t('جارٍ الحفظ…','Saving…'):t('حفظ البيانات','Save record')}</button></div></form></div>}
      {orderModalOpen&&<div className="admin-modal-backdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setOrderModalOpen(false);}}><form className="admin-staff-modal b2b-modal" onSubmit={createB2BOrder}><div className="admin-modal-head"><div><span className="admin-modal-kicker">{t('طلب توريد / شراء','B2B ORDER')}</span><h2>{t('إنشاء طلب شركة','Create corporate order')}</h2><p>{t('يتم تطبيق الحد الأدنى للطلب وشرائح سعر الكمية والضريبة والمخزون تلقائياً من قاعدة البيانات.','Minimum order quantities, volume pricing, tax and stock are validated by the database.')}</p></div><button type="button" className="admin-icon-btn" onClick={()=>setOrderModalOpen(false)}><X size={17}/></button></div><div className="admin-staff-form-grid"><label>{t('العميل التجاري','Business buyer')}<select required value={orderBuyerId} onChange={e=>setOrderBuyerId(e.target.value)}><option value="">{t('اختر العميل','Select buyer')}</option>{(b2bStore?.partners||[]).filter(p=>p.status==='active'&&['corporate_buyer','retailer','distributor'].includes(p.partner_type)).map(p=><option key={p.id} value={p.id}>{p.display_name} · {p.currency}</option>)}</select></label><label>{t('موعد التسليم المطلوب','Requested delivery date')}<input type="date" value={orderDeliveryDate} onChange={e=>setOrderDeliveryDate(e.target.value)}/></label><div className="b2b-order-lines"><div className="b2b-order-lines-head"><b>{t('بنود الطلب','Order lines')}</b><button type="button" className="admin-edit-btn" onClick={()=>setOrderLines(v=>[...v,{productId:'',quantity:'1'}])}>{t('إضافة بند','Add line')}</button></div>{orderLines.map((line,index)=><div className="b2b-order-line" key={index}><select value={line.productId} onChange={e=>setOrderLines(v=>v.map((x,i)=>i===index?{...x,productId:e.target.value}:x))}><option value="">{t('اختر منتجاً نشطاً','Select active product')}</option>{(b2bStore?.products||[]).filter(p=>p.status==='active').map(p=><option key={p.id} value={p.id}>{p.name_ar} · {p.sku} · {p.currency}</option>)}</select><input aria-label={t('الكمية','Quantity')} type="number" min="0.001" step="0.001" value={line.quantity} onChange={e=>setOrderLines(v=>v.map((x,i)=>i===index?{...x,quantity:e.target.value}:x))}/><button type="button" className="admin-icon-btn" disabled={orderLines.length===1} onClick={()=>setOrderLines(v=>v.filter((_,i)=>i!==index))}><X size={14}/></button></div>)}</div><label className="catalog-description">{t('ملاحظات الطلب','Order notes')}<textarea rows={3} value={orderNotes} onChange={e=>setOrderNotes(e.target.value)}/></label></div><div className="admin-modal-actions"><button type="button" className="admin-cancel-btn" onClick={()=>setOrderModalOpen(false)}>{t('إلغاء','Cancel')}</button><button className="admin-primary-btn" type="submit" disabled={savingOrder}>{savingOrder?t('جارٍ إنشاء الطلب…','Creating order…'):t('إنشاء الطلب','Create order')}</button></div></form></div>}
      {documentModal&&<div className="admin-modal-backdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setDocumentModal(null);}}><form className="admin-staff-modal b2b-modal" onSubmit={createB2BDocument}><div className="admin-modal-head"><div><span className="admin-modal-kicker">{documentModal.kind==='quote'?t('عرض سعر تجاري','B2B QUOTATION'):t('فاتورة تجارية','B2B INVOICE')}</span><h2>{documentModal.kind==='quote'?t('إنشاء عرض سعر','Create quotation'):t('إنشاء فاتورة','Create invoice')}</h2><p>{documentModal.order.order_no} · {documentModal.order.buyer_name} · {number(documentModal.order.total)} {documentModal.order.currency}</p></div><button type="button" className="admin-icon-btn" onClick={()=>setDocumentModal(null)}><X size={17}/></button></div><div className="admin-staff-form-grid"><label>{documentModal.kind==='quote'?t('صالح حتى','Valid until'):t('تاريخ الاستحقاق','Due date')}<input type="date" value={documentDate} onChange={e=>setDocumentDate(e.target.value)}/></label>{documentModal.kind==='quote'&&<label className="catalog-description">{t('الشروط التجارية','Commercial terms')}<textarea rows={3} value={documentTerms} onChange={e=>setDocumentTerms(e.target.value)}/></label>}</div><div className="admin-modal-actions"><button type="button" className="admin-cancel-btn" onClick={()=>setDocumentModal(null)}>{t('إلغاء','Cancel')}</button><button className="admin-primary-btn" type="submit" disabled={savingDocument}>{savingDocument?t('جارٍ الإنشاء…','Creating…'):t('تأكيد الإنشاء','Confirm')}</button></div></form></div>}
      {overrideStaff&&<div className="admin-modal-backdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setOverrideStaff(null);}}><form className="admin-staff-modal b2b-modal" onSubmit={saveStaffOverride}><div className="admin-modal-head"><div><span className="admin-modal-kicker">{t('استثناء صلاحيات موظف','STAFF PERMISSION OVERRIDE')}</span><h2>{overrideStaff.name}</h2><p>{overrideStaff.email} · {overrideStaff.role_key}</p></div><button type="button" className="admin-icon-btn" onClick={()=>setOverrideStaff(null)}><X size={17}/></button></div><div className="admin-staff-form-grid"><label>{t('الصلاحية','Permission')}<select value={overridePermission} onChange={e=>setOverridePermission(e.target.value)}>{(rbacSnapshot?.permissions||[]).map(p=><option key={p.permission_key} value={p.permission_key}>{p.permission_key}</option>)}</select></label><label>{t('الاستثناء الفردي','Individual override')}<select value={overrideEffect} onChange={e=>setOverrideEffect(e.target.value as 'inherit'|'grant'|'deny')}><option value="inherit">{t('استخدام صلاحية الدور','Inherit role')}</option><option value="grant">{t('منح الصلاحية','Grant')}</option><option value="deny">{t('منع الصلاحية','Deny')}</option></select></label></div><div className="admin-modal-actions"><button type="button" className="admin-cancel-btn" onClick={()=>setOverrideStaff(null)}>{t('إلغاء','Cancel')}</button><button className="admin-primary-btn" type="submit" disabled={overrideSaving}>{overrideSaving?t('جارٍ الحفظ…','Saving…'):t('حفظ الاستثناء','Save override')}</button></div></form></div>}
      {inventoryProduct&&<div className="admin-modal-backdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setInventoryProduct(null);}}><section className="admin-staff-modal b2b-modal"><div className="admin-modal-head"><div><span className="admin-modal-kicker">{t('سجل حركة المخزون','INVENTORY HISTORY')}</span><h2>{inventoryProduct.name_ar} · {inventoryProduct.sku}</h2><p>{t('سجل افتتاح المخزون والتعديلات مع المرجع والتوقيت.','Opening and adjustment movements with reference and timestamp.')}</p></div><button type="button" className="admin-icon-btn" onClick={()=>setInventoryProduct(null)}><X size={17}/></button></div>{inventoryLoading?<div className="directory-loading">{t('جارٍ تحميل سجل المخزون…','Loading inventory history…')}</div>:<div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>{t('نوع الحركة','Movement')}</th><th>{t('التغير','Delta')}</th><th>{t('المرجع','Reference')}</th><th>{t('ملاحظات','Notes')}</th><th>{t('التاريخ','Date')}</th></tr></thead><tbody>{inventoryRows.map(m=><tr key={m.id}><td>{m.movement_type}</td><td>{number(m.quantity_delta)}</td><td>{m.reference}</td><td>{m.notes}</td><td>{new Date(m.created_at).toLocaleString(en?'en-US':'ar-SA')}</td></tr>)}{!inventoryRows.length&&<tr><td colSpan={5} className="admin-empty-cell">{t('لا توجد حركات مخزون مسجلة.','No inventory movements recorded.')}</td></tr>}</tbody></table></div>}<div className="admin-modal-actions"><button type="button" className="admin-primary-btn" onClick={()=>setInventoryProduct(null)}>{t('إغلاق','Close')}</button></div></section></div>}
      {paymentInvoice&&<div className="admin-modal-backdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setPaymentInvoice(null);}}><form className="admin-staff-modal b2b-modal" onSubmit={recordInvoicePayment}><div className="admin-modal-head"><div><span className="admin-modal-kicker">{t('تحصيل الفواتير','INVOICE COLLECTION')}</span><h2>{paymentInvoice.invoice_no}</h2><p>{paymentInvoice.buyer_name} · {t('الرصيد المتبقي','Balance due')}: {number(paymentInvoice.balance_due)} {paymentInvoice.currency}</p></div><button type="button" className="admin-icon-btn" onClick={()=>setPaymentInvoice(null)}><X size={17}/></button></div><div className="admin-staff-form-grid"><label>{t('قيمة الدفعة','Payment amount')}<input required type="number" min="0.01" max={paymentInvoice.balance_due} step="0.01" value={paymentAmount} onChange={e=>setPaymentAmount(e.target.value)}/></label><label>{t('ملاحظة / مرجع التحصيل','Payment note / reference')}<input value={paymentNote} onChange={e=>setPaymentNote(e.target.value)}/></label></div><div className="admin-modal-actions"><button type="button" className="admin-cancel-btn" onClick={()=>setPaymentInvoice(null)}>{t('إلغاء','Cancel')}</button><button className="admin-primary-btn" type="submit" disabled={savingPayment}>{savingPayment?t('جارٍ التسجيل…','Recording…'):t('تسجيل الدفعة','Record payment')}</button></div></form></div>}
      {catalogModal&&<div className="admin-modal-backdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setCatalogModal(false);}}><form className="admin-staff-modal catalog-modal" onSubmit={saveCatalogItem}><div className="admin-modal-head"><div><span className="admin-modal-kicker">{t('المحتوى والخدمات','CONTENT & SERVICES')}</span><h2>{editingCatalogId?t('تعديل عنصر الكتالوج','Edit catalog item'):t('إضافة عنصر جديد','Add catalog item')}</h2><p>{t('إدارة بيانات العرض والأسعار وحالة النشر. كل تعديل يسجل في سجل الإدارة.','Manage listing, prices and publishing. Every change is audited.')}</p></div><button type="button" className="admin-icon-btn" onClick={()=>setCatalogModal(false)}><X size={17}/></button></div><div className="admin-staff-form-grid"><label>{t('الاسم بالعربية','Arabic title')}<input required value={catalogForm.title} onChange={e=>setCatalogForm(v=>({...v,title:e.target.value}))}/></label><label>{t('الاسم بالإنجليزية','English title')}<input value={catalogForm.nameEn} onChange={e=>setCatalogForm(v=>({...v,nameEn:e.target.value}))}/></label><label>{t('نوع العنصر','Item type')}<select value={catalogForm.itemType} onChange={e=>setCatalogForm(v=>({...v,itemType:e.target.value}))}><option value="product">{t('منتج','Product')}</option><option value="service">{t('خدمة','Service')}</option><option value="digital_feature">{t('ميزة رقمية','Digital feature')}</option><option value="game">{t('لعبة','Game')}</option></select></label><label>{t('التصنيف البرمجي','Category key')}<input value={catalogForm.category} onChange={e=>setCatalogForm(v=>({...v,category:e.target.value}))} placeholder="toys"/></label><label>{t('اسم التصنيف','Category label')}<input value={catalogForm.categoryLabel} onChange={e=>setCatalogForm(v=>({...v,categoryLabel:e.target.value}))}/></label><label>{t('الدولة (ALL أو SA أو EG)','Country code')}<input value={catalogForm.country} onChange={e=>setCatalogForm(v=>({...v,country:e.target.value.toUpperCase()}))}/></label><label>{t('المدينة','City')}<input value={catalogForm.city} onChange={e=>setCatalogForm(v=>({...v,city:e.target.value}))}/></label><label>{t('السعر بالجنيه المصري','Price in EGP')}<input type="number" min="0" step="0.01" value={catalogForm.priceEgp} onChange={e=>setCatalogForm(v=>({...v,priceEgp:e.target.value}))}/></label><label>{t('السعر بالريال السعودي','Price in SAR')}<input type="number" min="0" step="0.01" value={catalogForm.priceSar} onChange={e=>setCatalogForm(v=>({...v,priceSar:e.target.value}))}/></label><label>{t('رمز / Emoji','Emoji')}<input value={catalogForm.emoji} onChange={e=>setCatalogForm(v=>({...v,emoji:e.target.value}))}/></label><label className="catalog-description">{t('الوصف','Description')}<textarea rows={3} value={catalogForm.description} onChange={e=>setCatalogForm(v=>({...v,description:e.target.value}))}/></label><label className="catalog-check"><input type="checkbox" checked={catalogForm.isSponsored} onChange={e=>setCatalogForm(v=>({...v,isSponsored:e.target.checked}))}/>{t('محتوى مميز / برعاية','Sponsored listing')}</label><label className="catalog-check"><input type="checkbox" checked={catalogForm.isActive} onChange={e=>setCatalogForm(v=>({...v,isActive:e.target.checked}))}/>{t('منشور ونشط في التطبيق','Published and active')}</label></div><div className="admin-modal-actions"><button type="button" className="admin-cancel-btn" onClick={()=>setCatalogModal(false)}>{t('إلغاء','Cancel')}</button><button className="admin-primary-btn" type="submit" disabled={savingCatalog}>{savingCatalog?t('جارٍ الحفظ…','Saving…'):t('حفظ العنصر','Save item')}</button></div></form></div>}
      {toast&&<div className="admin-toast"><CheckCircle2 size={17}/>{toast}</div>}
    </div>
  );
}
