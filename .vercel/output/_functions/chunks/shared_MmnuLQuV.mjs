import { y as isESMImportedImage } from "./path_Dnr0v9iP.mjs";
//#region node_modules/@astrojs/vercel/dist/image/shared.js
var qualityTable = {
	low: 25,
	mid: 50,
	high: 80,
	max: 100
};
function sharedValidateOptions(options, serviceConfig, mode) {
	const vercelImageOptions = serviceConfig;
	if (mode === "development" && (!vercelImageOptions.sizes || vercelImageOptions.sizes.length === 0)) throw new Error("Vercel Image Optimization requires at least one size to be configured.");
	const configuredWidths = vercelImageOptions.sizes.sort((a, b) => a - b);
	if (!options.width) {
		const src = options.src;
		if (isESMImportedImage(src)) {
			const nearestWidth = configuredWidths.reduce((prev, curr) => {
				return Math.abs(curr - src.width) < Math.abs(prev - src.width) ? curr : prev;
			});
			options.inputtedWidth = src.width;
			options.width = nearestWidth;
		} else throw new Error(`Missing \`width\` parameter for remote image ${options.src}`);
	} else if (!configuredWidths.includes(options.width)) {
		const nearestWidth = configuredWidths.reduce((prev, curr) => {
			return Math.abs(curr - options.width) < Math.abs(prev - options.width) ? curr : prev;
		});
		options.inputtedWidth = options.width;
		options.width = nearestWidth;
	}
	if (options.widths) {
		options.widths = options.widths.filter((w) => configuredWidths.includes(w));
		if (options.widths.length === 0) options.widths = [options.width];
	}
	if (options.quality && typeof options.quality === "string") options.quality = options.quality in qualityTable ? qualityTable[options.quality] : void 0;
	if (!options.quality) options.quality = 100;
	return options;
}
//#endregion
export { sharedValidateOptions as t };
