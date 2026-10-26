// report-sheet.gs — the help page's bug reports into a Google Sheet (Okay, 27 Oct 2026: "Sheets is absolutely lovely").
// Lives in the sheet "Dial Tool bug reports" on Okay's Drive: Extensions › Apps Script, paste this, Deploy › New deployment ›
// Web app, Execute as: Me, Who has access: Anyone. The /exec address it gives is ENDPOINT in guide/help/index.html.
// Each report is one row, in the order of the sheet's first line. A report whose hidden _gotcha field is filled is a bot's,
// and is dropped.
const COLUMNS = ["when", "name", "email", "happened", "expected", "steps", "version", "dial_link", "browser", "screen", "pointer", "page"];

function doPost(e) {
  const p = e.parameter || {};
  if (p._gotcha) return ContentService.createTextOutput("ok");
  if (!(p.name || "").trim() || !(p.happened || "").trim()) return ContentService.createTextOutput("missing");
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);      // two reports at once each get their own row
  try {
    const row = COLUMNS.map((k) => k === "when" ? new Date() : String(p[k] || "").slice(0, 5000));
    SpreadsheetApp.getActiveSpreadsheet().getSheets()[0].appendRow(row);
  } finally { lock.releaseLock(); }
  return ContentService.createTextOutput("ok");
}
