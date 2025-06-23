import { BlockObjectRequest, Client, PageObjectResponse } from '@notionhq/client'
import React from 'react'

export const notion = new Client({
  auth: process.env.NOTION_TOKEN,
})

export const fetchPage = React.cache(() => {
  try {
    if (!process.env.NOTION_DATABASE_ID) {
      console.log('NOTION_DATABASE_ID is not configured')
    }
    if (!process.env.NOTION_TOKEN) {
      console.log('NOTION_TOKEN is not configured')
    }

    const response = notion.databases.query({
      database_id: process.env.NOTION_DATABASE_ID!,
      filter: {
        property: 'Status',
        select: {
          equals: 'Live',
        },
      },
      sorts: [{ property: 'Date', direction: 'ascending' }],
    })

    console.log(response)

    return response
  } catch (error) {
    console.log(error)
  }
})

export const fetchBySlug = React.cache((slug: string) => {
  return notion.databases
    .query({
      database_id: process.env.NOTION_DATABASE_ID!,
      filter: {
        property: 'Slug',
        rich_text: {
          equals: slug,
        },
      },
    })
    .then((res) => res.results[0] as PageObjectResponse | undefined)
})

export const fetchPageBlock = React.cache((pageId: string) => {
  return notion.blocks.children
    .list({
      block_id: pageId,
    })
    .then((res) => res.results as BlockObjectRequest[])
})
