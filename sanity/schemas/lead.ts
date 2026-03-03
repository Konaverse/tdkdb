import { defineType, defineField } from 'sanity'

export default defineType({
    name: 'lead',
    title: 'Lead',
    type: 'document',
    fields: [
        defineField({ name: 'projectSlug', title: 'Project Slug', type: 'string' }),
        defineField({ name: 'projectName', title: 'Project Name', type: 'string' }),
        defineField({ name: 'name', title: 'Name', type: 'string' }),
        defineField({ name: 'email', title: 'Email', type: 'string' }),
        defineField({ name: 'phone', title: 'Phone', type: 'string' }),
        defineField({ name: 'unitPreference', title: 'Unit Preference', type: 'string' }),
        defineField({ name: 'message', title: 'Message', type: 'text' }),
        defineField({ name: 'submittedAt', title: 'Submitted At', type: 'datetime' }),
        defineField({
            name: 'status',
            title: 'Status',
            type: 'string',
            initialValue: 'new',
            options: {
                list: [
                    { title: 'New', value: 'new' },
                    { title: 'Contacted', value: 'contacted' },
                    { title: 'Qualified', value: 'qualified' },
                    { title: 'Closed', value: 'closed' },
                ],
            },
        }),
        defineField({ name: 'notes', title: 'Internal Notes', type: 'text' }),
    ],
    preview: {
        select: {
            title: 'name',
            subtitle: 'projectName',
        },
    },
})
