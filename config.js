/********************************************************************
         * [FILE: config.js]
         * 1. COGNITIVE CURRICULUM (數字・顏色・形狀), GAME STATE & TOY REWARDS
         ********************************************************************/
        const NUMBER_WORDS_HK = {
            1: '一', 2: '二', 3: '三', 4: '四', 5: '五',
            6: '六', 7: '七', 8: '八', 9: '九', 10: '十'
        };

        // Vibrant, child-friendly high-contrast block colors for numbers 1-10
        const BLOCK_COLORS = {
            1: '#FF595E', // Coral Red
            2: '#FF924C', // Bright Orange
            3: '#FFCA3A', // Sunny Yellow
            4: '#8AC926', // Apple Green
            5: '#2EC4B6', // Teal Mint
            6: '#1982C4', // Sky Blue
            7: '#6A4C93', // Royal Purple
            8: '#F15BB5', // Candy Pink
            9: '#00BBF9', // Cyan Blue
            10: '#FB5607' // Tangerine
        };

        // NEW: Preschool Color Cognition Curriculum (6 Core Colors)
        const COLOR_CURRICULUM = [
            { id: 'red', name: '紅色', short: '紅', hex: '#EF4444', itemEmoji: '🍎', itemName: '紅蘋果' },
            { id: 'yellow', name: '黃色', short: '黃', hex: '#FACC15', itemEmoji: '⭐', itemName: '黃色星星' },
            { id: 'blue', name: '藍色', short: '藍', hex: '#3B82F6', itemEmoji: '🐳', itemName: '藍色小鯨魚' },
            { id: 'green', name: '綠色', short: '綠', hex: '#22C55E', itemEmoji: '🐸', itemName: '綠色小青蛙' },
            { id: 'orange', name: '橙色', short: '橙', hex: '#F97316', itemEmoji: '🍊', itemName: '橙色柑桔' },
            { id: 'purple', name: '紫色', short: '紫', hex: '#A855F7', itemEmoji: '🍇', itemName: '紫色提子' }
        ];

        // NEW: Preschool Shape Cognition Curriculum (6 Core Geometric Shapes)
        const SHAPE_CURRICULUM = [
            { id: 'circle', name: '圓形', symbol: '●', hex: '#FF595E', emoji: '🔴' },
            { id: 'square', name: '正方形', symbol: '■', hex: '#1982C4', emoji: '🟦' },
            { id: 'triangle', name: '三角形', symbol: '▲', hex: '#FFCA3A', emoji: '🔺' },
            { id: 'star', name: '星形', symbol: '★', hex: '#F15BB5', emoji: '⭐' },
            { id: 'heart', name: '心形', symbol: '♥', hex: '#FB5607', emoji: '❤️' },
            { id: 'rectangle', name: '長方形', symbol: '▬', hex: '#8AC926', emoji: '🟩' }
        ];

        // Helper to fetch full metadata for any curriculum item across Numbers, Colors, or Shapes
        function getCognitiveItemMeta(key, subject = gameState.subject) {
            if (subject === 'color') {
                const c = COLOR_CURRICULUM.find(item => item.id === key) || COLOR_CURRICULUM[0];
                return {
                    key: c.id,
                    subject: 'color',
                    title: c.name,
                    shortLabel: c.short,
                    badgeSymbol: '🎨',
                    subBadge: c.name,
                    hex: c.hex,
                    itemEmoji: c.itemEmoji,
                    itemName: c.itemName,
                    spawnCount: 3 // Spawn 3 matching colored 3D objects
                };
            }
            if (subject === 'shape') {
                const s = SHAPE_CURRICULUM.find(item => item.id === key) || SHAPE_CURRICULUM[0];
                return {
                    key: s.id,
                    subject: 'shape',
                    title: s.name,
                    shortLabel: s.symbol,
                    badgeSymbol: s.symbol,
                    subBadge: s.name,
                    hex: s.hex,
                    itemEmoji: s.emoji,
                    itemName: `${s.name}積木`,
                    spawnCount: 3 // Spawn 3 matching 3D shapes
                };
            }
            // Default: 'number'
            const n = Number(key) || 1;
            return {
                key: n,
                subject: 'number',
                title: `數字 ${n}（${NUMBER_WORDS_HK[n]}）`,
                shortLabel: String(n),
                badgeSymbol: String(n),
                subBadge: '●'.repeat(Math.min(n, 5)) + (n > 5 ? ' ' + '●'.repeat(n - 5) : ''),
                hex: BLOCK_COLORS[n] || '#FF924C',
                itemEmoji: '🍎',
                itemName: '紅蘋果',
                spawnCount: n
            };
        }

        // Toy Cabinet Rewards (Linked with Milestones)
        const TOY_CATALOG = [
            { num: 1, icon: '🦖', name: '1號小恐龍', desc: '代表數字 1 嘅可愛小恐龍！' },
            { num: 2, icon: '🚗', name: '2號紅跑車', desc: '鮮豔紅色嘅極速小跑車！' },
            { num: 3, icon: '🍦', name: '3號三角甜筒', desc: '三角形脆皮甜筒雪糕！' },
            { num: 4, icon: '🚀', name: '4號太空船', desc: '飛向宇宙嘅太空船！' },
            { num: 5, icon: '⭐', name: '5號閃亮星星', desc: '五角星形嘅超人星！' },
            { num: 6, icon: '🦆', name: '6號黃色小鴨', desc: '黃色嘅開心小鴨仔！' },
            { num: 7, icon: '🌈', name: '7號彩虹小馬', desc: '擁有七彩顏色嘅小馬！' },
            { num: 8, icon: '🐙', name: '8號紫色八爪魚', desc: '可愛嘅紫色八爪魚！' },
            { num: 9, icon: '🎈', name: '9號圓形熱氣球', desc: '圓碌碌嘅天空熱氣球！' },
            { num: 10, icon: '👑', name: '10號皇冠小熊', desc: '認知滿分皇冠小熊！' }
        ];

        const gameState = {
            subject: 'number',  // NEW: 'number' | 'color' | 'shape'
            mode: 'gacha',      // 'gacha' | 'train' | 'explore' | 'mario'
            targetKey: 1,       // Can be number (1..10), color id ('red'), or shape id ('circle')
            targetNumber: 1,    // Kept for legacy compatibility
            currentOptions: [],
            stars: 0,
            unlockedToys: [1],
            isBusy: false,
            explorePage: '1-5',
            sfxEnabled: true,
            inLobby: true,
            marioStage: 1,
            marioSelectedIdx: 0,
            settings: {
                range: '1-5',          // '1-5' | '6-10' | '1-10' (for numbers)
                choices: 3,            // 1 | 2 | 3
                lowDistraction: false, // false = rich 3D world, true = clean studio background
                autoPrompt: true,      // 6-second automatic visual prompt
                countObjects: true     // Spawn 3D reinforcement objects after correct tap
            }
        };

        let autoPromptTimer = null;
        let activeCountingTimeouts = [];
