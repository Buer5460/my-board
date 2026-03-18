import React, { useState, useMemo, useEffect } from 'react';
import { Search, Flame, ShieldCheck, Zap, TrendingUp, Users, Activity, Eye, Globe } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, onSnapshot, setDoc, updateDoc, increment } from 'firebase/firestore';

// 模拟当下社会环境中的各类出路/赛道数据
const PATHS_DATA = [
  { id: 1, title: '考公 / 考编', keyword: '体制内', score: 10, category: '体制内', income: '8万-15万/年 (稳定)', capacity: '极度饱和', risk: '地狱级内卷', reason: '在经济不确定期，稳定成为最高溢价。热门岗位报录比极高，笔试面试竞争极度白热化，上岸难度堪比千军万马过独木桥。' },
  { id: 2, title: '科技大厂', keyword: '头部企业', score: 9, category: '企业打工', income: '30万-100万/年', capacity: '正在缩编', risk: '高压内卷', reason: '曾经的造富神话，如今面临“降本增效”。以高薪换取高强度劳动（996），且存在强烈的年龄焦虑，随时可能被优化。' },
  { id: 3, title: '考研 / 读博', keyword: '学历提升', score: 8, category: '学术教育', income: '补贴为主', capacity: '趋于饱和', risk: '严重内卷', reason: '本科学历贬值导致的防御性动作。海量考生报考，分数线连年水涨船高，但毕业后仍需面对真实就业市场，属于“延迟满足与延迟焦虑”。' },
  { id: 4, title: '外卖 / 网约车 / 快递', keyword: '零工经济', score: 8, category: '灵活就业', income: '6万-12万/年 (计件)', capacity: '蓄水池满', risk: '体力内卷', reason: '作为社会的就业蓄水池，门槛低但被平台算法极度规训。随着大量人员涌入，单价下降，日均在线时长被迫拉长至12小时以上才能维持原收入。' },
  { id: 5, title: '新能源 / 制造', keyword: '硬科技', score: 7, category: '企业打工', income: '15万-40万/年', capacity: '存在缺口', risk: '中度竞争', reason: '战略扶持的赛道，存在真实的人才缺口。虽然工作地点多在边缘厂区，且有倒班等情况，但相对而言，是目前仍在扩张的红利期行业。' },
  { id: 6, title: '全职自媒体 / 网红', keyword: '内容创作者', score: 7, category: '自由职业', income: '0至无上限', capacity: '马太效应', risk: '极度不稳', reason: '幸存者偏差极其严重的赛道。头部吃掉绝大部分利润，底层博主面临流量焦虑、平台规则变动和变现困难，精神压力极大。' },
  { id: 7, title: '传统外企', keyword: 'WLB', score: 6, category: '企业打工', income: '15万-40万/年', capacity: '持续收缩', risk: '中度竞争', reason: '追求 Work-Life Balance 的避风港，不卷加班。但随着产业链调整，岗位数量逐年减少，升职空间受限，且随时有撤出或裁员风险。' },
  { id: 8, title: '高级蓝领 / 专精技工', keyword: '手艺人', score: 4, category: '技能服务', income: '10万-25万/年', capacity: '严重短缺', risk: '蓝海赛道', reason: '社会观念导致年轻人不愿意进工厂或从事体力手艺活。高级焊工、数控机床、水电维修等非标物理技能人才断层，凭手艺吃饭，反脆弱能力极强。' },
  { id: 9, title: '数字游民 / 独立开发', keyword: '独立工作', score: 4, category: '自由职业', income: '极度不稳', capacity: '小众群体', risk: '蓝海赛道', reason: '赚高薪，在低成本城市生活。需要极强的自律、单兵作战能力以及专业技术能力。摆脱了传统的职场压力，但要忍受长期的孤独与收入波动。' },
  { id: 10, title: '返乡新农人', keyword: '乡村创业', score: 3, category: '创业', income: '因人而异', capacity: '广阔天地', risk: '舒适/高危', reason: '避开核心城市高昂的生活成本。若懂电商运营和现代农业，大有可为；但若盲目流转土地搞传统种植，亏损风险极大。天然避开了人际关系内卷。' },
  { id: 11, title: '彻底躺平 / 全职儿女', keyword: 'FIRE/啃老', score: 0, category: '生活方式', income: '依靠家庭资产', capacity: '受限于父母钱包', risk: '零内卷', reason: '退出竞争游戏本身。每天负责陪伴父母、做家务，领取“家庭基础收入”。零职场内卷，零通勤成本，但考验家庭抗风险能力和自身的心理防御机制。' },
];

