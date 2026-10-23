import React, { useState } from 'react';
import { AvatarAccessoryTheme } from '../domain/assetManifest3D';

export type ThreeDIconId =
  | 'home'
  | 'children'
  | 'routine'
  | 'calendar'
  | 'wishes'
  | 'media'
  | 'games'
  | 'services'
  | 'notifications'
  | 'assistant'
  | 'family'
  | 'settings'
  | 'health'
  | 'audio'
  | 'video'
  | 'cart'
  | 'shield'
  | 'star';

interface ThreeDIconProps {
  id: ThreeDIconId;
  size?: number;
  className?: string;
}

/**
 * Cohesive 3D Claymorphism / Volumetric SVG Icon Family.
 * Every icon uses multi-stop radial lighting, inner specular highlight, and soft ambient shadow.
 */
export const ThreeDIcon: React.FC<ThreeDIconProps> = ({ id, size = 28, className = '' }) => {
  const uid = `tdi-${id}-${size}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block shrink-0 select-none ${className}`}
      aria-hidden="true"
    >
      <defs>
        <filter id={`${uid}-shadow`} x="-15%" y="-10%" width="130%" height="135%">
          <feDropShadow dx="0" dy="3" stdDeviation="2.5" floodColor="#1e1b2e" floodOpacity="0.18" />
        </filter>
        <radialGradient id={`${uid}-rose`} cx="32%" cy="26%" r="72%">
          <stop offset="0%" stopColor="#ff9ec7" />
          <stop offset="55%" stopColor="#d85b90" />
          <stop offset="100%" stopColor="#9e3362" />
        </radialGradient>
        <radialGradient id={`${uid}-aqua`} cx="32%" cy="26%" r="72%">
          <stop offset="0%" stopColor="#84f2ff" />
          <stop offset="55%" stopColor="#2bb5c9" />
          <stop offset="100%" stopColor="#147487" />
        </radialGradient>
        <radialGradient id={`${uid}-amber`} cx="32%" cy="26%" r="72%">
          <stop offset="0%" stopColor="#ffe58f" />
          <stop offset="55%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#b45309" />
        </radialGradient>
        <radialGradient id={`${uid}-violet`} cx="32%" cy="26%" r="72%">
          <stop offset="0%" stopColor="#d8b4fe" />
          <stop offset="55%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#5b21b6" />
        </radialGradient>
        <radialGradient id={`${uid}-emerald`} cx="32%" cy="26%" r="72%">
          <stop offset="0%" stopColor="#86efac" />
          <stop offset="55%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#047857" />
        </radialGradient>
        <radialGradient id={`${uid}-cream`} cx="35%" cy="25%" r="75%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="65%" stopColor="#f5ece6" />
          <stop offset="100%" stopColor="#d9c8be" />
        </radialGradient>
      </defs>

      <g filter={`url(#${uid}-shadow)`}>
        {id === 'home' && (
          <>
            <rect x="9" y="21" width="30" height="21" rx="7" fill={`url(#${uid}-cream)`} />
            <path d="M5 23L22.2 8.2C23.2 7.3 24.8 7.3 25.8 8.2L43 23" stroke={`url(#${uid}-rose)`} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
            <rect x="20" y="28" width="8" height="14" rx="4" fill={`url(#${uid}-aqua)`} />
            <ellipse cx="18" cy="14" rx="4" ry="1.8" fill="#fff" fillOpacity="0.55" />
          </>
        )}

        {id === 'children' && (
          <>
            <circle cx="24" cy="25" r="16" fill={`url(#${uid}-amber)`} />
            <circle cx="18.5" cy="23" r="2.3" fill="#2d232e" />
            <circle cx="29.5" cy="23" r="2.3" fill="#2d232e" />
            <path d="M19 30C20.5 32.2 27.5 32.2 29 30" stroke="#9e3362" strokeWidth="2.6" strokeLinecap="round" />
            <path d="M16 12C19 8 29 8 32 12" stroke={`url(#${uid}-rose)`} strokeWidth="5" strokeLinecap="round" />
            <ellipse cx="18" cy="16" rx="4.5" ry="2.2" fill="#fff" fillOpacity="0.55" />
          </>
        )}

        {id === 'routine' && (
          <>
            <circle cx="24" cy="25" r="16" fill={`url(#${uid}-aqua)`} />
            <circle cx="24" cy="25" r="11.5" fill={`url(#${uid}-cream)`} />
            <path d="M24 18V25L29 28" stroke="#9e3362" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
            <rect x="19" y="5" width="10" height="4" rx="2" fill={`url(#${uid}-rose)`} />
            <ellipse cx="18" cy="14" rx="4" ry="1.8" fill="#fff" fillOpacity="0.6" />
          </>
        )}

        {id === 'calendar' && (
          <>
            <rect x="7" y="11" width="34" height="30" rx="8" fill={`url(#${uid}-cream)`} />
            <path d="M7 19C7 14.6 10.6 11 15 11H33C37.4 11 41 14.6 41 19V21H7V19Z" fill={`url(#${uid}-rose)`} />
            <rect x="14" y="6" width="4.5" height="9" rx="2.2" fill={`url(#${uid}-aqua)`} />
            <rect x="29.5" y="6" width="4.5" height="9" rx="2.2" fill={`url(#${uid}-aqua)`} />
            <circle cx="17" cy="28" r="2.8" fill={`url(#${uid}-aqua)`} />
            <circle cx="24" cy="28" r="2.8" fill={`url(#${uid}-rose)`} />
            <circle cx="31" cy="28" r="2.8" fill={`url(#${uid}-amber)`} />
          </>
        )}

        {id === 'wishes' && (
          <>
            <rect x="9" y="20" width="30" height="21" rx="6" fill={`url(#${uid}-rose)`} />
            <rect x="7" y="14" width="34" height="8" rx="4" fill={`url(#${uid}-amber)`} />
            <rect x="21.5" y="14" width="5" height="27" fill={`url(#${uid}-cream)`} />
            <path d="M24 14C19 8 13 10 16 14C19 15 24 14 24 14Z" fill={`url(#${uid}-aqua)`} />
            <path d="M24 14C29 8 35 10 32 14C29 15 24 14 24 14Z" fill={`url(#${uid}-aqua)`} />
          </>
        )}

        {id === 'media' && (
          <>
            <path d="M8 13C8 10.8 9.8 9 12 9H22C23.5 9 24 10.2 24 11.5V37C24 35.8 22.8 35 21 35H12C9.8 35 8 33.2 8 31V13Z" fill={`url(#${uid}-aqua)`} />
            <path d="M40 13C40 10.8 38.2 9 36 9H26C24.5 9 24 10.2 24 11.5V37C24 35.8 25.2 35 27 35H36C38.2 35 40 33.2 40 31V13Z" fill={`url(#${uid}-rose)`} />
            <circle cx="33" cy="21" r="4" fill={`url(#${uid}-amber)`} />
          </>
        )}

        {id === 'games' && (
          <>
            <rect x="6" y="15" width="36" height="22" rx="11" fill={`url(#${uid}-violet)`} />
            <path d="M16 22V30M12 26H20" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" />
            <circle cx="31" cy="23" r="2.6" fill={`url(#${uid}-amber)`} />
            <circle cx="35" cy="28" r="2.6" fill={`url(#${uid}-aqua)`} />
            <ellipse cx="18" cy="18" rx="6" ry="2" fill="#fff" fillOpacity="0.4" />
          </>
        )}

        {id === 'services' && (
          <>
            <path d="M11 17H37L34.5 39C34.2 40.7 32.8 42 31 42H17C15.2 42 13.8 40.7 13.5 39L11 17Z" fill={`url(#${uid}-rose)`} />
            <path d="M17 17V13C17 9.5 20 7 24 7C28 7 31 9.5 31 13V17" stroke={`url(#${uid}-aqua)`} strokeWidth="4" strokeLinecap="round" />
            <circle cx="19" cy="23" r="2.2" fill="#fff" />
            <circle cx="29" cy="23" r="2.2" fill="#fff" />
          </>
        )}

        {id === 'notifications' && (
          <>
            <path d="M12 31V22C12 15.4 17.4 10 24 10C30.6 10 36 15.4 36 22V31L39 35H9L12 31Z" fill={`url(#${uid}-amber)`} />
            <circle cx="24" cy="39" r="4" fill={`url(#${uid}-rose)`} />
            <circle cx="34" cy="13" r="5" fill={`url(#${uid}-rose)`} />
            <ellipse cx="20" cy="16" rx="4" ry="2" fill="#fff" fillOpacity="0.6" />
          </>
        )}

        {id === 'assistant' && (
          <>
            <circle cx="24" cy="21" r="13" fill={`url(#${uid}-amber)`} />
            <rect x="19" y="33" width="10" height="6" rx="3" fill={`url(#${uid}-aqua)`} />
            <ellipse cx="20" cy="15" rx="4.5" ry="2.2" fill="#fff" fillOpacity="0.65" />
          </>
        )}

        {id === 'family' && (
          <>
            <circle cx="16" cy="17" r="6" fill={`url(#${uid}-rose)`} />
            <circle cx="32" cy="17" r="6" fill={`url(#${uid}-aqua)`} />
            <circle cx="24" cy="23" r="5" fill={`url(#${uid}-amber)`} />
            <path d="M7 38C7 32.5 11 29 16 29C21 29 25 32.5 25 38" fill={`url(#${uid}-rose)`} />
            <path d="M23 38C23 32.5 27 29 32 29C37 29 41 32.5 41 38" fill={`url(#${uid}-aqua)`} />
            <path d="M16 40C16 35.5 19.5 32.5 24 32.5C28.5 32.5 32 35.5 32 40" fill={`url(#${uid}-amber)`} />
          </>
        )}

        {id === 'settings' && (
          <>
            <circle cx="24" cy="24" r="15" fill={`url(#${uid}-violet)`} />
            <circle cx="24" cy="24" r="6.5" fill={`url(#${uid}-cream)`} />
            <ellipse cx="19" cy="14" rx="4" ry="1.8" fill="#fff" fillOpacity="0.5" />
          </>
        )}

        {id === 'health' && (
          <>
            <rect x="9" y="11" width="30" height="28" rx="9" fill={`url(#${uid}-emerald)`} />
            <path d="M24 18V32M17 25H31" stroke="#fff" strokeWidth="4.2" strokeLinecap="round" />
            <ellipse cx="18" cy="15" rx="4" ry="1.8" fill="#fff" fillOpacity="0.45" />
          </>
        )}

        {id === 'audio' && (
          <>
            <circle cx="24" cy="24" r="16" fill={`url(#${uid}-violet)`} />
            <path d="M21 17V29C21 31.2 19.2 33 17 33C14.8 33 13 31.2 13 29C13 26.8 14.8 25 17 25C18.2 25 19.2 25.4 20 26V15L32 13V26C32 28.2 30.2 30 28 30C25.8 30 24 28.2 24 26C24 23.8 25.8 22 28 22C29 22 30 22.4 30.5 23V16L21 17Z" fill="#fff" />
          </>
        )}

        {id === 'video' && (
          <>
            <rect x="7" y="11" width="34" height="26" rx="8" fill={`url(#${uid}-rose)`} />
            <path d="M20 18L31 24L20 30V18Z" fill={`url(#${uid}-cream)`} />
            <ellipse cx="16" cy="15" rx="5" ry="1.8" fill="#fff" fillOpacity="0.45" />
          </>
        )}

        {id === 'cart' && (
          <>
            <rect x="10" y="13" width="30" height="20" rx="6" fill={`url(#${uid}-aqua)`} />
            <circle cx="17" cy="38" r="4" fill={`url(#${uid}-rose)`} />
            <circle cx="33" cy="38" r="4" fill={`url(#${uid}-rose)`} />
            <ellipse cx="18" cy="17" rx="5" ry="1.8" fill="#fff" fillOpacity="0.5" />
          </>
        )}

        {(id === 'shield' || id === 'star') && (
          <>
            <circle cx="24" cy="24" r="16" fill={`url(#${uid}-amber)`} />
            <path d="M24 13L27.2 19.8L34.5 20.8L29.2 26L30.5 33.4L24 29.8L17.5 33.4L18.8 26L13.5 20.8L20.8 19.8L24 13Z" fill="#fff" />
          </>
        )}
      </g>
    </svg>
  );
};

