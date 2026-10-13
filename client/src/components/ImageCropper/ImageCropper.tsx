import { ZoomIn, ZoomOut } from "lucide-react";
import { useRef, useState } from "react";
import "./ImageCropper.css";

// Cadrage choisi dans le cadre : position horizontale et verticale de 0 (bord
// gauche / haut de l'image) à 1 (bord droit / bas), et zoom à partir de 1
// (image entière qui couvre juste le cadre).
export type Crop = { x: number; y: number; zoom: number };

export const DEFAULT_CROP: Crop = { x: 0.5, y: 0.5, zoom: 1 };

// Même proportion que l'image des cartes (16rem × 12rem, CardEvents.css).
const RATIO_W = 4;
const RATIO_H = 3;
const MAX_ZOOM = 3;
const OUTPUT_WIDTH = 1200;
const OUTPUT_HEIGHT = (OUTPUT_WIDTH * RATIO_H) / RATIO_W;

const clamp = (value: number) => Math.min(1, Math.max(0, value));

// Partie de l'image visible dans le cadre, en pixels de l'image d'origine.
const cropArea = (width: number, height: number, crop: Crop) => {
  const scale = Math.max(RATIO_W / width, RATIO_H / height) * crop.zoom;
  const cropWidth = RATIO_W / scale;
  const cropHeight = RATIO_H / scale;

  return {
    sx: (width - cropWidth) * crop.x,
    sy: (height - cropHeight) * crop.y,
    sw: cropWidth,
    sh: cropHeight,
  };
};

// Découpe l'image au cadrage choisi : c'est ce fichier qui est envoyé au
// serveur, les cartes l'affichent donc telles quelles, sans déformation.
export async function cropImage(
  src: string,
  crop: Crop,
  fileName: string,
): Promise<File> {
  const image = new Image();
  image.src = src;
  await image.decode();

  const { sx, sy, sw, sh } = cropArea(
    image.naturalWidth,
    image.naturalHeight,
    crop,
  );

  const canvas = document.createElement("canvas");
  canvas.width = OUTPUT_WIDTH;
  canvas.height = OUTPUT_HEIGHT;
  canvas
    .getContext("2d")
    ?.drawImage(image, sx, sy, sw, sh, 0, 0, OUTPUT_WIDTH, OUTPUT_HEIGHT);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.9),
  );
  if (!blob) throw new Error("Découpe de l'image impossible");

  return new File([blob], `${fileName.replace(/\.[^.]+$/, "")}.jpg`, {
    type: "image/jpeg",
  });
}

type ImageCropperProps = {
  src: string;
  crop: Crop;
  onCropChange: (crop: Crop) => void;
};

// Cadre aux proportions des cartes : on glisse l'image pour choisir la partie
// affichée et on zoome avec le curseur, comme une photo de profil.
function ImageCropper({ src, crop, onCropChange }: ImageCropperProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ x: number; y: number; crop: Crop } | null>(null);
  const [size, setSize] = useState<{ width: number; height: number } | null>(
    null,
  );

  // Taille de l'image en % du cadre, et marge de déplacement qui en découle.
  const scale = size
    ? Math.max(RATIO_W / size.width, RATIO_H / size.height) * crop.zoom
    : 1;
  const widthPct = size ? ((size.width * scale) / RATIO_W) * 100 : 100;
  const heightPct = size ? ((size.height * scale) / RATIO_H) * 100 : 100;

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { x: e.clientX, y: e.clientY, crop };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    const frame = frameRef.current;
    if (!drag || !frame) return;

    // Débord de l'image hors du cadre, en pixels à l'écran.
    const overflowX = (frame.clientWidth * (widthPct - 100)) / 100;
    const overflowY = (frame.clientHeight * (heightPct - 100)) / 100;

    onCropChange({
      ...drag.crop,
      x: overflowX
        ? clamp(drag.crop.x - (e.clientX - drag.x) / overflowX)
        : drag.crop.x,
      y: overflowY
        ? clamp(drag.crop.y - (e.clientY - drag.y) / overflowY)
        : drag.crop.y,
    });
  };

  const handlePointerUp = () => {
    dragRef.current = null;
  };

  return (
    <div className="ImageCropper">
      <div
        ref={frameRef}
        className="ImageCropper-Frame"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <img
          src={src}
          alt="Cadrage de l'image"
          draggable={false}
          onLoad={(e) =>
            setSize({
              width: e.currentTarget.naturalWidth,
              height: e.currentTarget.naturalHeight,
            })
          }
          style={{
            width: `${widthPct}%`,
            height: `${heightPct}%`,
            left: `${-(widthPct - 100) * crop.x}%`,
            top: `${-(heightPct - 100) * crop.y}%`,
          }}
        />
      </div>
      <label className="ImageCropper-Zoom">
        <ZoomOut size={16} aria-hidden="true" />
        <input
          type="range"
          min={1}
          max={MAX_ZOOM}
          step={0.01}
          value={crop.zoom}
          aria-label="Zoom"
          onChange={(e) =>
            onCropChange({ ...crop, zoom: Number(e.target.value) })
          }
        />
        <ZoomIn size={16} aria-hidden="true" />
      </label>
      <p className="ImageCropper-Hint">Glissez l'image pour la recadrer</p>
    </div>
  );
}

export default ImageCropper;
