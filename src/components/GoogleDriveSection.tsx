import React, { useEffect, useState, useCallback, useMemo } from 'react';
import type { User } from 'firebase/auth';
import {
  initAuth,
  googleSignIn,
  logoutGoogleDrive,
  listDriveFiles,
  createDriveFile,
  updateDriveFileContent,
  downloadDriveFileText,
  deleteDriveFileById,
  fetchLocalProjectArchiveBlob,
  fetchLocalStandalonePrototypeBlob,
  DriveFileItem,
  EditableProjectSessionEnvelope,
} from '../services/googleDriveService';
import {
  FamilySpaceState,
  LanguageCode,
  validateImportedJson,
  calculateChildAge,
  dateLocalISO,
} from '../domain/familySpaceCore';
import { ThreeDIcon } from './ThreeDVisuals';

interface GoogleDriveSectionProps {
  state: FamilySpaceState;
  language: LanguageCode;
  onRestoreFromDrive: (restoredState: FamilySpaceState) => void;
  onShowToast: (msg: string) => void;
}

type PendingConfirmation =
  | {
      type: 'delete_drive_file';
      file: DriveFileItem;
    }
  | {
      type: 'overwrite_drive_file';
      file: DriveFileItem;
    }
  | {
      type: 'overwrite_project_zip';
      file: DriveFileItem;
    }
  | {
      type: 'restore_from_drive';
      file: DriveFileItem;
    };

const SESSION_META_STORAGE_KEY = 'family-space-drive-session-meta-v1';

interface LocalSessionSyncMeta {
  sessionNumber: number;
  sessionNotes: string;
  lastSyncedAt: string | null;
  linkedSessionFileId: string | null;
  linkedSessionFileName: string | null;
  linkedZipFileId: string | null;
  linkedZipFileName: string | null;
}

