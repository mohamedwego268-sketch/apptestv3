import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity, ArrowDownRight, ArrowUpRight, Baby, Bell, Building2, CalendarDays,
  CheckCircle2, ChevronDown, ChevronLeft, CircleHelp, Command, Download, FileText,
  Globe2, LayoutDashboard, LockKeyhole, LogOut, Menu, Moon, RefreshCw, Search,
  Settings2, ShieldCheck, Sparkles, Users, X, Zap, ChartNoAxesCombined, HeartPulse,
  ClipboardList, UserRoundCog, BookOpen, Package, Clock3, TrendingUp
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

type PageKey = 'overview' | 'analytics' | 'users' | 'families' | 'team' | 'content' | 'security' | 'settings';
const NAV: { id: PageKey; ar: string; en: string; icon: React.ElementType; group: string }[] = [
  { id: 'overview', ar: 'الرؤية العامة', en: 'Overview', icon: LayoutDashboard, group: 'main' },
  { id: 'analytics', ar: 'التحليلات والتقارير', en: 'Analytics & Reports', icon: ChartNoAxesCombined, group: 'main' },
  { id: 'users', ar: 'المستخدمون', en: 'Users', icon: Users, group: 'manage' },
  { id: 'families', ar: 'الأسر والأطفال', en: 'Families & Children', icon: Baby, group: 'manage' },
  { id: 'content', ar: 'المحتوى والخدمات', en: 'Content & Services', icon: BookOpen, group: 'manage' },
  { id: 'team', ar: 'فريق العمل', en: 'Team & Workforce', icon: UserRoundCog, group: 'manage' },
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
  const [staffForm, setStaffForm] = useState({ fullName:'', email:'', phone:'', department:'operations', jobTitle:'', cohort:'first_50', status:'planned' });
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
      else void verify();
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
  const filteredUsers = useMemo(() => (snapshot?.recent_users || []).filter(u => !query || (u.name || '').toLowerCase().includes(query.toLowerCase())), [snapshot, query]);
  const filteredFamilies = useMemo(() => (snapshot?.recent_families || []).filter(f => !query || (f.name || '').toLowerCase().includes(query.toLowerCase())), [snapshot, query]);

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

  const openStaffModal = (staff?: Snapshot['staff_directory'][number]) => {
    setEditingStaffId(staff?.id || null);
    setStaffForm(staff ? {
      fullName: staff.name || '', email: staff.email || '', phone: staff.phone || '',
      department: staff.department || 'operations', jobTitle: staff.title || '',
      cohort: staff.cohort || 'first_50', status: staff.status || 'planned'
    } : { fullName:'', email:'', phone:'', department:'operations', jobTitle:'', cohort:'first_50', status:'planned' });
    setStaffModal(true);
  };
  const saveStaff = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!supabaseClient || savingStaff) return;
    setSavingStaff(true);
    const { data, error } = await supabaseClient.rpc('admin_save_staff', {
      p_id: editingStaffId,
      p_full_name: staffForm.fullName,
      p_email: staffForm.email,
      p_department: staffForm.department,
      p_job_title: staffForm.jobTitle,
      p_phone: staffForm.phone || null,
      p_cohort: staffForm.cohort,
      p_employment_status: staffForm.status,
      p_employee_code: null
    });
    setSavingStaff(false);
    if (error) {
      setToast(t('تعذر حفظ الموظف: ','Could not save employee: ') + error.message);
      return;
    }
    setStaffModal(false);
    setToast(editingStaffId ? t('تم تحديث بيانات الموظف.','Employee updated.') : t('تمت إضافة الموظف إلى الهيكل.','Employee added to workforce.'));
    await loadSnapshot(period, true);
  };

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
        {NAV.filter(item=>item.group===group).map(item=>{const Icon=item.icon;return <button key={item.id} onClick={()=>{setPage(item.id);setMobileNav(false);setQuery('');}} className={'admin-nav-item '+(page===item.id?'active':'')}><Icon size={18}/><span>{t(item.ar,item.en)}</span>{item.id==='security'&&snapshot?.recent_admin_events?.length?<i>{snapshot.recent_admin_events.length}</i>:null}</button>})}
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

          {page==='analytics' && <section className="admin-analytics-grid"><article className="admin-panel wide"><div className="panel-heading"><div><h3>{t('منحنى اكتساب المستخدمين','User acquisition trend')}</h3><p>{t('بيانات فعلية حسب تاريخ إنشاء الحساب','Actual account creation data')}</p></div></div><div className="chart-area tall"><ResponsiveContainer width="100%" height="100%"><AreaChart data={snapshot?.signup_series||[]}><defs><linearGradient id="analyticsGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#0284c7" stopOpacity={0.25}/><stop offset="100%" stopColor="#0284c7" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 5" vertical={false} stroke="var(--admin-border)"/><XAxis dataKey="date" tickFormatter={v=>dateLabel(v,en)} tickLine={false} axisLine={false}/><YAxis allowDecimals={false} tickLine={false} axisLine={false}/><Tooltip/><Area dataKey="count" stroke="#0284c7" strokeWidth={3} fill="url(#analyticsGradient)"/></AreaChart></ResponsiveContainer></div></article><article className="admin-panel"><div className="panel-heading"><div><h3>{t('أنواع سجلات الأطفال','Child record mix')}</h3><p>{t('توزيع السجلات المحفوظة فعلياً','Distribution of saved records')}</p></div></div><div className="chart-area donut"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={snapshot?.record_mix||[]} dataKey="count" nameKey="type" innerRadius={60} outerRadius={90} paddingAngle={3}>{(snapshot?.record_mix||[]).map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}</Pie><Tooltip formatter={(v,n,props)=>[v,recordLabel(String(props.payload.type),en)]}/></PieChart></ResponsiveContainer></div><div className="admin-legend">{(snapshot?.record_mix||[]).map((r,i)=><div key={r.type}><i style={{background:COLORS[i%COLORS.length]}}/><span>{recordLabel(r.type,en)}</span><b>{number(r.count)}</b></div>)}{!snapshot?.record_mix?.length&&<p className="admin-empty-cell">{t('ستظهر الأنواع بعد تسجيل بيانات حقيقية','Record categories appear as real data is collected')}</p>}</div></article><article className="admin-panel"><div className="panel-heading"><div><h3>{t('مؤشرات حجم المنصة','Platform scale')}</h3><p>{t('الوضع الحالي مقابل أهداف التوسع','Current position against scale targets')}</p></div></div><div className="scale-stat"><span>{t('الموظفون النشطون','Active employees')}</span><b>{number(k?.staff_total||0)}</b><small>{t('المرحلة الأولى: 50 موظفاً','Phase 1: 50 employees')}</small><div className="scale-track"><i style={{width:Math.min(100,((k?.staff_total||0)/50)*100)+'%'}}/></div></div><div className="scale-stat"><span>{t('المستهدف بعد 12 شهراً','12-month target')}</span><b>150</b><small>{t('إجمالي السعة المستهدفة للفريق','Total planned team capacity')}</small><div className="scale-track"><i style={{width:Math.min(100,((k?.staff_total||0)/150)*100)+'%'}}/></div></div></article></section>}

          {page==='users' && <section className="admin-panel"><div className="panel-heading"><div><h3>{t('دليل المستخدمين','User directory')}</h3><p>{t('أحدث السجلات المتاحة من قاعدة البيانات','Latest available records from database')}</p></div><label className="admin-search"><Search size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder={t('ابحث بالاسم…','Search by name…')}/></label></div><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>{t('المستخدم','User')}</th><th>{t('الدور','Role')}</th><th>{t('الدولة','Country')}</th><th>{t('تاريخ التسجيل','Registered')}</th></tr></thead><tbody>{filteredUsers.map(u=><tr key={u.id}><td><div className="table-person"><span className="person-avatar">{(u.name||'N').slice(0,1)}</span><b>{u.name||'—'}</b></div></td><td>{u.role==='father'?t('أب','Father'):u.role==='mother'?t('أم','Mother'):u.role}</td><td>{u.country||'—'}</td><td>{dateLabel(u.created_at,en)}</td></tr>)}{!filteredUsers.length&&<tr><td colSpan={4} className="admin-empty-cell">{t('لا توجد نتائج','No results')}</td></tr>}</tbody></table></div><div className="admin-list-foot">{t('إجمالي الحسابات','Total accounts')}: <b>{number(k?.users_total||0)}</b> · {t('المعروض في هذه النسخة: آخر 8 سجلات','Showing latest 8 records in this release')}</div></section>}

          {page==='families' && <section className="admin-panel"><div className="panel-heading"><div><h3>{t('دليل الأسر','Family directory')}</h3><p>{t('المساحات الأسرية المسجلة في المنصة','Family workspaces registered on the platform')}</p></div><label className="admin-search"><Search size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder={t('ابحث باسم الأسرة…','Search families…')}/></label></div><div className="admin-family-grid">{filteredFamilies.map(f=><article className="family-admin-card" key={f.id}><span className="family-symbol"><Building2 size={20}/></span><h4>{f.name||t('أسرة جديدة','New family')}</h4><p><Globe2 size={13}/>{f.city} · {f.country}</p><small>{t('تاريخ الإنشاء','Created')}: {dateLabel(f.created_at,en)}</small></article>)}{!filteredFamilies.length&&<div className="admin-empty-cell">{t('لا توجد أسر مطابقة','No matching families')}</div>}</div><div className="admin-list-foot">{t('إجمالي الأسر','Total families')}: <b>{number(k?.families_total||0)}</b> · {t('المعروض في هذه النسخة: آخر 8 سجلات','Showing latest 8 records in this release')}</div></section>}

          {page==='team' && <><section className="admin-kpi-grid three"><MetricCard label={t('موظفون نشطون','Active employees')} value={k?.staff_total||0} detail={t('على قوة العمل حالياً','Currently on workforce')} icon={Users} tone="teal"/><MetricCard label={t('قيد التجهيز','Planned / invited')} value={k?.staff_planned||0} detail={t('سجلات فريق قيد الإعداد','Team records being prepared')} icon={Clock3} tone="blue"/><MetricCard label={t('سعة المرحلة الأولى','Phase 1 capacity')} value={50} detail={t('هدف أول 6 شهور','First 6-month target')} icon={TrendingUp} tone="coral"/></section><section className="admin-panel"><div className="panel-heading"><div><h3>{t('هيكل فريق العمل','Workforce directory')}</h3><p>{t('إدارة الموظفين حسب الإدارات، حالات التوظيف، وخطة التوسع','Manage employees by department, employment status and scale plan')}</p></div><button className="admin-add-btn" onClick={()=>openStaffModal()}><Users size={15}/>{t('إضافة موظف','Add employee')}</button></div>{snapshot?.staff_directory?.length?<div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>{t('الموظف','Employee')}</th><th>{t('البريد','Email')}</th><th>{t('الإدارة','Department')}</th><th>{t('المسمى الوظيفي','Job title')}</th><th>{t('الحالة','Status')}</th><th>{t('المرحلة','Cohort')}</th><th>{t('إجراء','Action')}</th></tr></thead><tbody>{snapshot.staff_directory.map(s=><tr key={s.id}><td><b>{s.name}</b><small className="table-sub">{s.employee_code}</small></td><td>{s.email}</td><td>{deptLabel(s.department,en)}</td><td>{s.title||'—'}</td><td><span className={'status-pill '+s.status}>{s.status}</span></td><td>{s.cohort==='first_50'?t('أول 50','First 50'):t('حتى 150','Next 150')}</td><td><button className="admin-edit-btn" onClick={()=>openStaffModal(s)}>{t('تعديل','Edit')}</button></td></tr>)}</tbody></table></div>:<div className="team-empty"><div className="team-empty-icon"><UserRoundCog size={28}/></div><h3>{t('مساحة فريقك جاهزة للنمو','Your workforce space is ready to grow')}</h3><p>{t('ابدأ بإضافة أعضاء الفريق وتحديد الإدارة والمسمى الوظيفي وحالة التوظيف. يمكن ربط حساب الدخول لاحقاً عند تفعيل دعوات البريد.','Add team members and assign departments, job titles and employment status. Login accounts can be linked later when email invitations are enabled.')}</p><button className="admin-add-btn centered" onClick={()=>openStaffModal()}><Users size={15}/>{t('إضافة أول موظف','Add first employee')}</button><div className="team-targets"><span><b>50</b>{t('موظفاً · أول 6 شهور','employees · first 6 months')}</span><span><b>150</b>{t('موظفاً · خلال 12 شهراً','employees · by month 12')}</span></div></div>}</section></>}

          {page==='content' && <section className="admin-panel"><div className="panel-heading"><div><h3>{t('المحتوى والخدمات','Content & services')}</h3><p>{t('حالة المحتوى التجاري والتفاعلي المسجل في قاعدة البيانات','Status of commercial and interactive content in database')}</p></div></div><div className="admin-kpi-grid embedded"><MetricCard label={t('عناصر كتالوج نشطة','Active catalog items')} value={k?.catalog_active||0} detail={t('منتجات وخدمات منشورة','Published products and services')} icon={Package} tone="teal"/><MetricCard label={t('سجلات حياة الأطفال','Child life records')} value={k?.child_records_total||0} detail={t('محتوى أنشأته الأسر','Family-created records')} icon={ClipboardList} tone="blue"/></div><div className="admin-info-note"><CircleHelp size={18}/><span>{t('إدارة المحتوى التفصيلية (إنشاء، مراجعة، نشر، وجدولة) ستكون ضمن المرحلة التالية بعد إغلاق لوحة المؤشرات الأساسية. لا توجد أزرار شكلية أو عمليات غير موصولة حالياً.','Full content workflows (create, review, publish and schedule) are the next delivery phase after the core control dashboard. No decorative or disconnected controls are shown.')}</span></div></section>}

          {page==='security' && <section className="admin-two-col"><article className="admin-panel"><div className="panel-heading"><div><h3>{t('سجل إجراءات الإدارة','Administrative audit trail')}</h3><p>{t('سجل محمي للإجراءات الإدارية المسجلة','Protected log of recorded admin actions')}</p></div><ShieldCheck size={20}/></div>{snapshot?.recent_admin_events?.length?snapshot.recent_admin_events.map(e=><div className="audit-row" key={e.id}><span><ShieldCheck size={16}/></span><div><b>{e.action}</b><small>{e.target_type||'—'} · {e.target_id||'—'}</small></div><time>{dateLabel(e.created_at,en)}</time></div>):<div className="team-empty compact"><div className="team-empty-icon"><ShieldCheck size={25}/></div><h3>{t('سجل التدقيق جاهز','Audit trail is ready')}</h3><p>{t('لم تُسجل إجراءات إدارية بعد. السجل مصمم ليكون Append-only لمنع تعديل أو حذف الأثر الإداري.','No admin actions have been recorded yet. The audit log is append-only to prevent tampering.')}</p></div>}</article><article className="admin-panel"><div className="panel-heading"><div><h3>{t('حالة الحماية','Security posture')}</h3><p>{t('ضوابط الوصول الأساسية','Core access controls')}</p></div></div><div className="security-check"><CheckCircle2/><div><b>{t('التحقق من صلاحية Super Admin','Super Admin verification')}</b><small>{t('يتم من قاعدة البيانات عند كل جلسة','Verified from database each session')}</small></div><span>{t('مفعل','Active')}</span></div><div className="security-check"><LockKeyhole/><div><b>{t('مخطط الإدارة خاص','Private admin schema')}</b><small>{t('غير مكشوف مباشرة للمتصفح','Not directly exposed to browser')}</small></div><span>{t('مفعل','Active')}</span></div><div className="security-check"><FileText/><div><b>{t('سجل التدقيق غير قابل للتعديل','Append-only audit log')}</b><small>{t('منع UPDATE و DELETE على السجل','UPDATE and DELETE blocked')}</small></div><span>{t('مفعل','Active')}</span></div></article></section>}

          {page==='settings' && <section className="admin-panel"><div className="panel-heading"><div><h3>{t('إعدادات المنصة','Platform settings')}</h3><p>{t('التهيئة العامة ومفاتيح التحكم ستدار تدريجياً من هنا','Platform-wide configuration and controls will be managed here in stages')}</p></div></div><div className="settings-placeholder"><Settings2 size={28}/><h3>{t('طبقة إعدادات المنصة','Platform configuration layer')}</h3><p>{t('تم فصل لوحة الإدارة عن واجهة الأسرة وتأمين دخولها. سنضيف إعدادات الخصائص، الخطط والاشتراكات، حدود الاستخدام، مزودي الذكاء الاصطناعي، والتنبيهات بعد استكمال واجهات الإدارة وربط كل إجراء بتسجيل تدقيق.','The admin portal is separated from the family app and access is secured. Feature flags, plans, subscriptions, usage limits, AI providers and notifications will be added after their workflows are implemented with audit logging.')}</p></div></section>}

          <footer className="admin-footer"><span>© 2026 NEKBAAR · {t('مساحة تجمعنا.. وبحبهم نكبر','A space that brings us together, where love helps us grow')}</span><span><span className="admin-online-dot"/> {t('بيانات الإنتاج','Production data')}</span></footer>
        </main>
      </div>
      {staffModal&&<div className="admin-modal-backdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setStaffModal(false);}}><form className="admin-staff-modal" onSubmit={saveStaff}><div className="admin-modal-head"><div><span className="admin-modal-kicker">{t('إدارة الفريق','WORKFORCE')}</span><h2>{editingStaffId?t('تعديل بيانات الموظف','Edit employee'):t('إضافة موظف جديد','Add a new employee')}</h2><p>{t('سجّل بيانات الموظف الأساسية وحدد مكانه في الهيكل.','Enter employee details and assign their place in the organization.')}</p></div><button type="button" className="admin-icon-btn" onClick={()=>setStaffModal(false)}><X size={17}/></button></div><div className="admin-staff-form-grid"><label>{t('الاسم بالكامل','Full name')}<input required value={staffForm.fullName} onChange={e=>setStaffForm(v=>({...v,fullName:e.target.value}))}/></label><label>{t('البريد الإلكتروني','Email')}<input required type="email" value={staffForm.email} onChange={e=>setStaffForm(v=>({...v,email:e.target.value}))}/></label><label>{t('رقم الهاتف','Phone')}<input value={staffForm.phone} onChange={e=>setStaffForm(v=>({...v,phone:e.target.value}))}/></label><label>{t('الإدارة','Department')}<select value={staffForm.department} onChange={e=>setStaffForm(v=>({...v,department:e.target.value}))}>{['executive','operations','sales','marketing','customer_success','content','product','engineering','finance','hr'].map(d=><option key={d} value={d}>{deptLabel(d,en)}</option>)}</select></label><label>{t('المسمى الوظيفي','Job title')}<input value={staffForm.jobTitle} onChange={e=>setStaffForm(v=>({...v,jobTitle:e.target.value}))}/></label><label>{t('خطة التوسع','Growth cohort')}<select value={staffForm.cohort} onChange={e=>setStaffForm(v=>({...v,cohort:e.target.value}))}><option value="first_50">{t('أول 50 موظف','First 50 employees')}</option><option value="next_150">{t('التوسع حتى 150','Scale to 150')}</option></select></label><label>{t('حالة التوظيف','Employment status')}<select value={staffForm.status} onChange={e=>setStaffForm(v=>({...v,status:e.target.value}))}><option value="planned">{t('مخطط','Planned')}</option><option value="invited">{t('تمت دعوته','Invited')}</option><option value="active">{t('نشط','Active')}</option><option value="on_leave">{t('إجازة','On leave')}</option><option value="inactive">{t('غير نشط','Inactive')}</option><option value="terminated">{t('انتهى التعاقد','Terminated')}</option></select></label></div><div className="admin-modal-actions"><button type="button" className="admin-cancel-btn" onClick={()=>setStaffModal(false)}>{t('إلغاء','Cancel')}</button><button className="admin-primary-btn" type="submit" disabled={savingStaff}>{savingStaff?t('جارٍ الحفظ…','Saving…'):t('حفظ بيانات الموظف','Save employee')}</button></div></form></div>}
      {toast&&<div className="admin-toast"><CheckCircle2 size={17}/>{toast}</div>}
    </div>
  );
}
