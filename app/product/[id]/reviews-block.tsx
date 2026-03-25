// @ts-nocheck
"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, ThumbsUp, MapPin, Calendar } from "lucide-react";

interface Review {
  id: string;
  author: string;
  city: string;
  date: Date;
  rating: number;
  size?: string;
  color?: string;
  verified: boolean;
  title: string;
  content: string;
  helpful: number;
  images: string[];
}

interface ReviewsBlockProps {
  productName: string;
  category: string;
  productRating: number;
  totalReviews?: number;
}

// Статичные пулы отзывов (вне компонента для производительности)
const reviewPools = {
  compression: {
    positive: [
      "на зріст 182 і вагу 80 взяв розмір Л - сіли чудово. ношу вже 3 тижні постійно. на тренуваннях реально допомагає. м'язи менше гудуть. матеріал норм. 10 з 10 беру ще",
      "неймовірні [ITEM]! ідеально сідають. матеріал приємний до тіла. ношу вже місяць прання витримує. рекомендую",
      "чудова якість за свою ціну. [ITEM] добре тримають форму компресія помітна. після тренувань відчуття легші. дякую продавцю",
      "купував для змагань. [ITEM] не підвели сидять ідеально. матеріал дихає поту менше. результат на тренуваннях покращився. 5 зірок",
      "[ITEM] супер! якість на висоті шви рівні. ношу вже 2 місяці - вигляд як новий. замовляв ще для друга. все швидко доставили",
      "дуже задоволений покупкою. [ITEM] відповідають опису. розмір в точність. компресія допомагає при навантаженнях. рекомендую спортсменам",
      "якісні [ITEM] матеріал щільний але еластичний. добре підтримують м'язи. після пробіжки менше втомлююся. дякую за швидку доставку",
      "[ITEM] топ! сидять як влиті. матеріал приємний не викликає алергії. ношу щодня для профілактики. задоволений на 100%",
      "кращі [ITEM] які мав! ціна/якість - ідеально. компресія реально працює. вже рекомендував друзям в залі. всім дякую",
      "[ITEM] просто знахідка! легкі комфортні добре дихають. тренування стали приємнішими. результат є - м'язи менше болять",
      "взяв xl на 92 кг ідеально сіли. матеріал дихає. після тренувань ноги менше втомлюються. однозначно рекомендую",
      "я 185 см 85 кг взяв л ідеально. ношу 2 тижні на тренуваннях - результат є. компресія помітна. матеріал якісний"
    ],
    neutral: [
      "ну таке... [ITEM] нормальні сидять ок. матеріал не поганий. але чекав щось краще за ці гроші. в цілому піде",
      "хммм... [ITEM] великі трохи. довелося пояс підтягнути. колір норм. матеріал так собі. не знаю чи раджу. можливо вам підійдуть",
      "[ITEM] так собі... ношу 3 тижні. компресія є але слабка. матеріал дихає. блискавка хлипка боїться що скоро поламається. за такі гроші могло б бути краще",
      "звичайні [ITEM] нічого особливого. якість середня. ношу для тренувань але очікував кращого. за ціну нормально",
      "[ITEM] ок. сидять нормально матеріал середній. після прання трохи змінилися розміром. але для тренувань підходить",
      "на 175 см 70 кг взяв м - трохи великі. але носити можна. якість середня. за таку ціну піде",
      "[ITEM] нормальні але шви кривуваті. матеріал ок. компресія слабка. для домашніх тренувань підходить"
    ],
    negative: [
      "[ITEM] дешеві матеріал як папір. після 2 прань розірвалися на швах. компресія нульова. гроші на вітер. розчарован",
      "жах. все в синтетиці ноги потіють як божевільні. розмір взагалі не той - на 2 розміри більші. шви криві нитки скрізь. повернула",
      "не айс. [ITEM] незручні тиснуть. матеріал не дихає. після 10 хвилин ношення хочеться зняти. не раджу",
      "матеріал хорошый але синтетика. ноги потіють. для літа не піде точно. розчарований покупкою",
      "[ITEM] виглядають добре але матеріал 100% пластик. ноги потіють навіть взимку. мені сумно",
      "на 180 см взяв xl малі! розмірна сітка повна дичина. довелося повертати. гроші повернули але нервів наклала",
      "[ITEM] розірвалися на швах після першого ж тренування. якість жахлива. не рекомендую ніколи",
      "матеріал синтетика потіють жахливо. шви криві. блискавка зламалася через тиждень. марна трата грошей"
    ]
  },
  bandage: {
    positive: [
      "після травми гомілки лікар порадив. ношу 3 тижні - реально допомагає! біль пройшов повністю. матеріал чудовий не алергує. дякую",
      "чудовий [ITEM]! добре тримає суглоб фіксація надійна. матеріал м'який не натирає. використовую щодня. рекомендую",
      "[ITEM] рятує! ношу після роботи спина менше втомлюється. якість відмінна розмір універсальний. дякую продавцю",
      "лікар-ортопед схвалив цей [ITEM]! ношу після операції. фіксація чудова матеріал приємний. через тиждень вже ходив без болю",
      "дуже задоволена! [ITEM] ідеально підходить не сковує рухи. матеріал якісний не викликає подразнень. ношу вже місяць. 5 зірок",
      "[ITEM] просто знахідка! допомагає при навантаженнях біль зменшився. якість на висоті ціна прийнятна. рекомендую всім",
      "купував для батька. дуже задоволений каже що допомагає. матеріал якісний фіксація надійна. дякую за швидку доставку",
      "[ITEM] супер! легкий практичний добре тримає. ношу під час спорту. травми минули. всім дякую"
    ],
    neutral: [
      "[ITEM] нормальний тримає добре. але влітку жарко під ним. всі фіксатори такі. для літа краще світлий брати",
      "[ITEM] так собі... ремені занадто довгі. довелося в ательє скорочувати +50грн. за якість очікував кращого. розчарован",
      "нормальний [ITEM]. тримає ок. якість так собі. для домашнього використання піде",
      "[ITEM] ок. фіксація є але не надто сильна. матеріал середній. для профілактики підходить але для лікування слабо"
    ],
    negative: [
      "жах. тримає погано розтягується. гроші на вітер. не раджу",
      "тримає слабо. для спорту не піде. для дому ок",
      "матеріал дешевий шви криві. не купляйте це!",
      "не вартий грошей. після тижня використання розтягнувся. продавець ігнорує скарги",
      "[ITEM] розірвався через 3 дні. якість жахлива. не рекомендую",
      "фіксація нульова. матеріал синтетика. потіють жахливо. розчарований"
    ]
  },
  massager: {
    positive: [
      "купувала для спини після роботи. користуюся вечорами 15хв - реально допомагає! інтенсивність регулюється. батарея 3 дні тримає. чудово",
      "[ITEM] просто вогонь! кілька режимів вібрація приємна. батарея тримає довго. спина перестала боліти. рекомендую",
      "дуже задоволена покупкою! [ITEM] легкий зручний. інтенсивність регулюється батарея тримає 2 дні. користуюся щодня. дякую",
      "чудовий [ITEM]! допомагає розслабитися після роботи. вібрація м'яка шум мінімальний. батарея тримає 3 дні. 5 зірок",
      "[ITEM] супер! купував для мами. дуже задоволена каже що допомагає від болю в спині. якість відмінна. рекомендую",
      "працюю за компом 10 годин. [ITEM] - реальне спасіння для спини. купив вже другий для дому",
      "[ITEM] просто знахідка! легкий потужний батарея тримає довго. використовую для спини і ніг. результат чудовий",
      "дуже хороший [ITEM]! інтенсивність регулюється вібрація приємна. батарея тримає 2 дні. спина менше втомлюється. дякую",
      "купив для дружини. користуємося вечорами по черзі. [ITEM] дійсно допомагає розслабитися. вібрація м'яка. батарея 4 дні",
      "взяв для поперекової радикулопатії. лікар порадив. [ITEM] реально знімає біль. інтенсивність достатня. батарея 3 дні. рекомендую",
      "користуюся 2 тижні. [ITEM] допомагає при спазмах м'язів. режимів достатньо. батарея тримає 2.5 дні. задоволений",
      "дружина подарувала на день народження. [ITEM] чудовий! використовую щодня. вібрація приємна. батарея 3 дні. дякую!"
    ],
    neutral: [
      "[ITEM] ок але ГУЧНИЙ! вібрація приємна. батарея тримає. але вночі не користуватися - сусіди скаржаться",
      "користуюся вечорами. розслабляє сон кращий. інтенсивність норм. інструкція кривовата але розібралася",
      "слабкий [ITEM]... вібрація так собі. батарея швидко сідає. не вартий грошей",
      "[ITEM] нормальний. вібрація є але слабка. батарея тримає день. для розслаблення піде",
      "купував для спини. [ITEM] допомагає але не сильно. вібрація слабкувата. батарея тримає 1.5 дня. за ціну ок",
      "дружина користується. каже що [ITEM] нормальний. але шумить трохи. батарея на 2 дні максимум. так собі",
      "[ITEM] середній. вібрація є але не потужна. для легкого розслаблення піде. батарея 2 дні. ціна/якість норм"
    ],
    negative: [
      "більше не куплю. очікував потужнішу вібрацію. батарея сідає за день. шумить як трактор. повернув назад",
      "шумить як божевільний! сусіди вже скаржилися 2 рази. не користуюся ввечері",
      "не вартий уваги. вібрація майже не відчувається. батарея сідає за 4 години. розчарован",
      "[ITEM] зламався через тиждень. якість жахлива. не рекомендую",
      "батарея тримає 2 години максимум. шумить як пилосос. розчарован",
      "купував для спини але [ITEM] не допомагає взагалі. вібрація слабка. батарея сідає за пів дня. гроші на вітер",
      "якість жахлива. пластик дешевий. зарядка йде 5 годин а працює 1.5 години. не рекомендую",
      "[ITEM] прийшов з браком - не вмикається. продавець не відповідає. розчарован. повертаю"
    ]
  },
  underwear: {
    positive: [
      "[ITEM] неймовірно м'яка! ношу щодня вже місяць. алергії немає. дихає добре. прала в машинці - все ок",
      "чудова [ITEM]! матеріал топ шви рівні. ношу 2 місяці - вигляд як новий. дуже зручно. замовляла ще в іншому кольорі",
      "дуже задоволена! [ITEM] м'яка приємна до тіла. ношу щодня не викликає алергії. добре пропускає повітря. прала - все ок",
      "[ITEM] просто вогонь! неймовірно м'яка не натирає. ношу вже 3 місяці. якість відмінна. замовляла ще подругам",
      "ідеальна [ITEM] для щоденного носіння! матеріал якісний шви не відчутні. добре дихає літом не жарко. рекомендую",
      "дуже хороша якість! [ITEM] м'яка еластична. ношу під час йогої - не заважає. прала в машинці - все ціле. 5 зірок",
      "[ITEM] супер! купувала для доньки. дуже задоволена каже що комфортно. якість відмінна. дякую продавцю",
      "неймовірно м'яка [ITEM]! ношу щодня вже 2 місяці. алергії немає. матеріал якісний. замовляла ще в іншому кольорі"
    ],
    neutral: [
      "[ITEM] нормальна. сідає добре. прання витримує. але після 10 прань еластичність трохи пропала. так собі...",
      "хммм... [ITEM] так собі. матеріал середній. після 5 прань витяглася. за якість очікувала кращого. шукатиму інше",
      "мама купила. мені ок. зручно. не знаєш що носиш",
      "[ITEM] нормальна. але нічого особливого. матеріал середній. для ціни піде"
    ],
    negative: [
      "жах. матеріал дешевий шви криві. не купляйте це!",
      "матеріал хорошый але синтетика. ноги потіють. для літа не піде точно",
      "не вартий грошей. після 3 прань розірвалася. якість жахлива",
      "[ITEM] розтягнулася після першого прання. матеріал дешевий. не рекомендую",
      "алергія на матеріал! свербіж жахливий. довелося викинути. розчарована"
    ]
  },
  other: {
    positive: [
      "[ITEM] вогонь! все як в описі. якість чудова доставка 2 дні. продавець норм. рекомендую! 5 зірок",
      "дуже задоволений покупкою! [ITEM] відповідає опису. якість відмінна доставка швидка. продавець надійний. дякую",
      "чудовий [ITEM]! якість на висоті ціна прийнятна. доставка швидка. все як обіцяли. рекомендую всім",
      "[ITEM] просто знахідка! якість супер доставка швидка. продавець завжди на зв'язку. дуже задоволений! 5 зірок",
      "дуже хороший [ITEM]! якість відмінна доставка 2 дні. продавець надійний. все як в описі. рекомендую",
      "[ITEM] топ! якість чудова ціна прийнятна. доставка швидка. продавець норм. всім дякую",
      "дуже задоволена! [ITEM] якісний доставка швидка. продавець пішов на зустріч. рекомендую",
      "[ITEM] супер! якість відмінна ціна нормальна. доставка швидка. все ок. дякую продавцю"
    ],
    neutral: [
      "[ITEM] нормальний. але розмір не збігся - довелося обмінювати. продавець пішов на зустріч обмін без проблем. ок",
      "ну таке... [ITEM] не ідеальний. якість середня. користуюся 2 тижні - поки терпимо. але міг би бути краще",
      "так собі...",
      "[ITEM] нормальний. якість середня. для ціни піде"
    ],
    negative: [
      "не купляйте. якість жахлива матеріал дешевий. після першого використання шов розійшовся. продавець ігнорує. розчарован",
      "не вартий уваги",
      "марна трата грошей. якість жахлива. не рекомендую",
      "[ITEM] прийшов бракований. продавець не відповідає. розчарован"
    ]
  }
};

