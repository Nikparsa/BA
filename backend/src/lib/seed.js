import { getDb } from './json-db.js';

export function ensureDemoData() {
  const db = getDb();
  // Sample data is automatically created in json-db.js
  db.ensureSampleData();
}









