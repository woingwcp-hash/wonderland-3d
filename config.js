/********************************************************************
         * [FILE: js/config.js]
         * 1. GAME STATE, PEDAGOGICAL CONFIG & TOY REWARDS
         ********************************************************************/
        const NUMBER_WORDS_HK = {
            1: '一', 2: '二', 3: '三', 4: '四', 5: '五',
            6: '六', 7: '七', 8: '八', 9: '九', 10: '十'
        };

        // Vibrant, child-friendly high-contrast block colors
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

        // Toy Cabinet Rewards (Linked with Numbers 1 - 10)
        const TOY_CATALOG = [
            { num: 1, icon: '🦖', name: '1號小恐龍', desc: '代表數字 1 嘅可愛小恐龍！' },
            { num: 2, icon: '🚗', name: '2號小跑車', desc: '代表數字 2 嘅極速小跑車！' },
            { num: 3, icon: '🍦', name: '3號甜筒雪糕', desc: '代表數字 3 嘅美味甜筒！' },
            { num: 4, icon: '🚀', name: '4號太空船', desc: '代表數字 4 嘅宇宙太空船！' },
            { num: 5, icon: '⭐', name: '5號超人星星', desc: '代表數字 5 嘅閃亮超人星！' },
            { num: 6, icon: '🦆', name: '6號小黃鴨', desc: '代表數字 6 嘅開心小黃鴨！' },
            { num: 7, icon: '🌈', name: '7號彩虹小馬', desc: '代表數字 7 嘅七彩小馬！' },
            { num: 8, icon: '🐙', name: '8號八爪魚', desc: '代表數字 8 嘅可愛八爪魚！' },
            { num: 9, icon: '🎈', name: '9號熱氣球', desc: '代表數字 9 嘅天空熱氣球！' },
            { num: 10, icon: '👑', name: '10號皇冠小熊', desc: '代表數字 10 嘅滿分小熊！' }
        ];

        const gameState = {
            mode: 'gacha', // 'gacha' | 'train' | 'explore' | 'mario'
            targetNumber: 1,
            currentOptions: [],
            stars: 0,
            unlockedToys: [1], // Starts with #1 unlocked to show how the cabinet works
            isBusy: false,     // Prevents double taps during counting animation
            explorePage: '1-5', // Used in Mode 3 to switch between 1-5 and 6-10 easily
            sfxEnabled: true,   // Pure Web Audio musical effects (TTS voice completely removed)
            marioStage: 1,      // Stage counter for Mario mode (1-1, 1-2...)
            marioSelectedIdx: 0,// Which brick index the hero is currently standing under
            settings: {
                range: '1-5',         // '1-5' | '6-10' | '1-10'
                choices: 3,           // 1 | 2 | 3
                lowDistraction: false,// false = rich 3D world, true = clean studio background
                autoPrompt: true,     // 6-second automatic visual prompt
                countObjects: true    // Spawn 1..N 3D objects after correct tap
            }
        };

        let autoPromptTimer = null;
        let activeCountingTimeouts = [];
