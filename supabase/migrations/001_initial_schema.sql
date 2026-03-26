-- Supabase schema initialization for HAIG app
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member','authorized','admin')),
  capital_contribution NUMERIC(12,2) DEFAULT 0,
  voting_units NUMERIC(8,4) DEFAULT 0,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  avatar_url TEXT
);

CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL CHECK (event_type IN ('founding','meeting','workshop','speaker','social','deadline','review')),
  event_date DATE NOT NULL,
  event_time TIME,
  location TEXT DEFAULT 'TBD',
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE pitches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submitted_by UUID REFERENCES profiles(id) NOT NULL,
  company_name TEXT NOT NULL,
  ticker TEXT NOT NULL,
  pitch_type TEXT NOT NULL CHECK (pitch_type IN ('buy','sell','hold')),
  thesis TEXT NOT NULL,
  financials TEXT,
  risks TEXT,
  price_target NUMERIC(12,2),
  current_price NUMERIC(12,2),
  vote_threshold TEXT NOT NULL DEFAULT 'simple' CHECK (vote_threshold IN ('simple','supermajority_two_thirds','supermajority_three_quarters')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','voting','approved','rejected','closed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pitch_id UUID REFERENCES pitches(id) ON DELETE CASCADE NOT NULL,
  voter_id UUID REFERENCES profiles(id) NOT NULL,
  vote TEXT NOT NULL CHECK (vote IN ('yes','no','abstain')),
  voting_units_cast NUMERIC(8,4) NOT NULL,
  cast_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (pitch_id, voter_id)
);

CREATE TABLE holdings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  ticker TEXT NOT NULL,
  shares NUMERIC(12,6) NOT NULL,
  avg_cost_basis NUMERIC(12,2) NOT NULL,
  current_price NUMERIC(12,2),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  ticker TEXT NOT NULL,
  trade_type TEXT NOT NULL CHECK (trade_type IN ('buy','sell')),
  shares NUMERIC(12,6) NOT NULL,
  price_per_share NUMERIC(12,2) NOT NULL,
  trade_date DATE NOT NULL,
  suggested_by UUID REFERENCES profiles(id),
  pitch_id UUID REFERENCES pitches(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  member_id UUID REFERENCES profiles(id) NOT NULL,
  present BOOLEAN DEFAULT FALSE,
  UNIQUE (event_id, member_id)
);

CREATE TABLE club_financials (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  cash_on_hand NUMERIC(12,2) DEFAULT 0,
  total_invested NUMERIC(12,2) DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
