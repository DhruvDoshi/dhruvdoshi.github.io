import { faGithub } from '@fortawesome/free-brands-svg-icons/faGithub';
import { faLinkedinIn } from '@fortawesome/free-brands-svg-icons/faLinkedinIn';

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faYoutube,
  faFacebook,
  faTwitter,
  faInstagram
} from "@fortawesome/free-brands-svg-icons";

// See https://fontawesome.com/icons?d=gallery&s=brands,regular&m=free
// to add other icons.

const data = [
  {
    link: 'https://github.com/AniPetrosyan',
    label: 'Github',
    icon: faGithub,
  },
  {
    link: 'https://www.facebook.com/ani.petrosyan.104418',
    label: 'Facebook',
    icon: faFacebook,
  },
  {
    link: 'https://www.instagram.com/ani_petrosiann/',
    label: 'Instagram',
    icon: faInstagram,
  },
  {
    link: 'https://www.linkedin.com/in/ani-petrosyan-6403aa1a0/',
    label: 'LinkedIn',
    icon: faLinkedinIn,
  },
];

export default data;
