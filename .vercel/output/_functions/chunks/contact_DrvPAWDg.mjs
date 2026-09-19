import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { Resend } from "resend";
//#region src/pages/api/contact.ts
var contact_exports = /* @__PURE__ */ __exportAll({ POST: () => POST });
var POST = async ({ request }) => {
	const { email, message } = await request.json();
	if (!email || !message) return new Response(JSON.stringify({ error: "Missing fields" }), { status: 400 });
	const result = await new Resend("").emails.send({
		from: "info@reframevisuals.com",
		to: "admin@reframevisuals.com",
		subject: `New contact from ${email}`,
		html: `<p><strong>From:</strong> ${email}</p><p>${message}</p>`
	});
	return new Response(JSON.stringify({
		ok: true,
		id: result.data?.id
	}), { status: 200 });
};
//#endregion
//#region \0virtual:astro:page:src/pages/api/contact@_@ts
var page = () => contact_exports;
//#endregion
export { page };
