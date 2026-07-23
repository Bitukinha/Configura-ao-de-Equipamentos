import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logo from "@/assets/nutrimilho-logo.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nutrimilho — Configuração de Equipamentos" },
      { name: "description", content: "Gerador de relatório de configuração dos equipamentos Nutrimilho em PDF." },
    ],
  }),
  component: Index,
});

type Row = { item: string; status: string; obs: string };
type Section = { id: string; title: string; rows: Row[] };

function getStatusColors(status: string): { bg: string; text: string } | null {
  const s = status.trim().toUpperCase();
  if (s.includes("MANUTEN")) return { bg: "#fef9c3", text: "#854d0e" };
  if (s.includes("PARADO")) return { bg: "#fee2e2", text: "#991b1b" };
  return null;
}

function getStatusColorsRGB(status: string): { bg: [number, number, number]; text: [number, number, number] } | null {
  const s = status.trim().toUpperCase();
  if (s.includes("MANUTEN")) return { bg: [254, 249, 195], text: [133, 77, 14] };
  if (s.includes("PARADO")) return { bg: [254, 226, 226], text: [153, 27, 27] };
  return null;
}

const STORAGE_KEY = "nutrimilho-configuracao-v1";

const initialSections: Section[] = [
  {
    id: "degerm",
    title: "DEGERMINAÇÃO",
    rows: [
      { item: "Degerminadoras", status: "EM OPERAÇÃO", obs: "5 DHZS disponíveis para operação. Trabalhar de acordo com a necessidade da produção." },
      { item: "Condição Operacional", status: "Todas as DHZS com boa degerminação para atender a produção do pré-cozido e D48.", obs: "Atenção com a qualidade da canjica nas DHZS 1, 2, 3, 4 e 5 trabalhar no Nível 8 de degerminação fubá pré-cozido e D48. Finalizando a OP do D48 soltar a degerminação das DHZS 1 e 2 para a produção do F28." },
      { item: "Sistema CLDZ Pré-Degerminação", status: "EM OPERAÇÃO", obs: "" },
    ],
  },
  {
    id: "moagem",
    title: "MOAGEM",
    rows: [
      { item: "Monocanal", status: "PARADO", obs: "" },
      { item: "Imoto", status: "EM OPERAÇÃO", obs: "Alimentar apenas Extrusora." },
      { item: "PL 1", status: "EM OPERAÇÃO", obs: "FUBÁ: acumular nos silos de fubá e envasar na INSACK – pré-cozido. GRANULADOS: remoer nos moinhos produção fubá pré-cozido." },
      { item: "Dosadora", status: "PARADO", obs: "" },
    ],
  },
  {
    id: "vieiras",
    title: "MOINHOS VIEIRAS",
    rows: [
      { item: "M2", status: "EM OPERAÇÃO", obs: "Peneira 0.7mm / Pré-cozido" },
      { item: "M6", status: "EM OPERAÇÃO", obs: "Peneira 0.7mm / Pré-cozido" },
      { item: "M8", status: "EM OPERAÇÃO", obs: "Peneira 0.7mm / Pré-cozido" },
    ],
  },
  {
    id: "cilindros",
    title: "MOINHO — BANCO DE CILINDROS",
    rows: [
      { item: "Linha 1", status: "PARADO", obs: "" },
      { item: "Linha 2", status: "PARADO", obs: "" },
      { item: "Linha 3", status: "EM OPERAÇÃO", obs: "Alimentar PL SANGATI e Moinhos Vieiras através da RO 29 -> RO 62 -> EL 34 -> Moinhos." },
      { item: "Laminador", status: "PARADO", obs: "" },
    ],
  },
  {
    id: "extrusoras",
    title: "SETOR EXTRUSORAS",
    rows: [
      { item: "Caldeira", status: "EM OPERAÇÃO", obs: "" },
      { item: "Extrusora Ferraz", status: "EM OPERAÇÃO", obs: "D-48 Seguir Ops..." },
      { item: "Extrusora Zeng", status: "PARADO", obs: "" },
    ],
  },
  {
    id: "vieiras2",
    title: "MOINHOS VIEIRAS 950 E 680 A",
    rows: [
      { item: "M1 950", status: "EM OPERAÇÃO", obs: "Peneira 0.3mm." },
      { item: "M3 950", status: "EM OPERAÇÃO", obs: "Peneira 0.3mm." },
      { item: "M7 680A", status: "EM OPERAÇÃO", obs: "Peneira 0.3mm." },
    ],
  },
];

function readStoredValue<T>(key: "title" | "subtitle" | "date" | "notes", fallback: T): T {
  if (typeof window === "undefined") return fallback;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;

    const parsed = JSON.parse(raw) as Partial<Record<"title" | "subtitle" | "date" | "notes", unknown>>;
    return (parsed[key] as T | undefined) ?? fallback;
  } catch {
    return fallback;
  }
}

function readStoredSections(fallback: Section[]): Section[] {
  if (typeof window === "undefined") return fallback;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;

    const parsed = JSON.parse(raw) as { sections?: Section[] };
    return Array.isArray(parsed.sections) ? parsed.sections : fallback;
  } catch {
    return fallback;
  }
}

