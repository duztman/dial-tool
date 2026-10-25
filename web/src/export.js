// export.js — files out and in: PDF, SVG, PNG, the print sheet, the spec sheet, a mask per ink, the moving picture
// (MP4, GIF), the Wear OS watch face, the settings file, the link box and Copy link, the log.

import * as G from "./geometry.js";
import { svg_document, pdf_document, png_with_dpi, file_name, pdf_sheet, sheet_layout, spec_sheet } from "./output.js";

import * as SHOW from "./show.js";      // show mode: the watch round the dial, its tabs, its export (#509)
import { generate_watchface_xml } from "./wearos/wff_xml.js";
import { svg_dial_face, svg_hand, svg_cap, svg_preview, svg_window_sheet, svg_to_png_bytes } from "./wearos/wff_assets.js";
import { build_signed_wearos_apk, format_package_name, sanitize_package_suffix } from "./wearos/apk_packager.js";
import { Muxer, ArrayBufferTarget } from "mp4-muxer";      // MP4's container (MIT): the frames are encoded by the browser (WebCodecs), this packs them (#51)
import { GIFEncoder, quantize, applyPalette } from "gifenc";      // GIF's encoder (MIT, #51)
import { $, GIF_FPS_MOST, GIF_MOST, PNG_MOST, PNG_SAFE, el, save_file } from "./ui.js";
import { mask_says } from "./rows.js";
import { TOOL_ICONS, icon } from "./icons.js";
import { entry_settings, instances_read, pack, pack_set } from "./session.js";

