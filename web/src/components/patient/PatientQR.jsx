import { useState } from "react"
import QRCode from "react-qr-code"
import { Download, Copy, Share2, Check } from "lucide-react"
import { useAuthStore } from "../../stores/authStore"

const PatientQR = () => {
  const { user } = useAuthStore() // Get logged-in user
  const [copied, setCopied] = useState(false)

  const qrValue = user?.email || "patient@email.com"

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(qrValue)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      alert("Failed to copy")
    }
  }

  const downloadQR = () => {
    const svg = document.getElementById("qr-code")
    const serializer = new XMLSerializer()
    const svgStr = serializer.serializeToString(svg)

    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    const img = new Image()

    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)
      const pngUrl = canvas.toDataURL("image/png")

      const link = document.createElement("a")
      link.href = pngUrl
      link.download = "medipass-qr.png"
      link.click()
    }

    img.src =
      "data:image/svg+xml;base64," +
      window.btoa(unescape(encodeURIComponent(svgStr)))
  }

  if (!user) {
    return <p className="text-center py-10">Please log in to view your QR code.</p>
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="card p-10 text-center shadow-2xl rounded-3xl">

        {/* QR */}
        <div className="w-60 h-60 mx-auto mb-6 bg-white rounded-2xl shadow-lg flex items-center justify-center">
          <QRCode
            id="qr-code"
            value={qrValue}
            size={200}
            bgColor="#ffffff"
            fgColor="#2563eb"
            level="H"
          />
        </div>

        <h2 className="text-2xl font-bold text-neutral-900 mb-2">
          Your MediPass QR
        </h2>
        <p className="text-neutral-600 mb-6">
          Show this QR code to healthcare providers
        </p>

        {/* Code + Copy */}
        <div className="flex items-center justify-center gap-3 bg-neutral-50 p-4 rounded-xl mb-6">
          <span className="font-mono text-primary-600 bg-primary-100 px-3 py-1 rounded-lg truncate max-w-[220px]">
            {qrValue}
          </span>
          <button
            onClick={handleCopy}
            className="p-2 hover:bg-neutral-200 rounded-lg transition"
          >
            {copied ? (
              <Check className="w-5 h-5 text-green-600" />
            ) : (
              <Copy className="w-5 h-5 text-neutral-600" />
            )}
          </button>
        </div>

        {/* Buttons */}
        <div className="grid grid-cols-2 gap-4 mb-6">
  <button
    onClick={downloadQR}
    className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-white font-medium shadow-md hover:bg-blue-700 active:scale-95 transition"
  >
    <Download className="w-5 h-5" />
    Download
  </button>

  <button
    className="flex items-center justify-center gap-2 rounded-xl border border-blue-600 px-4 py-3 text-blue-600 font-medium shadow-sm hover:bg-blue-50 active:scale-95 transition"
  >
    <Share2 className="w-5 h-5" />
    Share
  </button>
</div>


      </div>
    </div>
  )
}

export default PatientQR
