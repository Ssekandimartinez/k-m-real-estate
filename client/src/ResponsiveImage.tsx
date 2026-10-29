import type { ImgHTMLAttributes } from "react";
import variants from "./generated/image-variants.json";

const library = variants as unknown as Record<string, [number, number, string]>;

export function responsiveImage(src?: string) {
  if (!src) return {};
  const image = library[src];
  if (image)
    return {
      srcSet: [
        ...[320, 480, 960]
          .filter((size) => size < image[0])
          .map((size) => `/media/responsive/${image[2]}-${size}.webp ${size}w`),
        `${src} ${image[0]}w`,
      ].join(", "),
      width: image[0],
      height: image[1],
    };
  // Keep uploaded media on its existing provider and let it deliver smaller files.
  if (/^https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\//.test(src)) {
    const transform = (width: number) =>
      src.replace(
        "/image/upload/",
        `/image/upload/f_auto,q_auto,c_limit,w_${width}/`,
      );
    return {
      srcSet: [96, 320, 480, 960, 1600]
        .map((width) => `${transform(width)} ${width}w`)
        .join(", "),
    };
  }
  return {};
}

export default function ResponsiveImage({
  src,
  alt,
  sizes = "(max-width: 700px) 100vw, 50vw",
  width,
  height,
  srcSet,
  decoding = "async",
  ...props
}: ImgHTMLAttributes<HTMLImageElement>) {
  const responsive = responsiveImage(src);
  return (
    <img
      {...props}
      src={src}
      alt={alt}
      srcSet={srcSet ?? responsive.srcSet}
      sizes={srcSet || responsive.srcSet ? sizes : undefined}
      width={width ?? responsive.width}
      height={height ?? responsive.height}
      decoding={decoding}
    />
  );
}
