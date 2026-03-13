import { useRef, useEffect, useState, useCallback } from 'react'
import { Stage, Layer, Rect, Text, Circle, Image as KonvaImage, Transformer } from 'react-konva'
import useImage from 'use-image'
import type Konva from 'konva'
import type { UseCanvasReturn } from '../hooks/useCanvas'
import type { CanvasElement, ToolType } from '../types'

// ── Image element (needs hook) ─────────────────────────────
function ImageNode({
  element,
  onSelect,
  onDragEnd,
  onTransformEnd,
}: {
  element: CanvasElement
  onSelect: () => void
  onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => void
  onTransformEnd: (e: Konva.KonvaEventObject<Event>) => void
}) {
  const [image] = useImage(element.src || '', 'anonymous')
  return (
    <KonvaImage
      id={element.id}
      image={image}
      x={element.x}
      y={element.y}
      width={element.width}
      height={element.height}
      rotation={element.rotation}
      opacity={element.opacity}
      draggable={!element.locked}
      onClick={onSelect}
      onTap={onSelect}
      onDragEnd={onDragEnd}
      onTransformEnd={onTransformEnd}
    />
  )
}

// ── Main Canvas ────────────────────────────────────────────
export function Canvas({
  canvas,
  selectedId,
  tool,
  stageRef,
  setSelectedId,
  addElement,
  updateElement,
  updateElementSilent,
}: Pick<
  UseCanvasReturn,
  'canvas' | 'selectedId' | 'tool' | 'stageRef' | 'setSelectedId' | 'addElement' | 'updateElement' | 'updateElementSilent'
>) {
  const containerRef = useRef<HTMLDivElement>(null)
  const transformerRef = useRef<Konva.Transformer>(null)
  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 })
  const [editingText, setEditingText] = useState<CanvasElement | null>(null)

  // Observe container size
  useEffect(() => {
    if (!containerRef.current) return
    const observer = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect
      setContainerSize({ width, height })
    })
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  // Calculate display scale
  const padding = 40
  const scale = Math.min(
    (containerSize.width - padding * 2) / canvas.width,
    (containerSize.height - padding * 2) / canvas.height,
    1,
  )

  // Update transformer when selection changes
  useEffect(() => {
    if (!transformerRef.current || !stageRef.current) return
    if (selectedId && !editingText) {
      const node = stageRef.current.findOne(`#${selectedId}`)
      if (node) {
        transformerRef.current.nodes([node])
      } else {
        transformerRef.current.nodes([])
      }
    } else {
      transformerRef.current.nodes([])
    }
    transformerRef.current.getLayer()?.batchDraw()
  }, [selectedId, editingText, stageRef, canvas.elements])

  // ── Handlers ─────────────────────────────────────────────
  const handleStageClick = useCallback((e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    // Click on stage background
    if (e.target === e.target.getStage() || e.target.id() === '__bg') {
      if (tool === 'text') {
        const stage = e.target.getStage()!
        const pos = stage.getPointerPosition()!
        addElement({
          type: 'text',
          x: pos.x / scale,
          y: pos.y / scale,
          width: 400,
          height: 60,
          text: 'Type here',
          fontSize: 36,
          fontFamily: 'Inter',
          fontWeight: 400,
          fill: '#000000',
          align: 'left',
          lineHeight: 1.3,
        })
      } else if (tool === 'shape-rect') {
        const stage = e.target.getStage()!
        const pos = stage.getPointerPosition()!
        addElement({
          type: 'shape',
          shapeType: 'rect',
          x: pos.x / scale,
          y: pos.y / scale,
          width: 200,
          height: 200,
          fill: '#7c3aed',
          stroke: '',
          strokeWidth: 0,
          cornerRadius: 0,
        })
      } else if (tool === 'shape-circle') {
        const stage = e.target.getStage()!
        const pos = stage.getPointerPosition()!
        addElement({
          type: 'shape',
          shapeType: 'circle',
          x: pos.x / scale,
          y: pos.y / scale,
          width: 200,
          height: 200,
          fill: '#06b6d4',
        })
      } else {
        setSelectedId(null)
      }
      return
    }

    // Click on element
    const id = e.target.id()
    if (id && id !== '__bg') {
      setSelectedId(id)
    }
  }, [tool, scale, addElement, setSelectedId])

  const handleDragEnd = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    const id = e.target.id()
    if (!id) return
    updateElement(id, {
      x: e.target.x(),
      y: e.target.y(),
    })
  }, [updateElement])

  const handleTransformEnd = useCallback((e: Konva.KonvaEventObject<Event>) => {
    const node = e.target
    const id = node.id()
    if (!id) return

    const scaleX = node.scaleX()
    const scaleY = node.scaleY()
    node.scaleX(1)
    node.scaleY(1)

    const element = canvas.elements.find(el => el.id === id)

    if (element?.type === 'text') {
      // For text: resize width, scale font size
      updateElement(id, {
        x: node.x(),
        y: node.y(),
        width: Math.max(20, node.width() * scaleX),
        fontSize: Math.max(8, Math.round((element.fontSize || 24) * scaleY)),
        rotation: node.rotation(),
      })
    } else {
      updateElement(id, {
        x: node.x(),
        y: node.y(),
        width: Math.max(5, node.width() * scaleX),
        height: Math.max(5, node.height() * scaleY),
        rotation: node.rotation(),
      })
    }
  }, [canvas.elements, updateElement])

  const handleTextDblClick = useCallback((element: CanvasElement) => {
    setEditingText(element)
    setSelectedId(element.id)
  }, [setSelectedId])

  const handleTextEditEnd = useCallback((text: string) => {
    if (editingText) {
      updateElement(editingText.id, { text })
      setEditingText(null)
    }
  }, [editingText, updateElement])

  // ── Render element ───────────────────────────────────────
  const renderElement = (el: CanvasElement) => {
    const isEditing = editingText?.id === el.id
    const common = {
      id: el.id,
      x: el.x,
      y: el.y,
      rotation: el.rotation,
      opacity: isEditing ? 0 : el.opacity,
      draggable: !el.locked && tool === 'select',
      onClick: () => setSelectedId(el.id),
      onTap: () => setSelectedId(el.id),
      onDragEnd: handleDragEnd,
      onTransformEnd: handleTransformEnd,
    }

    switch (el.type) {
      case 'text':
        return (
          <Text
            key={el.id}
            {...common}
            text={el.text || ''}
            fontSize={el.fontSize || 24}
            fontFamily={el.fontFamily || 'Inter'}
            fontStyle={
              (el.fontWeight || 400) >= 700 ? 'bold' : 'normal'
            }
            fill={el.fill || '#000'}
            align={el.align || 'left'}
            width={el.width}
            lineHeight={el.lineHeight || 1.3}
            onDblClick={() => handleTextDblClick(el)}
            onDblTap={() => handleTextDblClick(el)}
          />
        )

      case 'shape':
        if (el.shapeType === 'circle') {
          return (
            <Circle
              key={el.id}
              {...common}
              x={el.x + el.width / 2}
              y={el.y + el.height / 2}
              radius={el.width / 2}
              fill={el.fill || '#7c3aed'}
              stroke={el.stroke || ''}
              strokeWidth={el.strokeWidth || 0}
              onDragEnd={(e) => {
                const id = e.target.id()
                if (!id) return
                updateElement(id, {
                  x: e.target.x() - el.width / 2,
                  y: e.target.y() - el.height / 2,
                })
              }}
            />
          )
        }
        return (
          <Rect
            key={el.id}
            {...common}
            width={el.width}
            height={el.height}
            fill={el.fill || '#7c3aed'}
            stroke={el.stroke || ''}
            strokeWidth={el.strokeWidth || 0}
            cornerRadius={el.cornerRadius || 0}
          />
        )

      case 'image':
        return (
          <ImageNode
            key={el.id}
            element={el}
            onSelect={() => setSelectedId(el.id)}
            onDragEnd={handleDragEnd}
            onTransformEnd={handleTransformEnd}
          />
        )

      default:
        return null
    }
  }

  // ── Cursor ───────────────────────────────────────────────
  const cursorMap: Record<ToolType, string> = {
    select: 'default',
    text: 'text',
    'shape-rect': 'crosshair',
    'shape-circle': 'crosshair',
    image: 'default',
  }

  const stageW = canvas.width * scale
  const stageH = canvas.height * scale

  return (
    <div
      ref={containerRef}
      className="flex-1 flex items-center justify-center overflow-hidden bg-surface-50/30 rounded-xl"
      style={{ cursor: cursorMap[tool] }}
    >
      <div className="relative" style={{ width: stageW, height: stageH }}>
        {/* Checkerboard shadow */}
        <div
          className="absolute rounded-lg"
          style={{
            inset: -2,
            boxShadow: '0 8px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.06)',
          }}
        />

        <Stage
          ref={stageRef}
          width={stageW}
          height={stageH}
          scaleX={scale}
          scaleY={scale}
          onClick={handleStageClick}
          onTap={handleStageClick}
        >
          <Layer>
            {/* Background */}
            <Rect
              id="__bg"
              x={0}
              y={0}
              width={canvas.width}
              height={canvas.height}
              fill={canvas.backgroundColor}
              listening={true}
            />

            {/* Elements */}
            {canvas.elements.map(renderElement)}

            {/* Transformer */}
            <Transformer
              ref={transformerRef}
              borderStroke="#7c3aed"
              borderStrokeWidth={1.5}
              anchorStroke="#7c3aed"
              anchorFill="#ffffff"
              anchorSize={8}
              anchorCornerRadius={2}
              rotateAnchorOffset={24}
              padding={4}
              ignoreStroke={true}
              boundBoxFunc={(oldBox, newBox) => {
                if (newBox.width < 10 || newBox.height < 10) return oldBox
                return newBox
              }}
            />
          </Layer>
        </Stage>

        {/* Text editing overlay */}
        {editingText && (
          <TextEditor
            element={editingText}
            scale={scale}
            onComplete={handleTextEditEnd}
          />
        )}
      </div>
    </div>
  )
}

