import React from 'react';
import PropTypes from 'prop-types';

import Certidegree from './Certification/Certidegree';

const Certification = ({ data }) => (
  <div className="education">
    <div className="link-to" id="certification" />
    <div className="title">
      <h3>Certifications</h3>
    </div>
    {data.map((certidegree) => (
      <Certidegree
        data={certidegree}
        key={certidegree.link}
      />
    ))}
  </div>
);

Certification.propTypes = {
  data: PropTypes.arrayOf(PropTypes.shape({
    certidegree: PropTypes.string,
    link: PropTypes.string,
    university: PropTypes.string,
  })),
};

Certification.defaultProps = {
  data: [],
};

export default Certification;
