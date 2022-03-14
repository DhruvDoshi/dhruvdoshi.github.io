import React from 'react';
import PropTypes from 'prop-types';

import Programs from './Programs/programs';

const InternationalPrograms = ({ data }) => (
  <div className="experience">
    <div className="link-to" id="experience" />
    <div className="title">
    </div>
    {data.map((job) => (
      <Programs
        data={job}
        key={job.company}
      />
    ))}
  </div>
);

InternationalPrograms.propTypes = {
  data: PropTypes.arrayOf(PropTypes.shape({
    company: PropTypes.string,
    position: PropTypes.string,
    link: PropTypes.string,
    daterange: PropTypes.string,
    points: PropTypes.arrayOf(PropTypes.string),
  })),
};

InternationalPrograms.defaultProps = {
  data: [],
};

export default InternationalPrograms;