import { Circle, Group, Image as KImage, Shape, Text } from 'react-konva'
import type Konva from 'konva'
import type { Bubble, ContentImage } from './types'
import { useImage } from './useImage'

const PADDING = 14
const GAP = 8
const TAIL_BASE = 26
const FONT = '"Noto Sans JP", "Hiragino Sans", "Segoe UI", system-ui, sans-serif'

type Side = 'top' | 'right' | 'bottom' | 'left'

function pickSide(dx: number, dy: number, w: number, h: number): Side | null {
  const nx = dx / (w / 2)
  const ny = dy / (h / 2)
  if (Math.abs(nx) <= 1 && Math.abs(ny) <= 1) return null
  if (Math.abs(nx) > Math.abs(ny)) return nx > 0 ? 'right' : 'left'
  return ny > 0 ? 'bottom' : 'top'
}

// Draws body and tail as a single path so border and shadow stay coherent.
function drawBubble(ctx: Konva.Context, b: Bubble) {
  const { width: w, height: h } = b
  const r = Math.max(0, Math.min(b.style.cornerRadius, w / 2, h / 2))
  const tx = b.tailX - b.x
  const ty = b.tailY - b.y
  const side = pickSide(tx - w / 2, ty - h / 2, w, h)
  const half = TAIL_BASE / 2
  const clamp = (v: number, len: number) => {
    const lo = Math.min(r + half, len / 2)
    const hi = Math.max(len - r - half, len / 2)
    return Math.max(lo, Math.min(hi, v))
  }
  ctx.beginPath()
  ctx.moveTo(r, 0)
  if (side === 'top') {
    const c = clamp(tx, w)
    ctx.lineTo(c - half, 0)
    ctx.lineTo(tx, ty)
    ctx.lineTo(c + half, 0)
  }
  ctx.lineTo(w - r, 0)
  ctx.arcTo(w, 0, w, r, r)
  if (side === 'right') {
    const c = clamp(ty, h)
    ctx.lineTo(w, c - half)
    ctx.lineTo(tx, ty)
    ctx.lineTo(w, c + half)
  }
  ctx.lineTo(w, h - r)
  ctx.arcTo(w, h, w - r, h, r)
  if (side === 'bottom') {
    const c = clamp(tx, w)
    ctx.lineTo(c + half, h)
    ctx.lineTo(tx, ty)
    ctx.lineTo(c - half, h)
  }
  ctx.lineTo(r, h)
  ctx.arcTo(0, h, 0, h - r, r)
  if (side === 'left') {
    const c = clamp(ty, h)
    ctx.lineTo(0, c + half)
    ctx.lineTo(tx, ty)
    ctx.lineTo(0, c - half)
  }
  ctx.lineTo(0, r)
  ctx.arcTo(0, 0, r, 0, r)
  ctx.closePath()
}

interface ImgProps {
  image: ContentImage
  x: number
  y: number
  w: number
  h: number
}

function ContentImageNode({ image, x, y, w, h }: ImgProps) {
  const img = useImage(image.src)
  if (!img) return null
  const scale = Math.min(w / img.width, h / img.height)
  const iw = img.width * scale
  const ih = img.height * scale
  const ix = x + (w - iw) / 2
  const iy = y + (h - ih) / 2
  const rad = Math.min(8, iw / 2, ih / 2)
  return (
    <KImage
      image={img}
      x={ix}
      y={iy}
      width={iw}
      height={ih}
      listening={false}
      sceneFunc={(ctx, node) => {
        ctx.save()
        ctx.beginPath()
        ctx.moveTo(rad, 0)
        ctx.arcTo(iw, 0, iw, ih, rad)
        ctx.arcTo(iw, ih, 0, ih, rad)
        ctx.arcTo(0, ih, 0, 0, rad)
        ctx.arcTo(0, 0, iw, 0, rad)
        ctx.closePath()
        ctx.clip()
        ctx.drawImage(node.getAttr('image') as CanvasImageSource, 0, 0, iw, ih)
        ctx.restore()
      }}
    />
  )
}

interface Props {
  bubble: Bubble
  selected: boolean
  onSelect: () => void
  onChange: (patch: Partial<Bubble>) => void
}

export function BubbleNode({ bubble: b, selected, onSelect, onChange }: Props) {
  const innerW = b.width - PADDING * 2
  const innerH = b.height - PADDING * 2
  const hasImages = b.images.length > 0
  const isRow = b.layout === 'row'
  // Text takes ~45% of the main axis when images are present.
  const textW = isRow && hasImages ? innerW * 0.45 : innerW
  const textH = !isRow && hasImages ? innerH * 0.4 : innerH
  const n = b.images.length
  const imgArea = isRow
    ? { x: PADDING + textW + GAP, y: PADDING, w: innerW - textW - GAP, h: innerH }
    : { x: PADDING, y: PADDING + textH + GAP, w: innerW, h: innerH - textH - GAP }
  const cellW = isRow ? imgArea.w : (imgArea.w - GAP * (n - 1)) / Math.max(n, 1)
  const cellH = isRow ? (imgArea.h - GAP * (n - 1)) / Math.max(n, 1) : imgArea.h

  return (
    <Group
      x={b.x}
      y={b.y}
      draggable
      onMouseDown={onSelect}
      onTouchStart={onSelect}
      onDragEnd={(e) => {
        const nx = e.target.x()
        const ny = e.target.y()
        if (e.target !== e.currentTarget) return
        onChange({ x: nx, y: ny, tailX: b.tailX + (nx - b.x), tailY: b.tailY + (ny - b.y) })
      }}
    >
      <Shape
        sceneFunc={(ctx, shape) => {
          drawBubble(ctx, b)
          ctx.fillStrokeShape(shape)
        }}
        hitFunc={(ctx, shape) => {
          drawBubble(ctx, b)
          ctx.fillStrokeShape(shape)
        }}
        fill={b.style.backgroundColor}
        stroke={b.style.borderColor}
        strokeWidth={selected ? 2.5 : 1.5}
        lineJoin="round"
        shadowEnabled={b.style.shadow}
        shadowColor="rgba(15, 23, 42, 0.28)"
        shadowBlur={20}
        shadowOffset={{ x: 0, y: 6 }}
      />
      <Text
        x={PADDING}
        y={PADDING}
        width={textW}
        height={textH}
        text={b.text}
        fontFamily={FONT}
        fontSize={15}
        lineHeight={1.45}
        fill="#1f2937"
        ellipsis
        listening={false}
      />
      {b.images.map((im, i) => (
        <ContentImageNode
          key={im.id}
          image={im}
          x={imgArea.x + (isRow ? 0 : i * (cellW + GAP))}
          y={imgArea.y + (isRow ? i * (cellH + GAP) : 0)}
          w={cellW}
          h={cellH}
        />
      ))}
      {selected && (
        <Circle
          x={b.tailX - b.x}
          y={b.tailY - b.y}
          radius={8}
          fill="#2563eb"
          stroke="#ffffff"
          strokeWidth={2.5}
          draggable
          name="tail-handle"
          onMouseDown={(e) => {
            e.cancelBubble = true
            onSelect()
          }}
          onDragMove={(e) => {
            e.cancelBubble = true
            onChange({ tailX: b.x + e.target.x(), tailY: b.y + e.target.y() })
          }}
          onDragEnd={(e) => {
            e.cancelBubble = true
          }}
        />
      )}
    </Group>
  )
}
