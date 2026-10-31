// cards.js — the dials as cards: the Gallery under Export, the saved dials in Versions (save, compare, sheet, a set as
// one link), and the order the cards take.

import * as G from "./geometry.js";
import { pack_discs, pack_even, centre_block } from "./output.js";
import { EXAMPLES } from "./examples.js";
import { GALLERY } from "./gallery.js";
import { TOOL_ICONS, icon } from "./icons.js";
import { $, el, is_light, save_file } from "./ui.js";
import { SECTIONS } from "./rows.js";
import { INSTANCES_MOST, dial_picture, dial_text, entry_settings, instances_read, instances_write, pack } from "./session.js";

export const CARDS = {
  /** five dials to start from: each is a link (R31), so it can also be copied or opened in a new tab. */
  /** a way to the Gallery from the panel's top line: a small pill after Help (Okay, 15 Oct 2026, 07:45: "a shortcut to
   *  the gallery"; 16 Oct: "put it after help with equal gap"). Pressed: the Export tab, the Gallery pane open and
   *  brought into view */
  gallery_way() {
    const go = el("button", { type: "button", className: "gallerypill", id: "to-gallery", textContent: "Gallery", title: "Dials to open and take apart" });
    go.onclick = () => {
      const i = SECTIONS.indexOf("Export");
      if (this.S.ui_section !== i) { this.S.ui_section = i; this.show_section(); this.render(); }
      const pane = this.rows.find((r) => r.fold === "Export/Gallery");
      if (pane && this.is_folded(pane)) this.fold(pane, false);
      const files = this.rows.find((r) => r.fold === "Export/Export a file");      // the pinned pane shuts its eye, so the Gallery has the room (Okay, 15 Oct 2026, 10:47: "When gallery clicked, can you shuteye the export persistent?")
      if (files && !this.is_folded(files)) this.fold(files, true);
      const tabs = $(".panel .tabs"), held = getComputedStyle(tabs).position === "sticky";      // a phone: the tabs stay on top, so the pane stops under them
      const target = $(".gallery").closest(".pane");
      target.style.scrollMarginTop = held ? tabs.offsetHeight + "px" : "";
      requestAnimationFrame(() => target.scrollIntoView({ block: "start", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }));
    };
    return el("div", { className: "galleryway" }, go);
  },

  /** the gallery: dials drawn after documents (web/gallery.mjs), then the five first examples (web/examples.mjs), three to
   *  a line, each with a line saying what it is. */
  row_gallery(wrap) {
    wrap.className = "examples gallery";
    const grid = el("div", { className: "cards" });
    const cards = this.gallery_order([...GALLERY, ...EXAMPLES.map((x) => ({ ...x, note: `${x.name}: one of the guidebook's classic dials` }))]);
    // a card walks into focus (#289, 4.49; Okay's notes, p. 18: "choosing a dial no longer takes it over; it comes forward
    // with two choices, take over editing or open in a new window"): a press lifts the card and shows the two; Escape or
    // a press elsewhere puts it back. The card is still a link, so a middle click or the keyboard's menu opens it as before.
    const unfocus = () => { for (const c of grid.querySelectorAll("a.focus")) c.classList.remove("focus"); };
    for (const e of cards) {
      const card = el("a", { href: e.link, title: e.note });
      card.dataset.light = String(Boolean(e.light));
      card.innerHTML = e.picture;
      const go = (blank) => { if (blank) window.open(e.link, "_blank"); else location.hash = e.link.replace(/^#/, ""); };
      card.append(el("span", { textContent: e.name }), el("span", { className: "choices" },
        el("button", { type: "button", className: "btn main", textContent: "Edit this dial", title: "Open it here, in place of the dial you have", onclick: (ev) => { ev.preventDefault(); ev.stopPropagation(); go(false); } }),
        el("button", { type: "button", className: "btn", textContent: "In a new tab", title: "Keep the dial you have; this one opens in a new tab beside it", onclick: (ev) => { ev.preventDefault(); ev.stopPropagation(); go(true); } })));
      card.onclick = (ev) => { if (ev.metaKey || ev.ctrlKey || ev.shiftKey) return; ev.preventDefault(); const was = card.classList.contains("focus"); unfocus(); if (!was) card.classList.add("focus"); };
      card.onkeydown = (ev) => { if (ev.key === "Escape") { unfocus(); card.blur(); } };
      grid.append(card);
    }
    wrap.append(grid);
    this.listen(document, "pointerdown", (ev) => { if (!grid.contains(ev.target)) unfocus(); }, true);
  },

  /** your own dials (4.76, #347), shown in Versions under undo (#435): Save this dial and Compare on the top line,
   *  then a card for each saved one — its picture, its size and when; pressed, it comes forward as a Gallery card does,
   *  with Edit this dial · In a new tab · Remove. Returns {wrap, draw, unfocus}; draw() reads the browser's list again. */
  instances_view() {
    const wrap = el("div", { className: "examples gallery instances" });
    const save = el("button", { type: "button", className: "btn main", id: "instance-save", textContent: "Save this dial", title: "Keep this dial here, in this browser, as it is now" });
    const compare = el("button", { type: "button", className: "btn", id: "instance-compare", textContent: "Compare", title: "Every saved dial side by side, the panel away" });
    compare.setAttribute("aria-pressed", "false");
    const note = el("p", { className: "quiet", id: "instance-note" });
    const grid = el("div", { className: "cards", id: "instance-cards" });
    const when = (at) => new Date(at).toLocaleString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
    const unfocus = () => { for (const c of grid.querySelectorAll("a.focus")) c.classList.remove("focus"); };
    const draw = () => {
      const list = instances_read();
      const oldest = list.length ? list.reduce((a, b) => (b.at < a.at ? b : a)) : null;
      note.textContent = !list.length ? "Dials you save stay in this browser; a link or a settings file takes one elsewhere."
        : list.length >= INSTANCES_MOST ? `${list.length} of ${INSTANCES_MOST} kept: the next save replaces the oldest, ${oldest.name}. Drag a card to arrange them.`
        : `${list.length} saved in this browser. Drag a card to arrange them.`;
      compare.hidden = list.length < 2;      // R16: nothing to compare with fewer than two
      sheet.hidden = !list.length;
      compare.setAttribute("aria-pressed", String(Boolean(this.comparing)));
      grid.replaceChildren(...list.map((e) => {
        const card = el("a", { href: e.link, title: e.name });
        card.dataset.light = String(Boolean(e.light)); card.dataset.id = e.id;
        card.innerHTML = e.picture;
        // opened here straight from its link, not by changing the address: the address may already hold this very link
        // (it follows the dial a moment late), and then no change is seen
        const go = async (blank) => {
          unfocus();
          const settings = await entry_settings(e);
          if (!settings) return this.log(`couldn’t open ${e.name}`);
          if (blank) return window.open(location.href.split("#")[0] + "#" + await pack(G.fresh_settings(settings)), "_blank");
          this.compare(false); if (this.versions_open) this.versions_open(false); this.reopen({ ...settings, ui_section: this.S.ui_section }); this.log(`opened ${e.name}`);
        };
        const remove = () => { instances_write(instances_read().filter((x) => x.id !== e.id)); draw(); this.sync_rows(); if (this.comparing) this.compare_place(); this.log(`removed ${e.name}`); };
        card.append(el("span", { textContent: e.name }), el("span", { className: "choices" },
          el("button", { type: "button", className: "btn main", textContent: "Edit this dial", onclick: (ev) => { ev.preventDefault(); ev.stopPropagation(); go(false); } }),
          el("button", { type: "button", className: "btn", textContent: "In a new tab", onclick: (ev) => { ev.preventDefault(); ev.stopPropagation(); go(true); } }),
          el("button", { type: "button", className: "btn", textContent: "Remove", onclick: (ev) => { ev.preventDefault(); ev.stopPropagation(); remove(); } })));
        card.onclick = (ev) => { if (ev.metaKey || ev.ctrlKey || ev.shiftKey) return; ev.preventDefault(); if (card.dataset.dragged) { delete card.dataset.dragged; return; } const was = card.classList.contains("focus"); unfocus(); if (!was) card.classList.add("focus"); };
        card.onkeydown = (ev) => { if (ev.key === "Escape") { unfocus(); card.blur(); } };
        // arranged by dragging, here only, never in Compare (Okay, 02:26: "Arranging is allowed on popup, not on compare
        // preview"): a card pressed and moved follows the pointer; let go over another, it takes that one's place
        card.ondragstart = (ev) => ev.preventDefault();      // the browser's own link dragging
        card.onpointerdown = (ev) => {
          if (ev.button !== 0 || ev.target.closest(".choices")) return;
          const from = { x: ev.clientX, y: ev.clientY }; let moving = false;
          const move = (m) => {
            if (!moving && Math.hypot(m.clientX - from.x, m.clientY - from.y) < 6) return;
            if (!moving) { moving = true; unfocus(); card.classList.add("arranging"); card.setPointerCapture(ev.pointerId); }
            card.style.translate = `${m.clientX - from.x}px ${m.clientY - from.y}px`;
          };
          const up = (u) => {
            card.removeEventListener("pointermove", move); card.removeEventListener("pointerup", up); card.removeEventListener("pointercancel", up);
            if (!moving) return;
            card.dataset.dragged = "1"; card.classList.remove("arranging"); card.style.translate = "";
            card.style.visibility = "hidden";
            const over = document.elementFromPoint(u.clientX, u.clientY)?.closest("#instance-cards a");
            card.style.visibility = "";
            if (!over || over === card) return;
            const list = instances_read(), a = list.findIndex((x) => x.id === e.id), b = list.findIndex((x) => x.id === over.dataset.id);
            if (a < 0 || b < 0) return;
            list.splice(b, 0, ...list.splice(a, 1));
            instances_write(list); draw();
          };
          card.addEventListener("pointermove", move); card.addEventListener("pointerup", up); card.addEventListener("pointercancel", up);
        };
        return card;
      }));
    };
    save.onclick = async () => {
      const S = this.S, statik = G.build_static(S), plate = S.c_plate;
      const e = { id: Date.now().toString(36), at: Date.now(), link: "#" + await pack(S), dial: dial_text(S), picture: dial_picture(S, statik), light: is_light(plate) };
      e.name = `${+S.dial_d.toFixed(2)} mm · ${when(e.at)}`;
      let list = instances_read();
      if (list.length >= INSTANCES_MOST) {           // full: the oldest goes (by when it was saved, wherever it was arranged to), and the log says which
        const oldest = list.reduce((a, b) => (b.at < a.at ? b : a));
        list = list.filter((x) => x !== oldest).slice(0, INSTANCES_MOST - 1);
        this.log(`${oldest.name} replaced: ${INSTANCES_MOST} is the most kept`);
      }
      list = [e, ...list];
      if (!instances_write(list)) return this.log("not saved: this browser's storage is full or closed (a private window?) — Copy link keeps it instead");
      draw(); this.sync_rows();
      if (this.comparing) this.compare_place();
      this.log(`saved ${e.name} — under Versions, in this browser`);
    };
    compare.onclick = () => { this.compare(!this.comparing); if (this.versions_open) this.versions_open(false); };
    // the saved dials on one page (#17, a variation sheet): Compare's packing on an A4, each dial at one size, as an SVG
    const sheet = el("button", { type: "button", className: "btn", id: "instance-sheet", textContent: "Sheet", title: "Every saved dial on one A4, as an SVG" });
    sheet.onclick = () => {
      const list = instances_read();
      if (!list.length) return this.log("no saved dials to put on a sheet");
      const [W, H, edge] = [297, 210, 12], holds = (D) => pack_discs(W - 2 * edge, H - 2 * edge, D, D / 12).places.length >= list.length;
      let lo = 1, hi = H - 2 * edge;
      for (let k = 0; k < 30; k++) { const mid = (lo + hi) / 2; if (holds(mid)) lo = mid; else hi = mid; }
      const D = Math.floor(lo * 100) / 100, at = centre_block(pack_discs(W - 2 * edge, H - 2 * edge, D, D / 12).places.slice(0, list.length), W - D, H - D);
      const inner = (svg) => { const v = /viewBox="([^"]+)"/.exec(svg), body = svg.replace(/^<svg[^>]*>|<\/svg>$/g, ""); return [v ? v[1] : "-20 -20 40 40", body]; };
      const parts = list.map((e, i) => { const [vb, body] = inner(e.picture); return `<svg x="${at[i][0].toFixed(2)}" y="${at[i][1].toFixed(2)}" width="${D}" height="${D}" viewBox="${vb}">${body}</svg>`; });
      save_file(`dials-${list.length}-sheet.svg`, `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${W}mm" height="${H}mm" viewBox="0 0 ${W} ${H}"><title>Dial Tool · ${list.length} saved dials</title><metadata>Dial Tool, web version, ${G.VERSION}</metadata><rect width="${W}" height="${H}" fill="#FFFFFF"/>${parts.join("")}</svg>`, "image/svg+xml");
      this.log(`exported dials-${list.length}-sheet.svg · ${list.length} dials on an A4, each ${D} mm across (not to scale)`);
    };
    wrap.append(el("div", { className: "row versionline" }, save, compare, sheet), note, grid);
    this.listen(document, "pointerdown", (ev) => { if (!grid.contains(ev.target)) unfocus(); }, true);
    draw();
    return { wrap, draw, unfocus };
  },

  /** Compare (#435; Okay, 19 Oct 2026, 23:11: "a compare button. this lists and stacks into something like a sheet pdf
   *  controls on pdf export does depending on numbers, always centered with sensible padding: left column hidden
   *  preview mode. no selections or anything is different"): the panel slides away as for the dial alone, and every
   *  saved dial stands on the backdrop, all at one size, packed densely in even, centred rows (pack_even, #468) at the largest size that holds them all. Their pictures are the
   *  ones kept when each was saved. Nothing in it can be picked; Compare again, the eye or Escape ends it. Not part of
   *  a dial (R26: preview only, nothing reaches a file). */
  compare(on) {
    on = Boolean(on) && this.compare_list().length > 1;
    if (on === Boolean(this.comparing)) return;
    this.comparing = on;
    if (on) {
      this.compare_was_alone = this.eye_button.getAttribute("aria-pressed") === "true";
      if (!this.compare_view) {
        this.compare_view = el("div", { className: "compareview", id: "compare-view" });
        this.main.append(this.compare_view);
        this.watchers.push(new ResizeObserver(() => { if (this.comparing) this.compare_place(); }));
        this.watchers.at(-1).observe(this.compare_view);
        this.listen(document, "keydown", (e) => { if (e.key === "Escape" && this.comparing) this.compare(false); });
      }
      if (!this.compare_was_alone) this.dial_alone(true);
    } else if (!this.compare_was_alone && this.eye_button.getAttribute("aria-pressed") === "true") this.dial_alone(false);
    if (!on) { this.looking = null; if (this.set_offer) this.set_offer.hidden = true; }      // a set from a link is looked at only while Compare stands
    this.main.classList.toggle("comparing", on);
    $("#instance-compare")?.setAttribute("aria-pressed", String(on));
    if (on) this.compare_place();
    this.log(on ? `comparing ${this.compare_list().length} ${this.looking ? "dials from a link — press one to edit it" : "saved dials"} — Escape or Compare again to go back` : "comparing ended");
  },

  /** what Compare shows: a set opened from a link while it is looked at (#523), else the dials saved in this browser. */
  compare_list() { return this.looking || instances_read(); },

  /** a set of dials from a link (#523): its pictures drawn here, once their fonts are fetched, then Compare, and a
   *  note asking before anything is kept (Okay, 24 Oct 2026: "Ask first"): Add to my Versions · Just look. A press on
   *  one of the set's dials edits it, as a Versions card's Edit this dial does. Nothing is saved until Add. */
  async look_at_set(dials) {
    const entries = [];
    for (const [i, d] of dials.entries()) {
      const S = G.fresh_settings(d.settings);
      await this.load_fonts_in_use(S);
      entries.push({ id: "set" + i, name: d.name, S, picture: dial_picture(S, G.build_static(S)), light: is_light(S.c_plate) });
    }
    if (entries.length === 1) { this.reopen({ ...entries[0].S, ui_section: this.S.ui_section }); return this.log(`opened ${entries[0].name}, the one dial of a set`); }
    this.compare(false);
    this.looking = entries;
    this.compare(true);
    if (!this.set_offer) {
      this.set_offer = el("div", { className: "previewnote setoffer", id: "set-offer", hidden: true });
      this.note.after(this.set_offer);
    }
    const mine = instances_read(), room = INSTANCES_MOST - mine.length, out = Math.min(mine.length, Math.max(0, entries.length - room));
    const add = el("button", { type: "button", className: "offerbtn main", id: "set-add", textContent: "Add to my Versions", onclick: () => this.keep_set(entries) });
    const look = el("button", { type: "button", className: "offerbtn", id: "set-look", textContent: "Just look", onclick: () => { this.set_offer.hidden = true; } });
    this.set_offer.replaceChildren(el("span", { textContent: `${entries.length} dials from a link${out ? ` · adding replaces your ${out} oldest` : ""}` }), add, look);
    this.set_offer.hidden = false;
  },

  /** a set's dials kept under Versions (#523): newest first, as Save this dial keeps them; over nine, your oldest go. */
  async keep_set(entries) {
    let list = instances_read();
    const now = Date.now(), add = [];
    for (const [i, e] of entries.slice(0, INSTANCES_MOST).entries()) add.push({ id: (now + i).toString(36), at: now + i, name: e.name, link: "#" + await pack(e.S), dial: dial_text(e.S), picture: e.picture, light: e.light });
    while (list.length && list.length + add.length > INSTANCES_MOST) { const oldest = list.reduce((a, b) => (b.at < a.at ? b : a)); list = list.filter((x) => x !== oldest); this.log(`${oldest.name} replaced: ${INSTANCES_MOST} is the most kept`); }
    if (!instances_write([...add, ...list])) return this.log("not saved: this browser's storage is full or closed (a private window?)");
    this.set_offer.hidden = true;
    this.sync_rows();
    this.log(`added ${add.length} dials from a link — under Versions, in this browser`);
  },

  /** Compare's pictures in their places: as large as pack_even can make them in the view, a twelfth of that size
   *  between them, rows as even as can be, each centred (#468). Measured from the view each time it changes size. */
  compare_place() {
    const view = this.compare_view, list = this.compare_list(), n = list.length;
    if (!view || !n) return;
    const packed = pack_even(view.clientWidth, view.clientHeight, n), D = Math.floor(packed.D), places = packed.places;
    if (D < 1) return;
    view.style.setProperty("--compare-d", D + "px");
    view.replaceChildren(...list.map((e, i) => {
      const cell = el("div", { className: "comparedial", title: e.name });
      cell.innerHTML = e.picture;
      cell.style.left = places[i][0] + "px"; cell.style.top = places[i][1] + "px";
      if (this.looking) {                          // a set's dial: a press edits it (your own saved dials stay unpickable here)
        cell.classList.add("pick"); cell.tabIndex = 0;
        cell.onclick = () => { this.compare(false); this.reopen({ ...e.S, ui_section: this.S.ui_section }); this.log(`opened ${e.name}, from the set`); };
      }
      return cell;
    }));
  },

  /** the Gallery's order (#286, 4.49; Okay's notes, p. 17–18): the First dial first, Okay's watch last, and the white
   *  dials on the diagonals of the three-column grid — "just whites zigzag diagonally": the third slot, then the middle
   *  of the next line, then the first of the line after, and back. The rest keep their order in the slots between. */
  gallery_order(cards) {
    const first = cards.find((c) => c.name === "First dial") || cards[0], last = cards.find((c) => c.name === "Okay's watch");
    const rest = cards.filter((c) => c !== first && c !== last), whites = rest.filter((c) => c.light), others = rest.filter((c) => !c.light);
    const n = cards.length, out = new Array(n).fill(null);
    out[0] = first;
    if (last) out[n - 1] = last;
    for (let r = 0; r * 3 < n && whites.length; r++) {      // the zigzag: column 2 · 1 · 0 · 1 · 2 …
      const col = [2, 1, 0, 1][r % 4], at = r * 3 + col;
      if (at < n && !out[at]) out[at] = whites.shift();
    }
    const left = [...others, ...whites];           // a white dial with no slot left on the diagonal comes after the rest
    for (let i = 0; i < n; i++) if (!out[i]) out[i] = left.shift();
    return out.filter(Boolean);
  },

  /** Versions, under undo (#435; Okay, 19 Oct 2026, 23:11: "place this under undo. Icon: dial with two hands. This is
   *  versions. clicking opens mini preview looking list of all the snapshots. 3x grid. 'edit this dial' and others
   *  activate on clicks there too. top, there is a compare button"). A switch of the preview's make, with its sign and
   *  its word, as Guides; pressed, a list drops under it: Save this dial and Compare on its top line, then the saved
   *  dials three across as the Gallery's cards (instances_view). Its look is the panel's, to be designed with Okay. */
  versions_box() {
    const box = el("span", { className: "versions" });
    const button = el("button", { type: "button", className: "onview versionsbox", id: "versions", title: "Your saved dials", ariaLabel: "Versions" });
    button.innerHTML = icon(TOOL_ICONS.versions);
    const word = el("span", { className: "word", textContent: "Versions" });
    word.dataset.text = "Versions";
    button.append(word);
    button.setAttribute("aria-expanded", "false");
    const list = el("div", { className: "versionlist", id: "version-list", hidden: true });
    const view = this.instances_view();
    list.append(view.wrap);
    const open = (on) => {
      list.hidden = !on; button.setAttribute("aria-expanded", String(on));
      if (!on) return view.unfocus();
      view.draw();
      const m = this.main.getBoundingClientRect(), b = button.getBoundingClientRect();      // its room: from under its switch to the preview's foot, measured now (as the guides' list)
      list.style.setProperty("--list-room", `${Math.max(m.bottom - b.bottom - 2 * parseFloat(getComputedStyle(this.main).getPropertyValue("--canvas-inset") || 0), 160)}px`);
    };
    button.onclick = () => open(list.hidden);
    this.versions_open = open;
    box.append(button, list);
    return box;
  },
};
