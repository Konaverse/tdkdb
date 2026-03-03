import { defineType, defineField } from 'sanity'

export default defineType({
    name: 'teamMember',
    title: 'Team Member',
    type: 'document',
    fields: [
        defineField({ name: 'name', title: 'Name', type: 'string' }),
        defineField({ name: 'role', title: 'Role', type: 'string' }),
        defineField({ name: 'bio', title: 'Bio', type: 'text' }),
        defineField({
            name: 'photoId',
            title: 'Photo (Cloudinary ID)',
            type: 'string',
            description: 'Upload to Cloudinary under clients/tdkdb/team/. Paste the public ID here.',
        }),
        defineField({ name: 'email', title: 'Email', type: 'string' }),
        defineField({ name: 'linkedin', title: 'LinkedIn URL', type: 'url' }),
        defineField({ name: 'order', title: 'Order', type: 'number' }),
    ],
})
