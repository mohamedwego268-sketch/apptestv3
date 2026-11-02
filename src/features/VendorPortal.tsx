import { useCallback,useEffect,useMemo,useState } from 'react';
import { AlertCircle,ArrowLeft,Boxes,Building2,CheckCircle2,ClipboardList,Clock3,LoaderCircle,LogOut,Package,RefreshCw,ShieldCheck,Store } from 'lucide-react';
import { supabaseClient } from '../services/supabaseService';
import './VendorPortal.css';

type Product={id:string;sku:string;name_ar:string;name_en:string;category:string;unit:string;stock_qty:number|null;available_stock:number|null;wholesale_price:number;currency:string;status:string};
type Order={id:string;order_no:string;status:string;currency:string;vendor_total:number;created_at:string;requested_delivery_date:string|null;buyer_name:string;items:{product_name:string;sku:string;quantity:number;line_total:number}[]};
type Snapshot={partner:{partner_code:string;display_name:string;legal_name:string;partner_type:string;country:string;city:string;currency:string};member_role:string;metrics:{products_total:number;products_active:number;orders_total:number;orders_open:number};products:Product[];orders:Order[]};
const money=(n:number,c:string)=>new Intl.NumberFormat('ar-SA',{style:'currency',currency:c||'SAR',maximumFractionDigits:2}).format(Number(n||0));
const fmtDate=(s:string)=>new Intl.DateTimeFormat('ar-SA',{dateStyle:'medium'}).format(new Date(s));
const status=(s:string)=>({inquiry:'استفسار جديد',quote_sent:'عرض مرسل',approved:'معتمد',processing:'قيد التجهيز',shipped:'تم الشحن',delivered:'تم التسليم',cancelled:'ملغي',active:'نشط',draft:'مسودة',out_of_stock:'نفد المخزون',discontinued:'متوقف'}[s]||s);

export default function VendorPortal(){
 const [session,setSession]=useState<any>(null),[ready,setReady]=useState(false),[email,setEmail]=useState(''),[password,setPassword]=useState('');
 const [snapshot,setSnapshot]=useState<Snapshot|null>(null),[tab,setTab]=useState<'overview'|'products'|'orders'>('overview');
 const [loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const load=useCallback(asyn...[truncated]