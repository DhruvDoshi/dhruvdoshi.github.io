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
      <section className="page-hero page-shell">
        <p className="eyebrow">Away from the keyboard</p>
        <h1 data-testid="heading">A life beyond the <em>architecture diagrams.</em></h1>
        <p>Travel, milestones, and the people and places that make the work meaningful.</p>
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
