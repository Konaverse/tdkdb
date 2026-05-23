import { StructureResolver } from 'sanity/structure';

export const structure: StructureResolver = (S) =>
  S.list()
    .title('Content')
    .items([
      S.listItem()
        .title('Projects')
        .child(
          S.list()
            .title('Projects by Status')
            .items([
              S.listItem()
                .title('In Progress')
                .child(
                  S.documentList()
                    .title('In Progress Projects')
                    .filter('_type == "project" && status == "in-progress"')
                    .defaultOrdering([{ field: 'year', direction: 'desc' }]),
                ),
              S.listItem()
                .title('Completed')
                .child(
                  S.documentList()
                    .title('Completed Projects')
                    .filter('_type == "project" && status == "completed"'),
                ),
              S.listItem()
                .title('Upcoming')
                .child(
                  S.documentList()
                    .title('Upcoming Projects')
                    .filter('_type == "project" && status == "upcoming"'),
                ),
              S.divider(),
              S.documentTypeListItem('project').title('All Projects'),
            ]),
        ),
      S.divider(),
      S.documentTypeListItem('insight').title('Insights'),
      S.documentTypeListItem('category').title('Categories'),
      S.documentTypeListItem('service').title('Services'),
      S.documentTypeListItem('teamMember').title('Team'),
      S.divider(),
      S.listItem().title('Leads').child(S.documentTypeList('lead').title('Leads by Project')),
      S.divider(),
      S.listItem()
        .title('Site Settings')
        .child(S.document().schemaType('siteSettings').documentId('siteSettings')),
    ]);
