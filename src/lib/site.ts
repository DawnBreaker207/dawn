export const GITHUB_USERNAME = 'DawnBreaker207';
export const GITHUB_OWNER = 'DawnBreaker207';
export const GITHUB_REPO = 'dawn';
export const GITHUB_REPO_PATH = `${GITHUB_OWNER}/${GITHUB_REPO}`;
export const HOST = 'dawn';
export const REPO_DIR = `~/${GITHUB_REPO_PATH}`;

export interface SiteVersion {
  branch: string;
  label: string;
  href: string;
  current?: boolean;
}

export const CURRENT_BRANCH = 'main';

export const SITE_VERSIONS: SiteVersion[] = [
  { branch: 'main', label: 'Astro × npm', href: '/', current: true },
  { branch: 'v1', label: 'Next.js 15 × npm', href: 'https://v1.dawn.io.vn' },
];

export interface Tab {
  id: string;
  label: string;
  path: string;
}

export function tabsFor(pathname: string) {
  if (pathname === '/' || pathname === '') return [{ id: 'README', label: 'README.md', path: '/' }];
  const slug = pathname.match(/^\/blog\/([^/]+)/)?.[1];
  if (slug) return [{ id: slug, label: `${slug}.mdx`, path: `/blog/${slug}` }];
  if (pathname.startsWith('/blog')) return [{ id: 'blog', label: 'blog.astro', path: '/blog' }];
  if (pathname.startsWith('/projects')) return [{ id: 'projects', label: 'projects.astro', path: '/projects' }];
  if (pathname.startsWith('/about')) return [{ id: 'about', label: 'about.md', path: '/about' }];
  if (pathname.startsWith('/topics')) return [{ id: 'topics', label: 'topics.astro', path: '/topics' }];
  if (pathname.startsWith('/heatmap')) return [{ id: 'heatmap', label: 'heatmap.astro', path: '/heatmap' }];
  if (pathname.startsWith('/books')) return [{ id: 'books', label: 'books.astro', path: '/books' }];
  if (pathname.startsWith('/lab')) {
    const exp = pathname.match(/^\/lab\/([^/]+)/)?.[1];
    return exp
      ? [{ id: exp, label: `${exp}.astro`, path: `/lab/${exp}` }]
      : [{ id: 'lab', label: 'lab.astro', path: '/lab' }];
  }
  return [];
}

/* ---- Site metadata ---- */
export const SITE = {
  title: 'Dawn Blog',
  fullName: 'Tung Anh Ngo',
  author: 'Tung Anh',
  headerTitle: 'Dawn Blog',
  description: 'My personal blog ',
  language: 'en-us',
  theme: 'system',
  siteUrl: 'https://dawn.io.vn',
  siteRepo: 'https://github.com/DawnBreaker207/dawn',
  siteLogo: '/static/images/logo.png',
  socialBanner: '/static/images/twitter-card.png',
  email: 'contact@dawn.io.vn',
  github: 'https://github.com/DawnBreaker207',
  x: 'https://twitter.com/DawnBreaker207',
  facebook: 'https://facebook.com/tunganh207',
  linkedin: 'https://www.linkedin.com',
  locale: 'en-US',
  stickyNav: false,
  socialAccounts: {
    github: 'DawnBreaker207',
    linkedin: 'tunganh207',
    x: 'DawnBreaker207',
  },
  analytics: {
    umamiSharedUrl: (import.meta.env.SHARED_URL as string) || undefined,
    umamiWebsiteId: (import.meta.env.UMAMI_WEBSITE_ID as string) || undefined,
  },
  comments: {
    provider: 'giscus' as const,
    giscusConfig: {
      repo: (import.meta.env.PUBLIC_GISCUS_REPO as string) || '',
      repositoryId: (import.meta.env.PUBLIC_GISCUS_REPOSITORY_ID as string) || '',
      category: (import.meta.env.PUBLIC_GISCUS_CATEGORY as string) || '',
      categoryId: (import.meta.env.PUBLIC_GISCUS_CATEGORY_ID as string) || '',
      mapping: 'title' as const,
      reactions: '1',
      metadata: '0',
      theme: 'light',
      darkTheme: 'transparent_dark',
    },
  },
} as const;

export const SITE_URL =
  (import.meta.env.PUBLIC_SITE_URL as string)?.replace(/\/+$/, '') || SITE.siteUrl;

export const GISCUS_ENABLED = Boolean(
  SITE.comments.giscusConfig.repo &&
    SITE.comments.giscusConfig.repositoryId &&
    SITE.comments.giscusConfig.category &&
    SITE.comments.giscusConfig.categoryId
);

/* ---- Date formatting (en-US long date) ---- */
const dateFormatter = new Intl.DateTimeFormat(SITE.locale, {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

export function formatDate(date: Date | string): string {
  return dateFormatter.format(new Date(date));
}