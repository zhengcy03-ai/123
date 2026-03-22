/* =========================================================
   Muse · app.js  ——  v5 用户登录版
   ========================================================= */

/* ─── 用户登录系统 ─── */
let currentUser = null; // { email, token }

// 初始化登录状态
document.addEventListener('DOMContentLoaded', () => {
  checkLoginStatus();
});

function checkLoginStatus() {
  const saved = localStorage.getItem('muse_current_user');
  if (saved) {
    try {
      currentUser = JSON.parse(saved);
      showMainApp();
    } catch(e) {
      showLoginPage();
    }
  } else {
    showLoginPage();
  }
}

function showLoginPage() {
  document.getElementById('loginPage').style.display = 'flex';
  document.getElementById('mainApp').style.display = 'none';
  document.getElementById('mainWrap').style.display = 'none';
}

function showMainApp() {
  document.getElementById('loginPage').style.display = 'none';
  document.getElementById('mainApp').style.display = 'block';
  document.getElementById('mainWrap').style.display = 'block';
  
  // 加载用户数据
  loadUserData();
  // 初始化应用
  initApp();
}

function showRegister() {
  document.getElementById('loginForm').style.display = 'none';
  document.getElementById('registerForm').style.display = 'block';
  // 清空输入
  document.getElementById('registerEmail').value = '';
  document.getElementById('registerPassword').value = '';
  document.getElementById('registerConfirm').value = '';
}

function showLogin() {
  document.getElementById('registerForm').style.display = 'none';
  document.getElementById('loginForm').style.display = 'block';
  // 清空输入
  document.getElementById('loginEmail').value = '';
  document.getElementById('loginPassword').value = '';
}

function handleLogin() {
  const email = document.getElementById('loginEmail').value.trim().toLowerCase();
  const password = document.getElementById('loginPassword').value;

  if (!email || !password) {
    showToast('请输入邮箱和密码');
    return;
  }
  if (!isValidEmail(email)) {
    showToast('请输入有效的邮箱地址');
    return;
  }

  // 获取用户数据
  const users = getUsers();
  const user = users.find(u => u.email === email);

  if (!user) {
    showToast('该邮箱未注册，请先注册');
    // 2秒后自动跳转到注册页面
    setTimeout(() => {
      showRegister();
      document.getElementById('registerEmail').value = email;
    }, 1500);
    return;
  }
  if (user.password !== hashPassword(password)) {
    showToast('密码错误');
    return;
  }

  // 登录成功
  currentUser = { email: user.email, token: generateToken() };
  localStorage.setItem('muse_current_user', JSON.stringify(currentUser));
  showMainApp();
  showToast('欢迎回来，' + email.split('@')[0] + '！');
}

function handleRegister() {
  const email = document.getElementById('registerEmail').value.trim().toLowerCase();
  const password = document.getElementById('registerPassword').value;
  const confirm = document.getElementById('registerConfirm').value;

  if (!email || !password || !confirm) {
    showToast('请填写所有字段');
    return;
  }
  if (!isValidEmail(email)) {
    showToast('请输入有效的邮箱地址');
    return;
  }
  if (password.length < 6) {
    showToast('密码至少需要6位');
    return;
  }
  if (password !== confirm) {
    alert('⚠️ 两次输入的密码不一致，请重新输入');
    document.getElementById('registerPassword').value = '';
    document.getElementById('registerConfirm').value = '';
    document.getElementById('registerPassword').focus();
    return;
  }
  
  // 检查邮箱是否已存在
  const users = getUsers();
  if (users.find(u => u.email === email)) {
    showToast('该邮箱已注册');
    return;
  }
  
  // 创建新用户
  const newUser = {
    email: email,
    password: hashPassword(password),
    createdAt: Date.now()
  };
  users.push(newUser);
  saveUsers(users);
  
  // 创建用户数据空间
  createUserDataSpace(email);
  
  // 自动登录
  currentUser = { email: email, token: generateToken() };
  localStorage.setItem('muse_current_user', JSON.stringify(currentUser));
  
  // 标记为新用户，需要显示引导
  localStorage.removeItem('muse_onboarding');
  
  showMainApp();
  showToast('注册成功，欢迎加入 Muse！');
}

function logout() {
  currentUser = null;
  localStorage.removeItem('muse_current_user');
  showLoginPage();
  showToast('已退出登录');
}

// 获取所有用户
function getUsers() {
  const data = localStorage.getItem('muse_users');
  return data ? JSON.parse(data) : [];
}

function saveUsers(users) {
  localStorage.setItem('muse_users', JSON.stringify(users));
}

// 创建用户数据空间
function createUserDataSpace(email) {
  const key = 'muse_data_' + hashEmail(email);
  const initialData = {
    inspirations: [],
    tags: [],
    stickers: [],
    createdAt: Date.now()
  };
  localStorage.setItem(key, JSON.stringify(initialData));
}

// 加载用户数据
function loadUserData() {
  if (!currentUser) return;
  const key = 'muse_data_' + hashEmail(currentUser.email);
  const data = localStorage.getItem(key);
  if (data) {
    const parsed = JSON.parse(data);
    inspirations = parsed.inspirations || [];
    // 如果没有标签，使用默认标签
    tags = parsed.tags?.length ? parsed.tags : DEFAULT_TAGS.map((t,i) => ({ id:'tag_'+i, ...t, created:Date.now() }));
    placedStickers = parsed.stickers || [];
  } else {
    inspirations = [];
    tags = DEFAULT_TAGS.map((t,i) => ({ id:'tag_'+i, ...t, created:Date.now() }));
    placedStickers = [];
  }
}

// 保存用户数据
function saveUserData() {
  if (!currentUser) return;
  const key = 'muse_data_' + hashEmail(currentUser.email);
  const data = {
    inspirations: inspirations,
    tags: tags,
    stickers: placedStickers
  };
  localStorage.setItem(key, JSON.stringify(data));
}

// 工具函数
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function hashPassword(password) {
  // 简单的哈希，实际应用应使用更安全的算法
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return 'hash_' + Math.abs(hash).toString(16);
}

