import { Navigate, useParams } from 'react-router';

import { findNote } from '../data/notes';

const LegacyPostRedirect = () => {
  const { slug } = useParams();
  const note = findNote(slug);
  return <Navigate to={note ? `/notes/${note.slug}` : '/notes'} replace />;
};

export default LegacyPostRedirect;
