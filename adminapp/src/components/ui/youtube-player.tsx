export function getYouTubeVideoId(embedCode: string): string | null {
  if (!embedCode) return null
  const srcMatch = embedCode.match(/(?:embed\/|v=|v\/|vi\/|youtu\.be\/|\/v\/)([^"&?/\s]{11})/)
  if (srcMatch && srcMatch[1]) {
    return srcMatch[1]
  }
  return null
}

export function formatYouTubeIframe(embedCode: string): string {
  if (!embedCode) return ""
  let html = embedCode
  html = html.replace(/width=["'][^"']*["']/gi, 'width="100%"')
  html = html.replace(/height=["'][^"']*["']/gi, 'height="100%"')

  if (!html.includes("style=")) {
    html = html.replace(/<iframe/gi, '<iframe style="width:100%;height:100%;border:none;display:block;"')
  } else {
    html = html.replace(/style=["']([^"']*)["']/gi, 'style="$1;width:100%;height:100%;border:none;display:block;"')
  }
  return html
}

interface YouTubePlayerProps {
  embedCode: string
  title?: string
  autoplay?: boolean
  className?: string
}

export function YouTubePlayer({ embedCode, title, autoplay = false, className = "" }: YouTubePlayerProps) {
  const videoId = getYouTubeVideoId(embedCode)
  const formattedHtml = formatYouTubeIframe(embedCode)

  return (
    <div
      className={`relative aspect-video w-full overflow-hidden rounded-xl bg-slate-950 border border-slate-800 shadow-2xl ${className}`}
    >
      {videoId ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1${autoplay ? "&autoplay=1" : ""}`}
          title={title || "YouTube video player"}
          className="absolute inset-0 h-full w-full border-0 shadow-inner"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      ) : (
        <div
          className="absolute inset-0 h-full w-full [&>iframe]:h-full [&>iframe]:w-full [&>iframe]:border-0"
          dangerouslySetInnerHTML={{ __html: formattedHtml }}
        />
      )}
    </div>
  )
}
