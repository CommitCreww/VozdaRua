import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

export function MailIcon(props: IconProps) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" {...props}><rect x="2.5" y="4.5" width="19" height="15" rx="2" /><path d="m3.5 6 8.5 7 8.5-7" /></svg>;
}

export function LockIcon(props: IconProps) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" {...props}><rect x="4.5" y="10" width="15" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" /></svg>;
}

export function EyeIcon({ hidden = false, ...props }: IconProps & { hidden?: boolean }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" {...props}><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" /><circle cx="12" cy="12" r="2.7" />{hidden && <path d="m3 3 18 18" />}</svg>;
}

export function GoogleIcon(props: IconProps) {
  return <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" {...props}><path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.42-.18-2.1H12v3.97h5.39a4.6 4.6 0 0 1-2 3.02v2.5h3.25c1.9-1.75 2.96-4.33 2.96-7.39Z"/><path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.61-2.38l-3.24-2.5c-.9.6-2.05.96-3.37.96-2.59 0-4.79-1.75-5.57-4.1H3.1v2.58A10 10 0 0 0 12 22Z"/><path fill="#FBBC05" d="M6.43 13.98A6 6 0 0 1 6.11 12c0-.69.11-1.36.32-1.98V7.44H3.1A10 10 0 0 0 2 12c0 1.62.39 3.16 1.1 4.56l3.33-2.58Z"/><path fill="#EA4335" d="M12 5.92c1.43 0 2.7.49 3.72 1.46L18.5 4.6A9.95 9.95 0 0 0 12 2a10 10 0 0 0-8.9 5.44l3.33 2.58c.78-2.35 2.98-4.1 5.57-4.1Z"/></svg>;
}

export function GitHubIcon(props: IconProps) {
  return <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false" {...props}><path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56v-2.18c-3.2.7-3.88-1.36-3.88-1.36-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.71.08-.71 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.23-1.28-5.23-5.68 0-1.25.45-2.27 1.18-3.07-.12-.29-.51-1.46.11-3.05 0 0 .97-.31 3.18 1.17a11.04 11.04 0 0 1 5.79 0c2.21-1.48 3.18-1.17 3.18-1.17.62 1.59.23 2.76.11 3.05.73.8 1.18 1.82 1.18 3.07 0 4.41-2.68 5.39-5.24 5.68.41.35.77 1.04.77 2.1v3.11c0 .31.21.68.8.56A11.52 11.52 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z"/></svg>;
}