function hashEmail(email) {
  // 为邮箱创建唯一标识
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    const char = email.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

function generateToken() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/* ─── 每日寄语库 ─── */
const QUOTES = [
  /* ── 哲学 ── */
  { text: "我思，故我在。", author: "— 笛卡尔《第一哲学沉思集》1641" },
  { text: "认识你自己。", author: "— 刻于德尔斐神庙，苏格拉底引用，约公元前 5 世纪" },
  { text: "想象力比知识更重要，因为知识是有限的。", author: "— 爱因斯坦，1929 年《The Saturday Evening Post》访谈" },
  { text: "人是万物的尺度。", author: "— 普罗泰戈拉，约公元前 490 年" },
  { text: "未经审视的生活不值得过。", author: "— 苏格拉底（柏拉图《申辩篇》记载）" },
  { text: "幸福是灵魂的一种活动。", author: "— 亚里士多德《尼各马可伦理学》约公元前 330 年" },
  { text: "我们受苦，不是因为事物本身，而是因为我们对它的判断。", author: "— 爱比克泰德《手册》约公元 135 年" },
  { text: "一切流动，无物常驻。", author: "— 赫拉克利特，古希腊哲学家，约公元前 500 年" },
  { text: "人是一根会思想的苇草。", author: "— 帕斯卡尔《思想录》1670" },
  { text: "时间是流动的图像，摹仿着永恒。", author: "— 柏拉图《蒂迈欧篇》约公元前 360 年" },
  { text: "他人即地狱。", author: "— 萨特《禁闭》1944" },
  { text: "存在先于本质。", author: "— 萨特《存在主义是一种人道主义》1945" },
  { text: "那不能消灭我的，使我更强大。", author: "— 尼采《偶像的黄昏》1889" },
  { text: "语言的边界就是我的世界的边界。", author: "— 维特根斯坦《逻辑哲学论》§5.6，1922" },
  { text: "凡可说者，皆可说清楚；凡不可言说者，当沉默。", author: "— 维特根斯坦《逻辑哲学论》序言，1922" },
  { text: "美是真，真是美。", author: "— 济慈《希腊古瓮颂》1820" },
  { text: "过去的一切都是序幕。", author: "— 莎士比亚《暴风雨》第二幕第一场，1611" },
  { text: "科学不是并且永远不会是一本写尽的书。", author: "— 爱因斯坦《物理学的进化》1938" },

  /* ── 中国经典 ── */
  { text: "知之为知之，不知为不知，是知也。", author: "— 孔子《论语·为政》约公元前 500 年" },
  { text: "天行健，君子以自强不息。", author: "— 《周易·乾卦·象传》" },
  { text: "道可道，非常道。名可名，非常名。", author: "— 老子《道德经》第一章，约公元前 6 世纪" },
  { text: "知人者智，自知者明；胜人者有力，自胜者强。", author: "— 老子《道德经》第三十三章" },
  { text: "上善若水，水善利万物而不争。", author: "— 老子《道德经》第八章" },
  { text: "工欲善其事，必先利其器。", author: "— 孔子《论语·卫灵公》" },
  { text: "不愤不启，不悱不发。", author: "— 孔子《论语·述而》" },
  { text: "吾日三省吾身。", author: "— 曾子（孔子弟子），《论语·学而》" },
  { text: "生命是什么，爱情是什么，这些我们可以回味一生。", author: "— 张爱玲《倾城之恋》1943" },
  { text: "于是他问我，幸福是什么？我说，就是你身边有人。", author: "— 张爱玲《半生缘》1950" },

  /* ── 心理学 ── */
  { text: "未被表达的情绪永远不会消亡，它们只是被活埋了，终将以更丑陋的方式涌现。", author: "— 弗洛伊德，精神分析学说核心观点，《压抑》1915" },
  { text: "梦是通往无意识的捷径。", author: "— 弗洛伊德《梦的解析》1900" },
  { text: "一个人毕生的工作，就是去了解自己。", author: "— 荣格，心理学著作中反复阐述的核心主题" },
  { text: "你看不见的东西，会主宰你的生活，你称之为命运。", author: "— 荣格，源自其关于无意识的论述" },
  { text: "孤独并不是身边没有人，而是无法与人谈及对你而言真正重要的事。", author: "— 荣格，引自其分析心理学著述" },
  { text: "自卑感并非障碍，而是人类进步的动力。", author: "— 阿德勒《自卑与超越》1927" },
  { text: "人生的意义不是由环境赋予的，而是由我们赋予环境的。", author: "— 阿德勒《个体心理学》核心观点，1920s" },
  { text: "我们不是被事情本身所困扰，而是被我们对事情的看法所困扰。", author: "— 爱比克泰德《手册》，亦为认知行为疗法（CBT）基石" },
  { text: "人有自我实现的需要，这是最高层次的需求。", author: "— 马斯洛《动机与人格》1954" },
  { text: "创造力最高峰是自我超越，而非自我实现。", author: "— 马斯洛晚年修订需求层次理论，1969 年论文" },
  { text: "几乎每一个成年人，在他们的内心深处，都隐藏着一个受伤的孩子。", author: "— 卡尔·荣格，分析心理学理论" },
  { text: "改变的真正本质，是接受自己原本的样子。", author: "— 阿诺德·贝瑟《矛盾变化理论》1970" },
  { text: "痛苦是不可避免的，但苦难是可以选择的。", author: "— 维克多·弗兰克尔《活出生命的意义》1946" },
  { text: "即便在最艰难的境况中，人依然拥有选择自己态度的自由。", author: "— 弗兰克尔《活出生命的意义》1946" },
  { text: "被爱的人知道自己值得被爱。", author: "— 弗洛姆《爱的艺术》1956" },
  { text: "爱不是一种感情，而是一门艺术，需要知识与努力。", author: "— 埃里希·弗洛姆《爱的艺术》1956" },
  { text: "接纳自己，才是一切改变的起点。", author: "— 卡尔·罗杰斯，人本主义心理学核心思想，1950s–1970s" },

  /* ── 文学经典 ── */
  { text: "生活在别处。", author: "— 兰波诗句，米兰·昆德拉引为书名《生活在别处》1973" },
  { text: "人只能活一次，因而无法知道自己选择的是否正确，这便是生命中不能承受之轻。", author: "— 米兰·昆德拉《生命中不能承受之轻》1984" },
  { text: "所有想象中的奇迹，都是每日平凡生活的总和。", author: "— 普鲁斯特《追忆似水年华》1913–1927" },
  { text: "真正的发现之旅，不是找到新的风景，而是拥有新的眼睛。", author: "— 普鲁斯特《追忆似水年华》第五卷，1923" },
  { text: "有些书必须浅尝，有些书可以狼吞，有些书需细细品读，才能消化。", author: "— 弗朗西斯·培根《论读书》1625" },
  { text: "一本书是人类精神的产物，是一片净土。", author: "— 亨利·戴维·梭罗《瓦尔登湖》1854" },
  { text: "我们所热爱的一切，终将失去，而正因如此，爱才变得美丽。", author: "— 加西亚·马尔克斯《百年孤独》1967" },
  { text: "布恩迪亚家族注定在孤独中消亡，因为他们没有第二次机会。", author: "— 加西亚·马尔克斯《百年孤独》结尾，1967" },
  { text: "书页之间永远有光。", author: "— 豪尔赫·路易斯·博尔赫斯，引自其演讲与随笔" },
  { text: "我一直想象，天堂应该是图书馆的模样。", author: "— 博尔赫斯，1967 年就任阿根廷国家图书馆馆长演讲" },
  { text: "变成甲虫的那个早晨，格里高尔·萨姆沙发现他有太多事情没来得及完成。", author: "— 卡夫卡《变形记》1915（叙事意象）" },
  { text: "我们必须要有勇气面对那些书中令我们痛苦的事。", author: "— 卡夫卡，致友人奥斯卡·波拉克信，1904" },
  { text: "一个人不是生来要被打败的，你尽可以消灭他，但就是打不败他。", author: "— 海明威《老人与海》1952" },
  { text: "世界是美好的，值得我们为之奋斗。", author: "— 海明威《战地钟声》1940" },
  { text: "女人不是天生的，而是后天造成的。", author: "— 西蒙·波伏娃《第二性》1949" },
  { text: "自由，不是别人赐予你的，而是你自己去争取的。", author: "— 波伏娃《第二性》，1949" },
  { text: "时间是一条无法涉渡的河，而记忆是另一条。", author: "— 威廉·福克纳，《押沙龙，押沙龙！》1936 主题意象" },
  { text: "没有故事就没有感情，没有感情就没有记忆。", author: "— 玛格丽特·尤瑟纳尔《哈德良回忆录》1951" },
];

/* ─── Emoji 数据 ─── */
const EMOJI_CATS = [
  { icon:"🌸", name:"花卉植物", emojis:["🌸","🌺","🌻","🌹","🌷","🌼","💐","🪷","🪻","🌿","🍀","🌱","🌾","🍃","🌲","🌳","🌴","🍂","🍁","🌵","🎋","🎍","🪴","🫧","🌊","🪸","🌏","🌍","🍄","🪺"] },
  { icon:"⭐", name:"星月宇宙", emojis:["⭐","🌟","✨","💫","⚡","🌙","🌛","🌜","🌝","🌕","🌖","🌗","🌘","🌑","🌒","🌓","🌔","☀️","🌤","⛅","🌦","🌈","❄️","☄️","🪐","🌌","🌠","🌃","🌉","🔭"] },
  { icon:"💎", name:"珍宝装饰", emojis:["💎","💍","👑","🔮","🪩","🎀","🎁","🧿","🪬","🪄","🎭","🎨","🖼","🎠","🏺","🪞","🕯","💌","📿","🧸","🪆","🎶","🎵","🎼","♾","🫙","🪬","🧲","🗝","🪭"] },
  { icon:"🦋", name:"动物自然", emojis:["🦋","🐝","🐞","🦊","🐇","🦌","🦢","🕊","🦄","🐉","🐋","🐬","🦭","🦩","🦚","🦜","🦅","🦉","🐚","🪸","🐠","🦈","🪁","🌺","🦔","🦦","🐓","🦃","🦬","🐘"] },
  { icon:"😊", name:"表情心情", emojis:["😊","🥰","😍","🤩","😌","🤔","😴","😤","🥺","😭","😂","🤣","😇","🥳","😎","🤯","😮","😱","🙄","😏","😶","🤐","😬","🤗","🫶","😔","😰","🫠","🥹","😋"] },
  { icon:"❤️", name:"心形爱意", emojis:["❤️","🧡","💛","💚","💙","💜","🤍","🖤","🩶","🩷","🩵","💕","💞","💓","💗","💖","💘","💝","💟","♥️","🫀","❣️","💔","❤️‍🔥","❤️‍🩹","🌹","💐","🌺","🍓","🫦"] },
  { icon:"🍎", name:"美食",     emojis:["🍎","🍓","🍇","🍑","🍒","🍋","🍊","🥝","🍍","🥭","🫐","🍰","🎂","🧁","🍩","🍦","🍫","🍬","☕","🍵","🧋","🍷","🥂","🍾","🫖","🍮","🧇","🥞","🫙","🍡"] },
  { icon:"✏️", name:"学习创作", emojis:["✏️","🖊","📝","📖","📚","📓","📔","📒","🔬","🔭","💡","🧠","🎯","🏆","🥇","🎓","🖌","🎨","🎸","🎹","🎺","🎻","🥁","🎤","🎧","📐","📏","🗂","🗃","🪡"] },
];

/* ─── 心情配置 ─── */
const MOOD_EMOJI  = { excited:"🤩", happy:"😊", calm:"😌", thoughtful:"🤔", sad:"😔", anxious:"😰", grateful:"🥰", inspired:"✨" };
const MOOD_LABEL  = { excited:"兴奋", happy:"开心", calm:"平静", thoughtful:"沉思", sad:"忧郁", anxious:"焦虑", grateful:"感恩", inspired:"灵感迸发" };

/* ─── 默认标签 ─── */
const DEFAULT_TAGS = [
  { name:"创意", color:"#8FAF9F" }, { name:"工作", color:"#8B9EB7" },
  { name:"生活", color:"#C4998A" }, { name:"读书", color:"#A898B5" },
  { name:"情感", color:"#C2A98E" }, { name:"科技", color:"#9BB5C4" },
  { name:"哲思", color:"#7A9E8E" }, { name:"梦想", color:"#B5A0C4" },
  { name:"旅行", color:"#9EC4B5" }, { name:"音乐", color:"#C4B08A" },
];

/* ─── 莫兰迪色板 ─── */
const MORANDI = ["#8FAF9F","#8B9EB7","#C4998A","#A898B5","#C2A98E","#9BB5C4","#7A9E8E","#B5A0C4","#9EC4B5","#C4B08A","#A0B5C4","#C4A0A0"];

/* ─── 全局状态 ─── */
let inspirations = [];
let tags = [];
let currentPage = 'home';
let mapCenterStyle = 'muse'; // 只保留 muse 风格
let diaryPage = 0;
let filteredInspirations = [];
let selectedMood = '';
let selectedTagsArr = [];
let uploadedPhotos = [];
let currentModalId = null;
let recognition = null;
let isRecording = false;
let quoteIndex = 0;
let charts = {};
let activeFilterTag = 'all';
let currentEmojiCat = 0;

/* ─── 手账贴纸状态 ─── */
let placedStickers = []; // { id, emoji, x, y, page, scale }
let currentStickerCat = 0;
const STICKER_CATS = [
  { name: '自然', emojis: ['🌸','🌺','🌻','🌹','🌷','🌼','🌿','🍀'] },
  { name: '星月', emojis: ['⭐','🌟','✨','💫','🌙','🌛','🌜','🌕'] },
  { name: '装饰', emojis: ['💎','💍','👑','🔮','🎀','🎁','🎭','🎨'] },
  { name: '动物', emojis: ['🦋','🐝','🐞','🦊','🐇','🦌','🦢','🕊'] },
  { name: '心情', emojis: ['❤️','🧡','💛','💚','💙','💜','🤍','💕'] },
  { name: '美食', emojis: ['🍎','🍓','🍇','🍑','🍒','🍋','🍊','🥝'] },
];

/* ─── 思维导图状态（前置声明，避免 loadData 引用错误） ─── */
let mmData = { rootInsId: null, nodes: [] };
let mmCanvas = null, mmCtx = null;
let mmSel = null;
let mmDragging = null;
let mmDragOff = {x:0, y:0};
let mmEditTarget = null;
let mmPan = {x:0, y:0};
let mmPanning = false, mmPanStart = {x:0, y:0}, mmPanOrig = {x:0, y:0};
let mmAddBtn = null;

/* =========================================================
   初始化
   ========================================================= */
function initApp() {
  initAccount();
  loadData();
  initQuote();
  renderCurrentDate();
  renderSpaceStats();
  renderPresetTags();
  renderFilterTags();
  renderDiary();
  initMoodButtons();
  initTagInput();
  initEmojiPicker();
  initVoice();
  initMindMap();
  initMusic();
  initProfileListeners();
  initOnboardingListeners();
  initOrigamiAnimations(); // 初始化千纸鹤/纸星星动画
  document.addEventListener('click', handleOutsideClick);
  document.addEventListener('keydown', handleKeyDown);
  
  // 检查是否需要显示首次引导
  checkOnboarding();
}

/* =========================================================
   图片压缩工具
   ========================================================= */
function compressImage(file, maxWidth, maxHeight, quality, callback) {
  const reader = new FileReader();
  reader.onload = function(e) {
    const img = new Image();
    img.onload = function() {
      let width = img.width;
      let height = img.height;
      
      // 计算缩放比例
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.floor(width * ratio);
        height = Math.floor(height * ratio);
      }
      
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      
      // 转换为JPEG并压缩
      const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
      callback(compressedDataUrl);
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

/* =========================================================
   账号系统
   ========================================================= */
let userProfile = { name: '', avatar: '' };

function initAccount() {
  let uid = localStorage.getItem('muse_uid');
  if (!uid) {
    uid = 'M' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2,5).toUpperCase();
    localStorage.setItem('muse_uid', uid);
  }
  
  // 加载用户资料
  const savedProfile = localStorage.getItem('muse_profile');
  if (savedProfile) {
    userProfile = JSON.parse(savedProfile);
  }
  
  updateProfileUI();
  
  const spaceId = document.getElementById('spaceId');
  if (spaceId) spaceId.textContent = 'ID: ' + uid.slice(0,10);
}

function updateProfileUI() {
  const displayName = userProfile.name || '我的空间';
  const avatarLetter = userProfile.name ? userProfile.name.charAt(0).toUpperCase() : 'M';
  
  // 更新空间名称
  const spaceNameDisplay = document.getElementById('spaceNameDisplay');
  if (spaceNameDisplay) spaceNameDisplay.textContent = displayName;
  
  // 更新触发按钮标签
  const triggerLabel = document.getElementById('triggerLabel');
  if (triggerLabel) triggerLabel.textContent = displayName;
  
  // 更新头像
  updateAvatarDisplay('spaceAvatar', 'spaceAvatarImg', 'spaceAvatarText', avatarLetter);
  updateAvatarDisplay('triggerAvatar', 'triggerAvatarImg', 'triggerAvatarText', avatarLetter);
}

function updateAvatarDisplay(containerId, imgId, textId, letter) {
  const container = document.getElementById(containerId);
  const img = document.getElementById(imgId);
  const text = document.getElementById(textId);
  
  if (!container || !img || !text) return;
  
  if (userProfile.avatar) {
    img.src = userProfile.avatar;
    img.style.display = 'block';
    text.style.display = 'none';
  } else {
    img.style.display = 'none';
    text.style.display = 'block';
    text.textContent = letter;
  }
}

/* =========================================================
   个人资料编辑
   ========================================================= */
let tempAvatar = '';

function openProfileEdit() {
  tempAvatar = userProfile.avatar;
  const modal = document.getElementById('profileModal');
  const nameInput = document.getElementById('profileNameInput');
  
  nameInput.value = userProfile.name || '';
  updateProfilePreview();
  
  modal.style.display = 'flex';
}

function closeProfileModal(e) {
  if (e && e.target !== e.currentTarget) return;
  document.getElementById('profileModal').style.display = 'none';
  tempAvatar = '';
}

function updateProfilePreview() {
  const previewImg = document.getElementById('profileAvatarImg');
  const previewText = document.getElementById('profileAvatarText');
  const nameInput = document.getElementById('profileNameInput');
  const letter = nameInput.value ? nameInput.value.charAt(0).toUpperCase() : 'M';
  
  if (tempAvatar) {
    previewImg.src = tempAvatar;
    previewImg.style.display = 'block';
    previewText.style.display = 'none';
  } else {
    previewImg.style.display = 'none';
    previewText.style.display = 'block';
    previewText.textContent = letter;
  }
}

function handleAvatarUpload(event) {
  const file = event.target.files[0];
  if (!file || !file.type.startsWith('image/')) return;
  
  compressImage(file, 200, 200, 0.8, (compressedDataUrl) => {
    tempAvatar = compressedDataUrl;
    updateProfilePreview();
  });
  event.target.value = '';
}

function saveProfile() {
  const nameInput = document.getElementById('profileNameInput');
  const name = nameInput.value.trim();
  
  if (!name) {
    showToast('请输入空间名称');
    return;
  }
  
  userProfile.name = name;
  userProfile.avatar = tempAvatar;
  localStorage.setItem('muse_profile', JSON.stringify(userProfile));
  
  updateProfileUI();
  closeProfileModal();
  showToast('资料已保存');
}

// 监听名称输入变化
function initProfileListeners() {
  const nameInput = document.getElementById('profileNameInput');
  if (nameInput) {
    nameInput.addEventListener('input', updateProfilePreview);
  }
}

/* =========================================================
   首次引导
   ========================================================= */
let onboardingAvatar = '';

function checkOnboarding() {
  const hasCompleted = localStorage.getItem('muse_onboarding');
  if (!hasCompleted && currentUser) {
    // 新注册用户显示引导
    setTimeout(showOnboarding, 500);
  }
}

function showOnboarding() {
  const modal = document.getElementById('onboardingModal');
  const uid = localStorage.getItem('muse_uid') || 'M';
  const defaultLetter = uid.charAt(0);
  
  onboardingAvatar = '';
  document.getElementById('onboardingNameInput').value = '';
  updateOnboardingPreview(defaultLetter);
  
  modal.style.display = 'flex';
}

function updateOnboardingPreview(defaultLetter) {
  const previewImg = document.getElementById('onboardingAvatarImg');
  const previewText = document.getElementById('onboardingAvatarText');
  const nameInput = document.getElementById('onboardingNameInput');
  const letter = nameInput.value ? nameInput.value.charAt(0).toUpperCase() : defaultLetter;
  
  if (onboardingAvatar) {
    previewImg.src = onboardingAvatar;
    previewImg.style.display = 'block';
    previewText.style.display = 'none';
  } else {
    previewImg.style.display = 'none';
    previewText.style.display = 'block';
    previewText.textContent = letter;
  }
}

function handleOnboardingAvatar(event) {
  const file = event.target.files[0];
  if (!file || !file.type.startsWith('image/')) return;
  
  compressImage(file, 200, 200, 0.8, (compressedDataUrl) => {
    onboardingAvatar = compressedDataUrl;
    const uid = localStorage.getItem('muse_uid') || 'M';
    updateOnboardingPreview(uid.charAt(0));
  });
  event.target.value = '';
}

function completeOnboarding() {
  const nameInput = document.getElementById('onboardingNameInput');
  const name = nameInput.value.trim();
  
  if (!name) {
    showToast('请为你的空间取个名字');
    return;
  }
  
  userProfile.name = name;
  userProfile.avatar = onboardingAvatar;
  localStorage.setItem('muse_profile', JSON.stringify(userProfile));
  localStorage.setItem('muse_onboarding', 'completed');
  
  updateProfileUI();
  document.getElementById('onboardingModal').style.display = 'none';
  showToast('欢迎来到你的灵感空间！');
}

// 初始化引导监听
function initOnboardingListeners() {
  const nameInput = document.getElementById('onboardingNameInput');
  if (nameInput) {
    nameInput.addEventListener('input', () => {
      const uid = localStorage.getItem('muse_uid') || 'M';
      updateOnboardingPreview(uid.charAt(0));
    });
  }
}

/* =========================================================
   千纸鹤/纸星星动画 - 灵感回顾
   ========================================================= */
const ORIGAMI_ICONS = [
  // 0. 千纸鹤 SVG - 更精美的线条风格
  `<svg viewBox="0 0 100 100" class="origami-crane">
    <path d="M50 15 L75 45 L50 40 L25 45 Z"/>
    <path d="M50 15 L50 8"/>
    <path d="M45 8 L50 2 L55 8"/>
    <path d="M50 40 L50 75"/>
    <path d="M50 35 L25 55 L10 48 L25 40"/>
    <path d="M50 35 L75 55 L90 48 L75 40"/>
    <path d="M50 35 L30 48"/>
    <path d="M50 35 L70 48"/>
    <path d="M50 75 L35 88"/>
    <path d="M50 75 L65 88"/>
    <path d="M50 25 L50 65"/>
  </svg>`,
  // 1. 纸星星 SVG - 更精美的立体折纸风格
  `<svg viewBox="0 0 100 100" class="origami-star">
    <path d="M50 8 L58 38 L90 38 L64 56 L74 88 L50 70 L26 88 L36 56 L10 38 L42 38 Z"/>
    <path d="M50 25 L54 42 L72 42 L58 52 L64 70 L50 60 L36 70 L42 52 L28 42 L46 42 Z"/>
    <path d="M50 8 L50 25"/>
    <path d="M90 38 L72 42"/>
    <path d="M74 88 L64 70"/>
    <path d="M26 88 L36 70"/>
    <path d="M10 38 L28 42"/>
    <path d="M50 25 L42 52"/>
    <path d="M50 25 L58 52"/>
  </svg>`,
  // 2. 百合花 SVG - 简化的折纸风格百合
  `<svg viewBox="0 0 100 100" class="origami-lily">
    <!-- 花茎 -->
    <path d="M50 88 L50 50" stroke-width="2.5" stroke-linecap="round"/>
    <!-- 左侧叶子 -->
    <path d="M50 75 Q25 70 20 55 Q35 65 50 72" fill="none" stroke-width="2"/>
    <!-- 右侧叶子 -->
    <path d="M50 68 Q75 63 80 48 Q65 58 50 65" fill="none" stroke-width="2"/>
    <!-- 左花瓣 - 大 -->
    <path d="M50 50 L25 30 L20 5 L45 25 Z" fill="none" stroke-width="2"/>
    <!-- 右花瓣 - 大 -->
    <path d="M50 50 L75 30 L80 5 L55 25 Z" fill="none" stroke-width="2"/>
    <!-- 后花瓣 - 中间 -->
    <path d="M50 50 L35 25 L50 2 L65 25 Z" fill="none" stroke-width="2"/>
    <!-- 花蕊 -->
    <line x1="45" y1="20" x2="42" y2="8" stroke-width="1.5"/>
    <line x1="55" y1="20" x2="58" y2="8" stroke-width="1.5"/>
    <circle cx="42" cy="8" r="2" fill="currentColor"/>
    <circle cx="58" cy="8" r="2" fill="currentColor"/>
  </svg>`,
  // 3. 向日葵 SVG - 简化的折纸风格向日葵
  `<svg viewBox="0 0 100 100" class="origami-sunflower">
    <!-- 花茎 -->
    <path d="M50 92 L50 62" stroke-width="3" stroke-linecap="round"/>
    <!-- 左叶子 -->
    <path d="M50 82 Q25 78 18 68 Q35 75 48 80" fill="none" stroke-width="2.5"/>
    <!-- 右叶子 -->
    <path d="M50 75 Q75 70 82 60 Q65 68 52 73" fill="none" stroke-width="2.5"/>
    <!-- 中心圆盘 -->
    <circle cx="50" cy="42" r="15" fill="none" stroke-width="2.5"/>
    <!-- 中心点 -->
    <circle cx="50" cy="42" r="3" fill="currentColor"/>
    <!-- 上花瓣 -->
    <path d="M50 27 L42 8 L50 2 L58 8 Z" fill="none" stroke-width="2"/>
    <!-- 右上花瓣 -->
    <path d="M63 32 L78 18 L85 25 L72 38 Z" fill="none" stroke-width="2"/>
    <!-- 右下花瓣 -->
    <path d="M68 52 L88 58 L90 68 L75 62 Z" fill="none" stroke-width="2"/>
    <!-- 下花瓣 -->
    <path d="M50 72 L58 92 L50 98 L42 92 Z" fill="none" stroke-width="2"/>
    <!-- 左下花瓣 -->
    <path d="M32 62 L12 68 L10 78 L25 72 Z" fill="none" stroke-width="2"/>
    <!-- 左上花瓣 -->
    <path d="M28 38 L12 25 L18 18 L35 32 Z" fill="none" stroke-width="2"/>
  </svg>`,
  // 4. 音符 SVG - 简化的折纸风格八分音符
  `<svg viewBox="0 0 100 100" class="origami-note">
    <!-- 音符头（实心） -->
    <ellipse cx="32" cy="78" rx="12" ry="10" fill="currentColor"/>
    <!-- 符干 -->
    <path d="M44 78 L44 15" stroke-width="3" stroke-linecap="round"/>
    <!-- 符尾 - 简化的旗帜 -->
    <path d="M44 15 L70 25 L65 40 L44 32" fill="none" stroke-width="2.5"/>
    <!-- 符尾折线 -->
    <path d="M44 22 L62 28 L58 38" fill="none" stroke-width="1.5"/>
  </svg>`
];

let origamiInstances = [];

function initOrigamiAnimations() {
  // 为五个装饰图标添加点击事件
  const decoItems = document.querySelectorAll('.deco-illustration');
  decoItems.forEach((item, index) => {
    item.style.cursor = 'pointer';
    item.addEventListener('click', () => launchOrigami(item, index));
  });
}

// 跟踪已飞出的纸鹤/星星
let arrivedOrigamis = [];
let hasShownBundle = false;

function launchOrigami(sourceElement, index) {
  const container = document.getElementById('origamiContainer');
  const rect = sourceElement.getBoundingClientRect();
  
  // 如果已经展示过汇聚效果，先清除
  if (hasShownBundle) {
    clearOrigamiScene();
  }
  
  // 随机选择五种形状之一：0千纸鹤、1纸星星、2百合花瓣、3向日葵、4音符
  const shapeIndex = Math.floor(Math.random() * 5);
  const shapeNames = ['crane', 'star', 'lily', 'sunflower', 'note'];
  const origami = document.createElement('div');
  origami.className = 'origami-item';
  origami.innerHTML = ORIGAMI_ICONS[shapeIndex];
  
  // 设置初始位置（居中）
  const startX = rect.left + rect.width / 2 - 40;
  const startY = rect.top + rect.height / 2 - 40;
  origami.style.left = startX + 'px';
  origami.style.top = startY + 'px';
  
  container.appendChild(origami);
  
  // 计算飞向中央的目标位置 - 散开排列避免重叠
  const centerX = window.innerWidth / 2;
  const centerY = window.innerHeight / 2;
  
  // 根据已有数量计算位置，散开排列
  const angle = (arrivedOrigamis.length * 72) * (Math.PI / 180); // 72度间隔
  const radius = 80 + Math.random() * 40; // 80-120px 半径
  const offsetX = Math.cos(angle) * radius;
  const offsetY = Math.sin(angle) * radius;
  
  const tx = centerX - startX + offsetX - 40;
  const ty = centerY - startY + offsetY - 40;
  const rot = (Math.random() - 0.5) * 40;
  
  // 设置CSS变量
  origami.style.setProperty('--tx', tx + 'px');
  origami.style.setProperty('--ty', ty + 'px');
  origami.style.setProperty('--rot', rot + 'deg');
  
  // 添加飞行动画
  requestAnimationFrame(() => {
    origami.classList.add('flying');
  });
  
  // 动画结束后保持显示，添加点击事件
  setTimeout(() => {
    origami.classList.remove('flying');
    origami.classList.add('arrived');
    origami.style.transform = `translate(${tx}px, ${ty}px) rotate(${rot}deg)`;
    
    // 添加点击事件
    origami.addEventListener('click', () => unfoldSingleOrigami(origami));
    
    // 保存实例
    arrivedOrigamis.push({
      element: origami,
      type: shapeNames[shapeIndex],
      index: index
    });
    
    // 检查是否需要显示汇聚效果
    checkBundleComplete();
  }, 1500);
}

function clearOrigamiScene() {
  const container = document.getElementById('origamiContainer');
  container.innerHTML = '';
  arrivedOrigamis = [];
  hasShownBundle = false;
}

function checkBundleComplete() {
  // 当有3个或以上时，显示汇聚提示
  if (arrivedOrigamis.length >= 3 && !hasShownBundle) {
    showBundleHint();
  }
}

function showBundleHint() {
  hasShownBundle = true;
  
  // 创建一个提示，告诉用户可以点击任意一个拆开
  const container = document.getElementById('origamiContainer');
  const hint = document.createElement('div');
  hint.className = 'origami-hint';
  hint.id = 'origamiHint';
  hint.innerHTML = '✨ 点击任意纸鹤，拆开思绪';
  hint.style.left = '50%';
  hint.style.top = (window.innerHeight / 2 + 120) + 'px';
  hint.style.transform = 'translateX(-50%)';
  container.appendChild(hint);
}

// 点击单个纸鹤/星星拆开
function unfoldSingleOrigami(origami) {
  // 添加拆开动画
  origami.style.transition = 'all 0.6s ease-out';
  origami.style.transform = origami.style.transform + ' scale(2) rotate(180deg)';
  origami.style.opacity = '0';
  
  // 创建粒子效果
  const rect = origami.getBoundingClientRect();
  createParticlesAt(rect.left + 40, rect.top + 40);
  
  // 移除其他纸鹤
  setTimeout(() => {
    clearOrigamiScene();
    showMemoryModal();
  }, 400);
}

function createParticlesAt(x, y) {
  const container = document.getElementById('origamiContainer');
  const colors = ['#8FAF9F', '#8B9EB7', '#C4998A', '#A898B5', '#9BB5C4'];
  
  for (let i = 0; i < 16; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.style.left = x + 'px';
    particle.style.top = y + 'px';
    particle.style.background = colors[Math.floor(Math.random() * colors.length)];
    
    const angle = (Math.PI * 2 * i) / 16;
    const distance = 60 + Math.random() * 60;
    const px = Math.cos(angle) * distance;
    const py = Math.sin(angle) * distance;
    
    particle.style.setProperty('--px', px + 'px');
    particle.style.setProperty('--py', py + 'px');
    
    container.appendChild(particle);
    
    setTimeout(() => particle.remove(), 1000);
  }
}

function showMemoryModal() {
  const modal = document.getElementById('memoryModal');
  const content = document.getElementById('memoryContent');
  
  // 随机选择3条过去的灵感
  const memories = getRandomMemories(3);
  
  if (memories.length === 0) {
    content.innerHTML = `
      <div class="memory-item" style="text-align:center;border-left:none;">
        <p style="color:var(--text-sub);font-style:italic;">你的识海还是一片宁静，去记录第一条灵感吧~</p>
      </div>
    `;
  } else {
    content.innerHTML = memories.map(m => `
      <div class="memory-item" onclick="viewMemoryDetail('${m.id}')">
        <div class="memory-item-date">${formatDateFull(m.created)}</div>
        <div class="memory-item-content">${escHtml(m.content || m.title || '无内容')}</div>
      </div>
    `).join('');
  }
  
  modal.classList.add('show');
}

function closeMemoryModal(e) {
  if (e && e.target !== e.currentTarget) return;
  document.getElementById('memoryModal').classList.remove('show');
}

function getRandomMemories(count) {
  if (!inspirations || inspirations.length === 0) return [];
  
  // 复制数组并打乱
  const shuffled = [...inspirations].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

function viewMemoryDetail(id) {
  closeMemoryModal();
  setTimeout(() => openDetailModal(id), 300);
}

/* =========================================================
   数据持久化
   ========================================================= */
function loadData() {
  // 如果已登录，数据已从 loadUserData 加载
  if (currentUser) return;
  
  // 未登录时从默认位置加载（向后兼容）
  try {
    inspirations = JSON.parse(localStorage.getItem('muse_inspirations') || '[]');
    const storedTags = JSON.parse(localStorage.getItem('muse_tags') || 'null');
    tags = storedTags || DEFAULT_TAGS.map((t,i) => ({ id:'tag_'+i, ...t, created:Date.now() }));
    const storedMM = localStorage.getItem('muse_mindmap');
    if (storedMM) mmData = JSON.parse(storedMM);
  } catch(e) {
    inspirations = [];
    tags = DEFAULT_TAGS.map((t,i) => ({ id:'tag_'+i, ...t, created:Date.now() }));
  }
}
function saveData() {
  // 如果已登录，保存到用户专属空间
  if (currentUser) {
    saveUserData();
  } else {
    // 未登录时保存到默认位置（向后兼容）
    localStorage.setItem('muse_inspirations', JSON.stringify(inspirations));
    localStorage.setItem('muse_tags', JSON.stringify(tags));
  }
}

/* =========================================================
   日期 & 寄语
   ========================================================= */
function renderCurrentDate() {
  const now = new Date();
  const days = ['日','一','二','三','四','五','六'];
  const el = document.getElementById('homeDate');
  if (el) {
    el.innerHTML = `${now.getFullYear()}年<br>${now.getMonth()+1}月${now.getDate()}日<br>星期${days[now.getDay()]}`;
  }
}
function initQuote() {
  const today = new Date().toDateString();
  if (localStorage.getItem('muse_quote_date') === today) {
    quoteIndex = parseInt(localStorage.getItem('muse_quote_idx') || '0');
  } else {
    quoteIndex = Math.floor(Math.random() * QUOTES.length);
    localStorage.setItem('muse_quote_date', today);
    localStorage.setItem('muse_quote_idx', quoteIndex);
  }
  applyQuote();
}
function applyQuote() {
  const q = QUOTES[quoteIndex % QUOTES.length];
  const t = document.getElementById('stickerText');
  const a = document.getElementById('stickerAuthor');
  if (t) t.textContent = q.text;
  if (a) a.textContent = q.author;
}
function refreshQuote() {
  quoteIndex = (quoteIndex + 1) % QUOTES.length;
  localStorage.setItem('muse_quote_idx', quoteIndex);
  applyQuote();
}

/* =========================================================
   抽屉开关
   ========================================================= */
function openSpace() {
  const drawer = document.getElementById('spaceDrawer');
  const overlay = document.getElementById('spaceOverlay');
  if (!drawer || !overlay) {
    console.error('空间抽屉元素未找到:', { drawer: !!drawer, overlay: !!overlay });
    return;
  }
  drawer.classList.add('open');
  overlay.classList.add('open');
  console.log('空间抽屉已打开');
}
function closeSpace() {
  document.getElementById('spaceDrawer').classList.remove('open');
  document.getElementById('spaceOverlay').classList.remove('open');
}

/* =========================================================
   导航
   ========================================================= */
function goToPage(page, el) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById('page-' + page);
  if (target) target.classList.add('active');

  document.querySelectorAll('.space-nav-item').forEach(n => n.classList.remove('active'));
  if (el) el.classList.add('active');
  else {
    const navEl = document.querySelector(`.space-nav-item[data-page="${page}"]`);
    if (navEl) navEl.classList.add('active');
  }

  currentPage = page;
  closeSpace();

  if (page === 'stats')  { setTimeout(renderCharts, 80); renderStatsOverview(); }
  if (page === 'diary')  { renderFilterTags(); renderDiary(); initStickerPalette(); loadStickers(); }
  if (page === 'map')    { setTimeout(renderBubbleMap, 80); }
  if (page === 'extend') {
    setTimeout(() => {
      resizeMmCanvas();
      populateRootSelect();
      renderMindMap();
    }, 80);
  }
}

/* =========================================================
   统计（抽屉内）
   ========================================================= */
function renderSpaceStats() {
  const today = new Date().toDateString();
  const el = (id, val) => { const e=document.getElementById(id); if(e) e.textContent=val; };
  el('drawerTotal', inspirations.length);
  el('drawerToday', inspirations.filter(i => new Date(i.created).toDateString() === today).length);
  el('drawerTags', tags.length);
  el('drawerStreak', calcStreak());
}
function calcStreak() {
  if (!inspirations.length) return 0;
  const days = new Set(inspirations.map(i => new Date(i.created).toDateString()));
  let s = 0; const d = new Date();
  while (days.has(d.toDateString())) { s++; d.setDate(d.getDate()-1); }
  return s;
}

/* =========================================================
   Emoji 选择器
   ========================================================= */
function initEmojiPicker() {
  const tabs = document.getElementById('emojiTabs');
  if (!tabs) return;
  tabs.innerHTML = EMOJI_CATS.map((c,i) =>
    `<button class="emoji-tab ${i===0?'active':''}" onclick="switchEmojiCat(${i})" title="${c.name}">${c.icon}</button>`
  ).join('');
  renderEmojiGrid(0);
}
function switchEmojiCat(idx) {
  currentEmojiCat = idx;
  document.querySelectorAll('.emoji-tab').forEach((b,i) => b.classList.toggle('active', i===idx));
  renderEmojiGrid(idx);
}
function renderEmojiGrid(idx) {
  const grid = document.getElementById('emojiGrid');
  if (!grid) return;
  grid.innerHTML = EMOJI_CATS[idx].emojis.map(e =>
    `<button class="emoji-btn" onclick="insertEmoji('${e}')" title="${e}">${e}</button>`
  ).join('');
}
function insertEmoji(emoji) {
  const ta = document.getElementById('insContent');
  if (!ta) return;
  const s = ta.selectionStart, e = ta.selectionEnd;
  ta.value = ta.value.slice(0,s) + emoji + ta.value.slice(e);
  ta.selectionStart = ta.selectionEnd = s + emoji.length;
  ta.focus();
}
function toggleEmojiPicker(e) {
  if (e) e.stopPropagation();
  const p = document.getElementById('emojiPicker');
  const isOpen = p.style.display !== 'none';
  closeAllPanels();
  if (!isOpen) {
    p.style.display = 'block';
    document.getElementById('emojiBtn').classList.add('tool-active');
  }
}

/* =========================================================
   心情选择
   ========================================================= */
function initMoodButtons() {
  const grid = document.getElementById('moodSelector');
  if (!grid) return;
  grid.innerHTML = Object.keys(MOOD_EMOJI).map(k =>
    `<button class="mood-btn" data-mood="${k}" onclick="selectMood('${k}')">
      <span>${MOOD_EMOJI[k]}</span>
      <span class="mood-label-text">${MOOD_LABEL[k]}</span>
    </button>`
  ).join('');
}
function selectMood(mood) {
  selectedMood = selectedMood === mood ? '' : mood;
  document.querySelectorAll('.mood-btn').forEach(b => b.classList.toggle('selected', b.dataset.mood===selectedMood));
  const display = document.getElementById('moodDisplay');
  if (display) display.textContent = selectedMood ? MOOD_EMOJI[selectedMood] : '🫧';
  // 选中后短暂延迟关闭，让用户看到反馈
  setTimeout(() => closeAllPanels(), 300);
}
function toggleMoodPicker(e) {
  if (e) e.stopPropagation();
  const p = document.getElementById('moodPicker');
  const isOpen = p.style.display !== 'none';
  closeAllPanels();
  if (!isOpen) {
    p.style.display = 'block';
    document.getElementById('moodBtn').classList.add('tool-active');
  }
}

/* =========================================================
   标签面板
   ========================================================= */
function toggleTagPanel(e) {
  if (e) e.stopPropagation();
  const p = document.getElementById('tagPanel');
  const isOpen = p.style.display !== 'none';
  closeAllPanels();
  if (!isOpen) {
    p.style.display = 'block';
    document.getElementById('tagBtn').classList.add('tool-active');
    setTimeout(() => document.getElementById('tagInput')?.focus(), 80);
  }
}
function initTagInput() {
  const input = document.getElementById('tagInput');
  if (!input) return;
  input.addEventListener('keydown', e => {
    if (e.key==='Enter' || e.key===',') {
      e.preventDefault();
      let v = input.value.trim().replace(/,/g,'').replace(/^#/, '');
      if (v) { addTagChip(v); input.value=''; }
    }
    if (e.key==='Backspace' && !input.value && selectedTagsArr.length) removeTag(selectedTagsArr[selectedTagsArr.length-1]);
  });
  // 不再监听空格——标签名允许包含空格，只用回车/逗号确认
}
function addTagChip(name) {
  if (!name || selectedTagsArr.includes(name)) return;
  if (selectedTagsArr.length >= 2) {
    showToast('一篇灵感最多添加 2 个标签');
    return;
  }
  selectedTagsArr.push(name);
  renderSelectedTags(); renderPresetTags();
  const row = document.getElementById('selectedTagsRow');
  if (row) row.style.display = selectedTagsArr.length ? 'block' : 'none';
}
function removeTag(name) {
  selectedTagsArr = selectedTagsArr.filter(t => t!==name);
  renderSelectedTags(); renderPresetTags();
  const row = document.getElementById('selectedTagsRow');
  if (row) row.style.display = selectedTagsArr.length ? 'block' : 'none';
}
function renderSelectedTags() {
  const c = document.getElementById('selectedTags'); if (!c) return;
  c.innerHTML = selectedTagsArr.map(t => {
    const tg = tags.find(x=>x.name===t);
    const col = tg?tg.color:'#8FAF9F';
    return `<span class="selected-tag" style="background:${col}" onclick="removeTag('${t}')">#${t} <span class="remove-tag">✕</span></span>`;
  }).join('');
}
function renderPresetTags() {
  const c = document.getElementById('presetTags'); if (!c) return;
  c.innerHTML = tags.map(t =>
    `<span class="preset-tag ${selectedTagsArr.includes(t.name)?'used':''}" style="background:${t.color}" onclick="selectPresetTag('${t.name}')">#${t.name}</span>`
  ).join('');
}
function selectPresetTag(name) {
  if (selectedTagsArr.includes(name)) return;
  addTagChip(name);
}

/* =========================================================
   关闭所有浮层
   ========================================================= */
function closeAllPanels() {
  ['emojiPicker','moodPicker','tagPanel'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });
  ['emojiBtn','moodBtn','tagBtn'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('tool-active');
  });
}
function handleOutsideClick(e) {
  // 点击在任何 bubble-panel 或触发按钮内部 → 不关闭
  if (e.target.closest('.bubble-panel') ||
      e.target.closest('.emoji-wrap') ||
      e.target.closest('.mood-wrap') ||
      e.target.closest('.tag-wrap')) {
    return;
  }
  closeAllPanels();
}

/* =========================================================
   照片上传
   ========================================================= */
function handlePhotoUpload(event) {
  const files = Array.from(event.target.files);
  const rem = 3 - uploadedPhotos.length;
  if (rem<=0) { showToast('最多上传3张照片'); return; }
  files.slice(0,rem).forEach(file => {
    if (!file.type.startsWith('image/')) return;
    const r = new FileReader();
    r.onload = e => { uploadedPhotos.push(e.target.result); renderPhotoPreview(); };
    r.readAsDataURL(file);
  });
  event.target.value = '';
}
function renderPhotoPreview() {
  const row = document.getElementById('photoPreviewRow');
  const preview = document.getElementById('photoPreview');
  if (!preview) return;
  if (uploadedPhotos.length) {
    row.style.display = 'block';
    preview.innerHTML = uploadedPhotos.map((src,i) =>
      `<div class="preview-item"><img src="${src}" alt="预览"><button class="remove-photo" onclick="removePhoto(${i})">✕</button></div>`
    ).join('');
  } else {
    row.style.display = 'none';
    preview.innerHTML = '';
  }
}
function removePhoto(idx) { uploadedPhotos.splice(idx,1); renderPhotoPreview(); }

/* 拖拽上传功能已移除 - 用户选择使用按钮上传图片 */

/* =========================================================
   语音输入
   ========================================================= */
function initVoice() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    const btn = document.getElementById('voiceBtn');
    if (btn) { btn.style.opacity=0.4; btn.onclick=()=>showToast('请使用 Chrome/Edge 以启用语音输入'); }
    return;
  }
  recognition = new SR();
  recognition.lang = 'zh-CN'; recognition.continuous = true; recognition.interimResults = true;
  let finalT = '';
  recognition.onresult = e => {
    let interim = '';
    for(let i=e.resultIndex; i<e.results.length; i++) {
      const t = e.results[i][0].transcript;
      e.results[i].isFinal ? finalT += t : interim = t;
    }
    const ta = document.getElementById('insContent');
    if (ta) ta.value = (ta.dataset.base||'') + finalT + interim;
  };
  recognition.onerror = e => {
    isRecording = false;
    document.getElementById('voiceBtn')?.classList.remove('recording');
    document.getElementById('voiceStatus').innerHTML = '';
    if (e.error==='not-allowed') showToast('麦克风权限被拒绝');
    else showToast('语音出错：' + e.error);
  };
  recognition.onend = () => { if (isRecording) recognition.start(); };
}
function toggleVoice() {
  if (!recognition) { showToast('请使用 Chrome/Edge 以启用语音输入'); return; }
  const btn = document.getElementById('voiceBtn');
  const status = document.getElementById('voiceStatus');
  const ta = document.getElementById('insContent');
  if (isRecording) {
    isRecording = false; recognition.stop();
    btn.classList.remove('recording'); status.innerHTML = '';
    showToast('语音输入已停止');
  } else {
    isRecording = true; ta.dataset.base = ta.value;
    recognition.start(); btn.classList.add('recording');
    status.innerHTML = '<span class="voice-dot"></span> 正在聆听…';
    showToast('语音输入已开启');
  }
}

