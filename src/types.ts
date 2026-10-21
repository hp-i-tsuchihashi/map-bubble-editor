export type LayoutMode = 'row' | 'column'

export interface BubbleStyle {
  backgroundColor: string
  borderColor: string
  cornerRadius: number
  shadow: boolean
}

export interface ContentImage {
  id: string
  src: string
}

export interface Bubble {
  id: string
  x: number
  y: number
  width: number
  height: number
  tailX: number
  tailY: number
  text: string
  images: ContentImage[]
  layout: LayoutMode
  style: BubbleStyle
}
