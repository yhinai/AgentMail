// Shared command store for API routes
export const commandStore = new Map<string, any>();

export function getCommandStatus(commandId: string) {
  return commandStore.get(commandId);
}

export function setCommandStatus(commandId: string, status: any) {
  commandStore.set(commandId, status);
}

export function getAllCommands() {
  return Array.from(commandStore.values());
}