/* =========================================================
   保存灵感
   ========================================================= */
function saveInspiration() {
  const content = document.getElementById('insContent').value.trim();
  if (!content) { showToast('请写下你的灵感！'); document.getElementById('insContent').focus(); return; }
  selectedTagsArr.forEach(name => {
    if (!tags.find(t=>t.name===name)) {
      tags.push({ id:'tag_'+Date.now()+Math.random(), name, color:MORANDI[tags.length%MORANDI.length], created:Date.now() });
    }
  });
  const ins = {
    id: 'ins_'+Date.now(),
    title: document.getElementById('insTitle').value.trim(),
    content, mood: selectedMood,
    tags: [...selectedTagsArr],
    photos: [...uploadedPhotos],
    created: Date.now(),
  };
  inspirations.unshift(ins);
  saveData(); clearForm();
  showToast('✦ 灵感已记录');
  renderSpaceStats();
}
function clearForm() {
  document.getElementById('insTitle').value = '';
  document.getElementById('insContent').value = '';
  document.getElementById('insContent').dataset.base = '';
  selectedMood = ''; selectedTagsArr = []; uploadedPhotos = [];
  document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('selected'));
  document.getElementById('moodDisplay').textContent = '🫧';
  renderSelectedTags(); renderPhotoPreview(); renderPresetTags();
  const row = document.getElementById('selectedTagsRow');
  if (row) row.style.display = 'none';
  if (isRecording) toggleVoice();
}

