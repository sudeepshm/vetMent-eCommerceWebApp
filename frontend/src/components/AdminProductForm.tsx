"use client"

import { useState } from "react"
import { Loader2, UploadCloud, X } from "lucide-react"
import Image from "next/image"
import { adminCreateProduct, adminUpdateProduct } from "@/lib/api"
import type { Product } from "@/types"
import toast from "react-hot-toast"

interface AdminProductFormProps {
  initialData?: Product | null
  onSuccess: () => void
  onCancel: () => void
}

export default function AdminProductForm({ initialData, onSuccess, onCancel }: AdminProductFormProps) {
  const [loading, setLoading] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(initialData?.image ?? null)

  const isEditing = !!initialData

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    try {
      const formData = new FormData(e.currentTarget)
      
      // We handle sizes and colors formatting before submission in a real app,
      // but the backend controller `product.controller.js` parses strings gracefully:
      // sizes: sizes?.split(",").map((s) => s.trim())
      // colors: typeof colors === "string" ? JSON.parse(colors) : colors
      // We will ensure colors is a valid JSON string, or just empty array if blank.
      const colorsRaw = formData.get("colors") as string
      if (colorsRaw) {
        try {
          JSON.parse(colorsRaw)
        } catch {
          toast.error("Colors must be valid JSON format. E.g: [{\"name\":\"Black\", \"hex\":\"#000000\"}]")
          setLoading(false)
          return
        }
      } else {
        formData.set("colors", "[]")
      }

      if (imageFile) {
        formData.append("image", imageFile)
      } else if (!isEditing) {
        toast.error("Product image is required")
        setLoading(false)
        return
      }

      if (isEditing) {
        await adminUpdateProduct(initialData._id, formData)
        toast.success("Product updated successfully")
      } else {
        await adminCreateProduct(formData)
        toast.success("Product created successfully")
      }
      
      onSuccess()
    } catch (err: any) {
      toast.error(err.message || "Failed to save product")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white p-6 shadow-xl border border-neutral-200 w-full max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-serif text-2xl font-medium text-black">
          {isEditing ? "Edit Product" : "Add New Product"}
        </h2>
        <button onClick={onCancel} className="text-neutral-500 hover:text-black">
          <X className="h-5 w-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-2 gap-5">
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-xs uppercase tracking-wider text-neutral-500 mb-1">Name</label>
            <input 
              name="name" 
              defaultValue={initialData?.name} 
              required 
              className="w-full border border-neutral-300 p-2.5 text-sm outline-none focus:border-black" 
            />
          </div>
          
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-xs uppercase tracking-wider text-neutral-500 mb-1">Category</label>
            <select 
              name="category" 
              defaultValue={initialData?.category ?? "women"} 
              className="w-full border border-neutral-300 p-2.5 text-sm outline-none focus:border-black bg-white"
            >
              <option value="women">Women</option>
              <option value="men">Men</option>
              <option value="accessories">Accessories</option>
              <option value="new">New Arrivals</option>
            </select>
          </div>

          <div className="col-span-2 sm:col-span-1">
            <label className="block text-xs uppercase tracking-wider text-neutral-500 mb-1">Price ($)</label>
            <input 
              name="price" 
              type="number" 
              step="0.01" 
              defaultValue={initialData?.price} 
              required 
              className="w-full border border-neutral-300 p-2.5 text-sm outline-none focus:border-black" 
            />
          </div>

          <div className="col-span-2 sm:col-span-1">
            <label className="block text-xs uppercase tracking-wider text-neutral-500 mb-1">Original Price ($)</label>
            <input 
              name="originalPrice" 
              type="number" 
              step="0.01" 
              defaultValue={initialData?.originalPrice} 
              placeholder="Optional (for discounts)"
              className="w-full border border-neutral-300 p-2.5 text-sm outline-none focus:border-black" 
            />
          </div>

          <div className="col-span-2">
            <label className="block text-xs uppercase tracking-wider text-neutral-500 mb-1">Description</label>
            <textarea 
              name="description" 
              defaultValue={initialData?.description} 
              required 
              rows={3}
              className="w-full border border-neutral-300 p-2.5 text-sm outline-none focus:border-black" 
            />
          </div>

          <div className="col-span-2 sm:col-span-1">
            <label className="block text-xs uppercase tracking-wider text-neutral-500 mb-1">Stock</label>
            <input 
              name="stock" 
              type="number" 
              defaultValue={initialData?.stock ?? 50} 
              required 
              className="w-full border border-neutral-300 p-2.5 text-sm outline-none focus:border-black" 
            />
          </div>

          <div className="col-span-2 sm:col-span-1">
            <label className="block text-xs uppercase tracking-wider text-neutral-500 mb-1">Sizes (comma-separated)</label>
            <input 
              name="sizes" 
              defaultValue={initialData?.sizes?.join(", ")} 
              placeholder="S, M, L, XL"
              className="w-full border border-neutral-300 p-2.5 text-sm outline-none focus:border-black" 
            />
          </div>

          <div className="col-span-2 sm:col-span-1">
            <label className="block text-xs uppercase tracking-wider text-neutral-500 mb-1">Tags (comma-separated)</label>
            <input 
              name="tags" 
              defaultValue={initialData?.tags?.join(", ")} 
              placeholder="summer, casual, cotton"
              className="w-full border border-neutral-300 p-2.5 text-sm outline-none focus:border-black" 
            />
          </div>

          <div className="col-span-2 sm:col-span-1">
            <label className="block text-xs uppercase tracking-wider text-neutral-500 mb-1">Colors (JSON)</label>
            <input 
              name="colors" 
              defaultValue={initialData?.colors ? JSON.stringify(initialData.colors) : "[]"} 
              placeholder='[{"name":"Black","hex":"#000"}]'
              className="w-full border border-neutral-300 p-2.5 text-sm outline-none focus:border-black font-mono text-xs" 
            />
          </div>

          {/* Image Upload */}
          <div className="col-span-2">
            <label className="block text-xs uppercase tracking-wider text-neutral-500 mb-2">Product Image</label>
            <div className="flex items-center gap-4">
              <div className="relative h-24 w-20 bg-neutral-100 flex-shrink-0 flex items-center justify-center overflow-hidden border border-neutral-200">
                {imagePreview ? (
                  <Image src={imagePreview} alt="Preview" fill className="object-cover" />
                ) : (
                  <UploadCloud className="h-6 w-6 text-neutral-300" />
                )}
              </div>
              <div className="flex-1">
                <input 
                  type="file" 
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageChange}
                  className="w-full text-sm text-neutral-500 file:mr-4 file:border-0 file:bg-neutral-100 file:px-4 file:py-2 file:text-xs file:uppercase file:tracking-wider hover:file:bg-neutral-200 transition file:cursor-pointer" 
                />
                <p className="mt-2 text-xs text-neutral-400">Recommended: 3:4 aspect ratio. Max 15MB.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4 flex gap-3">
          <button 
            type="button" 
            onClick={onCancel}
            className="flex-1 py-3 text-sm uppercase tracking-wider border border-neutral-300 hover:bg-neutral-50 transition"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={loading}
            className="flex-1 py-3 bg-black text-white text-sm uppercase tracking-wider hover:bg-neutral-800 transition flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEditing ? "Save Changes" : "Create Product"}
          </button>
        </div>
      </form>
    </div>
  )
}