function Index() {
  const today = new Date().toISOString().slice(0, 10);
  const [title, setTitle] = useState(() => readStoredValue("title", "CONFIGURAÇÃO DOS EQUIPAMENTOS"));
  const [subtitle, setSubtitle] = useState(() => readStoredValue("subtitle", "30 E 01 DE JUNHO"));
  const [date, setDate] = useState(() => readStoredValue("date", today));
  const [sections, setSections] = useState<Section[]>(() => readStoredSections(initialSections));
  const [notes, setNotes] = useState<string>(() =>
    readStoredValue(
      "notes",
      "Condição operacional DHZS:\n• PRÉ-COZIDO: Degerminação muito boa – Nível 8.\n• D48: Degerminação muito boa – Nível 8.\n• F28: Degerminação Nível 2 a 3.\n\nPRÉ-COZIDO: Atenção com vazamentos e preencher corretamente o registro de troca de peneiras dos moinhos no quadro KANBAN.\n\nBom trabalho a todos.",
    ),
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ title, subtitle, date, sections, notes }),
    );
  }, [title, subtitle, date, sections, notes]);

  const updateRow = (sIdx: number, rIdx: number, field: keyof Row, value: string) => {
    setSections((prev) => {
      const copy = structuredClone(prev);
      copy[sIdx].rows[rIdx][field] = value;
      return copy;
    });
  };

  const addRow = (sIdx: number) => {
    setSections((prev) => {
      const copy = structuredClone(prev);
      copy[sIdx].rows.push({ item: "", status: "", obs: "" });
      return copy;
    });
  };

  const removeRow = (sIdx: number, rIdx: number) => {
    setSections((prev) => {
      const copy = structuredClone(prev);
      copy[sIdx].rows.splice(rIdx, 1);
      return copy;
    });
  };

  const updateSectionTitle = (sIdx: number, val: string) => {
    setSections((prev) => {
      const copy = structuredClone(prev);
      copy[sIdx].title = val;
      return copy;
    });
  };

  const generatePDF = async () => {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const green: [number, number, number] = [168, 216, 185];
    const greenText: [number, number, number] = [26, 66, 43];
    const gold: [number, number, number] = [212, 175, 55];

    // Header band
    doc.setFillColor(...green);
    doc.rect(0, 0, pageW, 80, "F");
    doc.setFillColor(...gold);
    doc.rect(0, 80, pageW, 4, "F");

    // Logo
    try {
      doc.addImage(logo, "PNG", 30, 18, 110, 44);
    } catch {
      /* ignore */
    }

    doc.setTextColor(...greenText);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(title, pageW - 30, 40, { align: "right" });
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(subtitle, pageW - 30, 58, { align: "right" });
    doc.setFontSize(9);
    doc.text(`Data: ${date}`, pageW - 30, 72, { align: "right" });

    let cursorY = 110;

    sections.forEach((sec) => {
      if (sec.rows.length === 0) return;
      autoTable(doc, {
        startY: cursorY,
        head: [[sec.title, "Status / Configuração atual", "Observação"]],
        body: sec.rows.map((r) => [r.item, r.status, r.obs]),
        styles: { fontSize: 9, cellPadding: 6, valign: "top", lineColor: [220, 220, 220], lineWidth: 0.5 },
        headStyles: { fillColor: green, textColor: greenText, fontStyle: "bold" },
        alternateRowStyles: { fillColor: [245, 250, 245] },
        columnStyles: { 0: { cellWidth: 140, fontStyle: "bold" }, 1: { cellWidth: 140 } },
        margin: { left: 30, right: 30 },
        didParseCell: (data) => {
          if (data.section !== "body") return;
          const statusVal = String(data.row.raw[1] ?? "");
          const colors = getStatusColorsRGB(statusVal);
          if (colors) {
            data.cell.styles.fillColor = colors.bg;
            data.cell.styles.textColor = colors.text;
          }
        },
      });
      // @ts-expect-error lastAutoTable is provided at runtime
      cursorY = doc.lastAutoTable.finalY + 16;
    });

    if (notes.trim()) {
      if (cursorY > 720) {
        doc.addPage();
        cursorY = 40;
      }
      doc.setFillColor(...green);
      doc.rect(30, cursorY, pageW - 60, 18, "F");
      doc.setTextColor(...greenText);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("OBSERVAÇÕES", 38, cursorY + 12);
      cursorY += 22;

      doc.setTextColor(30, 30, 30);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      const lines = doc.splitTextToSize(notes, pageW - 80);
      doc.text(lines, 38, cursorY + 4);
    }

    // Footer on each page
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      const ph = doc.internal.pageSize.getHeight();
      doc.setFillColor(...green);
      doc.rect(0, ph - 20, pageW, 20, "F");
      doc.setTextColor(...greenText);
      doc.setFontSize(8);
      doc.text("Nutrimilho — Configuração de Equipamentos", 30, ph - 7);
      doc.text(`Página ${i} de ${pageCount}`, pageW - 30, ph - 7, { align: "right" });
    }

    doc.save(`nutrimilho-configuracao-${date}.pdf`);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground">
        <div className="mx-auto max-w-5xl px-4 py-4 sm:px-6 sm:py-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="bg-white rounded-md px-2 py-1.5 sm:px-3 sm:py-2 shadow-sm shrink-0">
              <img src={logo} alt="Nutrimilho" className="h-8 w-auto sm:h-10" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg md:text-xl font-bold leading-tight">Configuração de Equipamentos</h1>
              <p className="text-xs sm:text-sm opacity-90">Gerador de relatório diário em PDF</p>
            </div>
          </div>
          <button
            onClick={generatePDF}
            className="w-full md:w-auto bg-accent text-accent-foreground font-semibold px-4 py-2.5 rounded-md shadow hover:brightness-95 transition"
          >
            Gerar PDF
          </button>
        </div>
        <div className="h-1 bg-accent" />
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8 space-y-6">
        <section className="bg-card rounded-lg border p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Cabeçalho</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <Field label="Título">
              <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
            </Field>
            <Field label="Subtítulo / Período">
              <input className="input" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
            </Field>
            <Field label="Data">
              <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
            </Field>
          </div>
        </section>

        {sections.map((sec, sIdx) => (
          <section key={sec.id} className="bg-card rounded-lg border shadow-sm overflow-hidden">
            <header className="bg-primary/10 border-b px-5 py-3 flex items-center gap-3">
              <span className="w-1.5 h-6 rounded bg-accent" />
              <input
                className="flex-1 bg-transparent font-bold text-primary-foreground text-base outline-none"
                value={sec.title}
                onChange={(e) => updateSectionTitle(sIdx, e.target.value)}
              />
              <button
                onClick={() => addRow(sIdx)}
                className="text-xs font-medium px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:brightness-110"
              >
                + Linha
              </button>
            </header>
            <div className="p-4 space-y-3">
              {sec.rows.map((row, rIdx) => {
                const statusColors = getStatusColors(row.status);
                const fieldStyle = statusColors
                  ? { backgroundColor: statusColors.bg, color: statusColors.text }
                  : undefined;
                return (
                  <div
                    key={rIdx}
                    className={`grid grid-cols-2 gap-2 items-start rounded-md p-2 md:grid-cols-[1fr_1fr_2fr_auto] ${
                      statusColors ? "" : "border md:border-0 md:p-0"
                    }`}
                    style={statusColors ? { backgroundColor: statusColors.bg } : undefined}
                  >
                    <input
                      className="input"
                      placeholder="Equipamento"
                      value={row.item}
                      onChange={(e) => updateRow(sIdx, rIdx, "item", e.target.value)}
                      style={fieldStyle}
                    />
                    <input
                      className="input"
                      placeholder="Status"
                      value={row.status}
                      onChange={(e) => updateRow(sIdx, rIdx, "status", e.target.value)}
                      style={fieldStyle}
                    />
                    <textarea
                      className="input min-h-[42px] col-span-2 md:col-span-1"
                      placeholder="Observação"
                      value={row.obs}
                      onChange={(e) => updateRow(sIdx, rIdx, "obs", e.target.value)}
                      style={fieldStyle}
                    />
                    <button
                      onClick={() => removeRow(sIdx, rIdx)}
                      className="col-span-2 md:col-span-1 justify-self-end text-destructive hover:bg-destructive/10 rounded-md px-3 py-1.5 text-sm"
                      aria-label="Remover"
                      title="Remover"
                    >
                      ✕ Remover
                    </button>
                  </div>
                );
              })}
              {sec.rows.length === 0 && (
                <p className="text-sm text-muted-foreground italic">Sem linhas. Clique em “+ Linha”.</p>
              )}
            </div>
          </section>
        ))}

        <section className="bg-card rounded-lg border p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Observações Finais</h2>
          <textarea
            className="input min-h-[160px] font-mono text-sm"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </section>

        <div className="flex justify-end pb-10">
          <button
            onClick={generatePDF}
            className="bg-primary text-primary-foreground font-semibold px-6 py-3 rounded-md shadow hover:brightness-110 transition"
          >
            Gerar PDF
          </button>
        </div>
      </main>

      <footer className="border-t bg-background/80">
        <div className="mx-auto max-w-5xl px-4 py-4 sm:px-6 text-center text-xs sm:text-sm text-muted-foreground">
          © 2026 Nutrimilho - (Novaes Tech) | Todos os direitos reservados
        </div>
      </footer>

      <style>{`
        .input {
          width: 100%;
          background: var(--color-background);
          border: 1px solid var(--color-border);
          border-radius: 0.375rem;
          padding: 0.5rem 0.65rem;
          font-size: 0.875rem;
          color: var(--color-foreground);
          outline: none;
          transition: border-color .15s, box-shadow .15s;
        }
        .input:focus {
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px color-mix(in oklch, var(--color-primary) 20%, transparent);
        }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted-foreground mb-1 block">{label}</span>
      {children}
    </label>
  );
}