export const GoogleDriveSection: React.FC<GoogleDriveSectionProps> = ({
  state,
  language,
  onRestoreFromDrive,
  onShowToast,
}) => {
  const isEn = language === 'en';
  const [needsAuth, setNeedsAuth] = useState<boolean>(true);
  const [user, setUser] = useState<User | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [files, setFiles] = useState<DriveFileItem[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState<boolean>(false);
  const [isMutating, setIsMutating] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [onlyFamilyBackups, setOnlyFamilyBackups] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirmation | null>(null);
  const [showLiveJsonEditor, setShowLiveJsonEditor] = useState<boolean>(false);
  const [customJsonDraft, setCustomJsonDraft] = useState<string>('');

  const [sessionMeta, setSessionMeta] = useState<LocalSessionSyncMeta>(() => {
    try {
      const raw = localStorage.getItem(SESSION_META_STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw) as LocalSessionSyncMeta;
      }
    } catch {
      // ignore storage errors
    }
    return {
      sessionNumber: 1,
      sessionNotes:
        'جلسة تطوير مساحة الأسرة: تحديث الهوية البصرية، فصل أقسام الطب والريلز والمجتمع والمحادثات والمساعد الذكي، وإتمام معالج التسجيل والمدن.',
      lastSyncedAt: null,
      linkedSessionFileId: null,
      linkedSessionFileName: null,
      linkedZipFileId: null,
      linkedZipFileName: null,
    };
  });

  useEffect(() => {
    try {
      localStorage.setItem(SESSION_META_STORAGE_KEY, JSON.stringify(sessionMeta));
    } catch {
      // ignore storage errors
    }
  }, [sessionMeta]);

  const buildEditableSessionEnvelope = useCallback(
    (nextSessionNumber: number = sessionMeta.sessionNumber): EditableProjectSessionEnvelope => {
      return {
        projectTitle: 'Family Space — مساحة الأسرة (Editable Project & Session State)',
        version: '2.5.0-demo',
        sessionNumber: nextSessionNumber,
        lastUpdatedISO: new Date().toISOString(),
        sessionNotes: sessionMeta.sessionNotes,
        editableConfig: {
          country: state.country,
          city: state.city || (state.country === 'SA' ? 'الرياض' : 'القاهرة'),
          currency: state.currency,
          parentName: state.parentName,
          language: state.language,
        },
        appState: state,
      };
    },
    [sessionMeta.sessionNotes, sessionMeta.sessionNumber, state]
  );

  const fetchFiles = useCallback(
    async (queryText: string = searchQuery, filterBackups: boolean = onlyFamilyBackups) => {
      setIsLoadingFiles(true);
      setErrorMessage(null);
      try {
        const effectiveQuery = filterBackups
          ? queryText.trim()
            ? `Family_Space ${queryText.trim()}`
            : 'Family_Space'
          : queryText.trim();
        const items = await listDriveFiles(effectiveQuery, 25);
        setFiles(items);
        setNeedsAuth(false);

        // Automatically link existing editable session file & project zip if found in Drive
        const foundSessionFile = items.find(
          (f) =>
            f.name === 'Family_Space_Editable_Session.json' ||
            f.name.startsWith('Family_Space_Editable_Session')
        );
        const foundZipFile = items.find(
          (f) =>
            f.name === 'Family_Space_Complete_Project.zip' ||
            f.name === 'Family_Space_Project_Updated.zip'
        );

        if (foundSessionFile || foundZipFile) {
          setSessionMeta((prev) => ({
            ...prev,
            linkedSessionFileId: foundSessionFile ? foundSessionFile.id : prev.linkedSessionFileId,
            linkedSessionFileName: foundSessionFile
              ? foundSessionFile.name
              : prev.linkedSessionFileName,
            linkedZipFileId: foundZipFile ? foundZipFile.id : prev.linkedZipFileId,
            linkedZipFileName: foundZipFile ? foundZipFile.name : prev.linkedZipFileName,
          }));
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg === 'NEEDS_AUTH') {
          setNeedsAuth(true);
        } else {
          setErrorMessage(
            isEn
              ? `Could not load Google Drive files: ${msg}`
              : `تعذر تحميل ملفات Google Drive: ${msg}`
          );
        }
      } finally {
        setIsLoadingFiles(false);
      }
    },
    [isEn, onlyFamilyBackups, searchQuery]
  );

  useEffect(() => {
    const unsubscribe = initAuth(
      (authedUser) => {
        setUser(authedUser);
        setNeedsAuth(false);
        fetchFiles('', false);
      },
      () => {
        setUser(null);
        setNeedsAuth(true);
        setFiles([]);
      }
    );
    return () => unsubscribe();
  }, [fetchFiles]);

  const linkedSessionDriveFile = useMemo(
    () =>
      files.find((f) => f.id === sessionMeta.linkedSessionFileId) ||
      files.find((f) => f.name === 'Family_Space_Editable_Session.json') ||
      null,
    [files, sessionMeta.linkedSessionFileId]
  );

  const linkedZipDriveFile = useMemo(
    () =>
      files.find((f) => f.id === sessionMeta.linkedZipFileId) ||
      files.find((f) => f.name === 'Family_Space_Complete_Project.zip') ||
      null,
    [files, sessionMeta.linkedZipFileId]
  );

  const handleLogin = async () => {
    setIsLoggingIn(true);
    setErrorMessage(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setNeedsAuth(false);
        onShowToast(
          isEn
            ? `Connected to Google Drive as ${result.user.displayName || result.user.email}`
            : `تم الربط مع Google Drive بحساب ${result.user.displayName || result.user.email}`
        );
        await fetchFiles(searchQuery, onlyFamilyBackups);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(
        isEn ? `Google Sign-In failed: ${msg}` : `تعذر تسجيل الدخول عبر Google: ${msg}`
      );
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await logoutGoogleDrive();
    setUser(null);
    setNeedsAuth(true);
    setFiles([]);
    onShowToast(
      isEn ? 'Signed out of Google Drive' : 'تم تسجيل الخروج من Google Drive'
    );
  };

  // Upload Full Project Bundle (ZIP + Editable Session File + Standalone HTML) for the first time
  const handleUploadFullProjectAndEditableSession = async () => {
    setIsMutating(true);
    setErrorMessage(null);
    try {
      // 1. Upload Complete Project Source Archive (.zip)
      const zipBlob = await fetchLocalProjectArchiveBlob();
      const uploadedZip = await createDriveFile(
        'Family_Space_Complete_Project.zip',
        zipBlob,
        'application/zip',
        `Family Space Complete Source & Demo Archive — Session #${sessionMeta.sessionNumber}`
      );

      // 2. Upload Editable Session Workspace File (.json) that can be updated after every session
      const envelope = buildEditableSessionEnvelope(sessionMeta.sessionNumber);
      const uploadedSession = await createDriveFile(
        'Family_Space_Editable_Session.json',
        JSON.stringify(envelope, null, 2),
        'application/json',
        `Editable Family Space Project & Session State — Session #${sessionMeta.sessionNumber}`
      );

      // 3. Upload Standalone HTML Prototype (.html)
      const htmlBlob = await fetchLocalStandalonePrototypeBlob();
      await createDriveFile(
        'Family_Space_Standalone_Demo.html',
        htmlBlob,
        'text/html',
        `Standalone Self-Contained HTML Demo — Session #${sessionMeta.sessionNumber}`
      );

      setSessionMeta((prev) => ({
        ...prev,
        lastSyncedAt: new Date().toISOString(),
        linkedSessionFileId: uploadedSession.id,
        linkedSessionFileName: uploadedSession.name,
        linkedZipFileId: uploadedZip.id,
        linkedZipFileName: uploadedZip.name,
      }));

      onShowToast(
        isEn
          ? '✓ Uploaded Full Project Archive (.zip), Standalone HTML & Editable Session file to Google Drive!'
          : '✓ تم رفع ملف المشروع الكامل (ZIP) والنسخة المستقلة (HTML) وملف الجلسة القابل للتعديل إلى Google Drive بنجاح!'
      );
      await fetchFiles(searchQuery, onlyFamilyBackups);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg === 'NEEDS_AUTH') {
        setNeedsAuth(true);
      } else {
        setErrorMessage(msg);
      }
    } finally {
      setIsMutating(false);
    }
  };

  const handleCreateNewBackupOnDrive = async () => {
    setIsMutating(true);
    setErrorMessage(null);
    try {
      const fileName = `Family_Space_Session_${sessionMeta.sessionNumber}_${dateLocalISO(new Date())}.json`;
      const envelope = buildEditableSessionEnvelope(sessionMeta.sessionNumber);
      const payload = JSON.stringify(envelope, null, 2);
      const created = await createDriveFile(
        fileName,
        payload,
        'application/json',
        sessionMeta.sessionNotes
      );
      setSessionMeta((prev) => ({
        ...prev,
        lastSyncedAt: new Date().toISOString(),
        linkedSessionFileId: created.id,
        linkedSessionFileName: created.name,
      }));
      onShowToast(
        isEn
          ? `Saved '${created.name}' to your Google Drive`
          : `تم حفظ ملف الجلسة "${created.name}" في Google Drive`
      );
      await fetchFiles(searchQuery, onlyFamilyBackups);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg === 'NEEDS_AUTH') {
        setNeedsAuth(true);
      } else {
        setErrorMessage(msg);
      }
    } finally {
      setIsMutating(false);
    }
  };

  const handleExportChildReportToDrive = async () => {
    setIsMutating(true);
    setErrorMessage(null);
    try {
      const lines: string[] = [
        `# Family Space (مساحة الأسرة) — Child Growth, Routine & Session Summary`,
        `Date: ${dateLocalISO(new Date())} | Session #${sessionMeta.sessionNumber}`,
        `Family / Parent: ${state.parentName} (${state.country} · ${state.city || '—'} · ${state.currency})`,
        `Session Notes: ${sessionMeta.sessionNotes}`,
        ``,
        `## Children Profiles (${state.kids.length})`,
      ];

      state.kids.forEach((kid) => {
        const age = calculateChildAge(kid.birth, language);
        lines.push(
          `- **${kid.name}** (${age.label} · ${age.stageTitle})`,
          `  - Interests: ${kid.interests || '—'}`,
          `  - Growth: Height ${kid.growthHeightCm || '—'} cm | Weight ${kid.growthWeightKg || '—'} kg`,
          `  - Vaccinations: ${kid.vaccinationsNote || '—'}`
        );
      });

      lines.push(``, `## Daily Routine Tasks (${state.tasks.length})`);
      state.tasks.forEach((t) => {
        lines.push(`- [${t.done ? 'x' : ' '}] ${t.name} (${t.time} · ${t.owner})`);
      });

      const fileName = `Family_Space_Report_${dateLocalISO(new Date())}.md`;
      const created = await createDriveFile(fileName, lines.join('\n'), 'text/markdown');
      onShowToast(
        isEn
          ? `Exported family report '${created.name}' to Google Drive`
          : `تم تصدير تقرير الأسرة "${created.name}" إلى Google Drive`
      );
      await fetchFiles(searchQuery, onlyFamilyBackups);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg === 'NEEDS_AUTH') {
        setNeedsAuth(true);
      } else {
        setErrorMessage(msg);
      }
    } finally {
      setIsMutating(false);
    }
  };

  const handleUploadCustomDocument = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsMutating(true);
    setErrorMessage(null);
    try {
      const uploaded = await createDriveFile(
        file.name,
        file,
        file.type || 'application/octet-stream'
      );
      onShowToast(
        isEn
          ? `Uploaded '${uploaded.name}' to Google Drive`
          : `تم رفع الملف "${uploaded.name}" إلى Google Drive`
      );
      await fetchFiles(searchQuery, onlyFamilyBackups);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg === 'NEEDS_AUTH') {
        setNeedsAuth(true);
      } else {
        setErrorMessage(msg);
      }
    } finally {
      setIsMutating(false);
      e.target.value = '';
    }
  };

  const handleApplyInlineJsonDraft = () => {
    const result = validateImportedJson(customJsonDraft);
    if (!result.valid || !result.data) {
      setErrorMessage(
        result.error ||
          (isEn ? 'Invalid JSON structure' : 'صيغة JSON غير صالحة للتطبيق')
      );
      return;
    }
    onRestoreFromDrive(result.data);
    if (result.sessionMeta) {
      setSessionMeta((prev) => ({
        ...prev,
        sessionNumber: result.sessionMeta?.sessionNumber ?? prev.sessionNumber,
        sessionNotes: result.sessionMeta?.sessionNotes ?? prev.sessionNotes,
      }));
    }
    setShowLiveJsonEditor(false);
    onShowToast(
      isEn
        ? '✓ Applied edited session state locally! You can now sync it to Google Drive.'
        : '✓ تم تطبيق التعديلات على الجلسة الحالية! يمكنك الآن الضغط على تحديث الملف في Google Drive.'
    );
  };

  const executeConfirmedAction = async () => {
    if (!pendingConfirm) return;
    const action = pendingConfirm;
    setPendingConfirm(null);
    setIsMutating(true);
    setErrorMessage(null);

    try {
      if (action.type === 'delete_drive_file') {
        await deleteDriveFileById(action.file.id);
        setFiles((prev) => prev.filter((f) => f.id !== action.file.id));
        onShowToast(
          isEn
            ? `Deleted '${action.file.name}' from Google Drive`
            : `تم حذف الملف "${action.file.name}" من Google Drive`
        );
      } else if (action.type === 'overwrite_drive_file') {
        const nextSessionNum = sessionMeta.sessionNumber + 1;
        const envelope = buildEditableSessionEnvelope(nextSessionNum);
        const payload = JSON.stringify(envelope, null, 2);
        await updateDriveFileContent(
          action.file.id,
          payload,
          'application/json',
          `Updated after Session #${nextSessionNum} — ${sessionMeta.sessionNotes}`
        );
        setSessionMeta((prev) => ({
          ...prev,
          sessionNumber: nextSessionNum,
          lastSyncedAt: new Date().toISOString(),
          linkedSessionFileId: action.file.id,
          linkedSessionFileName: action.file.name,
        }));
        onShowToast(
          isEn
            ? `✓ Updated '${action.file.name}' in Google Drive (Session #${nextSessionNum})`
            : `✓ تم تحديث ملف الجلسة "${action.file.name}" على Google Drive (بعد الجلسة رقم #${nextSessionNum})`
        );
        await fetchFiles(searchQuery, onlyFamilyBackups);
      } else if (action.type === 'overwrite_project_zip') {
        const zipBlob = await fetchLocalProjectArchiveBlob();
        await updateDriveFileContent(
          action.file.id,
          zipBlob,
          'application/zip',
          `Updated Project ZIP after Session #${sessionMeta.sessionNumber}`
        );
        setSessionMeta((prev) => ({
          ...prev,
          lastSyncedAt: new Date().toISOString(),
          linkedZipFileId: action.file.id,
          linkedZipFileName: action.file.name,
        }));
        onShowToast(
          isEn
            ? `✓ Updated complete project archive '${action.file.name}' on Google Drive!`
            : `✓ تم تحديث حزمة المشروع الكاملة "${action.file.name}" على Google Drive بنجاح!`
        );
        await fetchFiles(searchQuery, onlyFamilyBackups);
      } else if (action.type === 'restore_from_drive') {
        const rawText = await downloadDriveFileText(action.file.id);
        const validation = validateImportedJson(rawText);
        if (!validation.valid || !validation.data) {
          setErrorMessage(
            validation.error ||
              (isEn
                ? 'Selected file is not a valid Family Space JSON backup.'
                : 'الملف المختار ليس نسخة احتياطية أو ملف جلسة صالحًا لمنصة مساحة الأسرة.')
          );
          return;
        }
        onRestoreFromDrive(validation.data);
        if (validation.sessionMeta) {
          setSessionMeta((prev) => ({
            ...prev,
            sessionNumber: validation.sessionMeta?.sessionNumber ?? prev.sessionNumber,
            sessionNotes: validation.sessionMeta?.sessionNotes ?? prev.sessionNotes,
            linkedSessionFileId: action.file.id,
            linkedSessionFileName: action.file.name,
          }));
        }
        onShowToast(
          isEn
            ? `Restored Family Space session from '${action.file.name}'`
            : `تمت استعادة جلسة وبيانات المشروع من "${action.file.name}" بنجاح`
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg === 'NEEDS_AUTH') {
        setNeedsAuth(true);
      } else {
        setErrorMessage(msg);
      }
    } finally {
      setIsMutating(false);
    }
  };

  return (
    <div
      id="google-drive-integration-card"
      className="rounded-[22px] border-2 border-[var(--color-accent)]/40 bg-[var(--color-surface)] p-5 sm:p-6 space-y-5 shadow-xs"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <ThreeDIcon id="settings" size={42} />
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-[var(--color-accent-soft)] text-[var(--color-role-text)] mb-1">
              <span>☁️ Google Drive Workspace Sync</span>
              <span>·</span>
              <span>
                {isEn
                  ? `Session #${sessionMeta.sessionNumber}`
                  : `الجلسة رقم #${sessionMeta.sessionNumber}`}
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-extrabold text-[var(--color-text)]">
              {isEn
                ? 'Upload Full Project to Google Drive & Update After Every Session'
                : 'رفع ملف المشروع الكامل على Google Drive وتحديثه بعد كل جلسة'}
            </h3>
            <p className="text-xs text-[var(--color-muted)] leading-relaxed">
              {isEn
                ? 'Upload the complete deployable source package (.zip), standalone HTML demo, and editable session state (.json) to your Google Drive, and update them in-place after every session with your permission.'
                : 'ارفع حزمة المشروع الكاملة (ZIP) والنسخة المستقلة (HTML) وملف الجلسة القابل للتعديل (JSON) مباشرة على Google Drive، وحدّث نفس الملف بعد كل جلسة عمل بإذنك.'}
            </p>
          </div>
        </div>

        {!needsAuth && user && (
          <div className="flex items-center gap-2.5 bg-[var(--color-control-muted)] px-3.5 py-2 rounded-xl border border-[var(--color-border)]">
            <div className="text-xs">
              <div className="font-bold text-[var(--color-text)]">
                {user.displayName || user.email}
              </div>
              <div className="text-[11px] text-emerald-700 font-semibold">
                {isEn ? '● Connected to Google Drive' : '● متصل بحساب Google Drive'}
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="px-2.5 py-1 rounded-lg text-xs font-bold border border-[var(--color-border)] bg-[var(--color-surface)] text-red-700 hover:bg-red-50"
            >
              {isEn ? 'Sign Out' : 'خروج'}
            </button>
          </div>
        )}
      </div>

      {errorMessage && (
        <div
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-800"
          role="alert"
        >
          {errorMessage}
        </div>
      )}

      {/* Official Sign in with Google Button when not authenticated */}
      {needsAuth ? (
        <div className="rounded-2xl border border-dashed border-[var(--color-accent)]/50 bg-gradient-to-br from-[var(--color-hero-start)]/60 via-[var(--color-surface)] to-[var(--color-hero-end)]/60 p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="text-sm sm:text-base font-extrabold text-[var(--color-text)]">
              {isEn
                ? 'Sign in with Google to Upload the Full Project & Enable Post-Session Updates'
                : 'سجّل الدخول عبر Google لرفع ملف المشروع الكامل وتفعيل التحديث بعد كل جلسة'}
            </div>
            <p className="text-xs text-[var(--color-muted)] leading-relaxed">
              {isEn
                ? 'Once signed in, you can upload the complete Family Space project archive (.zip) and editable session state (.json) with one click, and overwrite/update the same file on Google Drive at the end of every session.'
                : 'بمجرد تسجيل الدخول، يمكنك بضغطة واحدة رفع ملف المشروع الكامل (Family_Space_Complete_Project.zip) مع ملف الجلسة القابل للتعديل (Family_Space_Editable_Session.json)، وتحديثه مباشرة بعد كل جلسة أو استعادته في أي وقت.'}
            </p>
          </div>

          <button
            id="google-drive-signin-btn"
            type="button"
            onClick={handleLogin}
            disabled={isLoggingIn}
            className="gsi-material-button shrink-0"
          >
            <div className="gsi-material-button-state"></div>
            <div className="gsi-material-button-content-wrapper">
              <div className="gsi-material-button-icon">
                <svg
                  version="1.1"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 48 48"
                  xmlnsXlink="http://www.w3.org/1999/xlink"
                  style={{ display: 'block' }}
                >
                  <path
                    fill="#EA4335"
                    d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                  ></path>
                  <path
                    fill="#4285F4"
                    d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                  ></path>
                  <path
                    fill="#FBBC05"
                    d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                  ></path>
                  <path
                    fill="#34A853"
                    d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                  ></path>
                  <path fill="none" d="M0 0h48v48H0z"></path>
                </svg>
              </div>
              <span className="gsi-material-button-contents">
                {isLoggingIn
                  ? isEn
                    ? 'Signing in...'
                    : 'جاري تسجيل الدخول...'
                  : 'Sign in with Google'}
              </span>
              <span style={{ display: 'none' }}>Sign in with Google</span>
            </div>
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Primary Banner: 1-Click Full Project Upload & Post-Session Editable Sync */}
          <div className="rounded-2xl border border-[var(--color-accent)]/30 bg-gradient-to-br from-[var(--color-hero-start)]/50 via-[var(--color-surface)] to-[var(--color-hero-end)]/50 p-4 sm:p-5 space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <h4 className="text-sm sm:text-base font-extrabold text-[var(--color-text)]">
                  {isEn
                    ? '🚀 Step 1: Upload Complete Project & Sync Session Edits'
                    : '🚀 الخطوة ١: رفع ملف المشروع الكامل ومزامنة التعديلات بعد كل جلسة'}
                </h4>
                <p className="text-xs text-[var(--color-muted)] leading-relaxed">
                  {isEn
                    ? 'Uploads Family_Space_Complete_Project.zip (full source code), Family_Space_Standalone_Demo.html, and Family_Space_Editable_Session.json so you can update them after every session.'
                    : 'يرفع حزمة الكود المصدري الكاملة (Family_Space_Complete_Project.zip) + النسخة المستقلة (HTML) + ملف الجلسة القابل للتعديل (Family_Space_Editable_Session.json) ليبقى قابلًا للتحديث بعد كل جلسة.'}
                </p>
              </div>

              {sessionMeta.lastSyncedAt && (
                <span className="px-3 py-1 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold tabular-nums">
                  {isEn ? 'Last Synced: ' : 'آخر مزامنة للجلسة: '}
                  {new Date(sessionMeta.lastSyncedAt).toLocaleString(
                    isEn ? 'en-US' : 'ar-EG'
                  )}
                </span>
              )}
            </div>

            {/* Session Notes & Session Number Editor before syncing */}
            <div className="grid grid-cols-1 md:grid-cols-[150px_1fr] gap-3 bg-[var(--color-surface)]/90 p-3.5 rounded-xl border border-[var(--color-border)]">
              <div>
                <label
                  htmlFor="driveSessionNumberInput"
                  className="block text-[11px] font-bold text-[var(--color-muted)] mb-1"
                >
                  {isEn ? 'Session Number #' : 'رقم الجلسة الحالية #'}
                </label>
                <input
                  id="driveSessionNumberInput"
                  type="number"
                  min={1}
                  value={sessionMeta.sessionNumber}
                  onChange={(e) =>
                    setSessionMeta((prev) => ({
                      ...prev,
                      sessionNumber: Math.max(1, Number(e.target.value) || 1),
                    }))
                  }
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-control-bg)] px-3 py-2 text-xs font-extrabold text-[var(--color-text)] tabular-nums"
                />
              </div>

              <div>
                <label
                  htmlFor="driveSessionNotesInput"
                  className="block text-[11px] font-bold text-[var(--color-muted)] mb-1"
                >
                  {isEn
                    ? 'Session Changelog / Editable Notes (Saved with project on Drive)'
                    : 'ملخص تعديلات الجلسة وملاحظات التطوير (يُحفظ داخل ملف المشروع على Drive)'}
                </label>
                <input
                  id="driveSessionNotesInput"
                  type="text"
                  value={sessionMeta.sessionNotes}
                  onChange={(e) =>
                    setSessionMeta((prev) => ({
                      ...prev,
                      sessionNotes: e.target.value,
                    }))
                  }
                  placeholder={
                    isEn
                      ? 'Describe what changed in this session...'
                      : 'اكتب ملاحظات أو تعديلات هذه الجلسة ليتم حفظها في ملف الدرايف...'
                  }
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-control-bg)] px-3 py-2 text-xs text-[var(--color-text)]"
                />
              </div>
            </div>

            {/* Primary Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                id="upload-full-project-drive-btn"
                type="button"
                disabled={isMutating}
                onClick={handleUploadFullProjectAndEditableSession}
                className="px-4 py-2.5 rounded-xl text-xs font-extrabold bg-[var(--color-accent)] text-[var(--color-accent-contrast)] shadow-xs disabled:opacity-50"
              >
                {isMutating
                  ? isEn
                    ? '⏳ Uploading Project to Drive...'
                    : '⏳ جاري رفع المشروع الكامل على Drive...'
                  : isEn
                  ? '📦 Upload Complete Project (ZIP + Editable Session) to Drive'
                  : '📦 رفع ملف المشروع الكامل (ZIP + ملف الجلسة القابل للتعديل) على Drive'}
              </button>

              {linkedSessionDriveFile && (
                <button
                  id="update-session-drive-btn"
                  type="button"
                  disabled={isMutating}
                  onClick={() =>
                    setPendingConfirm({
                      type: 'overwrite_drive_file',
                      file: linkedSessionDriveFile,
                    })
                  }
                  className="px-4 py-2.5 rounded-xl text-xs font-extrabold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {isEn
                    ? `🔄 Update Editable Session on Drive (After Session #${sessionMeta.sessionNumber})`
                    : `🔄 تحديث ملف الجلسة القابل للتعديل على Drive (بعد الجلسة #${sessionMeta.sessionNumber})`}
                </button>
              )}

              {linkedZipDriveFile && (
                <button
                  type="button"
                  disabled={isMutating}
                  onClick={() =>
                    setPendingConfirm({
                      type: 'overwrite_project_zip',
                      file: linkedZipDriveFile,
                    })
                  }
                  className="px-3.5 py-2.5 rounded-xl text-xs font-bold border border-indigo-200 bg-indigo-50 text-indigo-900 disabled:opacity-50"
                >
                  {isEn
                    ? '🔄 Update Project ZIP on Drive'
                    : '🔄 تحديث ملف المشروع المضغوط (ZIP) على Drive'}
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  const nextOpen = !showLiveJsonEditor;
                  if (nextOpen) {
                    setCustomJsonDraft(
                      JSON.stringify(
                        buildEditableSessionEnvelope(sessionMeta.sessionNumber),
                        null,
                        2
                      )
                    );
                  }
                  setShowLiveJsonEditor(nextOpen);
                }}
                className="px-3.5 py-2.5 rounded-xl text-xs font-bold border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)]"
              >
                {showLiveJsonEditor
                  ? isEn
                    ? 'Close Live Session Editor'
                    : 'إغلاق محرر الجلسة المباشر'
                  : isEn
                  ? '✏️ Edit Project Session JSON Directly'
                  : '✏️ تعديل محتوى ملف الجلسة مباشرةً قبل الرفع'}
              </button>
            </div>

            {/* Active Linked Drive Files Status Strip */}
            {(linkedSessionDriveFile || linkedZipDriveFile) && (
              <div className="pt-2 border-t border-[var(--color-border)]/70 flex flex-wrap items-center gap-3 text-xs">
                {linkedSessionDriveFile && (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]">
                    <span className="font-bold text-emerald-800">
                      🟢 {linkedSessionDriveFile.name}
                    </span>
                    {linkedSessionDriveFile.webViewLink && (
                      <a
                        href={linkedSessionDriveFile.webViewLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[var(--color-accent)] font-extrabold underline"
                      >
                        {isEn ? 'Open in Drive ↗' : 'فتح في Drive ↗'}
                      </a>
                    )}
                  </div>
                )}

                {linkedZipDriveFile && (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]">
                    <span className="font-bold text-indigo-900">
                      📦 {linkedZipDriveFile.name}
                    </span>
                    {linkedZipDriveFile.webViewLink && (
                      <a
                        href={linkedZipDriveFile.webViewLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[var(--color-accent)] font-extrabold underline"
                      >
                        {isEn ? 'Open in Drive ↗' : 'فتح في Drive ↗'}
                      </a>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Direct In-App Session JSON Editor */}
            {showLiveJsonEditor && (
              <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-xs font-extrabold text-[var(--color-text)]">
                      {isEn
                        ? '✏️ Interactive Project & Session State Editor'
                        : '✏️ محرر ملف المشروع والجلسة التفاعلي (قابل للتعديل بعد كل جلسة)'}
                    </div>
                    <p className="text-[11px] text-[var(--color-muted)]">
                      {isEn
                        ? 'Modify any value below, apply locally, and click Update on Drive to push your session changes.'
                        : 'عدّل أي بيانات أو ملاحظات في ملف الجلسة أدناه، ثم اضغط «تطبيق التعديلات» متبوعًا بـ «تحديث ملف الجلسة على Drive».'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleApplyInlineJsonDraft}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-extrabold bg-[var(--color-accent)] text-[var(--color-accent-contrast)]"
                  >
                    {isEn ? '✓ Apply Edits to Current Session' : '✓ تطبيق التعديلات على الجلسة الحالية'}
                  </button>
                </div>
                <textarea
                  dir="ltr"
                  value={customJsonDraft}
                  onChange={(e) => setCustomJsonDraft(e.target.value)}
                  rows={10}
                  aria-label={isEn ? 'Editable Session JSON' : 'كود ملف الجلسة القابل للتعديل'}
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-control-bg)] p-3 font-mono text-xs text-[var(--color-text)]"
                />
              </div>
            )}
          </div>

          {/* Secondary Quick Cloud Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              disabled={isMutating}
              onClick={handleCreateNewBackupOnDrive}
              className="px-3.5 py-2 rounded-xl text-xs font-bold border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] disabled:opacity-50"
            >
              {isEn
                ? '☁️ Save Snapshot as New File on Drive'
                : '☁️ حفظ نسخة جلسة منفصلة بتاريخ اليوم'}
            </button>

            <button
              type="button"
              disabled={isMutating}
              onClick={handleExportChildReportToDrive}
              className="px-3.5 py-2 rounded-xl text-xs font-bold border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] disabled:opacity-50"
            >
              {isEn
                ? '📄 Export Session & Children Report (.md)'
                : '📄 تصدير تقرير الجلسة ونمو الأطفال (.md)'}
            </button>

            <label className="px-3.5 py-2 rounded-xl text-xs font-bold border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] cursor-pointer">
              {isEn ? '📎 Upload Custom File to Drive' : '📎 رفع ملف أو مستند إضافي لـ Drive'}
              <input
                type="file"
                onChange={handleUploadCustomDocument}
                disabled={isMutating}
                className="sr-only"
              />
            </label>

            <button
              type="button"
              disabled={isLoadingFiles || isMutating}
              onClick={() => fetchFiles(searchQuery, onlyFamilyBackups)}
              className="px-3 py-2 rounded-xl text-xs font-semibold border border-[var(--color-border)] bg-[var(--color-control-muted)] text-[var(--color-text)]"
            >
              {isLoadingFiles
                ? isEn
                  ? 'Refreshing...'
                  : 'جاري التحديث...'
                : isEn
                ? '↻ Refresh Drive Files'
                : '↻ تحديث قائمة ملفات Drive'}
            </button>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-wrap items-center gap-2.5">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  fetchFiles(searchQuery, onlyFamilyBackups);
                }
              }}
              placeholder={
                isEn
                  ? 'Search your Google Drive project files...'
                  : 'ابحث في ملفات المشروع على Google Drive (مثلًا: Family_Space)...'
              }
              aria-label={isEn ? 'Search Google Drive files' : 'البحث في ملفات Google Drive'}
              className="flex-1 min-w-[210px] rounded-xl border border-[var(--color-border)] bg-[var(--color-control-bg)] px-3 py-2 text-xs text-[var(--color-text)]"
            />
            <button
              type="button"
              onClick={() => fetchFiles(searchQuery, onlyFamilyBackups)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)]"
            >
              {isEn ? 'Search' : 'بحث'}
            </button>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text)] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={onlyFamilyBackups}
                onChange={(e) => {
                  const next = e.target.checked;
                  setOnlyFamilyBackups(next);
                  fetchFiles(searchQuery, next);
                }}
              />
              <span>
                {isEn ? 'Only Family Space files' : 'عرض ملفات مساحة الأسرة فقط'}
              </span>
            </label>
          </div>

          {/* Files List */}
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-control-bg)] divide-y divide-[var(--color-border)] max-h-[340px] overflow-y-auto">
            {isLoadingFiles ? (
              <div className="p-6 text-center text-xs text-[var(--color-muted)]">
                {isEn ? 'Loading files from Google Drive...' : 'جاري تحميل ملفات المشروع من Google Drive...'}
              </div>
            ) : files.length === 0 ? (
              <div className="p-6 text-center text-xs text-[var(--color-muted)]">
                {isEn
                  ? 'No project files found yet in your Google Drive. Click "Upload Complete Project (ZIP + Editable Session)" above to upload the full project now.'
                  : 'لا توجد ملفات مرفوعة بعد في Google Drive. اضغط على زر «رفع ملف المشروع الكامل (ZIP + ملف الجلسة القابل للتعديل)» أعلاه لرفع المشروع الآن.'}
              </div>
            ) : (
              files.map((file) => {
                const isJson =
                  file.mimeType === 'application/json' ||
                  file.name.toLowerCase().endsWith('.json');
                const isZip =
                  file.mimeType === 'application/zip' ||
                  file.name.toLowerCase().endsWith('.zip');
                return (
                  <div
                    key={file.id}
                    className="p-3.5 flex flex-wrap items-center justify-between gap-2 hover:bg-[var(--color-control-muted)]/40"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-[var(--color-text)] truncate flex items-center gap-1.5">
                        <span>{isZip ? '📦' : isJson ? '🔄' : '📄'}</span>
                        <span className="truncate">{file.name}</span>
                        {file.id === linkedSessionDriveFile?.id && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            {isEn ? 'Editable Session File' : 'ملف الجلسة القابل للتعديل'}
                          </span>
                        )}
                        {file.id === linkedZipDriveFile?.id && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-50 text-indigo-800 border border-indigo-200">
                            {isEn ? 'Full Project ZIP' : 'حزمة المشروع الكامل'}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[var(--color-muted)] tabular-nums mt-0.5">
                        {file.modifiedTime
                          ? new Date(file.modifiedTime).toLocaleString(
                              isEn ? 'en-US' : 'ar-EG'
                            )
                          : ''}{' '}
                        · {file.mimeType}
                        {file.description ? ` · ${file.description}` : ''}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                      {file.webViewLink && (
                        <a
                          href={file.webViewLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 rounded-lg text-[11px] font-semibold border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)]"
                        >
                          {isEn ? 'Open in Drive ↗' : 'فتح في Drive ↗'}
                        </a>
                      )}

                      {isJson && (
                        <>
                          <button
                            type="button"
                            disabled={isMutating}
                            onClick={() =>
                              setPendingConfirm({ type: 'restore_from_drive', file })
                            }
                            className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200"
                          >
                            {isEn ? 'Load Session' : 'تحميل الجلسة للتعديل'}
                          </button>

                          <button
                            type="button"
                            disabled={isMutating}
                            onClick={() =>
                              setPendingConfirm({ type: 'overwrite_drive_file', file })
                            }
                            className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-200"
                          >
                            {isEn ? 'Update After Session' : 'تحديث بعد الجلسة'}
                          </button>
                        </>
                      )}

                      {isZip && (
                        <button
                          type="button"
                          disabled={isMutating}
                          onClick={() =>
                            setPendingConfirm({ type: 'overwrite_project_zip', file })
                          }
                          className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-indigo-50 text-indigo-900 border border-indigo-200"
                        >
                          {isEn ? 'Update Project ZIP' : 'تحديث حزمة ZIP'}
                        </button>
                      )}

                      <button
                        type="button"
                        disabled={isMutating}
                        onClick={() =>
                          setPendingConfirm({ type: 'delete_drive_file', file })
                        }
                        className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-red-50 text-red-700 border border-red-200"
                      >
                        {isEn ? 'Delete' : 'حذف'}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Mandatory Confirmation Dialog for Destructive / Mutating Operations */}
      {pendingConfirm && (
        <div
          className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="drive-confirm-title"
        >
          <div className="w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-4 shadow-xl">
            <h4
              id="drive-confirm-title"
              className="text-base font-extrabold text-[var(--color-text)]"
            >
              {pendingConfirm.type === 'delete_drive_file'
                ? isEn
                  ? `Delete '${pendingConfirm.file.name}' from Google Drive?`
                  : `حذف الملف "${pendingConfirm.file.name}" من Google Drive؟`
                : pendingConfirm.type === 'overwrite_drive_file'
                ? isEn
                  ? `Update session file '${pendingConfirm.file.name}' in Google Drive?`
                  : `تحديث ملف الجلسة "${pendingConfirm.file.name}" في Google Drive بعد هذه الجلسة؟`
                : pendingConfirm.type === 'overwrite_project_zip'
                ? isEn
                  ? `Overwrite project archive '${pendingConfirm.file.name}' in Google Drive?`
                  : `تحديث واستبدال حزمة المشروع الكاملة "${pendingConfirm.file.name}" في Google Drive؟`
                : isEn
                ? `Restore Family Space session from '${pendingConfirm.file.name}'?`
                : `استعادة وتحميل جلسة المشروع من "${pendingConfirm.file.name}"؟`}
            </h4>

            <p className="text-xs text-[var(--color-muted)] leading-relaxed">
              {pendingConfirm.type === 'delete_drive_file'
                ? isEn
                  ? `This will permanently delete '${pendingConfirm.file.name}' from your Google Drive. This action cannot be undone.`
                  : `سيؤدي هذا الإجراء إلى حذف الملف "${pendingConfirm.file.name}" نهائيًا من حسابك في Google Drive ولا يمكن التراجع عنه.`
                : pendingConfirm.type === 'overwrite_drive_file'
                ? isEn
                  ? `This will update '${pendingConfirm.file.name}' in your Google Drive with Session #${sessionMeta.sessionNumber + 1} (${state.kids.length} children, ${state.tasks.length} tasks, ${state.events.length} events, and your session notes).`
                  : `سيتم تحديث الملف "${pendingConfirm.file.name}" في Google Drive ببيانات الجلسة رقم #${sessionMeta.sessionNumber + 1} (${state.kids.length} أطفال، ${state.tasks.length} مهام، ${state.events.length} مواعيد، وملاحظات الجلسة الحالية).`
                : pendingConfirm.type === 'overwrite_project_zip'
                ? isEn
                  ? `This will overwrite '${pendingConfirm.file.name}' in your Google Drive with the latest complete Family Space source code and demo archive.`
                  : `سيتم تحديث الملف المضغوط "${pendingConfirm.file.name}" في Google Drive بأحدث نسخة كاملة من ملفات المشروع والكود المصدري.`
                : isEn
                ? `This will load the session state stored in '${pendingConfirm.file.name}' into the application so you can continue editing.`
                : `سيتم تحميل بيانات الجلسة المحفوظة داخل "${pendingConfirm.file.name}" إلى التطبيق لاستكمال التعديل عليها.`}
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setPendingConfirm(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)]"
              >
                {isEn ? 'Cancel' : 'إلغاء'}
              </button>
              <button
                type="button"
                onClick={executeConfirmedAction}
                className={`px-4 py-2 rounded-xl text-xs font-bold text-white ${
                  pendingConfirm.type === 'delete_drive_file'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-[var(--color-accent)]'
                }`}
              >
                {pendingConfirm.type === 'delete_drive_file'
                  ? isEn
                    ? 'Confirm Delete'
                    : 'تأكيد الحذف النهائي'
                  : pendingConfirm.type === 'overwrite_drive_file' ||
                    pendingConfirm.type === 'overwrite_project_zip'
                  ? isEn
                    ? 'Confirm Session Update'
                    : 'تأكيد تحديث الملف على Drive'
                  : isEn
                  ? 'Confirm Load Session'
                  : 'تأكيد تحميل الجلسة'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