export default function ReviewsBlock({ productName, category, productRating, totalReviews = 20 }: ReviewsBlockProps) {
  const [helpfulVotes, setHelpfulVotes] = useState<Record<string, boolean>>({});
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [filter, setFilter] = useState<"all" | "recent">("all");

  // Определяем тип продукта для динамического контента
  const getProductType = (name: string, cat: string) => {
    if (cat.includes('Білизна')) return 'білизна';
    if (cat.includes('Бандаж')) return 'бандаж';
    if (cat.includes('Масажер')) return 'масажер';
    if (name.includes('штани') || name.includes('leggins') || name.includes('панталони')) return 'штани';
    if (name.includes('футболка') || name.includes('рашгард') || name.includes('топ')) return 'футболка';
    if (name.includes('шорти')) return 'шорти';
    return 'товар';
  };

  const productType = getProductType(productName, category);

  // Генератор аватара на основе имени
  const generateAvatar = (name: string) => {
    const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500', 'bg-orange-500', 'bg-teal-500'];
    const firstLetter = name.charAt(0).toUpperCase();
    const colorIndex = name.charCodeAt(0) % colors.length;
    return {
      letter: firstLetter,
      color: colors[colorIndex]
    };
  };

  // Псевдорандомный генератор с улучшенным seed
  const seededRandom = (seed: string) => {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = ((hash << 5) - hash) + seed.charCodeAt(i);
      hash = hash & hash;
    }
    // Фиксируем дату для предотвращения рассинхронизации гидратации
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Обнуляем часы, минуты и миллисекунды
    const dateString = today.toDateString();
    for (let i = 0; i < dateString.length; i++) {
      hash = ((hash << 5) - hash) + dateString.charCodeAt(i);
      hash = hash & hash;
    }
    return () => {
      hash = (hash * 9301 + 49297) % 233280;
      return hash / 233280;
    };
  };

  // Динамическая генерация дат
  const generateRandomDate = (rng: () => number) => {
    const daysAgo = Math.floor(rng() * 120); // до 120 дней назад
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date;
  };

  // Генерация отзывов
  const generateReviews = useMemo(() => {
    const rng = seededRandom(productName + category);
    
    // Выбираем пул в зависимости от категории
    let pool: any = { positive: [], neutral: [], negative: [] };
    if (category.includes('Компресійна')) pool = reviewPools.compression;
    else if (category.includes('Бандаж')) pool = reviewPools.bandage;
    else if (category.includes('Масажер')) pool = reviewPools.massager;
    else if (category.includes('Білизна')) pool = reviewPools.underwear;
    else pool = reviewPools.other;

    // Определяем пропорции в зависимости от рейтинга товара
    let positiveRatio = 0.6;
    let neutralRatio = 0.3;

    if (productRating >= 4.5) {
      positiveRatio = 0.75;
      neutralRatio = 0.2;
      // Всегда оставляем 5% негатива даже у лучших товаров
    } else if (productRating >= 3.5) {
      positiveRatio = 0.6;
      neutralRatio = 0.3;
    } else {
      positiveRatio = 0.3;
      neutralRatio = 0.4;
    }

    // Генерируем отзывы
    const reviews: Review[] = [];
    const cities = ['Київ', 'Львів', 'Одеса', 'Харків', 'Дніпро', 'Запоріжжя', 'Івано-Франківськ', 'Вінниця'];
    const names = [
      'Олександр', 'Ірина', 'Андрій', 'Олена', 'Сергій', 'Марія', 'Юрій', 'Наталя', 'Віталій', 'Тетяна', 
      'Михайло', 'Людмила', 'Павло', 'Світлана', 'Дмитро', 'Олег', 'Валентина', 'Олексій', 'Вікторія', 'Євгеній',
      'Олександр В.', 'Ірина П.', 'Андрій К.', 'Олена М.', 'Сергій С.', 'Марія Г.',
      'Alex99', 'Kitten_123', 'Shopper_2024', 'User_777', 'Buyer_UA', 'Customer_Kiev',
      'Гість', 'Покупець', 'Клієнт', 'Користувач'
    ];

    // Генерируем положительные отзывы
    const positiveCount = Math.floor(totalReviews * positiveRatio);
    const usedTemplates = new Set<string>();
    
    for (let i = 0; i < positiveCount; i++) {
      let template: string;
      let attempts = 0;
      
      // Предотвращаем дубликаты шаблонов
      do {
        template = pool.positive[Math.floor(rng() * pool.positive.length)];
        attempts++;
      } while (usedTemplates.has(template) && attempts < pool.positive.length && attempts < 10);
      
      usedTemplates.add(template);
      
      const name = names[Math.floor(rng() * names.length)];
      const city = cities[Math.floor(rng() * cities.length)];
      const date = generateRandomDate(rng);
      
      // Убираем фото - больше не используем Unsplash
      const images: string[] = [];
      
      // Лайки зависят от возраста отзыва
      const daysAgo = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
      const helpful = Math.floor(Math.max(0, rng() * (totalReviews / 4) * (1 - daysAgo / 120)));
      
      reviews.push({
        id: `pos-${i}`,
        author: name,
        city,
        date,
        rating: 4 + Math.floor(rng() * 2), // 4-5 звезд
        verified: rng() > 0.3,
        title: "",
        content: template.replaceAll('[ITEM]', productType),
        helpful,
        images
      });
    }

    // Генерируем нейтральные отзывы
    const neutralCount = Math.floor(totalReviews * neutralRatio);
    usedTemplates.clear(); // Очищаем для нейтральных
    
    for (let i = 0; i < neutralCount; i++) {
      let template: string;
      let attempts = 0;
      
      do {
        template = pool.neutral[Math.floor(rng() * pool.neutral.length)];
        attempts++;
      } while (usedTemplates.has(template) && attempts < pool.neutral.length && attempts < 10);
      
      usedTemplates.add(template);
      
      const name = names[Math.floor(rng() * names.length)];
      const city = cities[Math.floor(rng() * cities.length)];
      const date = generateRandomDate(rng);
      
      // Лайки зависят от возраста отзыва
      const daysAgo = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
      const helpful = Math.floor(Math.max(0, rng() * (totalReviews / 6) * (1 - daysAgo / 120)));
      
      reviews.push({
        id: `neu-${i}`,
        author: name,
        city,
        date,
        rating: 3,
        verified: rng() > 0.5,
        title: "",
        content: template.replaceAll('[ITEM]', productType),
        helpful,
        images: []
      });
    }

    // Генерируем негативные отзывы
    const negativeCount = totalReviews - positiveCount - neutralCount;
    usedTemplates.clear(); // Очищаем для негативных
    
    for (let i = 0; i < negativeCount; i++) {
      let template: string;
      let attempts = 0;
      
      do {
        template = pool.negative[Math.floor(rng() * pool.negative.length)];
        attempts++;
      } while (usedTemplates.has(template) && attempts < pool.negative.length && attempts < 10);
      
      usedTemplates.add(template);
      
      const name = names[Math.floor(rng() * names.length)];
      const city = cities[Math.floor(rng() * cities.length)];
      const date = generateRandomDate(rng);
      
      // Лайки зависят от возраста отзыва
      const daysAgo = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
      const helpful = Math.floor(Math.max(0, rng() * (totalReviews / 8) * (1 - daysAgo / 120)));
      
      reviews.push({
        id: `neg-${i}`,
        author: name,
        city,
        date,
        rating: 1 + Math.floor(rng() * 2), // 1-2 звезды
        verified: rng() > 0.7,
        title: "",
        content: template.replaceAll('[ITEM]', productType),
        helpful,
        images: []
      });
    }

    // Сортируем по дате (новые сначала)
    reviews.sort((a, b) => b.date.getTime() - a.date.getTime());

    return reviews;
  }, [productName, category, productRating, totalReviews, productType]);

  // Фильтрация отзывов
  const filteredReviews = useMemo(() => {
    let filtered = [...generateReviews];
    
    if (filter === "recent") {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      filtered = filtered.filter(review => review.date >= threeDaysAgo);
    }
    
    return filtered;
  }, [generateReviews, filter]);

  const displayedReviews = showAllReviews ? filteredReviews : filteredReviews.slice(0, 10);

  const handleHelpful = (reviewId: string) => {
    setHelpfulVotes(prev => ({
      ...prev,
      [reviewId]: !prev[reviewId]
    }));
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'сьогодні';
    if (diffDays === 1) return 'вчора';
    if (diffDays < 7) return `${diffDays} ${diffDays === 1 ? 'день' : diffDays > 1 && diffDays < 5 ? 'дні' : 'днів'} тому`;
    
    if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} ${weeks === 1 ? 'тиждень' : weeks > 1 && weeks < 5 ? 'тижні' : 'тижнів'} тому`;
    }
    
    if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} ${months === 1 ? 'місяць' : months > 1 && months < 5 ? 'місяці' : 'місяців'} тому`;
    }
    
    return date.toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  return (
    <div className="space-y-6">
      {/* Фильтры */}
      <div className="flex gap-4 border-b">
        <button
          onClick={() => setFilter("all")}
          className={`pb-2 px-1 border-b-2 transition-colors ${
            filter === "all" 
              ? "border-orange-500 text-orange-500" 
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Всі відгуки ({filteredReviews.length})
        </button>
        <button
          onClick={() => setFilter("recent")}
          className={`pb-2 px-1 border-b-2 transition-colors ${
            filter === "recent" 
              ? "border-orange-500 text-orange-500" 
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Найновіші
        </button>
      </div>

      {/* Список отзывов */}
      <div className="space-y-6">
        <AnimatePresence>
          {displayedReviews.map((review) => {
            const avatar = generateAvatar(review.author);
            return (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="border-b pb-6 last:border-0"
              >
                <div className="flex gap-4">
                  {/* Аватар */}
                  <div className={`w-12 h-12 rounded-full ${avatar.color} flex items-center justify-center text-white font-semibold flex-shrink-0`}>
                    {avatar.letter}
                  </div>

                  {/* Контент */}
                  <div className="flex-1">
                    {/* Заголовок отзыва */}
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{review.author}</h4>
                          {review.verified && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                              ✓ Підтверджено
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {review.city}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(review.date)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < review.rating 
                                ? "fill-orange-400 text-orange-400" 
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Текст отзыва */}
                    <p className="text-gray-700 mb-3 leading-relaxed">
                      {review.content}
                    </p>

                    {/* Кнопка "Корисно" */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleHelpful(review.id)}
                        className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm transition-colors ${
                          helpfulVotes[review.id]
                            ? "bg-orange-100 text-orange-600"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        <ThumbsUp className="w-3 h-3" />
                        Корисно
                        {review.helpful > 0 && (
                          <span className="text-xs">({review.helpful})</span>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Кнопка "Показати ще" */}
      {filteredReviews.length > 10 && !showAllReviews && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setShowAllReviews(true)}
          className="w-full py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Показати ще відгуки ({filteredReviews.length - 10})
        </motion.button>
      )}
    </div>
  );
}
