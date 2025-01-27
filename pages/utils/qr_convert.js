'use client'

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import jsQR from 'jsqr';
import Head from 'next/head';
import Navbar from '../navbar';
import Footer from '../footer';

export default function QRConvert() {
  const [text, setText] = useState('');
  const [scannedText, setScannedText] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [error, setError] = useState('');

  const MAX_QR_LENGTH = 2953; // Maximum characters for QR code version 40

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          if (code) {
            setScannedText(code.data);
          } else {
            alert('No QR code found in image');
          }
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveImage = () => {
    const svg = document.getElementById('qr-code');
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = 'qr-code[' + text + '].png';
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  const handleCopyImage = async () => {
    const svg = document.getElementById('qr-code');
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = async () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      try {
        const blob = await new Promise(resolve => canvas.toBlob(resolve));
        await navigator.clipboard.write([
          new ClipboardItem({
            'image/png': blob
          })
        ]);
        alert('QR code image copied to clipboard!');
      } catch (err) {
        console.error('Failed to copy image: ', err);
        alert('Failed to copy image to clipboard');
      }
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  const handleCopyScannedText = async () => {
    try {
      await navigator.clipboard.writeText(scannedText);
      alert('Text copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy text: ', err);
      alert('Failed to copy text to clipboard');
    }
  };

  const handleTextChange = (e) => {
    const newText = e.target.value;
    if (newText.length > MAX_QR_LENGTH) {
      setError(`Text is too long. Maximum length is ${MAX_QR_LENGTH} characters.`);
    } else {
      setError('');
    }
    setText(newText);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Head>
        <title>QR Code Tool</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Navbar />
      <main className="flex-grow">
        <div className="container mx-auto px-4 py-8">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Generate QR Code */}
            <div className="bg-secondary p-6 rounded-lg shadow-lg">
              <h2 className="text-xl font-semibold mb-4">Generate QR Code</h2>
              <div className="space-y-4">
                <textarea
                  className={`w-full p-2 border rounded-md ${error ? 'border-red-500' : ''}`}
                  rows="4"
                  placeholder="Enter text to generate QR code"
                  value={text}
                  onChange={handleTextChange}
                />
                {error && (
                  <div className="text-red-500 text-sm">{error}</div>
                )}
                {text && !error && (
                  <>
                    <div className="flex justify-center p-4 bg-secondary rounded-md">
                      <QRCodeSVG value={text} size={200} id="qr-code" />
                    </div>
                    <div className="flex justify-center space-x-4">
                      <button
                        onClick={handleSaveImage}
                        className="button-info text-white px-4 py-2 rounded hover:bg-blue-600"
                      >
                        Save Image
                      </button>
                      <button
                        onClick={handleCopyImage}
                        className="button-success text-white px-4 py-2 rounded hover:bg-green-600"
                      >
                        Copy Image
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Upload QR Code Image */}
            <div className="bg-secondary p-6 rounded-lg shadow-lg">
              <h2 className="text-xl font-semibold mb-4">Upload QR Code Image</h2>
              <div className="space-y-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="block w-full text-sm text-secondary
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-500 file:text-white
                  hover:file:bg-blue-600"
                />

                {scannedText && (
                  <div className="mt-4">
                    <h3 className="font-medium mb-2">Scanned Content:</h3>
                    <div className="p-4 bg-secondary rounded-md break-words overflow-y-auto max-h-48">
                      {scannedText}
                    </div>
                    <button
                      onClick={handleCopyScannedText}
                      className="mt-2 button-success text-white px-4 py-2 rounded hover:bg-green-600"
                    >
                      Copy Text
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
