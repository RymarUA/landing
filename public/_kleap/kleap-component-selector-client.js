(() => {
  const OVERLAY_ID = "__kleap_overlay__";
  let overlay, label;

  // The possible states are:
  // { type: 'inactive' }
  // { type: 'inspecting', element: ?HTMLElement }
  // { type: 'selected', element: HTMLElement }
  let state = { type: "inactive" };

  /* ---------- i18n translations ----------------------------------------- */
  const translations = {
    en: {
      editText: "Edit text",
      mentionToAI: "Mention to AI",
      design: "Design",
      replaceImage: "Replace image",
      chooseFromLibrary: "Choose from library",
      changeUrl: "Change URL",
      generateWithAI: "Generate with AI",
      uploadImage: "Upload image",
      imageUrl: "Image URL",
      cancel: "Cancel",
      apply: "Apply",
      generate: "🎨 Generate",
      generating: "Generating...",
      enterImageUrl: "Enter image URL...",
      chooseModel: "Choose Model:",
      describeImage: "Describe your image:",
      aiPromptPlaceholder:
        "A beautiful landscape with mountains and a sunset...",
      stylePresets: "Style presets (optional):",
      urlPlaceholder: "https://example.com/image.jpg",
      generatingWith: "Generating with",
      mayTakeTime: "This may take 10-30 seconds",
      dpColors: "Colors",
      dpTypography: "Typography",
      dpSpacing: "Spacing",
      dpBorderEffects: "Border & Effects",
      dpBackground: "Background",
      dpTextColor: "Text color",
      dpFontSize: "Font size",
      dpFontWeight: "Weight",
      dpTextAlign: "Alignment",
      dpLetterSpacing: "Letter spacing",
      dpPadding: "Padding",
      dpMargin: "Margin",
      dpGap: "Gap",
      dpBorderRadius: "Border radius",
      dpBorderWidth: "Border width",
      dpBorderColor: "Border color",
      dpShadow: "Shadow",
      dpOpacity: "Opacity",
    },
    fr: {
      editText: "Modifier le texte",
      mentionToAI: "Mentionner à l'IA",
      design: "Design",
      replaceImage: "Remplacer l'image",
      chooseFromLibrary: "Choisir dans la bibliothèque",
      changeUrl: "Changer l'URL",
      generateWithAI: "Générer avec l'IA",
      uploadImage: "Télécharger une image",
      imageUrl: "URL de l'image",
      cancel: "Annuler",
      apply: "Appliquer",
      generate: "🎨 Générer",
      generating: "Génération...",
      enterImageUrl: "Entrez l'URL de l'image...",
      chooseModel: "Choisir le modèle :",
      describeImage: "Décrivez votre image :",
      aiPromptPlaceholder:
        "Un beau paysage avec des montagnes et un coucher de soleil...",
      stylePresets: "Préréglages de style (optionnel) :",
      urlPlaceholder: "https://exemple.com/image.jpg",
      generatingWith: "Génération avec",
      mayTakeTime: "Cela peut prendre 10-30 secondes",
    },
    de: {
      editText: "Text bearbeiten",
      mentionToAI: "KI erwähnen",
      design: "Design",
      replaceImage: "Bild ersetzen",
      chooseFromLibrary: "Aus Bibliothek wählen",
      changeUrl: "URL ändern",
      generateWithAI: "Mit KI generieren",
      uploadImage: "Bild hochladen",
      imageUrl: "Bild-URL",
      cancel: "Abbrechen",
      apply: "Anwenden",
      generate: "🎨 Generieren",
      generating: "Generierung...",
      enterImageUrl: "Bild-URL eingeben...",
      chooseModel: "Modell wählen:",
      describeImage: "Beschreiben Sie Ihr Bild:",
      aiPromptPlaceholder:
        "Eine schöne Landschaft mit Bergen und Sonnenuntergang...",
      stylePresets: "Stilvorlagen (optional):",
      urlPlaceholder: "https://beispiel.com/bild.jpg",
      generatingWith: "Generierung mit",
      mayTakeTime: "Dies kann 10-30 Sekunden dauern",
    },
    es: {
      editText: "Editar texto",
      mentionToAI: "Mencionar a la IA",
      design: "Diseño",
      replaceImage: "Reemplazar imagen",
      chooseFromLibrary: "Elegir de la biblioteca",
      changeUrl: "Cambiar URL",
      generateWithAI: "Generar con IA",
      uploadImage: "Subir imagen",
      imageUrl: "URL de imagen",
      cancel: "Cancelar",
      apply: "Aplicar",
      generate: "🎨 Generar",
      generating: "Generando...",
      enterImageUrl: "Ingrese URL de imagen...",
      chooseModel: "Elegir modelo:",
      describeImage: "Describe tu imagen:",
      aiPromptPlaceholder: "Un hermoso paisaje con montañas y atardecer...",
      stylePresets: "Estilos predefinidos (opcional):",
      urlPlaceholder: "https://ejemplo.com/imagen.jpg",
      generatingWith: "Generando con",
      mayTakeTime: "Esto puede tomar 10-30 segundos",
    },
    pt: {
      editText: "Editar texto",
      mentionToAI: "Mencionar à IA",
      design: "Design",
      replaceImage: "Substituir imagem",
      chooseFromLibrary: "Escolher da biblioteca",
      changeUrl: "Alterar URL",
      generateWithAI: "Gerar com IA",
      uploadImage: "Enviar imagem",
      imageUrl: "URL da imagem",
      cancel: "Cancelar",
      apply: "Aplicar",
      generate: "🎨 Gerar",
      generating: "Gerando...",
      enterImageUrl: "Digite a URL da imagem...",
      chooseModel: "Escolher modelo:",
      describeImage: "Descreva sua imagem:",
      aiPromptPlaceholder: "Uma bela paisagem com montanhas e pôr do sol...",
      stylePresets: "Estilos predefinidos (opcional):",
      urlPlaceholder: "https://exemplo.com/imagem.jpg",
      generatingWith: "Gerando com",
      mayTakeTime: "Isso pode levar 10-30 segundos",
    },
    it: {
      editText: "Modifica testo",
      mentionToAI: "Menziona all'IA",
      design: "Design",
      replaceImage: "Sostituisci immagine",
      chooseFromLibrary: "Scegli dalla libreria",
      changeUrl: "Cambia URL",
      generateWithAI: "Genera con IA",
      uploadImage: "Carica immagine",
      imageUrl: "URL immagine",
      cancel: "Annulla",
      apply: "Applica",
      generate: "🎨 Genera",
      generating: "Generazione...",
      enterImageUrl: "Inserisci URL immagine...",
      chooseModel: "Scegli modello:",
      describeImage: "Descrivi la tua immagine:",
      aiPromptPlaceholder: "Un bellissimo paesaggio con montagne e tramonto...",
      stylePresets: "Stili predefiniti (opzionale):",
      urlPlaceholder: "https://esempio.com/immagine.jpg",
      generatingWith: "Generazione con",
      mayTakeTime: "Potrebbe richiedere 10-30 secondi",
    },
    nl: {
      editText: "Tekst bewerken",
      mentionToAI: "AI vermelden",
      design: "Ontwerp",
      replaceImage: "Afbeelding vervangen",
      chooseFromLibrary: "Kies uit bibliotheek",
      changeUrl: "URL wijzigen",
      generateWithAI: "Genereren met AI",
      uploadImage: "Afbeelding uploaden",
      imageUrl: "Afbeelding-URL",
      cancel: "Annuleren",
      apply: "Toepassen",
      generate: "🎨 Genereren",
      generating: "Genereren...",
      enterImageUrl: "Voer afbeelding-URL in...",
      chooseModel: "Kies model:",
      describeImage: "Beschrijf je afbeelding:",
      aiPromptPlaceholder:
        "Een prachtig landschap met bergen en zonsondergang...",
      stylePresets: "Stijlvoorinstellingen (optioneel):",
      urlPlaceholder: "https://voorbeeld.com/afbeelding.jpg",
      generatingWith: "Genereren met",
      mayTakeTime: "Dit kan 10-30 seconden duren",
    },
    ar: {
      editText: "تعديل النص",
      mentionToAI: "إشارة للذكاء الاصطناعي",
      design: "تصميم",
      replaceImage: "استبدال الصورة",
      chooseFromLibrary: "اختر من المكتبة",
      changeUrl: "تغيير الرابط",
      generateWithAI: "إنشاء بالذكاء الاصطناعي",
      uploadImage: "رفع صورة",
      imageUrl: "رابط الصورة",
      cancel: "إلغاء",
      apply: "تطبيق",
      generate: "🎨 إنشاء",
      generating: "جاري الإنشاء...",
      enterImageUrl: "أدخل رابط الصورة...",
      chooseModel: "اختر النموذج:",
      describeImage: "صف صورتك:",
      aiPromptPlaceholder: "منظر طبيعي جميل مع الجبال وغروب الشمس...",
      stylePresets: "أنماط مسبقة (اختياري):",
      urlPlaceholder: "https://example.com/image.jpg",
      generatingWith: "إنشاء باستخدام",
      mayTakeTime: "قد يستغرق هذا 10-30 ثانية",
    },
    zh: {
      editText: "编辑文本",
      mentionToAI: "提及AI",
      design: "设计",
      replaceImage: "替换图片",
      chooseFromLibrary: "从库中选择",
      changeUrl: "更改链接",
      generateWithAI: "AI生成",
      uploadImage: "上传图片",
      imageUrl: "图片链接",
      cancel: "取消",
      apply: "应用",
      generate: "🎨 生成",
      generating: "生成中...",
      enterImageUrl: "输入图片链接...",
      chooseModel: "选择模型：",
      describeImage: "描述你的图片：",
      aiPromptPlaceholder: "美丽的山景和日落...",
      stylePresets: "风格预设（可选）：",
      urlPlaceholder: "https://example.com/image.jpg",
      generatingWith: "使用生成",
      mayTakeTime: "这可能需要10-30秒",
    },
    ja: {
      editText: "テキストを編集",
      mentionToAI: "AIに言及",
      design: "デザイン",
      replaceImage: "画像を置換",
      chooseFromLibrary: "ライブラリから選択",
      changeUrl: "URLを変更",
      generateWithAI: "AIで生成",
      uploadImage: "画像をアップロード",
      imageUrl: "画像URL",
      cancel: "キャンセル",
      apply: "適用",
      generate: "🎨 生成",
      generating: "生成中...",
      enterImageUrl: "画像URLを入力...",
      chooseModel: "モデルを選択：",
      describeImage: "画像を説明してください：",
      aiPromptPlaceholder: "山と夕日の美しい風景...",
      stylePresets: "スタイルプリセット（オプション）：",
      urlPlaceholder: "https://example.com/image.jpg",
      generatingWith: "生成中：",
      mayTakeTime: "10〜30秒かかる場合があります",
    },
    el: {
      editText: "Επεξεργασία κειμένου",
      mentionToAI: "Αναφορά στην ΤΝ",
      design: "Σχεδιασμός",
      replaceImage: "Αντικατάσταση εικόνας",
      chooseFromLibrary: "Επιλογή από βιβλιοθήκη",
      changeUrl: "Αλλαγή URL",
      generateWithAI: "Δημιουργία με ΤΝ",
      uploadImage: "Μεταφόρτωση εικόνας",
      imageUrl: "URL εικόνας",
      cancel: "Ακύρωση",
      apply: "Εφαρμογή",
      generate: "🎨 Δημιουργία",
      generating: "Δημιουργία...",
      enterImageUrl: "Εισάγετε URL εικόνας...",
      chooseModel: "Επιλογή μοντέλου:",
      describeImage: "Περιγράψτε την εικόνα σας:",
      aiPromptPlaceholder: "Ένα όμορφο τοπίο με βουνά και ηλιοβασίλεμα...",
      stylePresets: "Προεπιλογές στυλ (προαιρετικό):",
      urlPlaceholder: "https://example.com/image.jpg",
      generatingWith: "Δημιουργία με",
      mayTakeTime: "Μπορεί να χρειαστεί 10-30 δευτερόλεπτα",
    },
    sq: {
      editText: "Redakto tekstin",
      mentionToAI: "Përmend AI-në",
      design: "Dizajn",
      replaceImage: "Zëvendëso imazhin",
      chooseFromLibrary: "Zgjidh nga biblioteka",
      changeUrl: "Ndrysho URL-në",
      generateWithAI: "Gjenero me AI",
      uploadImage: "Ngarko imazh",
      imageUrl: "URL e imazhit",
      cancel: "Anulo",
      apply: "Apliko",
      generate: "🎨 Gjenero",
      generating: "Duke gjeneruar...",
      enterImageUrl: "Fut URL-në e imazhit...",
      chooseModel: "Zgjidh modelin:",
      describeImage: "Përshkruaj imazhin tënd:",
      aiPromptPlaceholder: "Një peizazh i bukur me male dhe perëndim dielli...",
      stylePresets: "Paracaktime stili (opsionale):",
      urlPlaceholder: "https://example.com/image.jpg",
      generatingWith: "Duke gjeneruar me",
      mayTakeTime: "Kjo mund të zgjasë 10-30 sekonda",
    },
    id: {
      editText: "Edit teks",
      mentionToAI: "Sebut ke AI",
      design: "Desain",
      replaceImage: "Ganti gambar",
      chooseFromLibrary: "Pilih dari perpustakaan",
      changeUrl: "Ubah URL",
      generateWithAI: "Hasilkan dengan AI",
      uploadImage: "Unggah gambar",
      imageUrl: "URL gambar",
      cancel: "Batal",
      apply: "Terapkan",
      generate: "🎨 Hasilkan",
      generating: "Menghasilkan...",
      enterImageUrl: "Masukkan URL gambar...",
      chooseModel: "Pilih model:",
      describeImage: "Deskripsikan gambar Anda:",
      aiPromptPlaceholder:
        "Pemandangan indah dengan gunung dan matahari terbenam...",
      stylePresets: "Preset gaya (opsional):",
      urlPlaceholder: "https://contoh.com/gambar.jpg",
      generatingWith: "Menghasilkan dengan",
      mayTakeTime: "Ini mungkin memakan waktu 10-30 detik",
    },
    tr: {
      editText: "Metni düzenle",
      mentionToAI: "AI'ya bahset",
      design: "Tasarım",
      replaceImage: "Resmi değiştir",
      chooseFromLibrary: "Kütüphaneden seç",
      changeUrl: "URL'yi değiştir",
      generateWithAI: "AI ile oluştur",
      uploadImage: "Resim yükle",
      imageUrl: "Resim URL'si",
      cancel: "İptal",
      apply: "Uygula",
      generate: "🎨 Oluştur",
      generating: "Oluşturuluyor...",
      enterImageUrl: "Resim URL'sini girin...",
      chooseModel: "Model seçin:",
      describeImage: "Resminizi tanımlayın:",
      aiPromptPlaceholder: "Dağlar ve gün batımı ile güzel bir manzara...",
      stylePresets: "Stil ön ayarları (isteğe bağlı):",
      urlPlaceholder: "https://ornek.com/resim.jpg",
      generatingWith: "İle oluşturuluyor",
      mayTakeTime: "Bu 10-30 saniye sürebilir",
    },
    vi: {
      editText: "Chỉnh sửa văn bản",
      mentionToAI: "Đề cập đến AI",
      design: "Thiết kế",
      replaceImage: "Thay thế hình ảnh",
      chooseFromLibrary: "Chọn từ thư viện",
      changeUrl: "Thay đổi URL",
      generateWithAI: "Tạo với AI",
      uploadImage: "Tải lên hình ảnh",
      imageUrl: "URL hình ảnh",
      cancel: "Hủy",
      apply: "Áp dụng",
      generate: "🎨 Tạo",
      generating: "Đang tạo...",
      enterImageUrl: "Nhập URL hình ảnh...",
      chooseModel: "Chọn mô hình:",
      describeImage: "Mô tả hình ảnh của bạn:",
      aiPromptPlaceholder: "Phong cảnh đẹp với núi và hoàng hôn...",
      stylePresets: "Cài đặt phong cách (tùy chọn):",
      urlPlaceholder: "https://example.com/image.jpg",
      generatingWith: "Đang tạo với",
      mayTakeTime: "Có thể mất 10-30 giây",
    },
    fa: {
      editText: "ویرایش متن",
      mentionToAI: "اشاره به هوش مصنوعی",
      design: "طراحی",
      replaceImage: "جایگزینی تصویر",
      chooseFromLibrary: "انتخاب از کتابخانه",
      changeUrl: "تغییر لینک",
      generateWithAI: "تولید با هوش مصنوعی",
      uploadImage: "آپلود تصویر",
      imageUrl: "لینک تصویر",
      cancel: "لغو",
      apply: "اعمال",
      generate: "🎨 تولید",
      generating: "در حال تولید...",
      enterImageUrl: "لینک تصویر را وارد کنید...",
      chooseModel: "انتخاب مدل:",
      describeImage: "تصویر خود را توصیف کنید:",
      aiPromptPlaceholder: "منظره زیبا با کوه‌ها و غروب آفتاب...",
      stylePresets: "پیش‌تنظیمات سبک (اختیاری):",
      urlPlaceholder: "https://example.com/image.jpg",
      generatingWith: "تولید با",
      mayTakeTime: "این ممکن است ۱۰-۳۰ ثانیه طول بکشد",
    },
  };

  // Supported languages list
  const supportedLangs = [
    "en",
    "fr",
    "de",
    "es",
    "pt",
    "it",
    "nl",
    "ar",
    "zh",
    "ja",
    "el",
    "sq",
    "id",
    "tr",
    "vi",
    "fa",
  ];

  // Detect language from document or parent frame
  function detectLanguage() {
    // Check document lang attribute
    const docLang = document.documentElement.lang || "";
    const langCode = docLang.split("-")[0].toLowerCase();
    if (supportedLangs.includes(langCode)) return langCode;

    // Check URL for locale pattern (e.g., /fr/, /en/)
    const pathMatch = window.location.pathname.match(/^\/([a-z]{2})\//);
    if (pathMatch && supportedLangs.includes(pathMatch[1])) return pathMatch[1];

    // Default to English
    return "en";
  }

  const currentLang = detectLanguage();
  const t = (key) =>
    translations[currentLang]?.[key] || translations.en[key] || key;

  /* ---------- helpers --------------------------------------------------- */
  const css = (el, obj) => Object.assign(el.style, obj);

  function getElementPath(element) {
    const path = [];
    let current = element;
    let depth = 0;
    const maxDepth = 5;

    while (current && current !== document.body && depth < maxDepth) {
      let identifier = current.tagName.toLowerCase();

      if (current.id) {
        identifier += `#${current.id}`;
      } else if (current.className && typeof current.className === "string") {
        const firstClass = current.className
          .trim()
          .split(" ")
          .filter((c) => c && !c.startsWith("_"))[0];
        if (firstClass) {
          identifier += `.${firstClass}`;
        }
      }

      path.unshift(identifier);
      current = current.parentElement;
      depth++;
    }

    return path.join(" > ");
  }

  function isTextElement(el) {
    if (!el) return false;

    // Tags that are inherently text-focused (always editable if they have text)
    const pureTextTags = [
      "H1",
      "H2",
      "H3",
      "H4",
      "H5",
      "H6",
      "P",
      "SPAN",
      "A",
      "BUTTON",
      "LABEL",
      "LI",
      "TD",
      "TH",
    ];

    // Container tags — only editable if they have DIRECT text nodes (not just nested children)
    const containerTags = [
      "DIV",
      "SECTION",
      "ARTICLE",
      "MAIN",
      "HEADER",
      "FOOTER",
      "NAV",
      "ASIDE",
    ];

    const tag = el.tagName;

    if (pureTextTags.includes(tag)) {
      // For pure text tags, check they actually have visible text
      const text = (el.textContent || "").trim();
      if (!text) return false;
      // Reject if it has too many child elements (it's a container, not a text block)
      if (el.children.length > 3) return false;
      return true;
    }

    if (containerTags.includes(tag)) {
      // For containers, only return true if the element has DIRECT text nodes
      // (not just text inherited from deeply nested children)
      const directText = getDirectTextContent(el);
      if (directText.trim().length === 0) return false;
      // Must be a simple container with few or no child elements
      if (el.children.length > 1) return false;
      return true;
    }

    // For any other element, check direct text + single child
    const directText = getDirectTextContent(el);
    return directText.trim().length > 0 && el.children.length <= 1;
  }

  // Get only the text directly owned by this element (not from children)
  function getDirectTextContent(el) {
    let text = "";
    for (const node of el.childNodes) {
      if (node.nodeType === Node.TEXT_NODE) {
        text += node.textContent;
      }
    }
    return text;
  }

  function isImageElement(el) {
    return el && el.tagName === "IMG";
  }

  // Shared menu styles (shadcn-inspired)
  function injectMenuStyles() {
    if (document.getElementById("kleap-menu-styles")) return;

    const style = document.createElement("style");
    style.id = "kleap-menu-styles";
    style.textContent = `
      @keyframes kleapMenuIn {
        from {
          opacity: 0;
          transform: scale(0.95);
        }
        to {
          opacity: 1;
          transform: scale(1);
        }
      }

      .kleap-menu {
        position: fixed;
        background: white;
        border: 1px solid hsl(240 5.9% 90%);
        border-radius: 8px;
        box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
        z-index: 2147483648;
        padding: 4px;
        min-width: 180px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        animation: kleapMenuIn 0.15s ease-out;
      }

      .kleap-menu-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 10px;
        border-radius: 6px;
        cursor: pointer;
        transition: background-color 0.1s;
        color: hsl(240 10% 3.9%);
        font-size: 14px;
        line-height: 1;
        user-select: none;
      }

      .kleap-menu-item:hover {
        background: hsl(240 4.8% 95.9%);
      }

      .kleap-menu-item:active {
        background: hsl(240 5% 92%);
      }

      .kleap-menu-icon {
        width: 16px;
        height: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: hsl(240 3.8% 46.1%);
      }

      .kleap-menu-icon svg {
        width: 16px;
        height: 16px;
      }

      .kleap-menu-separator {
        height: 1px;
        background: hsl(240 5.9% 90%);
        margin: 4px -4px;
      }

      .kleap-menu-label {
        padding: 8px 10px 4px;
        font-size: 12px;
        font-weight: 500;
        color: hsl(240 3.8% 46.1%);
      }
    `;
    document.head.appendChild(style);
  }

  // SVG icons (Lucide-style)
  const icons = {
    image: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>`,
    link: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`,
    upload: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>`,
    sparkles: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>`,
    pencil: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>`,
    messageCircle: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>`,
    paintbrush: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m14.622 17.897-10.68-2.913"/><path d="M18.376 2.622a1 1 0 1 1 3.002 3.002L17.36 9.643a.5.5 0 0 0 0 .707l.944.944a2.41 2.41 0 0 1 0 3.408l-.944.944a.5.5 0 0 1-.707 0L8.354 7.348a.5.5 0 0 1 0-.707l.944-.944a2.41 2.41 0 0 1 3.408 0l.944.944a.5.5 0 0 0 .707 0z"/><path d="M9 8c-1.804 2.71-3.97 3.46-6.583 3.948a.507.507 0 0 0-.302.819l7.32 8.883a1 1 0 0 0 1.185.204C12.735 20.405 16 16.792 16 15"/></svg>`,
  };

  function createMenu(rect, items) {
    injectMenuStyles();

    const menu = document.createElement("div");
    menu.className = "kleap-menu";

    // Position menu below element, or above if not enough space
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const menuHeight = items.length * 36 + 8; // approximate

    let top, left;
    if (spaceBelow >= menuHeight || spaceBelow >= spaceAbove) {
      top = Math.min(rect.bottom + 6, window.innerHeight - menuHeight - 10);
    } else {
      top = Math.max(10, rect.top - menuHeight - 6);
    }
    left = Math.min(Math.max(10, rect.left), window.innerWidth - 200);

    css(menu, {
      top: `${top}px`,
      left: `${left}px`,
    });

    items.forEach((item) => {
      if (item.separator) {
        const sep = document.createElement("div");
        sep.className = "kleap-menu-separator";
        menu.appendChild(sep);
        return;
      }

      const menuItem = document.createElement("div");
      menuItem.className = "kleap-menu-item";

      const icon = document.createElement("span");
      icon.className = "kleap-menu-icon";
      icon.innerHTML = item.icon;

      const label = document.createElement("span");
      label.textContent = item.label;

      menuItem.appendChild(icon);
      menuItem.appendChild(label);

      menuItem.onclick = (e) => {
        e.stopPropagation();
        closeMenu();
        item.action();
      };

      menu.appendChild(menuItem);
    });

    document.body.appendChild(menu);

    // Close menu on click outside or escape
    const closeMenu = () => {
      menu.remove();
      document.removeEventListener("click", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };

    const handleOutsideClick = (e) => {
      if (!menu.contains(e.target)) {
        closeMenu();
      }
    };

    const handleEscape = (e) => {
      if (e.key === "Escape") {
        closeMenu();
      }
    };

    setTimeout(() => {
      document.addEventListener("click", handleOutsideClick);
      document.addEventListener("keydown", handleEscape);
    }, 0);

    return { menu, closeMenu };
  }

  function enableImageEdit(img) {
    const rect = img.getBoundingClientRect();

    createMenu(rect, [
      {
        icon: icons.image,
        label: t("chooseFromLibrary"),
        action: () => showLibraryDialog(img),
      },
      {
        icon: icons.upload,
        label: t("uploadImage"),
        action: () => showUploadDialog(img),
      },
      {
        icon: icons.link,
        label: t("changeUrl"),
        action: () => showUrlDialog(img),
      },
      { separator: true },
      {
        icon: icons.paintbrush,
        label: t("design"),
        action: () => showDesignPanel(img),
      },
      {
        icon: icons.sparkles,
        label: t("generateWithAI"),
        action: () => showAIDialog(img),
      },
    ]);
  }

  function showTextMenu(el) {
    const rect = el.getBoundingClientRect();

    createMenu(rect, [
      {
        icon: icons.pencil,
        label: t("editText"),
        action: () => enableInlineEdit(el),
      },
      {
        icon: icons.paintbrush,
        label: t("design"),
        action: () => showDesignPanel(el),
      },
      {
        icon: icons.messageCircle,
        label: t("mentionToAI"),
        action: () => sendToAI(el),
      },
    ]);
  }

  function sendToAI(el) {
    // Generate ID and name
    let id = el.dataset.kleapId;
    let name = el.dataset.kleapName;
    let path = el.dataset.kleapPath;

    if (!id) {
      const tag = el.tagName.toLowerCase();
      const uniqueId = Math.random().toString(36).substr(2, 9);
      if (el.id) {
        id = `${tag}#${el.id}`;
      } else if (el.className && typeof el.className === "string") {
        const firstClass = el.className.trim().split(" ")[0];
        id = `${tag}.${firstClass}-${uniqueId}`;
      } else {
        id = `${tag}-${uniqueId}`;
      }
    }

    if (!name) {
      const tag = el.tagName.toLowerCase();
      if (el.className && typeof el.className === "string") {
        const classes = el.className
          .trim()
          .split(" ")
          .filter((c) => c && !c.startsWith("_"));
        const meaningfulClass = classes.find(
          (c) =>
            !c.match(
              /^(flex|grid|block|inline|absolute|relative|fixed|sticky|w-|h-|p-|m-|text-|bg-|border-|rounded-|shadow-|opacity-|z-)/,
            ),
        );
        name = meaningfulClass
          ? `${tag}.${meaningfulClass}`
          : `${tag}.${classes[0] || ""}`;
      } else {
        name = tag;
      }
    }

    if (!path) {
      path = getElementPath(el);
    }

    window.parent.postMessage(
      {
        type: "kleap-component-selected",
        id: id,
        name: name,
        path: path,
        tagName: el.tagName.toLowerCase(),
        className: el.className || "",
        textContent: el.textContent ? el.textContent.substring(0, 100) : "",
        hasChildren: el.children.length > 0,
        rect: {
          width: el.offsetWidth,
          height: el.offsetHeight,
        },
      },
      "*",
    );
  }

  function showLibraryDialog(img) {
    // Send message to parent to open Asset Manager
    window.parent.postMessage(
      {
        type: "kleap-image-library-select",
        id:
          img.dataset.kleapId ||
          `img-${Math.random().toString(36).substr(2, 9)}`,
        oldSrc: img.src,
        alt: img.alt || "",
      },
      "*",
    );
  }

  function showUrlDialog(img) {
    const dialog = createDialog(t("changeUrl"));

    const input = document.createElement("input");
    input.type = "text";
    input.value = img.src;
    input.placeholder = t("enterImageUrl");
    css(input, {
      width: "100%",
      padding: "10px 12px",
      border: "1px solid #ddd",
      borderRadius: "8px",
      fontSize: "14px",
      marginBottom: "16px",
      boxSizing: "border-box",
      fontFamily:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    });

    dialog.content.appendChild(input);

    dialog.onSave = () => {
      const newSrc = input.value.trim();
      if (newSrc && newSrc !== img.src) {
        updateImage(img, newSrc);
      }
    };

    input.focus();
    input.select();
  }

  function showUploadDialog(img) {
    // Open Asset Manager directly - it has full upload functionality
    window.parent.postMessage(
      {
        type: "kleap-image-library-select",
        id:
          img.dataset.kleapId ||
          `img-${Math.random().toString(36).substr(2, 9)}`,
        oldSrc: img.src,
        alt: img.alt || "",
      },
      "*",
    );
  }

  function showAIDialog(img) {
    const dialog = createDialog(t("generateWithAI"));

    // Model selection
    const modelLabel = document.createElement("div");
    css(modelLabel, {
      fontSize: "12px",
      color: "#666",
      marginBottom: "8px",
      fontFamily:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    });
    modelLabel.textContent = t("chooseModel");

    const modelContainer = document.createElement("div");
    css(modelContainer, {
      display: "grid",
      gridTemplateColumns: "repeat(2, 1fr)",
      gap: "8px",
      marginBottom: "16px",
    });

    const models = [
      { id: "flux-pro", name: "🚀 Flux Pro", desc: "Fast & High quality" },
      { id: "flux-dev", name: "⚡ Flux Dev", desc: "Good balance" },
      { id: "sdxl", name: "🎨 Stable Diffusion", desc: "Classic & reliable" },
      {
        id: "playground-v2",
        name: "✨ Playground v2",
        desc: "Aesthetic focus",
      },
      { id: "kandinsky", name: "🖼️ Kandinsky", desc: "Artistic style" },
      { id: "dalle-3", name: "🤖 DALL-E 3", desc: "OpenAI (if available)" },
    ];

    let selectedModel = "flux-pro";
    const modelButtons = [];

    models.forEach((model) => {
      const button = document.createElement("div");
      css(button, {
        padding: "8px",
        borderRadius: "8px",
        border: "2px solid #ddd",
        cursor: "pointer",
        transition: "all 0.2s",
        textAlign: "center",
        background: model.id === selectedModel ? "#ff0055" : "white",
        color: model.id === selectedModel ? "white" : "#333",
      });

      button.innerHTML = `
        <div style="font-size: 20px; margin-bottom: 4px;">${model.name.split(" ")[0]}</div>
        <div style="font-size: 11px; font-weight: 500;">${model.name.substring(model.name.indexOf(" ") + 1)}</div>
        <div style="font-size: 9px; opacity: 0.8; margin-top: 2px;">${model.desc}</div>
      `;

      button.onclick = () => {
        selectedModel = model.id;
        // Update button styles
        modelButtons.forEach((btn) => {
          css(btn, {
            background: btn === button ? "#ff0055" : "white",
            color: btn === button ? "white" : "#333",
            border: btn === button ? "2px solid #ff0055" : "2px solid #ddd",
          });
        });
      };

      modelButtons.push(button);
      modelContainer.appendChild(button);
    });

    // Prompt textarea
    const promptLabel = document.createElement("div");
    css(promptLabel, {
      fontSize: "12px",
      color: "#666",
      marginBottom: "8px",
      marginTop: "16px",
      fontFamily:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    });
    promptLabel.textContent = t("describeImage");

    const textarea = document.createElement("textarea");
    textarea.placeholder = t("aiPromptPlaceholder");
    css(textarea, {
      width: "100%",
      minHeight: "80px",
      padding: "10px 12px",
      border: "1px solid #ddd",
      borderRadius: "8px",
      fontSize: "14px",
      marginBottom: "12px",
      resize: "vertical",
      boxSizing: "border-box",
      fontFamily:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    });

    // Style presets
    const styleLabel = document.createElement("div");
    css(styleLabel, {
      fontSize: "12px",
      color: "#666",
      marginBottom: "8px",
      fontFamily:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    });
    styleLabel.textContent = t("stylePresets");

    const styleContainer = document.createElement("div");
    css(styleContainer, {
      display: "flex",
      flexWrap: "wrap",
      gap: "6px",
      marginBottom: "16px",
    });

    const styles = [
      "Photorealistic",
      "Artistic",
      "Anime",
      "3D Render",
      "Watercolor",
      "Oil Painting",
      "Minimalist",
      "Vintage",
    ];

    styles.forEach((style) => {
      const chip = document.createElement("div");
      css(chip, {
        padding: "4px 10px",
        borderRadius: "12px",
        border: "1px solid #ddd",
        fontSize: "12px",
        cursor: "pointer",
        transition: "all 0.15s",
        background: "white",
        color: "#666",
      });
      chip.textContent = style;

      chip.onclick = () => {
        const isSelected = chip.style.background === "rgb(255, 0, 85)";
        css(chip, {
          background: isSelected ? "white" : "#ff0055",
          color: isSelected ? "#666" : "white",
          border: isSelected ? "1px solid #ddd" : "1px solid #ff0055",
        });

        // Add/remove from prompt
        if (!isSelected) {
          if (!textarea.value.includes(style.toLowerCase())) {
            textarea.value =
              textarea.value.trim() +
              (textarea.value ? ", " : "") +
              style.toLowerCase() +
              " style";
          }
        } else {
          textarea.value = textarea.value.replace(
            new RegExp(`,?\\s*${style.toLowerCase()}\\s*style`, "gi"),
            "",
          );
        }
      };

      styleContainer.appendChild(chip);
    });

    // Append all elements
    dialog.content.appendChild(modelLabel);
    dialog.content.appendChild(modelContainer);
    dialog.content.appendChild(promptLabel);
    dialog.content.appendChild(textarea);
    dialog.content.appendChild(styleLabel);
    dialog.content.appendChild(styleContainer);

    dialog.saveBtn.textContent = t("generate");

    dialog.onSave = () => {
      const prompt = textarea.value.trim();
      if (prompt) {
        // Send to parent for AI generation with selected model
        window.parent.postMessage(
          {
            type: "kleap-image-ai-generate",
            id:
              img.dataset.kleapId ||
              `img-${Math.random().toString(36).substr(2, 9)}`,
            prompt: prompt,
            model: selectedModel,
            oldSrc: img.src,
          },
          "*",
        );

        // Show generating state
        dialog.content.innerHTML = `
          <div style="text-align: center; padding: 30px;">
            <div style="font-size: 48px; margin-bottom: 12px; animation: spin 2s linear infinite;">✨</div>
            <div style="color: #333; font-size: 16px; font-weight: 600;">${t("generatingWith")} ${models.find((m) => m.id === selectedModel)?.name || "AI"}...</div>
            <div style="color: #666; font-size: 14px; margin-top: 8px;">"${prompt.substring(0, 50)}${prompt.length > 50 ? "..." : ""}"</div>
            <div style="color: #999; font-size: 12px; margin-top: 12px;">${t("mayTakeTime")}</div>
          </div>
          <style>
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          </style>
        `;
        dialog.saveBtn.style.display = "none";
      }
    };

    textarea.focus();
  }

  function createDialog(title) {
    const overlay = document.createElement("div");
    css(overlay, {
      position: "fixed",
      top: "0",
      left: "0",
      right: "0",
      bottom: "0",
      background: "rgba(0,0,0,0.5)",
      zIndex: "2147483647",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    });

    const dialog = document.createElement("div");
    css(dialog, {
      background: "white",
      borderRadius: "16px",
      boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
      minWidth: "400px",
      maxWidth: "500px",
      animation: "kleapDialogIn 0.2s ease-out",
    });

    const header = document.createElement("div");
    css(header, {
      padding: "20px 24px",
      borderBottom: "1px solid #eee",
      fontSize: "16px",
      fontWeight: "600",
      color: "#333",
      fontFamily:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    });
    header.textContent = title;

    const content = document.createElement("div");
    css(content, {
      padding: "20px 24px",
    });

    const footer = document.createElement("div");
    css(footer, {
      padding: "16px 24px",
      borderTop: "1px solid #eee",
      display: "flex",
      gap: "8px",
      justifyContent: "flex-end",
    });

    const cancelBtn = document.createElement("button");
    cancelBtn.textContent = t("cancel");
    css(cancelBtn, {
      padding: "8px 16px",
      border: "1px solid #ddd",
      borderRadius: "8px",
      background: "white",
      color: "#666",
      fontSize: "14px",
      cursor: "pointer",
      fontFamily:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    });

    const saveBtn = document.createElement("button");
    saveBtn.textContent = t("apply");
    css(saveBtn, {
      padding: "8px 20px",
      border: "none",
      borderRadius: "8px",
      background: "#ff0055",
      color: "white",
      fontSize: "14px",
      cursor: "pointer",
      fontFamily:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    });

    footer.appendChild(cancelBtn);
    footer.appendChild(saveBtn);

    dialog.appendChild(header);
    dialog.appendChild(content);
    dialog.appendChild(footer);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    const close = () => overlay.remove();

    cancelBtn.onclick = close;
    overlay.onclick = (e) => {
      if (e.target === overlay) close();
    };

    const result = {
      content,
      saveBtn,
      close,
      onSave: null,
    };

    saveBtn.onclick = () => {
      if (result.onSave) result.onSave();
      close();
    };

    // Handle keyboard
    document.addEventListener("keydown", function handleKey(e) {
      if (e.key === "Escape") {
        close();
        document.removeEventListener("keydown", handleKey);
      }
    });

    return result;
  }

  function updateImage(img, newSrc) {
    const originalSrc = img.src;
    img.src = newSrc;

    // Send the change to parent
    window.parent.postMessage(
      {
        type: "kleap-image-edited",
        id:
          img.dataset.kleapId ||
          `img-${Math.random().toString(36).substr(2, 9)}`,
        oldSrc: originalSrc,
        newSrc: newSrc,
        alt: img.alt || "",
      },
      "*",
    );
  }

  /* ---------- Design Panel (2026 — adaptive dark/light, Canva-grade UX) --- */
  function showDesignPanel(el) {
    // Remove existing panel if any
    const existingPanel = document.querySelector(
      '[data-kleap-ui="design-panel"]',
    );
    if (existingPanel) existingPanel.remove();

    // Track original styles for revert on cancel
    const originalStyles = {};
    const trackedProps = [
      "backgroundColor",
      "color",
      "fontSize",
      "fontWeight",
      "textAlign",
      "letterSpacing",
      "paddingTop",
      "paddingRight",
      "paddingBottom",
      "paddingLeft",
      "marginTop",
      "marginRight",
      "marginBottom",
      "marginLeft",
      "gap",
      "borderRadius",
      "borderWidth",
      "borderColor",
      "borderStyle",
      "boxShadow",
      "opacity",
    ];
    trackedProps.forEach((p) => {
      originalStyles[p] = el.style[p];
    });

    const changedProps = {};
    let changeCount = 0;
    let applyBtn = null;
    let changeDot = null;

    function updateChangeIndicators() {
      changeCount = Object.keys(changedProps).length;
      if (applyBtn) {
        if (changeCount > 0) {
          applyBtn.querySelector(".dp-apply-text").textContent =
            (t("apply") || "Apply") + " (" + changeCount + ")";
          css(applyBtn, { opacity: "1", pointerEvents: "auto" });
        } else {
          applyBtn.querySelector(".dp-apply-text").textContent =
            t("apply") || "Apply";
          css(applyBtn, { opacity: "0.4", pointerEvents: "none" });
        }
      }
      if (changeDot) {
        changeDot.style.opacity = changeCount > 0 ? "1" : "0";
      }
    }

    function applyStyle(prop, value) {
      el.style[prop] = value;
      changedProps[prop] = value;
      updateChangeIndicators();
    }

    // ─── Theme detection ──────────────────────────────────────
    const isDark = (() => {
      if (
        document.documentElement.classList.contains("dark") ||
        document.body.classList.contains("dark")
      )
        return true;
      const cs = getComputedStyle(document.documentElement).colorScheme;
      if (cs === "dark") return true;
      const bg = getComputedStyle(document.body).backgroundColor;
      const m = bg.match(/\d+/g);
      if (m && m.length >= 3) {
        return (0.299 * +m[0] + 0.587 * +m[1] + 0.114 * +m[2]) / 255 < 0.5;
      }
      return false;
    })();

    const T = isDark
      ? {
          bg: "rgba(18, 18, 24, 0.92)",
          surface: "rgba(255,255,255,0.05)",
          surfaceHover: "rgba(255,255,255,0.09)",
          border: "rgba(255,255,255,0.07)",
          borderStrong: "rgba(255,255,255,0.14)",
          text: "rgba(255,255,255,0.9)",
          textMuted: "rgba(255,255,255,0.45)",
          textFaint: "rgba(255,255,255,0.25)",
          accent: "#818cf8",
          accentHover: "#a5b4fc",
          accentSubtle: "rgba(129,140,248,0.14)",
          inputBg: "rgba(255,255,255,0.06)",
          inputBorder: "rgba(255,255,255,0.10)",
          inputFocus: "rgba(129,140,248,0.5)",
          shadow: "0 16px 48px rgba(0,0,0,0.45), 0 4px 12px rgba(0,0,0,0.25)",
          scrollThumb: "rgba(255,255,255,0.12)",
          rangeTrack: "rgba(255,255,255,0.10)",
          swatchRing: "rgba(255,255,255,0.5)",
          cancelBg: "rgba(255,255,255,0.06)",
          cancelBgHover: "rgba(255,255,255,0.12)",
          cancelText: "rgba(255,255,255,0.6)",
          cancelBorder: "rgba(255,255,255,0.10)",
        }
      : {
          bg: "rgba(255, 255, 255, 0.92)",
          surface: "rgba(0,0,0,0.02)",
          surfaceHover: "rgba(0,0,0,0.05)",
          border: "rgba(0,0,0,0.10)",
          borderStrong: "rgba(0,0,0,0.15)",
          text: "rgba(0,0,0,0.88)",
          textMuted: "rgba(0,0,0,0.45)",
          textFaint: "rgba(0,0,0,0.22)",
          accent: "#6366f1",
          accentHover: "#4f46e5",
          accentSubtle: "rgba(99,102,241,0.10)",
          inputBg: "rgba(0,0,0,0.03)",
          inputBorder: "rgba(0,0,0,0.10)",
          inputFocus: "rgba(99,102,241,0.4)",
          shadow: "0 16px 48px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.06)",
          scrollThumb: "rgba(0,0,0,0.10)",
          rangeTrack: "rgba(0,0,0,0.08)",
          swatchRing: "rgba(0,0,0,0.35)",
          cancelBg: "rgba(0,0,0,0.03)",
          cancelBgHover: "rgba(0,0,0,0.08)",
          cancelText: "rgba(0,0,0,0.5)",
          cancelBorder: "rgba(0,0,0,0.10)",
        };

    // ─── Inject global CSS (once per theme) ───────────────────
    const styleId = "kleap-dp-styles";
    let styleEl = document.getElementById(styleId);
    if (styleEl) styleEl.remove();
    styleEl = document.createElement("style");
    styleEl.id = styleId;
    styleEl.textContent = `
      @keyframes dpSlideIn {
        from { opacity: 0; transform: translateY(8px) scale(0.98); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }
      [data-kleap-ui="design-panel"] {
        animation: dpSlideIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      }
      [data-kleap-ui="design-panel"]::-webkit-scrollbar { width: 5px; }
      [data-kleap-ui="design-panel"]::-webkit-scrollbar-track { background: transparent; }
      [data-kleap-ui="design-panel"]::-webkit-scrollbar-thumb {
        background: ${T.scrollThumb}; border-radius: 5px;
      }
      [data-kleap-ui="design-panel"] input[type="range"] {
        -webkit-appearance: none; appearance: none;
        background: transparent; cursor: pointer; height: 20px; width: 100%;
      }
      [data-kleap-ui="design-panel"] input[type="range"]::-webkit-slider-runnable-track {
        height: 3px; background: ${T.rangeTrack}; border-radius: 3px;
      }
      [data-kleap-ui="design-panel"] input[type="range"]::-webkit-slider-thumb {
        -webkit-appearance: none; width: 15px; height: 15px;
        background: ${T.accent}; border-radius: 50%; margin-top: -6px;
        box-shadow: 0 1px 4px rgba(0,0,0,0.25);
        transition: transform 0.15s ease, box-shadow 0.15s ease;
      }
      [data-kleap-ui="design-panel"] input[type="range"]::-webkit-slider-thumb:hover {
        transform: scale(1.2);
        box-shadow: 0 0 0 5px ${T.accentSubtle}, 0 1px 4px rgba(0,0,0,0.25);
      }
      [data-kleap-ui="design-panel"] input[type="range"]::-moz-range-track {
        height: 3px; background: ${T.rangeTrack}; border-radius: 3px; border: none;
      }
      [data-kleap-ui="design-panel"] input[type="range"]::-moz-range-thumb {
        width: 15px; height: 15px; background: ${T.accent};
        border-radius: 50%; border: none; box-shadow: 0 1px 4px rgba(0,0,0,0.25);
      }
      [data-kleap-ui="design-panel"] input[type="number"] { -moz-appearance: textfield; }
      [data-kleap-ui="design-panel"] input[type="number"]::-webkit-outer-spin-button,
      [data-kleap-ui="design-panel"] input[type="number"]::-webkit-inner-spin-button {
        -webkit-appearance: none; margin: 0;
      }
      [data-kleap-ui="design-panel"] input[type="color"] {
        -webkit-appearance: none; border: none; padding: 0; cursor: pointer;
      }
      [data-kleap-ui="design-panel"] input[type="color"]::-webkit-color-swatch-wrapper { padding: 2px; }
      [data-kleap-ui="design-panel"] input[type="color"]::-webkit-color-swatch {
        border-radius: 50%; border: none;
      }
      [data-kleap-ui="design-panel"] .dp-section-body {
        overflow: hidden; transition: max-height 0.25s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease, padding 0.25s ease;
      }
      [data-kleap-ui="design-panel"] .dp-section-body.collapsed {
        max-height: 0 !important; opacity: 0; padding-top: 0 !important; padding-bottom: 0 !important;
      }
      [data-kleap-ui="design-panel"] .dp-chevron {
        transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      }
      [data-kleap-ui="design-panel"] .dp-chevron.collapsed {
        transform: rotate(-90deg);
      }
    `;
    document.head.appendChild(styleEl);

    // ─── Create panel ─────────────────────────────────────────
    const panel = document.createElement("div");
    panel.setAttribute("data-kleap-ui", "design-panel");

    const elRect = el.getBoundingClientRect();
    const panelWidth = 296;
    const panelMaxHeight = 520;
    let panelTop = Math.max(10, elRect.top);
    let panelLeft;

    if (window.innerWidth - elRect.right > panelWidth + 20) {
      panelLeft = elRect.right + 14;
    } else if (elRect.left > panelWidth + 20) {
      panelLeft = elRect.left - panelWidth - 14;
    } else {
      panelLeft = Math.max(10, (window.innerWidth - panelWidth) / 2);
      panelTop = Math.min(
        elRect.bottom + 14,
        window.innerHeight - panelMaxHeight - 10,
      );
    }
    if (panelTop + panelMaxHeight > window.innerHeight - 10) {
      panelTop = Math.max(10, window.innerHeight - panelMaxHeight - 10);
    }

    css(panel, {
      position: "fixed",
      top: panelTop + "px",
      left: panelLeft + "px",
      width: panelWidth + "px",
      maxHeight: panelMaxHeight + "px",
      overflowY: "auto",
      overflowX: "hidden",
      background: T.bg,
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      borderRadius: "16px",
      border: "1px solid " + T.border,
      boxShadow: T.shadow,
      zIndex: "999999",
      fontFamily:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", sans-serif',
      fontSize: "13px",
      color: T.text,
    });

    // ─── SVG icons ────────────────────────────────────────────
    const icons = {
      close:
        '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4.5 4.5l7 7M11.5 4.5l-7 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
      chevron:
        '<svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M3 4l2 2 2-2" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
      alignLeft:
        '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 3h12M2 6h8M2 9h10M2 12h6" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>',
      alignCenter:
        '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 3h12M4 6h8M3 9h10M5 12h6" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>',
      alignRight:
        '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 3h12M6 6h8M4 9h10M8 12h6" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>',
      link: '<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M5 7a2.5 2.5 0 003.5 0l1-1a2.5 2.5 0 00-3.5-3.5l-.5.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/><path d="M7 5a2.5 2.5 0 00-3.5 0l-1 1a2.5 2.5 0 003.5 3.5l.5-.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>',
      grip: '<svg width="8" height="14" viewBox="0 0 8 14" fill="none"><circle cx="2" cy="2" r="1" fill="currentColor"/><circle cx="6" cy="2" r="1" fill="currentColor"/><circle cx="2" cy="7" r="1" fill="currentColor"/><circle cx="6" cy="7" r="1" fill="currentColor"/><circle cx="2" cy="12" r="1" fill="currentColor"/><circle cx="6" cy="12" r="1" fill="currentColor"/></svg>',
    };

    // ─── Header ───────────────────────────────────────────────
    const header = document.createElement("div");
    css(header, {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "14px 16px 12px",
      borderBottom: "1px solid " + T.border,
    });

    const titleWrap = document.createElement("div");
    css(titleWrap, { display: "flex", alignItems: "center", gap: "8px" });

    // Drag grip indicator
    const grip = document.createElement("span");
    grip.innerHTML = icons.grip;
    css(grip, {
      color: T.textFaint,
      display: "flex",
      alignItems: "center",
      flexShrink: "0",
    });
    titleWrap.appendChild(grip);

    const title = document.createElement("span");
    css(title, {
      fontWeight: "600",
      fontSize: "14px",
      letterSpacing: "-0.01em",
    });
    title.textContent = t("design");
    titleWrap.appendChild(title);

    // Unsaved dot (animated)
    changeDot = document.createElement("span");
    css(changeDot, {
      width: "6px",
      height: "6px",
      borderRadius: "50%",
      background: T.accent,
      opacity: "0",
      flexShrink: "0",
      transition: "opacity 0.2s ease",
    });
    titleWrap.appendChild(changeDot);
    header.appendChild(titleWrap);

    const closeBtn = document.createElement("button");
    css(closeBtn, {
      background: "none",
      border: "none",
      cursor: "pointer",
      padding: "4px",
      borderRadius: "6px",
      color: T.textMuted,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      transition: "background 0.15s, color 0.15s",
    });
    closeBtn.innerHTML = icons.close;
    closeBtn.title = t("cancel") || "Cancel";
    closeBtn.onmouseenter = () => {
      css(closeBtn, { background: T.surfaceHover, color: T.text });
    };
    closeBtn.onmouseleave = () => {
      css(closeBtn, { background: "none", color: T.textMuted });
    };
    closeBtn.onclick = () => cancelPanel();
    header.appendChild(closeBtn);
    panel.appendChild(header);

    // ─── UI builder helpers ───────────────────────────────────
    function createSection(labelText, startExpanded) {
      const section = document.createElement("div");

      const sectionHeader = document.createElement("div");
      css(sectionHeader, {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 16px",
        cursor: "pointer",
        userSelect: "none",
        transition: "background 0.15s",
      });
      sectionHeader.onmouseenter = () => {
        sectionHeader.style.background = T.surfaceHover;
      };
      sectionHeader.onmouseleave = () => {
        sectionHeader.style.background = "transparent";
      };

      const lbl = document.createElement("div");
      css(lbl, {
        fontSize: "11px",
        fontWeight: "600",
        color: T.textMuted,
        textTransform: "uppercase",
        letterSpacing: "0.06em",
      });
      lbl.textContent = labelText;

      const chevron = document.createElement("span");
      chevron.innerHTML = icons.chevron;
      chevron.className = "dp-chevron" + (startExpanded ? "" : " collapsed");
      css(chevron, {
        color: T.textFaint,
        display: "flex",
        alignItems: "center",
      });

      sectionHeader.appendChild(lbl);
      sectionHeader.appendChild(chevron);
      section.appendChild(sectionHeader);

      const content = document.createElement("div");
      content.className =
        "dp-section-body" + (startExpanded ? "" : " collapsed");
      css(content, { padding: "0 16px 12px" });
      if (startExpanded) {
        content.style.maxHeight = "600px";
        content.style.opacity = "1";
      }

      sectionHeader.onclick = () => {
        const isCollapsed = content.classList.contains("collapsed");
        if (isCollapsed) {
          content.classList.remove("collapsed");
          content.style.maxHeight = "600px";
          content.style.opacity = "1";
          chevron.classList.remove("collapsed");
        } else {
          content.classList.add("collapsed");
          chevron.classList.add("collapsed");
        }
      };

      section.appendChild(content);
      section._content = content;
      return section;
    }

    function createRow(items, opts) {
      const row = document.createElement("div");
      css(row, {
        display: "flex",
        alignItems: "center",
        gap: "10px",
        marginBottom: opts?.mb || "8px",
      });
      items.forEach((item) => row.appendChild(item));
      return row;
    }

    function createLabel(text) {
      const lbl = document.createElement("span");
      css(lbl, {
        fontSize: "12px",
        color: T.textMuted,
        minWidth: "70px",
        flexShrink: "0",
      });
      lbl.textContent = text;
      return lbl;
    }

    function createColorInput(initialValue, onChange) {
      const wrapper = document.createElement("div");
      css(wrapper, {
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        flex: "1",
      });

      // Top row: color input + hex display
      const topRow = document.createElement("div");
      css(topRow, { display: "flex", alignItems: "center", gap: "8px" });

      const colorInput = document.createElement("input");
      colorInput.type = "color";
      colorInput.value = initialValue || "#000000";
      css(colorInput, {
        width: "36px",
        height: "36px",
        borderRadius: "50%",
        border: "2px solid " + T.inputBorder,
        cursor: "pointer",
        background: T.inputBg,
        flexShrink: "0",
        transition: "border-color 0.15s",
      });
      colorInput.onfocus = () => {
        colorInput.style.borderColor = T.accent;
      };
      colorInput.onblur = () => {
        colorInput.style.borderColor = T.inputBorder;
      };

      const hexDisplay = document.createElement("span");
      css(hexDisplay, {
        fontSize: "11px",
        color: T.textMuted,
        fontFamily: "monospace",
        letterSpacing: "0.02em",
      });
      hexDisplay.textContent = initialValue || "#000000";

      colorInput.oninput = (e) => {
        hexDisplay.textContent = e.target.value;
        onChange(e.target.value);
        // Update active swatch ring
        swatchEls.forEach((s) => {
          s.style.boxShadow =
            s.dataset.color === e.target.value
              ? "0 0 0 2px " + T.accent
              : "none";
        });
      };

      topRow.appendChild(colorInput);
      topRow.appendChild(hexDisplay);
      wrapper.appendChild(topRow);

      // Preset swatches — circular, organized
      const swatchGrid = document.createElement("div");
      css(swatchGrid, {
        display: "grid",
        gridTemplateColumns: "repeat(8, 1fr)",
        gap: "4px",
      });
      const presetColors = [
        "#000000",
        "#374151",
        "#6b7280",
        "#9ca3af",
        "#d1d5db",
        "#e5e7eb",
        "#f3f4f6",
        "#ffffff",
        "#ef4444",
        "#f97316",
        "#eab308",
        "#22c55e",
        "#14b8a6",
        "#3b82f6",
        "#8b5cf6",
        "#ec4899",
      ];
      const swatchEls = [];
      presetColors.forEach((c) => {
        const swatch = document.createElement("div");
        swatch.dataset.color = c;
        css(swatch, {
          width: "24px",
          height: "24px",
          borderRadius: "50%",
          cursor: "pointer",
          background: c,
          border:
            "1px solid " +
            (c === "#ffffff" || c === "#f3f4f6" || c === "#e5e7eb"
              ? T.borderStrong
              : "transparent"),
          transition: "transform 0.12s ease, box-shadow 0.12s ease",
          boxShadow: c === initialValue ? "0 0 0 2px " + T.accent : "none",
        });
        swatch.onmouseenter = () => {
          swatch.style.transform = "scale(1.18)";
        };
        swatch.onmouseleave = () => {
          swatch.style.transform = "scale(1)";
        };
        swatch.onclick = () => {
          colorInput.value = c;
          hexDisplay.textContent = c;
          onChange(c);
          swatchEls.forEach((s) => {
            s.style.boxShadow = "none";
          });
          swatch.style.boxShadow = "0 0 0 2px " + T.accent;
        };
        swatchEls.push(swatch);
        swatchGrid.appendChild(swatch);
      });
      wrapper.appendChild(swatchGrid);
      return wrapper;
    }

    function createSlider(min, max, initialValue, unit, onChange) {
      const wrapper = document.createElement("div");
      css(wrapper, {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        flex: "1",
      });

      const slider = document.createElement("input");
      slider.type = "range";
      slider.min = min;
      slider.max = max;
      slider.value = initialValue;
      css(slider, { flex: "1" });

      const valueDisplay = document.createElement("span");
      css(valueDisplay, {
        fontSize: "11px",
        color: T.textMuted,
        minWidth: "34px",
        textAlign: "right",
        fontFamily: "monospace",
        fontVariantNumeric: "tabular-nums",
      });
      valueDisplay.textContent = initialValue + unit;

      slider.oninput = (e) => {
        valueDisplay.textContent = e.target.value + unit;
        onChange(e.target.value);
      };

      wrapper.appendChild(slider);
      wrapper.appendChild(valueDisplay);
      return wrapper;
    }

    function createSelect(options, initialValue, onChange) {
      let currentValue = initialValue;
      const wrapper = document.createElement("div");
      css(wrapper, { position: "relative", flex: "1" });

      const trigger = document.createElement("button");
      css(trigger, {
        width: "100%",
        padding: "6px 28px 6px 10px",
        borderRadius: "8px",
        border: "1px solid " + T.inputBorder,
        fontSize: "12px",
        background: T.inputBg,
        color: T.text,
        cursor: "pointer",
        outline: "none",
        transition: "border-color 0.15s",
        textAlign: "left",
        fontFamily: "inherit",
        position: "relative",
      });
      const currentLabel = options.find(([v]) => v === initialValue);
      trigger.textContent = currentLabel ? currentLabel[1] : initialValue;

      // Chevron
      const arrow = document.createElement("span");
      arrow.innerHTML =
        '<svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M3 4l2 2 2-2" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      css(arrow, {
        position: "absolute",
        right: "8px",
        top: "50%",
        transform: "translateY(-50%)",
        color: T.textFaint,
        pointerEvents: "none",
        display: "flex",
      });
      trigger.appendChild(arrow);

      // Dropdown
      const dropdown = document.createElement("div");
      css(dropdown, {
        position: "absolute",
        top: "calc(100% + 4px)",
        left: "0",
        right: "0",
        background: T.bg,
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid " + T.borderStrong,
        borderRadius: "8px",
        overflow: "hidden",
        zIndex: "10",
        display: "none",
        boxShadow: "0 4px 16px rgba(0,0,0,0.10)",
      });

      options.forEach(([val, label]) => {
        const item = document.createElement("div");
        css(item, {
          padding: "6px 10px",
          fontSize: "12px",
          cursor: "pointer",
          color: val === currentValue ? T.accent : T.text,
          fontWeight: val === currentValue ? "600" : "400",
          background: "transparent",
          transition: "background 0.1s",
        });
        item.textContent = label;
        item.onmouseenter = () => {
          item.style.background = T.surfaceHover;
        };
        item.onmouseleave = () => {
          item.style.background = "transparent";
        };
        item.onclick = (e) => {
          e.stopPropagation();
          currentValue = val;
          trigger.textContent = label;
          trigger.appendChild(arrow);
          dropdown.style.display = "none";
          // Update active states
          [...dropdown.children].forEach((d, i) => {
            css(d, {
              color: options[i][0] === val ? T.accent : T.text,
              fontWeight: options[i][0] === val ? "600" : "400",
            });
          });
          onChange(val);
        };
        dropdown.appendChild(item);
      });

      let isOpen = false;
      trigger.onclick = () => {
        isOpen = !isOpen;
        dropdown.style.display = isOpen ? "block" : "none";
        trigger.style.borderColor = isOpen ? T.accent : T.inputBorder;
      };
      // Close on outside click
      const closeDropdown = (e) => {
        if (!wrapper.contains(e.target)) {
          isOpen = false;
          dropdown.style.display = "none";
          trigger.style.borderColor = T.inputBorder;
        }
      };
      document.addEventListener("mousedown", closeDropdown);

      wrapper.appendChild(trigger);
      wrapper.appendChild(dropdown);
      wrapper._cleanup = () =>
        document.removeEventListener("mousedown", closeDropdown);
      return wrapper;
    }

    function createIconButtonGroup(options, initialValue, onChange) {
      const group = document.createElement("div");
      css(group, {
        display: "flex",
        borderRadius: "8px",
        overflow: "hidden",
        border: "1px solid " + T.inputBorder,
        background: T.inputBg,
      });
      const buttons = [];
      options.forEach(([val, html], i) => {
        const btn = document.createElement("button");
        const isActive = val === initialValue;
        css(btn, {
          flex: "1",
          padding: "6px 8px",
          border: "none",
          borderRight:
            i < options.length - 1 ? "1px solid " + T.inputBorder : "none",
          background: isActive ? T.accent : "transparent",
          color: isActive ? "#fff" : T.textMuted,
          fontSize: "12px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.15s ease",
        });
        btn.innerHTML = html;
        btn.onclick = () => {
          buttons.forEach((b) =>
            css(b, { background: "transparent", color: T.textMuted }),
          );
          css(btn, { background: T.accent, color: "#fff" });
          onChange(val);
        };
        buttons.push(btn);
        group.appendChild(btn);
      });
      return group;
    }

    function createButtonGroup(options, initialValue, onChange) {
      const group = document.createElement("div");
      css(group, {
        display: "flex",
        borderRadius: "8px",
        overflow: "hidden",
        border: "1px solid " + T.inputBorder,
        background: T.inputBg,
      });
      const buttons = [];
      options.forEach(([val, label], i) => {
        const btn = document.createElement("button");
        const isActive = val === initialValue;
        css(btn, {
          flex: "1",
          padding: "5px 8px",
          border: "none",
          borderRight:
            i < options.length - 1 ? "1px solid " + T.inputBorder : "none",
          background: isActive ? T.accent : "transparent",
          color: isActive ? "#fff" : T.textMuted,
          fontSize: "11px",
          cursor: "pointer",
          transition: "all 0.15s ease",
          fontWeight: "500",
        });
        btn.textContent = label;
        btn.onclick = () => {
          buttons.forEach((b) =>
            css(b, { background: "transparent", color: T.textMuted }),
          );
          css(btn, { background: T.accent, color: "#fff" });
          onChange(val);
        };
        buttons.push(btn);
        group.appendChild(btn);
      });
      return group;
    }

    function createSpacingGrid(type, sides, computed, applyStyleFn) {
      const container = document.createElement("div");
      css(container, { marginBottom: "10px" });

      const labelRow = document.createElement("div");
      css(labelRow, {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "6px",
      });

      const lbl = document.createElement("div");
      css(lbl, { fontSize: "12px", color: T.textMuted, fontWeight: "500" });
      lbl.textContent =
        type === "padding"
          ? t("dpPadding") || "Padding"
          : t("dpMargin") || "Margin";
      labelRow.appendChild(lbl);

      let linked = false;
      const linkBtn = document.createElement("button");
      css(linkBtn, {
        background: "none",
        border: "1px solid " + T.inputBorder,
        borderRadius: "6px",
        cursor: "pointer",
        padding: "3px 6px",
        color: T.textFaint,
        display: "flex",
        alignItems: "center",
        transition: "all 0.15s",
      });
      linkBtn.innerHTML = icons.link;
      linkBtn.title = "Link all sides";
      linkBtn.onclick = () => {
        linked = !linked;
        css(linkBtn, {
          background: linked ? T.accent : "none",
          color: linked ? "#fff" : T.textFaint,
          borderColor: linked ? T.accent : T.inputBorder,
        });
      };
      labelRow.appendChild(linkBtn);
      container.appendChild(labelRow);

      // Side labels + inputs in a modern grid
      const grid = document.createElement("div");
      css(grid, {
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: "4px",
      });

      // Labels
      ["T", "R", "B", "L"].forEach((hint) => {
        const h = document.createElement("div");
        css(h, {
          fontSize: "9px",
          color: T.textFaint,
          textAlign: "center",
          fontWeight: "600",
          letterSpacing: "0.05em",
          marginBottom: "2px",
        });
        h.textContent = hint;
        grid.appendChild(h);
      });

      // Inputs
      const inputs = [];
      sides.forEach((side) => {
        const input = document.createElement("input");
        input.type = "number";
        input.min = type === "padding" ? "0" : "-100";
        input.max = "200";
        input.value = parseInt(computed[type + side]) || 0;
        css(input, {
          width: "100%",
          padding: "6px 4px",
          borderRadius: "8px",
          border: "1px solid " + T.inputBorder,
          fontSize: "12px",
          textAlign: "center",
          boxSizing: "border-box",
          background: T.inputBg,
          color: T.text,
          outline: "none",
          transition: "border-color 0.15s",
        });
        input.onfocus = () => {
          input.style.borderColor = T.accent;
        };
        input.onblur = () => {
          input.style.borderColor = T.inputBorder;
        };
        input.oninput = (e) => {
          const val = e.target.value;
          if (linked) {
            inputs.forEach((inp) => {
              inp.value = val;
            });
            sides.forEach((s) => applyStyleFn(type + s, val + "px"));
          } else {
            applyStyleFn(type + side, val + "px");
          }
        };
        inputs.push(input);
        grid.appendChild(input);
      });
      container.appendChild(grid);
      return container;
    }

    // ─── Get computed styles ──────────────────────────────────
    const computed = window.getComputedStyle(el);

    function rgbToHex(rgb) {
      if (!rgb || rgb === "transparent" || rgb === "rgba(0, 0, 0, 0)")
        return "#ffffff";
      const match = rgb.match(/\d+/g);
      if (!match || match.length < 3) return "#000000";
      return (
        "#" +
        match
          .slice(0, 3)
          .map((x) => parseInt(x).toString(16).padStart(2, "0"))
          .join("")
      );
    }

    // ─── Colors Section (expanded) ────────────────────────────
    function createColorBlock(labelText, initialValue, onChange) {
      const block = document.createElement("div");
      css(block, { marginBottom: "12px" });
      const lbl = document.createElement("div");
      css(lbl, { fontSize: "12px", color: T.textMuted, marginBottom: "6px" });
      lbl.textContent = labelText;
      block.appendChild(lbl);
      block.appendChild(createColorInput(initialValue, onChange));
      return block;
    }
    const colorsSection = createSection(t("dpColors") || "Colors", true);
    colorsSection._content.appendChild(
      createColorBlock(
        t("dpBackground") || "Background",
        rgbToHex(computed.backgroundColor),
        (v) => applyStyle("backgroundColor", v),
      ),
    );
    colorsSection._content.appendChild(
      createColorBlock(
        t("dpTextColor") || "Text color",
        rgbToHex(computed.color),
        (v) => applyStyle("color", v),
      ),
    );
    panel.appendChild(colorsSection);

    // ─── Typography Section (collapsed) ───────────────────────
    const typoSection = createSection(t("dpTypography") || "Typography", false);
    const currentFontSize = parseInt(computed.fontSize) || 16;
    typoSection._content.appendChild(
      createRow([
        createLabel(t("dpFontSize") || "Size"),
        createSlider(8, 96, currentFontSize, "px", (v) =>
          applyStyle("fontSize", v + "px"),
        ),
      ]),
    );
    typoSection._content.appendChild(
      createRow([
        createLabel(t("dpFontWeight") || "Weight"),
        createSelect(
          [
            ["100", "Thin"],
            ["200", "ExtraLight"],
            ["300", "Light"],
            ["400", "Regular"],
            ["500", "Medium"],
            ["600", "Semibold"],
            ["700", "Bold"],
            ["800", "ExtraBold"],
            ["900", "Black"],
          ],
          computed.fontWeight,
          (v) => applyStyle("fontWeight", v),
        ),
      ]),
    );
    typoSection._content.appendChild(
      createRow([
        createLabel(t("dpTextAlign") || "Align"),
        createIconButtonGroup(
          [
            ["left", icons.alignLeft],
            ["center", icons.alignCenter],
            ["right", icons.alignRight],
          ],
          computed.textAlign,
          (v) => applyStyle("textAlign", v),
        ),
      ]),
    );
    const currentLetterSpacing = parseFloat(computed.letterSpacing) || 0;
    typoSection._content.appendChild(
      createRow([
        createLabel(t("dpLetterSpacing") || "Spacing"),
        createSlider(-2, 12, Math.round(currentLetterSpacing), "px", (v) =>
          applyStyle("letterSpacing", v + "px"),
        ),
      ]),
    );
    panel.appendChild(typoSection);

    // ─── Spacing Section (collapsed) ──────────────────────────
    const spacingSection = createSection(t("dpSpacing") || "Spacing", false);
    const spacingSides = ["Top", "Right", "Bottom", "Left"];
    spacingSection._content.appendChild(
      createSpacingGrid("padding", spacingSides, computed, applyStyle),
    );
    spacingSection._content.appendChild(
      createSpacingGrid("margin", spacingSides, computed, applyStyle),
    );
    spacingSection._content.appendChild(
      createRow([
        createLabel(t("dpGap") || "Gap"),
        createSlider(0, 80, parseInt(computed.gap) || 0, "px", (v) =>
          applyStyle("gap", v + "px"),
        ),
      ]),
    );
    panel.appendChild(spacingSection);

    // ─── Border & Effects Section (collapsed) ─────────────────
    const borderSection = createSection(
      t("dpBorderEffects") || "Border & Effects",
      false,
    );
    borderSection._content.appendChild(
      createRow([
        createLabel(t("dpBorderRadius") || "Radius"),
        createSlider(0, 60, parseInt(computed.borderRadius) || 0, "px", (v) =>
          applyStyle("borderRadius", v + "px"),
        ),
      ]),
    );
    borderSection._content.appendChild(
      createRow([
        createLabel(t("dpBorderWidth") || "Border"),
        createSlider(0, 12, parseInt(computed.borderWidth) || 0, "px", (v) =>
          applyStyle("borderWidth", v + "px"),
        ),
      ]),
    );
    borderSection._content.appendChild(
      createColorBlock(
        t("dpBorderColor") || "Border color",
        rgbToHex(computed.borderColor),
        (v) => {
          applyStyle("borderColor", v);
          applyStyle("borderStyle", "solid");
        },
      ),
    );
    borderSection._content.appendChild(
      createRow([
        createLabel(t("dpShadow") || "Shadow"),
        createButtonGroup(
          [
            ["none", "None"],
            ["0 1px 3px rgba(0,0,0,0.12)", "S"],
            ["0 4px 12px rgba(0,0,0,0.10)", "M"],
            ["0 12px 32px rgba(0,0,0,0.15)", "L"],
            ["0 24px 56px rgba(0,0,0,0.2)", "XL"],
          ],
          "none",
          (v) => applyStyle("boxShadow", v),
        ),
      ]),
    );
    const currentOpacity = Math.round(
      (parseFloat(computed.opacity) || 1) * 100,
    );
    borderSection._content.appendChild(
      createRow([
        createLabel(t("dpOpacity") || "Opacity"),
        createSlider(0, 100, currentOpacity, "%", (v) =>
          applyStyle("opacity", String(parseInt(v) / 100)),
        ),
      ]),
    );
    panel.appendChild(borderSection);

    // ─── Footer ───────────────────────────────────────────────
    const footer = document.createElement("div");
    css(footer, {
      padding: "12px 16px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      borderTop: "1px solid " + T.border,
      position: "sticky",
      bottom: "0",
      background: T.bg,
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      borderRadius: "0 0 16px 16px",
    });

    const cancelBtn = document.createElement("button");
    cancelBtn.textContent = t("cancel") || "Cancel";
    css(cancelBtn, {
      padding: "7px 16px",
      borderRadius: "8px",
      border: "1px solid " + T.cancelBorder,
      background: T.cancelBg,
      color: T.cancelText,
      fontSize: "13px",
      fontWeight: "500",
      cursor: "pointer",
      transition: "all 0.15s ease",
    });
    cancelBtn.onmouseenter = () => {
      css(cancelBtn, {
        background: T.cancelBgHover,
        borderColor: T.borderStrong,
      });
    };
    cancelBtn.onmouseleave = () => {
      css(cancelBtn, { background: T.cancelBg, borderColor: T.cancelBorder });
    };
    cancelBtn.onclick = () => cancelPanel();

    applyBtn = document.createElement("button");
    css(applyBtn, {
      padding: "7px 18px",
      borderRadius: "8px",
      border: "none",
      background: T.accent,
      color: "#fff",
      fontSize: "13px",
      fontWeight: "500",
      cursor: "pointer",
      transition: "all 0.15s ease",
      opacity: "0.4",
      pointerEvents: "none",
      display: "flex",
      alignItems: "center",
      gap: "6px",
    });
    const applyCheck = document.createElement("span");
    applyCheck.innerHTML =
      '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7l3 3 5-5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    css(applyCheck, { display: "flex", alignItems: "center" });
    const applyText = document.createElement("span");
    applyText.className = "dp-apply-text";
    applyText.textContent = t("apply") || "Apply";
    applyBtn.appendChild(applyCheck);
    applyBtn.appendChild(applyText);
    applyBtn.onmouseenter = () => {
      if (Object.keys(changedProps).length > 0)
        applyBtn.style.background = T.accentHover;
    };
    applyBtn.onmouseleave = () => {
      applyBtn.style.background = T.accent;
    };
    applyBtn.onclick = () => applyPanel();

    footer.appendChild(cancelBtn);
    footer.appendChild(applyBtn);
    panel.appendChild(footer);

    // ─── Add panel to DOM ─────────────────────────────────────
    document.body.appendChild(panel);

    // Highlight the element being designed
    const originalOutline = el.style.outline;
    const originalOutlineOffset = el.style.outlineOffset;
    el.style.outline = "2px solid " + T.accent;
    el.style.outlineOffset = "3px";

    // ─── Panel close logic ────────────────────────────────────
    let handleDragMove = null;
    let handleDragEnd = null;
    let handleOutsideClick = null;
    let outsideClickTimeout = null;

    function cleanupPanel() {
      el.style.outline = originalOutline;
      el.style.outlineOffset = originalOutlineOffset;
      if (outsideClickTimeout) clearTimeout(outsideClickTimeout);
      if (handleDragMove)
        document.removeEventListener("mousemove", handleDragMove);
      if (handleDragEnd) document.removeEventListener("mouseup", handleDragEnd);
      if (handleOutsideClick)
        document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handlePanelEscape);
      // Cleanup custom select listeners
      panel.querySelectorAll("[data-kleap-ui] div").forEach((el) => {
        if (el._cleanup) el._cleanup();
      });
      panel.remove();
    }

    function cancelPanel() {
      trackedProps.forEach((p) => {
        el.style[p] = originalStyles[p];
      });
      cleanupPanel();
    }

    function applyPanel() {
      if (Object.keys(changedProps).length > 0) {
        // === STYLE OVERRIDE BRIDGE ===
        // Inject a <style> tag that keeps the visual stable during HMR.
        // Without this, saving the file triggers HMR → React re-render → inline styles lost → flash.
        // The override uses !important to beat Tailwind classes until HMR settles.
        const kleapId = el.getAttribute("data-kleap-id");
        if (kleapId) {
          const cssProps = Object.entries(changedProps)
            .map(([prop, value]) => {
              // camelCase to kebab-case
              const kebab = prop.replace(/([A-Z])/g, "-$1").toLowerCase();
              return `${kebab}: ${value} !important`;
            })
            .join("; ");
          const overrideId = "kleap-style-override-" + kleapId;
          // Remove previous override for this element
          const existing = document.getElementById(overrideId);
          if (existing) existing.remove();
          const styleTag = document.createElement("style");
          styleTag.id = overrideId;
          styleTag.textContent = `[data-kleap-id="${kleapId}"] { ${cssProps} }`;
          document.head.appendChild(styleTag);
          // Auto-remove after HMR has settled (5s) — Tailwind classes take over
          setTimeout(() => {
            document.getElementById(overrideId)?.remove();
          }, 5000);
        }

        // Walk up to find closest data-kleap-source (webpack-injected file:line)
        let sourceLocation = "";
        let srcEl = el;
        while (srcEl && srcEl !== document.body) {
          const src = srcEl.getAttribute("data-kleap-source");
          if (src) { sourceLocation = src; break; }
          srcEl = srcEl.parentElement;
        }

        window.parent.postMessage(
          {
            type: "kleap-style-edited",
            kleapId: el.getAttribute("data-kleap-id") || el.id || "",
            kleapPath: el.getAttribute("data-kleap-path") || getElementPath(el),
            className: (typeof el.className === "string" ? el.className : "") || "",
            textContent: el.textContent ? el.textContent.trim().substring(0, 100) : "",
            tagName: el.tagName.toLowerCase(),
            sourceLocation: sourceLocation,
            changes: changedProps,
          },
          "*",
        );
      }
      cleanupPanel();
    }

    function handlePanelEscape(e) {
      if (e.key === "Escape") cancelPanel();
    }
    document.addEventListener("keydown", handlePanelEscape);

    handleOutsideClick = (e) => {
      if (
        !panel.contains(e.target) &&
        e.target !== el &&
        !el.contains(e.target)
      ) {
        cancelPanel();
      }
    };
    outsideClickTimeout = setTimeout(() => {
      document.addEventListener("mousedown", handleOutsideClick);
    }, 100);

    // Make panel draggable by header
    let isDragging = false;
    let dragOffsetX = 0,
      dragOffsetY = 0;
    header.style.cursor = "grab";
    header.onmousedown = (e) => {
      if (e.target === closeBtn || closeBtn.contains(e.target)) return;
      isDragging = true;
      header.style.cursor = "grabbing";
      dragOffsetX = e.clientX - panel.getBoundingClientRect().left;
      dragOffsetY = e.clientY - panel.getBoundingClientRect().top;
    };
    handleDragMove = (e) => {
      if (!isDragging) return;
      panel.style.left = e.clientX - dragOffsetX + "px";
      panel.style.top = e.clientY - dragOffsetY + "px";
    };
    handleDragEnd = () => {
      if (isDragging) {
        isDragging = false;
        header.style.cursor = "grab";
      }
    };
    document.addEventListener("mousemove", handleDragMove);
    document.addEventListener("mouseup", handleDragEnd);
  }

  function enableInlineEdit(el) {
    // Store original state
    const originalText = el.textContent;
    const originalHTML = el.innerHTML;

    // Store ALL original styles
    const originalStyles = {
      outline: el.style.outline,
      outlineOffset: el.style.outlineOffset,
      boxShadow: el.style.boxShadow,
      cursor: el.style.cursor,
      contentEditable: el.contentEditable,
      // Don't modify background, border, or any other styles!
    };

    // Make element editable
    el.contentEditable = "true";
    el.focus();

    // Add ONLY non-intrusive visual feedback
    css(el, {
      outline: "2px solid #ff0055",
      outlineOffset: "3px",
      cursor: "text",
      boxShadow:
        "0 0 0 4px rgba(255, 0, 85, 0.1), 0 4px 12px rgba(0, 0, 0, 0.08)",
      // DO NOT change background, border, borderRadius, or any other properties!
    });

    // Select all text
    const range = document.createRange();
    range.selectNodeContents(el);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);

    // Handle blur to save changes
    const handleBlur = () => {
      const newText = el.textContent;

      if (newText !== originalText) {
        // Show saving status on the border
        css(el, {
          outline: "2px solid #FFA500", // Orange for saving
          boxShadow:
            "0 0 0 4px rgba(255, 165, 0, 0.2), 0 4px 12px rgba(0, 0, 0, 0.08)",
        });

        // Send the change to parent
        // Generate ID and name if not present
        const id =
          el.dataset.kleapId ||
          `element-${Math.random().toString(36).substr(2, 9)}`;
        let name = el.dataset.kleapName || el.tagName.toLowerCase();

        if (
          !el.dataset.kleapName &&
          el.className &&
          typeof el.className === "string"
        ) {
          const classes = el.className
            .trim()
            .split(" ")
            .filter((c) => c);
          if (classes.length > 0) {
            name = `${el.tagName.toLowerCase()}.${classes[0]}`;
          }
        }

        window.parent.postMessage(
          {
            type: "kleap-text-edited",
            id: id,
            name: name,
            path: el.dataset.kleapPath || getElementPath(el),
            oldText: originalText,
            newText: newText,
            tagName: el.tagName.toLowerCase(),
          },
          "*",
        );

        // Show success after a moment
        setTimeout(() => {
          css(el, {
            outline: "2px solid #00C851", // Green for success
            boxShadow:
              "0 0 0 4px rgba(0, 200, 81, 0.2), 0 4px 12px rgba(0, 0, 0, 0.08)",
          });

          // Remove all styles after showing success
          setTimeout(() => {
            el.contentEditable = originalStyles.contentEditable || "false";
            css(el, {
              outline: originalStyles.outline || "",
              outlineOffset: originalStyles.outlineOffset || "",
              boxShadow: originalStyles.boxShadow || "",
              cursor: originalStyles.cursor || "",
            });
          }, 1000);
        }, 500);
      } else {
        // Restore original HTML if no changes
        el.innerHTML = originalHTML;

        // Restore styles immediately if no changes
        el.contentEditable = originalStyles.contentEditable || "false";
        css(el, {
          outline: originalStyles.outline || "",
          outlineOffset: originalStyles.outlineOffset || "",
          boxShadow: originalStyles.boxShadow || "",
          cursor: originalStyles.cursor || "",
        });
      }

      el.removeEventListener("blur", handleBlur);
      el.removeEventListener("keydown", handleKeydown);
    };

    // Handle escape key to cancel
    const handleKeydown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        el.innerHTML = originalHTML;
        el.blur();
      }
    };

    el.addEventListener("blur", handleBlur);
    el.addEventListener("keydown", handleKeydown);
  }

  function makeOverlay() {
    overlay = document.createElement("div");
    overlay.id = OVERLAY_ID;
    css(overlay, {
      position: "absolute",
      border: "2px solid #ff0055",
      background: "rgba(255,0,85,.05)",
      pointerEvents: "none",
      zIndex: "2147483647", // max
      borderRadius: "8px",
      boxShadow: "0 0 0 1px rgba(255,0,85,0.2), 0 4px 12px rgba(0,0,0,0.08)",
      transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
    });

    label = document.createElement("div");
    css(label, {
      position: "absolute",
      left: "50%",
      top: "100%",
      transform: "translateX(-50%) translateY(8px)",
      background: "linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)",
      color: "#fff",
      fontFamily:
        "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      fontSize: "13px",
      fontWeight: "500",
      lineHeight: "1.4",
      padding: "0",
      borderRadius: "12px",
      boxShadow:
        "0 8px 32px rgba(0,0,0,0.24), 0 2px 8px rgba(0,0,0,0.16), inset 0 1px 0 rgba(255,255,255,0.06)",
      border: "1px solid rgba(255,255,255,0.08)",
      overflow: "hidden",
      minWidth: "180px",
      animation: "kleapFadeIn 0.2s ease-out",
      pointerEvents: "auto", // Enable clicks on the label
    });
    overlay.appendChild(label);
    document.body.appendChild(overlay);

    // Add animation keyframes
    const style = document.createElement("style");
    style.textContent = `
      @keyframes kleapFadeIn {
        from {
          opacity: 0;
          transform: translateX(-50%) translateY(4px);
        }
        to {
          opacity: 1;
          transform: translateX(-50%) translateY(8px);
        }
      }
      
      #${OVERLAY_ID} .kleap-option {
        transition: all 0.15s ease;
      }
      
      #${OVERLAY_ID} .kleap-option:hover {
        background: rgba(255,255,255,0.06);
      }
      
      #${OVERLAY_ID} .kleap-option:active {
        transform: scale(0.98);
      }
    `;
    document.head.appendChild(style);
  }

  function updateOverlay(el) {
    if (!overlay) makeOverlay();

    const rect = el.getBoundingClientRect();
    css(overlay, {
      top: `${rect.top + window.scrollY}px`,
      left: `${rect.left + window.scrollX}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
      display: "block",
    });

    // Clear previous contents
    while (label.firstChild) {
      label.removeChild(label.firstChild);
    }

    // Always show minimal info when hovering
    const info = document.createElement("div");
    css(info, {
      padding: "8px 12px",
      fontSize: "12px",
      opacity: "0.9",
    });

    // Get a descriptive name for the element
    let name = el.dataset.kleapName || el.tagName.toLowerCase();

    // Try to get a better description
    if (!el.dataset.kleapName) {
      const tag = el.tagName.toLowerCase();

      // Add class names if available
      if (el.className && typeof el.className === "string") {
        const classes = el.className
          .trim()
          .split(" ")
          .filter((c) => c && !c.startsWith("_"));
        if (classes.length > 0) {
          // Filter out utility classes
          const meaningfulClass = classes.find(
            (c) =>
              !c.match(
                /^(flex|grid|block|inline|absolute|relative|fixed|sticky|w-|h-|p-|m-|text-|bg-|border-|rounded-|shadow-|opacity-|z-)/,
              ),
          );
          name = meaningfulClass
            ? `${tag}.${meaningfulClass}`
            : `${tag}.${classes[0]}`;
        }
      } else if (el.id) {
        name = `${tag}#${el.id}`;
      } else if (el.getAttribute("aria-label")) {
        name = `${tag}[${el.getAttribute("aria-label")}]`;
      } else if (el.getAttribute("role")) {
        name = `${tag}[role=${el.getAttribute("role")}]`;
      }
    }

    let actionHint = "";
    if (isTextElement(el)) {
      actionHint = " • Click for options";
    } else if (isImageElement(el)) {
      actionHint = " • Click for options";
    }
    info.textContent = name + actionHint;
    label.appendChild(info);
  }

  /* ---------- event handlers -------------------------------------------- */
  function onMouseMove(e) {
    if (state.type !== "inspecting") return;

    let el = e.target;

    // Don't require data-kleap-id - any element can be selected
    // Skip only truly non-selectable elements
    const nonSelectableTags = [
      "SCRIPT",
      "STYLE",
      "META",
      "LINK",
      "HTML",
      "BODY",
    ];
    while (el && nonSelectableTags.includes(el.tagName)) {
      el = el.parentElement;
    }

    if (state.element === el) return;
    state.element = el;

    if (el) {
      updateOverlay(el);
    } else {
      if (overlay) overlay.style.display = "none";
    }
  }

  function onClick(e) {
    if (state.type !== "inspecting" || !state.element) return;
    e.preventDefault();
    e.stopPropagation();

    const el = state.element;

    // If it's a text element, show text menu (edit or mention to AI)
    if (isTextElement(el)) {
      showTextMenu(el);
      deactivate();
    } else if (isImageElement(el)) {
      // If it's an image, show image edit dialog
      enableImageEdit(el);
      deactivate();
    } else {
      // For non-text, non-image elements, show design + mention menu
      const rect = el.getBoundingClientRect();
      createMenu(rect, [
        {
          icon: icons.paintbrush,
          label: t("design"),
          action: () => showDesignPanel(el),
        },
        {
          icon: icons.messageCircle,
          label: t("mentionToAI"),
          action: () => sendToAI(el),
        },
      ]);
      deactivate();
    }
  }

  /* ---------- activation / deactivation --------------------------------- */
  function activate() {
    if (state.type === "inactive") {
      window.addEventListener("mousemove", onMouseMove, true);
      window.addEventListener("click", onClick, true);
    }
    state = { type: "inspecting", element: null };
    if (overlay) {
      overlay.style.display = "none";
    }
  }

  function deactivate() {
    if (state.type === "inactive") return;

    window.removeEventListener("mousemove", onMouseMove, true);
    window.removeEventListener("click", onClick, true);
    if (overlay) {
      overlay.remove();
      overlay = null;
      label = null;
    }
    state = { type: "inactive" };
  }

  /* ---------- message bridge -------------------------------------------- */
  window.addEventListener("message", (e) => {
    if (e.source !== window.parent) return;
    if (e.data.type === "activate-kleap-component-selector") activate();
    if (e.data.type === "deactivate-kleap-component-selector") deactivate();
  });

  function initializeComponentSelector() {
    if (!document.body) {
      console.error(
        "Kleap component selector initialization failed: document.body not found.",
      );
      return;
    }
    setTimeout(() => {
      if (document.body.querySelector("[data-kleap-id]")) {
        window.parent.postMessage(
          {
            type: "kleap-component-selector-initialized",
          },
          "*",
        );
        console.debug("Kleap component selector initialized");
      } else {
        console.warn(
          "Kleap component selector not initialized because no DOM elements were tagged",
        );
      }
    }, 0);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeComponentSelector);
  } else {
    initializeComponentSelector();
  }
})();
