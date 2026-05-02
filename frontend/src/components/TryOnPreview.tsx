import Image from "next/image"

type TryOnPreviewProps = {
  imageUrl: string | null
  loading?: boolean
}

export default function TryOnPreview({
  imageUrl,
  loading = false,
}: TryOnPreviewProps) {
  return (
    <div className="w-full border border-neutral-200 bg-white p-4 md:p-6">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-sm uppercase tracking-[0.2em] text-black">
          Try-On Preview
        </h2>
      </div>

      <div className="relative flex aspect-[4/5] w-full items-center justify-center overflow-hidden border border-neutral-200 bg-neutral-50">
        {loading ? (
          <div className="flex flex-col items-center justify-center text-center">
            <span className="h-8 w-8 animate-spin rounded-full border-2 border-black border-t-transparent" />
            <p className="mt-4 text-sm uppercase tracking-[0.15em] text-neutral-500">
              Generating Preview
            </p>
          </div>
        ) : imageUrl ? (
          <div className="relative h-full w-full animate-fade-in">
            <Image
              src={imageUrl}
              alt="AI Try-On Result"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-contain transition-opacity duration-500"
            />
          </div>
        ) : (
          <div className="flex h-full w-full items-center justify-center px-6 text-center">
            <p className="max-w-xs text-sm uppercase tracking-[0.15em] text-neutral-400">
              Your try-on result will appear here
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