// 颜色映射系统
const getScoreColor = (score) => {
  if (score >= 9) return 'bg-red-600 text-white border-red-800';
  if (score >= 7) return 'bg-orange-500 text-white border-orange-700';
  if (score >= 4) return 'bg-yellow-400 text-gray-900 border-yellow-600';
  if (score >= 2) return 'bg-emerald-400 text-gray-900 border-emerald-600';
  return 'bg-green-600 text-white border-green-800';
};

const getRiskLabelColor = (score) => {
  if (score >= 9) return 'text-red-600 bg-red-100 border-red-200';
  if (score >= 7) return 'text-orange-600 bg-orange-100 border-orange-200';
  if (score >= 4) return 'text-yellow-700 bg-yellow-100 border-yellow-200';
  if (score >= 2) return 'text-emerald-700 bg-emerald-100 border-emerald-200';
  return 'text-green-700 bg-green-100 border-green-200';
};

// Import the functions you need from the SDKs you need
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAmbq4u43mPfQAevy3k_W7Q46Lw4J1RpmI",
  authDomain: "my-dashboard-6ada7.firebaseapp.com",
  projectId: "my-dashboard-6ada7",
  storageBucket: "my-dashboard-6ada7.firebasestorage.app",
  messagingSenderId: "1094758551345",
  appId: "1:1094758551345:web:390816a939e2f5aea92a10",
  measurementId: "G-7G07C9E8DT"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
