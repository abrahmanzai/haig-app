-- Portfolio seed data
INSERT INTO holdings (company_name, ticker, shares, avg_cost_basis, current_price) VALUES
('Apple Inc.', 'AAPL', 1, 254.36, 175.00),
('Vanguard S&P 500 ETF', 'VOO', 2, 520.00, 392.00),
('Schwab US Dividend Equity ETF', 'SCHD', 3, 82.50, 58.00);

INSERT INTO club_financials (id, cash_on_hand, total_invested, updated_at) VALUES (1, 746.64, 1500.00, NOW()) ON CONFLICT (id) DO UPDATE SET cash_on_hand = EXCLUDED.cash_on_hand, total_invested = EXCLUDED.total_invested, updated_at = EXCLUDED.updated_at;
