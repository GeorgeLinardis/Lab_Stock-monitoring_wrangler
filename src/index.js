/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */
import { DEFAULT_SEARCH_RESULTS_SIZE, MAX_SEARCH_RESULTS_SIZE } from './constants';

async function refreshSymbolsList(env) {
	const apiKey = env.TWELVEDATA_API_KEY;
	// TODO add more exchanges after MVP
	const url = `https://api.twelvedata.com/stocks?exchange=NASDAQ&apikey=${apiKey}`;

	const res = await fetch(url);
	if (!res.ok) {
		throw new Error(`Fetch failed: ${res.status}`);
	}

	const data = await res.json();
	const symbols = data?.data || [];
	if (!symbols.length) {
		console.log("No symbols returned");
		return;
	}

	const sql = `
		INSERT INTO symbols (symbol, name, exchange, currency, country, type, active)
		VALUES (?1, ?2, ?3, ?4, ?5, ?6, 1)
			ON CONFLICT(symbol) DO UPDATE SET
			name = excluded.name,
		  exchange = excluded.exchange,
		  currency = excluded.currency,
		  country = excluded.country,
		  type = excluded.type,
		  active = 1
	`;

	const stmt = env.DB.prepare(sql);

	// keep it light to avoid param & statement-size limits
	const batchSize = 150;

	let processed = 0;
	for (let i = 0; i < symbols.length; i += batchSize) {
		const slice = symbols.slice(i, i + batchSize);

		const ops = slice.map(s =>
			stmt.bind(
				s.symbol ?? null,
				s.name ?? null,
				s.exchange ?? null,
				s.currency ?? null,
				s.country ?? null,
				s.type ?? null
			)
		);

		// Each batch is executed atomically by D1
		await env.DB.batch(ops);
		console.log(`Saved ${slice.length} NASDAQ symbols`);
		processed += slice.length;
	}

	console.log(`Fetched and stored ${processed} NASDAQ symbols`);
}

export default {
	async fetch(req, env, ctx) {
		const url = new URL(req.url);
		if (!env.TWELVE_API_TOKEN) {
			return new Response('Missing token for api')
		}
		if (!env.DB) {
			return new Response('Missing token for db')
		}

		const db = env.DB;

		// if (url.pathname === "/api/test-cron-symbols") {
		// 	await refreshSymbolsList(env);
		// }
		if (url.pathname === "/api/stocks" && req.method === "GET") {
			try {
				const pageParam = Number(url.searchParams.get("page") || 1);
				const sizeParam = Number(url.searchParams.get("pageSize") || DEFAULT_SEARCH_RESULTS_SIZE);
				const page = Number.isFinite(pageParam) && pageParam > 0 ? Math.floor(pageParam) : 1;

				const pageSize = Number.isFinite(sizeParam) && sizeParam > 0
					? Math.min(Math.floor(sizeParam), MAX_SEARCH_RESULTS_SIZE)
					: 50;

				const offset = (page - 1) * pageSize;

				const totalRow = await db.prepare(`
					SELECT COUNT(*) AS totalItems
					FROM symbols
					WHERE active = 1
			`).first();

  			const total = totalRow?.totalItems || 0;

				const query = db.prepare(`
					SELECT symbol, name, exchange, currency, country, type
					FROM symbols
					WHERE active = 1
					ORDER BY symbol ASC
					LIMIT :limit OFFSET :offset
			`).bind({ limit: pageSize, offset });

				const { results: items } = await query.all();

				const totalPages = total === 0 ? 1 : Math.ceil(total / pageSize);

				return new Response(JSON.stringify({
					items,
					page,
					pageSize,
					total,
					totalPages
				}), {
					headers: {
						"content-type": "application/json",
						"Access-Control-Allow-Origin": "*",
					},
				});
			} catch (err) {
				return new Response(JSON.stringify({ error: String(err) }), {
					status: 500,
					headers: { "content-type": "application/json" },
				});
			}
		}

		return new Response('Not found', { status: 404 });
	},
	/**
	 *
	 * @param event - contains info about the trigger
	 * @param env - your env
	 * @param ctx - context of execution
	 *
	 * @returns {Promise<void>}
	 */
	async scheduled(event, env, ctx) {
		if (event.cron === "0 0 * * *") {
			// nightly quotes
			// ctx.waitUntil(runDailyQuotes(env)); // waitUntil wont let Cloudflare kill the the worker until promise settles
		} else if (event.cron === "0 0 * * 1") {
			// weekly profiles (+ symbols if you want)
			// ctx.waitUntil(runWeeklyProfiles(env));
			ctx.waitUntil(refreshSymbolsList(env));
		}
	}
};