interface ThreeDChildAvatarProps {
  name: string;
  gender: 'boy' | 'girl';
  stageCode?: '0-2' | '2-5' | '5-8';
  accessoryTheme?: AvatarAccessoryTheme;
  photoDataUrl?: string;
  useIllustratedAvatar?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * 3D Child Profile Identity Component.
 * - Preserves real uploaded photographs when provided (unless parent explicitly chooses illustrated avatar).
 * - Otherwise renders a distinctive 3D stylized clay portrait tailored to gender, age stage (0-2, 2-5, 5-8),
 *   and chosen 3D personality/accessory theme (astronaut, artist, scientist, athlete, reader, nature).
 */
export const ThreeDChildAvatar: React.FC<ThreeDChildAvatarProps> = ({
  name,
  gender,
  stageCode = '2-5',
  accessoryTheme = 'astronaut',
  photoDataUrl,
  useIllustratedAvatar = false,
  size = 'md',
}) => {
  const dims = size === 'lg' ? 'w-20 h-20' : size === 'sm' ? 'w-11 h-11' : 'w-14 h-14';
  const showRealPhoto = Boolean(photoDataUrl && !useIllustratedAvatar);

  if (showRealPhoto) {
    return (
      <div
        className={`${dims} relative rounded-2xl overflow-hidden border-2 border-white shadow-md shrink-0 bg-[var(--color-control-muted)]`}
        title={name}
      >
        <img
          src={photoDataUrl}
          alt={name}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  const uid = `avatar3d-${gender}-${stageCode}-${accessoryTheme}-${name.length}`;
  const isGirl = gender === 'girl';

  const bgGradient = isGirl
    ? 'linear-gradient(145deg, #ffe4ef 0%, #f9c6dc 55%, #e59ab9 100%)'
    : 'linear-gradient(145deg, #dff9fc 0%, #a8e4ee 55%, #6bc4d4 100%)';

  const accessoryEmoji: Record<AvatarAccessoryTheme, string> = {
    astronaut: '🚀',
    artist: '🎨',
    scientist: '🔬',
    athlete: '⚽',
    reader: '📚',
    nature: '🌿',
  };

  return (
    <div
      className={`${dims} relative rounded-2xl p-1 flex items-center justify-center shrink-0 select-none`}
      style={{
        background: bgGradient,
        boxShadow:
          '0 8px 18px -6px rgba(38, 28, 46, 0.22), inset 0 2px 4px rgba(255, 255, 255, 0.85), inset 0 -3px 6px rgba(0, 0, 0, 0.12)',
      }}
      aria-label={`3D avatar for ${name}`}
    >
      <svg viewBox="0 0 80 80" className="w-full h-full overflow-visible" aria-hidden="true">
        <defs>
          <radialGradient id={`${uid}-skin`} cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#ffeadb" />
            <stop offset="65%" stopColor="#f5c6a5" />
            <stop offset="100%" stopColor="#d99b72" />
          </radialGradient>
          <radialGradient id={`${uid}-hair`} cx="30%" cy="25%" r="75%">
            <stop offset="0%" stopColor="#5c4033" />
            <stop offset="60%" stopColor="#3b261d" />
            <stop offset="100%" stopColor="#1f120d" />
          </radialGradient>
          <radialGradient id={`${uid}-shirt`} cx="35%" cy="25%" r="75%">
            <stop offset="0%" stopColor={isGirl ? '#ff85b3' : '#38bdf8'} />
            <stop offset="100%" stopColor={isGirl ? '#be185d' : '#0369a1'} />
          </radialGradient>
        </defs>

        {/* 3D Shoulders / Sweater */}
        <path
          d="M16 74C16 61 26 54 40 54C54 54 64 61 64 74"
          fill={`url(#${uid}-shirt)`}
        />

        {/* 3D Ears */}
        <circle cx="19" cy="41" r="5" fill={`url(#${uid}-skin)`} />
        <circle cx="61" cy="41" r="5" fill={`url(#${uid}-skin)`} />

        {/* 3D Head Sphere with Clay Lighting */}
        <circle cx="40" cy="39" r="21" fill={`url(#${uid}-skin)`} />

        {/* Hair styled by age stage & gender */}
        {stageCode === '0-2' ? (
          <path
            d="M32 19C36 14 45 14 47 20C43 22 36 22 32 19Z"
            fill={`url(#${uid}-hair)`}
          />
        ) : isGirl ? (
          <>
            <circle cx="17" cy="28" r="7.5" fill={`url(#${uid}-hair)`} />
            <circle cx="63" cy="28" r="7.5" fill={`url(#${uid}-hair)`} />
            <path
              d="M19 34C20 20 30 15 40 15C50 15 60 20 61 34C54 26 46 24 40 24C34 24 26 26 19 34Z"
              fill={`url(#${uid}-hair)`}
            />
            <circle cx="24" cy="23" r="3.2" fill="#ff85b3" />
            <circle cx="56" cy="23" r="3.2" fill="#ff85b3" />
          </>
        ) : (
          <path
            d="M19 33C19 19 29 14 40 14C51 14 61 19 61 33C55 26 47 23 40 23C33 23 25 26 19 33Z"
            fill={`url(#${uid}-hair)`}
          />
        )}

        {/* Expressive 3D Eyes with Specular Glint */}
        <circle cx="32" cy="39" r="3" fill="#231924" />
        <circle cx="48" cy="39" r="3" fill="#231924" />
        <circle cx="31" cy="37.8" r="1.1" fill="#ffffff" />
        <circle cx="47" cy="37.8" r="1.1" fill="#ffffff" />

        {/* Soft Rosy Cheeks */}
        <ellipse cx="26" cy="44" rx="3.5" ry="2" fill="#f472b6" fillOpacity="0.38" />
        <ellipse cx="54" cy="44" rx="3.5" ry="2" fill="#f472b6" fillOpacity="0.38" />

        {/* Warm Smile */}
        <path
          d="M34 46.5C36.2 49.5 43.8 49.5 46 46.5"
          stroke="#88294f"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* Specular 3D Forehead Highlight */}
        <ellipse cx="33" cy="28" rx="5" ry="2.2" fill="#ffffff" fillOpacity="0.42" />
      </svg>

      {/* 3D Accessory Floating Badge */}
      <span
        className="absolute -bottom-1 -left-1 w-6 h-6 rounded-full bg-white shadow-sm border border-[var(--color-border)] flex items-center justify-center text-xs"
        aria-hidden="true"
      >
        {accessoryEmoji[accessoryTheme] || '🌟'}
      </span>
    </div>
  );
};

interface ThreeDInteractiveSceneProps {
  variant: 'hero-family' | 'health-hub' | 'commerce-podium';
  title?: string;
  subtitle?: string;
}

/**
 * Interactive 3D Perspective Scene with tactile mouse/tap depth tilt and layered 3D objects.
 */
export const ThreeDInteractiveScene: React.FC<ThreeDInteractiveSceneProps> = ({
  variant,
  title,
  subtitle,
}) => {
  const [tilt, setTilt] = useState<{ rx: number; ry: number }>({ rx: 0, ry: 0 });

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ rx: Number((-y * 8).toFixed(2)), ry: Number((x * 10).toFixed(2)) });
  };

  const handlePointerLeave = () => {
    setTilt({ rx: 0, ry: 0 });
  };

  return (
    <div
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onClick={() => setTilt((prev) => ({ rx: prev.rx === 0 ? 4 : 0, ry: prev.ry === 0 ? -5 : 0 }))}
      className="relative rounded-2xl p-4 select-none cursor-pointer transition-transform duration-200 ease-out"
      style={{
        transform: `perspective(900px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
        background:
          variant === 'health-hub'
            ? 'linear-gradient(135deg, #e0f7fa 0%, #f3e8ff 52%, #fce7f3 100%)'
            : variant === 'commerce-podium'
            ? 'linear-gradient(135deg, #fff7ed 0%, #fce7f3 50%, #e0f2fe 100%)'
            : 'linear-gradient(145deg, rgba(255,255,255,0.92), rgba(251,237,243,0.88))',
        boxShadow:
          '0 14px 30px -10px rgba(42, 36, 51, 0.16), inset 0 2px 4px rgba(255, 255, 255, 0.9)',
        border: '1px solid var(--color-border)',
      }}
    >
      {variant === 'hero-family' && (
        <div className="flex flex-col items-center text-center space-y-2.5 min-w-[200px]">
          <div className="flex items-center justify-center -space-x-2 rtl:space-x-reverse py-1">
            <ThreeDChildAvatar name="عز" gender="boy" stageCode="5-8" accessoryTheme="astronaut" size="md" />
            <ThreeDChildAvatar name="نور" gender="girl" stageCode="2-5" accessoryTheme="artist" size="md" />
          </div>
          <div className="flex items-center gap-1.5">
            <ThreeDIcon id="calendar" size={22} />
            <ThreeDIcon id="health" size={22} />
            <ThreeDIcon id="media" size={22} />
            <ThreeDIcon id="games" size={22} />
            <ThreeDIcon id="services" size={22} />
          </div>
          {title && <div className="text-xs font-extrabold text-[var(--color-text)]">{title}</div>}
          {subtitle && (
            <div className="text-[11px] text-[var(--color-role-text)] font-semibold tabular-nums">
              {subtitle}
            </div>
          )}
        </div>
      )}

      {variant === 'health-hub' && (
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <ThreeDIcon id="health" size={40} />
            <ThreeDIcon id="media" size={36} />
            <ThreeDIcon id="assistant" size={36} />
          </div>
          <div className="text-end">
            <div className="text-xs font-extrabold text-[var(--color-text)]">
              {title || 'مركز الصحة وعلم النفس التربوي ثلاثي الأبعاد'}
            </div>
            <div className="text-[11px] text-[var(--color-muted)]">
              {subtitle || 'محتوى علمي مطمئن ومراجع من مختصين'}
            </div>
          </div>
        </div>
      )}

      {variant === 'commerce-podium' && (
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <ThreeDIcon id="services" size={40} />
            <ThreeDIcon id="wishes" size={36} />
            <ThreeDIcon id="cart" size={36} />
          </div>
          <div className="text-end">
            <div className="text-xs font-extrabold text-[var(--color-text)]">
              {title || 'منصة تسوق الأسرة ثلاثية الأبعاد'}
            </div>
            <div className="text-[11px] text-[var(--color-muted)]">
              {subtitle || 'ألعاب منتسوري، ملابس قطنية، وخدمات موثوقة'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
