import React, { useState, useId } from 'react';
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
  | 'star'
  | 'sparkles'
  | 'location'
  | 'search'
  | 'community'
  | 'messages';

interface ThreeDIconProps {
  id: ThreeDIconId;
  size?: number;
  className?: string;
}

interface AiRobotHeadIconProps {
  size?: number;
  className?: string;
  onDarkSurface?: boolean;
}

/**
 * Minimalist Robot Head Icon combined with subtle sparkling elements for the Dynamic AI Assistant FAB
 * and AI Agent navigation items.
 */
export const AiRobotHeadIcon: React.FC<AiRobotHeadIconProps> = ({
  size = 28,
  className = '',
  onDarkSurface = false,
}) => {
  const reactId = useId().replace(/:/g, '');
  const uid = `ai-robot-${size}-${reactId}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block shrink-0 select-none ${className}`}
      aria-hidden="true"
      data-ai-robot-icon="true"
    >
      <defs>
        <linearGradient id={`${uid}-coral`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF9E7A" />
          <stop offset="55%" stopColor="#FF8C61" />
          <stop offset="100%" stopColor="#E86A3D" />
        </linearGradient>
        <linearGradient id={`${uid}-visor`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1E293B" />
          <stop offset="100%" stopColor="#0F172A" />
        </linearGradient>
      </defs>

      {/* Soft-Filled Rounded Tile Base */}
      {!onDarkSurface && (
        <rect
          x="3"
          y="3"
          width="42"
          height="42"
          rx="13"
          fill="#FFF0EA"
          stroke="#FFD6C4"
          strokeWidth="1.2"
        />
      )}

      {/* Subtle Sparkling Elements (4-Point Stars) */}
      <path
        d="M10 9.5L11.1 12.2L13.8 13.3L11.1 14.4L10 17.1L8.9 14.4L6.2 13.3L8.9 12.2L10 9.5Z"
        fill={onDarkSurface ? '#FFF7ED' : '#FF8C61'}
      />
      <path
        d="M38.5 8L39.3 10.1L41.4 10.9L39.3 11.7L38.5 13.8L37.7 11.7L35.6 10.9L37.7 10.1L38.5 8Z"
        fill={onDarkSurface ? '#FDE68A' : '#FB923C'}
      />
      <circle
        cx="39"
        cy="35"
        r="1.8"
        fill={onDarkSurface ? '#FDE68A' : '#FF8C61'}
      />

      {/* Minimalist Robot Antenna */}
      <path
        d="M24 10V15"
        stroke={onDarkSurface ? '#FFFFFF' : `url(#${uid}-coral)`}
        strokeWidth="2.8"
        strokeLinecap="round"
      />
      <circle
        cx="24"
        cy="8.5"
        r="2.6"
        fill={onDarkSurface ? '#FDE68A' : `url(#${uid}-coral)`}
      />

      {/* Side Ear Nodes */}
      <rect
        x="7.5"
        y="22"
        width="3.5"
        height="9"
        rx="1.75"
        fill={onDarkSurface ? '#FED7AA' : '#FFB08F'}
      />
      <rect
        x="37"
        y="22"
        width="3.5"
        height="9"
        rx="1.75"
        fill={onDarkSurface ? '#FED7AA' : '#FFB08F'}
      />

      {/* Minimalist Rounded Robot Head Shell */}
      <rect
        x="10.5"
        y="15"
        width="27"
        height="23"
        rx="8.5"
        fill={onDarkSurface ? '#FFFFFF' : `url(#${uid}-coral)`}
      />

      {/* Inner Visor Screen */}
      <rect
        x="14.5"
        y="19.5"
        width="19"
        height="11.5"
        rx="5"
        fill={`url(#${uid}-visor)`}
      />

      {/* Friendly Glowing Robot Eyes */}
      <circle cx="20" cy="25.2" r="2.2" fill="#5EEAD4" />
      <circle cx="28" cy="25.2" r="2.2" fill="#5EEAD4" />
      <circle cx="19.4" cy="24.5" r="0.7" fill="#FFFFFF" />
      <circle cx="27.4" cy="24.5" r="0.7" fill="#FFFFFF" />

      {/* Gentle Smile Line */}
      <path
        d="M21 34.2C22.2 35.3 25.8 35.3 27 34.2"
        stroke={onDarkSurface ? '#E86A3D' : '#FFFFFF'}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
};

/**
 * Standardized Soft-Filled Icon System for Nekbar Super App.
 * Every internal icon across Medical, Store, Family, Media, Settings, and Navigation
 * uses the Soft-Filled style with rounded corners, colored uniformly in signature
 * Warm Coral (#FF8C61 / #E86A3D) and cohesive warm theme tokens.
 */
export const ThreeDIcon: React.FC<ThreeDIconProps> = ({ id, size = 26, className = '' }) => {
  const reactId = useId().replace(/:/g, '');
  const uid = `nekbar-icon-${id}-${size}-${reactId}`;

  if (id === 'assistant') {
    return <AiRobotHeadIcon size={size} className={className} />;
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block shrink-0 select-none ${className}`}
      aria-hidden="true"
      data-soft-filled-icon={id}
    >
      <defs>
        <linearGradient id={`${uid}-coral-main`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF9E78" />
          <stop offset="55%" stopColor="#FF8C61" />
          <stop offset="100%" stopColor="#E5673B" />
        </linearGradient>
        <linearGradient id={`${uid}-coral-soft`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFD8C7" />
          <stop offset="100%" stopColor="#FFB599" />
        </linearGradient>
        <linearGradient id={`${uid}-teal-accent`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#5EEAD4" />
          <stop offset="100%" stopColor="#14B8A6" />
        </linearGradient>
      </defs>

      {/* Uniform Soft-Filled Rounded Container Base */}
      <rect
        x="3"
        y="3"
        width="42"
        height="42"
        rx="13"
        fill="#FFF1EB"
        stroke="#FFD8C7"
        strokeWidth="1.2"
      />

      {id === 'home' && (
        <g>
          <path
            d="M11 22.5L22.3 12.6C23.3 11.7 24.7 11.7 25.7 12.6L37 22.5"
            stroke={`url(#${uid}-coral-main)`}
            strokeWidth="4.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <rect
            x="13.5"
            y="21"
            width="21"
            height="16.5"
            rx="5.5"
            fill={`url(#${uid}-coral-main)`}
          />
          <rect x="21" y="27.5" width="6" height="10" rx="3" fill="#FFF7F4" />
        </g>
      )}

      {id === 'children' && (
        <g>
          <circle cx="24" cy="25" r="12.5" fill={`url(#${uid}-coral-main)`} />
          <circle cx="19.5" cy="23.5" r="1.9" fill="#FFF7F4" />
          <circle cx="28.5" cy="23.5" r="1.9" fill="#FFF7F4" />
          <path
            d="M20 29C21.5 31 26.5 31 28 29"
            stroke="#FFF7F4"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          <path
            d="M18 14C20.5 11 27.5 11 30 14"
            stroke={`url(#${uid}-coral-soft)`}
            strokeWidth="3.8"
            strokeLinecap="round"
          />
        </g>
      )}

      {id === 'routine' && (
        <g>
          <rect
            x="11.5"
            y="11.5"
            width="25"
            height="25"
            rx="8.5"
            fill={`url(#${uid}-coral-main)`}
          />
          <circle cx="24" cy="24" r="8.5" fill="#FFF7F4" />
          <path
            d="M24 19.5V24L27.5 26.2"
            stroke="#E5673B"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      )}

      {id === 'calendar' && (
        <g>
          <rect
            x="11"
            y="13"
            width="26"
            height="24"
            rx="7"
            fill={`url(#${uid}-coral-main)`}
          />
          <rect x="14" y="21" width="20" height="13" rx="4" fill="#FFF7F4" />
          <rect x="16.5" y="9.5" width="3.5" height="6.5" rx="1.75" fill="#E5673B" />
          <rect x="28" y="9.5" width="3.5" height="6.5" rx="1.75" fill="#E5673B" />
          <circle cx="19" cy="27.5" r="2" fill="#FF8C61" />
          <circle cx="24" cy="27.5" r="2" fill="#FF8C61" />
          <circle cx="29" cy="27.5" r="2" fill="#14B8A6" />
        </g>
      )}

      {id === 'wishes' && (
        <g>
          <rect
            x="12"
            y="20"
            width="24"
            height="17"
            rx="5.5"
            fill={`url(#${uid}-coral-main)`}
          />
          <rect
            x="10.5"
            y="15"
            width="27"
            height="6.5"
            rx="3.2"
            fill={`url(#${uid}-coral-soft)`}
          />
          <rect x="22" y="15" width="4" height="22" rx="1.5" fill="#FFF7F4" />
          <path
            d="M24 15C20 10.5 15.5 12 18 15H24Z"
            fill="#E5673B"
          />
          <path
            d="M24 15C28 10.5 32.5 12 30 15H24Z"
            fill="#E5673B"
          />
        </g>
      )}

      {(id === 'media' || id === 'video') && (
        <g>
          <rect
            x="10.5"
            y="13"
            width="27"
            height="22"
            rx="7.5"
            fill={`url(#${uid}-coral-main)`}
          />
          <path
            d="M21 19.2L30 24L21 28.8V19.2Z"
            fill="#FFF7F4"
          />
        </g>
      )}

      {id === 'games' && (
        <g>
          <rect
            x="9.5"
            y="16"
            width="29"
            height="17.5"
            rx="8.75"
            fill={`url(#${uid}-coral-main)`}
          />
          <path
            d="M18 21.5V28M14.75 24.75H21.25"
            stroke="#FFF7F4"
            strokeWidth="2.8"
            strokeLinecap="round"
          />
          <circle cx="29.5" cy="22.8" r="2" fill="#FFF7F4" />
          <circle cx="33" cy="26.5" r="2" fill="#5EEAD4" />
        </g>
      )}

      {(id === 'services' || id === 'cart') && (
        <g>
          <path
            d="M13 18.5H35L33 35C32.7 36.7 31.3 38 29.5 38H18.5C16.7 38 15.3 36.7 15 35L13 18.5Z"
            fill={`url(#${uid}-coral-main)`}
          />
          <path
            d="M18.5 18.5V15C18.5 12 21 10 24 10C27 10 29.5 12 29.5 15V18.5"
            stroke="#E5673B"
            strokeWidth="3.2"
            strokeLinecap="round"
          />
          <circle cx="20" cy="24" r="2" fill="#FFF7F4" />
          <circle cx="28" cy="24" r="2" fill="#FFF7F4" />
        </g>
      )}

      {id === 'notifications' && (
        <g>
          <path
            d="M14.5 30V22.5C14.5 17.2 18.8 13 24 13C29.2 13 33.5 17.2 33.5 22.5V30L36 33.5H12L14.5 30Z"
            fill={`url(#${uid}-coral-main)`}
          />
          <circle cx="24" cy="36.5" r="3" fill="#E5673B" />
          <circle cx="32" cy="14.5" r="4" fill={`url(#${uid}-teal-accent)`} />
        </g>
      )}

      {id === 'family' && (
        <g>
          <circle cx="18" cy="18.5" r="4.8" fill={`url(#${uid}-coral-main)`} />
          <circle cx="30" cy="18.5" r="4.8" fill={`url(#${uid}-coral-soft)`} />
          <circle cx="24" cy="22.5" r="4" fill="#E5673B" />
          <path
            d="M10.5 35.5C10.5 31 14 28 18 28C22 28 25.5 31 25.5 35.5"
            fill={`url(#${uid}-coral-main)`}
          />
          <path
            d="M22.5 35.5C22.5 31 26 28 30 28C34 28 37.5 31 37.5 35.5"
            fill={`url(#${uid}-coral-soft)`}
          />
          <path
            d="M17 37C17 33.2 20 30.8 24 30.8C28 30.8 31 33.2 31 37"
            fill="#E5673B"
          />
        </g>
      )}

      {id === 'settings' && (
        <g>
          <rect
            x="12"
            y="12"
            width="24"
            height="24"
            rx="8"
            fill={`url(#${uid}-coral-main)`}
          />
          <circle cx="24" cy="24" r="5.5" fill="#FFF7F4" />
          <circle cx="24" cy="24" r="2.2" fill="#E5673B" />
        </g>
      )}

      {id === 'health' && (
        <g>
          <rect
            x="11.5"
            y="11.5"
            width="25"
            height="25"
            rx="8.5"
            fill={`url(#${uid}-coral-main)`}
          />
          <path
            d="M24 17.5V30.5M17.5 24H30.5"
            stroke="#FFF7F4"
            strokeWidth="3.8"
            strokeLinecap="round"
          />
        </g>
      )}

      {id === 'audio' && (
        <g>
          <circle cx="24" cy="24" r="12.5" fill={`url(#${uid}-coral-main)`} />
          <path
            d="M21.5 18.5V28.5C21.5 30.2 20 31.5 18.2 31.5C16.5 31.5 15 30.2 15 28.5C15 26.8 16.5 25.5 18.2 25.5C19.1 25.5 19.8 25.8 20.4 26.2V17L30 15.2V26.5C30 28.2 28.5 29.5 26.8 29.5C25 29.5 23.5 28.2 23.5 26.5C23.5 24.8 25 23.5 26.8 23.5C27.6 23.5 28.3 23.8 28.8 24.2V17.5L21.5 18.5Z"
            fill="#FFF7F4"
          />
        </g>
      )}

      {id === 'shield' && (
        <g>
          <path
            d="M24 11L35 15.5V23.5C35 30.5 30.2 35.8 24 38C17.8 35.8 13 30.5 13 23.5V15.5L24 11Z"
            fill={`url(#${uid}-coral-main)`}
          />
          <path
            d="M20 24.5L22.8 27.3L28.5 21.5"
            stroke="#FFF7F4"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      )}

      {id === 'star' && (
        <g>
          <circle cx="24" cy="24" r="13" fill={`url(#${uid}-coral-main)`} />
          <path
            d="M24 14.5L26.7 20.2L33 21.1L28.4 25.5L29.5 31.8L24 28.8L18.5 31.8L19.6 25.5L15 21.1L21.3 20.2L24 14.5Z"
            fill="#FFF7F4"
          />
        </g>
      )}

      {id === 'sparkles' && (
        <g>
          <path
            d="M24 12L26.5 19.5L34 22L26.5 24.5L24 32L21.5 24.5L14 22L21.5 19.5L24 12Z"
            fill={`url(#${uid}-coral-main)`}
          />
          <circle cx="33" cy="15" r="2.5" fill={`url(#${uid}-coral-soft)`} />
          <circle cx="15" cy="29" r="2" fill={`url(#${uid}-coral-soft)`} />
        </g>
      )}

      {id === 'location' && (
        <g>
          <path
            d="M24 11C18.5 11 14 15.5 14 21C14 28.5 24 37 24 37C24 37 34 28.5 34 21C34 15.5 29.5 11 24 11Z"
            fill={`url(#${uid}-coral-main)`}
          />
          <circle cx="24" cy="21" r="4.2" fill="#FFF7F4" />
        </g>
      )}

      {id === 'search' && (
        <g>
          <circle
            cx="21.5"
            cy="21.5"
            r="8.5"
            stroke={`url(#${uid}-coral-main)`}
            strokeWidth="3.5"
            fill="none"
          />
          <path
            d="M28 28L35 35"
            stroke={`url(#${uid}-coral-main)`}
            strokeWidth="3.8"
            strokeLinecap="round"
          />
        </g>
      )}

      {id === 'community' && (
        <g>
          <circle cx="18" cy="18" r="6" fill={`url(#${uid}-coral-main)`} />
          <circle cx="31" cy="19" r="5" fill={`url(#${uid}-coral-soft)`} />
          <path d="M7.5 36C8.5 28.5 13 25 18 25C23 25 27.5 28.5 28.5 36Z" fill={`url(#${uid}-coral-main)`} />
          <path d="M26 27C31.5 24.5 38.5 28 40 35.5H30C29.5 32 28 29 26 27Z" fill={`url(#${uid}-coral-soft)`} />
          <circle cx="36" cy="11" r="2" fill={`url(#${uid}-teal-accent)`} />
        </g>
      )}

      {id === 'messages' && (
        <g>
          <path d="M9.5 12.5C9.5 10.6 11 9 13 9H34C36 9 37.5 10.6 37.5 12.5V27C37.5 29 36 30.5 34 30.5H21L13 37V30.5C11 30.5 9.5 29 9.5 27Z" fill={`url(#${uid}-coral-main)`} />
          <path d="M16 18H31M16 23H27" stroke="#FFF7F4" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="36" cy="36" r="4" fill={`url(#${uid}-teal-accent)`} />
        </g>
      )}
    </svg>
  );
};

