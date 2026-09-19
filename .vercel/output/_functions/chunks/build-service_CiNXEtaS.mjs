import { y as isESMImportedImage } from "./path_Dnr0v9iP.mjs";
import { t as sharedValidateOptions } from "./shared_MmnuLQuV.mjs";
import { n as baseService } from "./generic_D6-l4Jzq.mjs";
//#region node_modules/@astrojs/vercel/dist/image/build-service.js
var service = {
	...baseService,
	validateOptions: (options, serviceOptions) => sharedValidateOptions(options, serviceOptions.service.config, "production"),
	getHTMLAttributes(options) {
		const { inputtedWidth, ...props } = options;
		if (inputtedWidth) props.width = inputtedWidth;
		let targetWidth = props.width;
		let targetHeight = props.height;
		if (isESMImportedImage(props.src)) {
			const aspectRatio = props.src.width / props.src.height;
			if (targetHeight && !targetWidth) targetWidth = Math.round(targetHeight * aspectRatio);
			else if (targetWidth && !targetHeight) targetHeight = Math.round(targetWidth / aspectRatio);
			else if (!targetWidth && !targetHeight) {
				targetWidth = props.src.width;
				targetHeight = props.src.height;
			}
		}
		const { src, width, height, format, quality, densities, widths, formats, ...attributes } = options;
		return {
			...attributes,
			width: targetWidth,
			height: targetHeight,
			loading: attributes.loading ?? "lazy",
			decoding: attributes.decoding ?? "async"
		};
	},
	getURL(options) {
		if (isESMImportedImage(options.src) && options.src.format === "svg") return options.src.src;
		const fileSrc = isESMImportedImage(options.src) ? removeLeadingForwardSlash(options.src.src) : options.src;
		const searchParams = new URLSearchParams();
		searchParams.append("url", fileSrc);
		options.width && searchParams.append("w", options.width.toString());
		options.quality && searchParams.append("q", options.quality.toString());
		return "/_vercel/image?" + searchParams;
	},
	getSrcSet(options, imageConfig) {
		const { inputtedWidth, densities, widths, ...props } = options;
		if (inputtedWidth) props.width = inputtedWidth;
		let targetWidth = props.width;
		let targetHeight = props.height;
		if (isESMImportedImage(props.src)) {
			const aspectRatio = props.src.width / props.src.height;
			if (targetHeight && !targetWidth) targetWidth = Math.round(targetHeight * aspectRatio);
			else if (targetWidth && !targetHeight) targetHeight = Math.round(targetWidth / aspectRatio);
			else if (!targetWidth && !targetHeight) {
				targetWidth = props.src.width;
				targetHeight = props.src.height;
			}
		}
		const { width: transformWidth, height: transformHeight, ...transformWithoutDimensions } = options;
		const configuredWidths = (imageConfig.service.config.sizes ?? []).sort((a, b) => a - b);
		let allWidths = [];
		if (densities) {
			const densityValues = densities.map((density) => {
				if (typeof density === "number") return density;
				else return Number.parseFloat(density);
			});
			const calculatedWidths = densityValues.sort((a, b) => a - b).map((density) => Math.round(targetWidth * density));
			const sortedDensityValues = densityValues.sort((a, b) => a - b);
			allWidths = calculatedWidths.map((width, index) => {
				if (configuredWidths.includes(width)) return {
					width,
					descriptor: `${sortedDensityValues[index]}x`
				};
				return {
					width: configuredWidths.reduce((prev, curr) => {
						return Math.abs(curr - width) < Math.abs(prev - width) ? curr : prev;
					}),
					descriptor: `${sortedDensityValues[index]}x`
				};
			});
			const widthToDescriptors = /* @__PURE__ */ new Map();
			for (const { width, descriptor } of allWidths) {
				if (!widthToDescriptors.has(width)) widthToDescriptors.set(width, []);
				widthToDescriptors.get(width).push(descriptor);
			}
			allWidths = Array.from(widthToDescriptors.entries()).map(([width, descriptors]) => ({
				width,
				descriptor: descriptors[0]
			}));
		} else if (widths?.length) allWidths = widths.map((width) => ({
			width,
			descriptor: `${width}w`
		}));
		return allWidths.map(({ width, descriptor }) => {
			return {
				transform: {
					...transformWithoutDimensions,
					width
				},
				descriptor
			};
		});
	}
};
function removeLeadingForwardSlash(path) {
	return path.startsWith("/") ? path.substring(1) : path;
}
var build_service_default = service;
//#endregion
export { build_service_default as default };
