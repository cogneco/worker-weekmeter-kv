import { gracely } from "gracely"
import { isoly } from "isoly"
import { http } from "cloudly-http"
import { storage } from "cloudly-storage"
import { Environment as ContextEnvironment } from "./Environment"

export class Context {
	get writeable(): boolean {
		return this.environment.readonly != "true"
	}
	#kv?: storage.KeyValueStore<any, any> | gracely.Error
	get kv(): storage.KeyValueStore<any, any> | gracely.Error {
		return (
			this.#kv ??
			(this.#kv = this.environment.kvStore
				? storage.KeyValueStore.partition(
						readonlyKV(storage.KeyValueStore.Json.create(this.environment.kvStore), !this.writeable),
						this.environment.kvPrefix ?? ""
				  )
				: gracely.server.misconfigured("kvStore", "KeyValueNamespace missing."))
		)
	}
	constructor(public readonly environment: Context.Environment) {
		// if (!gracely.Error.is(this.kv)) {
		// 	this.kv.set("key/a", { name: "a" }, { meta: { index: 0 }, retention: { years: 1 } })
		// 	this.kv.set("key/b", { name: "b" }, { meta: { index: 1 }, retention: { years: 1 } })
		// 	this.kv.set("key/c", { name: "c" }, { meta: { index: 2 }, retention: { years: 1 } })
		// 	this.kv.set("key/d", { name: "d" }, { meta: { index: 3 }, retention: { years: 1 } })
		// 	this.kv.set("key/e", { name: "e" }, { meta: { index: 4 }, retention: { years: 1 } })
		// }
	}
	async authenticate(request: http.Request): Promise<"admin" | undefined> {
		return this.environment.adminSecret && request.header.authorization == `Basic ${this.environment.adminSecret}`
			? "admin"
			: undefined
	}
}
export namespace Context {
	export type Environment = ContextEnvironment
}

function readonlyKV<V, M>(store: storage.KeyValueStore<V, M>, readonly: boolean): storage.KeyValueStore<V, M> {
	return !readonly
		? store
		: {
				set(key: string, value: V | undefined, options?: { retention?: isoly.TimeSpan; meta?: M }): Promise<void> {
					return Promise.resolve()
				},
				get(key: string): Promise<{ value: V; meta?: M } | undefined> {
					return store.get(key)
				},
				list(
					options?: string | storage.KeyValueStore.ListOptions
				): Promise<storage.Continuable<storage.KeyValueStore.ListItem<V, M>>> {
					return store.list(options)
				},
		  }
}
