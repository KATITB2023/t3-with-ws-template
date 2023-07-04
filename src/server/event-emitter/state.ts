/** A record for keeping track of users that are currently typing */
export const currentlyTyping: Record<string, { lastTyped: Date }> = {}; // TODO: Move to key-value store (redis)
