import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { E as createAstro, _ as renderHead, h as renderTemplate, v as addAttribute } from "./jsx-runtime_BqAUgf6L.mjs";
import { t as createComponent } from "./compiler_BlfiY-Qw.mjs";
//#region src/pages/index.astro
var pages_exports = /* @__PURE__ */ __exportAll({
	default: () => $$Index,
	file: () => $$file,
	url: () => ""
});
createAstro("https://reframevisuals.com");
var $$Index = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$Index;
	return renderTemplate`<html lang="en"><head><meta charset="utf-8"><link rel="icon" type="image/svg+xml" href="/favicon.svg"><link rel="icon" href="/favicon.ico"><meta name="viewport" content="width=device-width"><meta name="generator"${addAttribute(Astro.generator, "content")}><title>Astro</title>${renderHead($$result)}</head><body><h1>Astro</h1></body></html>`;
}, "F:/Reframe-Visuals-Astro/src/pages/index.astro", void 0);
var $$file = "F:/Reframe-Visuals-Astro/src/pages/index.astro";
//#endregion
//#region \0virtual:astro:page:src/pages/index@_@astro
var page = () => pages_exports;
//#endregion
export { page };