/* =========================================================
   详情弹窗
   ========================================================= */
function openDetailModal(id) {
  const ins = inspirations.find(i=>i.id===id); if (!ins) return;
  currentModalId = id;
  document.getElementById('modalMood').textContent    = ins.mood ? MOOD_EMOJI[ins.mood] : '✦';
  document.getElementById('modalTitle').textContent   = ins.title || '灵感记录';
  document.getElementById('modalTime').textContent    = formatDateFull(ins.created) + (ins.mood ? `  ${MOOD_EMOJI[ins.mood]} ${MOOD_LABEL[ins.mood]}` : '');
  document.getElementById('modalContent').textContent = ins.content;
  document.getElementById('modalPhotos').innerHTML    = (ins.photos||[]).map(src =>
    `<img class="modal-photo" src="${src}" alt="" onclick="lightboxOpen('${src}')">`
  ).join('');
  document.getElementById('modalTags').innerHTML = (ins.tags||[]).map(t => {
    const tg = tags.find(x=>x.name===t);
    return `<span class="tag-chip" style="background:${tg?tg.color:'#8FAF9F'}">#${t}</span>`;
  }).join('');
  document.getElementById('detailModal').style.display = 'flex';
}
function closeModal(e) { if (e.target===document.getElementById('detailModal')) closeDetailModal(); }
function closeDetailModal() { document.getElementById('detailModal').style.display='none'; currentModalId=null; }
function deleteInspiration(id) {
  if (!id) return;
  if (!confirm('确定删除这条灵感吗？')) return;
  inspirations = inspirations.filter(i=>i.id!==id);
  saveData(); closeDetailModal();
  renderSpaceStats(); renderDiary();
  showToast('已删除');
}
function lightboxOpen(src) {
  document.getElementById('lightboxImg').src = src;
  document.getElementById('lightbox').style.display = 'flex';
}

