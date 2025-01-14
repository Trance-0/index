'use client'

export default function Footer() {
  return (
    <footer className="bg-gray-800 text-white py-6 mt-auto">
      <div className="container mx-auto px-4">
        <p className="text-center text-sm">
          Powered by <a href="https://nextjs.org" target="_blank" rel="noopener noreferrer" className="font-semibold hover:text-gray-300">NextJS</a> and <a href="https://cloudflare.com" target="_blank" rel="noopener noreferrer" className="font-semibold hover:text-gray-300">Cloudflare</a>
        </p>
      </div>
    </footer>
  )
}