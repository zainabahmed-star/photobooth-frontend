import { useState, useEffect } from 'react'

export const SHOTS = 4

export const FONT_WEIGHTS = {
  Roboto: [
    { label: 'Thin', value: 100 },
    { label: 'Light', value: 300 },
    { label: 'Regular', value: 400 },
    { label: 'Medium', value: 500 },
    { label: 'Bold', value: 700 },
    { label: 'Black', value: 900 },
  ],
  'Playfair Display': [
    { label: 'Regular', value: 400 },
    { label: 'Medium', value: 500 },
    { label: 'SemiBold', value: 600 },
    { label: 'Bold', value: 700 },
    { label: 'ExtraBold', value: 800 },
    { label: 'Black', value: 900 },
  ],
  'Great Vibes': [{ label: 'Regular', value: 400 }],
  Pacifico: [{ label: 'Regular', value: 400 }],
}

export const FONTS = Object.keys(FONT_WEIGHTS)

const loadImage = (src) =>
  new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })

// loads the logo, the star and the fonts once
export function useStripAssets() {
  const [assets, setAssets] = useState({ logo: null, star: null, ready: false })

  useEffect(() => {
    const fontLoads = []
    FONTS.forEach((f) => {
      FONT_WEIGHTS[f].forEach((w) => {
        fontLoads.push(document.fonts.load(`${w.value} 64px "${f}"`).catch(() => null))
      })
    })
    Promise.all([loadImage('/logo.png'), loadImage('/sparkling.png'), ...fontLoads]).then(
      ([logo, star]) => setAssets({ logo, star, ready: true })
    )
  }, [])

  return assets
}

// draws the whole strip and returns it as an image url
export function drawStrip({ shots, design: d, dateText, logo, star }) {
  const pad = 30
  const size = 400
  const canvas = document.createElement('canvas')
  canvas.width = size + pad * 2
  canvas.height = pad + SHOTS * (size + pad) + d.footer
  const ctx = canvas.getContext('2d')

  ctx.fillStyle = d.bg
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  for (let i = 0; i < SHOTS; i++) {
    const y = pad + i * (size + pad)
    if (shots[i]) {
      ctx.drawImage(shots[i], pad, y, size, size)
    } else {
      ctx.fillStyle = '#cccccc'
      ctx.fillRect(pad, y, size, size)
    }
  }

  const footerTop = canvas.height - d.footer

  // logo
  if (logo) {
    const w = d.logoSize
    const h = (logo.height / logo.width) * w
    const cx = (canvas.width * d.logoX) / 100
    const cy = footerTop + (d.footer * d.logoY) / 100
    ctx.drawImage(logo, cx - w / 2, cy - h / 2, w, h)
  }

  ctx.fillStyle = d.textColor
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  // title
  ctx.font = `${d.fontWeight || 400} ${d.textSize}px "${d.font}", sans-serif`
  ctx.fillText(d.text, (canvas.width * d.textX) / 100, footerTop + (d.footer * d.textY) / 100)

  // date: always Roboto Regular, smaller, under the title
  if (dateText) {
    ctx.font = `400 ${d.dateSize}px "Roboto", sans-serif`
    ctx.fillText(dateText, (canvas.width * d.dateX) / 100, footerTop + (d.footer * d.dateY) / 100)
  }

  // stars go on top of everything
  if (star) {
    d.stars.forEach((st) => {
      if (!st.on) return
      const w = st.size
      const h = (star.height / star.width) * w
      const cx = (canvas.width * st.x) / 100
      const cy = (canvas.height * st.y) / 100
      ctx.drawImage(star, cx - w / 2, cy - h / 2, w, h)
    })
  }

  return canvas.toDataURL('image/png')
}