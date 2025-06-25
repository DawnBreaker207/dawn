import { Client } from '@notionhq/client'
import { log } from 'console'
import fs from 'fs'
import { NotionToMarkdown } from 'notion-to-md'
import path from 'path'
import { formatDate } from 'pliny/utils/formatDate'
// dotenv.config()

export const notion = new Client({
  auth: process.env.NOTION_TOKEN,
})

export const n2m = new NotionToMarkdown({ notionClient: notion })

const databaseId = process.env.NOTION_DATABASE_ID!

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
    console.log(res)
    const outputDir = path.join(process.cwd(), 'data/blog')
    for (const page of res.results) {
      const mdBlocks = await n2m.pageToMarkdown(page.id)
      const mdString = n2m.toMarkdownString(mdBlocks)

      const props = (page as any).properties

      const title = props['Title']?.title?.[0]?.plain_text || page.id
      const summary = props['Summary']?.rich_text?.[0]?.plain_text || 'Unknown'
      console.log('Summary', summary)

      const cover = (page as any).cover.external.url
      const date = props['Published Date'].created_time
      const layout = props['Layout'].select.name || ''
      const status = props['Status']?.status?.name ?? 'Unknown'
      const tags = props['Tags']?.multi_select?.map((tag: any) => tag.name) ?? []

      const slug = sanitizeTitle(title)
      const filePath = path.join(outputDir, `${slug}.mdx`)

      const frontmatter = `---
      title: ${title}
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
          console.log(`Delete ${filePath}`)
        }
        continue
      }

      fs.writeFileSync(filePath, frontmatter + mdString.parent, 'utf-8')
      console.log(`Saved: ${filePath}`)
    }
  } catch (error) {
    console.log(error)
  }
})()
;(async () => {
  const res = await notion.databases.query({ database_id: databaseId })
  const outputDir = path.join(process.cwd(), 'data/blog')
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