interface ThreeDChildAvatarProps {
  name?: string;
  gender: 'boy' | 'girl';
  stageCode?: '0-2' | '2-5' | '5-8';
  accessoryTheme?: AvatarAccessoryTheme;
  theme?: AvatarAccessoryTheme;
  photoDataUrl?: string;
  useIllustratedAvatar?: boolean;
  size?: 'sm' | 'md' | 'lg' | number;
}

/**
 * 3D Child Profile Identity Component.
 * - Preserves real uploaded photographs when provided (unless parent explicitly chooses illustrated avatar).
 * - Otherwise renders a distinctive 3D stylized clay portrait tailored to gender, age stage (0-2, 2-5, 5-8),
 *   and chosen 3D personality/accessory theme (astronaut, artist, scientist, athlete, reader, nature).
 */
export const ThreeDChildAvatar: React.FC<ThreeDChildAvatarProps> = ({
  name = '',
  gender,
  stageCode = '2-5',
  accessoryTheme,
  theme,
  photoDataUrl,
  useIllustratedAvatar = false,
  size = 'md',
}) => {
  const safeName = typeof name === 'string' ? name : '';
  const resolvedTheme: AvatarAccessoryTheme = accessoryTheme || theme || 'astronaut';
  const dims =
    size === 'lg' || (typeof size === 'number' && size >= 64)
      ? 'w-20 h-20'
      : size === 'sm' || (typeof size === 'number' && size <= 48)
      ? 'w-11 h-11'
      : 'w-14 h-14';
  const showRealPhoto = Boolean(photoDataUrl && !useIllustratedAvatar);

  if (showRealPhoto) {
    return (
      <div
        className={`${dims} relative rounded-2xl overflow-hidden border-2 border-white shadow-md shrink-0 bg-[var(--color-control-muted)]`}
        title={safeName}
      >
        <img
          src={photoDataUrl}
          alt={safeName}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  const uid = `avatar3d-${gender}-${stageCode}-${resolvedTheme}-${safeName.length}`;
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
        {accessoryEmoji[resolvedTheme] || '🌟'}
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
