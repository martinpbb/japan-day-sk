// Node SQLite adapter matching the D1 methods used by the Worker.
// Execute a batch synchronously to model D1's serialized atomic write batches.
export function testD1(sqlite) {
  return {
    prepare(sql) {
      let args = [];
      return {
        bind(...values) { args = values; return this; },
        execute() { return { results: sqlite.prepare(sql).all(...args) }; },
        async first() { return sqlite.prepare(sql).get(...args) || null; },
        async all() { return this.execute(); },
      };
    },
    async batch(statements) {
      sqlite.exec('BEGIN');
      try {
        const results = statements.map(statement => statement.execute());
        sqlite.exec('COMMIT');
        return results;
      } catch (error) { sqlite.exec('ROLLBACK'); throw error; }
    },
  };
}
