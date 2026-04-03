import { useState, useEffect } from 'react'
import { Sun, Moon, Languages, GitFork, Plus, Trash2 } from 'lucide-react'

const translations = {
  en: {
    title: 'PON Cascade Splitter Calculator',
    subtitle: 'Design multi-stage PON splitter cascades. Verify OLT TX vs ONU sensitivity with cumulative loss. ITU-T G.984, G.9807.',
    standard: 'PON Standard',
    standardDesc: 'Select technology for reference specs',
    olt: 'OLT Parameters',
    oltDesc: 'Configure OLT transmit power and ONU sensitivity',
    oltTx: 'OLT TX Power (dBm)',
    onuSensitivity: 'ONU RX Sensitivity (dBm)',
    stages: 'Cascade Stages',
    stagesDesc: 'Add splitter stages and fiber distance',
    addStage: 'Add Stage',
    splitter: 'Splitter',
    fiberKm: 'Fiber (km)',
    stageLoss: 'Stage loss',
    cumLoss: 'Cumulative loss',
    rxAtOnu: 'RX at ONU',
    diagram: 'Cascade Diagram',
    specs: 'PON Technology Specs',
    rfcNote: 'ITU-T G.984 (GPON), ITU-T G.9807 (XGS-PON), ITU-T G.987 (10G-EPON), IEEE 802.3ah (EPON)',
    builtBy: 'Built by',
    status: 'Status',
    ok: 'Within budget',
    fail: 'Exceeds budget',
    totalLoss: 'Total cascade loss',
    budget: 'Link budget',
    margin: 'Margin',
    dBm: 'dBm', dB: 'dB', km: 'km',
    removeStage: 'Remove stage',
  },
  pt: {
    title: 'Calculadora de Cascata PON',
    subtitle: 'Projete cascatas de splitters PON em multiplos estagios. Verifique TX OLT vs sensibilidade ONU. ITU-T G.984, G.9807.',
    standard: 'Padrao PON',
    standardDesc: 'Selecione a tecnologia para specs de referencia',
    olt: 'Parametros OLT',
    oltDesc: 'Configure potencia de transmissao OLT e sensibilidade ONU',
    oltTx: 'Potencia TX OLT (dBm)',
    onuSensitivity: 'Sensibilidade RX ONU (dBm)',
    stages: 'Estagios em Cascata',
    stagesDesc: 'Adicione estagios de splitter e distancia de fibra',
    addStage: 'Adicionar Estagio',
    splitter: 'Splitter',
    fiberKm: 'Fibra (km)',
    stageLoss: 'Perda no estagio',
    cumLoss: 'Perda acumulada',
    rxAtOnu: 'RX na ONU',
    diagram: 'Diagrama em Cascata',
    specs: 'Specs de Tecnologia PON',
    rfcNote: 'ITU-T G.984 (GPON), ITU-T G.9807 (XGS-PON), ITU-T G.987 (10G-EPON), IEEE 802.3ah (EPON)',
    builtBy: 'Criado por',
    status: 'Status',
    ok: 'Dentro do orcamento',
    fail: 'Excede o orcamento',
    totalLoss: 'Perda total em cascata',
    budget: 'Orcamento de link',
    margin: 'Margem',
    dBm: 'dBm', dB: 'dB', km: 'km',
    removeStage: 'Remover estagio',
  },
} as const

type Lang = keyof typeof translations
type PONStandard = 'gpon' | 'xgspon' | 'epon' | '10gepon'

const PON_SPECS: Record<PONStandard, { name: string; downstream: string; upstream: string; txMin: number; txMax: number; rxMin: number; budget: number }> = {
  gpon: { name: 'GPON', downstream: '2.488 Gbps', upstream: '1.244 Gbps', txMin: 1.5, txMax: 5, rxMin: -28, budget: 28 },
  xgspon: { name: 'XGS-PON', downstream: '10 Gbps', upstream: '10 Gbps', txMin: 2, txMax: 6, rxMin: -29, budget: 31 },
  epon: { name: 'EPON', downstream: '1 Gbps', upstream: '1 Gbps', txMin: -1, txMax: 4, rxMin: -24, budget: 24 },
  '10gepon': { name: '10G-EPON', downstream: '10 Gbps', upstream: '10 Gbps', txMin: 2, txMax: 7, rxMin: -29, budget: 29 },
}

const SPLITTER_OPTIONS = [
  { label: '1:2', loss: 3.5 },
  { label: '1:4', loss: 7.0 },
  { label: '1:8', loss: 10.5 },
  { label: '1:16', loss: 13.5 },
  { label: '1:32', loss: 17.0 },
  { label: '1:64', loss: 20.5 },
]

interface Stage {
  id: string
  splitterIdx: number
  fiberKm: number
}

const FIBER_ATT = 0.35