/* 从详情弹窗跳到灵感延伸页 */
function useAsRoot(id) {
  closeDetailModal();
  goToPage('extend', null);
  setTimeout(() => {
    const sel = document.getElementById('rootSelect');
    if (sel) { sel.value = id; onRootSelectChange(); }
  }, 200);
}

/* =========================================================
   日记本翻阅
   ========================================================= */
const EPP = 2;
function renderFilterTags() {
  const c = document.getElementById('filterTags'); if (!c) return;
  c.innerHTML = `<span class="filter-tag active" onclick="filterByTag('all',this)">全部</span>`
    + tags.map(t => `<span class="filter-tag" onclick="filterByTag('${t.name}',this)">#${t.name}</span>`).join('');
}
function filterByTag(tag, el) {
  activeFilterTag = tag;
  document.querySelectorAll('#filterTags .filter-tag').forEach(f => f.classList.remove('active'));
  if (el) el.classList.add('active');
  diaryPage = 0; renderDiary();
}
function filterInspirations() { diaryPage=0; renderDiary(); }
function getFilteredList() {
  const q = (document.getElementById('searchInput')?.value || '').toLowerCase();
  return [...inspirations].filter(ins => {
    const mt = activeFilterTag==='all' || (ins.tags||[]).includes(activeFilterTag);
    const ms = !q || ins.content.toLowerCase().includes(q) || (ins.title||'').toLowerCase().includes(q);
    return mt && ms;
  }).sort((a,b) => b.created-a.created);
}
function renderDiary() {
  filteredInspirations = getFilteredList();
  const total = Math.ceil(filteredInspirations.length / EPP) || 1;
  if (diaryPage >= total) diaryPage = total-1;
  document.getElementById('pageInfo').textContent = `第 ${diaryPage+1} / ${total} 页`;
  document.getElementById('prevBtn').disabled = diaryPage===0;
  document.getElementById('nextBtn').disabled = diaryPage>=total-1;
  const spread = document.getElementById('bookSpread');
  const empty  = document.getElementById('bookEmpty');
  if (!filteredInspirations.length) { spread.style.display='none'; empty.style.display='block'; return; }
  spread.style.display = 'flex'; empty.style.display = 'none';
  const s = diaryPage * EPP;
  const blank = `<div style="color:#C8BCA8;font-style:italic;text-align:center;padding-top:80px;font-family:'IM Fell English',serif;font-size:0.82rem;letter-spacing:1px">— this page intentionally left blank —</div>`;
  document.getElementById('leftPageContent').innerHTML  = filteredInspirations[s]   ? buildDiaryEntry(filteredInspirations[s])   : blank;
  document.getElementById('rightPageContent').innerHTML = filteredInspirations[s+1] ? buildDiaryEntry(filteredInspirations[s+1]) : blank;
  document.getElementById('leftNum').textContent  = s+1;
  document.getElementById('rightNum').textContent = filteredInspirations[s+1] ? s+2 : '';
  const spr = document.getElementById('bookSpread');
  spr.classList.remove('pt'); void spr.offsetWidth; spr.classList.add('pt');
}
function buildDiaryEntry(ins) {
  const chips = (ins.tags||[]).map(t => {
    const tg = tags.find(x=>x.name===t);
    return `<span class="tag-chip" style="background:${tg?tg.color:'#8FAF9F'};font-size:0.62rem;padding:1px 6px">#${t}</span>`;
  }).join('');
  // 图片放大显示：展示第一张图片的缩略图
  const photo = ins.photos&&ins.photos.length ? 
    `<div class="diary-photo-preview"><img src="${ins.photos[0]}" alt="配图" onclick="event.stopPropagation();lightboxOpen('${ins.photos[0]}')"></div>` : '';
  const mood  = ins.mood ? `<span class="diary-mood">${MOOD_EMOJI[ins.mood]}</span>` : '';
  return `<div class="diary-entry" onclick="openDetailModal('${ins.id}')">
    <div class="diary-date">${formatDateFull(ins.created)}</div>
    <div class="diary-title">${mood}${escHtml(ins.title || ins.content.substring(0,28)+(ins.content.length>28?'…':''))}</div>
    ${photo}
    <div class="diary-excerpt">${escHtml(ins.content)}</div>
    <div class="diary-tags">${chips}</div>
  </div>`;
}
function prevPage() { if (diaryPage>0) { diaryPage--; renderDiary(); } }
function nextPage() { if (diaryPage<Math.ceil(filteredInspirations.length/EPP)-1) { diaryPage++; renderDiary(); } }

/* =========================================================
   统计页：总览卡 + 图表
   ========================================================= */
function renderStatsOverview() {
  const c = document.getElementById('statsOverview'); if (!c) return;
  const today = new Date().toDateString();
  const todayCnt = inspirations.filter(i => new Date(i.created).toDateString() === today).length;
  const streak = calcStreak();
  const tagCnt = tags.length;
  const moodArr = inspirations.filter(i=>i.mood).map(i=>i.mood);
  const topMood = moodArr.length ? Object.entries(moodArr.reduce((acc,m)=>{acc[m]=(acc[m]||0)+1;return acc;},{})).sort((a,b)=>b[1]-a[1])[0][0] : null;

  // 统计有延伸记录的灵感数
  const extendedCnt = inspirations.filter(ins => {
    const stored = localStorage.getItem('muse_mm_' + ins.id);
    if (!stored) return false;
    try {
      const mm = JSON.parse(stored);
      return mm.nodes && mm.nodes.length > 1; // 有根节点以外的延伸节点
    } catch(e) { return false; }
  }).length;

  c.innerHTML = `
    <div class="overview-card" style="--card-accent:${MORANDI[0]}">
      <div class="overview-card-icon">✦</div>
      <div class="overview-card-val">${inspirations.length}</div>
      <div class="overview-card-label">灵感总数</div>
    </div>
    <div class="overview-card" style="--card-accent:${MORANDI[2]}">
      <div class="overview-card-icon">🌅</div>
      <div class="overview-card-val">${todayCnt}</div>
      <div class="overview-card-label">今日新增</div>
    </div>
    <div class="overview-card" style="--card-accent:${MORANDI[4]}">
      <div class="overview-card-icon">🔥</div>
      <div class="overview-card-val">${streak}</div>
      <div class="overview-card-label">连续记录天</div>
    </div>
    <div class="overview-card" style="--card-accent:${MORANDI[1]}">
      <div class="overview-card-icon">#</div>
      <div class="overview-card-val">${tagCnt}</div>
      <div class="overview-card-label">标签数</div>
    </div>
    <div class="overview-card" style="--card-accent:${MORANDI[6]}">
      <div class="overview-card-icon">🌿</div>
      <div class="overview-card-val">${extendedCnt}</div>
      <div class="overview-card-label">已延伸灵感</div>
    </div>
    ${topMood ? `<div class="overview-card" style="--card-accent:${MORANDI[3]}">
      <div class="overview-card-icon">${MOOD_EMOJI[topMood]}</div>
      <div class="overview-card-val" style="font-size:1.1rem">${MOOD_LABEL[topMood]}</div>
      <div class="overview-card-label">最常见心情</div>
    </div>` : ''}
  `;
}
function renderCharts() {
  renderHourChart(); renderWeekChart(); renderTagChart(); renderMoodChart(); renderTrendChart(); renderPeakCards();
}
function dc(id) { if (charts[id]) { charts[id].destroy(); delete charts[id]; } }
function renderHourChart() {
  dc('hour');
  const counts = Array(24).fill(0);
  inspirations.forEach(i => counts[new Date(i.created).getHours()]++);
  const max = Math.max(...counts);
  const ctx = document.getElementById('hourChart'); if (!ctx) return;
  charts.hour = new Chart(ctx, {type:'bar', data:{labels:Array.from({length:24},(_,i)=>`${i}h`), datasets:[{label:'灵感数', data:counts, backgroundColor:counts.map(c=>c===max&&max>0?'#C4998A':'#8FAF9F99'), borderRadius:5}]}, options:{plugins:{legend:{display:false}},scales:{y:{beginAtZero:true,ticks:{stepSize:1,color:'#8A857E'},grid:{color:'#EDEBE5'}},x:{ticks:{color:'#8A857E'},grid:{display:false}}}}});
}
function renderWeekChart() {
  dc('week');
  const counts = Array(7).fill(0), labels=['周日','周一','周二','周三','周四','周五','周六'];
  inspirations.forEach(i => counts[new Date(i.created).getDay()]++);
  const ctx = document.getElementById('weekChart'); if (!ctx) return;
  charts.week = new Chart(ctx, {type:'radar', data:{labels, datasets:[{label:'灵感', data:counts, backgroundColor:'rgba(143,175,159,0.13)', borderColor:'#8FAF9F', pointBackgroundColor:'#8FAF9F', pointRadius:4}]}, options:{plugins:{legend:{display:false}},scales:{r:{beginAtZero:true,ticks:{stepSize:1,color:'#8A857E'},grid:{color:'#EDEBE5'},pointLabels:{color:'#4A4540',font:{family:'Cormorant Garamond',style:'italic'}}}}}});
}
function renderTagChart() {
  dc('tag');
  const tc = {};
  inspirations.forEach(i => (i.tags||[]).forEach(t => { tc[t]=(tc[t]||0)+1; }));
  const entries = Object.entries(tc).sort((a,b)=>b[1]-a[1]).slice(0,9);
  if (!entries.length) return;
  const ctx = document.getElementById('tagChart'); if (!ctx) return;
  charts.tag = new Chart(ctx, {type:'doughnut', data:{labels:entries.map(e=>'#'+e[0]), datasets:[{data:entries.map(e=>e[1]), backgroundColor:entries.map((_,i)=>{const tg=tags.find(t=>t.name===entries[i][0]);return tg?tg.color:MORANDI[i%MORANDI.length];}), borderWidth:2, borderColor:'#FDFCF9'}]}, options:{plugins:{legend:{position:'bottom',labels:{font:{size:11,family:'Cormorant Garamond'},color:'#4A4540',padding:10}}},cutout:'58%'}});
}
function renderMoodChart() {
  dc('mood');
  const mc = {};
  inspirations.forEach(i => { if (i.mood) mc[i.mood]=(mc[i.mood]||0)+1; });
  const entries = Object.entries(mc);
  if (!entries.length) return;
  const moodCol={excited:'#C2A98E',happy:'#8FAF9F',calm:'#9BB5C4',thoughtful:'#A898B5',sad:'#8B9EB7',anxious:'#C4998A',grateful:'#B5A0C4',inspired:'#9EC4B5'};
  const ctx = document.getElementById('moodChart'); if (!ctx) return;
  charts.mood = new Chart(ctx, {type:'polarArea', data:{labels:entries.map(e=>`${MOOD_EMOJI[e[0]]} ${MOOD_LABEL[e[0]]}`), datasets:[{data:entries.map(e=>e[1]), backgroundColor:entries.map(e=>(moodCol[e[0]]||'#8FAF9F')+'BB'), borderColor:entries.map(e=>moodCol[e[0]]||'#8FAF9F'), borderWidth:1.5}]}, options:{plugins:{legend:{position:'bottom',labels:{font:{size:11,family:'Cormorant Garamond'},color:'#4A4540'}}}}});
}
function renderTrendChart() {
  dc('trend');
  const W = 8; // 最近8周
  const labels = [], counts = [];
  const now = new Date();
  // 以本周一为基准，往回推8周
  const todayDay = now.getDay() === 0 ? 6 : now.getDay() - 1; // 0=周一
  const thisMonday = new Date(now);
  thisMonday.setDate(now.getDate() - todayDay);
  thisMonday.setHours(0, 0, 0, 0);

  for (let i = W - 1; i >= 0; i--) {
    const weekStart = new Date(thisMonday);
    weekStart.setDate(thisMonday.getDate() - i * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    // 标签：月/日
    labels.push(`${weekStart.getMonth()+1}/${weekStart.getDate()}`);
    // 统计该周灵感数
    counts.push(inspirations.filter(ins => {
      const t = ins.created;
      return t >= weekStart.getTime() && t < weekEnd.getTime();
    }).length);
  }
  const ctx = document.getElementById('trendChart'); if (!ctx) return;
  charts.trend = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: '灵感',
        data: counts,
        borderColor: '#8FAF9F',
        backgroundColor: 'rgba(143,175,159,0.07)',
        fill: true, tension: 0.45,
        pointBackgroundColor: '#8FAF9F', pointRadius: 4,
        pointHoverRadius: 6,
      }]
    },
    options: {
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            title: (items) => `第 ${W - (W-1-items[0].dataIndex)} 周（起：${items[0].label}）`,
            label: (item) => ` ${item.raw} 条灵感`,
          }
        }
      },
      scales: {
        y: { beginAtZero: true, ticks: { stepSize: 1, color: '#8A857E' }, grid: { color: '#EDEBE5' } },
        x: { ticks: { color: '#8A857E' }, grid: { display: false } }
      }
    }
  });
}
function renderPeakCards() {
  const c = document.getElementById('peakCards'); if (!c) return;
  if (!inspirations.length) { c.innerHTML='<p style="color:var(--text-sub);font-style:italic">暂无数据，快去记录灵感吧</p>'; return; }
  const hc=Array(24).fill(0); inspirations.forEach(i=>hc[new Date(i.created).getHours()]++);
  const ph=hc.indexOf(Math.max(...hc));
  const wc=Array(7).fill(0), wn=['周日','周一','周二','周三','周四','周五','周六'];
  inspirations.forEach(i=>wc[new Date(i.created).getDay()]++);
  const pw=wc.indexOf(Math.max(...wc));
  const tc={}; inspirations.forEach(i=>(i.tags||[]).forEach(t=>{tc[t]=(tc[t]||0)+1;}));
  const te=Object.entries(tc).sort((a,b)=>b[1]-a[1])[0];
  const mc={}; inspirations.forEach(i=>{if(i.mood)mc[i.mood]=(mc[i.mood]||0)+1;});
  const me=Object.entries(mc).sort((a,b)=>b[1]-a[1])[0];

  // 延伸灵感深度：统计延伸最多节点数
  let maxDepthIns = null, maxNodes = 0;
  inspirations.forEach(ins => {
    const stored = localStorage.getItem('muse_mm_' + ins.id);
    if (!stored) return;
    try {
      const mm = JSON.parse(stored);
      const cnt = (mm.nodes || []).length;
      if (cnt > maxNodes) { maxNodes = cnt; maxDepthIns = ins; }
    } catch(e) {}
  });

  c.innerHTML=`
    <div class="peak-card" style="background:linear-gradient(135deg,#8FAF9F,#9EC4B5)">
      <div class="peak-card-label">灵感高峰时段</div>
      <div class="peak-card-value">${ph}:00</div>
      <div class="peak-card-sub">${hc[ph]} 条</div>
    </div>
    <div class="peak-card" style="background:linear-gradient(135deg,#8B9EB7,#9BB5C4)">
      <div class="peak-card-label">最活跃星期</div>
      <div class="peak-card-value">${wn[pw]}</div>
      <div class="peak-card-sub">${wc[pw]} 条</div>
    </div>
    ${te?`<div class="peak-card" style="background:linear-gradient(135deg,#A898B5,#B5A0C4)">
      <div class="peak-card-label">最常用标签</div>
      <div class="peak-card-value" style="font-size:1rem">#${te[0]}</div>
      <div class="peak-card-sub">${te[1]} 次</div>
    </div>`:''}
    ${me?`<div class="peak-card" style="background:linear-gradient(135deg,#C2A98E,#C4B08A)">
      <div class="peak-card-label">最常见心情</div>
      <div class="peak-card-value">${MOOD_EMOJI[me[0]]}</div>
      <div class="peak-card-sub">${MOOD_LABEL[me[0]]}</div>
    </div>`:''}
    ${maxDepthIns && maxNodes > 1 ? `<div class="peak-card" style="background:linear-gradient(135deg,#7A9E8E,#8FAF9F)">
      <div class="peak-card-label">延伸最深灵感</div>
      <div class="peak-card-value" style="font-size:0.82rem;line-height:1.3">${escHtml((maxDepthIns.title||maxDepthIns.content).substring(0,16))}${((maxDepthIns.title||maxDepthIns.content).length>16?'…':'')}</div>
      <div class="peak-card-sub">🌿 ${maxNodes} 个节点</div>
    </div>`:''}`;
}

