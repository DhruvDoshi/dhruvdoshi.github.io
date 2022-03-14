import React from 'react';
import PropTypes from 'prop-types';

import Nonformaleducation from './NonFormalEducation/Nonformaleducation';

const NonFormalEducation = ({ data }) => (
  <div className="experience">
    <div className="link-to" id="experience" />
    <div className="title">
      <h3>Non-Formal Education</h3>
    </div>
    {data.map((job) => (
      <Nonformaleducation
        data={job}
        key={job.company}
      />
    ))}
  </div>
);

NonFormalEducation.propTypes = {
  data: PropTypes.arrayOf(PropTypes.shape({
    company: PropTypes.string,
    position: PropTypes.string,
    link: PropTypes.string,
    daterange: PropTypes.string,
    points: PropTypes.arrayOf(PropTypes.string),
  })),
};

NonFormalEducation.defaultProps = {
  data: [],
};

export default NonFormalEducation;
