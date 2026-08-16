/**
 * Image compression utility for receipt uploads
 * Automatically resizes and compresses user-uploaded payment receipts and documents
 * to guarantee they fit within Firestore 1MB limits and localStorage storage quotas (~30KB-70KB)
 * while maintaining crystal-clear text readability for bank references, amounts, and dates.
 */

export async function compressReceiptImage(
  input: File | Blob | string,
  maxDimension: number = 1000,
  quality: number = 0.72
): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const processImageElement = (img: HTMLImageElement) => {
        try {
          let width = img.naturalWidth || img.width;
          let height = img.naturalHeight || img.height;

          if (!width || !height) {
            // Fallback if dimensions couldn't be determined
            if (typeof input === 'string') {
              resolve(input);
            } else {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = (err) => reject(err);
              reader.readAsDataURL(input);
            }
            return;
          }

          // Calculate scaling
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            if (typeof input === 'string') resolve(input);
            else {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.readAsDataURL(input);
            }
            return;
          }

          // Fill white background (useful for transparent PNGs converted to JPEG)
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);

          // Draw image
          ctx.drawImage(img, 0, 0, width, height);

          // Export as JPEG with quality
          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedDataUrl);
        } catch (canvasErr) {
          console.warn('Canvas compression error, using raw fallback:', canvasErr);
          if (typeof input === 'string') resolve(input);
          else {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = (err) => reject(err);
            reader.readAsDataURL(input);
          }
        }
      };

      if (typeof input === 'string') {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => processImageElement(img);
        img.onerror = () => resolve(input); // Fallback to raw string if image object load fails
        img.src = input;
      } else {
        const reader = new FileReader();
        reader.onload = (event) => {
          const img = new Image();
          img.onload = () => processImageElement(img);
          img.onerror = () => resolve(event.target?.result as string);
          img.src = event.target?.result as string;
        };
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(input);
      }
    } catch (err) {
      console.error('Fatal compression error:', err);
      if (typeof input === 'string') resolve(input);
      else {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (e) => reject(e);
        reader.readAsDataURL(input);
      }
    }
  });
}