// ── Text Editor Overlay ────────────────────────────────────
function TextEditor({
  element,
  scale,
  onComplete,
}: {
  element: CanvasElement
  scale: number
  onComplete: (text: string) => void
}) {
  const [text, setText] = useState(element.text || '')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus()
      textareaRef.current.select()
    }
  }, [])

  // Auto-resize
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }, [text])

  const handleBlur = () => onComplete(text)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onComplete(element.text || '')
    }
  }

  const fontSize = (element.fontSize || 24) * scale
  const fontWeight = (element.fontWeight || 400) >= 700 ? 'bold' : 'normal'

  return (
    <textarea
      ref={textareaRef}
      value={text}
      onChange={e => setText(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      className="absolute outline-none resize-none overflow-hidden bg-transparent border-2 border-accent-violet/50 rounded"
      style={{
        top: element.y * scale,
        left: element.x * scale,
        width: element.width * scale,
        minHeight: 30,
        fontSize,
        fontFamily: element.fontFamily || 'Inter',
        fontWeight,
        color: element.fill || '#000',
        textAlign: element.align || 'left',
        lineHeight: element.lineHeight || 1.3,
        padding: '0 2px',
        opacity: element.opacity,
        transformOrigin: 'top left',
        transform: element.rotation ? `rotate(${element.rotation}deg)` : undefined,
      }}
    />
  )
}
