const fs = require('fs');
const path = require('path');
const {execFileSync} = require('child_process');

const projectDir = __dirname;
const docsDir = path.join(projectDir, 'docs');
const outputFile = path.join(projectDir, 'tree.json');
const configuredGitName = readGitConfig('user.name');
const configuredGitEmail = readGitConfig('user.email');
const configuredIdentity = {
  name: configuredGitName || null,
  email: configuredGitEmail || null,
};
const explicitlyMarkedByMePaths = new Set([
  'docs/ethos-of-jesus/minimal-and-meta-ethos/ethical-inhabitable.md',
  'docs/whole-ethical-christian.md',
  'docs/ethos-of-jesus/minimal-and-meta-ethos/ethical-economy.md',
  'docs/start/gospel-thomas.md',
  'docs/ethos-of-jesus/minimal-and-meta-ethos/false-advertising.md',
  'docs/start/index.md',
  'docs/ethos-of-jesus/minimal-and-meta-ethos/ethos-inheritable.md',
  'docs/ethos-of-jesus/minimal-and-meta-ethos/ethos-transcendental.md',
  'docs/ethos-of-jesus/governance-and-institution/ethos-seed.md',
  'docs/ethos-of-jesus/minimal-and-meta-ethos/positive-golden-rule.md',
  'docs/ethos-of-jesus/minimal-and-meta-ethos/recognition-of-another-ethos.md',
  'docs/ethos-of-jesus/minimal-and-meta-ethos/recognition-of-shared-ethos.md',
  'docs/pauline-upgrade/ethos-as-judge.md',
  'docs/intro.md',
]);

function readGitConfig(key) {
  try {
    return execFileSync('git', ['config', '--get', key], {cwd: projectDir, encoding: 'utf8'}).trim();
  } catch {
    return '';
  }
}

function runGit(args) {
  try {
    return execFileSync('git', args, {cwd: projectDir, encoding: 'utf8'}).trimEnd();
  } catch {
    return '';
  }
}

function normalizeRelativePath(relativePath) {
  return relativePath.split(path.sep).join('/');
}

