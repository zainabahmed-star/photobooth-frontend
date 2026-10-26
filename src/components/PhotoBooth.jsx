import { useRef, useState, useEffect, useMemo } from 'react'
import { DESIGN } from '../boothDesign'
import { SHOTS, useStripAssets, drawStrip } from './stripTools'
import './PhotoBooth.css'

const COUNTDOWN = 3
const wait = (ms) => new Promise((r) => setTimeout(r, ms))

// same numbers the strip is drawn with (see stripTools.js)
const STRIP_W = 460
const PAD = 30
const BOX = 400
const STRIP_H = PAD + SHOTS * (BOX + PAD) + DESIGN.footer

export default function PhotoBooth() {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const assets = useStripAssets()
  const [shots, setShots] = useState([])
  const [count, setCount] = useState(null)
  const [flash, setFlash] = useState(false)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState('')
  const [date, setDate] = useState(DESIGN.defaultDate)
  const [withStars, setWithStars] = useState(true)
  const [facing, setFacing] = useState('user') // 'user' = front, 'environment' = back

  const mirrored = facing === 'user'
  const done = shots.length === SHOTS

  // start (or restart) the camera whenever front/back changes
  useEffect(() => {
    let cancelled = false

    async function startCamera() {
      streamRef.current?.getTracks().forEach((t) => t.stop())
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: facing,
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        })
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream
        setError('')
        if (videoRef.current) videoRef.current.srcObject = stream
      } catch {
        setError('Could not access the camera. Allow camera permission in your browser settings, then refresh.')
      }
    }

    startCamera()
    return () => {
      cancelled = true
    }
  }, [facing])

  // stop the camera when leaving the page
  useEffect(() => {
    return () => streamRef.current?.getTracks().forEach((t) => t.stop())
  }, [])

  // the strip is redrawn live: every photo, date or stars change updates it
  const stripUrl = useMemo(() => {
    if (!assets.ready) return ''
    const design = {
      ...DESIGN,
      stars: DESIGN.stars.map((st) => ({ ...st, on: withStars && st.on })),
    }
    return drawStrip({
      shots,
      design,
      dateText: date,
      logo: assets.logo,
      star: assets.star,
    })
  }, [shots, date, withStars, assets])

  // where the live camera sits on the strip: the next empty box
  const slotStyle = {
    left: `${(PAD / STRIP_W) * 100}%`,
    top: `${((PAD + shots.length * (BOX + PAD)) / STRIP_H) * 100}%`,
    width: `${(BOX / STRIP_W) * 100}%`,
    height: `${(BOX / STRIP_H) * 100}%`,
    display: done ? 'none' : 'block',
  }

  function capture() {
    const video = videoRef.current
    const size = Math.min(video.videoWidth, video.videoHeight)
    const sx = (video.videoWidth - size) / 2
    const sy = (video.videoHeight - size) / 2
    const canvas = document.createElement('canvas')
    canvas.width = 600
    canvas.height = 600
    const ctx = canvas.getContext('2d')
    if (mirrored) {
      ctx.translate(600, 0)
      ctx.scale(-1, 1)
    }
    ctx.drawImage(video, sx, sy, size, size, 0, 0, 600, 600)
    return canvas
  }

  async function takeShot() {
    if (running || done) return
    setRunning(true)
    videoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    for (let c = COUNTDOWN; c > 0; c--) {
      setCount(c)
      await wait(1000)
    }
    setCount(null)
    const canvas = capture()
    setFlash(true)
    setTimeout(() => setFlash(false), 250)
    setShots((prev) => [...prev, canvas])
    setRunning(false)
  }

  function startOver() {
    setShots([])
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // opens the phone's share sheet (Save to Photos, WhatsApp...) or downloads on desktop
  async function saveStrip() {
    if (!stripUrl) return
    try {
      const blob = await (await fetch(stripUrl)).blob()
      const file = new File([blob], 'graduation-strip.png', { type: 'image/png' })
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: DESIGN.text })
        return
      }
    } catch (e) {
      if (e && e.name === 'AbortError') return
    }
    const a = document.createElement('a')
    a.href = stripUrl
    a.download = 'graduation-strip.png'
    a.click()
  }

  let status = `Photo ${shots.length + 1} of ${SHOTS}. Tap when you are ready`
  if (running) status = 'Smile!'
  if (done) status = 'All done! Save your strip'

  return (
    <div className="pb-page">
      <header className="pb-header">
        <h1>Photo Booth</h1>
        <p>{DESIGN.text}</p>
      </header>

      {error && <p className="pb-error">{error}</p>}

      <section className="pb-options">
        <div>
          <span className="pb-label">Ceremony day</span>
          <div className="pb-seg">
            {DESIGN.dates.map((d) => (
              <button key={d} className={date === d ? 'active' : ''} onClick={() => setDate(d)}>
                {d.split(' ').slice(0, 2).join(' ')}
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="pb-label">Sparkles</span>
          <div className="pb-seg">
            <button className={withStars ? 'active' : ''} onClick={() => setWithStars(true)}>
              With stars
            </button>
            <button className={!withStars ? 'active' : ''} onClick={() => setWithStars(false)}>
              No stars
            </button>
          </div>
        </div>
      </section>

      <div className="pb-strip" style={{ aspectRatio: `${STRIP_W} / ${STRIP_H}` }}>
        {stripUrl && <img src={stripUrl} alt="Your photo strip" />}

        <div className="pb-slot" style={slotStyle}>
          <video
            ref={videoRef}
            className={mirrored ? 'mirror' : ''}
            autoPlay
            playsInline
            muted
          />
          {count && <div className="pb-count">{count}</div>}
          {flash && <div className="pb-flash" />}
        </div>
      </div>

      <div className="pb-bar">
        <p className="pb-status">{status}</p>
        <div className="pb-actions">
          {!done && (
            <button className="pb-btn" onClick={takeShot} disabled={running || !!error}>
              {running ? 'Get ready...' : `Take photo ${shots.length + 1}`}
            </button>
          )}
          {done && (
            <button className="pb-btn" onClick={saveStrip}>
              Save strip
            </button>
          )}
          <div className="pb-sub">
            {!done && !running && (
              <button className="pb-btn ghost" onClick={() => setFacing(mirrored ? 'environment' : 'user')}>
                Flip camera
              </button>
            )}
            {shots.length > 0 && !running && (
              <button className="pb-btn ghost" onClick={startOver}>
                Start over
              </button>
            )}
          </div>
        </div>
        {done && (
          <p className="pb-hint">
            iPhone: if the image opens on a new page, press and hold it, then tap Save to Photos.
          </p>
        )}
      </div>
    </div>
  )
}