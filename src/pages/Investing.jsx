import Main from '../layouts/Main';
import { investmentSections, investingDescription, investingSearchText } from '../data/investing';

const Investing = () => (
  <Main
    title="Investment philosophy"
    description={investingDescription}
    type="article"
    published="2026-08-23"
    modified="2026-08-23"
    articleSection="Investing"
    keywords={['Investing', 'Capital allocation', 'Risk management', 'Valuation', 'Portfolio discipline']}
    wordCount={investingSearchText.split(/\s+/).length}
  >
    <article className="investing-page">
      <header className="investing-hero page-shell">
        <div>
          <p className="eyebrow">Personal capital allocation</p>
          <h1 data-testid="heading">Investment philosophy</h1>
        </div>
        <div className="investing-hero__copy">
          <p className="investing-hero__lede">A framework for compounding capital without accepting a meaningful risk of permanent ruin.</p>
          <p>This is the discipline I want to apply while building capital: seek exceptional economics, demand an intelligent price, and continuously compare every holding with the alternatives.</p>
        </div>
      </header>

      <div className="investment-manifesto">
        {investmentSections.map((section, index) => (
          <section className="investment-section page-shell" id={section.id} key={section.id} aria-labelledby={`${section.id}-title`}>
            <header>
              <span className="investment-section__index" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
              <h2 id={`${section.id}-title`}>{section.title}</h2>
            </header>
            <div className="investment-section__body">
              {section.emphasis && <blockquote>{section.emphasis}</blockquote>}
              {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            </div>
          </section>
        ))}
      </div>

      <aside className="investment-disclaimer page-shell" aria-label="Investment disclaimer">
        <strong>Personal framework, not investment advice.</strong>
        <p>This page describes how I think about my own capital. It is not a recommendation to buy, sell, or hold any security.</p>
      </aside>
    </article>
  </Main>
);

export default Investing;
