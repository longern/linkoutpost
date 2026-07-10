import { FaImage } from "react-icons/fa6";
import { isVideoMediaUrl } from "./linkDisplay";

export function MediaCardPreview({
  mediaUrl,
  variant = "upload",
}: {
  mediaUrl?: string | null;
  variant?: "thumbnail" | "upload";
}) {
  return (
    <span className={`image-card-preview is-${variant}`}>
      {mediaUrl && isVideoMediaUrl(mediaUrl) ? (
        <video
          autoPlay={variant === "thumbnail"}
          controls={variant === "upload"}
          loop={variant === "thumbnail"}
          muted
          playsInline
          src={mediaUrl}
        />
      ) : mediaUrl ? (
        <img alt="" src={mediaUrl} />
      ) : (
        <span className="media-upload-placeholder">
          <FaImage aria-hidden="true" size={18} />
        </span>
      )}
    </span>
  );
}
