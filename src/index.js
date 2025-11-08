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
};
