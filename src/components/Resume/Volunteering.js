import React from 'react';
import PropTypes from 'prop-types';

import Volunteering from './Volunteering/Volunteering';

const VolunteeringExperience = ({ data }) => (
  <div className="experience">
    <div className="link-to" id="experience" />
    <div className="title">
      <h3>Volunteering</h3>
    </div>
    {data.map((job) => (
      <Volunteering
        data={job}
        key={job.company}
      />
    ))}
  </div>
);

VolunteeringExperience.propTypes = {
  data: PropTypes.arrayOf(PropTypes.shape({
    company: PropTypes.string,
    position: PropTypes.string,
    link: PropTypes.string,
    daterange: PropTypes.string,
    points: PropTypes.arrayOf(PropTypes.string),
  })),
};

VolunteeringExperience.defaultProps = {
  data: [],
};

export default VolunteeringExperience;
