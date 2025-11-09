// Local conversations utility for storing and retrieving chats in the browser
const STORAGE_KEY = 'nerveai:conversations';

function safeParse(json) {
  try {
    return JSON.parse(json);
  } catch (_) {
    return null;
  }
}

export function generateConversationId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `conv_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function createEmptyConversation() {
  const now = new Date().toISOString();
  return {
    id: generateConversationId(),
    title: '',
    miniTitle: '',
    pinned: false,
    messages: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function loadConversations() {
  const raw = localStorage.getItem(STORAGE_KEY);
  const parsed = safeParse(raw);
  return Array.isArray(parsed) ? parsed : [];
}

export function saveConversations(conversations) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
}

export function upsertConversation(conversations, conversation) {
  const index = conversations.findIndex(c => c.id === conversation.id);
  if (index === -1) {
    return [conversation, ...conversations];
  }
  const copy = conversations.slice();
  copy[index] = { ...copy[index], ...conversation };
  // Move updated conversation to the front (most recent)
  const updated = copy.splice(index, 1)[0];
  return [updated, ...copy];
}

export function deleteConversation(conversations, id) {
  return conversations.filter(c => c.id !== id);
}

export function renameConversation(conversations, id, { title, miniTitle }) {
  return conversations.map(c => c.id === id ? { ...c, title: title ?? c.title, miniTitle: miniTitle ?? c.miniTitle, updatedAt: new Date().toISOString() } : c);
}

export function setPinned(conversations, id, pinned) {
  return conversations.map(c => c.id === id ? { ...c, pinned: !!pinned, updatedAt: new Date().toISOString() } : c);
}


