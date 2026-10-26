// report-sheet.gs — the help page's bug reports into a Google Sheet (Okay, 27 Oct 2026: "Sheets is absolutely lovely").
// Lives in the sheet "Dial Tool bug reports" on Okay's Drive: Extensions › Apps Script, paste this, Deploy › New deployment ›
// Web app, Execute as: Me, Who has access: Anyone. The /exec address it gives is ENDPOINT in guide/help/index.html.
// Each report is one row, in the order of the sheet's first line. A report whose hidden _gotcha field is filled is a bot's,
// and is dropped. Opening the /exec address in a browser writes a test row and says "ok", or names the error: the
// Executions list doesn't show a web app's error on an iPad, so the script says it itself.
const COLUMNS = ["when", "name", "email", "happened", "expected", "steps", "version", "dial_link", "browser", "screen", "pointer", "page"];

function save(p) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);      // two reports at once each get their own row
  try {
    const row = COLUMNS.map((k) => k === "when" ? new Date() : String(p[k] || "").slice(0, 5000));
    SpreadsheetApp.getActiveSpreadsheet().getSheets()[0].appendRow(row);
  } finally { lock.releaseLock(); }
}

function doPost(e) {
  const p = (e && e.parameter) || {};
  if (p._gotcha) return ContentService.createTextOutput("ok");
  if (!(p.name || "").trim() || !(p.happened || "").trim()) return ContentService.createTextOutput("missing");
  try { save(p); return ContentService.createTextOutput("ok"); }
  catch (err) { console.error(err); return ContentService.createTextOutput("error: " + err); }
}

function doGet() {
  try { save({ name: "test", happened: "A test row from opening the script's address. Delete it." }); return ContentService.createTextOutput("ok: a test row is in the sheet"); }
  catch (err) { return ContentService.createTextOutput("error: " + err + "\n" + (err.stack || "")); }
}
