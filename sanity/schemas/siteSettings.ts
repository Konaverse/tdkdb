import { defineType, defineField } from 'sanity';

export default defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  fields: [
    defineField({ name: 'companyName', title: 'Company Name', type: 'string' }),
    defineField({ name: 'tagline', title: 'Tagline', type: 'string' }),
    defineField({ name: 'address', title: 'Address', type: 'string' }),
    defineField({ name: 'phone', title: 'Phone', type: 'string' }),
    defineField({ name: 'email', title: 'Email', type: 'string' }),
    defineField({
      name: 'socialLinks',
      title: 'Social Links',
      type: 'array',
      of: [
        defineField({
          name: 'socialLink',
          type: 'object',
          fields: [
            defineField({ name: 'platform', title: 'Platform', type: 'string' }),
            defineField({ name: 'url', title: 'URL', type: 'url' }),
          ],
        }),
      ],
    }),
    defineField({ name: 'logo', title: 'Logo', type: 'image' }),
    defineField({
      name: 'ogImage',
      title: 'Default Social Share Image',
      type: 'image',
      options: { hotspot: true },
      description: 'Shown when a page is shared and has no image of its own. Landscape.',
    }),
    defineField({ name: 'googleAnalyticsId', title: 'Google Analytics ID', type: 'string' }),
  ],
});
