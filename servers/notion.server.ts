import { Client } from '@notionhq/client'
import fs from 'fs'
import { NotionToMarkdown } from 'notion-to-md'
import path from 'path'
// dotenv.config()

export const notion = new Client({
  auth: process.env.NOTION_TOKEN,
})

export const n2m = new NotionToMarkdown({ notionClient: notion })

const databaseId = process.env.BLOGS_DATABASE_ID!

const sanitizeTitle = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

;(async () => {
  try {
    const res = await notion.databases.query({ database_id: databaseId })

    const outputDir = path.join(process.cwd(), 'data/blog')
    const imagesRoot = path.join(process.cwd(), 'public/static/images/blog')

    if (fs.existsSync(outputDir)) {
      fs.rmSync(outputDir, { recursive: true })
    }
    fs.mkdirSync(outputDir, { recursive: true })

    if (fs.existsSync(imagesRoot)) {
      fs.rmSync(imagesRoot, { recursive: true })
    }
    fs.mkdirSync(imagesRoot, { recursive: true })

    for (const page of res.results) {
      const mdBlocks = await n2m.pageToMarkdown(page.id)
      const mdString = n2m.toMarkdownString(mdBlocks)

      const props = (page as any)?.properties

      const title = props['Title']?.title?.[0]?.plain_text || page.id
      const summary = props['Summary']?.rich_text?.[0]?.plain_text || 'Unknown'

      const cover =
        (page as any)?.cover?.type === 'external' ? (page as any)?.cover?.external?.url : ''

      const date = props['Published Date']?.created_time
      const layout = props['Layout']?.select?.name || ''
      const status = props['Status']?.status?.name ?? 'Unknown'
      const tags = props['Tags']?.multi_select?.map((tag: any) => tag.name) ?? []

      const slug = sanitizeTitle(title)
      const filePath = path.join(outputDir, `${slug}.mdx`)

      const frontmatter = `---
title: '${title.replace(/'/g, "\\'")}'
date: '${new Date(date).toISOString().split('T')[0]}'
tags: [${tags.map((t: any) => `'${t}'`).join(', ')}]
draft: ${status === 'Draft' || status === 'Idea'}
summary: ${summary}
layout: ${layout}
images: ['${cover}']
---\n
`

      if (status === 'Draft' || status === 'Idea') {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath)
        }
        continue
      }

      const postImagesDir = path.join(imagesRoot, slug)
      fs.mkdirSync(postImagesDir, { recursive: true })

      const usedNames = new Set<string>()
      let markdown = mdString.parent
      const imageMatches = [...markdown.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)]

      for (const m of imageMatches) {
        const url = m[1]
        if (!url.includes('prod-files-secure.s3.us-west-2.amazonaws.com')) continue

        const rawName = decodeURIComponent(url.split('?')[0].split('/').pop() || 'image')
        let name = rawName
          .toLowerCase()
          .replace(/[^\w.\-]/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '')
        if (!/\.[a-z0-9]+$/i.test(name)) name += '.png'

        let final = name
        let i = 1
        while (usedNames.has(final)) {
          final = `${name.replace(/\.[a-z0-9]+$/i, '')}-${i}${name.match(/\.[a-z0-9]+$/i)?.[0] || ''}`
          i++
        }
        usedNames.add(final)

        try {
          const resp = await fetch(url)
          const buf = Buffer.from(await resp.arrayBuffer())
          fs.writeFileSync(path.join(postImagesDir, final), buf)
        } catch (e) {
          console.error(`Failed to download image ${url}`, e)
        }

        markdown = markdown.replace(m[0], `![${final}](/static/images/blog/${slug}/${final})`)
      }

      fs.writeFileSync(filePath, frontmatter + markdown, 'utf-8')
    }
  } catch (error) {
    console.error(error)
  }
})()
;(async () => {
  const res = await notion.databases.query({ database_id: databaseId })
  const outputDir = path.join(process.cwd(), 'app')
  const filePath = path.join(outputDir, 'tag-data.json')
  const tags: Record<string, number> = {}
  for (const page of res.results) {
    const status = (page as any).properties['Status']?.status?.name ?? 'Unknown'
    if (status === 'Draft' || status === 'Idea') continue
    ;(page as any).properties['Tags']?.multi_select?.map((tag: any) => {
      const slug = sanitizeTitle(tag.name)
      tags[slug] = (tags[slug] || 0) + 1
    }) || []
  }
  fs.writeFileSync(filePath, JSON.stringify(tags, null, 2))
})()
;(async () => {
  const projectsDatabaseId = process.env.PROJECTS_DATABASE_ID!
  const DEFAULT_PROJECT_COVER = 'https://app.notion.com/images/page-cover/solid_beige.png'

  const res = await notion.databases.query({ database_id: projectsDatabaseId })

  const projects: Project[] = []

  for (const page of res.results) {
    const props = (page as any)?.properties

    const status = props['Status']?.status?.name ?? 'Private'
    if (status !== 'Public') continue

    const title = props['Name']?.title?.[0]?.plain_text || ''
    const type = (props['Type']?.select?.name || 'self').toLowerCase() as 'work' | 'self'
    const description = props['Description']?.rich_text?.[0]?.plain_text || ''
    const url = props['URL']?.url || ''
    const repo = props['Link']?.url || null
    const builtWith = props['Build With']?.multi_select?.map((t: any) => t.name) ?? []

    const hasCover =
      (page as any)?.cover?.type === 'external' || (page as any)?.cover?.type === 'file'
    const coverUrl =
      (page as any)?.cover?.type === 'external'
        ? (page as any)?.cover?.external?.url
        : (page as any)?.cover?.type === 'file'
          ? (page as any)?.cover?.file?.url
          : ''

    projects.push({
      type,
      title,
      description,
      url,
      repo,
      builtWith,
      imgSrc: hasCover ? coverUrl : DEFAULT_PROJECT_COVER,
    })
  }

  fs.writeFileSync(path.join(process.cwd(), 'projectsData.json'), JSON.stringify(projects, null, 2))
})()

interface Project {
  type: 'work' | 'self'
  title: string
  description?: string
  imgSrc: string
  url?: string
  repo?: string | null
  builtWith: string[]
}
