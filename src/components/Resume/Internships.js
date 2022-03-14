import React from 'react';
import PropTypes from 'prop-types';

import Internship from './Internships/Internships';

const Internships = ({ data }) => (
  <div className="experience">
    <div className="link-to" id="experience" />
    <div className="title">
      <h3>Internships</h3>
    </div>
    {data.map((job) => (
      <Internship
        data={job}
        key={job.company}
      />
    ))}
  </div>
);

Internships.propTypes = {
  data: PropTypes.arrayOf(PropTypes.shape({
    company: PropTypes.string,
    position: PropTypes.string,
    link: PropTypes.string,
    daterange: PropTypes.string,
    points: PropTypes.arrayOf(PropTypes.string),
  })),
};

Internships.defaultProps = {
  data: [],
};

export default Internships;