function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) {
    return {};
  }

  const fields = {};
  for (const line of match[1].split(/\r?\n/)) {
    const field = line.match(/^([A-Za-z_][\w-]*):\s*(.*?)\s*$/);
    if (field) {
      fields[field[1]] = field[2].replace(/^['"]|['"]$/g, '');
    }
  }
  return fields;
}

function titleCaseFromFilename(filename) {
  return filename
    .replace(/\.[^.]+$/, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function fileTitle(relativePath, content, parsedFrontmatter, parsedJson) {
  if (parsedFrontmatter.title) {
    return parsedFrontmatter.title;
  }
  if (parsedJson && typeof parsedJson.label === 'string') {
    return parsedJson.label;
  }
  const firstHeading = content && content.match(/^#\s+(.+)$/m);
  return firstHeading ? firstHeading[1].trim() : titleCaseFromFilename(path.basename(relativePath));
}

function cleanMarkdown(text) {
  return text
    .replace(/^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/, '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')
    .replace(/^\s{0,3}>\s?/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+[.)]\s+/gm, '')
    .replace(/[`*_~]/g, '')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function firstMeaningfulPassage(content) {
  const withoutFrontmatter = content.replace(/^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/, '');
  const paragraphs = withoutFrontmatter
    .split(/\r?\n\s*\r?\n/)
    .map((paragraph) => cleanMarkdown(paragraph))
    .filter((paragraph) => /[A-Za-z]{3}/.test(paragraph));

  return paragraphs.find((paragraph) => paragraph.split(/\s+/).length >= 8) || paragraphs[0] || '';
}

function tokenCount(text) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

function sentenceSafePrefix(text, maximum) {
  const sentences = text.match(/[^.!?]+(?:[.!?](?=\s|$)|$)/g) || [text];
  const selected = [];
  let count = 0;

  for (const sentence of sentences) {
    const words = sentence.trim().split(/\s+/).filter(Boolean);
    if (!words.length) continue;
    if (selected.length && !/[.!?]$/.test(sentence.trim())) break;
    if (count + words.length > maximum) break;
    selected.push(sentence.trim());
    count += words.length;
  }

  return selected.length ? selected.join(' ') : text.trim().split(/\s+/).slice(0, maximum).join(' ');
}

function trimToTokenRange(text, minimum = 20, maximum = 30) {
  let words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length > maximum) {
    const complete = sentenceSafePrefix(text, maximum);
    words = complete.split(/\s+/).filter(Boolean);
    if (words.length === maximum && !/[.!?]$/.test(words[words.length - 1])) {
      words[words.length - 1] = words[words.length - 1].replace(/[,:;.!?]+$/, '') + '…';
    }
  }

  if (words.length < minimum) {
    const additions = [
      'The entry preserves context.',
      'It identifies witnesses, claims, setting, and consequences for Christian communal life.',
    ];
    for (const addition of additions) {
      if (words.length >= minimum) break;
      words = `${words.join(' ')} ${addition}`.trim().split(/\s+/);
    }
    if (words.length > maximum) {
      const complete = sentenceSafePrefix(words.join(' '), maximum);
      words = complete.split(/\s+/).filter(Boolean);
      if (words.length === maximum && !/[.!?]$/.test(words[words.length - 1])) {
        words[words.length - 1] = words[words.length - 1].replace(/[,:;.!?]+$/, '') + '…';
      }
    }
  }

  return words.join(' ');
}

function wholeSentencesWithinLimit(text, maximum) {
  return sentenceSafePrefix(text, maximum);
}

function descriptionForFile({relativePath, title, content, parsedJson, isText}) {
  if (!isText) {
    return trimToTokenRange(
      `${path.basename(relativePath)} is a binary filesystem artifact storing directory display metadata rather than a readable historical or ethical event.`,
    );
  }

  if (parsedJson && typeof parsedJson.label === 'string') {
    return trimToTokenRange(
      `${parsedJson.label} navigation metadata groups documents, preserves the folder’s place in the filesystem, and maintains the site’s intended reading sequence.`,
    );
  }

  const frontmatter = parseFrontmatter(content);
  const lead = frontmatter.description || firstMeaningfulPassage(content);
  const prefix = `${title} —`;
  const availableLeadTokens = Math.max(1, 30 - tokenCount(prefix));
  const completeLead = wholeSentencesWithinLimit(lead, availableLeadTokens);
  return trimToTokenRange(`${prefix} ${completeLead}`);
}

function describeDirectory(name, childStats) {
  const label = name === 'docs' ? 'Documentation' : titleCaseFromFilename(name);
  return trimToTokenRange(
    `${label} folder contains ${childStats.files} document files and ${childStats.directories} nested folders covering this section of the Ethical Christian corpus.`,
  );
}

function parseGitMetadata(relativePath) {
  const output = runGit([
    'log',
    '-1',
    '--format=%H%x00%aI%x00%an%x00%ae%x00%s',
    '--',
    relativePath,
  ]);
  if (!output) {
    return null;
  }

  const [commit, date, name, email, subject] = output.split('\0');
  return {
    commit: commit || null,
    date: date || null,
    name: name || null,
    email: email || null,
    subject: subject || null,
  };
}

function getWorktreeChanges() {
  const status = runGit(['status', '--porcelain=v1', '--untracked-files=all', '--', 'docs']);
  return new Set(
    status
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => line.slice(3).replace(/^"|"$/g, ''))
      .map(normalizeRelativePath),
  );
}

const worktreeChanges = getWorktreeChanges();

function makeFileNode(absolutePath, relativePath) {
  const relativeFromProject = normalizeRelativePath(path.relative(projectDir, absolutePath));
  const stat = fs.statSync(absolutePath);
  const buffer = fs.readFileSync(absolutePath);
  const isText = !buffer.includes(0);
  const content = isText ? buffer.toString('utf8') : null;
  const parsedFrontmatter = content ? parseFrontmatter(content) : {};
  let parsedJson = null;
  if (content && path.extname(relativePath).toLowerCase() === '.json') {
    try {
      parsedJson = JSON.parse(content);
    } catch {
      parsedJson = null;
    }
  }

  const git = parseGitMetadata(relativeFromProject);
  const workingTreeModified = worktreeChanges.has(relativeFromProject);
  const lastEdited = workingTreeModified || !git ? stat.mtime.toISOString() : git.date;
  const explicitlyMarkedByMe = explicitlyMarkedByMePaths.has(relativeFromProject);
  const modifiedByMe = explicitlyMarkedByMe ? true : git ? false : null;

  return {
    kind: 'file',
    name: path.basename(absolutePath),
    path: normalizeRelativePath(relativePath),
    extension: path.extname(absolutePath).toLowerCase() || null,
    title: fileTitle(relativePath, content, parsedFrontmatter, parsedJson),
    text: content,
    isText,
    bytes: stat.size,
    lines: isText ? content.split(/\r?\n/).length : null,
    lastEdited,
    lastEditedSource: workingTreeModified ? 'filesystem (working tree)' : git ? 'git history' : 'filesystem',
    lastEditedBy: git
      ? {name: git.name, email: git.email}
      : null,
    lastEditedCommit: git ? git.commit : null,
    lastEditedCommitSubject: git ? git.subject : null,
    workingTreeModified,
    modifiedByMe,
    modifiedByMeReason: explicitlyMarkedByMe
      ? 'Explicitly marked by the user.'
      : git
        ? 'Not included in the user-provided edited-by-me list.'
        : 'No Git history is available for this filesystem artifact.',
    description: descriptionForFile({relativePath, title: fileTitle(relativePath, content, parsedFrontmatter, parsedJson), content, parsedJson, isText}),
    descriptionTokenCount: tokenCount(descriptionForFile({relativePath, title: fileTitle(relativePath, content, parsedFrontmatter, parsedJson), content, parsedJson, isText})),
  };
}

function summarizeDirectory(node) {
  if (node.kind === 'file') {
    return {
      files: 1,
      textFiles: node.isText ? 1 : 0,
      binaryFiles: node.isText ? 0 : 1,
      directories: 0,
      bytes: node.bytes,
      lastEdited: node.lastEdited,
      modifiedByMeValues: [node.modifiedByMe],
    };
  }

  const totals = node.children.reduce(
    (summary, child) => {
      const childSummary = summarizeDirectory(child);
      summary.files += childSummary.files;
      summary.textFiles += childSummary.textFiles;
      summary.binaryFiles += childSummary.binaryFiles;
      summary.directories += childSummary.directories;
      summary.bytes += childSummary.bytes;
      summary.lastEdited = !summary.lastEdited || childSummary.lastEdited > summary.lastEdited ? childSummary.lastEdited : summary.lastEdited;
      summary.modifiedByMeValues.push(...childSummary.modifiedByMeValues);
      return summary;
    },
    {files: 0, textFiles: 0, binaryFiles: 0, directories: 0, bytes: 0, lastEdited: null, modifiedByMeValues: []},
  );

  totals.directories += 1;
  node.fileCount = totals.files;
  node.directoryCount = totals.directories - 1;
  node.bytes = totals.bytes;
  node.lastEdited = totals.lastEdited;
  const uniqueModificationValues = new Set(totals.modifiedByMeValues);
  node.modifiedByMe = uniqueModificationValues.size === 1 ? totals.modifiedByMeValues[0] : null;
  node.description = describeDirectory(node.name, {
    files: totals.files,
    directories: totals.directories - 1,
  });
  node.descriptionTokenCount = tokenCount(node.description);
  return totals;
}

function buildTree(absoluteDirectory, relativeDirectory) {
  const children = fs
    .readdirSync(absoluteDirectory, {withFileTypes: true})
    .sort((left, right) => {
      if (left.isDirectory() !== right.isDirectory()) {
        return left.isDirectory() ? -1 : 1;
      }
      return left.name.localeCompare(right.name);
    })
    .map((entry) => {
      const absolutePath = path.join(absoluteDirectory, entry.name);
      const relativePath = path.posix.join(relativeDirectory, entry.name);
      return entry.isDirectory()
        ? buildTree(absolutePath, relativePath)
        : makeFileNode(absolutePath, relativePath);
    });

  return {
    kind: 'directory',
    name: path.basename(absoluteDirectory),
    path: normalizeRelativePath(relativeDirectory),
    children,
  };
}

const tree = buildTree(docsDir, 'docs');
const summary = summarizeDirectory(tree);
const generatedAt = new Date().toISOString();
const document = {
  schemaVersion: 1,
  generatedAt,
  sourceDirectory: 'docs',
  lastEditedDefinition: 'Latest Git author date for tracked files; filesystem mtime for working-tree or untracked files.',
  modifiedByMeDefinition: 'Only the explicitly listed user-provided paths are true; other tracked files are false, and files without Git history are null.',
  explicitlyMarkedByMePaths: [...explicitlyMarkedByMePaths],
  descriptionDefinition: 'Descriptions are constrained to 20–30 whitespace-delimited tokens and derived from each document’s title and opening text.',
  configuredGitIdentity: configuredIdentity,
  stats: {
    files: summary.files,
    textFiles: summary.textFiles,
    binaryFiles: summary.binaryFiles,
    directories: summary.directories,
    bytes: summary.bytes,
  },
  tree,
};

fs.writeFileSync(outputFile, `${JSON.stringify(document, null, 2)}\n`);
console.log(`Wrote ${path.relative(projectDir, outputFile)} (${summary.files} files, ${summary.directories} directories).`);