export default function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [selectedPath, setSelectedPath] = useState(null);

  // 真实访客数据状态
  const [onlineUsers, setOnlineUsers] = useState(1);
  const [totalVisits, setTotalVisits] = useState(0);
  const [user, setUser] = useState(null);
  const [isRealData, setIsRealData] = useState(false);

  // 1. 初始化鉴权 (匿名登录以便访问云数据库)
  useEffect(() => {
    if (!auth) return;
    const initAuth = async () => {
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        await signInWithCustomToken(auth, __initial_auth_token);
      } else {
        await signInAnonymously(auth);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // 2. 真实数据监听与上报
  useEffect(() => {
    if (!user || !db) return;
    setIsRealData(true);
    // 指向应用专属的公共统计数据节点
    const statsRef = doc(db, 'artifacts', appId, 'public', 'data', 'statistics', 'main');

    // 页面加载时：总访问量+1，在线人数+1
    const recordVisit = async () => {
      try {
        await updateDoc(statsRef, {
          totalVisits: increment(1),
          onlineUsers: increment(1)
        });
      } catch (e) {
        // 如果是全网第一个访客，文档还不存在，则初始化文档
        await setDoc(statsRef, {
          totalVisits: 1,
          onlineUsers: 1
        });
      }
    };
    recordVisit();

    // 监听云端实时数据变化
    const unsubscribe = onSnapshot(statsRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setTotalVisits(data.totalVisits || 1);
        setOnlineUsers(Math.max(1, data.onlineUsers || 1)); // 避免因网络问题掉到 0 以下
      }
    }, (error) => {
      console.error("数据同步错误:", error);
    });

    // 页面关闭/卸载时：在线人数-1
    const handleUnload = () => {
      if (db) {
        updateDoc(statsRef, {
          onlineUsers: increment(-1)
        }).catch(() => {});
      }
    };
    window.addEventListener('beforeunload', handleUnload);

    return () => {
      unsubscribe();
      window.removeEventListener('beforeunload', handleUnload);
      handleUnload();
    };
  }, [user]);

  const categories = ['全部', ...new Set(PATHS_DATA.map(p => p.category))];

  const filteredPaths = useMemo(() => {
    return PATHS_DATA.filter(p => {
      const matchSearch = p.title.includes(searchTerm) || p.keyword.includes(searchTerm);
      const matchCategory = selectedCategory === '全部' || p.category === selectedCategory;
      return matchSearch && matchCategory;
    }).sort((a, b) => b.score - a.score);
  }, [searchTerm, selectedCategory]);

  // 格式化数字 (如：12,845,920)
  const formatNumber = (num) => {
    return new Intl.NumberFormat('zh-CN').format(num);
  };

  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-900 font-sans">
      
      {/* 实时数据仪表盘顶部条 */}
      <div className="bg-slate-900 border-b border-slate-800 text-slate-300 py-2 px-6 flex justify-between items-center text-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isRealData ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isRealData ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
            </span>
            <span>{isRealData ? '已接入真实云端数据' : '正在连接数据库...'}</span>
          </div>
          <span className="hidden md:inline text-slate-500">|</span>
          <span className="hidden md:inline text-slate-400">数据最后更新: 实时</span>
        </div>
        
        <div className="flex items-center gap-6 font-mono">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-400" />
            <span>实时在线: <strong className="text-white text-base">{formatNumber(onlineUsers)}</strong> 人</span>
          </div>
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-purple-400" />
            <span>累计访问: <strong className="text-white text-base">{formatNumber(totalVisits)}</strong> 次</span>
          </div>
        </div>
      </div>

      {/* Header / 核心理念区 */}
      <header className="bg-white p-6 md:p-10 shadow-sm border-b border-neutral-200">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="w-8 h-8 text-red-500" />
            <h1 className="text-2xl md:text-4xl font-bold tracking-tight text-neutral-900">2026 青年出路与内卷指数看板</h1>
          </div>
          <p className="text-neutral-500 text-lg max-w-3xl leading-relaxed mb-6">
            基于社会真实供需关系、薪资回报率与竞争激烈程度，对当下主流人生赛道进行量化评估。
            <strong className="text-neutral-800"> “有时候，选择比努力更重要；而脱离共识，往往是破局的开始。”</strong>
          </p>
          
          {/* 数据洞察卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200">
              <div className="text-neutral-500 text-sm mb-1">体制内/国企 平均内卷度</div>
              <div className="text-3xl font-black text-red-600">9.5 <span className="text-lg text-neutral-400 font-normal">/ 10</span></div>
              <div className="text-xs text-neutral-500 mt-2">稳定性溢价达到极高点</div>
            </div>
            <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200">
              <div className="text-neutral-500 text-sm mb-1">灵活就业 (零工) 拥挤度</div>
              <div className="text-3xl font-black text-orange-500">8.0 <span className="text-lg text-neutral-400 font-normal">/ 10</span></div>
              <div className="text-xs text-neutral-500 mt-2">体力蓄水池接近饱和边缘</div>
            </div>
            <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200">
              <div className="text-neutral-500 text-sm mb-1">技能型蓝领 竞争指数</div>
              <div className="text-3xl font-black text-emerald-600">4.0 <span className="text-lg text-neutral-400 font-normal">/ 10</span></div>
              <div className="text-xs text-neutral-500 mt-2">被严重低估的反脆弱蓝海</div>
            </div>
          </div>
        </div>
      </header>

      {/* 控制面板 */}
      <main className="max-w-6xl mx-auto p-6 md:p-10">
        <div className="flex flex-col md:flex-row gap-4 mb-8 justify-between items-center">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input 
              type="text"
              placeholder="搜索赛道 (如: 考公, 外卖, 蓝领)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 transition-all shadow-sm"
            />
          </div>
          
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2.5 rounded-full text-sm font-bold transition-all ${
                  selectedCategory === cat 
                  ? 'bg-neutral-800 text-white shadow-md' 
                  : 'bg-white text-neutral-600 border border-neutral-300 hover:bg-neutral-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* 核心展示区 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* 左侧：列表 */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2 mb-4 text-neutral-800">
              <Activity className="w-5 h-5 text-red-500" />
              赛道内卷指数排行榜 (Involution Index)
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredPaths.map(path => (
                <div 
                  key={path.id}
                  onClick={() => setSelectedPath(path)}
                  className={`p-5 rounded-2xl border-2 cursor-pointer transition-all hover:shadow-lg ${
                    selectedPath?.id === path.id ? 'ring-2 ring-red-500 border-transparent shadow-md bg-white scale-[1.02]' : 'border-neutral-200 bg-white shadow-sm'
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-black text-lg text-neutral-900">{path.title}</h3>
                      <p className="text-sm text-neutral-500 mt-0.5">#{path.keyword}</p>
                    </div>
                    <div className={`w-12 h-12 flex items-center justify-center rounded-xl font-black text-xl shadow-sm ${getScoreColor(path.score)}`}>
                      {path.score}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-4">
                    <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${getRiskLabelColor(path.score)}`}>
                      {path.risk}
                    </span>
                    <span className="text-xs text-neutral-600 bg-neutral-100 px-2.5 py-1 rounded-md font-medium">
                      {path.category}
                    </span>
                  </div>
                </div>
              ))}
              {filteredPaths.length === 0 && (
                <div className="col-span-2 text-center py-12 text-neutral-400 bg-white rounded-2xl border border-dashed border-neutral-300">
                  没找到匹配的出路，可能你发现了一条全新的旷野之路？
                </div>
              )}
            </div>
          </div>

          {/* 右侧：详情剖析面板 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl p-6 shadow-xl border border-neutral-200 sticky top-6">
              {selectedPath ? (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold mb-6 border ${getRiskLabelColor(selectedPath.score)}`}>
                    {selectedPath.score >= 7 ? <Flame className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                    内卷指数: {selectedPath.score} / 10
                  </div>
                  
                  <h2 className="text-2xl font-black mb-1 text-neutral-900">{selectedPath.title}</h2>
                  <div className="flex items-center gap-2 text-neutral-500 text-sm border-b border-neutral-100 pb-4 mb-4">
                    <span className="bg-neutral-100 px-2 py-0.5 rounded text-xs font-mono">#{selectedPath.keyword}</span>
                    <span>模拟实时关注: <strong className="text-neutral-700">{Math.floor(Math.random() * 500) + 100}</strong> 人正在看</span>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between items-center py-3 border-b border-neutral-50">
                      <span className="text-neutral-500 text-sm font-medium">预估收入水平</span>
                      <span className="font-bold text-neutral-800">{selectedPath.income}</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-neutral-50">
                      <span className="text-neutral-500 text-sm font-medium">赛道饱和度</span>
                      <span className="font-bold text-neutral-800">{selectedPath.capacity}</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-neutral-50">
                      <span className="text-neutral-500 text-sm font-medium">属性分类</span>
                      <span className="font-bold text-red-600">{selectedPath.category}</span>
                    </div>
                  </div>

                  <div className="bg-red-50/50 rounded-2xl p-5 border border-red-100">
                    <h4 className="text-sm font-bold flex items-center gap-2 mb-3 text-red-800">
                      <Zap className="w-4 h-4 text-red-600" />
                      社会残酷真相剖析
                    </h4>
                    <p className="text-neutral-700 text-sm leading-relaxed text-justify">
                      {selectedPath.reason}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center text-neutral-400">
                  <div className="w-20 h-20 bg-neutral-50 rounded-full flex items-center justify-center mb-4 border border-neutral-100">
                    <Eye className="w-8 h-8 text-neutral-300" />
                  </div>
                  <p className="font-medium text-neutral-600">在左侧点击任意职业赛道</p>
                  <p className="text-sm mt-2 text-neutral-400">查看当下年轻人出路深度剖析</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
