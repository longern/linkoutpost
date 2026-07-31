import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
  type WheelEvent,
} from "react";
import { FaArrowLeft } from "react-icons/fa6";
import { useTranslation } from "../../i18n";
import { createCroppedAvatarFile } from "../../media/imageProcessing";

type Point = {
  x: number;
  y: number;
};

type ImageSize = {
  height: number;
  width: number;
};

type GestureState =
  | {
      offset: Point;
      pointerId: number;
      start: Point;
      type: "drag";
    }
  | {
      distance: number;
      midpoint: Point;
      offset: Point;
      type: "pinch";
      zoom: number;
    };

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

export function AvatarCropDialog({
  file,
  onApply,
  onCancel,
}: {
  file: File;
  onApply(file: File): Promise<void> | void;
  onCancel(): void;
}) {
  const { t } = useTranslation();
  const imageRef = useRef<HTMLImageElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const pointersRef = useRef(new Map<number, Point>());
  const gestureRef = useRef<GestureState | null>(null);
  const offsetRef = useRef<Point>({ x: 0, y: 0 });
  const zoomRef = useRef(1);
  const [imageUrl, setImageUrl] = useState("");
  const [imageSize, setImageSize] = useState<ImageSize | null>(null);
  const [cropSize, setCropSize] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState<Point>({ x: 0, y: 0 });
  const [loadFailed, setLoadFailed] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    setImageSize(null);
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    zoomRef.current = 1;
    offsetRef.current = { x: 0, y: 0 };
    pointersRef.current.clear();
    gestureRef.current = null;
    setLoadFailed(false);

    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const updateSize = () => {
      setCropSize(
        Math.max(
          1,
          Math.min(
            420,
            viewport.clientWidth - 48,
            viewport.clientHeight - 48,
          ),
        ),
      );
    };
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(viewport);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const previousDocumentOverflow = document.documentElement.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    return () => {
      document.documentElement.style.overflow = previousDocumentOverflow;
      document.body.style.overflow = previousBodyOverflow;
    };
  }, []);

  useEffect(() => {
    function onKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape" && !saving) onCancel();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onCancel, saving]);

  const baseScale = useMemo(() => {
    if (!imageSize || !cropSize) return 1;
    return Math.max(
      cropSize / imageSize.width,
      cropSize / imageSize.height,
    );
  }, [cropSize, imageSize]);
  const scale = baseScale * zoom;
  function boundsForZoom(nextZoom: number): Point {
    if (!imageSize || !cropSize) return { x: 0, y: 0 };

    const nextScale = baseScale * nextZoom;
    return {
      x: Math.max(0, (imageSize.width * nextScale - cropSize) / 2),
      y: Math.max(0, (imageSize.height * nextScale - cropSize) / 2),
    };
  }
  const bounds = useMemo(
    () => boundsForZoom(zoom),
    [baseScale, cropSize, imageSize, zoom],
  );

  function constrainOffset(point: Point, nextZoom = zoomRef.current): Point {
    const nextBounds = boundsForZoom(nextZoom);
    return {
      x: clamp(point.x, -nextBounds.x, nextBounds.x),
      y: clamp(point.y, -nextBounds.y, nextBounds.y),
    };
  }

  useEffect(() => {
    const current = offsetRef.current;
    const nextOffset = {
      x: clamp(current.x, -bounds.x, bounds.x),
      y: clamp(current.y, -bounds.y, bounds.y),
    };
    offsetRef.current = nextOffset;
    setOffset(nextOffset);
  }, [bounds.x, bounds.y]);

  function midpoint(first: Point, second: Point): Point {
    return {
      x: (first.x + second.x) / 2,
      y: (first.y + second.y) / 2,
    };
  }

  function distance(first: Point, second: Point): number {
    return Math.hypot(second.x - first.x, second.y - first.y);
  }

  function beginPinch(): void {
    const points = [...pointersRef.current.values()];
    if (points.length < 2) return;

    gestureRef.current = {
      distance: Math.max(1, distance(points[0], points[1])),
      midpoint: midpoint(points[0], points[1]),
      offset: offsetRef.current,
      type: "pinch",
      zoom: zoomRef.current,
    };
  }

  function commitOffset(nextOffset: Point, nextZoom = zoomRef.current): void {
    const constrained = constrainOffset(nextOffset, nextZoom);
    offsetRef.current = constrained;
    setOffset(constrained);
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>): void {
    if (!imageSize || saving) return;

    event.currentTarget.setPointerCapture(event.pointerId);
    pointersRef.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });

    if (pointersRef.current.size === 1) {
      gestureRef.current = {
        offset: offsetRef.current,
        pointerId: event.pointerId,
        start: { x: event.clientX, y: event.clientY },
        type: "drag",
      };
    } else if (pointersRef.current.size === 2) {
      beginPinch();
    }
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>): void {
    if (!pointersRef.current.has(event.pointerId)) return;
    pointersRef.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });

    const gesture = gestureRef.current;
    if (!gesture) return;

    if (gesture.type === "drag" && gesture.pointerId === event.pointerId) {
      commitOffset({
        x: gesture.offset.x + event.clientX - gesture.start.x,
        y: gesture.offset.y + event.clientY - gesture.start.y,
      });
      return;
    }

    const points = [...pointersRef.current.values()];
    if (gesture.type !== "pinch" || points.length < 2) return;

    const currentMidpoint = midpoint(points[0], points[1]);
    const nextZoom = clamp(
      gesture.zoom * (distance(points[0], points[1]) / gesture.distance),
      1,
      3,
    );
    const zoomRatio = nextZoom / gesture.zoom;
    const viewportBounds = viewportRef.current?.getBoundingClientRect();
    const viewportCenter = {
      x: (viewportBounds?.left ?? 0) + (viewportBounds?.width ?? 0) / 2,
      y: (viewportBounds?.top ?? 0) + (viewportBounds?.height ?? 0) / 2,
    };
    const nextOffset = {
      x:
        currentMidpoint.x -
        viewportCenter.x -
        (gesture.midpoint.x - viewportCenter.x - gesture.offset.x) * zoomRatio,
      y:
        currentMidpoint.y -
        viewportCenter.y -
        (gesture.midpoint.y - viewportCenter.y - gesture.offset.y) * zoomRatio,
    };

    zoomRef.current = nextZoom;
    setZoom(nextZoom);
    commitOffset(nextOffset, nextZoom);
  }

  function stopDragging(event: PointerEvent<HTMLDivElement>): void {
    pointersRef.current.delete(event.pointerId);

    const remaining = [...pointersRef.current.entries()];
    if (remaining.length === 1) {
      const [pointerId, point] = remaining[0];
      gestureRef.current = {
        offset: offsetRef.current,
        pointerId,
        start: point,
        type: "drag",
      };
    } else if (remaining.length >= 2) {
      beginPinch();
    } else {
      gestureRef.current = null;
    }
  }

  function updateZoom(nextZoom: number, anchor?: Point): void {
    const currentZoom = zoomRef.current;
    const constrainedZoom = clamp(nextZoom, 1, 3);
    let nextOffset = offsetRef.current;

    if (anchor && currentZoom > 0) {
      const viewportBounds = viewportRef.current?.getBoundingClientRect();
      const viewportCenter = {
        x: (viewportBounds?.left ?? 0) + (viewportBounds?.width ?? 0) / 2,
        y: (viewportBounds?.top ?? 0) + (viewportBounds?.height ?? 0) / 2,
      };
      const zoomRatio = constrainedZoom / currentZoom;
      nextOffset = {
        x:
          anchor.x -
          viewportCenter.x -
          (anchor.x - viewportCenter.x - offsetRef.current.x) * zoomRatio,
        y:
          anchor.y -
          viewportCenter.y -
          (anchor.y - viewportCenter.y - offsetRef.current.y) * zoomRatio,
      };
    }

    zoomRef.current = constrainedZoom;
    setZoom(constrainedZoom);
    commitOffset(nextOffset, constrainedZoom);
  }

  function onWheel(event: WheelEvent<HTMLDivElement>): void {
    event.preventDefault();
    updateZoom(zoomRef.current - event.deltaY * 0.002, {
      x: event.clientX,
      y: event.clientY,
    });
  }

  function onCropKeyDown(event: KeyboardEvent<HTMLDivElement>): void {
    const step = event.shiftKey ? 10 : 2;
    let nextOffset: Point | null = null;

    if (event.key === "ArrowLeft") {
      nextOffset = { x: offset.x - step, y: offset.y };
    } else if (event.key === "ArrowRight") {
      nextOffset = { x: offset.x + step, y: offset.y };
    } else if (event.key === "ArrowUp") {
      nextOffset = { x: offset.x, y: offset.y - step };
    } else if (event.key === "ArrowDown") {
      nextOffset = { x: offset.x, y: offset.y + step };
    } else if (event.key === "+" || event.key === "=") {
      updateZoom(zoom + 0.1);
    } else if (event.key === "-") {
      updateZoom(zoom - 0.1);
    }

    if (nextOffset) commitOffset(nextOffset);
    if (nextOffset || ["+", "=", "-"].includes(event.key)) {
      event.preventDefault();
    }
  }

  async function applyCrop(): Promise<void> {
    const image = imageRef.current;
    if (!image || !imageSize || !cropSize || saving) return;

    setSaving(true);
    try {
      await onApply(
        await createCroppedAvatarFile(image, {
          offsetX: offset.x,
          offsetY: offset.y,
          scale,
          viewportSize: cropSize,
        }),
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop avatar-crop-backdrop" role="presentation">
      <section
        aria-labelledby="avatar-crop-title"
        aria-modal="true"
        className="modal-card avatar-crop-dialog"
        role="dialog"
      >
        <header className="avatar-crop-header">
          <h2 className="visually-hidden" id="avatar-crop-title">
            {t("editor.forms.cropAvatar")}
          </h2>
          <button
            aria-label={t("editor.forms.cancelAvatarCrop")}
            autoFocus
            className="circle-icon-button"
            disabled={saving}
            onClick={onCancel}
            type="button"
          >
            <FaArrowLeft aria-hidden="true" size={20} />
          </button>
          <button
            className="avatar-crop-apply"
            disabled={!imageSize || loadFailed || saving}
            onClick={() => void applyCrop()}
            type="button"
          >
            {saving
              ? t("editor.forms.applyingAvatarCrop")
              : t("editor.forms.applyAvatarCrop")}
          </button>
        </header>

        <div className="avatar-crop-stage">
          <div
            aria-label={t("editor.forms.avatarCropArea")}
            className="avatar-crop-viewport"
            onKeyDown={onCropKeyDown}
            onPointerCancel={stopDragging}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={stopDragging}
            onWheel={onWheel}
            ref={viewportRef}
            role="application"
            tabIndex={0}
          >
            {imageUrl && !loadFailed ? (
              <img
                alt=""
                className="avatar-crop-image"
                draggable={false}
                onError={() => setLoadFailed(true)}
                onLoad={(event) => {
                  imageRef.current = event.currentTarget;
                  setImageSize({
                    height: event.currentTarget.naturalHeight,
                    width: event.currentTarget.naturalWidth,
                  });
                }}
                src={imageUrl}
                style={
                  imageSize
                    ? {
                        height: imageSize.height * scale,
                        left: `calc(50% + ${offset.x}px)`,
                        top: `calc(50% + ${offset.y}px)`,
                        width: imageSize.width * scale,
                      }
                    : undefined
                }
              />
            ) : null}
            {loadFailed ? (
              <p className="avatar-crop-error">
                {t("editor.forms.avatarImageLoadFailed")}
              </p>
            ) : null}
            <span
              className="avatar-crop-mask"
              aria-hidden="true"
              style={{ height: cropSize, width: cropSize }}
            />
            <span
              className="avatar-crop-grid"
              aria-hidden="true"
              style={{ height: cropSize, width: cropSize }}
            />
            <span
              className="avatar-crop-frame"
              aria-hidden="true"
              style={{ height: cropSize, width: cropSize }}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
