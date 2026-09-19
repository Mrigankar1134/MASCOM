/** Deep-converts Mongo documents (ObjectId, Date) into plain JSON values. */
export function plain<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}
