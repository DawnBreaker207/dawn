import { compile } from '@mdx-js/mdx'
import { BlockObjectRequest, Client, PageObjectResponse } from '@notionhq/client'
import { NotionToMarkdown } from 'notion-to-md'
import React from 'react'
import remarkGfm from 'remark-gfm'

export const notion = new Client({
  auth: process.env.NOTION_TOKEN,
})
export const n2m = new NotionToMarkdown({ notionClient: notion })

export const getPosts = React.cache(async () => {
  try {
    if (!process.env.NOTION_DATABASE_ID || !process.env.NOTION_TOKEN) {
      console.log('Missing Notion env config')
    }

    const response = await notion.databases.query({
      database_id: process.env.NOTION_DATABASE_ID!,
      filter: {
        property: 'Status',
        status: {
          equals: 'Public',
        },
      },
      sorts: [{ property: 'Published Date', direction: 'ascending' }],
    })

    console.log(response)

    return response.results
  } catch (error) {
    console.log(error)
  }
})

export const getPostBySlug = React.cache(async (slug: string) => {
  try {
    const response = await notion.databases.query({
      database_id: process.env.NOTION_DATABASE_ID!,
      filter: {
        property: 'Status',
        status: {
          equals: 'Public',
        },
      },
    })

    const page = response.results.find((page: any) => {
      const title = (page.properties['Title'] as any).title?.[0]?.plain_text || 'Untitled'
      const generatedSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '')
      return generatedSlug === slug
    }) as PageObjectResponse | undefined

    if (!page) return null

    console.log(page.id)

    const mdBlocks = await n2m.pageToMarkdown(page.id)
    const markdown = n2m.toMarkdownString(mdBlocks)
    console.log(markdown.parent)

    const compiled = `export const layout = "PostLayout";\n\n${markdown.parent}`
    //  markdown.parent

    // await compile(markdown.parent, {
    //   outputFormat: 'function-body',
    //   // jsx: true,
    //   providerImportSource: '@mdx-js/react',
    //   development: false,
    //   remarkPlugins: [remarkGfm],
    // })

    return {
      frontmatter: {
        title: (page.properties['Title'] as any).title?.[0]?.plain_text || 'Untitled',
        date: (page.properties['Published Date'] as any).created_time,
        status: (page.properties['Status'] as any)?.status?.name ?? 'Unknown',
        tags: (page.properties['Tags'] as any)?.multi_select?.map((tag: any) => tag.name) ?? [],
        summary: (page.properties['Title'] as any).title?.[0]?.plain_text || 'Untitled',
        layout: 'PostLayout',
        author: {
          name: (page.properties['Author'] as any)?.created_by?.name ?? 'Unknown',
          avatar: (page.properties['Author'] as any)?.created_by?.avatar_url ?? 'Unknown',
          email: (page.properties['Author'] as any)?.person?.email ?? 'Unknown',
        },
      },
      body: {
        code: String(compiled),
      },
      toc: [],
    }
  } catch (error) {
    console.log(error)
  }
})

export const getPageBlock = React.cache((pageId: string) => {
  return notion.blocks.children
    .list({
      block_id: pageId,
    })
    .then((res) => res.results as BlockObjectRequest[])
})
