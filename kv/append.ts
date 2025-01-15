import { gracely } from "gracely"
import { isoly } from "isoly"
import { http } from "cloudly-http"
import { storage } from "cloudly-storage"
import { isly } from "isly"
import { Context } from "../Context"
import { router } from "../router"

export async function append(request: http.Request, context: Context): Promise<http.Response.Like | any> {
	let result: gracely.Error | any
	const kv = context.kv
	const body = await request.body
	if (!((await context.authenticate(request)) == "admin") || !context.writeable)
		result = gracely.client.unauthorized()
	else if (gracely.Error.is(kv))
		result = kv
	else if (!type.array().is(body))
		result = gracely.client.flawedContent(type.array().flaw(body))
	else {
		const now = isoly.DateTime.now()
		result = await Promise.all(
			body.map(item =>
				kv
					.set(item.key, item.value, {
						meta: item.meta,
						retention: item.expires ? difference(now, item.expires) : undefined,
					})
					.then(() => item)
			)
		)
	}
	return result
}
router.add("PATCH", "/kv", append)

const type = isly.object<storage.KeyValueStore.ListItem<any, any>>(
	{
		key: isly.string(),
		value: isly.any().optional(),
		expires: isoly.DateTime.type.optional(),
		meta: isly.any().optional(),
	},
	"storage.KeyValueStore.ListItem"
)

function difference(left: isoly.DateTime, right: isoly.DateTime): isoly.TimeSpan {
	return isoly.TimeSpan.fromSeconds(isoly.DateTime.epoch(left, "seconds") - isoly.DateTime.epoch(right, "seconds"), {
		normalize: true,
	})
}
