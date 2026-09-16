import { defineType, defineField } from 'sanity';

/**
 * A photograph the site's own design asks for by name — the About page's
 * plates, the interlude's kitchen, the footer's backdrop. These are not
 * content about a project, so they do not belong to one; the code looks them
 * up by `key`, and this lets them be swapped without a deploy.
 *
 * Adding a new key is a code change. Changing the picture behind one is not.
 */
export default defineType({
  name: 'siteImage',
  title: 'Site Image',
  type: 'document',
  fields: [
    defineField({
      name: 'key',
      title: 'Key',
      type: 'slug',
      description: 'The name the code asks for, e.g. about-hero. Do not rename.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'title',
      title: 'Where it appears',
      type: 'string',
      description:
        'For whoever edits this later, e.g. "About page — the wide plate under the headline".',
    }),
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      options: { hotspot: true },
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: { title: 'title', subtitle: 'key.current', media: 'image' },
  },
});
