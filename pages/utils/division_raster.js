'use client'

import {useSearchParams} from 'next/navigation'
import Head from 'next/head';
import Navbar from '../navbar';
import Footer from '../footer';
import { useRef, useEffect } from 'react'

// Based on 'JPEG Raster' by Jonathan Puckey:
// http://www.flickr.com/photos/puckey/3179779686/in/photostream/

export default function DivisionRasterPage() {
  const searchParams = useSearchParams()
  const imageUrl = searchParams.get('url') || 'https://blob.trance-0.com/113776452_p0.jpg'
  const canvasRef = useRef(null)

  useEffect(() => {
    if (!canvasRef.current) return

    const script = document.createElement('script')
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/paper.js/0.12.18/paper-full.js'
    script.onload = () => {
      const paperScript = document.createElement('script')
      paperScript.type = 'text/paperscript'
      paperScript.setAttribute('canvas', 'canvas')
      paperScript.textContent = `
        // Based on 'JPEG Raster' by Jonathan Puckey:
        // http://www.flickr.com/photos/puckey/3179779686/in/photostream/

        // Create a raster item:
        var raster = new Raster({
            source: '${imageUrl}',
            crossOrigin: 'anonymous'
        });
        var loaded = false;

        raster.on('load', function () {
            loaded = true;
            onResize();
        });

        // Make the raster invisible:
        raster.visible = false;

        var lastPos = view.center;
        function moveHandler(event) {
            if (!loaded)
                return;
            if (lastPos.getDistance(event.point) < 10)
                return;
            lastPos = event.point;

            var size = this.bounds.size.clone();
            var isLandscape = size.width > size.height;

            // If the path is in landscape orientation, we're going to
            // split the path horizontally, otherwise vertically:

            size /= isLandscape ? [2, 1] : [1, 2];

            var path = new Path.Rectangle({
                point: this.bounds.topLeft.floor(),
                size: size.ceil(),
                onMouseMove: moveHandler
            });
            path.fillColor = raster.getAverageColor(path);

            var path = new Path.Rectangle({
                point: isLandscape
                    ? this.bounds.topCenter.ceil()
                    : this.bounds.leftCenter.ceil(),
                size: size.floor(),
                onMouseMove: moveHandler
            });
            path.fillColor = raster.getAverageColor(path);

            this.remove();
        }

        function onResize(event) {
            if (!loaded)
                return;
            project.activeLayer.removeChildren();

            // Transform the raster so that it fills the bounding rectangle
            // of the view:
            raster.fitBounds(view.bounds, true);

            // Create a path that fills the view, and fill it with
            // the average color of the raster:
            new Path.Rectangle({
                rectangle: view.bounds,
                fillColor: raster.getAverageColor(view.bounds),
                onMouseMove: moveHandler
            });
        }
      `
      document.body.appendChild(paperScript)
    }
    document.body.appendChild(script)

    return () => {
      document.body.removeChild(script)
    }
  }, [imageUrl])

  return (
    <>
      <Head>
        <title>Division Raster</title>
      </Head>
      <Navbar />
      <div className="flex flex-col items-center justify-center h-screen" style={{ height: `calc(100vh - 130px)` }}>
        <canvas ref={canvasRef} id="canvas" className="w-full" style={{ height: `calc(100vh - 130px)` }}></canvas>
      </div>
      <Footer />
    </>
  )
}