export default function PONSplitterCalculator() {
  const [lang, setLang] = useState<Lang>(() => (navigator.language.startsWith('pt') ? 'pt' : 'en'))
  const [dark, setDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches)
  const [standard, setStandard] = useState<PONStandard>('gpon')
  const [oltTx, setOltTx] = useState(3)
  const [onuSens, setOnuSens] = useState(-28)
  const [stages, setStages] = useState<Stage[]>([
    { id: '1', splitterIdx: 2, fiberKm: 1 },
    { id: '2', splitterIdx: 4, fiberKm: 2 },
  ])

  const t = translations[lang]
  const spec = PON_SPECS[standard]

  useEffect(() => { document.documentElement.classList.toggle('dark', dark) }, [dark])

  const addStage = () => setStages(s => [...s, { id: Date.now().toString(), splitterIdx: 2, fiberKm: 1 }])
  const removeStage = (id: string) => setStages(s => s.filter(st => st.id !== id))
  const updateStage = (id: string, field: keyof Stage, value: number) => setStages(s => s.map(st => st.id === id ? { ...st, [field]: value } : st))

  const budget = oltTx - onuSens
  let cumLoss = 0
  const stageResults = stages.map(stage => {
    const fiberLoss = stage.fiberKm * FIBER_ATT
    const splLoss = SPLITTER_OPTIONS[stage.splitterIdx].loss
    const stageLoss = fiberLoss + splLoss
    cumLoss += stageLoss
    return { ...stage, fiberLoss, splLoss, stageLoss, cumLoss, rxAtOnu: oltTx - cumLoss }
  })

  const totalLoss = cumLoss
  const margin = budget - totalLoss
  const ok = margin >= 0

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 transition-colors">
      <header className="border-b border-zinc-200 dark:border-zinc-800 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
              <GitFork size={18} className="text-white" />
            </div>
            <span className="font-semibold">PON Splitter Calc</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setLang(l => l === 'en' ? 'pt' : 'en')} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
              <Languages size={14} />{lang.toUpperCase()}
            </button>
            <button onClick={() => setDark(d => !d)} className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
              {dark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <a href="https://github.com/gmowses/pon-splitter-calculator" target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
            </a>
          </div>
        </div>
      </header>

      <main className="flex-1 px-6 py-10">
        <div className="max-w-5xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-bold">{t.title}</h1>
            <p className="mt-2 text-zinc-500 dark:text-zinc-400">{t.subtitle}</p>
          </div>

          {/* Standard picker */}
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 space-y-3">
            <div>
              <h2 className="font-semibold">{t.standard}</h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">{t.standardDesc}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(PON_SPECS) as PONStandard[]).map(s => (
                <button
                  key={s}
                  onClick={() => { setStandard(s); setOltTx(PON_SPECS[s].txMax); setOnuSens(PON_SPECS[s].rxMin) }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${standard === s ? 'bg-orange-500 text-white border-orange-500' : 'border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
                >
                  {PON_SPECS[s].name}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3 mt-2">
              {[
                { label: 'Downstream', value: spec.downstream },
                { label: 'Upstream', value: spec.upstream },
                { label: 'TX range', value: `${spec.txMin} to ${spec.txMax} dBm` },
                { label: 'Budget', value: `${spec.budget} dB` },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/30 px-3 py-2">
                  <p className="text-[10px] uppercase tracking-wide text-zinc-400">{label}</p>
                  <p className="text-sm font-semibold text-orange-500">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* OLT params */}
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 space-y-5">
              <div>
                <h2 className="font-semibold">{t.olt}</h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">{t.oltDesc}</p>
              </div>
              {[
                { label: t.oltTx, value: oltTx, set: setOltTx, min: -5, max: 10, step: 0.5 },
                { label: t.onuSensitivity, value: onuSens, set: setOnuSens, min: -35, max: -15, step: 0.5 },
              ].map(({ label, value, set, min, max, step }) => (
                <div key={label} className="space-y-1.5">
                  <div className="flex justify-between">
                    <label className="text-sm font-medium">{label}</label>
                    <span className="text-sm font-bold text-orange-500 tabular-nums">{value} {t.dBm}</span>
                  </div>
                  <input type="range" min={min} max={max} step={step} value={value} onChange={e => set(Number(e.target.value))} className="h-1.5 w-full cursor-pointer accent-orange-500" />
                </div>
              ))}

              {/* Summary */}
              <div className={`rounded-lg border px-4 py-3 ${ok ? 'border-green-300 dark:border-green-800 bg-green-50 dark:bg-green-950/30' : 'border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/30'}`}>
                <div className="grid grid-cols-3 gap-2 text-center">
                  {[
                    { label: t.totalLoss, value: `${totalLoss.toFixed(1)} ${t.dB}` },
                    { label: t.budget, value: `${budget.toFixed(1)} ${t.dB}` },
                    { label: t.margin, value: `${margin.toFixed(1)} ${t.dB}` },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p className="text-[10px] text-zinc-500 dark:text-zinc-400">{label}</p>
                      <p className={`text-sm font-bold ${ok ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{value}</p>
                    </div>
                  ))}
                </div>
                <p className={`text-center text-sm font-semibold mt-2 ${ok ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {t.status}: {ok ? t.ok : t.fail}
                </p>
              </div>
            </div>

            {/* Stages */}
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold">{t.stages}</h2>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">{t.stagesDesc}</p>
                </div>
                <button onClick={addStage} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 transition-colors">
                  <Plus size={14} />{t.addStage}
                </button>
              </div>

              <div className="space-y-3">
                {stages.map((stage, i) => (
                  <div key={stage.id} className="rounded-lg border border-zinc-200 dark:border-zinc-700 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-orange-500">Stage {i + 1}</span>
                      {stages.length > 1 && (
                        <button onClick={() => removeStage(stage.id)} className="p-1 text-zinc-400 hover:text-red-500 transition-colors" title={t.removeStage}>
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-zinc-400 uppercase">{t.splitter}</label>
                        <select
                          value={stage.splitterIdx}
                          onChange={e => updateStage(stage.id, 'splitterIdx', Number(e.target.value))}
                          className="w-full mt-1 rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                        >
                          {SPLITTER_OPTIONS.map((s, idx) => (
                            <option key={s.label} value={idx}>{s.label} (-{s.loss} dB)</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] text-zinc-400 uppercase">{t.fiberKm}</label>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          step={0.1}
                          value={stage.fiberKm}
                          onChange={e => updateStage(stage.id, 'fiberKm', Number(e.target.value))}
                          className="w-full mt-1 rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Cascade diagram */}
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 space-y-4">
            <h2 className="font-semibold">{t.diagram}</h2>
            <div className="overflow-x-auto">
              <div className="flex items-start gap-2 min-w-max">
                <div className="flex flex-col items-center">
                  <div className="w-16 h-10 bg-orange-500 rounded-lg flex items-center justify-center text-white text-xs font-bold">OLT</div>
                  <p className="text-[10px] text-zinc-400 mt-1">{oltTx} {t.dBm}</p>
                </div>
                {stageResults.map((stage, i) => {
                  const col = stage.rxAtOnu >= onuSens ? '#22c55e' : '#ef4444'
                  return (
                    <div key={stage.id} className="flex items-start gap-2">
                      <div className="flex flex-col items-center mt-3">
                        <div className="h-0.5 w-8 bg-zinc-400" />
                        <p className="text-[10px] text-zinc-400 mt-0.5">{stage.fiberKm}km</p>
                      </div>
                      <div className="flex flex-col items-center">
                        <div className="w-16 h-10 rounded-lg border-2 flex items-center justify-center text-xs font-bold" style={{ borderColor: col, color: col }}>
                          {SPLITTER_OPTIONS[stage.splitterIdx].label}
                        </div>
                        <p className="text-[10px] mt-1" style={{ color: col }}>-{stage.cumLoss.toFixed(1)} {t.dB}</p>
                        {i === stageResults.length - 1 && (
                          <>
                            <div className="h-0.5 w-8 bg-zinc-400 mt-3" />
                            <div className="w-16 h-10 rounded-lg flex items-center justify-center text-xs font-bold" style={{ backgroundColor: `${col}20`, color: col, border: `2px solid ${col}` }}>ONU</div>
                            <p className="text-[10px] mt-1 font-bold" style={{ color: col }}>{stage.rxAtOnu.toFixed(1)} {t.dBm}</p>
                          </>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Stage table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-700">
                    {['Stage', t.splitter, t.fiberKm, t.stageLoss, t.cumLoss, t.rxAtOnu].map(h => (
                      <th key={h} className="text-left py-2 px-3 text-[10px] uppercase tracking-wide text-zinc-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {stageResults.map((stage, i) => {
                    const ok2 = stage.rxAtOnu >= onuSens
                    return (
                      <tr key={stage.id} className="border-b border-zinc-100 dark:border-zinc-800 last:border-0">
                        <td className="py-2 px-3 font-semibold text-orange-500">{i + 1}</td>
                        <td className="py-2 px-3">{SPLITTER_OPTIONS[stage.splitterIdx].label}</td>
                        <td className="py-2 px-3 tabular-nums">{stage.fiberKm}</td>
                        <td className="py-2 px-3 tabular-nums">{stage.stageLoss.toFixed(2)} {t.dB}</td>
                        <td className="py-2 px-3 tabular-nums">{stage.cumLoss.toFixed(2)} {t.dB}</td>
                        <td className={`py-2 px-3 tabular-nums font-semibold ${ok2 ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>{stage.rxAtOnu.toFixed(2)} {t.dBm}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <p className="text-[10px] text-zinc-400">{t.rfcNote}</p>
          </div>
        </div>
      </main>

      <footer className="border-t border-zinc-200 dark:border-zinc-800 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between text-xs text-zinc-400">
          <span>{t.builtBy} <a href="https://github.com/gmowses" className="text-zinc-600 dark:text-zinc-300 hover:text-orange-500 transition-colors">Gabriel Mowses</a></span>
          <span>MIT License</span>
        </div>
      </footer>
    </div>
  )
}
