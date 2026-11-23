/** @type {import("pliny/config").PlinyConfig } */
const siteMetadata = {
  title: 'Dawn Blog',
  fullName: 'Tung Anh Ngo',
  author: 'Tung Anh',
  headerTitle: 'Dawn Blog',
  description: 'Personal blog of a fullstack developer working with Java, SQL, and Angular.',
  language: 'en-us',
  theme: 'system', // system, dark or light
  siteUrl: 'https://dawn.io.vn',
  siteRepo: 'https://github.com/DawnBreaker207/dawn',
  siteLogo: '/static/images/logo.png',
  socialBanner: '/static/images/twitter-card.png',
  email: 'tunganhngo207@gmail.com',
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
    umamiAnalytics: {
      umamiWebsiteId: process.env.UMAMI_WEBSITE_ID,
      sharedUrl: process.env.SHARED_URL,
    },
  },
  comments: {
    provider: 'giscus',
    giscusConfig: {
      repo: process.env.PUBLIC_GISCUS_REPO || process.env.NEXT_PUBLIC_GISCUS_REPO || '',
      repositoryId: process.env.PUBLIC_GISCUS_REPOSITORY_ID || process.env.NEXT_PUBLIC_GISCUS_REPOSITORY_ID || '',
      category: process.env.PUBLIC_GISCUS_CATEGORY || process.env.NEXT_PUBLIC_GISCUS_CATEGORY || '',
      categoryId: process.env.PUBLIC_GISCUS_CATEGORY_ID || process.env.NEXT_PUBLIC_GISCUS_CATEGORY_ID || '',
      mapping: 'title',
      reactions: '1',
      metadata: '0',
      theme: 'light',
      darkTheme: 'transparent_dark',
      lang: 'en',
    },
  },
};

module.exports = siteMetadata;
