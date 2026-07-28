import React from 'react';
import Main from '../layouts/Main';
import Cell from '../components/Pictures/Cell';
import data from '../data/pictures';
// import { Link } from 'react-router-dom';

const Pictures = () => (
  <Main
    title="Pictures"
    description="See more of Dhruv Doshi's Pictures."
  >
    <>
      <section className="utility-page-header page-shell">
        <h1 data-testid="heading">Pictures</h1>
      </section>
      <section className="picture-grid page-shell" aria-label="Photo journal">
        {data.map((pictures) => (
          <Cell
            data={pictures}
            key={pictures.title}
          />
        ))}
      </section>
    </>
  </Main>
);

export default Pictures;
