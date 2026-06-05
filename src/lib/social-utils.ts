import { Globe, type LucideIcon } from "lucide-react";

export interface SocialLink {
  url: string;
  platform: string;
}

const PLATFORM_PATTERNS: [RegExp, string][] = [
  [/instagram\.com/i, "instagram"],
  [/facebook\.com|fb\.com/i, "facebook"],
  [/tiktok\.com/i, "tiktok"],
  [/youtube\.com|youtu\.be/i, "youtube"],
  [/linkedin\.com/i, "linkedin"],
  [/twitter\.com|x\.com/i, "x"],
  [/pinterest\.com/i, "pinterest"],
  [/threads\.net|threads\.com/i, "threads"],
  [/google\.com\/maps|goo\.gl\/maps|share\.google/i, "google-meu-negocio"],
];

export function detectSocialPlatform(url: string): string {
  for (const [pattern, name] of PLATFORM_PATTERNS) {
    if (pattern.test(url)) return name;
  }
  return "site";
}

// SVG data URIs for social icons (colored)
const SOCIAL_SVGS: Record<string, string> = {
  instagram:
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3ClinearGradient id='ig' x1='0' y1='1' x2='1' y2='0'%3E%3Cstop offset='0%25' stop-color='%23feda75'/%3E%3Cstop offset='20%25' stop-color='%23fa7e1e'/%3E%3Cstop offset='40%25' stop-color='%23d62976'/%3E%3Cstop offset='60%25' stop-color='%23962fbf'/%3E%3Cstop offset='100%25' stop-color='%234f5bd5'/%3E%3C/linearGradient%3E%3Crect width='24' height='24' rx='6' fill='url(%23ig)'/%3E%3Ccircle cx='12' cy='12' r='4.5' fill='none' stroke='white' stroke-width='1.5'/%3E%3Ccircle cx='17.5' cy='6.5' r='1.2' fill='white'/%3E%3Crect x='2' y='2' width='20' height='20' rx='5' fill='none' stroke='white' stroke-width='1.5'/%3E%3C/svg%3E",
  facebook:
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Crect width='24' height='24' rx='6' fill='%231877F2'/%3E%3Cpath d='M16.5 12.5h-2.5v8h-3v-8H9v-2.5h2v-1.8c0-2 1.2-3.2 3.1-3.2h2.4v2.5h-1.5c-.8 0-1 .3-1 1v1.5h2.5l-.5 2.5z' fill='white'/%3E%3C/svg%3E",
  tiktok:
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Crect width='24' height='24' rx='6' fill='%23000'/%3E%3Cpath d='M16.5 5.5c-.7-.5-1.2-1.3-1.3-2.2h-2.5v11.4c0 1.4-1.1 2.5-2.5 2.5s-2.5-1.1-2.5-2.5 1.1-2.5 2.5-2.5c.3 0 .5 0 .8.1v-2.6c-.3 0-.5-.1-.8-.1-2.8 0-5 2.2-5 5s2.2 5 5 5 5-2.2 5-5V10c.9.6 2 1 3.2 1V8.5c-1.2 0-2.2-.5-2.9-1.3v-.2z' fill='white'/%3E%3C/svg%3E",
  youtube:
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Crect width='24' height='24' rx='6' fill='%23FF0000'/%3E%3Cpath d='M10 15.5v-7l6 3.5-6 3.5z' fill='white'/%3E%3C/svg%3E",
  linkedin:
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Crect width='24' height='24' rx='6' fill='%230A66C2'/%3E%3Cpath d='M8 10v7H5.5v-7H8zm-1.25-1.5c-.7 0-1.25-.56-1.25-1.25S6.05 6 6.75 6s1.25.56 1.25 1.25S7.45 8.5 6.75 8.5zM18.5 17H16v-3.5c0-1-.4-1.7-1.3-1.7-.7 0-1.1.5-1.3 1-.1.1-.1.4-.1.6V17h-2.5s.03-6.5 0-7h2.5v1c.3-.5 1-1.2 2.2-1.2 1.6 0 2.9 1.1 2.9 3.4V17z' fill='white'/%3E%3C/svg%3E",
  x: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Crect width='24' height='24' rx='6' fill='%23000'/%3E%3Cpath d='M16.3 6h1.8l-4 4.6L19 18h-3.7l-2.9-3.8L9 18H7.2l4.3-4.9L7 6h3.8l2.6 3.4L16.3 6zm-.6 10.8h1L10.4 7H9.3l6.4 9.8z' fill='white'/%3E%3C/svg%3E",
  pinterest:
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Crect width='24' height='24' rx='6' fill='%23E60023'/%3E%3Cpath d='M12 5c-3.3 0-6 2.7-6 6 0 2.4 1.4 4.4 3.4 5.4-.1-.4-.1-1.1 0-1.6l.7-3s-.2-.4-.2-.9c0-.8.5-1.5 1.1-1.5.5 0 .8.4.8.9 0 .5-.3 1.3-.5 2 0 .6.5 1.1 1.1 1.1 1.3 0 2.2-1.4 2.2-3.3 0-1.7-1.2-2.9-3-2.9-2.1 0-3.3 1.6-3.3 3.2 0 .6.2 1.3.5 1.6.1.1.1.1 0 .3l-.2.7c0 .1-.1.2-.3.1-.9-.4-1.5-1.7-1.5-2.8 0-2.3 1.6-4.4 4.8-4.4 2.5 0 4.5 1.8 4.5 4.2 0 2.5-1.6 4.6-3.8 4.6-.7 0-1.4-.4-1.7-.9l-.5 1.8c-.2.7-.6 1.4-1 2C10.8 17.9 11.4 18 12 18c3.3 0 6-2.7 6-6s-2.7-6-6-6z' fill='white'/%3E%3C/svg%3E",
  threads:
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Crect width='24' height='24' rx='6' fill='%23000'/%3E%3Cpath d='M15.2 11.4c-.1 0-.2-.1-.3-.1-.2-1.5-1-2.4-2.4-2.5-1 0-1.8.4-2.2 1.2l1 .6c.3-.5.8-.7 1.3-.7.5 0 .9.2 1.1.5.2.3.2.6.2 1-.4-.1-.9-.1-1.4-.1-1.7 0-2.7.9-2.7 2.2 0 1.3 1 2.2 2.4 2.2.9 0 1.6-.4 2-1.2.3.4.4 1 .4 1.7h1.2c0-1.1-.2-2-.6-2.7.4-.6.5-1.3.5-2.1h-.5zM12.4 14.4c-.6 0-1.1-.3-1.1-.9 0-.6.4-1 1.4-1 .4 0 .9.1 1.2.1-.1 1.1-.8 1.8-1.5 1.8z' fill='white'/%3E%3C/svg%3E",
  "google-meu-negocio":
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Crect width='24' height='24' rx='6' fill='%234285F4'/%3E%3Cpath d='M12 6c-3.3 0-6 2.7-6 6s2.7 6 6 6 6-2.7 6-6-2.7-6-6-6zm0 10.8c-2.6 0-4.8-2.1-4.8-4.8S9.4 7.2 12 7.2s4.8 2.1 4.8 4.8-2.2 4.8-4.8 4.8z' fill='white'/%3E%3Cpath d='M12 9.2c-1.5 0-2.8 1.3-2.8 2.8s1.3 2.8 2.8 2.8 2.8-1.3 2.8-2.8-1.3-2.8-2.8-2.8z' fill='white'/%3E%3C/svg%3E",
};

export function getSocialIcon(platform: string): string | LucideIcon {
  if (SOCIAL_SVGS[platform]) return SOCIAL_SVGS[platform];
  return Globe;
}

export function getSocialLabel(platform: string): string {
  const labels: Record<string, string> = {
    instagram: "Instagram",
    facebook: "Facebook",
    tiktok: "TikTok",
    youtube: "YouTube",
    linkedin: "LinkedIn",
    x: "X (Twitter)",
    pinterest: "Pinterest",
    threads: "Threads",
    "google-meu-negocio": "Google Meu Negócio",
    site: "Site",
  };
  return labels[platform] || "Site";
}