/* =========================================================
   灵感分布气泡图
   ========================================================= */
function renderBubbleMap() {
  const canvas = document.getElementById('bubbleMap');
  if (!canvas) return;
  const tagCount = {}, tagCoCount = {};
  inspirations.forEach(ins => {
    const t = ins.tags || [];
    t.forEach(a => { tagCount[a] = (tagCount[a]||0)+1; });
    for (let i=0; i<t.length; i++) for (let j=i+1; j<t.length; j++) {
      const key = [t[i],t[j]].sort().join('||');
      tagCoCount[key] = (tagCoCount[key]||0)+1;
    }
  });
  const activeTags = tags.filter(t => tagCount[t.name]>0);
  const untagged = inspirations.filter(i => !(i.tags&&i.tags.length)).length;
  if (untagged > 0) activeTags.push({ id:'untagged', name:'未分类', color:'#C8BCA8' });
  const dpr  = window.devicePixelRatio || 1;
  const cssW = canvas.parentElement.clientWidth || 860;
  const cssH = Math.max(420, Math.min(600, cssW * 0.65));
  // 物理像素（清晰）
  canvas.width  = cssW * dpr;
  canvas.height = cssH * dpr;
  canvas.style.width  = cssW + 'px';
  canvas.style.height = cssH + 'px';
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  // 下面所有坐标均使用 CSS 像素
  const W = cssW, H = cssH;
  ctx.clearRect(0,0,W,H);
  if (!activeTags.length) {
    ctx.fillStyle='#B5B0A8'; ctx.font=`italic 15px 'Cormorant Garamond',serif`;
    ctx.textAlign='center';
    ctx.fillText('还没有带标签的灵感，记录后即可看到分布图', W/2, H/2);
    return;
  }
  const maxCount = Math.max(...activeTags.map(t => t.name==='未分类'?untagged:(tagCount[t.name]||0)));
  const cx=W/2, cy=H/2;
  const nodes = activeTags.map((t,i) => {
    const cnt = t.name==='未分类' ? untagged : (tagCount[t.name]||0);
    const r = 20 + (cnt/maxCount)*50;
    const angle = (2*Math.PI*i/activeTags.length) - Math.PI/2;
    const dist = Math.min(W,H)*0.32 + r*0.3;
    return { tag:t, cnt, r, x:cx+dist*Math.cos(angle), y:cy+dist*Math.sin(angle) };
  });
  ctx.beginPath(); ctx.arc(cx,cy,Math.min(W,H)*0.38,0,Math.PI*2);
  ctx.strokeStyle='rgba(143,175,159,0.08)'; ctx.lineWidth=1; ctx.stroke();
  ctx.beginPath(); ctx.arc(cx,cy,Math.min(W,H)*0.25,0,Math.PI*2);
  ctx.strokeStyle='rgba(143,175,159,0.06)'; ctx.lineWidth=1; ctx.stroke();
  nodes.forEach((n1,i) => {
    nodes.forEach((n2,j) => {
      if (j<=i) return;
      const key=[n1.tag.name,n2.tag.name].sort().join('||');
      const co=tagCoCount[key]||0; if (!co) return;
      const lw = Math.min(4.5, 0.8+co*0.6);
      const alpha = Math.min(0.55, 0.1+co*0.09);
      ctx.beginPath(); ctx.moveTo(n1.x,n1.y); ctx.lineTo(n2.x,n2.y);
      ctx.strokeStyle=`rgba(143,175,159,${alpha})`;
      ctx.lineWidth=lw; ctx.stroke();

      // 共现次数标注（≥2次才显示）
      if (co >= 2) {
        const mx = (n1.x+n2.x)/2, my = (n1.y+n2.y)/2;
        ctx.save();
        ctx.beginPath(); ctx.arc(mx, my, 10, 0, Math.PI*2);
        ctx.fillStyle = 'rgba(143,175,159,0.18)'; ctx.fill();
        ctx.fillStyle = '#6D9281';
        ctx.font = `bold 9px 'PingFang SC',sans-serif`;
        ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText(co, mx, my);
        ctx.restore();
      }
    });
  });
  nodes.forEach(n => {
    ctx.beginPath(); ctx.moveTo(n.x,n.y); ctx.lineTo(cx,cy);
    ctx.strokeStyle='rgba(180,172,162,0.2)'; ctx.lineWidth=1;
    ctx.setLineDash([4,6]); ctx.stroke(); ctx.setLineDash([]);
    const grad=ctx.createRadialGradient(n.x,n.y,n.r*0.3,n.x,n.y,n.r*1.7);
    grad.addColorStop(0, n.tag.color+'33'); grad.addColorStop(1,'transparent');
    ctx.beginPath(); ctx.arc(n.x,n.y,n.r*1.7,0,Math.PI*2); ctx.fillStyle=grad; ctx.fill();
    ctx.beginPath(); ctx.arc(n.x,n.y,n.r,0,Math.PI*2);
    ctx.fillStyle=n.tag.color+'CC'; ctx.fill();
    ctx.strokeStyle='rgba(255,255,255,0.6)'; ctx.lineWidth=1.5; ctx.stroke();
    const fs=Math.max(10,Math.min(14,n.r*0.45));
    ctx.fillStyle='#fff'; ctx.font=`italic ${fs}px 'Cormorant Garamond',serif`;
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText('#'+n.tag.name, n.x, n.y-n.r*0.15);
    ctx.fillStyle='rgba(255,255,255,0.75)';
    ctx.font=`${Math.max(9,Math.min(11,n.r*0.38))}px 'PingFang SC',sans-serif`;
    ctx.fillText(n.cnt+'条', n.x, n.y+n.r*0.45);
  });
  // ── 中心节点（两版）
  if (mapCenterStyle === 'tree') {
    drawMapCenterTree(ctx, cx, cy, inspirations.length);
  } else {
    drawMapCenterMuse(ctx, cx, cy, inspirations.length);
  }
  const legend=document.getElementById('mapLegend');
  if (legend) legend.innerHTML=nodes.map(n=>`<div class="legend-item"><div class="legend-dot" style="background:${n.tag.color}"></div><span>#${n.tag.name} (${n.cnt})</span></div>`).join('');
}

/* 中心风格切换 */
function setMapCenterStyle(style) {
  mapCenterStyle = style;
  document.getElementById('mapStyleMuseBtn')?.classList.toggle('active', style === 'muse');
  document.getElementById('mapStyleTreeBtn')?.classList.toggle('active', style === 'tree');
  renderBubbleMap();
}

/* 中心版本①：Muse 文字渐变圆形 */
function drawMapCenterMuse(ctx, cx, cy, total) {
  // 外光晕
  const halo = ctx.createRadialGradient(cx, cy, 18, cx, cy, 52);
  halo.addColorStop(0, 'rgba(143,175,159,0.18)');
  halo.addColorStop(1, 'transparent');
  ctx.beginPath(); ctx.arc(cx, cy, 52, 0, Math.PI*2);
  ctx.fillStyle = halo; ctx.fill();

  // 主圆
  const cg = ctx.createRadialGradient(cx-6, cy-6, 2, cx, cy, 30);
  cg.addColorStop(0, '#9EC4B5');
  cg.addColorStop(1, '#7A9E8E');
  ctx.beginPath(); ctx.arc(cx, cy, 30, 0, Math.PI*2);
  ctx.fillStyle = cg; ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 2; ctx.stroke();

  // Muse 文字
  ctx.fillStyle = '#fff';
  ctx.font = `italic bold 14px 'Cormorant Garamond',serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('Muse', cx, cy - 6);

  // 数量
  ctx.font = `10px 'PingFang SC',sans-serif`;
  ctx.fillStyle = 'rgba(255,255,255,0.82)';
  ctx.fillText(`${total} 条`, cx, cy + 9);
}

/* 中心版本②：线条树形 */
function drawMapCenterTree(ctx, cx, cy, total) {
  const baseY = cy + 26;   // 树干底部
  const trunkH = 22;       // 树干高度
  const trunkTop = baseY - trunkH;

  ctx.save();
  ctx.lineCap = 'round';

  // ── 地面横线
  ctx.beginPath();
  ctx.moveTo(cx - 14, baseY); ctx.lineTo(cx + 14, baseY);
  ctx.strokeStyle = 'rgba(143,175,159,0.5)'; ctx.lineWidth = 1.5; ctx.stroke();

  // ── 树干
  ctx.beginPath();
  ctx.moveTo(cx, baseY); ctx.lineTo(cx, trunkTop);
  ctx.strokeStyle = '#8FAF9F'; ctx.lineWidth = 2.2; ctx.stroke();

  // ── 树枝（对称5组，用递归感手绘）
  const branches = [
    // [起点比例(0=trunk底,1=trunk顶), 角度deg, 长度, 线宽]
    [0.75, -50, 20, 1.5],
    [0.75,  50, 20, 1.5],
    [0.50, -65, 14, 1.2],
    [0.50,  65, 14, 1.2],
    [0.28, -72, 10, 1.0],
    [0.28,  72, 10, 1.0],
  ];
  branches.forEach(([t, deg, len, lw]) => {
    const bx = cx;
    const by = baseY - trunkH * t;
    const rad = deg * Math.PI / 180;
    const ex = bx + len * Math.sin(rad);
    const ey = by - len * Math.cos(rad);
    ctx.beginPath();
    ctx.moveTo(bx, by); ctx.lineTo(ex, ey);
    ctx.strokeStyle = '#8FAF9F'; ctx.lineWidth = lw; ctx.stroke();

    // 末端小叶点
    ctx.beginPath();
    ctx.arc(ex, ey, 2.2, 0, Math.PI*2);
    ctx.fillStyle = '#9EC4B5'; ctx.fill();
  });

  // ── 树顶圆冠（轻晕）
  const topGlow = ctx.createRadialGradient(cx, trunkTop - 8, 2, cx, trunkTop - 8, 18);
  topGlow.addColorStop(0, 'rgba(143,175,159,0.28)');
  topGlow.addColorStop(1, 'transparent');
  ctx.beginPath(); ctx.arc(cx, trunkTop - 8, 18, 0, Math.PI*2);
  ctx.fillStyle = topGlow; ctx.fill();

  // ── 树顶主干末端叶
  ctx.beginPath(); ctx.arc(cx, trunkTop, 3.5, 0, Math.PI*2);
  ctx.fillStyle = '#8FAF9F'; ctx.fill();

  ctx.restore();

  // ── 数量文字（树下方）
  ctx.fillStyle = '#7A9E8E';
  ctx.font = `italic 11px 'Cormorant Garamond',serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillText(`${total} 条灵感`, cx, baseY + 6);
}


