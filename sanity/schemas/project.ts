import { defineType, defineField } from 'sanity';

export default defineType({
  name: 'project',
  title: 'Project',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string' }),
    defineField({ name: 'slug', title: 'Slug', type: 'slug', options: { source: 'title' } }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          { title: 'Upcoming', value: 'upcoming' },
          { title: 'In Progress', value: 'in-progress' },
          { title: 'Completed', value: 'completed' },
        ],
      },
    }),
    defineField({
      name: 'type',
      title: 'Type',
      type: 'string',
      options: {
        list: [
          { title: 'Residential', value: 'residential' },
          { title: 'Commercial', value: 'commercial' },
          { title: 'Mixed-Use', value: 'mixed-use' },
        ],
      },
    }),
    defineField({ name: 'location', title: 'Location', type: 'string' }),
    defineField({ name: 'year', title: 'Year', type: 'number' }),
    defineField({
      name: 'ctaType',
      title: 'CTA Type',
      type: 'string',
      description:
        'Controls page rendering. showcase = completed portfolio. register-interest = active pre-sale with interest form. contact = generic enquiry.',
      options: {
        list: [
          { title: 'Showcase', value: 'showcase' },
          { title: 'Register Interest', value: 'register-interest' },
          { title: 'Contact', value: 'contact' },
        ],
      },
    }),
    defineField({
      name: 'heroImageId',
      title: 'Hero Image (Cloudinary ID)',
      type: 'string',
      description:
        'Upload to Cloudinary under clients/tdkdb/. Paste the public ID here.\nExample: clients/tdkdb/almond/renders/hero-exterior',
    }),
    defineField({
      name: 'rendersGallery',
      title: 'Renders Gallery',
      type: 'object',
      description: 'CGI renders — the vision',
      fields: [
        defineField({
          name: 'heading',
          title: 'Heading',
          type: 'string',
          description: 'e.g. "THE VISION", "RENDERS"',
        }),
        defineField({
          name: 'images',
          title: 'Images',
          type: 'array',
          of: [{ type: 'string', title: 'Cloudinary ID' }],
        }),
        defineField({ name: 'caption', title: 'Caption', type: 'string' }),
      ],
    }),
    defineField({
      name: 'photosGallery',
      title: 'Photos Gallery',
      type: 'object',
      description:
        'Add progress photos while building. Replace with finished professional photography when complete. Leave empty to hide this section.',
      fields: [
        defineField({
          name: 'heading',
          title: 'Heading',
          type: 'string',
          description: 'e.g. "THE BUILD", "PROGRESS", "COMPLETED"',
        }),
        defineField({
          name: 'images',
          title: 'Images',
          type: 'array',
          of: [{ type: 'string', title: 'Cloudinary ID' }],
        }),
        defineField({
          name: 'caption',
          title: 'Caption',
          type: 'string',
          description: 'e.g. "Updated March 2025"',
        }),
      ],
    }),
    defineField({ name: 'pullQuote', title: 'Pull Quote', type: 'string' }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'array',
      of: [{ type: 'block' }],
    }),
    defineField({ name: 'features', title: 'Features', type: 'array', of: [{ type: 'string' }] }),
    defineField({
      name: 'specs',
      title: 'Specs',
      type: 'array',
      of: [
        defineField({
          name: 'specItem',
          type: 'object',
          fields: [
            defineField({ name: 'key', title: 'Key', type: 'string' }),
            defineField({ name: 'value', title: 'Value', type: 'string' }),
          ],
        }),
      ],
    }),
    defineField({
      name: 'unitsHeading',
      title: 'Units Heading',
      type: 'string',
      description: 'e.g. "AVAILABLE UNITS" or "UNIT BREAKDOWN"',
    }),
    defineField({
      name: 'unitsNote',
      title: 'Units Note',
      type: 'string',
      description: 'e.g. "Pricing available on enquiry"',
    }),
    defineField({
      name: 'units',
      title: 'Units',
      type: 'array',
      of: [
        defineField({
          name: 'unit',
          type: 'object',
          fields: [
            defineField({
              name: 'floor',
              title: 'Floor',
              type: 'string',
              description: 'e.g. "GF", "1F", "2F"',
            }),
            defineField({
              name: 'unitType',
              title: 'Unit Type',
              type: 'string',
              description: 'e.g. "1-Bed", "2-Bed", "Penthouse"',
            }),
            defineField({ name: 'sizeM2', title: 'Size (m2)', type: 'number' }),
            defineField({
              name: 'status',
              title: 'Status',
              type: 'string',
              options: {
                list: [
                  { title: 'Available', value: 'available' },
                  { title: 'Reserved', value: 'reserved' },
                  { title: 'Sold', value: 'sold' },
                ],
              },
            }),
          ],
        }),
      ],
    }),
    defineField({
      name: 'progressPercent',
      title: 'Progress Percent',
      type: 'number',
      validation: (rule) => rule.min(0).max(100),
    }),
    defineField({
      name: 'progressLabel',
      title: 'Progress Label',
      type: 'string',
      description: 'e.g. "Foundation Complete · Structural Work Underway"',
    }),
    defineField({
      name: 'constructionUpdates',
      title: 'Construction Updates',
      type: 'array',
      of: [
        defineField({
          name: 'update',
          type: 'object',
          fields: [
            defineField({ name: 'date', title: 'Date', type: 'date' }),
            defineField({ name: 'imageId', title: 'Image ID (Cloudinary ID)', type: 'string' }),
            defineField({ name: 'caption', title: 'Caption', type: 'string' }),
          ],
        }),
      ],
    }),
    defineField({ name: 'interestFormHeading', title: 'Interest Form Heading', type: 'string' }),
    defineField({ name: 'interestFormSubtext', title: 'Interest Form Subtext', type: 'string' }),
    defineField({ name: 'mapEmbedUrl', title: 'Map Embed URL', type: 'string' }),
    defineField({
      name: 'neighborhoodDescription',
      title: 'Neighborhood Description',
      type: 'array',
      of: [{ type: 'block' }],
    }),
    defineField({
      name: 'relatedProjectSlugs',
      title: 'Related Project Slugs',
      type: 'array',
      of: [{ type: 'string' }],
    }),
    defineField({ name: 'ctaLabel', title: 'CTA Label Override', type: 'string' }),
    defineField({ name: 'ctaHref', title: 'CTA Href Override', type: 'string' }),
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'object',
      fields: [
        defineField({ name: 'title', title: 'Title', type: 'string' }),
        defineField({ name: 'description', title: 'Description', type: 'string' }),
        defineField({
          name: 'ogImageId',
          title: 'Open Graph Image (Cloudinary ID)',
          type: 'string',
        }),
      ],
    }),
    // defineField({ name: 'titleEl', title: 'Title (Greek)', type: 'string' }),
    // defineField({ name: 'pullQuoteEl', title: 'Pull Quote (Greek)', type: 'string' }),
    // defineField({ name: 'descriptionEl', title: 'Description (Greek)', type: 'array', of: [{ type: 'block' }] }),
  ],
});
