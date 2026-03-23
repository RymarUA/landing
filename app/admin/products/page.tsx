"use client";

import { useState, useRef } from "react";
import { AdminGuard } from "@/components/admin-guard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { createSitniksProduct } from "@/lib/sitniks-products";
import { Plus, X, Upload, Image as ImageIcon } from "lucide-react";
import Image from "next/image";

interface ProductVariation {
  id: string;
  size?: string;
  color?: string;
  sku: string;
  barcode?: string;
  price: number;
  quantity: number;
  weight?: number;
}

interface ProductFormData {
  name: string;
  description: string;
  category: string;
  price: number;
  purchasePrice: number;
  weight: number;
  dimensions: {
    width: number;
    length: number;
    height: number;
  };
  sku: string;
  barcode?: string;
  images: string[];
  hasVariations: boolean;
  variations: ProductVariation[];
}

const COMMON_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "3XL"];
const COMMON_COLORS = ["Чорний", "Білий", "Сірий", "Червоний", "Синій", "Зелений", "Жовтий", "Рожевий"];

export default function AdminProductsPage() {
  return (
    <AdminGuard>
      <AdminProductsContent />
    </AdminGuard>
  );
}

function AdminProductsContent() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    description: "",
    category: "",
    price: 0,
    purchasePrice: 0,
    weight: 0,
    dimensions: {
      width: 0,
      length: 0,
      height: 0,
    },
    sku: "",
    barcode: "",
    images: [],
    hasVariations: false,
    variations: [],
  });

  const handleInputChange = (field: keyof ProductFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleDimensionChange = (dimension: keyof typeof formData.dimensions, value: number) => {
    setFormData(prev => ({
      ...prev,
      dimensions: {
        ...prev.dimensions,
        [dimension]: value,
      },
    }));
  };

  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploadingImage(true);
    setError(null);

    try {
      const file = files[0];
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('Будь ласка, оберіть файл зображення');
      }

      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('Розмір файлу не повинен перевищувати 10MB');
      }

      // Convert to base64 for preview and storage
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, base64],
        }));
        setUploadingImage(false);
      };
      reader.onerror = () => {
        setError('Помилка завантаження зображення');
        setUploadingImage(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Помилка завантаження зображення');
      setUploadingImage(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleImageUpload(e.dataTransfer.files);
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const addVariation = () => {
    const newVariation: ProductVariation = {
      id: Date.now().toString(),
      size: "",
      color: "",
      sku: `${formData.sku}-${formData.variations.length + 1}`,
      price: formData.price,
      quantity: 1,
      weight: formData.weight,
    };
    
    setFormData(prev => ({
      ...prev,
      variations: [...prev.variations, newVariation],
    }));
  };

  const updateVariation = (id: string, field: keyof ProductVariation, value: any) => {
    setFormData(prev => ({
      ...prev,
      variations: prev.variations.map(v => 
        v.id === id ? { ...v, [field]: value } : v
      ),
    }));
  };

  const removeVariation = (id: string) => {
    setFormData(prev => ({
      ...prev,
      variations: prev.variations.filter(v => v.id !== id),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Валідація
      if (!formData.name.trim()) {
        throw new Error("Назва товару обов'язкова");
      }
      if (!formData.category.trim()) {
        throw new Error("Категорія обов'язкова");
      }
      if (!formData.sku.trim()) {
        throw new Error("SKU обов'язковий");
      }
      if (formData.hasVariations && formData.variations.length === 0) {
        throw new Error("Додайте хоча б одну варіацію");
      }
      if (formData.hasVariations) {
        for (const variation of formData.variations) {
          if (!variation.size && !variation.color) {
            throw new Error("Кожна варіація повинна мати розмір або колір");
          }
          if (!variation.sku.trim()) {
            throw new Error("SKU варіації обов'язковий");
          }
          if (variation.price <= 0) {
            throw new Error("Ціна варіації повинна бути більше 0");
          }
        }
      } else {
        if (formData.price <= 0) {
          throw new Error("Ціна товару повинна бути більше 0");
        }
      }

      // Створення товару в Sitniks
      const productData = {
        title: formData.name,
        name: formData.name,
        description: formData.description,
        price: formData.price,
        costPrice: formData.purchasePrice,
        weight: formData.weight,
        sku: formData.sku,
        barcode: formData.barcode,
        isActive: true,
        category: formData.category,
        variations: formData.hasVariations ? formData.variations.map(v => ({
          sku: v.sku,
          barcode: v.barcode,
          price: v.price,
          costPrice: formData.purchasePrice,
          weight: v.weight || formData.weight,
          isActive: true,
          properties: [
            ...(v.size ? [{ name: "Розмір", value: v.size }] : []),
            ...(v.color ? [{ name: "Колір", value: v.color }] : []),
          ],
          warehouseQuantities: [{
            id: 1,
            quantity: v.quantity,
            stockQuantity: v.quantity,
            availableQuantity: v.quantity,
            reserveQuantity: 0,
            deliveryQuantity: 0,
            warehouse: { id: 1, name: "Основний склад" },
          }],
        })) : [{
          sku: formData.sku,
          barcode: formData.barcode,
          price: formData.price,
          costPrice: formData.purchasePrice,
          weight: formData.weight,
          isActive: true,
          warehouseQuantities: [{
            id: 1,
            quantity: 100, // Default quantity
            stockQuantity: 100,
            availableQuantity: 100,
            reserveQuantity: 0,
            deliveryQuantity: 0,
            warehouse: { id: 1, name: "Основний склад" },
          }],
        }],
        warehouseQuantities: [{
          id: 1,
          quantity: 100,
          stockQuantity: 100,
          availableQuantity: 100,
          reserveQuantity: 0,
          deliveryQuantity: 0,
          warehouse: { id: 1, name: "Основний склад" },
        }],
      };

      await createSitniksProduct(productData);
      setSuccess(true);
      
      // Скинути форму
      setFormData({
        name: "",
        description: "",
        category: "",
        price: 0,
        purchasePrice: 0,
        weight: 0,
        dimensions: { width: 0, length: 0, height: 0 },
        sku: "",
        barcode: "",
        images: [],
        hasVariations: false,
        variations: [],
      });
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#F6F4EF] p-6">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-[#0F2D2A] mb-2">Товар створено!</h2>
            <p className="text-[#7A8A84] mb-6">Товар успішно додано до Sitniks CRM</p>
            <Button 
              onClick={() => setSuccess(false)}
              className="bg-[#1F6B5E] hover:bg-[#0F2D2A]"
            >
              Створити ще один товар
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F4EF] p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-[#0F2D2A] mb-8">Створення товару</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Базова інформація */}
          <Card className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-[#0F2D2A] mb-6">Базова інформація</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Назва товару *" error={!formData.name ? "Обов'язково" : ""}>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-[#E7EFEA] focus:ring-2 focus:ring-[#C9B27C]/70 outline-none"
                  placeholder="Наприклад: Футболка класична"
                />
              </Field>
              
              <Field label="Категорія *" error={!formData.category ? "Обов'язково" : ""}>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => handleInputChange("category", e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-[#E7EFEA] focus:ring-2 focus:ring-[#C9B27C]/70 outline-none"
                  placeholder="Наприклад: Одяг"
                />
              </Field>
            </div>

            <Field label="Опис">
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-[#E7EFEA] focus:ring-2 focus:ring-[#C9B27C]/70 outline-none resize-none"
                placeholder="Детальний опис товару..."
              />
            </Field>
          </Card>

          {/* Ціни та SKU */}
          <Card className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-[#0F2D2A] mb-6">Ціни та ідентифікатори</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="SKU *" error={!formData.sku ? "Обов'язково" : ""}>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) => handleInputChange("sku", e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-[#E7EFEA] focus:ring-2 focus:ring-[#C9B27C]/70 outline-none"
                  placeholder="Наприклад: TSHIRT-001"
                />
              </Field>
              
              <Field label="Штрихкод">
                <input
                  type="text"
                  value={formData.barcode}
                  onChange={(e) => handleInputChange("barcode", e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-[#E7EFEA] focus:ring-2 focus:ring-[#C9B27C]/70 outline-none"
                  placeholder="4820000000000"
                />
              </Field>
              
              <Field label="Ціна продажу (грн) *">
                <input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => handleInputChange("price", parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-3 rounded-xl border border-[#E7EFEA] focus:ring-2 focus:ring-[#C9B27C]/70 outline-none"
                  placeholder="0.00"
                />
              </Field>
              
              <Field label="Ціна закупівлі (грн)">
                <input
                  type="number"
                  step="0.01"
                  value={formData.purchasePrice}
                  onChange={(e) => handleInputChange("purchasePrice", parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-3 rounded-xl border border-[#E7EFEA] focus:ring-2 focus:ring-[#C9B27C]/70 outline-none"
                  placeholder="0.00"
                />
              </Field>
            </div>
          </Card>

          {/* Фізичні характеристики */}
          <Card className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-[#0F2D2A] mb-6">Фізичні характеристики</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Вага (кг)">
                <input
                  type="number"
                  step="0.01"
                  value={formData.weight}
                  onChange={(e) => handleInputChange("weight", parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-3 rounded-xl border border-[#E7EFEA] focus:ring-2 focus:ring-[#C9B27C]/70 outline-none"
                  placeholder="0.5"
                />
              </Field>
              
              <div className="grid grid-cols-3 gap-2">
                <Field label="Ширина (см)">
                  <input
                    type="number"
                    step="0.1"
                    value={formData.dimensions.width}
                    onChange={(e) => handleDimensionChange("width", parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-3 rounded-xl border border-[#E7EFEA] focus:ring-2 focus:ring-[#C9B27C]/70 outline-none"
                    placeholder="30"
                  />
                </Field>
                
                <Field label="Довжина (см)">
                  <input
                    type="number"
                    step="0.1"
                    value={formData.dimensions.length}
                    onChange={(e) => handleDimensionChange("length", parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-3 rounded-xl border border-[#E7EFEA] focus:ring-2 focus:ring-[#C9B27C]/70 outline-none"
                    placeholder="70"
                  />
                </Field>
                
                <Field label="Висота (см)">
                  <input
                    type="number"
                    step="0.1"
                    value={formData.dimensions.height}
                    onChange={(e) => handleDimensionChange("height", parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-3 rounded-xl border border-[#E7EFEA] focus:ring-2 focus:ring-[#C9B27C]/70 outline-none"
                    placeholder="5"
                  />
                </Field>
              </div>
            </div>
          </Card>

          {/* Варіації товару */}
          <Card className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-[#0F2D2A">Варіації товару</h2>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.hasVariations}
                  onChange={(e) => handleInputChange("hasVariations", e.target.checked)}
                  className="w-5 h-5 text-[#1F6B5E] rounded focus:ring-[#C9B27C]/70"
                />
                <span className="text-sm font-medium text-[#24312E]">Увімкнути варіації</span>
              </label>
            </div>

            {formData.hasVariations && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-[#7A8A84]">
                    Додайте варіації для різних розмірів, кольорів та інших характеристик
                  </p>
                  <Button
                    type="button"
                    onClick={addVariation}
                    className="bg-[#1F6B5E] hover:bg-[#0F2D2A] text-white px-4 py-2 rounded-lg flex items-center gap-2"
                  >
                    <Plus size={16} />
                    Додати варіацію
                  </Button>
                </div>

                {formData.variations.map((variation) => (
                  <div key={variation.id} className="border border-[#E7EFEA] rounded-xl p-4 space-y-4">
                    <div className="flex justify-between items-start">
                      <h3 className="font-semibold text-[#0F2D2A]">Варіація #{formData.variations.indexOf(variation) + 1}</h3>
                      <Button
                        type="button"
                        onClick={() => removeVariation(variation.id)}
                        className="text-red-500 hover:bg-red-50 p-2 rounded-lg"
                      >
                        <X size={16} />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-[#24312E] mb-1">Розмір</label>
                        <div className="flex gap-2 mb-2">
                          {COMMON_SIZES.map(size => (
                            <button
                              key={size}
                              type="button"
                              onClick={() => updateVariation(variation.id, "size", size)}
                              className={`px-3 py-1 rounded-lg border text-sm transition-colors ${
                                variation.size === size
                                  ? "border-[#1F6B5E] bg-[#F6F4EF] text-[#1F6B5E]"
                                  : "border-[#E7EFEA] hover:border-[#C9B27C]/50"
                              }`}
                            >
                              {size}
                            </button>
                          ))}
                        </div>
                        <input
                          type="text"
                          value={variation.size || ""}
                          onChange={(e) => updateVariation(variation.id, "size", e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-[#E7EFEA] focus:ring-2 focus:ring-[#C9B27C]/70 outline-none"
                          placeholder="Або введіть свій розмір..."
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-[#24312E] mb-1">Колір</label>
                        <div className="flex gap-2 mb-2 flex-wrap">
                          {COMMON_COLORS.map(color => (
                            <button
                              key={color}
                              type="button"
                              onClick={() => updateVariation(variation.id, "color", color)}
                              className={`px-3 py-1 rounded-lg border text-sm transition-colors ${
                                variation.color === color
                                  ? "border-[#1F6B5E] bg-[#F6F4EF] text-[#1F6B5E]"
                                  : "border-[#E7EFEA] hover:border-[#C9B27C]/50"
                              }`}
                            >
                              {color}
                            </button>
                          ))}
                        </div>
                        <input
                          type="text"
                          value={variation.color || ""}
                          onChange={(e) => updateVariation(variation.id, "color", e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-[#E7EFEA] focus:ring-2 focus:ring-[#C9B27C]/70 outline-none"
                          placeholder="Або введіть свій колір..."
                        />
                      </div>

                      <Field label="SKU варіації *">
                        <input
                          type="text"
                          value={variation.sku}
                          onChange={(e) => updateVariation(variation.id, "sku", e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-[#E7EFEA] focus:ring-2 focus:ring-[#C9B27C]/70 outline-none"
                          placeholder="Наприклад: TSHIRT-001-S"
                        />
                      </Field>

                      <Field label="Штрихкод">
                        <input
                          type="text"
                          value={variation.barcode || ""}
                          onChange={(e) => updateVariation(variation.id, "barcode", e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-[#E7EFEA] focus:ring-2 focus:ring-[#C9B27C]/70 outline-none"
                          placeholder="4820000000000"
                        />
                      </Field>

                      <Field label="Ціна (грн) *">
                        <input
                          type="number"
                          step="0.01"
                          value={variation.price}
                          onChange={(e) => updateVariation(variation.id, "price", parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 rounded-lg border border-[#E7EFEA] focus:ring-2 focus:ring-[#C9B27C]/70 outline-none"
                          placeholder="0.00"
                        />
                      </Field>

                      <Field label="Кількість">
                        <input
                          type="number"
                          value={variation.quantity}
                          onChange={(e) => updateVariation(variation.id, "quantity", parseInt(e.target.value) || 0)}
                          className="w-full px-3 py-2 rounded-lg border border-[#E7EFEA] focus:ring-2 focus:ring-[#C9B27C]/70 outline-none"
                          placeholder="0"
                        />
                      </Field>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Зображення */}
          <Card className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-[#0F2D2A] mb-6">Зображення товару</h2>
            
            {/* Upload Area */}
            <div 
              className="border-2 border-dashed border-[#E7EFEA] rounded-xl p-8 text-center hover:border-[#7A8A84] transition-colors cursor-pointer"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleImageUpload(e.target.files)}
              />
              <ImageIcon size={48} className="mx-auto text-[#7A8A84] mb-4" />
              <p className="text-[#7A8A84] mb-4">Перетягніть зображення сюди або натисніть для вибору</p>
              <Button 
                type="button" 
                variant="outline" 
                className="border-[#E7EFEA] text-[#24312E] hover:bg-[#F6F4EF]"
                disabled={uploadingImage}
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
              >
                <Upload size={16} className="mr-2" />
                {uploadingImage ? 'Завантаження...' : 'Обрати зображення'}
              </Button>
              <p className="text-xs text-[#7A8A84] mt-2">PNG, JPG до 10MB</p>
            </div>

            {/* Image Preview */}
            {formData.images.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-[#0F2D2A] mb-3">Завантажені зображення:</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {formData.images.map((image, index) => (
                    <div key={index} className="relative group">
                      <div className="aspect-square rounded-lg overflow-hidden border-2 border-[#E7EFEA]">
                        <Image
                          src={image}
                          alt={`Product ${index + 1}`}
                          width={200}
                          height={200}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={16} />
                      </button>
                      {index === 0 && (
                        <span className="absolute bottom-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded">Головне</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* Помилки та кнопка відправки */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
              ⚠️ {error}
            </div>
          )}

          <div className="flex gap-4">
            <Button
              type="submit"
              disabled={loading}
              className="bg-[#1F6B5E] hover:bg-[#0F2D2A] text-white px-6 py-3 rounded-xl flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Створення...
                </>
              ) : (
                "Створити товар"
              )}
            </Button>
            
            <Button
              type="button"
              variant="outline"
              className="border-[#E7EFEA] text-[#24312E] hover:bg-[#F6F4EF]"
              onClick={() => window.history.back()}
            >
              Скасувати
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
