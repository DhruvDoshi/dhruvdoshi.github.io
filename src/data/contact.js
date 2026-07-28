import { faGithub } from '@fortawesome/free-brands-svg-icons/faGithub';
// import { faFacebookF } from '@fortawesome/free-brands-svg-icons/faFacebookF';
// import { faInstagram } from '@fortawesome/free-brands-svg-icons/faInstagram';
import { faLinkedinIn } from '@fortawesome/free-brands-svg-icons/faLinkedinIn';
// import { faAngellist } from '@fortawesome/free-brands-svg-icons/faAngellist';
import { faEnvelope } from '@fortawesome/free-regular-svg-icons/faEnvelope';
import { faGoogle } from '@fortawesome/free-brands-svg-icons/faGoogle';
import { faCalendar } from '@fortawesome/free-regular-svg-icons';

// See https://fontawesome.com/icons?d=gallery&s=brands,regular&m=free
// to add other icons.

const data = [
  {
    link: 'https://github.com/DhruvDoshi',
    label: 'Github',
    icon: faGithub,
  },
  {
    link: 'https://www.linkedin.com/in/dhruvdoshi25071999',
    label: 'LinkedIn',
    icon: faLinkedinIn,
  },
  {
    link: 'https://scholar.google.com/citations?user=Ri3ZDcIAAAAJ&hl=en',
    label: 'Google Scholar',
    icon: faGoogle,
  },
  {
    link: 'https://calendly.com/dhruvdoshi25071999/15min',
    label: 'Calendar',
    icon: faCalendar,
  },
  {
    link: 'mailto:work@doshidhruv.com',
    label: 'Email',
    icon: faEnvelope,
  },
];

export default data;
