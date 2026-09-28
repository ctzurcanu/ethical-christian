const path = require('node:path');
const {readLastUpdateData, getVcsPreset} = require('@docusaurus/utils');

module.exports = function recentDocsPlugin(context) {
  return {
    name: 'recent-docs',
    async allContentLoaded({allContent, actions}) {
      const content = allContent['docusaurus-plugin-content-docs'].default;
      const version = content.loadedVersions.find((item) => item.versionName === 'current');
      const documents = await Promise.all(
        version.docs
          .filter((doc) => !doc.draft && !doc.unlisted && !doc.frontMatter.unlisted)
          .map(async (doc) => {
            const {lastUpdatedAt} = await readLastUpdateData(
              path.resolve(context.siteDir, doc.source.replace(/^@site\//, '')),
              {showLastUpdateTime: true, showLastUpdateAuthor: false},
              doc.frontMatter.last_update,
              // Docusaurus uses placeholder dates in development by default.
              getVcsPreset('git-ad-hoc'),
            );
            return {title: doc.title, permalink: doc.permalink, updatedAt: lastUpdatedAt};
          }),
      );
      const cutoff = new Date();
      cutoff.setUTCDate(cutoff.getUTCDate() - 30);
      const data = await actions.createData('recent-docs.json', JSON.stringify({
        defaultAfter: cutoff.toISOString().slice(0, 10),
        documents: documents
          .filter((doc) => Number.isFinite(doc.updatedAt))
          .sort((a, b) => b.updatedAt - a.updatedAt || a.permalink.localeCompare(b.permalink)),
      }));
      actions.addRoute({
        path: `${context.baseUrl}recent`,
        component: '@site/src/components/RecentDocs/index.js',
        modules: {data},
        exact: true,
      });
    },
  };
};
