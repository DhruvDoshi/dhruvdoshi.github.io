import React from 'react';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import data from '../../data/contact';

const ContactIcons = () => (
  <ul className="social-links" aria-label="Social links">
    {data.map((s) => (
      <li key={s.label}>
        <a href={s.link} aria-label={s.label} target={s.link.startsWith('http') ? '_blank' : undefined} rel={s.link.startsWith('http') ? 'noreferrer' : undefined}>
          <FontAwesomeIcon icon={s.icon} />
          <span>{s.label}</span>
        </a>
      </li>
    ))}
  </ul>
);

export default ContactIcons;
