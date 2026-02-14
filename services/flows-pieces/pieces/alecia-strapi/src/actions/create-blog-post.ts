// services/flows-pieces/pieces/alecia-strapi/src/actions/create-blog-post.ts
// Create blog post in Strapi CMS

import { createAction, Property } from '@activepieces/pieces-framework';
import axios from 'axios';

export const createBlogPost = createAction({
  name: 'create-blog-post',
  displayName: 'Create Blog Post',
  description: 'Create a new blog post in Strapi CMS',
  props: {
    strapiUrl: Property.ShortText({
      displayName: 'Strapi URL',
      defaultValue: 'https://cms.alecia.markets',
      required: false,
    }),
    apiToken: Property.ShortText({
      displayName: 'Strapi API Token',
      required: true,
    }),
    title: Property.ShortText({
      displayName: 'Post Title',
      required: true,
    }),
    content: Property.LongText({
      displayName: 'Post Content (Markdown)',
      required: true,
    }),
    excerpt: Property.LongText({
      displayName: 'Excerpt',
      required: false,
    }),
    slug: Property.ShortText({
      displayName: 'URL Slug',
      required: false,
    }),
    category: Property.ShortText({
      displayName: 'Category',
      required: false,
    }),
    tags: Property.Array({
      displayName: 'Tags',
      required: false,
    }),
    publishedAt: Property.DateTime({
      displayName: 'Publish Date',
      description: 'Leave empty for draft',
      required: false,
    }),
  },
  async run(context) {
    const slug = context.propsValue.slug ||
      context.propsValue.title.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

    const postData = {
      data: {
        title: context.propsValue.title,
        content: context.propsValue.content,
        excerpt: context.propsValue.excerpt || context.propsValue.content.substring(0, 200),
        slug,
        category: context.propsValue.category || 'M&A Insights',
        tags: context.propsValue.tags || [],
        publishedAt: context.propsValue.publishedAt || null,
      },
    };

    const response = await axios.post(
      `${context.propsValue.strapiUrl}/api/blog-posts`,
      postData,
      {
        headers: {
          'Authorization': `Bearer ${context.propsValue.apiToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return {
      success: true,
      postId: response.data.data.id,
      title: response.data.data.attributes.title,
      slug: response.data.data.attributes.slug,
      published: !!response.data.data.attributes.publishedAt,
      url: `${context.propsValue.strapiUrl}/blog/${slug}`,
    };
  },
});
