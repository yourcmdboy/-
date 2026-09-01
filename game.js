(() => {
  'use strict';

  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const fmt = n => Math.floor(n).toLocaleString('ru-RU');
  const compact = n => n>=1e9?`${(n/1e9).toFixed(n>=1e10?0:1)}млрд`:n>=1e6?`${(n/1e6).toFixed(n>=1e7?0:1)}млн`:n>=1e4?`${(n/1e3).toFixed(n>=1e5?0:1)}тыс`:fmt(n);
  const STORAGE_KEY = 'season-hunt-mainkampf-v1';

  const RARITIES = {
    common:    { name: 'ОБЫЧНЫЙ',     color: '#aeb8ad', value: 1,    xp: 12, weight: 62 },
    uncommon:  { name: 'НЕОБЫЧНЫЙ',   color: '#79c861', value: 1.5,  xp: 20, weight: 25 },
    rare:      { name: 'РЕДКИЙ',       color: '#59bfe8', value: 2.35, xp: 38, weight: 9 },
    epic:      { name: 'ЭПИЧЕСКИЙ',    color: '#bc72eb', value: 4.1,  xp: 68, weight: 3.2 },
    legendary: { name: 'ЛЕГЕНДАРНЫЙ', color: '#edc757', value: 8.4,  xp: 130, weight: .8 }
  };

  // Each species has 2–4 available rarity variants and exactly three unique loot drops.
  const ANIMALS = [
    { id:'rabbit', name:'Полевой заяц', desc:'Шустрый пустырный зверёк. Чем дольше сидит в рюкзаке, тем сильнее дёргает молнии.', base:34, diff:.78, weight:[1.1,3.8], rarities:['common','uncommon','rare'], loot:['Мягкая шкурка','Заячья лапка','Полевой ус'], buff:'Прыгучий ритм: зелёная зона +0.7%', debuff:'Панический топот: цена улова −0.25%', mod:{zone:.007,value:-.0025} },
    { id:'squirrel', name:'Кубическая белка', desc:'Прячет орехи в чанках и всегда знает короткую дорогу к добыче.', base:42, diff:.82, weight:[.5,1.7], rarities:['common','uncommon','rare'], loot:['Квадро-хвост','Запас желудей','Резной резец'], buff:'Ореховая карта: удача +0.6%', debuff:'Суета ветвей: скорость маркера +0.3%', mod:{luck:.006,speed:.003} },
    { id:'fox', name:'Ржавая лисица', desc:'Хитрая городская охотница с медным хвостом и привычкой торговаться.', base:76, diff:.96, weight:[4.4,9.2], rarities:['common','uncommon','rare','epic'], loot:['Огненный мех','Лисий клык','Медный хвост'], buff:'Лисья сделка: продажа +0.9%', debuff:'Ложный след: зона −0.35%', mod:{value:.009,zone:-.0035} },
    { id:'raccoon', name:'Енот-мародёр', desc:'Разбирает ловушки быстрее, чем Михалыч считает сдачу.', base:88, diff:1.02, weight:[5,12], rarities:['common','rare','epic'], loot:['Полосатый мех','Жестяной жетон','Ловкие пальцы'], buff:'Карманник: опыт +0.9%', debuff:'Шумный пакет: редкость −0.25%', mod:{xp:.009,luck:-.0025} },
    { id:'beaver', name:'Плотник-бобр', desc:'Строит плотины из дубовых блоков и утяжеляет любой трофей.', base:118, diff:1.08, weight:[12,28], rarities:['common','uncommon','rare'], loot:['Бобровая шкура','Дубовый резец','Кусок плотины'], buff:'Крепкая кладка: цена +1.0%', debuff:'Тяжёлый груз: скорость +0.45%', mod:{value:.01,speed:.0045} },
    { id:'badger', name:'Шахтёр-барсук', desc:'Пахнет мхом, камнем и очень спорным решением копать вниз.', base:136, diff:1.12, weight:[9,19], rarities:['common','uncommon','epic'], loot:['Жёсткая щетина','Каменный коготь','Шахтёрский нос'], buff:'Подкоп: идеальная зона +0.7%', debuff:'Пыль в глазах: зона −0.3%', mod:{perfect:.007,zone:-.003} },
    { id:'boar', name:'Булыжный вепрь', desc:'Разгоняется как вагонетка без тормозов и оставляет борозды в камне.', base:175, diff:1.2, weight:[35,88], rarities:['uncommon','rare','epic'], loot:['Каменный клык','Грубая шкура','Железная щетина'], buff:'Таран: вес трофея +1.1%', debuff:'Инерция: скорость +0.55%', mod:{weight:.011,speed:.0055} },
    { id:'deer', name:'Берёзовый олень', desc:'На рогах растут молодые листья. Рядом с ним следы светятся зелёным.', base:220, diff:1.25, weight:[62,145], rarities:['uncommon','rare','epic','legendary'], loot:['Ветвистый рог','Берёзовая шкура','Сердце рощи'], buff:'Чуткий след: редкость +0.8%', debuff:'Хрупкие ветви: цена −0.35%', mod:{luck:.008,value:-.0035} },
    { id:'wolf', name:'Туманный волк', desc:'Появляется без звука, но заставляет шкалу дрожать быстрее.', base:265, diff:1.34, weight:[38,74], rarities:['uncommon','rare','epic'], loot:['Серый мех','Лунный клык','Клочок тумана'], buff:'Зов стаи: серия даёт +1.0% опыта', debuff:'Вой: маркер +0.5% скорости', mod:{xp:.01,speed:.005} },
    { id:'lynx', name:'Искровая рысь', desc:'На кисточках ушей потрескивает статический редстоун.', base:340, diff:1.42, weight:[18,38], rarities:['rare','epic','legendary'], loot:['Искровой мех','Рысья кисточка','Заряженный коготь'], buff:'Статика: идеальная зона +0.9%', debuff:'Разряд: обычная зона −0.4%', mod:{perfect:.009,zone:-.004} },
    { id:'moose', name:'Проводниковый лось', desc:'Рога ловят сигналы соседних чанков и иногда — местное радио.', base:470, diff:1.52, weight:[210,460], rarities:['uncommon','rare','epic','legendary'], loot:['Радио-рог','Лосиная кожа','Медный нерв'], buff:'Антенна: удача +1.1%', debuff:'Помехи: цена −0.45%', mod:{luck:.011,value:-.0045} },
    { id:'bear', name:'Чернолапый медведь', desc:'Массивный хозяин леса. Не любит спешку и пустые банки мёда.', base:620, diff:1.62, weight:[190,410], rarities:['rare','epic','legendary'], loot:['Тяжёлая шкура','Медвежий коготь','Комок ярости'], buff:'Хозяин леса: стоимость +1.3%', debuff:'Тяжесть: маркер +0.65%', mod:{value:.013,speed:.0065} },
    { id:'bison', name:'Рельсовый зубр', desc:'Грохочет по карьеру, будто состав из двенадцати вагонеток.', base:760, diff:1.72, weight:[420,830], rarities:['rare','epic','legendary'], loot:['Густая шерсть','Рельсовый рог','Стальная жила'], buff:'Тяга локомотива: вес +1.5%', debuff:'Грохот: зелёная зона −0.55%', mod:{weight:.015,zone:-.0055} },
    { id:'mountain_goat', name:'Кварцевая коза', desc:'Цокает по скалам кристальными копытами и бликует в идеальный тайминг.', base:830, diff:1.76, weight:[54,112], rarities:['uncommon','epic','legendary'], loot:['Кварцевый рог','Белая шерсть','Кристалл копыта'], buff:'Блик: perfect-награда +1.4%', debuff:'Осыпь: скорость +0.6%', mod:{perfect:.014,speed:.006} },
    { id:'owl', name:'Сумеречная сова', desc:'Считает твои промахи заранее и неодобрительно моргает квадратными глазами.', base:910, diff:1.82, weight:[3.2,7.8], rarities:['rare','epic','legendary'], loot:['Тихое перо','Совиный глаз','Комок сумерек'], buff:'Тихий взмах: скорость −1.0%', debuff:'Пристальный взгляд: зона −0.45%', mod:{speed:-.01,zone:-.0045} },
    { id:'eagle', name:'Высотный орёл', desc:'Падает с облаков ровно в тот момент, когда ты отвёл палец от кнопки.', base:1040, diff:1.9, weight:[6,15], rarities:['rare','epic','legendary'], loot:['Высотное перо','Золотой клюв','Облачный коготь'], buff:'Пикирование: опыт +1.5%', debuff:'Слепящее небо: редкость −0.5%', mod:{xp:.015,luck:-.005} },
    { id:'snow_leopard', name:'Снежный барс', desc:'Растворяется в снегу, оставляя только голубые пиксели на следу.', base:1280, diff:2.0, weight:[35,72], rarities:['rare','epic','legendary'], loot:['Снежный мех','Ледяной клык','Тихая лапа'], buff:'Белая тень: зона +1.2%', debuff:'Обморожение: цена −0.55%', mod:{zone:.012,value:-.0055} },
    { id:'crocodile', name:'Болотный крокодил', desc:'Лежит в тине неподвижно, пока шкала не окажется почти у самого края.', base:1460, diff:2.08, weight:[240,610], rarities:['uncommon','rare','legendary'], loot:['Болотная кожа','Зелёный зуб','Тинный панцирь'], buff:'Броня: стоимость +1.7%', debuff:'Тина: маркер +0.8%', mod:{value:.017,speed:.008} },
    { id:'mammoth', name:'Ледяной мамонт', desc:'Древний гигант. Каждый шаг отзывается в интерфейсе морозной трещиной.', base:2100, diff:2.2, weight:[1800,4200], rarities:['epic','legendary'], loot:['Древний бивень','Мамонтовая шерсть','Ледяное сердце'], buff:'Память льда: редкость +1.8%', debuff:'Глыба: зона −0.75%', mod:{luck:.018,zone:-.0075} },
    { id:'void_stag', name:'Пустотный олень', desc:'Невозможный зверь из сломанного чанка. Его рога не отбрасывают тень.', base:3600, diff:2.38, weight:[80,190], rarities:['rare','epic','legendary'], loot:['Осколок пустоты','Фиолетовый рог','Нулевая шкура'], buff:'Разрыв чанка: все цены +2.1%', debuff:'Нестабильность: маркер +1.0%', mod:{value:.021,speed:.01} },
    { id:'otter', name:'Речная выдра', desc:'Скользит по воде быстрее маркера и прячет блестящий лут под камнями.', base:540, diff:1.48, weight:[6,15], rarities:['common','rare','epic'], loot:['Гладкий мех','Речной камень','Серебряный ус'], buff:'Скользкий ритм: скорость −1.2%', debuff:'Мокрый рюкзак: цена −0.5%', mod:{speed:-.012,value:-.005} },
    { id:'wolverine', name:'Северная росомаха', desc:'Компактная ярость с тяжёлыми когтями. Не признаёт безопасных маршрутов.', base:1180, diff:1.96, weight:[16,31], rarities:['uncommon','rare','epic','legendary'], loot:['Чёрный коготь','Северный мех','Жила ярости'], buff:'Упрямство: опыт +1.8%', debuff:'Злая хватка: зона −0.7%', mod:{xp:.018,zone:-.007} },
    { id:'storm_ram', name:'Грозовой баран', desc:'На рогах собирается молния, а копыта выбивают искры из мокрого камня.', base:1950, diff:2.12, weight:[96,185], rarities:['rare','epic','legendary'], loot:['Грозовой рог','Облачная шерсть','Искра плато'], buff:'Разряд: perfect +1.9%', debuff:'Гром: маркер +0.9%', mod:{perfect:.019,speed:.009} },
    { id:'crystal_raven', name:'Кристальный ворон', desc:'Собран из полупрозрачных осколков и каркает звуком разбитого стекла.', base:2680, diff:2.23, weight:[4,11], rarities:['rare','epic','legendary'], loot:['Призматическое перо','Кристальный клюв','Звонкий осколок'], buff:'Призма: редкость +2.0%', debuff:'Блик: цена −0.8%', mod:{luck:.02,value:-.008} },
    { id:'lava_salamander', name:'Лавовая саламандра', desc:'Оставляет горящий пиксельный след и плавит слабые приманки.', base:3420, diff:2.36, weight:[28,64], rarities:['uncommon','epic','legendary'], loot:['Магмовый хвост','Жар-камень','Огненная чешуя'], buff:'Внутренний жар: стоимость +2.3%', debuff:'Ожог: зона −0.9%', mod:{value:.023,zone:-.009} },
    { id:'shadow_panther', name:'Теневая пантера', desc:'Появляется между кадрами анимации и исчезает раньше собственного силуэта.', base:4480, diff:2.52, weight:[58,112], rarities:['rare','epic','legendary'], loot:['Теневой мех','Ночной клык','Чёрная искра'], buff:'Между кадров: зона +2.1%', debuff:'Испуг: маркер +1.1%', mod:{zone:.021,speed:.011} },
    { id:'moon_manta', name:'Лунная манта', desc:'Парит над пепельным грунтом и плывёт по воздуху, будто по тихой воде.', base:6100, diff:2.68, weight:[140,330], rarities:['epic','legendary'], loot:['Лунное крыло','Пыль орбиты','Светящийся ус'], buff:'Низкая гравитация: редкость +2.5%', debuff:'Искажение: perfect −1.0%', mod:{luck:.025,perfect:-.01} }
  ];
  const animalById = Object.fromEntries(ANIMALS.map(a => [a.id, a]));

  const WEAPONS = [
    { id:'snare', name:'Ржавый силок', icon:'⛓', price:0, zone:30, speed:1.08, perfect:.16, shield:0, desc:'База. Дёрганый маркер и честные ладони.' },
    { id:'bone_bow', name:'Костяной лук', icon:'🏹', price:780, zone:34, speed:1.0, perfect:.18, shield:0, desc:'Чуть шире окно и спокойнее движение.' },
    { id:'copper_spear', name:'Медное копьё', icon:'↟', price:2300, zone:36, speed:.97, perfect:.19, shield:0, desc:'Надёжный старт для рощи и карьера.' },
    { id:'crossbow', name:'Стальной арбалет', icon:'➶', price:5200, zone:39, speed:.93, perfect:.20, shield:0, desc:'Ровный ритм и плотная шкала.' },
    { id:'fiber_net', name:'Волоконная сеть', icon:'⌗', price:15500, zone:44, speed:.88, perfect:.22, shield:0, desc:'Большое окно против тяжёлых зверей.' },
    { id:'repeater', name:'Редстоуновый повторитель', icon:'⇥', price:36000, zone:47, speed:.84, perfect:.23, shield:0, desc:'Синхронизирует маркер импульсами.' },
    { id:'echo_rifle', name:'Эхо-карабин', icon:'⌁', price:72000, zone:50, speed:.80, perfect:.25, shield:0, desc:'Подсвечивает центр идеального окна.' },
    { id:'obsidian_trap', name:'Обсидиановый капкан', icon:'⬢', price:145000, zone:52, speed:.77, perfect:.28, shield:0, desc:'Медленный, тяжёлый и очень стабильный.' },
    { id:'frost_bola', name:'Морозная бола', icon:'❄', price:260000, zone:55, speed:.73, perfect:.29, shield:0, desc:'Замораживает темп шкалы.' },
    { id:'thunder_harpoon', name:'Громовой гарпун', icon:'ϟ', price:430000, zone:57, speed:.70, perfect:.30, shield:1, desc:'Один раз за вылазку прощает промах.' },
    { id:'crystal_sling', name:'Кристальная праща', icon:'◇', price:690000, zone:59, speed:.67, perfect:.32, shield:0, desc:'Призматическое окно для редких целей.' },
    { id:'time_clock', name:'Часы времени', icon:'◴', price:785000, zone:56, speed:.62, perfect:.31, shield:0, timeWarp:1.72, desc:'Замедляют стрелку, но ускоряют само время: зверь убегает в 1.72 раза быстрее.' },
    { id:'magma_cannon', name:'Магмовая пушка', icon:'◉', price:1100000, zone:61, speed:.64, perfect:.34, shield:0, desc:'Тяжёлый импульс для лавовых секторов.' },
    { id:'void_chakram', name:'Пустотный чакрам', icon:'◌', price:1650000, zone:63, speed:.61, perfect:.35, shield:1, desc:'Режет помехи и хранит одну страховку.' },
    { id:'rune_cage', name:'Руническая клетка', icon:'▧', price:2400000, zone:66, speed:.58, perfect:.37, shield:1, desc:'Удерживает даже нестабильный след.' },
    { id:'plasma_lasso', name:'Плазменное лассо', icon:'∞', price:3500000, zone:69, speed:.55, perfect:.39, shield:1, desc:'Очень широкое окно и мягкий ход.' },
    { id:'quantum_trap', name:'Квантовая ловушка', icon:'✣', price:5000000, zone:73, speed:.50, perfect:.42, shield:2, desc:'Две страховки и максимальный контроль.' }
  ];
  const weaponById = Object.fromEntries(WEAPONS.map(w => [w.id, w]));

  const SFX_PATHS = {lol:'assets/sounds/lol.mp3',buy:'assets/sounds/buy.mp3',perfect:'assets/sounds/perfect.mp3',normal:'assets/sounds/normal.mp3',damage:'assets/sounds/damage.mp3',reboot:'assets/sounds/reboot.mp3',newworld:'assets/sounds/newworld.mp3',meow:'assets/sounds/meow.mp3'};
  const MUSIC_PATH='assets/sounds/music.mp3';
  const SFX_GAINS={lol:.42,buy:.56,perfect:.58,normal:.62,damage:.48,reboot:.54,newworld:.55,meow:.64};
  const AVATARS = [
    {id:'ranger',name:'Лесной рейнджер',mood:'Классика'},
    {id:'scout',name:'Бирюзовый разведчик',mood:'Классика'},
    {id:'snow_guard',name:'Страж тундры',mood:'Классика'},
    {id:'void_mage',name:'Маг разлома',mood:'Классика'},
    {id:'mushroom',name:'Грибной начальник',mood:'Рофл'},
    {id:'cat_hood',name:'Котокапюшон',mood:'Рофл'},
    {id:'cone_knight',name:'Рыцарь-конус',mood:'Рофл'},
    {id:'cube_tv',name:'Телевизор 404',mood:'Рофл'},
    {id:'pickle_hero',name:'Огурец-герой',mood:'Рофл'}
  ];
  const avatarById = Object.fromEntries(AVATARS.map(a=>[a.id,a]));

  const MERCHANTS = [
    {id:'forester',icon:'🌲',name:'Лесник Фома',tag:'ЧЕСТНЫЙ КУРС',rate:1.00,reward:1.00,desc:'Платит ровно, любит обычные крупные поставки.'},
    {id:'raven',icon:'◆',name:'Ворон Кэш',tag:'РИСКОВЫЙ БОНУС',rate:.94,reward:1.24,desc:'Курс ниже, зато контракты щедрее на 24%.'},
    {id:'terminal',icon:'▣',name:'Торгомат 404',tag:'АВТО-РАСЧЁТ',rate:1.08,reward:1.10,desc:'Лучший базовый курс и сухие машинные задания.'},
    {id:'baron',icon:'♛',name:'Барон Бартер',tag:'ЭЛИТНЫЙ ЗАКАЗ',rate:1.02,reward:1.18,desc:'Особенно щедр на редкие и идеальные трофеи.'}
  ];
  const merchantById = Object.fromEntries(MERCHANTS.map(m=>[m.id,m]));
  const RARITY_ORDER=['common','uncommon','rare','epic','legendary'];
  const MARKET_PERIOD=5*60*1000, QUEST_PERIOD=15*60*1000;
  const QUEST_TEMPLATES = [
    {id:'soft_start',title:'Мягкая поставка',desc:'Зайцы и белки для новичков.',animals:['rabbit','squirrel'],count:3,minTier:0,mult:4.0},
    {id:'city_tricks',title:'Городские хитрецы',desc:'Лисы и еноты необычной редкости.',animals:['fox','raccoon'],count:2,minTier:1,mult:4.1},
    {id:'river_crate',title:'Речной ящик',desc:'Водные трофеи для лодочной артели.',animals:['beaver','otter','crocodile'],count:2,minTier:0,mult:3.8},
    {id:'forest_patrol',title:'Лесной патруль',desc:'Крупная смешанная партия из чащи.',animals:['deer','wolf','boar'],count:3,minTier:1,mult:3.7},
    {id:'fangs',title:'Клыки на витрину',desc:'Редкие хищники без царапин.',animals:['wolf','lynx','bear','wolverine','shadow_panther'],count:2,minTier:2,mult:4.5},
    {id:'feather_mail',title:'Воздушная почта',desc:'Перьевые трофеи с высоты.',animals:['owl','eagle','crystal_raven'],count:3,minTier:1,mult:3.9},
    {id:'giant_step',title:'Шаг гиганта',desc:'Один эпический тяжеловес.',animals:['moose','bison','mammoth'],count:1,minTier:3,mult:4.2},
    {id:'white_silence',title:'Белая тишина',desc:'Редкая добыча морозных секторов.',animals:['snow_leopard','mammoth','wolverine','storm_ram'],count:2,minTier:2,mult:4.4},
    {id:'perfect_pair',title:'Два идеальных кадра',desc:'Любые два трофея с идеальным таймингом.',animals:null,count:2,minTier:0,perfect:true,rewardBase:950,mult:4.0},
    {id:'legend_only',title:'Золотой экземпляр',desc:'Любой легендарный трофей.',animals:null,count:1,minTier:4,rewardBase:6500,mult:4.8},
    {id:'miners_union',title:'Союз шахтёров',desc:'Подземные звери необычной редкости.',animals:['badger','boar','wolverine','crystal_raven'],count:3,minTier:1,mult:3.8},
    {id:'storm_cells',title:'Батарея грозы',desc:'Заряженные звери плато.',animals:['storm_ram','eagle','crystal_raven'],count:2,minTier:2,mult:4.6},
    {id:'magma_sample',title:'Горячий контейнер',desc:'Эпический образец из лавы.',animals:['lava_salamander','crocodile'],count:1,minTier:3,mult:4.7},
    {id:'shadow_invoice',title:'Счёт из темноты',desc:'Редчайшие обитатели разлома.',animals:['shadow_panther','void_stag'],count:1,minTier:3,mult:5.0},
    {id:'moon_freight',title:'Лунный груз',desc:'Манта или древний гигант.',animals:['moon_manta','mammoth'],count:1,minTier:3,mult:4.9},
    {id:'heavy_hundred',title:'Центнер пикселей',desc:'Трофеи тяжелее 100 килограммов.',animals:null,count:2,minTier:1,minWeight:100,rewardBase:2400,mult:4.1},
    {id:'mixed_box',title:'Полевой ассортимент',desc:'Пять любых необычных трофеев.',animals:null,count:5,minTier:1,rewardBase:720,mult:3.8},
    {id:'crystal_order',title:'Призматический заказ',desc:'Редкая добыча кристальных пещер.',animals:['crystal_raven','storm_ram','void_stag'],count:2,minTier:2,mult:4.5},
    {id:'perfect_predator',title:'Чистый хищный кадр',desc:'Идеально пойманный редкий хищник.',animals:['fox','wolf','lynx','bear','wolverine','shadow_panther'],count:1,minTier:2,perfect:true,mult:5.1},
    {id:'last_caravan',title:'Большой караван',desc:'Шесть любых трофеев для дальнего рейса.',animals:null,count:6,minTier:0,rewardBase:620,mult:4.0}
  ];
  const questById=Object.fromEntries(QUEST_TEMPLATES.map(q=>[q.id,q]));


  // Exactly twelve baits. Every bait has one unique buff and one unique debuff.
  const BAITS = [
    { id:'carrot', name:'Хрустящая морковь', icon:'🥕', price:45, buff:'Зелёная зона +9%', debuff:'Цена трофея −4%', mod:{zone:.09,value:-.04}, tags:['rabbit','squirrel'] },
    { id:'berry', name:'Лесной микс', icon:'🫐', price:95, buff:'Редкость +7%', debuff:'Маркер +5% скорости', mod:{luck:.07,speed:.05}, tags:['fox','raccoon','deer'] },
    { id:'acorn', name:'Карманы желудей', icon:'🌰', price:150, buff:'Опыт +14%', debuff:'Вес трофея −8%', mod:{xp:.14,weight:-.08}, tags:['squirrel','boar','badger'] },
    { id:'honey', name:'Кубовый мёд', icon:'🍯', price:260, buff:'Стоимость +16%', debuff:'Зона −8%', mod:{value:.16,zone:-.08}, tags:['bear','badger'] },
    { id:'smoked_meat', name:'Копчёное мясо', icon:'🥩', price:420, buff:'Хищники встречаются чаще', debuff:'Маркер +11% скорости', mod:{predator:.42,speed:.11}, tags:['wolf','fox','lynx','snow_leopard'] },
    { id:'fish', name:'Серебряная рыба', icon:'🐟', price:680, buff:'Речной улов дороже на 24%', debuff:'Опыт −10%', mod:{riverValue:.24,xp:-.1}, tags:['beaver','crocodile','raccoon'] },
    { id:'salt', name:'Соляной блок', icon:'🧊', price:980, buff:'Вес +21%', debuff:'Редкость −6%', mod:{weight:.21,luck:-.06}, tags:['deer','moose','bison','mountain_goat'] },
    { id:'glow_mushroom', name:'Светогриб', icon:'🍄', price:1650, buff:'Perfect-зона +40%', debuff:'Обычная зона −10%', mod:{perfect:.4,zone:-.1}, tags:['badger','owl','lynx'] },
    { id:'silver_feather', name:'Серебряное перо', icon:'🪶', price:2800, buff:'Маркер −16% скорости', debuff:'Стоимость −9%', mod:{speed:-.16,value:-.09}, tags:['owl','eagle'] },
    { id:'frost_lily', name:'Морозная лилия', icon:'❄', price:5200, buff:'Снежные звери встречаются чаще', debuff:'Зона −12%', mod:{frost:.55,zone:-.12}, tags:['snow_leopard','mammoth','wolf'] },
    { id:'blood_orange', name:'Кровавый апельсин', icon:'🍊', price:11000, buff:'Эпик/легенда +22%', debuff:'Маркер +18% скорости', mod:{luck:.22,speed:.18}, tags:['bear','bison','crocodile'] },
    { id:'void_truffle', name:'Трюфель пустоты', icon:'🔮', price:26000, buff:'Легендарный шанс +38%', debuff:'Зона −22%', mod:{luck:.38,zone:-.22}, tags:['void_stag','mammoth','lynx'] }
  ];
  const baitById = Object.fromEntries(BAITS.map(b => [b.id, b]));

  const LOCATIONS = [
    { id:'yard', name:'Дикие окраины', icon:'🏕', price:0, class:'location-yard', sector:'СЕКТОР 01 · БЕЗОПАСНО', texture:'var(--tile-grass)', species:['rabbit','squirrel','fox','raccoon','beaver'], buff:'Свободный след: зона +12%', debuff:'Бедный рынок: цена −5%', mod:{zone:.12,value:-.05,speed:1,luck:0}, weather:['Тихое утро','Мелкий дождь','Шорох травы'] },
    { id:'birch', name:'Берёзовая роща', icon:'🌲', price:1100, class:'location-birch', sector:'СЕКТОР 02 · ЛЕС', texture:'var(--tile-moss)', species:['rabbit','squirrel','fox','badger','boar','deer','wolf'], buff:'Свежий след: редкость +6%', debuff:'Корни: маркер +5%', mod:{zone:0,value:.04,speed:1.05,luck:.06}, weather:['Золотой час','Листопад','Низкий туман'] },
    { id:'quarry', name:'Силикатный карьер', icon:'⛏', price:5800, class:'location-quarry', sector:'СЕКТОР 03 · КАРЬЕР', texture:'var(--tile-stone)', species:['raccoon','badger','boar','lynx','bison','mountain_goat'], buff:'Минеральная пыль: вес +15%', debuff:'Эхо взрыва: зона −7%', mod:{zone:-.07,value:.08,speed:1.08,luck:.04,weight:.15}, weather:['Каменная пыль','Эхо смены','Сухой ветер'] },
    { id:'swamp', name:'Чёрное болото', icon:'🪷', price:19000, class:'location-swamp', sector:'СЕКТОР 04 · ТОПЬ', texture:'var(--tile-swamp)', species:['beaver','otter','badger','boar','wolf','owl','crocodile'], buff:'Тинный рынок: цена +18%', debuff:'Густой туман: маркер +12%', mod:{zone:-.04,value:.18,speed:1.12,luck:.08}, weather:['Зелёный туман','Кислотный дождь','Тихая вода'] },
    { id:'tundra', name:'Морозный заказник', icon:'❄', price:56000, class:'location-tundra', sector:'СЕКТОР 05 · МОРОЗ', texture:'var(--tile-snow)', species:['wolf','wolverine','moose','bear','owl','eagle','snow_leopard','mammoth'], buff:'Чистый воздух: rare+ +14%', debuff:'Обморожение: зона −11%', mod:{zone:-.11,value:.24,speed:1.1,luck:.14}, weather:['Полярное сияние','Белая мгла','Хрустящий мороз'] },
    { id:'canyon', name:'Красный каньон', icon:'🧱', price:138000, class:'location-canyon', sector:'СЕКТОР 06 · ЖАРА', texture:'var(--tile-sand)', species:['deer','bison','mountain_goat','eagle','crocodile'], buff:'Сухой трофей: цена +32%', debuff:'Марево: perfect −18%', mod:{zone:-.05,value:.32,speed:1.16,luck:.12,perfect:-.18}, weather:['Пыльная буря','Красный закат','Сухая гроза'] },
    { id:'mine', name:'Заброшенная шахта', icon:'🕯', price:280000, class:'location-mine', sector:'СЕКТОР 07 · ПОДЗЕМЬЕ', texture:'var(--tile-basalt)', species:['badger','boar','wolverine','lynx','bear','crystal_raven'], buff:'Глубинная жила: цена +38%', debuff:'Темнота: зона −13%', mod:{zone:-.13,value:.38,speed:1.14,luck:.15}, weather:['Дрожь крепей','Пыльный сквозняк','Гул вагонетки'] },
    { id:'jungle', name:'Изумрудные джунгли', icon:'🌿', price:520000, class:'location-jungle', sector:'СЕКТОР 08 · ДЖУНГЛИ', texture:'var(--tile-jungle)', species:['otter','fox','raccoon','crocodile','shadow_panther','eagle'], buff:'Живая чаща: редкость +18%', debuff:'Лианы: скорость +16%', mod:{zone:-.06,value:.42,speed:1.16,luck:.18}, weather:['Тропический ливень','Зелёная гроза','Споры в воздухе'] },
    { id:'storm', name:'Грозовое плато', icon:'⚡', price:900000, class:'location-storm', sector:'СЕКТОР 09 · ГРОЗА', texture:'var(--tile-storm)', species:['eagle','storm_ram','mountain_goat','wolf','crystal_raven'], buff:'Заряд атмосферы: perfect +42%', debuff:'Порывы: маркер +19%', mod:{zone:-.07,value:.5,speed:1.19,luck:.2,perfect:.42}, weather:['Шаровая молния','Чёрные облака','Горизонтальный дождь'] },
    { id:'lava', name:'Лавовый разлом', icon:'🌋', price:1450000, class:'location-lava', sector:'СЕКТОР 10 · МАГМА', texture:'var(--tile-lava)', species:['lava_salamander','crocodile','bison','mammoth','shadow_panther'], buff:'Жаркая ставка: цена +62%', debuff:'Ожог ладоней: зона −18%', mod:{zone:-.18,value:.62,speed:1.2,luck:.22}, weather:['Пепельный дождь','Выброс магмы','Красная ночь'] },
    { id:'crystal', name:'Кристальные пещеры', icon:'💎', price:2200000, class:'location-crystal', sector:'СЕКТОР 11 · КРИСТАЛЛ', texture:'var(--tile-crystal)', species:['crystal_raven','lynx','snow_leopard','storm_ram','void_stag'], buff:'Преломление: редкость +24%', debuff:'Слепящий блик: perfect −22%', mod:{zone:-.12,value:.7,speed:1.2,luck:.24,perfect:-.22}, weather:['Призматический свет','Звон сводов','Холодный блеск'] },
    { id:'ruins', name:'Древние руины', icon:'🏛', price:3300000, class:'location-ruins', sector:'СЕКТОР 12 · РУИНЫ', texture:'var(--tile-ruin)', species:['deer','owl','crystal_raven','shadow_panther','void_stag','storm_ram'], buff:'Старые руны: опыт +55%', debuff:'Проклятие: цена −14%', mod:{zone:-.1,value:.58,speed:1.22,luck:.27,xp:.55}, weather:['Шёпот кладки','Рунный свет','Песок времени'] },
    { id:'moon', name:'Лунная пустыня', icon:'🌙', price:5000000, class:'location-moon', sector:'СЕКТОР 13 · НИЗКАЯ G', texture:'var(--tile-moon)', species:['moon_manta','mammoth','snow_leopard','crystal_raven','void_stag'], buff:'Низкая гравитация: вес +48%', debuff:'Вакуум: маркер +24%', mod:{zone:-.14,value:.82,speed:1.24,luck:.3,weight:.48}, weather:['Земля на горизонте','Метеоритный след','Серебряная тишина'] },
    { id:'void', name:'Сломанный чанк', icon:'◈', price:7500000, class:'location-void', sector:'СЕКТОР ?? · НЕСТАБИЛЬНО', texture:'var(--tile-obsidian)', species:['void_stag','shadow_panther','moon_manta','crystal_raven','lava_salamander','lynx','mammoth'], buff:'Разлом: легенды +36%', debuff:'Мусор-дроп: обзор закрыт 5 сек.', mod:{zone:-.18,value:1.05,speed:1.28,luck:.36}, weather:['Фиолетовый разлом','Нулевая ночь','Ошибка освещения'] }
  ];
  const locationById = Object.fromEntries(LOCATIONS.map(l => [l.id, l]));
  const CAT_SPOTS={
    yard:{left:76,top:50,scale:.82}, birch:{left:18,top:55,scale:.74,flip:true}, quarry:{left:79,top:43,scale:.72},
    swamp:{left:67,top:58,scale:.7,flip:true}, tundra:{left:12,top:44,scale:.76}, canyon:{left:82,top:54,scale:.72,flip:true},
    mine:{left:70,top:48,scale:.7}, jungle:{left:43,top:39,scale:.68,flip:true}, storm:{left:78,top:57,scale:.73},
    lava:{left:19,top:56,scale:.71,flip:true}, crystal:{left:71,top:42,scale:.69}, ruins:{left:14,top:58,scale:.72},
    moon:{left:81,top:50,scale:.75,flip:true}, void:{left:53,top:36,scale:.67}
  };

  const EVENTS = [
    {name:'Золотой луч',icon:'☀',type:'buff',text:'Стоимость +25%',mod:{value:.25}},
    {name:'Чёткий след',icon:'⌖',type:'buff',text:'Зона +18%',mod:{zone:.18}},
    {name:'Тихий ветер',icon:'≋',type:'buff',text:'Маркер −15%',mod:{speed:-.15}},
    {name:'Редстоуновая искра',icon:'✦',type:'buff',text:'Perfect +45%',mod:{perfect:.45}},
    {name:'Лунный нюх',icon:'☾',type:'buff',text:'Редкость +18%',mod:{luck:.18}},
    {name:'Сытный паёк',icon:'▣',type:'buff',text:'Опыт +20%',mod:{xp:.2}},
    {name:'Густой туман',icon:'░',type:'debuff',text:'Зона −17%',mod:{zone:-.17}},
    {name:'Ливень',icon:'☂',type:'debuff',text:'Маркер +16%',mod:{speed:.16}},
    {name:'Сломанный компас',icon:'↯',type:'debuff',text:'Редкость −12%',mod:{luck:-.12}},
    {name:'Голодный ворон',icon:'◆',type:'debuff',text:'Стоимость −18%',mod:{value:-.18}},
    {name:'Липкая грязь',icon:'≈',type:'debuff',text:'Perfect −35%',mod:{perfect:-.35}},
    {name:'Шум вагонетки',icon:'���',type:'debuff',text:'Зона −8%, скорость +8%',mod:{zone:-.08,speed:.08}}
  ];

  const CAPACITY_LEVELS = [12,18,26,36,48,64,84,108];
  const CAPACITY_PRICES = [900,4200,18000,68000,240000,820000,2600000];
  const RANKS = ['Следопыт I','Следопыт II','Ловчий III','Егерь IV','Хранитель V','Мастер чанков VI','Архонт охоты VII'];

  const defaultState = () => ({
    coins: 320, xp: 0, level: 1, inventory: [], capacityIndex: 0,
    ownedWeapons: ['snare'], equippedWeapon: 'snare',
    baits: {carrot: 3}, equippedBait: 'carrot',
    unlockedLocations: ['yard'], location: 'yard',
    bestCombo: 0, totalCaught: 0, totalSold: 0, perfects: 0, souls: 0, rebirths: 0, escaped: 0,
    contractsDone:0, contractEarned:0, kisyaFound:0, nextKisyaAt:0, kisyaCollected:[], avatar:'ranger',
    trade:{merchantId:'forester',marketBucket:-1,questBucket:-1,rate:1,priorities:[],quests:[],marketEnds:0,questEnds:0},
    lastSavedAt:Date.now(), sound:true, music:true, sfxVolume:.65, musicVolume:.26, vibration:true, firstRun:false
  });

  function loadState(){
    try{
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if(!saved) return defaultState();
      const base = defaultState();
      const merged = {...base,...saved};
      merged.trade={...base.trade,...(saved.trade||{})};
      merged.inventory = Array.isArray(saved.inventory) ? saved.inventory.filter(i => animalById[i.animalId] && RARITIES[i.rarity]).slice(0,108) : [];
      merged.ownedWeapons = Array.isArray(saved.ownedWeapons) ? saved.ownedWeapons.filter(id => weaponById[id]) : ['snare'];
      if(!merged.ownedWeapons.includes('snare'))merged.ownedWeapons.unshift('snare');
      merged.baits = typeof saved.baits === 'object' && saved.baits ? saved.baits : {carrot:3};
      if(!locationById[merged.location]) merged.location='yard';
      if(!avatarById[merged.avatar])merged.avatar='ranger';
      if(!merchantById[merged.trade.merchantId])merged.trade.merchantId='forester';
      merged.kisyaCollected=Array.isArray(saved.kisyaCollected)?[...new Set(saved.kisyaCollected.filter(id=>locationById[id]))]:[];
      merged.sound=saved.sound!==false;merged.music=saved.music!==false;
      merged.sfxVolume=clamp(Number.isFinite(+saved.sfxVolume)?+saved.sfxVolume:.65,0,1);
      merged.musicVolume=clamp(Number.isFinite(+saved.musicVolume)?+saved.musicVolume:.26,0,1);
      return merged;
    }catch(e){ return defaultState(); }
  }
  let state = loadState();
  const save = () => {state.lastSavedAt=Date.now();localStorage.setItem(STORAGE_KEY, JSON.stringify(state));};
  const capacity = () => CAPACITY_LEVELS[state.capacityIndex] || CAPACITY_LEVELS.at(-1);
  const usedSlots = () => state.inventory.length + state.ownedWeapons.length;
  const allLocationsUnlocked = () => LOCATIONS.every(l => state.unlockedLocations.includes(l.id));
  const rebirthReward = () => Math.max(1, Math.floor(1 + state.totalCaught / 150 + state.coins / 2000000));

  const run = {active:false,waiting:false,current:null,combo:0,catches:0,shield:0,effect:null,startedAt:0,baitUsed:null,fleeTimer:0,fleeTicker:0,fleeAt:0,fleeLimit:0,penaltyTimer:0,penaltyTicker:0,glitchTimer:0,glitchToken:0};
  const timing = {x:0,dir:1,last:0,raf:0,speed:36,zoneStart:35,zoneWidth:30,perfectStart:47,perfectWidth:6};
  let currentTab = 'inventory';
  let longPressTimer = 0;
  let longPressFired = false;

  function weighted(items, getWeight){
    const weights = items.map(i => Math.max(0,getWeight(i)));
    let r = Math.random() * weights.reduce((a,b)=>a+b,0);
    for(let i=0;i<items.length;i++){ r-=weights[i]; if(r<=0) return items[i]; }
    return items.at(-1);
  }

  function inventoryMods(){
    const m={zone:0,speed:0,luck:0,value:0,xp:0,weight:0,perfect:0};
    state.inventory.forEach(item => {
      const mod=animalById[item.animalId]?.mod || {};
      Object.keys(m).forEach(k => m[k]+=mod[k]||0);
    });
    m.zone += state.souls*.012; m.luck += state.souls*.008; m.value += state.souls*.025; m.xp += state.souls*.01;
    m.zone=clamp(m.zone,-.2,.42); m.speed=clamp(m.speed,-.22,.25); m.luck=clamp(m.luck,-.14,.48);
    m.value=clamp(m.value,-.14,.8); m.xp=clamp(m.xp,-.12,.6); m.weight=clamp(m.weight,-.12,.5); m.perfect=clamp(m.perfect,-.24,.55);
    return m;
  }

  function seededRandom(seed){
    let x=(seed|0) ^ 0x6d2b79f5;return ()=>{x=Math.imul(x^(x>>>15),x|1);x^=x+Math.imul(x^(x>>>7),x|61);return ((x^(x>>>14))>>>0)/4294967296};
  }
  function shuffled(list,rng){const a=[...list];for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
  function ensureTradeState(now=Date.now()){
    const t=state.trade||(state.trade=defaultState().trade);let dirty=false;
    const marketBucket=Math.floor(now/MARKET_PERIOD);
    if(t.marketBucket!==marketBucket){
      const rng=seededRandom(marketBucket*173+41),pool=shuffled(ANIMALS.map(a=>a.id),rng);
      t.marketBucket=marketBucket;t.rate=Number((.82+rng()*.48).toFixed(2));t.priorities=pool.slice(0,3);t.marketEnds=(marketBucket+1)*MARKET_PERIOD;dirty=true;
    }
    const questBucket=Math.floor(now/QUEST_PERIOD);
    if(t.questBucket!==questBucket){
      const rng=seededRandom(questBucket*337+97),pool=shuffled(QUEST_TEMPLATES.map(q=>q.id),rng);
      t.questBucket=questBucket;t.quests=pool.slice(0,4).map(id=>({id,done:false}));t.questEnds=(questBucket+1)*QUEST_PERIOD;dirty=true;
    }
    if(!merchantById[t.merchantId]){t.merchantId='forester';dirty=true}
    if(dirty)save();return t;
  }

  function marketInfo(){
    const t=ensureTradeState(),merchant=merchantById[t.merchantId];
    return {rate:Number((t.rate*merchant.rate).toFixed(2)),orders:t.priorities,priorities:t.priorities,marketEnds:t.marketEnds,questEnds:t.questEnds,merchant};
  }

  function itemValue(item){
    const animal=animalById[item.animalId], rarity=RARITIES[item.rarity], market=marketInfo();
    const priorityBoost=market.priorities.includes(item.animalId)?1.35:1;
    return Math.max(1,Math.round(animal.base*rarity.value*(.68+item.weight/Math.max(1,animal.weight[1])*.65)*item.quality*market.rate*priorityBoost));
  }

  function questMatches(item,q){
    if(q.animals&&!q.animals.includes(item.animalId))return false;
    if(RARITY_ORDER.indexOf(item.rarity)<(q.minTier||0))return false;
    if(q.perfect&&!item.perfect)return false;
    if(q.minWeight&&item.weight<q.minWeight)return false;
    return true;
  }
  function questReward(q){
    const market=marketInfo(),merchant=market.merchant;
    const targets=q.animals?.length?q.animals.map(id=>animalById[id]).filter(Boolean):[];
    const base=q.rewardBase||(targets.length?Math.max(...targets.map(a=>a.base)):900);
    const rarityMult=RARITIES[RARITY_ORDER[q.minTier||0]].value;
    const priority=q.animals?.some(id=>market.priorities.includes(id))?1.35:1;
    const elite=merchant.id==='baron'&&((q.minTier||0)>=2||q.perfect)?1.18:1;
    return Math.max(300,Math.round(base*rarityMult*q.count*q.mult*market.rate*merchant.reward*priority*elite));
  }
  function timeLeft(ts){const s=Math.max(0,Math.ceil((ts-Date.now())/1000));return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`}

  function rankData(){
    const level=Math.max(1,Math.floor(Math.sqrt(state.xp/90))+1);
    const floor=Math.pow(level-1,2)*90, ceil=Math.pow(level,2)*90;
    return {level,name:RANKS[Math.min(RANKS.length-1,Math.floor((level-1)/3))],progress:(state.xp-floor)/(ceil-floor)};
  }

  function rarityRoll(animal,luck=0){
    const allowed=animal.rarities;
    return weighted(allowed,id => {
      const r=RARITIES[id];
      const tier=['common','uncommon','rare','epic','legendary'].indexOf(id);
      return r.weight * (tier>=2 ? 1+luck*2.8 : 1-luck*.65);
    });
  }

  function attractionWeight(id,bait){
    if(!bait) return 1;
    let w=bait.tags.includes(id)?2.15:1;
    if(bait.mod.predator && ['fox','wolf','lynx','snow_leopard','bear','wolverine','shadow_panther'].includes(id)) w*=1+bait.mod.predator;
    if(bait.mod.frost && ['snow_leopard','mammoth','wolf','moose','wolverine','storm_ram'].includes(id)) w*=1+bait.mod.frost;
    return w;
  }

  function randomEncounter(){
    const loc=locationById[state.location];
    const bait=run.baitUsed ? baitById[run.baitUsed] : null;
    const animal=animalById[weighted(loc.species,id => attractionWeight(id,bait))];
    const inv=inventoryMods();
    const luck=loc.mod.luck+(bait?.mod.luck||0)+inv.luck+(run.effect?.mod.luck||0)+run.combo*.003;
    const rarity=rarityRoll(animal,luck);
    return {animal,rarity};
  }

  function rollLoot(animal){
    // Exact requested odds: 90% one drop, 10% two different drops.
    const count=Math.random()<.10?2:1;
    const pool=[...animal.loot].sort(()=>Math.random()-.5);
    return pool.slice(0,count);
  }

  function makeCapture(encounter,perfect){
    const {animal,rarity}=encounter;
    const bait=run.baitUsed ? baitById[run.baitUsed] : null;
    const loc=locationById[state.location];
    const inv=inventoryMods();
    const wmod=1+(bait?.mod.weight||0)+(loc.mod.weight||0)+inv.weight;
    const weight=Number(rand(animal.weight[0],animal.weight[1])*wmod).toFixed(1);
    const quality=(perfect?1.35:1)*(1+(bait?.mod.value||0)+(loc.mod.value||0)+(run.effect?.mod.value||0)+inv.value);
    return {uid:`${Date.now()}-${Math.random().toString(16).slice(2)}`,animalId:animal.id,rarity,weight:Number(weight),loot:rollLoot(animal),quality:Math.max(.35,quality),perfect,caughtAt:Date.now()};
  }

  function setText(id,text){const el=$(id);if(el)el.textContent=text;}
  function rarityClass(id){return `rarity-text-${id}`;}

  function renderHeader(){
    const rank=rankData();state.level=rank.level;
    setText('#coinsValue',compact(state.coins));setText('#inventoryValue',`${usedSlots()}/${capacity()}`);setText('#soulsValue',compact(state.souls));
    setText('#rankName',rank.name);setText('#rankLevel',`УР. ${rank.level}`);$('#rankProgress').style.width=`${clamp(rank.progress*100,0,100)}%`;
    setText('#soundIcon',(state.sound||state.music)?'♪':'×');setText('#mobileBagCount',usedSlots());
    const avatar=$('#playerAvatar');if(avatar){avatar.src=`assets/avatars/${state.avatar}.png`;avatar.alt=avatarById[state.avatar].name;}
  }

  function renderLocations(){
    const root=$('#locationList');
    root.innerHTML=LOCATIONS.map((loc,i)=>{
      const unlocked=state.unlockedLocations.includes(loc.id), active=state.location===loc.id;
      return `<button class="location-card ${active?'is-active':''} ${unlocked?'':'is-locked'}" data-location="${loc.id}" style="--card-texture:url('assets/backgrounds/${loc.id}.png')" title="БАФФ: ${loc.buff} | ДЕБАФФ: ${loc.debuff}">
        <span class="location-card__icon">${unlocked?loc.icon:'▨'}</span>
        <span class="location-card__copy"><small>${loc.sector}</small><b>${loc.name}</b><em><span>▲ ${loc.buff.split(': ')[1]}</span><span class="bad">▼ ${loc.debuff.split(': ')[1]}</span></em></span>
        <span class="location-card__side">${unlocked?`<strong>${loc.species.length} видов</strong><span>${active?'ВЫБРАНО':'ПЕРЕЙТИ'}</span>`:`<strong>${fmt(loc.price)} ₽</strong><span>ОТКРЫТЬ</span>`}</span>
      </button>`;
    }).join('');
    $$('[data-location]',root).forEach(btn=>btn.addEventListener('click',()=>chooseLocation(btn.dataset.location)));
  }

  function chooseLocation(id){
    if(run.active){toast('Сначала заверши вылазку','Локацию нельзя сменить на бегу.',true);return;}
    const loc=locationById[id];let opened=false;
    if(!state.unlockedLocations.includes(id)){
      if(state.coins<loc.price){toast('Не хватает монет',`Нужно ещё ${fmt(loc.price-state.coins)} ₽.`,true);return;}
      state.coins-=loc.price;state.unlockedLocations.push(id);opened=true;playSfx('newworld',.78);toast('Новый мир открыт',loc.name);burst(window.innerWidth<1040?55:300,170,45,'#e4c15e');
    }else playSfx('lol',.24);
    state.location=id;save();renderAll();const scene=$('#scene');scene.classList.add('scene-swap');setTimeout(()=>scene.classList.remove('scene-swap'),650);
    if(opened&&allLocationsUnlocked())toast('Цикл завершён','В торговом посту доступно перерождение.');if(window.innerWidth<1040)setMobilePage('hunt');
  }

  function renderScene(){
    const loc=locationById[state.location];$('#scene').className=`scene ${loc.class}`;
    setText('#locationEyebrow',loc.sector);setText('#locationTitle',loc.name);const weather=pick(loc.weather);$('#weatherChip').innerHTML=`<span>${loc.icon}</span><div><small>УСЛОВИЕ</small><b>${weather}</b></div>`;
    if(!run.active && !run.current){
      setText('#animalName','Следов не видно');setText('#animalRarity','РАЗВЕДКА');setText('#animalDifficulty','Нажми «Начать»');
      $('#animalSprite').src='assets/animals/rabbit.gif';$('#animalSprite').alt='Силуэт зайца';$('#animalStage').className='animal-stage is-idle';
      $('#escapeClock')?.classList.add('is-hidden');$('#penaltyOverlay')?.classList.add('is-hidden');$('#glitchDrop')?.classList.add('is-hidden');
    }
    maybeSpawnKisya();
  }

  function maybeSpawnKisya(force=false){
    const cat=$('#kisya'),locId=state.location,spot=CAT_SPOTS[locId];if(!cat||!spot)return;
    const collected=state.kisyaCollected.includes(locId);
    if(collected&&!force){cat.className='kisya is-hidden';cat.removeAttribute('data-location');return;}
    cat.style.left=`${spot.left}%`;cat.style.top=`${spot.top}%`;cat.style.setProperty('--cat-scale',spot.scale||1);
    cat.dataset.location=locId;cat.className=`kisya is-spawned${spot.flip?' is-flipped':''}`;
    cat.setAttribute('aria-label',`Найти кисю: ${locationById[locId].name}`);
  }
  function collectKisya(){
    const cat=$('#kisya'),locId=cat?.dataset.location;if(!cat||cat.classList.contains('is-hidden')||locId!==state.location||state.kisyaCollected.includes(locId))return;
    state.kisyaCollected.push(locId);state.coins+=1000;state.kisyaFound++;save();cat.classList.add('is-found');playSfx('meow',.9);renderHeader();
    const r=cat.getBoundingClientRect();burst(r.left+r.width/2,r.top+r.height/2,34,'#f2c96b');toast('Кися найдена!',`${locationById[locId].name}: +1 000 ₽. Осталось ${LOCATIONS.length-state.kisyaCollected.length}.`);
    setTimeout(()=>{if(cat.dataset.location===locId)cat.className='kisya is-hidden'},430);
  }

  function renderLoadout(){
    const w=weaponById[state.equippedWeapon];
    const b=baitById[state.equippedBait]; const count=state.baits[state.equippedBait]||0;
    setText('#equippedWeaponName',w.name);
    setText('#equippedBaitName',b&&count?`${b.name} ×${count}`:'Без приманки');
    setText('#runCatchCount',run.catches);
  }

  function renderInventory(){
    const root=$('#inventoryGrid'), cap=capacity();
    const slots=[];
    state.ownedWeapons.forEach(id=>{
      const w=weaponById[id],equipped=state.equippedWeapon===id;
      slots.push(`<button class="inventory-slot weapon-slot ${equipped?'is-equipped':''}" data-weapon-slot="${id}" aria-label="Оружие: ${w.name}"><span class="inventory-slot__badge">${equipped?'✓':'⚔'}</span><span class="inventory-slot__count">1 слот</span><strong class="inventory-weapon-icon">${w.icon}</strong><i class="inventory-slot__rarity" style="--rarity:#78c5d4"></i></button>`);
    });
    state.inventory.forEach((item,index)=>{
      const animal=animalById[item.animalId], rarity=RARITIES[item.rarity];
      slots.push(`<button class="inventory-slot" data-item="${item.uid}" data-index="${index}" aria-label="${animal.name}, ${rarity.name}"><span class="inventory-slot__badge">${item.perfect?'✦':'·'}</span><span class="inventory-slot__count">${item.loot.length}×</span><img src="assets/animals/${animal.id}.gif" alt="" /><i class="inventory-slot__rarity" style="--rarity:${rarity.color}"></i></button>`);
    });
    for(let i=usedSlots();i<cap;i++)slots.push('<span class="inventory-slot is-empty" aria-hidden="true"></span>');
    root.innerHTML=slots.join('');
    const p=usedSlots()/cap*100;setText('#capacityText',`${usedSlots()} / ${cap}`);setText('#weaponSlotText',`⚔ ${state.ownedWeapons.length} оруж.`);$('#capacityBar').style.width=`${p}%`;
    const directWorth=state.inventory.reduce((sum,i)=>sum+itemValue(i),0);setText('#saleInventoryWorth',`${fmt(directWorth)} ₽`);setText('#contractInventoryWorth',`${fmt(directWorth)} ₽`);
    const next=CAPACITY_LEVELS[state.capacityIndex+1], price=CAPACITY_PRICES[state.capacityIndex];
    if(next){$('#capacityUpgradeButton').disabled=false;setText('#capacityUpgradeTitle',`Расширить до ${next}`);setText('#capacityUpgradeBenefit',`+${next-cap} ячеек`);setText('#capacityUpgradePrice',`${fmt(price)} ₽`);}
    else{$('#capacityUpgradeButton').disabled=true;setText('#capacityUpgradeTitle','Максимальный рюкзак');setText('#capacityUpgradeBenefit',`${cap} ячеек открыто`);setText('#capacityUpgradePrice','MAX');}
    $$('.inventory-slot[data-item]',root).forEach(bindInventoryItem);
    $$('.inventory-slot[data-weapon-slot]',root).forEach(bindWeaponSlot);
  }

  function bindWeaponSlot(el){
    const getWeapon=()=>weaponById[el.dataset.weaponSlot];
    el.addEventListener('mouseenter',e=>{if(innerWidth<=1040)return;const w=getWeapon(),t=$('#itemTooltip');t.innerHTML=`<small>ОРУЖИЕ · 1 ЯЧЕЙКА</small><b>${w.name}</b><p>${w.desc}</p><div class="tip-trait">Окно ${w.zone}% · скорость ×${w.speed.toFixed(2)}</div><div class="tip-trait">Perfect ${Math.round(w.perfect*100)}% · страховка ${w.shield}</div>${w.timeWarp?`<div class="tip-trait bad">Время зверя ×${w.timeWarp.toFixed(2)}</div>`:''}`;t.classList.add('is-visible');positionTooltip(e)});
    el.addEventListener('mousemove',positionTooltip);el.addEventListener('mouseleave',hideTooltip);
    el.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse')return;longPressFired=false;clearTimeout(longPressTimer);longPressTimer=setTimeout(()=>{longPressFired=true;vibrate(22);openWeaponModal(getWeapon())},520)});
    ['pointerup','pointercancel','pointerleave'].forEach(n=>el.addEventListener(n,()=>clearTimeout(longPressTimer)));
    el.addEventListener('click',()=>{if(longPressFired){longPressFired=false;return}openWeaponModal(getWeapon())});
  }

  function openWeaponModal(w){
    if(!w)return;hideTooltip();playSfx('lol',.28);const equipped=state.equippedWeapon===w.id;
    openModal(`<div class="modal-kicker">ОРУЖИЕ · ЗАНИМАЕТ 1 ЯЧЕЙКУ</div><h2 class="modal-title" id="modalTitle">${w.icon} ${w.name}</h2><p class="modal-copy">${w.desc}</p><div class="stats-grid"><div class="stat-card"><small>ЗЕЛЁНОЕ ОКНО</small><b>${w.zone}%</b></div><div class="stat-card"><small>СКОРОСТЬ СТРЕЛКИ</small><b>×${w.speed.toFixed(2)}</b></div><div class="stat-card"><small>PERFECT</small><b>${Math.round(w.perfect*100)}%</b></div><div class="stat-card"><small>${w.timeWarp?'СКОРОСТЬ ВРЕМЕНИ':'СТРАХОВКА'}</small><b>${w.timeWarp?`×${w.timeWarp.toFixed(2)}`:w.shield}</b></div></div><button class="pixel-button button-primary small" data-equip-weapon="${w.id}" ${equipped?'disabled':''}><b>${equipped?'УЖЕ В РУКАХ':'ВЗЯТЬ В РУКИ'}</b></button>`);
    $('[data-equip-weapon]',$('#gameModal'))?.addEventListener('click',()=>{state.equippedWeapon=w.id;save();closeModal();renderAll();playSfx('lol',.3);toast('Оружие экипировано',w.name)});
  }

  function bindInventoryItem(el){
    const getItem=()=>state.inventory.find(i=>i.uid===el.dataset.item);
    el.addEventListener('mouseenter',e=>showTooltip(getItem(),e));
    el.addEventListener('mousemove',positionTooltip);
    el.addEventListener('mouseleave',hideTooltip);
    el.addEventListener('pointerdown',e=>{
      if(e.pointerType==='mouse')return;
      longPressFired=false;clearTimeout(longPressTimer);
      longPressTimer=setTimeout(()=>{longPressFired=true;vibrate(22);openItemModal(getItem());},520);
    });
    ['pointerup','pointercancel','pointerleave'].forEach(n=>el.addEventListener(n,()=>clearTimeout(longPressTimer)));
    el.addEventListener('click',()=>{if(longPressFired){longPressFired=false;return;}openItemModal(getItem());});
  }

  function tooltipHtml(item){
    if(!item)return '';
    const a=animalById[item.animalId],r=RARITIES[item.rarity];
    return `<small style="color:${r.color}">${r.name} · ${item.weight} КГ</small><b>${a.name}</b><p>${a.desc}</p><div class="tip-trait">▲ ${a.buff}</div><div class="tip-trait bad">▼ ${a.debuff}</div><p style="margin-top:9px">��ут: ${item.loot.join(' + ')} · ${fmt(itemValue(item))} ₽</p>`;
  }
  function showTooltip(item,e){if(window.innerWidth<=1040)return;const t=$('#itemTooltip');t.innerHTML=tooltipHtml(item);t.classList.add('is-visible');positionTooltip(e)}
  function positionTooltip(e){const t=$('#itemTooltip');if(!t.classList.contains('is-visible'))return;const x=clamp(e.clientX+16,12,window.innerWidth-292),y=clamp(e.clientY+14,12,window.innerHeight-t.offsetHeight-12);t.style.left=`${x}px`;t.style.top=`${y}px`}
  function hideTooltip(){$('#itemTooltip').classList.remove('is-visible')}

  function openItemModal(item){
    if(!item)return;hideTooltip();playSfx('lol',.28);const a=animalById[item.animalId],r=RARITIES[item.rarity],price=itemValue(item);
    const loot=a.loot.map(name=>`<div class="loot-line"><b>${item.loot.includes(name)?'ПОЛУЧЕНО':'ВОЗМОЖНО'}</b><small>${name}</small></div>`).join('');
    openModal(`<div class="modal-kicker" style="color:${r.color}">${r.name} · ${item.weight} КГ</div><h2 class="modal-title" id="modalTitle">${a.name}</h2><div class="modal-animal"><img src="assets/animals/${a.id}.gif" alt="${a.name}"><p class="modal-copy">${a.desc}</p></div><div class="modal-traits"><div class="modal-trait">▲ ${a.buff}</div><div class="modal-trait bad">▼ ${a.debuff}</div></div><div class="loot-lines">${loot}</div><p class="modal-copy">Продать сейчас: <b style="color:#e8c565">${fmt(price)} ₽</b>. Контракт может заплатить в несколько раз больше, если трофей подходит заданию.</p><div class="modal-actions"><button class="pixel-button button-primary" data-sell-modal="${item.uid}"><b>ПРОДАТЬ · ${fmt(price)} ₽</b></button><button class="pixel-button button-secondary" data-open-contracts><b>КОНТРАКТЫ</b></button></div>`);
    $('[data-sell-modal]',$('#gameModal'))?.addEventListener('click',()=>{closeModal();sellOne(item.uid)});$('[data-open-contracts]',$('#gameModal'))?.addEventListener('click',openContracts);
  }

  function renderWeapons(){
    $('#weaponsList').innerHTML=WEAPONS.map((w,i)=>{
      const owned=state.ownedWeapons.includes(w.id),equipped=state.equippedWeapon===w.id;
      return `<article class="shop-card ${equipped?'is-equipped':''}"><span class="shop-card__icon">${w.icon}</span><div class="shop-card__copy"><small>МОДЕЛЬ ${String(i+1).padStart(2,'0')} · ОКНО ${w.zone}%</small><b>${w.name}</b><p>${w.desc} <span class="slot-note">▦ 1 слот</span></p></div><button class="shop-card__action ${!owned&&state.coins>=w.price&&usedSlots()<capacity()?'can-buy':''}" data-weapon="${w.id}" ${equipped?'disabled':''}>${equipped?'В РУКАХ':owned?'ВЗЯТЬ':`${fmt(w.price)} ₽`}</button></article>`;
    }).join('');
    $$('[data-weapon]').forEach(b=>b.addEventListener('click',()=>buyOrEquipWeapon(b.dataset.weapon)));
  }
  function buyOrEquipWeapon(id){
    if(run.active){toast('Арсенал закрыт','Смени оружие после вылазки.',true);return;}
    const w=weaponById[id];
    if(!state.ownedWeapons.includes(id)){
      if(usedSlots()>=capacity()){toast('Нет свободной ячейки','Оружие тоже занимает место. Расширь рюкзак.',true);openTab('inventory');return;}
      if(state.coins<w.price){toast('Не хватает монет',`Нужно ещё ${fmt(w.price-state.coins)} ₽.`,true);return;}
      state.coins-=w.price;state.ownedWeapons.push(id);playSfx('buy',.78);toast('Оружие куплено',`${w.name} заняло 1 ячейку.`);
    }else playSfx('lol',.24);
    state.equippedWeapon=id;save();renderAll();
  }

  function renderBaits(){
    $('#baitsList').innerHTML=BAITS.map((b,i)=>{
      const count=state.baits[b.id]||0,equipped=state.equippedBait===b.id&&count>0;
      return `<article class="shop-card ${equipped?'is-equipped':''}"><span class="shop-card__icon">${b.icon}</span><div class="shop-card__copy"><small>РЕЦЕПТ ${String(i+1).padStart(2,'0')} · В НАЛИЧИИ ${count}</small><b>${b.name}</b><div class="trait-row"><span class="trait-chip">▲ ${b.buff}</span><span class="trait-chip bad">▼ ${b.debuff}</span></div></div><button class="shop-card__action ${state.coins>=b.price?'can-buy':''}" data-bait="${b.id}" data-mode="${count?'equip':'buy'}">${equipped?'ЕЩЁ ×3':count?'ВЫБРАТЬ':`${fmt(b.price)} ₽ / ×3`}</button></article>`;
    }).join('');
    $$('[data-bait]').forEach(b=>b.addEventListener('click',()=>buyOrEquipBait(b.dataset.bait)));
  }
  function buyOrEquipBait(id){
    if(run.active){toast('Стол закрыт','Приманка уже лежит на следу.',true);return;}
    const b=baitById[id],count=state.baits[id]||0;
    if(count>0 && state.equippedBait!==id){state.equippedBait=id;playSfx('lol',.24);toast('Приманка выбрана',b.name);}
    else{
      if(state.coins<b.price){toast('Не хватает монет',`Нужно ещё ${fmt(b.price-state.coins)} ₽.`,true);return;}
      state.coins-=b.price;state.baits[id]=(state.baits[id]||0)+3;state.equippedBait=id;playSfx('buy',.75);toast('Приманка приготовлена',`${b.name} ×3`);
    }
    save();renderAll();
  }

  function renderSale(){
    const market=marketInfo(),merchant=market.merchant,items=state.inventory,total=items.reduce((sum,i)=>sum+itemValue(i),0);
    setText('#saleMarketRate',`×${market.rate.toFixed(2)}`);setText('#saleMarketTimer',timeLeft(state.trade.marketEnds));setText('#saleInventoryWorth',`${fmt(total)} ₽`);setText('#saleInventoryCount',`${items.length} троф.`);
    $('#saleMerchant').innerHTML=`<div class="merchant-avatar">${merchant.icon}</div><div><small>ПРЯМАЯ ПОКУПКА · ${merchant.tag}</small><b>${merchant.name}</b><p>Платит сразу по текущему курсу. Контракты выгоднее, но требуют набор.</p></div>`;
    $('#salePriorityList').innerHTML=market.priorities.map(id=>{const a=animalById[id];return `<span title="${a.name}"><img src="assets/animals/${id}.gif" alt=""><b>${a.name}</b><em>×1.35</em></span>`}).join('');
    $('#saleList').innerHTML=items.length?items.map(item=>{const a=animalById[item.animalId],r=RARITIES[item.rarity],price=itemValue(item);return `<article class="sale-card"><img src="assets/animals/${a.id}.gif" alt=""><div><small style="color:${r.color}">${r.name} · ${item.weight} КГ</small><b>${a.name}</b><p>${item.perfect?'✦ IDEAL · ':''}${item.loot.join(' + ')}</p></div><div class="sale-card__action"><strong>${fmt(price)} ₽</strong><button data-sell-one="${item.uid}">ПРОДАТЬ</button></div></article>`}).join(''):`<div class="empty-sale"><b>РЮКЗАК ПУСТ</b><p>Сначала поймай трофей, затем возвращайся к закупщику.</p></div>`;
    $('#saleAllButton').disabled=!items.length;$$('[data-sell-one]',$('#saleList')).forEach(b=>b.addEventListener('click',()=>sellOne(b.dataset.sellOne)));
  }
  function sellOne(uid){
    if(run.active){toast('Не на ходу','Продажа доступна после возвращения.',true);return}const ix=state.inventory.findIndex(i=>i.uid===uid);if(ix<0)return;
    const item=state.inventory[ix],a=animalById[item.animalId],price=itemValue(item);state.inventory.splice(ix,1);state.coins+=price;state.totalSold+=price;save();playSfx('buy',.62);renderAll();toast('��рофей продан',`${a.name} · +${fmt(price)} ₽`);
  }
  function sellAll(){
    if(run.active){toast('Не на ходу','Продажа доступна после возвращения.',true);return}if(!state.inventory.length){toast('Рюкзак пуст','Продавать пока нечего.',true);return}
    const count=state.inventory.length,total=state.inventory.reduce((sum,i)=>sum+itemValue(i),0);state.inventory=[];state.coins+=total;state.totalSold+=total;save();playSfx('buy',.72);renderAll();burst(innerWidth-160,innerHeight*.45,38,'#efc35d');toast('Партия продана',`${count} трофеев · +${fmt(total)} ₽`);
  }

  function renderTrade(){
    const t=ensureTradeState(),market=marketInfo(),merchant=market.merchant;
    setText('#marketRate',`×${market.rate.toFixed(2)}`);setText('#marketMood',`${merchant.name} · ${merchant.tag}`);
    $('#merchantPicker').innerHTML=MERCHANTS.map(m=>`<button class="merchant-option ${m.id===t.merchantId?'is-active':''}" data-merchant="${m.id}"><span>${m.icon}</span><b>${m.name}</b><small>контракты ×${m.reward.toFixed(2)}</small></button>`).join('');
    $('#activeMerchant').innerHTML=`<div class="merchant-avatar">${merchant.icon}</div><div><small>${merchant.tag}</small><b>${merchant.name}</b><p>${merchant.desc}</p></div>`;
    $('#priorityList').innerHTML=market.priorities.map(id=>{const a=animalById[id];return `<span title="${a.name}"><img src="assets/animals/${id}.gif" alt=""><b>${a.name}</b><em>×1.35</em></span>`}).join('');
    $('#orderList').innerHTML=t.quests.map(entry=>{
      const q=questById[entry.id],matches=state.inventory.filter(i=>questMatches(i,q)),ready=matches.length>=q.count,reward=questReward(q),preview=q.animals?.[0];
      return `<article class="quest-card ${entry.done?'is-done':ready?'is-ready':''}"><div class="quest-card__icon">${preview?`<img src="assets/animals/${preview}.gif" alt="">`:'▦'}</div><div class="quest-card__copy"><small>КОНТРАКТ · ${Math.min(matches.length,q.count)}/${q.count}</small><b>${q.title}</b><p>${q.desc}</p><div class="quest-progress"><i style="width:${Math.min(100,matches.length/q.count*100)}%"></i></div></div><div class="quest-card__action"><strong>+${fmt(reward)} ₽</strong><button data-quest="${q.id}" ${entry.done||!ready?'disabled':''}>${entry.done?'ГОТОВО':ready?'ВЫПОЛНИТЬ':'СОБИРАТЬ'}</button></div></article>`;
    }).join('');
    setText('#contractInventoryWorth',`${fmt(state.inventory.reduce((sum,i)=>sum+itemValue(i),0))} ₽`);
    $('#statsGrid').innerHTML=`<div class="stat-card"><small>КОНТРАКТОВ</small><b>${fmt(state.contractsDone)}</b></div><div class="stat-card"><small>ЗАРАБОТАНО</small><b>${compact(state.contractEarned)} ₽</b></div><div class="stat-card"><small>КИСЬ НАЙДЕНО</small><b>${fmt(state.kisyaFound)}</b></div><div class="stat-card"><small>ПОЙМАНО</small><b>${fmt(state.totalCaught)}</b></div><div class="stat-card"><small>ПЕРЕРОЖДЕНИЙ</small><b>${state.rebirths}</b></div><div class="stat-card"><small>ДУШ ЦИКЛА</small><b>${state.souls}</b></div>`;
    $$('[data-merchant]',$('#merchantPicker')).forEach(b=>b.addEventListener('click',()=>selectMerchant(b.dataset.merchant)));
    $$('[data-quest]',$('#orderList')).forEach(b=>b.addEventListener('click',()=>completeQuest(b.dataset.quest)));
    updateTradeTimers();renderRebirth();
  }

  function updateTradeTimers(){
    const t=ensureTradeState();setText('#marketTimer',timeLeft(t.marketEnds));setText('#questTimer',timeLeft(t.questEnds));
  }
  function refreshTradeClock(){
    const before=`${state.trade.marketBucket}:${state.trade.questBucket}`;ensureTradeState();const after=`${state.trade.marketBucket}:${state.trade.questBucket}`;
    if(currentTab==='contracts'){if(before!==after)renderTrade();else updateTradeTimers()}else if(currentTab==='sale'){if(before!==after)renderSale();else{setText('#saleMarketTimer',timeLeft(state.trade.marketEnds));setText('#saleMarketRate',`×${marketInfo().rate.toFixed(2)}`)}}
  }
  function selectMerchant(id){
    if(run.active){toast('Закупщик ждёт','Выбери торговца после вылазки.',true);return}if(!merchantById[id])return;state.trade.merchantId=id;save();playSfx('lol',.3);renderTrade();renderSale();toast('Закупщик выбран',merchantById[id].name);
  }
  function completeQuest(id){
    if(run.active){toast('Не на ходу','Контракт сдаётся только после возвращения.',true);return}
    ensureTradeState();const entry=state.trade.quests.find(x=>x.id===id),q=questById[id];if(!entry||!q||entry.done)return;
    const items=state.inventory.filter(i=>questMatches(i,q)).slice(0,q.count);if(items.length<q.count){toast('Контракт не готов',`Подходящих трофеев: ${items.length} из ${q.count}.`,true);return}
    const ids=new Set(items.map(i=>i.uid)),reward=questReward(q);state.inventory=state.inventory.filter(i=>!ids.has(i.uid));entry.done=true;state.coins+=reward;state.contractsDone++;state.contractEarned+=reward;save();playSfx('buy',.84);renderAll();burst(innerWidth-150,innerHeight*.42,46,'#efc35d');toast('Контракт выполнен',`${q.title} · +${fmt(reward)} ₽`);
  }
  function openTradeHelp(){
    openModal(`<div class="modal-kicker">КОНТРАКТНАЯ БИРЖА</div><h2 class="modal-title" id="modalTitle">КАК ПОЛУЧАТЬ ДЕНЬГИ</h2><p class="modal-copy">Прямая продажа находится в отдельной вкладке «ПРОДАЖА». Здесь собирай подходящие трофеи и сдавай их пачками по четырём активным контрактам. Награда обычно в 3–6 раз выше простой оценки трофеев.</p><div class="modal-traits"><div class="modal-trait">▲ Курс и три приоритетных животных меняются каждые 5 минут.</div><div class="modal-trait">▲ Четыре задания выбираются из 20 шаблонов каждые 15 минут.</div><div class="modal-trait bad">▼ Выполненные задания не повторяются до следующего цикла.</div></div><button class="pixel-button button-primary small" data-modal-close><b>ПОНЯТНО</b></button>`);
  }

  function renderRebirth(){
    const ready=allLocationsUnlocked(),reward=rebirthReward(),card=$('#rebirthCard');if(!card)return;
    card.classList.toggle('is-ready',ready);setText('#rebirthProgress',ready?'ВСЕ СЕКТОРЫ ОТКРЫТЫ':`${state.unlockedLocations.length} / ${LOCATIONS.length} СЕКТОРОВ`);
    setText('#rebirthReward',`+${reward} душ`);setText('#rebirthBonus',`Постоянно: зона +${Math.round((state.souls+reward)*1.2)}% · цена +${Math.round((state.souls+reward)*2.5)}%`);
    $('#rebirthButton').disabled=!ready;
  }

  function renderTabs(){
    $$('.side-tab').forEach(b=>b.classList.toggle('is-active',b.dataset.tab===currentTab));
    $$('.tab-pane').forEach(p=>p.classList.toggle('is-active',p.id===`tab-${currentTab}`));
  }

  function renderAll(){renderHeader();renderLocations();renderScene();renderLoadout();renderInventory();renderWeapons();renderBaits();renderSale();renderTrade();renderTabs()}

  function newEvent(){return Math.random()<.35?pick(EVENTS):null}

  function startRun(){
    if(run.active)return;
    if(usedSlots()>=capacity()){toast('Рюкзак забит','Оружие и трофеи делят одни ячейки.',true);openTab('inventory');return;}
    run.active=true;run.waiting=true;run.combo=0;run.catches=0;run.current=null;run.shield=weaponById[state.equippedWeapon].shield;run.startedAt=Date.now();run.effect=null;
    $('#runBadge').classList.add('is-live');$('#runBadge b').textContent='ВЫЛАЗКА ИДЁТ';$('.hunt-console')?.classList.add('is-live');
    $('#fleeButton').disabled=false;setText('#comboValue','0');setText('#huntButtonText','ИЩЕМ СЛЕД…');setText('#huntHotkey','SPACE');
    toast('Вылазка началась','Не медли: зверь может сбежать и оставить штраф ожидания.');
    setTimeout(nextEncounter,520);
  }

  function nextEncounter(){
    if(!run.active)return;clearEncounterTimers();
    if(usedSlots()>=capacity()){endRun('full');return;}
    $('#penaltyOverlay').classList.add('is-hidden');$('#runBadge b').textContent='ВЫЛАЗКА ИДЁТ';
    run.waiting=true;run.effect=newEvent();
    const bait=baitById[state.equippedBait],count=state.baits[state.equippedBait]||0;
    run.baitUsed=count>0?state.equippedBait:null;
    if(run.baitUsed){state.baits[run.baitUsed]=count-1;if(state.baits[run.baitUsed]<=0)state.baits[run.baitUsed]=0;save();}
    run.current=randomEncounter();setupTiming();showEncounter();
    setTimeout(()=>{if(!run.active)return;run.waiting=false;timing.last=performance.now();timing.raf=requestAnimationFrame(tick);setText('#huntButtonText','ПОЙМАТЬ!');setText('#timingPrompt','ЖМИ В ЗЕЛЁНОМ');startFleeClock();showVoidGlitch();},380);
    renderLoadout();renderBaits();
  }

  function clearEncounterTimers(){
    clearTimeout(run.fleeTimer);clearInterval(run.fleeTicker);clearTimeout(run.penaltyTimer);clearInterval(run.penaltyTicker);clearTimeout(run.glitchTimer);
    run.fleeTimer=run.fleeTicker=run.penaltyTimer=run.penaltyTicker=run.glitchTimer=0;
    $('#escapeClock')?.classList.add('is-hidden');$('#glitchDrop')?.classList.add('is-hidden');
  }

  function startFleeClock(){
    const diff=run.current.animal.diff,weapon=weaponById[state.equippedWeapon];
    const baseLimit=clamp(9400-diff*1900+(1-weapon.speed)*900,4200,8200)/(weapon.timeWarp||1);run.fleeLimit=state.location==='void'?Math.max(5600,baseLimit):baseLimit;run.fleeAt=performance.now()+run.fleeLimit;
    $('#escapeClock').classList.remove('is-hidden');$('#escapeBar').style.width='100%';
    run.fleeTicker=setInterval(()=>{const left=clamp((run.fleeAt-performance.now())/run.fleeLimit,0,1);$('#escapeBar').style.width=`${left*100}%`;$('#escapeClock').classList.toggle('is-critical',left<.28)},50);
    run.fleeTimer=setTimeout(animalEscaped,run.fleeLimit);
  }

  function showVoidGlitch(){
    const img=$('#glitchDrop');img.className='glitch-drop is-hidden';if(state.location!=='void')return;
    const token=Date.now();run.glitchToken=token;img.style.width=`${rand(22,30)}%`;img.classList.toggle('is-reverse',Math.random()<.5);
    img.onload=()=>{if(run.active&&!run.waiting&&run.glitchToken===token)img.classList.remove('is-hidden')};
    img.onerror=()=>{img.classList.add('is-hidden');if(!showVoidGlitch.warned){showVoidGlitch.warned=true;toast('Нет мусор-дроп.gif','Положи свой файл рядом с index.html — игра подключит его автоматически.',true)}};
    img.src=`мусор-дроп.gif?${token}`;run.glitchTimer=setTimeout(()=>{img.classList.add('is-hidden');run.glitchToken=0},5000);
  }

  function animalEscaped(){
    if(!run.active||run.waiting||!run.current)return;cancelAnimationFrame(timing.raf);clearEncounterTimers();run.waiting=true;state.escaped++;
    const animal=run.current.animal;run.combo=Math.max(0,run.combo-2);setText('#comboValue',run.combo);setText('#timingPrompt','ЗВЕРЬ СБЕЖАЛ');setText('#huntButtonText','ШУМ НА ТРОПЕ…');
    $('#animalStage').classList.remove('is-arriving');$('#animalStage').classList.add('is-missed');$('#runBadge b').textContent='СЛЕД ПОТЕРЯН';
    const wait=Math.round(clamp(4100+animal.diff*1250,5000,7600));const end=Date.now()+wait;$('#penaltyOverlay').classList.remove('is-hidden');
    run.penaltyTicker=setInterval(()=>setText('#penaltyCountdown',`${Math.max(0,(end-Date.now())/1000).toFixed(1)} сек.`),100);
    run.penaltyTimer=setTimeout(()=>{clearInterval(run.penaltyTicker);nextEncounter()},wait);
    save();playSfx('damage',.55);toast('Зверь убежал',`Штраф ожидания ${Math.round(wait/100)/10} сек. Серия −2.`,true);vibrate([80,40,80]);
  }

  function setupTiming(){
    const w=weaponById[state.equippedWeapon],loc=locationById[state.location],bait=run.baitUsed?baitById[run.baitUsed]:null,inv=inventoryMods(),a=run.current.animal;
    const event=run.effect?.mod||{};
    const zoneMod=1+loc.mod.zone+(bait?.mod.zone||0)+inv.zone+(event.zone||0);
    timing.zoneWidth=clamp(w.zone/a.diff*zoneMod,8,66);
    timing.zoneStart=rand(5,95-timing.zoneWidth);
    const perfectMod=clamp(1+(bait?.mod.perfect||0)+(loc.mod.perfect||0)+inv.perfect+(event.perfect||0),.35,2);
    timing.perfectWidth=clamp(timing.zoneWidth*w.perfect*perfectMod,2.5,timing.zoneWidth*.62);
    timing.perfectStart=timing.zoneStart+(timing.zoneWidth-timing.perfectWidth)/2;
    const speedMod=loc.mod.speed*(1+(bait?.mod.speed||0)+inv.speed+(event.speed||0));
    timing.speed=clamp(44*w.speed*a.diff*speedMod*(1+run.combo*.015),25,118);
    timing.x=Math.random()<.5?0:100;timing.dir=timing.x===0?1:-1;
    $('#goodZone').style.left=`${timing.zoneStart}%`;$('#goodZone').style.width=`${timing.zoneWidth}%`;
    $('#perfectZone').style.left=`${timing.perfectStart}%`;$('#perfectZone').style.width=`${timing.perfectWidth}%`;
    $('#timingMarker').style.left=`${timing.x}%`;
  }

  function showEncounter(){
    const {animal,rarity}=run.current,r=RARITIES[rarity];
    const stage=$('#animalStage');stage.className=`animal-stage is-arriving rarity-${rarity}`;
    $('#animalSprite').src=`assets/animals/${animal.id}.gif`;$('#animalSprite').alt=animal.name;
    setText('#animalName',animal.name);setText('#animalRarity',r.name);$('#animalRarity').className=rarityClass(rarity);
    setText('#animalDifficulty',`СЛОЖН. ${Math.round(animal.diff*10)}/27`);
    const chip=$('#effectChip');
    if(run.effect){chip.className=`effect-chip ${run.effect.type==='debuff'?'is-debuff':''}`;chip.textContent=`${run.effect.icon} ${run.effect.name} · ${run.effect.text}`;}else chip.className='effect-chip is-hidden';
  }

  function tick(now){
    if(!run.active||run.waiting)return;
    const dt=Math.min(.035,(now-timing.last)/1000);timing.last=now;
    timing.x+=timing.dir*timing.speed*dt;
    if(timing.x>=100){timing.x=100;timing.dir=-1}else if(timing.x<=0){timing.x=0;timing.dir=1}
    $('#timingMarker').style.left=`${timing.x}%`;$('#timingTrack').setAttribute('aria-valuenow',Math.round(timing.x));
    timing.raf=requestAnimationFrame(tick);
  }

  function attemptCatch(){
    if(!run.active){startRun();return;}if(run.waiting||!run.current)return;
    clearTimeout(run.fleeTimer);clearInterval(run.fleeTicker);clearTimeout(run.glitchTimer);$('#escapeClock').classList.add('is-hidden');$('#glitchDrop').classList.add('is-hidden');
    cancelAnimationFrame(timing.raf);run.waiting=true;
    const good=timing.x>=timing.zoneStart&&timing.x<=timing.zoneStart+timing.zoneWidth;
    const perfect=timing.x>=timing.perfectStart&&timing.x<=timing.perfectStart+timing.perfectWidth;
    if(good)catchSuccess(perfect);else catchMiss();
  }

  function catchSuccess(perfect){
    const item=makeCapture(run.current,perfect),a=run.current.animal,r=RARITIES[run.current.rarity];
    state.inventory.push(item);run.combo++;run.catches++;state.totalCaught++;state.bestCombo=Math.max(state.bestCombo,run.combo);if(perfect)state.perfects++;
    const bait=run.baitUsed?baitById[run.baitUsed]:null,inv=inventoryMods(),xpMod=1+(bait?.mod.xp||0)+(run.effect?.mod.xp||0)+inv.xp;
    state.xp+=Math.max(1,Math.round(r.xp*xpMod*(1+run.combo*.03)));
    save();
    $('#animalStage').classList.remove('is-arriving');$('#animalStage').classList.add('is-caught');
    setText('#timingPrompt',perfect?'ИДЕАЛЬНО!':'ПОЙМАНО');setText('#comboValue',run.combo);setText('#runCatchCount',run.catches);$('#comboDisplay').classList.add('bump');setTimeout(()=>$('#comboDisplay').classList.remove('bump'),300);
    flash(false);burst(window.innerWidth/2,window.innerHeight*.48,perfect?54:34,perfect?'#f3cd5e':r.color);playSfx(perfect?'perfect':'normal',perfect?.86:.72);vibrate(perfect?[22,30,22]:18);
    toast(perfect?'Идеальный тайминг!':'Трофей в рюкзаке',`${a.name} · ${r.name.toLowerCase()} · ${item.loot.length} лут${item.loot.length===2?'а':''}`);
    renderHeader();renderInventory();renderTrade();
    if(usedSlots()>=capacity())setTimeout(()=>endRun('full'),720);else setTimeout(nextEncounter,760);
  }

  function catchMiss(){
    $('#animalStage').classList.remove('is-arriving');$('#animalStage').classList.add('is-missed');flash(true);burst(window.innerWidth/2,window.innerHeight*.5,24,'#df6556');playSfx('damage',.82);vibrate([70,35,90]);
    if(run.shield>0){run.shield--;setText('#timingPrompt','СТРАХОВКА СРАБОТАЛА');toast('Гарпун удержал серию','Один промах погашен оружием.');setTimeout(nextEncounter,820);return;}
    setText('#timingPrompt','ПРОМАХ');setTimeout(()=>endRun('miss'),620);
  }

  function endRun(reason){
    if(!run.active)return;cancelAnimationFrame(timing.raf);clearEncounterTimers();run.active=false;run.waiting=false;run.current=null;
    $('#penaltyOverlay').classList.add('is-hidden');$('#runBadge').classList.remove('is-live');$('#runBadge b').textContent=reason==='full'?'РЮКЗАК ЗАПОЛНЕН':'ВЫЛАЗКА ЗАВЕРШЕНА';$('.hunt-console')?.classList.remove('is-live');$('#fleeButton').disabled=true;
    setText('#huntButtonText','НОВАЯ ВЫЛАЗКА');setText('#huntHotkey','E');setText('#timingPrompt',reason==='full'?'ПОЛНЫЙ РЮКЗАК':'ГОТОВ К ВЫЛАЗКЕ');
    $('#effectChip').className='effect-chip is-hidden';renderScene();renderLoadout();save();
    const title=reason==='full'?'РЮКЗАК ЗАБИТ':'СЕРИЯ ОКОНЧЕНА';const kicker=reason==='miss'?'ОДИН ПРОМАХ — И ДОМОЙ':reason==='full'?'АВТОМАТИЧЕСКИЙ ВОЗВРАТ':'БЕЗОПАСНЫЙ ВЫХОД';
    openModal(`<div class="modal-kicker">${kicker}</div><h2 class="modal-title" id="modalTitle">${title}</h2><p class="modal-copy">За эту вылазку поймано <b>${run.catches}</b> зверей. Серия: <b>×${run.combo}</b>. Занято ${usedSlots()} из ${capacity()} ячеек, включая ${state.ownedWeapons.length} оружий.</p><div class="stats-grid"><div class="stat-card"><small>ЛУЧШАЯ СЕРИЯ</small><b>×${state.bestCombo}</b></div><div class="stat-card"><small>ЦЕНА ТРОФЕЕВ</small><b>${fmt(state.inventory.reduce((s,i)=>s+itemValue(i),0))} ₽</b></div></div><div class="modal-actions"><button class="pixel-button button-primary" data-open-trade><b>К ТОРГОВЦУ</b></button><button class="pixel-button button-secondary" data-modal-close><b>ЕЩЁ РАЗ</b></button></div>`);
    $('[data-open-trade]',$('#gameModal'))?.addEventListener('click',()=>{closeModal();openTab('trade');if(innerWidth<1040)setMobilePage('bag')});
  }

  function fleeRun(){if(!run.active)return;endRun('flee')}

  function openRebirth(){
    if(run.active){toast('Цикл ещё идёт','Вернись с вылазки перед перерождением.',true);return;}
    if(!allLocationsUnlocked()){toast('Перерождение закрыто',`Открыто ${state.unlockedLocations.length} из ${LOCATIONS.length} локаций.`,true);return;}
    const reward=rebirthReward();
    openModal(`<div class="modal-kicker">НОВЫЙ ЦИКЛ</div><h2 class="modal-title" id="modalTitle">ПЕРЕРОЖДЕНИЕ +${reward} ДУШ</h2><p class="modal-copy">Монеты, уровни, локации, приманки, вместимость, трофеи и купленное оружие будут сброшены. Статистика сохранится, а души навсегда усилят зону, редкость, цену и опыт.</p><div class="modal-traits"><div class="modal-trait">▲ После цикла: зона +${Math.round((state.souls+reward)*1.2)}%, цена +${Math.round((state.souls+reward)*2.5)}%</div><div class="modal-trait bad">▼ Прогресс мира начнётся с первой локации и силка.</div></div><div class="modal-actions"><button class="pixel-button button-primary" id="confirmRebirth"><b>ПЕРЕРОДИТЬСЯ</b></button><button class="pixel-button button-secondary" data-modal-close><b>ОТМЕНА</b></button></div>`);
    $('#confirmRebirth').addEventListener('click',()=>performRebirth(reward));$$('[data-modal-close]',$('#gameModal')).forEach(b=>b.addEventListener('click',closeModal));
  }

  function performRebirth(reward){
    const legacy={bestCombo:state.bestCombo,totalCaught:state.totalCaught,totalSold:state.totalSold,perfects:state.perfects,escaped:state.escaped,souls:state.souls+reward,rebirths:state.rebirths+1,contractsDone:state.contractsDone,contractEarned:state.contractEarned,kisyaFound:state.kisyaFound,avatar:state.avatar,trade:state.trade,sound:state.sound,music:state.music,sfxVolume:state.sfxVolume,musicVolume:state.musicVolume,vibration:state.vibration};
    state={...defaultState(),...legacy};state.coins=320+state.souls*180;save();closeModal();document.body.classList.add('rebirthing');renderAll();setMobilePage('hunt');
    setTimeout(()=>document.body.classList.remove('rebirthing'),1300);burst(innerWidth/2,innerHeight/2,80,'#c985ff');playSfx('reboot',.9);toast('Новый цикл начался',`Получено ${reward} душ. Постоянные бонусы активны.`);
  }

  function openSale(){if(!$('#modalBackdrop').classList.contains('is-hidden'))closeModal();openTab('sale');if(innerWidth<1040)setMobilePage('bag')}
  function openContracts(){if(!$('#modalBackdrop').classList.contains('is-hidden'))closeModal();openTab('contracts');if(innerWidth<1040)setMobilePage('bag');setTimeout(()=>$('#orderList')?.scrollIntoView({block:'nearest'}),60)}
  function upgradeCapacity(){
    if(run.active){toast('Рюкзак на плече','Улучшай его между вылазками.',true);return;}
    const price=CAPACITY_PRICES[state.capacityIndex];if(price==null)return;
    if(state.coins<price){toast('Не хватает монет',`Нужно ещё ${fmt(price-state.coins)} ₽.`,true);return;}
    state.coins-=price;state.capacityIndex++;save();playSfx('buy',.78);renderAll();toast('Рюкзак расширен',`Теперь доступно ${capacity()} ячеек.`);burst(window.innerWidth-170,window.innerHeight*.7,30,'#86c65b');
  }

  function cycleBait(){
    if(run.active&&run.current){toast('Приманка уже на следу','Сменить можно после текущей вылазки.',true);return;}
    const available=BAITS.filter(b=>(state.baits[b.id]||0)>0);if(!available.length){openTab('baits');if(innerWidth<1040)setMobilePage('bag');return;}
    const ix=available.findIndex(b=>b.id===state.equippedBait);state.equippedBait=available[(ix+1)%available.length].id;save();renderLoadout();renderBaits();toast('Приманка выбрана',baitById[state.equippedBait].name);
  }

  function openTab(tab){currentTab=tab;renderTabs()}
  function setMobilePage(page){document.body.dataset.mobilePage=page;$$('[data-mobile]').forEach(b=>b.classList.toggle('is-active',b.dataset.mobile===page))}

  function openModal(html){$('#modalContent').innerHTML=html;$('#modalBackdrop').classList.remove('is-hidden');requestAnimationFrame(()=>$('#modalClose').focus());$$('[data-modal-close]',$('#gameModal')).forEach(b=>b.addEventListener('click',closeModal))}
  function closeModal(){$('#modalBackdrop').classList.add('is-hidden');$('#modalContent').innerHTML=''}

  function openProfile(){
    const current=avatarById[state.avatar];
    openModal(`<div class="modal-kicker">ПРОФИЛЬ ЛОВЧЕГО</div><h2 class="modal-title" id="modalTitle">${current.name}</h2><p class="modal-copy">Выбери одну из девяти аватарок — четыре серьёзные и пять рофлянских. Выбор сохраняется локально.</p><div class="avatar-grid">${AVATARS.map(a=>`<button class="avatar-choice ${a.id===state.avatar?'is-active':''}" data-avatar="${a.id}"><img src="assets/avatars/${a.id}.png" alt=""><b>${a.name}</b><small>${a.mood}</small></button>`).join('')}</div><div class="modal-actions"><button class="pixel-button button-primary" data-open-help><b>КАК ИГРАТЬ</b></button><button class="pixel-button button-secondary" data-modal-close><b>ГОТОВО</b></button></div>`);
    $$('[data-avatar]',$('#gameModal')).forEach(b=>b.addEventListener('click',()=>{state.avatar=b.dataset.avatar;save();renderHeader();playSfx('lol',.3);openProfile()}));
    $('[data-open-help]',$('#gameModal')).addEventListener('click',openHelp);
  }

  function openHelp(){
    openModal(`<div class="modal-kicker">ПОЛЕВОЙ СПРАВОЧНИК</div><h2 class="modal-title" id="modalTitle">КАК ЛОВИТЬ</h2><p class="modal-copy">Запусти вылазку и жми в зелёной зоне. Идеальная жёлтая линия даёт лучший трофей. Если медлить, зверь убежит и включит штраф ожидания.</p><div class="modal-traits"><div class="modal-trait">▲ Быстрая продажа и выгодные контракты находятся в отдельных вкладках.</div><div class="modal-trait">▲ В каждой из 14 локаций спрятана своя кися стоимостью 1 000 ₽.</div><div class="modal-trait bad">▼ «Часы времени» замедляют стрелку, но ускоряют побег зверя.</div></div><p class="modal-copy"><b>27 животных</b>, <b>17 оружий</b>, <b>20 типов контрактов</b>, четыре закупщика, 14 нарисованных локаций и девять аватаров.</p><button class="pixel-button button-primary small" data-modal-close><b>ПОНЯТНО, НА СЛЕД</b></button>`);
  }

  function openSettings(){
    const sfx=Math.round(state.sfxVolume*100),music=Math.round(state.musicVolume*100);
    openModal(`<div class="modal-kicker">МИКШЕР И НАСТРОЙКИ</div><h2 class="modal-title" id="modalTitle">ЗВУК БЕЗ ПЕРЕГРУЗА</h2><div class="setting-row"><span><b>Звуковые эффекты</b><br><small>Кнопки, попадания, покупки и кися</small></span><button class="switch ${state.sound?'is-on':''}" data-setting="sound">${state.sound?'ВКЛ':'ВЫКЛ'}</button></div><label class="volume-row"><span><b>Громкость эффектов</b><small id="sfxVolumeValue">${sfx}%</small></span><input type="range" min="0" max="100" value="${sfx}" data-volume="sfxVolume"></label><div class="setting-row"><span><b>Фоновая музыка</b><br><small>music.mp3 · бесконечный цикл</small></span><button class="switch ${state.music?'is-on':''}" data-setting="music">${state.music?'ВКЛ':'ВЫКЛ'}</button></div><label class="volume-row"><span><b>Громкость музыки</b><small id="musicVolumeValue">${music}%</small></span><input type="range" min="0" max="100" value="${music}" data-volume="musicVolume"></label><div class="audio-actions"><button class="mini-button" id="previewSfxButton">ПРОВЕРИТЬ ЭФФЕКТ</button><small>Громкие файлы дополнительно выровнены внутренним микшером.</small></div><div class="setting-row"><span><b>Вибрация</b><br><small>Только на поддерживаемых телефонах</small></span><button class="switch ${state.vibration?'is-on':''}" data-setting="vibration">${state.vibration?'ВКЛ':'ВЫКЛ'}</button></div><button class="danger-button" id="resetProgress">СБРОСИТЬ ВЕСЬ ПРОГРЕСС</button>`);
    $$('[data-setting]').forEach(b=>b.addEventListener('click',()=>{const k=b.dataset.setting;state[k]=!state[k];save();updateMusic();renderHeader();openSettings()}));
    $$('[data-volume]').forEach(input=>input.addEventListener('input',()=>{const k=input.dataset.volume;state[k]=clamp(+input.value/100,0,1);setText(k==='sfxVolume'?'#sfxVolumeValue':'#musicVolumeValue',`${input.value}%`);save();if(k==='musicVolume')updateMusic()}));
    $('[data-volume="sfxVolume"]')?.addEventListener('change',()=>playSfx('normal',.7));$('#previewSfxButton').addEventListener('click',()=>playSfx('perfect',.75));
    $('#resetProgress').addEventListener('click',()=>{if(confirm('Точно удалить монеты, локации, оружие и весь улов?')){state=defaultState();save();location.reload()}});
  }

  function toast(title,text,bad=false){
    const el=document.createElement('div');el.className=`toast ${bad?'is-bad':''}`;el.innerHTML=`<b>${title}</b><p>${text}</p>`;$('#toastStack').append(el);setTimeout(()=>el.remove(),3300);
  }
  function flash(bad){const f=$('#flash');f.className=`flash go ${bad?'bad':''}`;setTimeout(()=>f.className='flash',310)}
  function burst(x,y,count=28,color='#a8e36a'){
    const field=$('#sparkField'),rect=field.getBoundingClientRect();
    const sx=clamp(x-rect.left,0,rect.width),sy=clamp(y-rect.top,0,rect.height);
    for(let i=0;i<count;i++){
      const s=document.createElement('i');s.className='spark';const a=Math.random()*Math.PI*2,d=rand(35,150);
      s.style.left=`${sx}px`;s.style.top=`${sy}px`;s.style.setProperty('--dx',`${Math.cos(a)*d}px`);s.style.setProperty('--dy',`${Math.sin(a)*d+45}px`);s.style.setProperty('--dur',`${rand(.45,1.05)}s`);s.style.setProperty('--spark',Math.random()<.25?'#f2cf68':color);s.style.width=s.style.height=`${pick([4,5,7,9])}px`;field.append(s);setTimeout(()=>s.remove(),1150);
    }
  }
  function seedAmbientSparks(){const field=$('#sparkField');for(let i=0;i<18;i++){const s=document.createElement('i');s.className='ambient-spark';s.style.left=`${rand(4,96)}%`;s.style.top=`${rand(30,95)}%`;s.style.setProperty('--dur',`${rand(3.5,7)}s`);s.style.animationDelay=`-${rand(0,6)}s`;field.append(s)}}
  const sfxChannels={};let musicPlayer=null;
  function playSfx(name,volume=.65){
    if(!state.sound||!SFX_PATHS[name])return;try{const channel=(sfxChannels[name]=(sfxChannels[name]||0)+1)%3,key=`${name}-${channel}`;if(!playSfx.cache)playSfx.cache={};let a=playSfx.cache[key];if(!a){a=new Audio(SFX_PATHS[name]);a.preload='auto';playSfx.cache[key]=a}a.pause();a.currentTime=0;const shaped=.2+.8*clamp(volume,0,1);a.volume=clamp(shaped*(SFX_GAINS[name]||.5)*state.sfxVolume,0,.72);a.play().catch(()=>{});}catch(e){}
  }
  function getMusic(){if(!musicPlayer){musicPlayer=new Audio(MUSIC_PATH);musicPlayer.loop=true;musicPlayer.preload='auto';musicPlayer.addEventListener('ended',()=>{musicPlayer.currentTime=0;if(state.music)musicPlayer.play().catch(()=>{})})}return musicPlayer}
  function updateMusic(){const a=getMusic();a.loop=true;a.volume=clamp(state.musicVolume*.58,0,.46);if(state.music&&state.musicVolume>0)a.play().catch(()=>{});else a.pause()}
  function toggleMasterAudio(){const active=state.sound||state.music;state.sound=!active;state.music=!active;save();renderHeader();updateMusic();if(state.sound)playSfx('lol',.5);toast(active?'Звук выключен':'Звук включён',active?'Эффекты и музыка приглушены.':'Громкость регулируется в настройках.')}
  function tone(freq,duration){if(!state.sound)return;try{const C=window.AudioContext||window.webkitAudioContext;const ctx=tone.ctx||(tone.ctx=new C()),o=ctx.createOscillator(),g=ctx.createGain();o.type='square';o.frequency.value=freq;g.gain.setValueAtTime(.018*state.sfxVolume,ctx.currentTime);g.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+duration);o.connect(g).connect(ctx.destination);o.start();o.stop(ctx.currentTime+duration)}catch(e){}}
  function vibrate(pattern){if(state.vibration&&navigator.vibrate)navigator.vibrate(pattern)}

  function bindUI(){
    $('#huntButton').addEventListener('click',attemptCatch);$('#fleeButton').addEventListener('click',fleeRun);$('#baitCycleButton').addEventListener('click',cycleBait);$('#kisya').addEventListener('click',collectKisya);
    $('#capacityUpgradeButton').addEventListener('click',upgradeCapacity);$('#rebirthButton').addEventListener('click',openRebirth);$('#sellAllButton').addEventListener('click',openSale);$('#saleAllButton').addEventListener('click',sellAll);$('#contractInfoButton').addEventListener('click',openTradeHelp);
    $('#brandButton').addEventListener('click',openProfile);$('#settingsButton').addEventListener('click',openSettings);$('#soundButton').addEventListener('click',toggleMasterAudio);
    $('#inventoryShortcut').addEventListener('click',()=>{openTab('inventory');if(innerWidth<1040)setMobilePage('bag')});
    $$('.side-tab').forEach(b=>b.addEventListener('click',()=>openTab(b.dataset.tab)));$$('[data-mobile]').forEach(b=>b.addEventListener('click',()=>setMobilePage(b.dataset.mobile)));
    $('#modalClose').addEventListener('click',closeModal);$('#modalBackdrop').addEventListener('click',e=>{if(e.target===$('#modalBackdrop'))closeModal()});
    document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||b.disabled)return;if(!b.matches('#huntButton,#kisya,#soundButton,.shop-card__action,.location-card,#confirmRebirth,[data-quest],[data-merchant],[data-avatar],[data-sell-one],[data-sell-modal]'))playSfx('lol',.2)},true);
    document.addEventListener('keydown',e=>{if(!$('#modalBackdrop').classList.contains('is-hidden')){if(e.key==='Escape')closeModal();return}if(e.code==='Space'){e.preventDefault();attemptCatch()}else if(e.key.toLowerCase()==='e'){attemptCatch()}else if(e.key.toLowerCase()==='q'){cycleBait()}else if(e.key==='Escape'&&run.active){fleeRun()}});
    window.addEventListener('resize',hideTooltip);
  }

  function startLoader(){
    const lines=['Загружаем нарисованные миры…','Подключаем восемь звуков…','Вызываем тайную кисю…','Обновляем четыре биржи…','Раздаём двадцать контрактов…','Запускаем новый цикл…'];
    let p=0,i=0;const bar=$('#loaderProgress'),status=$('#loaderStatus');
    const timer=setInterval(()=>{p=Math.min(100,p+rand(7,17));bar.style.width=`${p}%`;if(i<lines.length&&p>i*17){status.textContent=lines[i++]}if(p>=100){clearInterval(timer);setTimeout(()=>{renderAll();updateMusic();$('#game').classList.add('is-ready');$('#game').setAttribute('aria-hidden','false');$('#loader').classList.add('is-done');if(state.firstRun){state.firstRun=false;save();setTimeout(openHelp,650)}},260)}},115);
  }

  window.__seasonHuntQA={spawnKisya:()=>maybeSpawnKisya(true),openProfile,openSale,openContracts,musicState:()=>({loop:getMusic().loop,paused:getMusic().paused,volume:getMusic().volume})};bindUI();document.addEventListener('pointerdown',()=>updateMusic(),{once:true,capture:true});document.addEventListener('visibilitychange',()=>{if(!document.hidden)updateMusic()});seedAmbientSparks();startLoader();setInterval(refreshTradeClock,1000);
})();
