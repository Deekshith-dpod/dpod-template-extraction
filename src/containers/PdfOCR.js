import { createWorker } from "tesseract.js";

export const initTesseractWorker = async () => {
    let tesseractWorker = null;
    if (!tesseractWorker) {
        tesseractWorker = createWorker({
            workerPath: 'https://unpkg.com/tesseract.js@v2.1.5/dist/worker.min.js',
            langPath: 'https://tessdata.projectnaptha.com/4.0.0',
            corePath: 'https://unpkg.com/tesseract.js-core@2.1.0/tesseract-core.wasm.js',
        });

        await tesseractWorker.load();
        await tesseractWorker.loadLanguage('eng');
        await tesseractWorker.initialize('eng');
    }
    return tesseractWorker;
};

export const preprocessCanvas = (canvas) => {
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    const blockSize = 15;
    const C = 10;
    const width = canvas.width;
    const height = canvas.height;

    const grayData = new Uint8ClampedArray(width * height);
    for (let i = 0; i < data.length; i += 4) {
        grayData[i / 4] = 0.2989 * data[i] + 0.5870 * data[i + 1] + 0.1140 * data[i + 2];
    }

    const thresholdData = new Uint8ClampedArray(width * height);
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            let sum = 0;
            let count = 0;
            for (let dy = -blockSize; dy <= blockSize; dy++) {
                for (let dx = -blockSize; dx <= blockSize; dx++) {
                    const nx = x + dx;
                    const ny = y + dy;
                    if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                        sum += grayData[ny * width + nx];
                        count++;
                    }
                }
            }
            const mean = sum / count;
            const pixel = grayData[y * width + x];
            thresholdData[y * width + x] = pixel > mean - C ? 255 : 0;
        }
    }

    for (let i = 0; i < data.length; i += 4) {
        const gray = thresholdData[i / 4];
        data[i] = data[i + 1] = data[i + 2] = gray;
    }
    ctx.putImageData(imageData, 0, 0);
    return canvas;
};

export const performOCR = async (page, renderTaskRef, scale, viewport) => {
    let worker = null;
    try {
        const ocrScale = scale * 2;
        const ocrScaleFactor = scale / ocrScale;
        const ocrViewport = page.getViewport({ scale: ocrScale });
        const offscreenCanvas = document.createElement('canvas');
        offscreenCanvas.width = ocrViewport.width;
        offscreenCanvas.height = ocrViewport.height;
        const context = offscreenCanvas.getContext('2d');

        if (renderTaskRef.current) {
            renderTaskRef.current.cancel();
            renderTaskRef.current = null;
        }

        renderTaskRef.current = page.render({ canvasContext: context, viewport: ocrViewport });
        await renderTaskRef.current.promise;
        renderTaskRef.current = null;

        const processedCanvas = preprocessCanvas(offscreenCanvas);
        worker = await initTesseractWorker();
        await worker.setParameters({
            tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,/ ',
            preserve_interword_spaces: 1,
            tessedit_pageseg_mode: 6,
        });

        const { data } = await worker.recognize(processedCanvas);

        let textItems = [];
        if (data.words?.length > 0) {
            const mergedWords = [];
            let currentPhrase = null;

            data.words
                .filter(word => word.text?.trim() && word.confidence > 60)
                .sort((a, b) => {
                    const ay = a.bbox.y0;
                    const by = b.bbox.y0;
                    if (Math.abs(ay - by) > 5) return ay - by;
                    return a.bbox.x0 - b.bbox.x0;
                })
                .forEach((word, index, words) => {
                    const { x0, y0, x1, y1 } = word.bbox;
                    const scaledX = x0 * ocrScaleFactor;
                    const scaledY = y0 * ocrScaleFactor;
                    const scaledWidth = (x1 - x0) * ocrScaleFactor;
                    const scaledHeight = (y1 - y0) * ocrScaleFactor;

                    const isCloseToPrevious =
                        index > 0 &&
                        Math.abs(y0 - words[index - 1].bbox.y0) < 5 &&
                        Math.abs(x0 - words[index - 1].bbox.x1) < scaledWidth * 0.5;

                    if (isCloseToPrevious && currentPhrase) {
                        currentPhrase.text += ` ${word.text}`;
                        currentPhrase.bbox.x1 = x1;
                        currentPhrase.bbox.y1 = Math.max(currentPhrase.bbox.y1, y1);
                        currentPhrase.confidence = Math.min(currentPhrase.confidence, word.confidence);
                    } else {
                        if (currentPhrase) {
                            mergedWords.push(currentPhrase);
                        }
                        currentPhrase = {
                            text: word.text,
                            bbox: { x0, y0, x1, y1 },
                            confidence: word.confidence,
                        };
                    }
                });

            if (currentPhrase) {
                mergedWords.push(currentPhrase);
            }

            textItems = mergedWords.map(phrase => {
                const { x0, y0, x1, y1 } = phrase.bbox;
                const x = x0 * ocrScaleFactor;
                const y = y0 * ocrScaleFactor;
                const width = (x1 - x0) * ocrScaleFactor;
                const height = (y1 - y0) * ocrScaleFactor;
                return {
                    str: phrase.text,
                    x,
                    y,
                    width,
                    height,
                    fontName: 'unknown',
                    dir: 'ltr',
                    confidence: phrase.confidence,
                };
            });
        }
        return textItems;
    } catch (error) {
        console.error('OCR failed:', error);
        return [];
    } finally {
        if (worker) {
            await worker.terminate();
        }
    }
};
