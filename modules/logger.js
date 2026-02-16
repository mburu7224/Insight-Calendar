export class ChangeLogger {
  constructor() {
    this.entries = [];
  }

  add(change, reason, metadata = {}) {
    this.entries.push({
      when: new Date().toISOString(),
      change,
      reason,
      metadata
    });
  }

  clear() {
    this.entries = [];
  }

  getAll() {
    return [...this.entries];
  }
}
