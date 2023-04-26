/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `wrangler dev src/index.ts` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `wrangler publish src/index.ts --name my-worker` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export interface Env {
	// Example binding to KV. Learn more at https://developers.cloudflare.com/workers/runtime-apis/kv/
	// MY_KV_NAMESPACE: KVNamespace;
	//
	// Example binding to Durable Object. Learn more at https://developers.cloudflare.com/workers/runtime-apis/durable-objects/
	// MY_DURABLE_OBJECT: DurableObjectNamespace;
	//
	// Example binding to R2. Learn more at https://developers.cloudflare.com/workers/runtime-apis/r2/
	// MY_BUCKET: R2Bucket;
	//
	// Example binding to a Service. Learn more at https://developers.cloudflare.com/workers/runtime-apis/service-bindings/
	// MY_SERVICE: Fetcher;
}

// export default {
// 	async fetch(
// 		request: Request,
// 		env: Env,
// 		ctx: ExecutionContext
// 	): Promise<Response> {
// 		return new Response("Hello World!");
// 	},
// };

export default {
	async fetch(request: Request, env: Env, context: ExecutionContext) {
	  const cacheUrl = new URL(request.url);

	  const {pathname, search} = new URL(request.url);
	  const url = new URL(pathname + search, 'https://www.shopify.com');
	  request = new Request(url, request);

	  // Construct the cache key from the cache URL
	  const cacheKey = new Request(cacheUrl, request);
	  const cache = caches.default;

	  try {
		// Check whether the value is already available in the cache
		// if not, you will need to fetch it from origin, and store it in the cache
		let response = await cache.match(cacheKey);

		if (!response) {
		  console.log(
			`Response for request url: ${request.url} not present in cache. Fetching and caching request.`,
		  );
		  // If not in cache, get it from origin
		  response = await fetch(request);

		  // Must use Response constructor to inherit all of response's fields
		  response = new Response(response.body, response);

		  // Cache API respects Cache-Control headers. Setting s-max-age to X seconds
		  // will limit the response to be in cache for 10 seconds max

		  // Any changes made to the response here will be reflected in the cached value
		  response.headers.append('Cache-Control', 's-maxage=30');

		  context.waitUntil(cache.put(cacheKey, response.clone()));
		} else {
		  console.log(`Cache hit for: ${request.url}.`);
		}
		return response;
	  } catch (error) {
		console.log(`Error thrown in fetch handler: ${error}`);
		return new Response('Internal Error: ' + JSON.stringify(error), {
		  status: 500,
		});
	  }
	},
  };
