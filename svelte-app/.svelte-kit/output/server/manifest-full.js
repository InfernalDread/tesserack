export const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "tesserack/_app",
	assets: new Set(["lib/binjgb.js","lib/binjgb.wasm"]),
	mimeTypes: {".js":"text/javascript",".wasm":"application/wasm"},
	_: {
		client: {start:"_app/immutable/entry/start.Bd0wqhoq.js",app:"_app/immutable/entry/app.DPKLIUGp.js",imports:["_app/immutable/entry/start.Bd0wqhoq.js","_app/immutable/chunks/Btl_phDy.js","_app/immutable/chunks/C5GrreSL.js","_app/immutable/chunks/CJ9xGzRj.js","_app/immutable/entry/app.DPKLIUGp.js","_app/immutable/chunks/DyWeSNnq.js","_app/immutable/chunks/C5GrreSL.js","_app/immutable/chunks/CJ9xGzRj.js","_app/immutable/chunks/BaaezYVm.js","_app/immutable/chunks/DTH6BjkA.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('./nodes/0.js')),
			__memo(() => import('./nodes/1.js')),
			__memo(() => import('./nodes/2.js'))
		],
		remotes: {
			
		},
		routes: [
			{
				id: "/",
				pattern: /^\/$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 2 },
				endpoint: null
			}
		],
		prerendered_routes: new Set([]),
		matchers: async () => {
			
			return {  };
		},
		server_assets: {}
	}
}
})();
