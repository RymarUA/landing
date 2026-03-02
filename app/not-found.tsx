import Link from "next/link";
import { PackageSearch } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-16">
      <div className="max-w-md w-full text-center">
        <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <PackageSearch size={48} className="text-orange-500" />
        </div>
        <h1 className="text-3xl font-black text-gray-900 mb-2">Сторінку не знайдено</h1>
        <p className="text-gray-500 mb-8">
          Можливо, сторінка була переміщена або посилання застаріло. Поверніться до каталогу та оберіть товар.
        </p>
        <Link
          href="/#catalog"
          className="inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 px-6 rounded-2xl transition-colors shadow-lg"
        >
          <PackageSearch size={20} className="shrink-0" />
          До каталогу
        </Link>
      </div>
    </div>
  );
}
