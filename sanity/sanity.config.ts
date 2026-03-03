import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { schemaTypes } from './schemas'
import { structure } from './desk/structure'

export default defineConfig({
    name: 'default',
    title: 'TDK Design & Build',

    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '',
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',

    basePath: '/studio',

    plugins: [
        structureTool({
            structure,
        }),
    ],

    schema: {
        types: schemaTypes,
    },
})
