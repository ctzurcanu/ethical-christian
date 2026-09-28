import React, {useEffect, useState} from 'react';
import Link from '@docusaurus/Link';
import {useHistory, useLocation} from '@docusaurus/router';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import {isValidDate, filterDocuments} from './utils';

export default function RecentDocs({data}) {
  const location = useLocation();
  const history = useHistory();
  const [after, setAfter] = useState(data.defaultAfter);
  const [invalidDate, setInvalidDate] = useState(false);

  useEffect(() => {
    const value = new URLSearchParams(location.search).get('after');
    const invalid = value !== null && !isValidDate(value);
    setInvalidDate(invalid);
    setAfter(value && !invalid ? value : data.defaultAfter);
  }, [location.search, data.defaultAfter]);

  const documents = filterDocuments(data.documents, after);
  function changeDate(event) {
    const value = event.target.value;
    if (!isValidDate(value)) return;
    setAfter(value);
    const params = new URLSearchParams(location.search);
    params.set('after', value);
    history.push({...location, search: `?${params.toString()}`});
  }

  return (
    <Layout title="Recent edits" description="Documents edited after a selected date, newest first.">
      <main className="container margin-vert--lg">
        <Heading as="h1">Recent edits</Heading>
        <p>Documents edited after the selected date, newest first. Dates are in UTC and reflect the latest committed edit.</p>
        <label htmlFor="recent-after">Edited after: </label>
        <input id="recent-after" type="date" value={after} onChange={changeDate} />
        {invalidDate && <p role="alert">Invalid date in the URL. Showing the default period; use YYYY-MM-DD.</p>}
        <p className="margin-top--md" role="status">{documents.length} {documents.length === 1 ? 'document' : 'documents'}</p>
        {documents.length ? (
          <ul>
            {documents.map((doc) => (
              <li key={doc.permalink} className="margin-bottom--sm">
                <Link to={doc.permalink}>{doc.title}</Link>
                {' — '}
                <time dateTime={new Date(doc.updatedAt).toISOString()}>
                  {new Date(doc.updatedAt).toISOString().slice(0, 16).replace('T', ' ')} UTC
                </time>
              </li>
            ))}
          </ul>
        ) : <p>No documents were edited after this date.</p>}
      </main>
    </Layout>
  );
}
