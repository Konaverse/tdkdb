import { defineType, defineField } from 'sanity'

export default defineType({
    name: 'service',
    title: 'Service',
    type: 'document',
    fields: [
        defineField({ name: 'title', title: 'Title', type: 'string' }),
        defineField({ name: 'slug', title: 'Slug', type: 'slug', options: { source: 'title' } }),
        defineField({ name: 'shortDescription', title: 'Short Description', type: 'text' }),
        defineField({ name: 'fullDescription', title: 'Full Description', type: 'array', of: [{ type: 'block' }] }),
        defineField({
            name: 'heroImageId',
            title: 'Hero Image (Cloudinary ID)',
            type: 'string',
            description: 'Upload to Cloudinary under clients/tdkdb/. Paste the public ID here.',
        }),
        defineField({
            name: 'process',
            title: 'Process Steps',
            type: 'array',
            of: [
                defineField({
                    name: 'processStep',
                    type: 'object',
                    fields: [
                        defineField({ name: 'step', title: 'Step Number', type: 'number' }),
                        defineField({ name: 'title', title: 'Title', type: 'string' }),
                        defineField({ name: 'description', title: 'Description', type: 'text' }),
                    ],
                }),
            ],
        }),
        defineField({
            name: 'faq',
            title: 'FAQ',
            type: 'array',
            of: [
                defineField({
                    name: 'faqItem',
                    type: 'object',
                    fields: [
                        defineField({ name: 'question', title: 'Question', type: 'string' }),
                        defineField({ name: 'answer', title: 'Answer', type: 'array', of: [{ type: 'block' }] }),
                    ],
                }),
            ],
        }),
        defineField({
            name: 'relatedProjectSlugs',
            title: 'Related Project Slugs',
            type: 'array',
            of: [{ type: 'string' }],
        }),
        defineField({
            name: 'seo',
            title: 'SEO',
            type: 'object',
            fields: [
                defineField({ name: 'title', title: 'Title', type: 'string' }),
                defineField({ name: 'description', title: 'Description', type: 'string' }),
            ],
        }),
    ],
})
