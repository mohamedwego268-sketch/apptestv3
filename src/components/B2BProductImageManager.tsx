import { useEffect, useMemo, useState } from 'react';
import { ImagePlus, LoaderCircle, Trash2 } from 'lucide-react';
import { supabaseClient } from '../services/supabaseService';

const BUCKET = 'nekbaar-product-images';
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
};

type B2BProductImageManagerProps = {
  productId: string;
  imagePath?: string | null;
  ownerType: 'platform' | 'partner';
  partnerId?: string | null;
  language?: 'ar' | 'en';
  canManage?: boolean;
  onChanged?: (imagePath: string | null) => void;
};

export function B2BProductImageManager({
  productId,
  imagePath,
  ownerType,
  partnerId,
  language = 'ar',
  canManage = true,
  onChanged,
}: B2BProductImageManagerProps) {
  const en = language === 'en';
  const [currentPath, setCurrentPath] = useState<string | null>(imagePath || null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    setCurrentPath(imagePath || null);
  }, [imagePath]);

  const imageUrl = useMemo(() => {
    if (!currentPath || !supabaseClient) return null;
    return supabaseClient.storage.from(BUCKET).getPublicUrl(currentPath).data.publicUrl;
  }, [currentPath]);

  const persistImagePath = async (nextPath: string | null) => {
    if (!supabaseClient) throw new Error(en ? 'Storage is unavailable.' : 'خدمة التخزين غير متاحة.');
    const rpc = ownerType === 'platform' ? 'admin_set_b2b_product_image' : 'vendor_set_b2b_product_image';
    const { error } = await supabaseClient.rpc(rpc, {
      p_product_id: productId,
      p_image_path: nextPath,
    });
    if (error) throw error;
  };

  const uploadImage = async (file: File) => {
    if (!supabaseClient || busy) return;
    if (!EXTENSIONS[file.type]) {
      setMessage(en ? 'Use JPG, PNG, WebP or AVIF.' : 'الصيغ المدعومة JPG وPNG وWebP وAVIF.');
      return;
    }
    if (file.size <= 0 || file.size > MAX_IMAGE_BYTES) {
      setMessage(en ? 'Image size must be between 1 byte and 5 MB.' : 'حجم الصورة يجب ألا يتجاوز 5 ميجابايت.');
      return;
    }
    if (ownerType === 'partner' && !partnerId) {
      setMessage(en ? 'This partner account is not linked to a partner record.' : 'حساب الشريك غير مرتبط بسجل منشأة.');
      return;
    }

    setBusy(true);
    setMessage('');
    let uploadedPath: string | null = null;
    try {
      const { data: authData, error: authError } = await supabaseClient.auth.getUser();
      if (authError || !authData.user) throw authError || new Error('Sign in is required.');
      const userId = authData.user.id;
      const folder = ownerType === 'platform'
        ? `platform/${userId}/${productId}`
        : `partners/${partnerId}/${userId}/${productId}`;
      uploadedPath = `${folder}/${crypto.randomUUID()}.${EXTENSIONS[file.type]}`;

      const { error: uploadError } = await supabaseClient.storage
        .from(BUCKET)
        .upload(uploadedPath, file, {
          contentType: file.type,
          cacheControl: '3600',
          upsert: false,
        });
      if (uploadError) throw uploadError;

      await persistImagePath(uploadedPath);
      const previousPath = currentPath;
      setCurrentPath(uploadedPath);
      onChanged?.(uploadedPath);
      if (previousPath && previousPath !== uploadedPath) {
        const { error: removeError } = await supabaseClient.storage.from(BUCKET).remove([previousPath]);
        if (removeError) setMessage(en ? 'Image updated; the previous file could not be cleaned up.' : 'تم تحديث الصورة، لكن تعذر تنظيف الملف السابق.');
        else setMessage(en ? 'Product image updated.' : 'تم تحديث صورة المنتج.');
      } else {
        setMessage(en ? 'Product image uploaded.' : 'تم رفع صورة المنتج.');
      }
    } catch (error) {
      if (uploadedPath) await supabaseClient.storage.from(BUCKET).remove([uploadedPath]);
      setMessage(error instanceof Error ? error.message : (en ? 'Image upload failed.' : 'تعذر رفع الصورة.'));
    } finally {
      setBusy(false);
    }
  };

  const clearImage = async () => {
    if (!supabaseClient || !currentPath || busy) return;
    setBusy(true);
    setMessage('');
    try {
      await persistImagePath(null);
      const previousPath = currentPath;
      setCurrentPath(null);
      onChanged?.(null);
      const { error } = await supabaseClient.storage.from(BUCKET).remove([previousPath]);
      setMessage(error
        ? (en ? 'Image removed from the product; storage cleanup is pending.' : 'تم حذف الصورة من المنتج، ويتبقى تنظيف ملف التخزين.')
        : (en ? 'Product image removed.' : 'تم حذف صورة المنتج.'));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : (en ? 'Could not remove image.' : 'تعذر حذف الصورة.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900/40" dir={en ? 'ltr' : 'rtl'}>
      <div className="flex items-center gap-3">
        <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
          {imageUrl
            ? <img src={imageUrl} alt={en ? 'Product image' : 'صورة المنتج'} className="h-full w-full object-cover" />
            : <ImagePlus size={25} className="text-slate-400" />}
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">{en ? 'Product image' : 'صورة المنتج'}</h4>
          <p className="mt-1 text-[11px] leading-5 text-slate-500 dark:text-slate-400">
            {en ? 'JPG, PNG, WebP or AVIF · maximum 5 MB' : 'JPG أو PNG أو WebP أو AVIF · بحد أقصى 5 ميجابايت'}
          </p>
          {canManage && (
            <div className="mt-2 flex flex-wrap gap-2">
              <label className="inline-flex min-h-[38px] cursor-pointer items-center gap-1.5 rounded-lg bg-teal-700 px-3 text-xs font-bold text-white">
                {busy ? <LoaderCircle size={14} className="animate-spin" /> : <ImagePlus size={14} />}
                {currentPath ? (en ? 'Change image' : 'تغيير الصورة') : (en ? 'Upload image' : 'رفع صورة')}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  className="sr-only"
                  disabled={busy}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void uploadImage(file);
                    event.currentTarget.value = '';
                  }}
                />
              </label>
              {currentPath && (
                <button type="button" disabled={busy} onClick={() => void clearImage()} className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-rose-200 px-3 text-xs font-bold text-rose-700 disabled:opacity-50 dark:border-rose-900 dark:text-rose-300">
                  <Trash2 size={14} />{en ? 'Remove' : 'حذف'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      {message && <p role="status" className="mt-2 break-words text-[11px] leading-5 text-slate-600 dark:text-slate-300">{message}</p>}
    </section>
  );
}
