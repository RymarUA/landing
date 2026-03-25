"use client";

import { useState } from "react";
import Image from "next/image";
import { X } from "lucide-react";

interface PhotoGalleryProps {
  images: string[];
  productName: string;
}

export function PhotoGallery({ images, productName }: PhotoGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const openImage = (img: string) => {
    setSelectedImage(img);
  };

  const closeImage = () => {
    setSelectedImage(null);
  };

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map((img, idx) => (
          <div 
            key={idx} 
            className="relative aspect-square w-full rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300 cursor-pointer"
            onClick={() => openImage(img)}
          >
            <Image 
              src={img} 
              alt={`${productName} - фото ${idx + 1}`} 
              fill 
              sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover hover:scale-105 transition-transform duration-500" 
              priority={idx < 2}
            />
          </div>
        ))}
      </div>

      {/* Модальное окно */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={closeImage}
        >
          <div className="relative max-w-4xl max-h-full">
            <button
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
              onClick={closeImage}
            >
              <X size={32} />
            </button>
            <Image
              src={selectedImage}
              alt={`${productName} - полное изображение`}
              width={1200}
              height={800}
              className="max-w-full max-h-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </>
  );
}
