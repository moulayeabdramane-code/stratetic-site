import type { SVGProps } from "react";

export function ArrowRightIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
      <path d="M5 12h14M13 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ArrowDownIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
      <path d="M12 5v14M5 12l7 7 7-7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ChevronDownIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function PlayIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

export function CloseIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
      <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
    </svg>
  );
}

export function TvCommercialIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth={1.5} {...props}>
      <circle cx="20" cy="20" r="14" />
      <circle cx="20" cy="20" r="4" fill="currentColor" stroke="none" />
      <path d="M20 6v6M20 28v6M6 20h6M28 20h6" strokeLinecap="round" />
    </svg>
  );
}

export function CorporateContentIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 40 40" fill="currentColor" {...props}>
      {Array.from({ length: 16 }).map((_, i) => (
        <circle key={i} cx={8 + (i % 4) * 8} cy={8 + Math.floor(i / 4) * 8} r={2} />
      ))}
    </svg>
  );
}

export function SocialMediaIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth={1.5} {...props}>
      <path d="M20 4l4 10 10 4-10 4-4 10-4-10-10-4 10-4z" strokeLinejoin="round" />
    </svg>
  );
}

export function BrandFilmIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth={1.5} {...props}>
      <rect x="6" y="10" width="28" height="20" rx="3" />
      <path d="M16 16l10 4-10 4z" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function AnimationIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth={1.5} {...props}>
      <path d="M20 4a16 16 0 1016 16" strokeLinecap="round" />
      <path d="M20 4l6 6-8 2z" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function EducationIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth={1.5} {...props}>
      <path d="M4 14l16-7 16 7-16 7-16-7z" strokeLinejoin="round" />
      <path d="M11 18v8c0 2 4 4 9 4s9-2 9-4v-8" />
    </svg>
  );
}

export const serviceIconMap = {
  commercial: TvCommercialIcon,
  corporate: CorporateContentIcon,
  social: SocialMediaIcon,
  brandFilm: BrandFilmIcon,
  animation: AnimationIcon,
  education: EducationIcon,
} as const;

export function VimeoIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M22.4 7.3c-.1 2.2-1.6 5.2-4.6 9-3.1 3.9-5.7 5.9-7.8 5.9-1.3 0-2.4-1.2-3.3-3.6L5 12.3C4.3 9.9 3.5 8.7 2.7 8.7c-.2 0-.7.3-1.6 1L.3 8.6c1-.9 2-1.8 2.9-2.7C4.5 4.7 5.6 4 6.4 4c1.7-.1 2.8 1 3.2 3.5.5 2.7.8 4.3 1 5 .5 2.5 1.1 3.7 1.7 3.7.5 0 1.2-.8 2.1-2.3.9-1.6 1.4-2.7 1.5-3.6.1-1.3-.4-2-1.5-2-.5 0-1.1.1-1.6.4C14 5.2 15.9 3 19.2 3c2.4.1 3.4 1.7 3.2 4.3z" />
    </svg>
  );
}

export function FacebookIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M13.5 21v-7.5H16l.5-3H13.5V8.3c0-.9.3-1.5 1.6-1.5H16.5V4.2C16.2 4.1 15.2 4 14 4c-2.4 0-4 1.5-4 4.1v2.4H7.5v3H10V21h3.5z" />
    </svg>
  );
}

export function InstagramIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} {...props}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function LinkedinIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M6.9 8.6H3.6V20h3.3V8.6zM5.3 3.5a2 2 0 100 4 2 2 0 000-4zM20.4 20h-3.3v-5.8c0-1.4 0-3.2-2-3.2s-2.3 1.5-2.3 3.1V20H9.5V8.6h3.2v1.6h.1c.4-.8 1.5-1.8 3.1-1.8 3.3 0 3.9 2.2 3.9 5V20z" />
    </svg>
  );
}

export function YoutubeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M21.6 7.2s-.2-1.5-.8-2.1c-.8-.8-1.7-.8-2.1-.9C15.9 4 12 4 12 4s-3.9 0-6.7.2c-.4 0-1.3.1-2.1.9-.6.6-.8 2.1-.8 2.1S2.2 9 2.2 10.7v1.6c0 1.8.2 3.5.2 3.5s.2 1.5.8 2.1c.8.8 1.9.8 2.3.9 1.7.2 7 .2 7 .2s3.9 0 6.7-.2c.4 0 1.3-.1 2.1-.9.6-.6.8-2.1.8-2.1s.2-1.7.2-3.5v-1.6c0-1.7-.2-3.5-.2-3.5zM9.9 14.6V8.9l5.4 2.8-5.4 2.9z" />
    </svg>
  );
}
