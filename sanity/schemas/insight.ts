import { defineType, defineField } from 'sanity'

export default defineType({
    name: 'insight',
    title: 'Insight',
    type: 'document',
    fields: [
        defineField({ name: 'title', title: 'Title', type: 'string' }),
        defineField({ name: 'slug', title: 'Slug', type: 'slug', options: { source: 'title' } }),
        defineField({ name: 'author', title: 'Author', type: 'reference', to: [{ type: 'teamMember' }] }),
        defineField({ name: 'publishDate', title: 'Publish Date', type: 'datetime' }),
        defineField({ name: 'category', title: 'Category', type: 'reference', to: [{ type: 'category' }] }),
        defineField({ name: 'excerpt', title: 'Excerpt', type: 'text', validation: rule => rule.max(200) }),
        defineField({
            name: 'heroImageId',
            title: 'Hero Image (Cloudinary ID)',
            type: 'string',
            description: 'Upload to Cloudinary under clients/tdkdb/. Paste the public ID here.',
        }),
        defineField({ name: 'body', title: 'Body', type: 'array', of: [{ type: 'block' }] }),
        defineField({
            name: 'seo',
            title: 'SEO',
            type: 'object',
            fields: [
                defineField({ name: 'title', title: 'Title', type: 'string' }),
                defineField({ name: 'description', title: 'Description', type: 'string' }),
                defineField({ name: 'ogImageId', title: 'Open Graph Image (Cloudinary ID)', type: 'string' }),
            ],
        }),
        defineField({
            name: 'relatedInsightSlugs',
            title: 'Related Insight Slugs',
            type: 'array',
            of: [{ type: 'string' }],
        }),
        // defineField({ name: 'titleEl', title: 'Title (Greek)', type: 'string' }),
        // defineField({ name: 'bodyEl', title: 'Body (Greek)', type: 'array', of: [{ type: 'block' }] }),
    ],
})
