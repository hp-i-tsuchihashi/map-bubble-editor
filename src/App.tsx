import { useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { Image as KImage, Layer, Rect, Stage } from 'react-konva'
import type Konva from 'konva'
import { BubbleNode } from './BubbleNode'
import { DEFAULT_MAP } from './defaultMap'
import { useImage } from './useImage'
import type { Bubble, BubbleStyle } from './types'
import './App.css'

const DEFAULT_STYLE: BubbleStyle = {
  backgroundColor: '#ffffff',
  borderColor: '#d1d5db',
  cornerRadius: 14,
  shadow: true,
}

let idCounter = 0
const newId = () => `id-${Date.now()}-${idCounter++}`

function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader()
    fr.onload = () => resolve(fr.result as string)
    fr.onerror = () => reject(fr.error)
    fr.readAsDataURL(file)
  })
}

const MAX_VIEW_W = 960

export default function App() {
  const [mapSrc, setMapSrc] = useState(DEFAULT_MAP)
  const [bubbles, setBubbles] = useState<Bubble[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const stageRef = useRef<Konva.Stage>(null)
  const mapImg = useImage(mapSrc)

  const mapW = mapImg?.width ?? 1200
  const mapH = mapImg?.height ?? 800
  const scale = Math.min(1, MAX_VIEW_W / mapW)
  const selected = bubbles.find((b) => b.id === selectedId) ?? null

  const update = (id: string, patch: Partial<Bubble>) =>
    setBubbles((bs) => bs.map((b) => (b.id === id ? { ...b, ...patch } : b)))
  const updateStyle = (patch: Partial<BubbleStyle>) =>
    selected && update(selected.id, { style: { ...selected.style, ...patch } })

  const addBubble = () => {
    const n = bubbles.length
    const x = mapW / 2 - 130 + n * 30
    const y = mapH / 2 - 150 + n * 30
    const b: Bubble = {
      id: newId(),
      x,
      y,
      width: 260,
      height: 120,
      tailX: x + 60,
      tailY: y + 200,
      text: 'ここにテキストを入力',
      images: [],
      layout: 'row',
      style: { ...DEFAULT_STYLE },
    }
    setBubbles((bs) => [...bs, b])
    setSelectedId(b.id)
  }

  const deleteSelected = () => {
    if (!selected) return
    setBubbles((bs) => bs.filter((b) => b.id !== selected.id))
    setSelectedId(null)
  }

  const onMapFile = async (f: File | undefined) => {
    if (f) setMapSrc(await readAsDataURL(f))
  }

  const onBubbleImages = async (files: FileList | null) => {
    if (!selected || !files) return
    const added = await Promise.all(
      Array.from(files).map(async (f) => ({ id: newId(), src: await readAsDataURL(f) })),
    )
    update(selected.id, { images: [...selected.images, ...added] })
  }

  const exportPng = () => {
    const stage = stageRef.current
    if (!stage) return
    const prev = selectedId
    flushSync(() => setSelectedId(null))
    const uri = stage.toDataURL({ pixelRatio: 1 / scale, mimeType: 'image/png' })
    flushSync(() => setSelectedId(prev))
    const a = document.createElement('a')
    a.href = uri
    a.download = 'map-bubbles.png'
    a.click()
  }

  return (
    <div className="app">
      <header className="toolbar">
        <h1>Map Bubble Editor</h1>
        <label className="btn">
          地図を読み込む
          <input type="file" accept="image/*" hidden onChange={(e) => { void onMapFile(e.target.files?.[0]); e.target.value = '' }} />
        </label>
        <button className="btn primary" onClick={addBubble}>＋ 吹き出しを追加</button>
        <button className="btn" onClick={exportPng}>PNGで書き出し</button>
      </header>
      <main className="main">
        <div className="stage-wrap">
          <Stage
            ref={stageRef}
            width={mapW * scale}
            height={mapH * scale}
            scaleX={scale}
            scaleY={scale}
            onMouseDown={(e) => { if (e.target === e.target.getStage() || e.target.name() === 'map') setSelectedId(null) }}
          >
            <Layer>
              {mapImg ? (
                <KImage image={mapImg} width={mapW} height={mapH} name="map" />
              ) : (
                <Rect width={mapW} height={mapH} fill="#e5e7eb" name="map" />
              )}
              {bubbles.map((b) => (
                <BubbleNode
                  key={b.id}
                  bubble={b}
                  selected={b.id === selectedId}
                  onSelect={() => setSelectedId(b.id)}
                  onChange={(patch) => update(b.id, patch)}
                />
              ))}
            </Layer>
          </Stage>
        </div>
        <aside className="panel">
          {selected ? (
            <>
              <h2>選択中の吹き出し</h2>
              <label>テキスト
                <textarea value={selected.text} rows={3} onChange={(e) => update(selected.id, { text: e.target.value })} />
              </label>
              <label className="row">背景色
                <input type="color" value={selected.style.backgroundColor} onChange={(e) => updateStyle({ backgroundColor: e.target.value })} />
              </label>
              <label className="row">枠色
                <input type="color" value={selected.style.borderColor} onChange={(e) => updateStyle({ borderColor: e.target.value })} />
              </label>
              <label>角丸 ({selected.style.cornerRadius}px)
                <input type="range" min={0} max={60} value={selected.style.cornerRadius} onChange={(e) => updateStyle({ cornerRadius: Number(e.target.value) })} />
              </label>
              <label className="row">ドロップシャドウ
                <input type="checkbox" checked={selected.style.shadow} onChange={(e) => updateStyle({ shadow: e.target.checked })} />
              </label>
              <label>幅 ({selected.width}px)
                <input type="range" min={120} max={600} value={selected.width} onChange={(e) => update(selected.id, { width: Number(e.target.value) })} />
              </label>
              <label>高さ ({selected.height}px)
                <input type="range" min={60} max={500} value={selected.height} onChange={(e) => update(selected.id, { height: Number(e.target.value) })} />
              </label>
              <label>画像の並び
                <select value={selected.layout} onChange={(e) => update(selected.id, { layout: e.target.value as Bubble['layout'] })}>
                  <option value="row">横並び (row)</option>
                  <option value="column">縦並び (column)</option>
                </select>
              </label>
              <label className="btn">
                画像を挿入
                <input type="file" accept="image/*" multiple hidden onChange={(e) => { void onBubbleImages(e.target.files); e.target.value = '' }} />
              </label>
              {selected.images.length > 0 && (
                <button className="btn" onClick={() => update(selected.id, { images: [] })}>挿入画像をクリア</button>
              )}
              <button className="btn danger" onClick={deleteSelected}>吹き出しを削除</button>
            </>
          ) : (
            <p className="hint">吹き出しを追加またはクリックして選択すると、ここで編集できます。青い丸をドラッグするとしっぽを動かせます。</p>
          )}
        </aside>
      </main>
    </div>
  )
}