export const EXPORT = {
  row_export_watch_png(wrap) {
    wrap.className = "row";
    wrap.append(el("label", { textContent: "Image" }), el("button", { type: "button", className: "btn main", id: "export-watch-png", textContent: "PNG", onclick: () => SHOW.export_watch(this, "png", save_file).catch((e) => this.log("the watch's PNG failed: " + e.message)) }));
  },

  row_export_watch_pdf(wrap) {
    wrap.className = "row";
    wrap.append(el("label", { textContent: "Page" }), el("button", { type: "button", className: "btn main", id: "export-watch-pdf", textContent: "PDF", onclick: () => SHOW.export_watch(this, "pdf", save_file).catch((e) => this.log("the watch's PDF failed: " + e.message)) }));
  },

  /** files that stay drawings. The PNG button is on its own row, with its dpi. */
  row_export_pdf(wrap) {
    wrap.className = "row";
    wrap.append(el("label", { textContent: "Vector" }), this.export_button("PDF"));
  },

  row_export_svg(wrap) {                             // under PDF, on the same column
    wrap.className = "row";
    wrap.append(el("span", { className: "blank" }), this.export_button("SVG"));
  },

  row_export_png(wrap) {                             // on the same column as PDF and SVG (Okay, 13 Oct 2026); its settings are the rows under it
    wrap.className = "row";
    wrap.append(el("label", { textContent: "Image" }), this.export_button("PNG"));
  },

  /** a film per ink (#35): its button, and the inks it will write. */
  row_ink_films(wrap, out) {
    wrap.className = "row";
    const go = el("button", { type: "button", className: "btn main", id: "export-inks", textContent: "A mask per ink", title: "One mask PDF for each colour the dial is printed in", onclick: async () => {
      const inks = G.inks_of(this.S);
      this.log(`a mask per ink: ${inks.length} films (${inks.join(", ")})${inks.length > 1 ? " — if the browser asks whether this page may download several files, allow it" : ""}`);
      for (const ink of inks) { await this.export("pdf", { out_production: true, out_ink: ink }); await new Promise((r) => setTimeout(r, 350)); }
    } });
    wrap.append(el("label", { textContent: "Inks" }), go);
    out.refresh = (S) => { const n = G.inks_of(S); go.textContent = `A mask per ink · ${n.length}`; go.title = `One mask PDF for each colour the dial is printed in: ${n.join(" ")}`; };
  },

  /** a spec sheet (#18): its button, on the print sheet's column. */
  row_spec_sheet(wrap) {
    wrap.className = "row";
    wrap.append(el("label", { textContent: "Spec" }), el("button", { type: "button", className: "btn main", id: "export-spec", textContent: "Spec sheet", title: "The dial with its measures, for a supplier (SVG, A4)", onclick: () => this.export("spec", { out_production: false, out_mirror: false }) }));
  },

  /** a moving picture (#51): MP4 and GIF, and the speed they run at. */
  row_export_motion(wrap) {
    wrap.className = "row";
    const b = (kind) => el("button", { type: "button", className: "btn main", id: "export-" + kind, textContent: kind.toUpperCase(), title: `A moving ${kind.toUpperCase()} of the dial`, onclick: () => this.export_motion(kind) });
    wrap.append(el("label", { textContent: "Motion" }), el("span", { className: "btnline" }, b("mp4"), b("gif")));
  },

  /** the dial's frames from the time shown, each drawn as the PNG export draws (the scene as an SVG, onto a canvas) with
   *  its backdrop, no guides (R5); an MP4 through the browser's own video encoder (WebCodecs; Chrome, Edge, Safari 17)
   *  packed by mp4-muxer, or a GIF through gifenc (its 256 colours chosen per frame). Says what it does in the log, and
   *  why when it can't (R17). */
  async export_motion(kind) {
    const S = { ...this.S, guides: false, xray: false, out_production: false, out_mirror: false }, statik = G.build_static(S), k = this.speed || 1;
    const gif = kind === "gif", px = Math.round(gif ? Math.min(S.out_px, GIF_MOST) : S.out_px) & ~1, fps = gif ? Math.min(S.out_fps, GIF_FPS_MOST) : S.out_fps;
    const n = Math.max(1, Math.round(S.out_seconds * fps)), name = file_name(S, kind);
    if (!gif && !window.VideoEncoder) return this.log("MP4 not made: this browser has no video encoder (WebCodecs). Chrome, Edge and Safari 17 have one; or make a GIF.");
    this.log(`making ${name}: ${n} frames at ${px} px…`);
    const canvas = el("canvas", { width: px, height: px }), pen = canvas.getContext("2d", { willReadFrequently: gif });
    const draw = async (t) => {
      const image = new Image();
      image.src = URL.createObjectURL(new Blob([svg_document(S, statik, t, { preview: true })], { type: "image/svg+xml" }));
      await image.decode();
      pen.clearRect(0, 0, px, px); pen.drawImage(image, 0, 0, px, px);
      URL.revokeObjectURL(image.src);
    };
    const time = (i) => (((S.t + i / fps * k) % 86400) + 86400) % 86400;
    try {
      let bytes;
      if (gif) {
        const enc = GIFEncoder();
        for (let i = 0; i < n; i++) {
          await draw(time(i));
          const rgba = pen.getImageData(0, 0, px, px).data, palette = quantize(rgba, 256);
          enc.writeFrame(applyPalette(rgba, palette), px, px, { palette, delay: Math.round(1000 / fps) });
        }
        enc.finish();
        bytes = enc.bytes();
      } else {
        // H.264, which every player and After Effects read; where the browser has none (an open-source Chromium), VP9 in
        // the same MP4, and the log says so
        const base = { width: px, height: px, bitrate: Math.round(px * px * fps * 0.15), framerate: fps };
        let config = null, codec = "avc";
        for (const [c, name] of [["avc1.640033", "avc"], ["vp09.00.40.08", "vp9"]]) {
          const ok = await VideoEncoder.isConfigSupported({ ...base, codec: c }).catch(() => ({ supported: false }));
          if (ok.supported) { config = { ...base, codec: c }; codec = name; break; }
        }
        if (!config) return this.log(`MP4 not made: this browser can't encode video at ${px} × ${px}. Try a smaller Size px, or a GIF.`);
        if (codec === "vp9") this.log("this browser has no H.264 encoder: the MP4 holds VP9 video, which some players and After Effects don't read");
        const muxer = new Muxer({ target: new ArrayBufferTarget(), video: { codec, width: px, height: px }, fastStart: "in-memory" });
        let failed = null;
        const encoder = new VideoEncoder({ output: (chunk, meta) => muxer.addVideoChunk(chunk, meta), error: (e) => { failed = e; } });
        encoder.configure(config);
        for (let i = 0; i < n && !failed; i++) {
          await draw(time(i));
          const frame = new VideoFrame(canvas, { timestamp: Math.round(i * 1e6 / fps), duration: Math.round(1e6 / fps) });
          encoder.encode(frame, { keyFrame: i % (fps * 2) === 0 });
          frame.close();
        }
        await encoder.flush();
        if (failed) throw failed;
        muxer.finalize();
        bytes = new Uint8Array(muxer.target.buffer);
      }
      save_file(name, bytes, gif ? "image/gif" : "video/mp4");
      this.log(`exported ${name} · ${n} frames · ${px} × ${px} px · ${fps} a second · ${(bytes.length / 1048576).toFixed(1)} MB`);
    } catch (e) {
      this.log(`${kind.toUpperCase()} not made (${e.name}: ${e.message})`);
    }
  },

  /** a set of files (#171): every ticked one written, one after the other. Chrome asks once whether the page may save
   *  several files; the log says so. */
  row_export_set(wrap) {
    wrap.className = "row";
    const go = el("button", { type: "button", className: "btn main", id: "export-set", textContent: "Export ticked", title: "Write every ticked file" });
    go.onclick = async () => {
      const chosen = G.FILE_SET.filter(([key]) => this.S[key]);
      if (!chosen.length) return this.log("nothing ticked to export");
      if (chosen.length > 1) this.log(`exporting ${chosen.length} files — if the browser asks whether this page may download several files, allow it`);
      for (const [, , kind, over] of chosen) { await this.export(kind, over); await new Promise((r) => setTimeout(r, 350)); }
    };
    wrap.append(el("span", { className: "blank" }), go);
  },

  export_button(kind) {
    return el("button", { type: "button", className: "btn main", id: "export-" + kind.toLowerCase(), textContent: kind, title: `Export a ${kind}`, onclick: () => this.export(kind.toLowerCase()) });
  },

  /** a print sheet (4.75, #348): its button, and the page drawn small beside it — the paper, every copy where it will stand. */
  row_print_sheet(wrap, out) {
    wrap.className = "row sheetrow";
    const btn = el("button", { type: "button", className: "btn main", id: "export-sheet", textContent: "Sheet PDF", title: "A page of copies, at true size, to print", onclick: () => this.export("sheet") });
    const page = el("span", { className: "sheetpage", id: "sheet-page" });
    wrap.append(el("label", { textContent: "Sheet" }), btn, page);
    out.refresh = (S) => {
      const L = sheet_layout(S), [, W, H] = L.paper, r = S.dial_d / 2;
      page.innerHTML = `<svg viewBox="0 0 ${W} ${H}" aria-hidden="true"><rect class="paper" width="${W}" height="${H}"/>${L.places.map(([x, y]) => `<circle class="copy" cx="${x.toFixed(2)}" cy="${(H - y).toFixed(2)}" r="${r}"/>`).join("")}</svg>`;
    };
  },

  /** under the PNG row: what that dpi comes to. */
  /** the Wear OS export (4.67, farukahmet's PR #1): a watch face (Watch Face Format) as an APK to sideload — over adb, or
   *  a sideloading app. Signed with a shared debug key: right for one's own watch, never for the Play Store. */
  row_export_wearos(wrap) {
    wrap.className = "row";
    const btn = el("button", { type: "button", className: "btn main", id: "export-wearos", textContent: "APK", title: "A Wear OS watch face (.apk) to sideload onto your watch", onclick: () => this.export("wearos") });
    wrap.append(el("label", { textContent: "Wear OS" }), btn);
  },

  /** the watch face's name on the watch; it makes the package's name too, so several dials can live on one watch. */
  row_wearos_name(wrap, out) {
    wrap.className = "row txt tied";
    const field = el("input", { type: "text", id: "wearos-name", placeholder: "Its name on the watch: Dial Tool", ariaLabel: "Watch face name" });
    field.onchange = () => this.set_value("global", "wearos_name", field.value.trim());
    wrap.append(el("span"), field);
    out.refresh = (T) => { if (document.activeElement !== field) field.value = T.wearos_name || ""; };
  },

  row_wearos_pkg(wrap, out) {
    wrap.className = "row note under";
    const text = el("span", { className: "quiet", id: "wearos-pkg" });
    wrap.append(el("span"), text);
    out.refresh = (T) => { const label = (T.wearos_name || "").trim() || "Dial Tool"; text.textContent = `${label} · ${format_package_name("", label)} · signed for sideloading, not for the Play Store`; };
  },

  row_png_size(wrap, out) {
    wrap.className = "row note under";                // under: it starts on the buttons' column, not at the left (Okay, 13 Oct 2026)
    const text = el("span", { className: "quiet", id: "png-size" });
    wrap.append(el("span"), text);
    out.refresh = () => { const mm = G.page_mm(this.S), px = Math.round(mm / 25.4 * this.S.out_dpi); text.textContent = `${this.in_unit(mm, 1)} ${this.unit()[0]} at ${Math.round(this.S.out_dpi)} dpi = ${px} × ${px} px`; };
  },

  /** a settings file: the whole dial, every value, kept to open again (R31: a link is for sharing, a file for keeping).
   *  A sentence says so; after Load the pane's heading names the file, and Save… offers that name again (a browser can't
   *  write over it). Save… · Load… only (Okay, 21 Oct 2026: "Remove both", #434): the resets are Dial › Reset's (R34). */
  row_settings(wrap) {
    wrap.className = "row";
    const file = el("input", { type: "file", accept: ".json,application/json", hidden: true, id: "load-file" });
    file.onchange = async () => { if (file.files[0]) this.load_text(await file.files[0].text(), file.files[0].name); file.value = ""; };
    wrap.append(el("p", { className: "quiet setnote", id: "settings-note", textContent: "A settings file keeps this dial with every value, to open again here or on another computer." }), el("span", { className: "tools wide even" },
      el("button", { type: "button", className: "btn", id: "save", textContent: "Save…", onclick: () => { const name = this.loaded_name || file_name(this.S, "json"); save_file(name, JSON.stringify({ ...this.S, ui_section: Math.min(this.S.ui_section, 4) }, null, 1), "application/json"); this.log(`saved ${name} to your downloads`); } }),   // dial.py knows sections 0–4
      el("button", { type: "button", className: "btn", textContent: "Load…", onclick: () => file.click() }),
      file));
  },

  /** the dial's link, spelled out on one line (cut at the box's edge: Copy link copies it whole), and how long it is.
   *  Its Copy button stands on the pane's heading line (Okay, 16 Oct 2026, #277: "copy link moves to top line flush
   *  right, gets a link icon"; under the link, beside its length, until then). */
  row_link(wrap, out) {
    wrap.className = "linkrow";
    this.link_box = el("input", { type: "text", id: "link", className: "link", readOnly: true, spellcheck: false, ariaLabel: "Link to this dial" });
    this.link_box.onfocus = () => this.link_box.select();
    wrap.append(this.link_box, el("p", { className: "quiet linknote", id: "link-size" }));
    out.refresh = () => this.show_link();
  },

  row_link_copy(wrap) {                            // on the heading line (head)
    const copy = el("button", { type: "button", className: "btn copylink", id: "copy-link", title: "Copy the link to this dial", onclick: (e) => this.copy_link(e.currentTarget) }, el("span", { textContent: "Copy link" }));
    copy.insertAdjacentHTML("afterbegin", icon(TOOL_ICONS.link));
    wrap.append(copy);
  },

  /** every saved dial in one link (#523), under the dial's own: shown with two saved dials or more (R16). */
  row_link_set(wrap) {
    wrap.className = "row";
    const copy = el("button", { type: "button", className: "btn copylink", id: "copy-set", title: "One link holding every dial saved under Versions", onclick: (ev) => this.copy_set(ev.currentTarget) }, el("span", { textContent: "Copy set link" }));
    copy.insertAdjacentHTML("afterbegin", icon(TOOL_ICONS.link));
    wrap.append(el("label", { textContent: "Versions" }), copy);
  },

  async copy_set(button) {
    const made = (async () => {
      const dials = [];
      for (const e of instances_read()) { const S = await entry_settings(e); if (S) dials.push({ name: e.name, S: G.fresh_settings(S) }); }
      return location.href.split("#")[0] + "#" + await pack_set(dials);
    })();
    return this.copy_link(button, made, "Copy set link", `set link (${instances_read().length} dials)`);
  },

  async show_link() {
    const link = location.href.split("#")[0] + "#" + await pack(this.S);
    if (this.link_box && this.link_box.isConnected) {
      this.link_box.value = link;
      $("#link-size").textContent = `${link.length} characters. Fonts travel by name: whoever opens it needs the same fonts.`;      // Okay, 16 Oct 2026: "Explain fonts travel by name"
    }
    return link;
  },

  row_log(wrap, out) {
    wrap.className = "logrow";
    const box = el("pre", { className: "log", id: "log" });
    wrap.append(box);
    out.refresh = () => { box.textContent = this.log_lines.join("\n"); };
  },

  async export(kind, over = null) {      // over: settings that differ for this one file (a set of files, #171)
    try {
      const S = over ? { ...this.S, ...over } : this.S, statik = G.build_static(S);
      const name = file_name(S, kind);
      if (S.out_production && !["json", "wearos"].includes(kind)) { const lost = G.mask_merges(statik); if (lost.length) this.log(mask_says(lost)); }      // never silent (R17, #220)
      if (!["json", "wearos"].includes(kind)) {      // the thinnest line and the narrowest gap it asks for (#225), to hold against what the method can print
        const T = G.thinnest(S), mm = (v) => `${+v.toFixed(3)} mm`;
        const parts = [T.lines.length ? `thinnest line: ${T.lines[0][0]}, ${mm(T.lines[0][1])}` : "", T.gaps.length ? `narrowest gap: ${T.gaps[0][0]}, ${mm(T.gaps[0][1])}` : "",
          T.unmeasured.length ? `not measured (no stroke width to read): ${T.unmeasured.join(", ")}` : ""].filter(Boolean);
        if (parts.length) this.log(parts.join(" · "));
      }
      if (kind === "svg") {
        const live = S.out_live_text && !S.out_production;
        save_file(name, svg_document(S, statik, S.t, { live }), "image/svg+xml");
        if (live) return this.log(`exported ${name} · ${G.page_mm(S).toFixed(2)} mm square · numerals are text: ${[...new Set(S.rings.filter((r) => r.on && G.has_text(r)).map((r) => r.family))].join(", ") || "no numerals"} must be installed to open it`);
      }
      if (kind === "pdf") save_file(name, pdf_document(S, statik, S.t), "application/pdf");
      if (kind === "spec") { save_file(name, spec_sheet(S, statik, S.t), "image/svg+xml"); return this.log(`exported ${name} · A4 on its side · the dial with each ring's radius marked, and its numbers`); }
      if (kind === "sheet") {                      // a print sheet (4.75)
        const L = sheet_layout(S);
        if (!L.places.length) return this.log(`sheet not made: a ${S.dial_d} mm dial doesn't fit on ${L.paper[0]}`);
        save_file(name, pdf_sheet(S, statik, S.t), "application/pdf");
        return this.log(`exported ${name} · ${L.places.length} × ${S.dial_d.toFixed(2)} mm on ${L.paper[0]}${L.staggered ? ", staggered" : ""}${S.out_mirror ? " · mirrored" : ""}${S.out_production ? " · mask" : ""}${S.out_cutline ? " · cut lines" : ""} · print at 100 %, not "fit to page"`);
      }
      if (kind === "png") {
        const px = Math.round(G.page_mm(S) / 25.4 * S.out_dpi);
        if (px > PNG_MOST) return this.log(`PNG not made: ${px} × ${px} px is more than a browser can draw (${PNG_MOST} a side). Lower the dpi to ${Math.floor(PNG_MOST / G.page_mm(S) * 25.4)} or less, or use the PDF.`);
        const image = new Image();
        image.src = URL.createObjectURL(new Blob([svg_document(S, statik, S.t)], { type: "image/svg+xml" }));
        await image.decode();
        const canvas = el("canvas", { width: px, height: px }), pen = canvas.getContext("2d");
        if (S.out_production) { pen.fillStyle = "#fff"; pen.fillRect(0, 0, px, px); }      // a mask is black on white, never on nothing
        pen.drawImage(image, 0, 0, px, px);
        URL.revokeObjectURL(image.src);
        const blob = await new Promise((done) => canvas.toBlob(done, "image/png"));
        if (!blob) throw new Error(`this browser couldn’t make a picture of ${px} × ${px} px: lower the dpi`);
        save_file(name, png_with_dpi(new Uint8Array(await blob.arrayBuffer()), S.out_dpi), "image/png");
        this.log(`exported ${name} · ${px} × ${px} px · ${Math.round(S.out_dpi)} dpi is written in the file, so it opens at ${G.page_mm(S).toFixed(2)} mm`
          + (px * px > PNG_SAFE ? ` · large: if it is empty in Safari, lower the dpi` : ""));
        return;
      }
      if (kind === "wearos") {                     // farukahmet's PR #1: each layer a picture at 450 × 450, the face's XML, packed and signed
        this.log("building a Wear OS watch face…");
        const xml = generate_watchface_xml(S, statik), png = (svg) => svg_to_png_bytes(svg), on = (h) => S.ha_on && S["ha_" + h].on;
        const drawables = {
          dial_face: await png(svg_dial_face(S, statik)),
          dial_face_ambient: await png(svg_dial_face(S, statik, "black")),
          dial_face_ambient_black: await png(svg_dial_face(S, statik, "black")),
          dial_face_ambient_dimmed: await png(svg_dial_face(S, statik, "dimmed")),
          hour_hand: on("hour") ? await png(svg_hand(S, "hour")) : null,
          hour_hand_ambient: on("hour") ? await png(svg_hand(S, "hour", "black")) : null,
          minute_hand: on("minute") ? await png(svg_hand(S, "minute")) : null,
          minute_hand_ambient: on("minute") ? await png(svg_hand(S, "minute", "black")) : null,
          second_hand: on("second") ? await png(svg_hand(S, "second")) : null,
          cap: S.ha_on && S.ha_cap > 0 ? await png(svg_cap(S)) : null,
          preview: await png(svg_preview(S, statik)),
          icon: await png(svg_preview(S, statik)),
        };
        for (const x of statik.windows || []) drawables["window_" + x.index] = await png(svg_window_sheet(S, x));
        const label = (S.wearos_name || "").trim() || "Dial Tool", pkg = format_package_name("", label);
        const apk = await build_signed_wearos_apk(xml, drawables, { label, packageId: pkg });
        const apk_name = `dial-wearos-${S.wearos_name && S.wearos_name.trim() ? sanitize_package_suffix(S.wearos_name) : Math.round(S.dial_d) + "mm"}.apk`;
        save_file(apk_name, apk, "application/vnd.android.package-archive");
        return this.log(`exported ${apk_name} · "${label}" (${pkg}) · 450 × 450 px · signed (v2/v3) with a shared debug key: sideload it, adb install`);
      }
      this.log(`exported ${name} · ${G.page_mm(S).toFixed(2)} mm square, to your downloads`);
    } catch (e) {
      this.log(`export ${kind} failed: ${e.stack || e}`);
    }
  },

  load_text(text, name) {
    try {
      const settings = JSON.parse(text);
      if (typeof settings !== "object" || Array.isArray(settings)) throw new Error("not a settings file");
      this.reopen(settings);
      const next = window.dial_tool;               // the new tool, made by reopen
      next.loaded_name = name;                     // it says which file it came from, and Save… offers that name (#279)
      next.sync_rows();
      next.log(`loaded ${name}`);
    } catch (e) {
      this.log(`couldn’t load ${name}: ${e.message}`);
    }
  },

  /** the whole dial as one address: open it anywhere and the dial is back. Fonts travel by name only. */
  //  Safari and every browser on an iPad (all WebKit) allow the clipboard only while the click is still "fresh": the
  //  link is packed first (a wait), and by then WebKit had refused it, silently (Okay, 18 Oct 2026, notes 2: "The copy
  //  link button is not working, expanded and contracted"). So the clipboard is asked at once, with the link handed over
  //  when it is ready (a ClipboardItem holding a promise, which WebKit accepts); writeText after the wait is the fallback
  //  for browsers without it. The button says what happened, on the button itself (R17: no silent dead end).
  async copy_link(button, maker = null, idle = "Copy link", what = "link") {
    const made = maker || this.show_link();
    let copied = false;
    if (window.ClipboardItem && navigator.clipboard && navigator.clipboard.write) {
      try {
        await navigator.clipboard.write([new ClipboardItem({ "text/plain": made.then((l) => new Blob([l], { type: "text/plain" })) })]);
        copied = true;
      } catch (e) { /* the fallback below */ }
    }
    const link = await made;
    if (!copied) {
      try { await navigator.clipboard.writeText(link); copied = true; } catch (e) { /* said below */ }
    }
    if (copied) this.log(`${what} copied · ${link.length} characters`);
    else this.log(`couldn’t copy by itself; the ${what} is here:\n${link}`);
    if (button) {
      const word = button.querySelector("span");
      clearTimeout(this.copied_back);
      word.textContent = copied ? "Copied" : "Not copied";
      this.copied_back = setTimeout(() => { word.textContent = idle; }, 1600);
      if (!copied && !maker && this.link_box && this.link_box.isConnected && this.link_box.offsetParent) { this.link_box.focus(); this.link_box.select(); }
    }
    return link;
  },
};
