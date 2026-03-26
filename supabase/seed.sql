-- Event seed data
INSERT INTO events (title, description, event_type, event_date, location) VALUES
('Founding Meeting', 'Sign partnership agreement. Elect Authorized Trader. Set initial capital contribution expectations. Establish communication channels (GroupMe/Discord).', 'founding', '2026-03-28', 'UNO - Peter Kiewit Institute'),
('Fiscal Year Begins', 'Official start of FY1. Capital accounts open.', 'deadline', '2026-04-01', 'Virtual'),
('Kickoff Meeting: Club Vision & Bylaws Review', 'Walk through the partnership agreement together. Q&A on voting, contributions, dissociation rules. Set meeting cadence.', 'meeting', '2026-04-05', 'UNO - CEC'),
('Workshop: Brokerage Accounts 101', 'How to open a brokerage account (Schwab, Fidelity, etc.). Difference between taxable, Roth IRA, traditional IRA. Live demo of placing a trade.', 'workshop', '2026-04-19', 'UNO - Peter Kiewit Institute'),
('Meeting: Index Funds & ETFs Deep Dive', 'What are index funds? SPY, VOO, VTI, SCHD comparisons. Dollar-cost averaging strategy. First investment pitch practice round (informal).', 'meeting', '2026-05-03', 'UNO - CEC'),
('Speaker: Local Financial Advisor or CFA', 'Invite a local Omaha financial professional to speak on portfolio construction and risk management. Q&A session.', 'speaker', '2026-05-17', 'UNO - College of Business'),
('Deadline: Initial Capital Contributions Due', 'All founding members submit initial capital contributions. Treasurer records capital accounts.', 'deadline', '2026-05-31', 'Virtual'),
('Meeting: Reading Financial Statements', 'How to read a 10-K, income statement, balance sheet, cash flow. Practice with a real company (e.g., Apple or Berkshire Hathaway).', 'meeting', '2026-06-07', 'UNO - CEC'),
('Workshop: Stock Screeners & Research Tools', 'Hands-on with Finviz, TradingView, SEC EDGAR. How to filter for value, growth, dividend stocks.', 'workshop', '2026-06-21', 'UNO - Peter Kiewit Institute'),
('First Investment Pitch Night', 'Members present stock/ETF pitches (5-10 min each). Structured format: thesis, financials, risks, price target. Vote on top picks for allocation.', 'meeting', '2026-07-12', 'UNO - CEC'),
('Speaker: Entrepreneurship & Investing', 'Invite a local entrepreneur or UNO professor to discuss building wealth through business ownership and market investing.', 'speaker', '2026-07-26', 'UNO - College of Business'),
('Mid-Summer Portfolio Review', 'Review current holdings and performance. Discuss rebalancing. Open floor for new pitches or exits.', 'review', '2026-08-09', 'UNO - CEC'),
('Social: Investing Movie Night', 'Watch The Big Short or Margin Call together. Discussion afterward on lessons and market psychology.', 'social', '2026-08-23', 'TBD'),
('Fall Kickoff & New Member Orientation', 'Recruit new members at UNO. Present club mission, partnership agreement overview, how to join.', 'meeting', '2026-09-06', 'UNO - Student Center'),
('Workshop: Compound Interest & Time Value of Money', 'The math behind financial freedom. Compound interest calculators, retirement projections, why starting early matters.', 'workshop', '2026-09-13', 'UNO - Peter Kiewit Institute'),
('Investment Pitch Night #2', 'Second round of formal pitches. Vote on new allocations. Review summer investments.', 'meeting', '2026-09-27', 'UNO - CEC'),
('Speaker: Real Estate Investing', 'Invite a local real estate investor to discuss REITs, rental properties, and real estate as a portfolio diversifier.', 'speaker', '2026-10-11', 'UNO - College of Business'),
('Workshop: Risk Management & Diversification', 'Position sizing, asset allocation models, correlation. How the club''s diverse member backgrounds create better investment decisions.', 'workshop', '2026-10-25', 'UNO - Peter Kiewit Institute'),
('Meeting: Tax Implications of Investing', 'Capital gains (short vs. long term), tax-loss harvesting, K-1 forms for partnerships. Each partner''s tax reporting responsibilities.', 'meeting', '2026-11-08', 'UNO - CEC'),
('Social: Warren Buffett Omaha Tour', 'Visit Berkshire Hathaway HQ area, Nebraska Furniture Mart. Discuss Buffett''s investment philosophy. Omaha is the hometown — leverage it.', 'social', '2026-11-15', 'Downtown Omaha'),
('End-of-Year Portfolio Review', 'Full portfolio performance review. Compare against S&P 500 benchmark. Discuss wins, losses, lessons learned.', 'review', '2026-12-06', 'UNO - CEC'),
('Workshop: Goal Setting & Personal Finance Plans', 'Each member sets personal financial goals for 2027. Budgeting, emergency funds, debt payoff strategies.', 'workshop', '2026-12-13', 'UNO - Peter Kiewit Institute'),
('Spring Kickoff & Recruitment Drive', 'New semester, new members. Re-introduce club mission. Partnership agreement signing for new partners.', 'meeting', '2027-01-17', 'UNO - Student Center'),
('Investment Pitch Night #3', 'Fresh pitches for the new year. Sector rotation discussion. Vote on Q1 allocations.', 'meeting', '2027-01-31', 'UNO - CEC'),
('Speaker: Careers in Finance', 'Invite a UNO finance professor or Omaha-based analyst to discuss career paths: IB, asset management, fintech, financial planning.', 'speaker', '2027-02-14', 'UNO - College of Business'),
('Workshop: Options & Derivatives Intro', 'Basics of options (calls, puts, covered calls). When/why they make sense. Risk warnings. Not for club capital — educational only.', 'workshop', '2027-02-28', 'UNO - Peter Kiewit Institute'),
('Annual General Meeting & FY1 Wrap-Up', 'Full-year performance report. Vote on leadership for FY2. Amend partnership agreement if needed. Set FY2 goals and contribution levels.', 'review', '2027-03-14', 'UNO - CEC'),
('Fiscal Year End', 'Close FY1 books. Treasurer finalizes capital account statements for all partners.', 'deadline', '2027-03-31', 'Virtual');

-- Portfolio seed data
INSERT INTO holdings (company_name, ticker, shares, avg_cost_basis, current_price) VALUES
('Apple Inc.', 'AAPL', 1, 254.36, 175.00),
('Vanguard S&P 500 ETF', 'VOO', 2, 520.00, 392.00),
('Schwab US Dividend Equity ETF', 'SCHD', 3, 82.50, 58.00);

INSERT INTO club_financials (id, cash_on_hand, total_invested, updated_at) VALUES (1, 746.64, 1500.00, NOW()) ON CONFLICT (id) DO UPDATE SET cash_on_hand = EXCLUDED.cash_on_hand, total_invested = EXCLUDED.total_invested, updated_at = EXCLUDED.updated_at;
