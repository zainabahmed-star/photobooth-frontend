import { useState, useEffect, useMemo } from 'react'
import { DESIGN } from '../boothDesign'
import { FONTS, FONT_WEIGHTS, useStripAssets, drawStrip } from './stripTools'

const PRESETS = [
  { name: 'White', bg: '#ffffff', text: '#222222' },
  { name: 'Black', bg: '#111111', text: '#ffffff' },
  { name: 'Pink', bg: '#FAC6D0', text: '#7F130A' },
  { name: 'Maroon', bg: '#7F130A', text: '#FAC6D0' },
  { name: 'Matcha', bg: '#cfe3b4', text: '#2f4a1c' },
]

function loadWorkingCopy() {
  try {
    const saved = JSON.parse(localStorage.getItem('booth-design'))
    return { ...DESIGN, ...saved }
  } catch {
    return DESIGN
  }
}

function Slider({ label, value, min, max, onChange }) {
  return (
    <label style={{ display: 'block', textAlign: 'left', margin: '8px 0' }}>
      {label}: {value}
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: '100%' }}
      />
    </label>
  )
}

export default function DesignStudio() {
  const assets = useStripAssets()
  const [s, setS] = useState(loadWorkingCopy)
  const [previewDate, setPreviewDate] = useState(DESIGN.defaultDate)
  const [copied, setCopied] = useState(false)

  const set = (key, value) => setS((prev) => ({ ...prev, [key]: value }))
  const setStar = (i, key, value) =>
    setS((prev) => ({
      ...prev,
      stars: prev.stars.map((st, idx) => (idx === i ? { ...st, [key]: value } : st)),
    }))

  // weights that exist for the chosen font
  const weights = FONT_WEIGHTS[s.font] || FONT_WEIGHTS.Roboto
  const currentWeight = weights.some((w) => w.value === s.fontWeight) ? s.fontWeight : 400

  function changeFont(font) {
    const allowed = FONT_WEIGHTS[font].map((w) => w.value)
    setS((prev) => ({
      ...prev,
      font,
      fontWeight: allowed.includes(prev.fontWeight) ? prev.fontWeight : 400,
    }))
  }

  useEffect(() => {
    try {
      localStorage.setItem('booth-design', JSON.stringify(s))
    } catch {
      // ignore
    }
  }, [s])

  const stripUrl = useMemo(() => {
    if (!assets.ready) return ''
    return drawStrip({
      shots: [],
      design: { ...s, fontWeight: currentWeight },
      dateText: previewDate,
      logo: assets.logo,
      star: assets.star,
    })
  }, [s, currentWeight, previewDate, assets])

  async function copyDesign() {
    const code = `export const DESIGN = ${JSON.stringify({ ...s, fontWeight: currentWeight }, null, 2)}\n`
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <div style={{ maxWidth: 520, margin: '0 auto', padding: 20, textAlign: 'center' }}>
      <h1>Design Studio</h1>

      {stripUrl && (
        <img
          src={stripUrl}
          alt="strip preview"
          style={{ width: 260, boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}
        />
      )}

      <div style={{ margin: '16px 0' }}>
        <button onClick={copyDesign}>{copied ? 'Copied!' : 'Copy design'}</button>
        <button onClick={() => setS(DESIGN)} style={{ marginLeft: 8 }}>
          Reset to saved
        </button>
      </div>
      <p style={{ fontSize: 14 }}>
        When you like it: click Copy design, then paste it over everything in <code>src/boothDesign.js</code>.
      </p>

      <h3>Colors</h3>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
        {PRESETS.map((p) => (
          <button
            key={p.name}
            onClick={() => setS((prev) => ({ ...prev, bg: p.bg, textColor: p.text }))}
            style={{ background: p.bg, color: p.text, border: '1px solid #ccc', padding: '6px 12px', borderRadius: 6 }}
          >
            {p.name}
          </button>
        ))}
      </div>
      <div style={{ margin: '12px 0', display: 'flex', gap: 16, justifyContent: 'center' }}>
        <label>
          Background <input type="color" value={s.bg} onChange={(e) => set('bg', e.target.value)} />
        </label>
        <label>
          Text <input type="color" value={s.textColor} onChange={(e) => set('textColor', e.target.value)} />
        </label>
      </div>

      <h3>Footer</h3>
      <Slider label="Footer height" value={s.footer} min={150} max={500} onChange={(v) => set('footer', v)} />

      <h3>Logo</h3>
      <Slider label="Logo size" value={s.logoSize} min={50} max={460} onChange={(v) => set('logoSize', v)} />
      <Slider label="Logo left / right" value={s.logoX} min={0} max={100} onChange={(v) => set('logoX', v)} />
      <Slider label="Logo up / down" value={s.logoY} min={0} max={100} onChange={(v) => set('logoY', v)} />

      <h3>Title</h3>
      <input
        type="text"
        value={s.text}
        maxLength={30}
        onChange={(e) => set('text', e.target.value)}
        style={{ padding: 8, width: '70%' }}
      />
      <div style={{ margin: '8px 0', display: 'flex', gap: 8, justifyContent: 'center' }}>
        <select value={s.font} onChange={(e) => changeFont(e.target.value)} style={{ padding: 6 }}>
          {FONTS.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
        <select
          value={currentWeight}
          onChange={(e) => set('fontWeight', Number(e.target.value))}
          style={{ padding: 6 }}
        >
          {weights.map((w) => (
            <option key={w.value} value={w.value}>
              {w.label}
            </option>
          ))}
        </select>
      </div>
      <Slider label="Title size" value={s.textSize} min={20} max={140} onChange={(v) => set('textSize', v)} />
      <Slider label="Title left / right" value={s.textX} min={0} max={100} onChange={(v) => set('textX', v)} />
      <Slider label="Title up / down" value={s.textY} min={0} max={100} onChange={(v) => set('textY', v)} />

      <h3>Date</h3>
      <p style={{ fontSize: 14, margin: '0 0 8px' }}>
        Guests pick their own date. Here you only choose how it looks.
      </p>
      <select value={previewDate} onChange={(e) => setPreviewDate(e.target.value)} style={{ padding: 6 }}>
        {s.dates.map((d) => (
          <option key={d} value={d}>
            Preview: {d}
          </option>
        ))}
      </select>
      <Slider label="Date size" value={s.dateSize} min={12} max={80} onChange={(v) => set('dateSize', v)} />
      <Slider label="Date left / right" value={s.dateX} min={0} max={100} onChange={(v) => set('dateX', v)} />
      <Slider label="Date up / down" value={s.dateY} min={0} max={100} onChange={(v) => set('dateY', v)} />

      <h3>Stars</h3>
      {s.stars.map((st, i) => (
        <div key={i} style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12, margin: '8px 0' }}>
          <label>
            <input type="checkbox" checked={st.on} onChange={(e) => setStar(i, 'on', e.target.checked)} /> Star {i + 1}
          </label>
          {st.on && (
            <>
              <Slider label="Size" value={st.size} min={20} max={300} onChange={(v) => setStar(i, 'size', v)} />
              <Slider label="Left / right" value={st.x} min={0} max={100} onChange={(v) => setStar(i, 'x', v)} />
              <Slider label="Up / down" value={st.y} min={0} max={100} onChange={(v) => setStar(i, 'y', v)} />
            </>
          )}
        </div>
      ))}
    </div>
  )
}