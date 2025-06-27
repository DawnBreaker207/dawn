export interface Project {
  type: 'work' | 'self'
  title: string
  description?: string
  imgSrc: string
  url?: string
  repo?: string | null
  builtWith: string[]
}

const projectsData: Project[] = [
  {
    type: 'self',
    title: 'Personal website',
    imgSrc: '/static/images/projects/dawn-blog.png',
    repo: 'DawnBreaker207/dawn',
    builtWith: ['Next.js', 'Tailwind', 'Typescript', 'Prisma', 'Umami', 'Notion'],
  },
  {
    type: 'self',
    title: 'Website E-Commerce',
    imgSrc: '/static/images/projects/time-machine.jpg',
    repo: 'DawnBreaker207/E-commerce',
    builtWith: ['Java', 'Spring', 'MySQL', 'Angular', 'Tailwind', 'Angular Material'],
  },
  {
    type: 'self',
    title: 'Jira Clone',
    // description: 'Explore the World of Basic 3D Modeling Simulations on Our Website.',
    imgSrc: '/static/images/projects/jira-clone.png',
    repo: 'DawnBreaker207/Jira-Clone',
    builtWith: ['Angular', 'TypeScript', 'Ng-Zorro', 'NestJS'],
  },
  {
    type: 'self',
    title: 'Dating App',
    // description: 'Explore the World of Basic 3D Modeling Simulations on Our Website.',
    imgSrc: '/static/images/projects/time-machine.jpg',
    repo: 'DawnBreaker207/Dating-App',
    builtWith: ['C#', '.NET', 'Angular', 'TypeScript', 'Bootstrap'],
  },
]

export default projectsData
