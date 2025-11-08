-- Reference for list of tracked symbols

CREATE TABLE IF NOT EXISTS symbols (
	symbol TEXT PRIMARY KEY,
	name TEXT,
	exchange TEXT,
	currency TEXT,
	country TEXT,
	type TEXT,
	active INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS quotes_daily(
	symbol TEXT NOT NULL,
	date TEXT NOT NULL,
	open REAL,
	high REAL,
	low REAL,
	close REAL,
	previous_close REAL,
	change REAL,
	percent_change REAL,
	volume INTEGER,
	average_volume INTEGER,
	fifty_two_week_low REAL,
	fifty_two_week_high REAL,
	fifty_two_week_range TEXT,
	provider_json TEXT,
	PRIMARY KEY (symbol, date)
);
CREATE INDEX IF NOT EXISTS idx_quotes_date ON quotes_daily(date);

CREATE TABLE IF NOT EXISTS company_profile (
   symbol TEXT PRIMARY KEY,
   name TEXT,
   exchange TEXT,
   currency TEXT,
   country TEXT,
   type TEXT,
   sector TEXT,
   industry TEXT,
   website TEXT,
   description TEXT,
   market_cap REAL,
   updated_at TEXT NOT NULL
);

	-- Catalog of tests (what can be run)
CREATE TABLE IF NOT EXISTS tests (
	 id TEXT PRIMARY KEY,             -- e.g. 'rev_growth_ttm'
	 name TEXT NOT NULL,
	 description TEXT,
	 weight REAL NOT NULL,            -- 0..100
	 version INTEGER NOT NULL DEFAULT 1,
	 active INTEGER NOT NULL DEFAULT 1
);

	-- Per-test outputs per symbol/date (evidence)
CREATE TABLE IF NOT EXISTS test_results (
	symbol TEXT NOT NULL,            -- → symbols.symbol
	date   TEXT NOT NULL,            -- 'YYYY-MM-DD' (as-of)
	test_id TEXT NOT NULL,           -- → tests.id
	score REAL,                      -- 0..100 for this test
	raw_value REAL,                  -- optional raw metric
	details TEXT,                    -- optional JSON
	PRIMARY KEY (symbol, date, test_id)
);

-- Aggregate headline score per symbol/date
CREATE TABLE IF NOT EXISTS scores (
  symbol TEXT NOT NULL,            -- → symbols.symbol
  date   TEXT NOT NULL,            -- 'YYYY-MM-DD'
  score  REAL NOT NULL,            -- 0..100
  version INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (symbol, date)
);
