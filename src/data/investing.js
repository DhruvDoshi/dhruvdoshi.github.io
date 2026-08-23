const investmentSections = [
  {
    id: 'objective-and-risk',
    title: 'Objective and risk',
    paragraphs: [
      'My objective during the capital-building phase of my life is to compound capital at an exceptional rate without exposing myself to meaningful risk of permanent ruin. I do not equate volatility with risk; the risks I care about are permanent impairment, poor business economics, dishonest management, excessive valuation, forced liquidation, thesis stagnation, and opportunity cost.',
    ],
  },
  {
    id: 'quality-and-valuation',
    title: 'Quality and valuation',
    paragraphs: [
      'I seek exceptional businesses and exceptional mispricings. My preferred long-term businesses possess durable moats, strong unit economics, high incremental returns on capital, large reinvestment runways, self-funded growth, rational management, and the ability to increase intrinsic value rapidly for many years. I am willing to tolerate weak current margins, depressed free cash flow, or temporarily low reported returns when those figures are the consequence of reinvesting at demonstrably superior future returns.',
      'I am also willing to own slower-compounding exceptional businesses when abnormal valuation creates a powerful rerating opportunity. In these situations, I separate intrinsic compounding from multiple normalization and require sufficient upside even if the expected catalyst is delayed.',
      'Quality is a prerequisite, not a substitute for valuation. A great company purchased at a valuation that discounts years of perfection can be a poor investment. My experience with AAVAS and HDFC reinforces that buying quality at the wrong price can consume years of opportunity cost even when the business itself performs acceptably.',
    ],
  },
  {
    id: 'concentration-and-opportunity-cost',
    title: 'Concentration and opportunity cost',
    paragraphs: [
      'I concentrate when the difference in confidence-adjusted expected return is material, not merely because one spreadsheet estimate is a few percentage points higher. Confidence, understanding, management credibility, and survivability are as important as raw modeled IRR.',
      'Every holding must continuously compete against cash and every other opportunity. Purchase price, cost basis, prior losses, and prior gains are irrelevant to the forward decision. If I would not allocate fresh capital at today’s price, I must understand why I continue to own the position.',
    ],
  },
  {
    id: 'patience-and-reunderwriting',
    title: 'Patience and re-underwriting',
    paragraphs: [
      'I distinguish patience from stubbornness by defining thesis milestones in advance. A falling share price is never by itself evidence of failure, but prolonged market disagreement triggers a complete re-underwriting from zero. I will not repeatedly average down merely because the price is lower. I will add only when the thesis remains intact, forward returns improve, and the opportunity remains superior to available alternatives.',
    ],
  },
  {
    id: 'leverage-and-return-sources',
    title: 'Leverage and return sources',
    paragraphs: [
      'Leverage exists to improve capital efficiency, not manufacture return. I use it only when the duration of the instrument comfortably exceeds the expected thesis realization and when forced liquidation cannot create permanent impairment.',
      'My preferred return comes from growth in intrinsic value. Multiple expansion is welcome but must be identified separately and never disguised as business compounding.',
    ],
  },
  {
    id: 'standards-and-life-stage',
    title: 'Standards and life stage',
    emphasis: 'I prefer a believable 28% return to a fragile 31% forecast.',
    paragraphs: [
      'I prefer measurable economics to narratives, incremental ROIC to headline growth, per-share value creation to revenue growth, integrity to brilliance, and long-term earning power to quarterly optics.',
      'While my capital base remains relatively small, I am willing to exploit high-confidence reratings and temporary dislocations to accelerate capital accumulation. As my wealth becomes sufficient that preservation dominates marginal utility, I will deliberately lower the return hurdle and shift toward greater certainty.',
      'The objective is not to own many stocks. It is to own the best opportunities I can understand, at prices that create extraordinary forward economics, and to have the intellectual honesty to leave when those economics change.',
    ],
  },
];

const investingDescription = 'Dhruv Doshi’s personal investment philosophy: compound capital, avoid permanent ruin, demand quality and valuation discipline, and continuously re-underwrite every holding.';

const investingSearchText = investmentSections
  .flatMap(({ emphasis, paragraphs, title }) => [title, emphasis, ...paragraphs])
  .filter(Boolean)
  .join(' ');

export { investmentSections, investingDescription, investingSearchText };