/* =========================================================
  数据结构：
    mmData = {
      rootInsId: 'ins_xxx',        // 根节点对应的灵感 id
      nodes: [
        { id, text, x, y, parentId, color, isRoot }
      ]
    }
  渲染：纯 Canvas，支持拖拽 / 双击编辑 / 右键/+添加子节点 / Del删除
*/

/* 注：mmData/mmCanvas 等变量已在全局状态区前置声明 */

const MM_NODE_W = 120, MM_NODE_H = 44, MM_RADIUS = 10;
const MM_ROOT_W = 150, MM_ROOT_H = 54;

function initMindMap() {
  mmCanvas = document.getElementById('mindmapCanvas');
  if (!mmCanvas) return;
  resizeMmCanvas();

  mmCanvas.addEventListener('mousedown',   mmOnMouseDown);
  mmCanvas.addEventListener('mousemove',   mmOnMouseMove);
  mmCanvas.addEventListener('mouseup',     mmOnMouseUp);
  mmCanvas.addEventListener('dblclick',    mmOnDblClick);
  mmCanvas.addEventListener('contextmenu', mmOnContextMenu);

  window.addEventListener('resize', () => {
    resizeMmCanvas();
    renderMindMap();
  });
}

function resizeMmCanvas() {
  if (!mmCanvas) return;
  const wrap = mmCanvas.parentElement;
  const dpr  = window.devicePixelRatio || 1;
  const cssW = wrap.clientWidth  || 800;
  const cssH = wrap.clientHeight || 500;
  // 设置 Canvas 物理像素（清晰）
  mmCanvas.width  = cssW * dpr;
  mmCanvas.height = cssH * dpr;
  // CSS 显示尺寸不变
  mmCanvas.style.width  = cssW + 'px';
  mmCanvas.style.height = cssH + 'px';
  mmCtx = mmCanvas.getContext('2d');
  mmCtx.scale(dpr, dpr); // 所有绘图坐标仍用 CSS 像素
  // 记录 CSS 逻辑尺寸，供命中检测和坐标计算使用
  mmCanvas._cssW = cssW;
  mmCanvas._cssH = cssH;
}

/* 填充「选择根灵感」下拉框 */
function populateRootSelect() {
  const sel = document.getElementById('rootSelect');
  if (!sel) return;
  const saved = mmData.rootInsId;
  sel.innerHTML = '<option value="">— 选择一条灵感作为起点 —</option>'
    + [...inspirations].sort((a,b)=>b.created-a.created).map(ins =>
      `<option value="${ins.id}" ${ins.id===saved?'selected':''}>${escHtml((ins.title||ins.content).substring(0,36))}</option>`
    ).join('');
  sel.onchange = onRootSelectChange;
}

function onRootSelectChange() {
  const sel = document.getElementById('rootSelect');
  const insId = sel ? sel.value : '';
  if (!insId) return;
  const ins = inspirations.find(i=>i.id===insId);
  if (!ins) return;

  // 如果切换根节点，保存当前 / 新建树
  const stored = localStorage.getItem('muse_mm_' + insId);
  if (stored) {
    mmData = JSON.parse(stored);
  } else {
    const W = mmCanvas._cssW || mmCanvas.clientWidth || 800;
    const H = mmCanvas._cssH || mmCanvas.clientHeight || 500;
    mmData = {
      rootInsId: insId,
      nodes: [{
        id: 'n_root',
        text: ins.title || ins.content.substring(0,28),
        x: W/2 - MM_ROOT_W/2,
        y: H/2 - MM_ROOT_H/2,
        parentId: null,
        color: '#8FAF9F',
        isRoot: true,
      }]
    };
  }
  mmPan = {x:0, y:0};
  mmSel = null;
  saveMmData();
  renderMindMap();
}

function saveMmData() {
  if (!mmData.rootInsId) return;
  localStorage.setItem('muse_mm_' + mmData.rootInsId, JSON.stringify(mmData));
}

/* ── 核心渲染 ── */
function renderMindMap() {
  if (!mmCtx) return;
  const W = mmCanvas._cssW || mmCanvas.clientWidth || 800;
  const H = mmCanvas._cssH || mmCanvas.clientHeight || 500;
  mmCtx.clearRect(0,0,W,H);

  if (!mmData.nodes.length) {
    mmCtx.fillStyle = '#C8BCA8';
    mmCtx.font = `italic 15px 'Cormorant Garamond',serif`;
    mmCtx.textAlign = 'center'; mmCtx.textBaseline = 'middle';
    mmCtx.fillText('先从上方选择一条灵感，开始你的思维延伸之旅', W/2, H/2);
    return;
  }

  mmCtx.save();
  mmCtx.translate(mmPan.x, mmPan.y);

  /* 连线 */
  mmData.nodes.forEach(n => {
    if (!n.parentId) return;
    const p = mmData.nodes.find(x=>x.id===n.parentId);
    if (!p) return;
    const pw = p.isRoot ? MM_ROOT_W : MM_NODE_W;
    const ph = p.isRoot ? MM_ROOT_H : MM_NODE_H;
    const nw = n.isRoot ? MM_ROOT_W : MM_NODE_W;
    const nh = n.isRoot ? MM_ROOT_H : MM_NODE_H;
    const x1=p.x+pw/2, y1=p.y+ph/2, x2=n.x+nw/2, y2=n.y+nh/2;
    // 贝塞尔曲线
    const cpx = (x1+x2)/2;
    mmCtx.beginPath();
    mmCtx.moveTo(x1,y1);
    mmCtx.bezierCurveTo(cpx,y1, cpx,y2, x2,y2);
    mmCtx.strokeStyle = n.color+'88';
    mmCtx.lineWidth = 1.6;
    mmCtx.stroke();
  });

  /* 节点 */
  mmData.nodes.forEach(n => {
    const nw = n.isRoot ? MM_ROOT_W : MM_NODE_W;
    const nh = n.isRoot ? MM_ROOT_H : MM_NODE_H;
    const isSel = n.id === mmSel;
    const x=n.x, y=n.y;

    /* 阴影 */
    mmCtx.shadowColor = 'rgba(62,56,48,0.14)';
    mmCtx.shadowBlur  = isSel ? 16 : 8;
    mmCtx.shadowOffsetY = 3;

    /* 填充 */
    const grad = mmCtx.createLinearGradient(x,y,x+nw,y+nh);
    if (n.isRoot) {
      grad.addColorStop(0, '#8FAF9F');
      grad.addColorStop(1, '#7A9E8E');
    } else {
      grad.addColorStop(0, n.color+'EE');
      grad.addColorStop(1, n.color+'BB');
    }
    mmCtx.beginPath();
    mmRoundRect(mmCtx, x, y, nw, nh, MM_RADIUS);
    mmCtx.fillStyle = grad;
    mmCtx.fill();
    mmCtx.shadowColor = 'transparent'; mmCtx.shadowBlur=0; mmCtx.shadowOffsetY=0;

    /* 选中边框 */
    if (isSel) {
      mmCtx.beginPath();
      mmRoundRect(mmCtx, x-2, y-2, nw+4, nh+4, MM_RADIUS+2);
      mmCtx.strokeStyle = '#C4998A';
      mmCtx.lineWidth = 2;
      mmCtx.stroke();
    } else {
      mmCtx.beginPath();
      mmRoundRect(mmCtx, x, y, nw, nh, MM_RADIUS);
      mmCtx.strokeStyle = 'rgba(255,255,255,0.4)';
      mmCtx.lineWidth = 1;
      mmCtx.stroke();
    }

    /* 文字 */
    mmCtx.fillStyle = '#fff';
    mmCtx.textAlign = 'center'; mmCtx.textBaseline = 'middle';
    if (n.isRoot) {
      mmCtx.font = `italic bold 13px 'Playfair Display',serif`;
    } else {
      mmCtx.font = `italic 12px 'Cormorant Garamond',serif`;
    }
    const maxW = nw - 16;
    mmDrawTextWrap(mmCtx, n.text, x+nw/2, y+nh/2, maxW, 16);

    /* 「+」悬浮按钮（仅选中状态） */
    if (isSel) {
      const bx = x+nw+8, by = y+nh/2-10;
      mmAddBtn = { x:bx, y:by, w:20, h:20, nodeId:n.id };
      mmCtx.beginPath();
      mmRoundRect(mmCtx, bx, by, 20, 20, 5);
      mmCtx.fillStyle = '#8FAF9F';
      mmCtx.fill();
      mmCtx.fillStyle = '#fff';
      mmCtx.font = 'bold 14px sans-serif';
      mmCtx.textAlign = 'center'; mmCtx.textBaseline = 'middle';
      mmCtx.fillText('+', bx+10, by+10);
    }
  });

  mmCtx.restore();
}

/* 辅助：圆角矩形 */
function mmRoundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x+r, y);
  ctx.lineTo(x+w-r, y); ctx.arcTo(x+w,y, x+w,y+r, r);
  ctx.lineTo(x+w, y+h-r); ctx.arcTo(x+w,y+h, x+w-r,y+h, r);
  ctx.lineTo(x+r, y+h); ctx.arcTo(x,y+h, x,y+h-r, r);
  ctx.lineTo(x, y+r); ctx.arcTo(x,y, x+r,y, r);
  ctx.closePath();
}

/* 辅助：文字自动截断 */
function mmDrawTextWrap(ctx, text, cx, cy, maxW, lineH) {
  if (!text) return;
  if (ctx.measureText(text).width <= maxW) {
    ctx.fillText(text, cx, cy);
    return;
  }
  // 截断
  let t = text;
  while (ctx.measureText(t+'…').width > maxW && t.length > 1) t = t.slice(0,-1);
  ctx.fillText(t+'…', cx, cy);
}

/* 命中检测 */
function mmHitNode(px, py) {
  // 转换为画布坐标
  const cx = px - mmPan.x, cy = py - mmPan.y;
  // 从后往前（上层优先）
  for (let i=mmData.nodes.length-1; i>=0; i--) {
    const n = mmData.nodes[i];
    const nw = n.isRoot ? MM_ROOT_W : MM_NODE_W;
    const nh = n.isRoot ? MM_ROOT_H : MM_NODE_H;
    if (cx>=n.x && cx<=n.x+nw && cy>=n.y && cy<=n.y+nh) return n.id;
  }
  return null;
}
function mmHitAddBtn(px, py) {
  if (!mmAddBtn) return false;
  const cx = px - mmPan.x, cy = py - mmPan.y;
  const b = mmAddBtn;
  return cx>=b.x && cx<=b.x+b.w && cy>=b.y && cy<=b.y+b.h;
}

/* 鼠标事件 */
function mmOnMouseDown(e) {
  const rect = mmCanvas.getBoundingClientRect();
  const px = e.clientX - rect.left, py = e.clientY - rect.top;

  // 点击「+」按钮 → 添加子节点
  if (mmAddBtn && mmHitAddBtn(px, py)) {
    addChildNode(mmAddBtn.nodeId);
    return;
  }

  const hitId = mmHitNode(px, py);
  if (hitId) {
    mmSel = hitId;
    mmDragging = hitId;
    const n = mmData.nodes.find(x=>x.id===hitId);
    mmDragOff = { x: px - mmPan.x - n.x, y: py - mmPan.y - n.y };
    renderMindMap();
  } else {
    mmSel = null; mmAddBtn = null;
    mmPanning = true;
    mmPanStart = {x: e.clientX, y: e.clientY};
    mmPanOrig  = {x: mmPan.x,  y: mmPan.y};
    renderMindMap();
  }
}
function mmOnMouseMove(e) {
  const rect = mmCanvas.getBoundingClientRect();
  const px = e.clientX - rect.left, py = e.clientY - rect.top;
  if (mmDragging) {
    const n = mmData.nodes.find(x=>x.id===mmDragging);
    if (n) { n.x = px - mmPan.x - mmDragOff.x; n.y = py - mmPan.y - mmDragOff.y; }
    renderMindMap();
  } else if (mmPanning) {
    mmPan.x = mmPanOrig.x + (e.clientX - mmPanStart.x);
    mmPan.y = mmPanOrig.y + (e.clientY - mmPanStart.y);
    renderMindMap();
  }
}
function mmOnMouseUp(e) {
  if (mmDragging) { saveMmData(); mmDragging = null; }
  mmPanning = false;
}
function mmOnDblClick(e) {
  const rect = mmCanvas.getBoundingClientRect();
  const px = e.clientX - rect.left, py = e.clientY - rect.top;
  const hitId = mmHitNode(px, py);
  if (hitId) startNodeEdit(hitId, e.clientX, e.clientY);
}
function mmOnContextMenu(e) {
  e.preventDefault();
  const rect = mmCanvas.getBoundingClientRect();
  const px = e.clientX - rect.left, py = e.clientY - rect.top;
  const hitId = mmHitNode(px, py);
  if (hitId) { mmSel = hitId; addChildNode(hitId); renderMindMap(); }
}

