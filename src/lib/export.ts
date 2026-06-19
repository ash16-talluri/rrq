import jsPDF from "jspdf";
import type { OfflinePack } from "./offline-store";

const TYPE_LABEL: Record<string, string> = {
  puncture_shop: "Puncture Shop",
  mechanic: "Mechanic",
  towing: "Towing",
  fuel_station: "Fuel Station",
  hospital: "Hospital",
  police: "Police",
  helpline: "Helpline",
};

function label(t: string) {
  return TYPE_LABEL[t] ?? t;
}

export function exportPackToPdf(pack: OfflinePack) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  let y = 56;

  doc.setFillColor(15, 22, 32);
  doc.rect(0, 0, W, 90, "F");
  doc.setTextColor(240, 138, 62);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("RoadResQ", 40, 50);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.text("Offline Region Pack", 40, 72);

  y = 130;
  doc.setTextColor(20, 20, 20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(pack.name, 40, y);
  y += 22;
  if (pack.region || pack.highway) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(80, 80, 80);
    doc.text([pack.region, pack.highway].filter(Boolean).join(" • "), 40, y);
    y += 16;
  }
  if (pack.description) {
    doc.setFontSize(10);
    const lines = doc.splitTextToSize(pack.description, W - 80);
    doc.text(lines, 40, y);
    y += lines.length * 12 + 8;
  }

  const addSection = (title: string) => {
    if (y > H - 80) {
      doc.addPage();
      y = 56;
    }
    y += 8;
    doc.setFillColor(240, 138, 62);
    doc.rect(40, y, 4, 16, "F");
    doc.setTextColor(20, 20, 20);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(title, 52, y + 13);
    y += 28;
  };

  const addRow = (
    name: string,
    type: string,
    phone: string | null,
    address: string | null,
  ) => {
    if (y > H - 70) {
      doc.addPage();
      y = 56;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(20, 20, 20);
    doc.text(name, 40, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    doc.text(label(type), W - 40, y, { align: "right" });
    y += 14;
    if (phone) {
      doc.setFontSize(10);
      doc.setTextColor(40, 90, 200);
      doc.text(`☎  ${phone}`, 40, y);
      y += 12;
    }
    if (address) {
      doc.setTextColor(90, 90, 90);
      doc.setFontSize(9);
      const lines = doc.splitTextToSize(address, W - 80);
      doc.text(lines, 40, y);
      y += lines.length * 11;
    }
    y += 8;
    doc.setDrawColor(220, 220, 220);
    doc.line(40, y, W - 40, y);
    y += 10;
  };

  const groups = pack.providers.reduce<Record<string, typeof pack.providers>>((acc, p) => {
    (acc[p.type] ||= []).push(p);
    return acc;
  }, {});

  for (const [type, items] of Object.entries(groups)) {
    addSection(label(type) + "s");
    items.forEach((p) => addRow(p.name, p.type, p.phone, [p.address, p.city].filter(Boolean).join(", ")));
  }

  if (pack.extras.length) {
    addSection("Emergency Contacts");
    pack.extras.forEach((e) => addRow(e.name, e.type, e.phone, e.address));
  }

  const footer = `Generated ${new Date().toLocaleString()} • RoadResQ offline pack`;
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  for (let i = 1; i <= doc.getNumberOfPages(); i++) {
    doc.setPage(i);
    doc.text(footer, W / 2, H - 24, { align: "center" });
  }

  doc.save(`roadrescue-${pack.slug}.pdf`);
}

export function exportPackToDoc(pack: OfflinePack) {
  const groups = pack.providers.reduce<Record<string, typeof pack.providers>>((acc, p) => {
    (acc[p.type] ||= []).push(p);
    return acc;
  }, {});

  const groupHtml = Object.entries(groups)
    .map(
      ([type, items]) =>
        `<h2>${label(type)}s</h2>` +
        items
          .map(
            (p) => `
            <div style="margin-bottom:14px;padding-bottom:10px;border-bottom:1px solid #ddd;">
              <strong>${escapeHtml(p.name)}</strong><br/>
              ${p.phone ? `📞 ${escapeHtml(p.phone)}<br/>` : ""}
              ${p.address ? `${escapeHtml(p.address)}${p.city ? ", " + escapeHtml(p.city) : ""}<br/>` : ""}
              ${p.open_24h ? "<em>Open 24/7</em>" : ""}
            </div>`,
          )
          .join(""),
    )
    .join("");

  const extrasHtml = pack.extras.length
    ? `<h2>Emergency Contacts</h2>` +
      pack.extras
        .map(
          (e) => `
          <div style="margin-bottom:10px;">
            <strong>${escapeHtml(e.name)}</strong> — 📞 ${escapeHtml(e.phone)}<br/>
            ${e.notes ? `<em>${escapeHtml(e.notes)}</em>` : ""}
          </div>`,
        )
        .join("")
    : "";

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${escapeHtml(pack.name)}</title></head>
    <body style="font-family:Arial,sans-serif;color:#111;max-width:720px;margin:24px auto;">
      <h1 style="color:#f08a3e;">RoadResQ — ${escapeHtml(pack.name)}</h1>
      <p style="color:#555;">${escapeHtml(pack.region ?? "")} ${pack.highway ? "• " + escapeHtml(pack.highway) : ""}</p>
      ${pack.description ? `<p>${escapeHtml(pack.description)}</p>` : ""}
      ${groupHtml}
      ${extrasHtml}
      <hr/>
      <p style="font-size:11px;color:#999;">Generated ${new Date().toLocaleString()}</p>
    </body></html>`;

  const blob = new Blob([html], { type: "application/msword" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `roadrescue-${pack.slug}.doc`;
  a.click();
  URL.revokeObjectURL(url);
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}
