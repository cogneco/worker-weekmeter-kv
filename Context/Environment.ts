export interface Environment
	extends Record<string, undefined | string | DurableObjectNamespace | KVNamespace | DurableObjectState | R2Bucket> {
	adminSecret?: string
	kvStore?: KVNamespace
	kvPrefix?: string
	readonly?: "true"
}