/* 键盘 Del 删除 */
function handleKeyDown(e) {
  if (currentPage !== 'extend') return;
  if ((e.key === 'Delete' || e.key === 'Backspace') && mmSel && !mmEditTarget) {
    const n = mmData.nodes.find(x=>x.id===mmSel);
    if (n && !n.isRoot) {
      // 删除该节点及其所有子孙
      const toDelete = new Set();
      const collect = (id) => {
        toDelete.add(id);
        mmData.nodes.filter(x=>x.parentId===id).forEach(c=>collect(c.id));
      };
      collect(mmSel);
      mmData.nodes = mmData.nodes.filter(x=>!toDelete.has(x.id));
      mmSel = null; saveMmData(); renderMindMap();
      showToast('节点已删除');
    } else if (n && n.isRoot) {
      showToast('根节点不能删除');
    }
  }
}

/* 添加子节点 */
function addChildNode(parentId) {
  const parent = mmData.nodes.find(n=>n.id===parentId);
  if (!parent) return;
  const pw = parent.isRoot ? MM_ROOT_W : MM_NODE_W;
  const ph = parent.isRoot ? MM_ROOT_H : MM_NODE_H;
  // 计算已有子节点数量，决定位置
  const children = mmData.nodes.filter(n=>n.parentId===parentId);
  const angle = (children.length * 50 - (children.length-1)*25) * Math.PI/180;
  const dist = 200;
  const newId = 'n_' + Date.now();
  const colors = MORANDI;
  const newNode = {
    id: newId,
    text: '新节点',
    x: parent.x + pw/2 + dist * Math.cos(angle) - MM_NODE_W/2,
    y: parent.y + ph/2 + dist * Math.sin(angle) - MM_NODE_H/2,
    parentId,
    color: colors[(mmData.nodes.length) % colors.length],
    isRoot: false,
  };
  mmData.nodes.push(newNode);
  mmSel = newId;
  saveMmData(); renderMindMap();
  // 立即弹出编辑
  const rect = mmCanvas.getBoundingClientRect();
  const ex = rect.left + newNode.x + mmPan.x + MM_NODE_W/2;
  const ey = rect.top  + newNode.y + mmPan.y + MM_NODE_H/2;
  startNodeEdit(newId, ex, ey);
}

/* 节点编辑 */
function startNodeEdit(nodeId, clientX, clientY) {
  const n = mmData.nodes.find(x=>x.id===nodeId); if (!n) return;
  mmEditTarget = nodeId;
  const editor = document.getElementById('nodeEditor');
  const input  = document.getElementById('nodeEditorInput');
  if (!editor || !input) return;

  const wrap = mmCanvas.parentElement;
  const rect = wrap.getBoundingClientRect();
  const ex = Math.min(clientX - rect.left, wrap.clientWidth  - 240);
  const ey = Math.min(clientY - rect.top,  wrap.clientHeight - 60);
  editor.style.left = Math.max(4,ex) + 'px';
  editor.style.top  = Math.max(4,ey) + 'px';
  editor.style.display = 'flex';
  input.value = n.text === '新节点' ? '' : n.text;
  input.placeholder = '输入节点内容…';
  input.focus(); input.select();

  input.onkeydown = (e) => {
    if (e.key==='Enter') confirmNodeEdit();
    if (e.key==='Escape') cancelNodeEdit();
  };
}
function confirmNodeEdit() {
  const input = document.getElementById('nodeEditorInput');
  const val = input ? input.value.trim() : '';
  if (mmEditTarget) {
    const n = mmData.nodes.find(x=>x.id===mmEditTarget);
    if (n) n.text = val || '节点';
    mmEditTarget = null;
  }
  document.getElementById('nodeEditor').style.display = 'none';
  saveMmData(); renderMindMap();
}
function cancelNodeEdit() {
  const n = mmData.nodes.find(x=>x.id===mmEditTarget);
  // 如果是刚添加的空节点且还没填内容，删掉
  if (n && n.text==='新节点') {
    mmData.nodes = mmData.nodes.filter(x=>x.id!==mmEditTarget);
    mmSel = null;
  }
  mmEditTarget = null;
  document.getElementById('nodeEditor').style.display = 'none';
  saveMmData(); renderMindMap();
}

/* 清空画布 */
function clearMindMap() {
  if (!mmData.rootInsId) { showToast('请先选择一条灵感'); return; }
  if (!confirm('确定清空当前思维导图吗？')) return;
  const ins = inspirations.find(i=>i.id===mmData.rootInsId);
  if (!ins) return;
  const W = mmCanvas._cssW || mmCanvas.clientWidth || 800;
  const H = mmCanvas._cssH || mmCanvas.clientHeight || 500;
  mmData.nodes = [{
    id:'n_root', text:ins.title||ins.content.substring(0,28),
    x:W/2-MM_ROOT_W/2, y:H/2-MM_ROOT_H/2,
    parentId:null, color:'#8FAF9F', isRoot:true
  }];
  mmPan={x:0,y:0}; mmSel=null; saveMmData(); renderMindMap();
  showToast('画布已清空');
}

/* 导出图片 */
function exportMindMap() {
  if (!mmData.nodes.length) { showToast('画布为空，无法导出'); return; }
  // 临时在全尺寸画布上渲染
  const link = document.createElement('a');
  link.download = 'muse-mindmap.png';
  link.href = mmCanvas.toDataURL('image/png');
  link.click();
  showToast('思维导图已导出');
}

/* =========================================================
   手账贴纸功能 - Emoji 触发式
   ========================================================= */
let isStickerPanelOpen = false;

function toggleStickerPanel() {
  const panel = document.getElementById('stickerPanel');
  if (!panel) return;
  
  isStickerPanelOpen = !isStickerPanelOpen;
  panel.style.display = isStickerPanelOpen ? 'block' : 'none';
  
  if (isStickerPanelOpen && !document.getElementById('stickerGrid')) {
    initStickerPalette();
  }
}

function initStickerPalette() {
  const palette = document.getElementById('stickerPalette');
  if (!palette) return;
  
  // 创建分类按钮
  let html = '<div class="sticker-category">';
  STICKER_CATS.forEach((cat, i) => {
    html += `<button class="sticker-cat-btn ${i===0?'active':''}" onclick="switchStickerCat(${i})" data-idx="${i}">${cat.name}</button>`;
  });
  html += '</div>';
  
  // 创建贴纸网格
  html += '<div class="sticker-grid" id="stickerGrid">';
  STICKER_CATS[0].emojis.forEach(emoji => {
    html += `<div class="sticker-item" onclick="addSticker('${emoji}')">${emoji}</div>`;
  });
  html += '</div>';
  
  palette.innerHTML = html;
}

function switchStickerCat(idx) {
  currentStickerCat = idx;
  document.querySelectorAll('.sticker-cat-btn').forEach((btn, i) => {
    btn.classList.toggle('active', i === idx);
  });
  
  const grid = document.getElementById('stickerGrid');
  if (grid) {
    grid.innerHTML = STICKER_CATS[idx].emojis.map(emoji => 
      `<div class="sticker-item" onclick="addSticker('${emoji}')">${emoji}</div>`
    ).join('');
  }
}

/* =========================================================
   背景音乐控制
   ========================================================= */
let isMusicPlaying = false;
let musicStarted = false;

function initMusic() {
  const music = document.getElementById('bgMusic');
  if (!music) return;
  
  // 设置音量
  music.volume = 0.3;
}

function toggleMusic() {
  const music = document.getElementById('bgMusic');
  const control = document.getElementById('musicControl');
  if (!music || !control) return;
  
  if (!musicStarted) {
    // 首次点击，开始播放
    music.play().then(() => {
      isMusicPlaying = true;
      musicStarted = true;
      control.classList.add('playing');
      showToast('🎵 背景音乐已开启');
    }).catch(e => {
      showToast('点击页面任意位置以开启音乐');
    });
  } else {
    if (isMusicPlaying) {
      music.pause();
      isMusicPlaying = false;
      control.classList.remove('playing');
    } else {
      music.play();
      isMusicPlaying = true;
      control.classList.add('playing');
    }
  }
}

function addSticker(emoji) {
  const layer = document.getElementById('stickerLayer');
  if (!layer) return;
  
  const rect = layer.getBoundingClientRect();
  const x = 50 + Math.random() * (rect.width - 150);
  const y = 80 + Math.random() * (rect.height - 200);
  
  const sticker = {
    id: 'sticker_' + Date.now(),
    emoji: emoji,
    x: x,
    y: y,
    page: diaryPage,
    scale: 1
  };
  
  placedStickers.push(sticker);
  renderSticker(sticker);
  saveStickers();
}

function renderSticker(sticker) {
  const layer = document.getElementById('stickerLayer');
  if (!layer) return;
  
  const el = document.createElement('div');
  el.className = 'placed-sticker';
  el.id = sticker.id;
  el.style.left = sticker.x + 'px';
  el.style.top = sticker.y + 'px';
  el.style.fontSize = (2 * (sticker.scale || 1)) + 'rem';
  el.innerHTML = `${sticker.emoji}
    <div class="sticker-controls">
      <button class="sticker-ctrl-btn" onclick="scaleSticker('${sticker.id}', 0.8)" title="缩小">−</button>
      <button class="sticker-ctrl-btn" onclick="scaleSticker('${sticker.id}', 1.25)" title="放大">+</button>
      <button class="sticker-ctrl-btn" onclick="deleteSticker('${sticker.id}')" title="删除" style="background:var(--accent);color:#fff">✕</button>
    </div>`;
  
  // 拖拽功能
  let isDragging = false;
  let startX, startY, startLeft, startTop;
  
  el.addEventListener('mousedown', (e) => {
    if (e.target.closest('.sticker-controls')) return;
    isDragging = true;
    el.classList.add('dragging');
    startX = e.clientX;
    startY = e.clientY;
    startLeft = parseFloat(el.style.left);
    startTop = parseFloat(el.style.top);
    e.preventDefault();
  });
  
  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    el.style.left = (startLeft + dx) + 'px';
    el.style.top = (startTop + dy) + 'px';
  });
  
  document.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      el.classList.remove('dragging');
      // 更新位置
      const s = placedStickers.find(s => s.id === sticker.id);
      if (s) {
        s.x = parseFloat(el.style.left);
        s.y = parseFloat(el.style.top);
        saveStickers();
      }
    }
  });
  
  layer.appendChild(el);
}

function scaleSticker(id, factor) {
  const s = placedStickers.find(s => s.id === id);
  if (!s) return;
  
  s.scale = (s.scale || 1) * factor;
  // 限制大小范围
  if (s.scale < 0.5) s.scale = 0.5;
  if (s.scale > 3) s.scale = 3;
  
  const el = document.getElementById(id);
  if (el) {
    el.style.fontSize = (2 * s.scale) + 'rem';
  }
  saveStickers();
}

function deleteSticker(id) {
  placedStickers = placedStickers.filter(s => s.id !== id);
  const el = document.getElementById(id);
  if (el) el.remove();
  saveStickers();
}

function clearAllStickers() {
  if (!placedStickers.length) return;
  if (!confirm('确定清除当前页面的所有贴纸吗？')) return;
  placedStickers = [];
  const layer = document.getElementById('stickerLayer');
  if (layer) layer.innerHTML = '';
  saveStickers();
  showToast('贴纸已清除');
}

function saveStickers() {
  localStorage.setItem('muse_stickers', JSON.stringify(placedStickers));
}

function loadStickers() {
  const layer = document.getElementById('stickerLayer');
  if (!layer) return;
  
  // 清空现有贴纸
  layer.innerHTML = '';
  
  // 从 localStorage 加载
  try {
    const saved = localStorage.getItem('muse_stickers');
    if (saved) {
      placedStickers = JSON.parse(saved);
      // 只显示当前页的贴纸
      placedStickers.filter(s => s.page === diaryPage).forEach(renderSticker);
    }
  } catch(e) {
    placedStickers = [];
  }
}

// 翻页时重新加载贴纸
const originalPrevPage = prevPage;
const originalNextPage = nextPage;
prevPage = function() {
  if (diaryPage > 0) {
    diaryPage--;
    renderDiary();
    loadStickers();
  }
};
nextPage = function() {
  const total = Math.ceil(filteredInspirations.length / EPP);
  if (diaryPage < total - 1) {
    diaryPage++;
    renderDiary();
    loadStickers();
  }
};

/* =========================================================
   工具函数
   ========================================================= */
function escHtml(s) {
  if (!s) return '';
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function formatDate(ts) {
  const d=new Date(ts), now=new Date(), diff=(now-d)/1000;
  if (diff<60) return '刚刚';
  if (diff<3600) return Math.floor(diff/60)+'分钟前';
  if (diff<86400) return Math.floor(diff/3600)+'小时前';
  if (diff<172800) return '昨天';
  return `${d.getMonth()+1}/${d.getDate()}`;
}
function formatDateFull(ts) {
  const d=new Date(ts), pad=n=>String(n).padStart(2,'0');
  return `${d.getFullYear()}.${pad(d.getMonth()+1)}.${pad(d.getDate())}  ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(t._tmr); t._tmr = setTimeout(() => t.classList.remove('show'), 2400);
}
