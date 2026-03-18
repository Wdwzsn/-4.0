import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import API from '../services/apiService';

type GameType = '2048' | 'TicTacToe' | 'Snake' | 'PianoTiles' | 'Gomoku' | 'ChineseChess' | null;

// ============ 排行榜组件 ============
// ============ 排行榜组件 ============
const Leaderboard: React.FC<{ gameType: string; show: boolean; onClose: () => void; newScore: number | null }> = ({ gameType, show, onClose, newScore }) => {
    const [scores, setScores] = useState<any[]>([]);
    const [userBest, setUserBest] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!show) return;
        setLoading(true);
        const submitAndFetch = async () => {
            if (newScore !== null && newScore > 0) {
                await API.game.submitScore({ game_type: gameType, score: newScore }).catch(console.error);
            }
            const res: any = await API.game.getLeaderboard(gameType).catch(console.error);
            if (res?.success) {
                setScores(res.data);
                setUserBest(res.userBest);
            }
            setLoading(false);
        };
        submitAndFetch();
    }, [show, gameType, newScore]);

    if (!show) return null;

    return (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex items-center justify-center p-6">
            <div className="bg-slate-800 rounded-[30px] p-6 w-full max-w-sm shadow-2xl relative border border-white/10 flex flex-col max-h-[85vh]">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 text-2xl hover:text-white">✕</button>
                <h3 className="text-2xl font-black mb-4 text-center text-white">🏆 排行榜</h3>

                {/* 个人最好成绩展示区 */}
                <div className="bg-gradient-to-r from-emerald-600/20 to-teal-600/20 p-4 rounded-2xl mb-6 border border-emerald-500/30 text-center">
                    <p className="text-emerald-400 text-xs font-black mb-1">您的历史最高分</p>
                    <div className="flex justify-center items-end gap-1">
                        <span className="text-4xl font-black text-white">{userBest?.score || 0}</span>
                        <span className="text-sm text-emerald-500 font-bold mb-1">分</span>
                    </div>
                    {userBest?.date && <p className="text-[10px] text-slate-500 mt-1 font-bold">达成于: {new Date(userBest.date).toLocaleDateString()}</p>}
                </div>

                {newScore !== null && newScore > 0 && <p className="text-indigo-400 text-center font-black mb-4 animate-bounce">本次得分: {newScore} ✨</p>}

                <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-hide">
                    {loading ? (
                        <p className="text-center text-slate-400 mt-10 animate-pulse">正在同步数据...</p>
                    ) : scores.length === 0 ? (
                        <p className="text-center text-slate-400 mt-10">暂无成绩，快来抢占榜一！</p>
                    ) : (
                        scores.map((s, idx) => (
                            <div key={idx} className="flex items-center bg-slate-700/50 p-3 rounded-2xl border border-white/5">
                                <span className={`w-8 text-center font-black text-xl ${idx === 0 ? 'text-yellow-400' : idx === 1 ? 'text-gray-300' : idx === 2 ? 'text-amber-600' : 'text-slate-500'}`}>{idx + 1}</span>
                                <img src={s.avatar} className="w-10 h-10 rounded-full mx-3 border border-slate-600 object-cover" />
                                <span className="flex-1 font-bold text-slate-200 truncate">{s.name}</span>
                                <span className="font-black text-indigo-400">{s.score}分</span>
                            </div>
                        ))
                    )}
                </div>
                <button onClick={onClose} className="mt-6 w-full bg-indigo-600 py-4 rounded-xl font-black text-white text-lg active:scale-95">确定</button>
            </div>
        </div>
    );
};

// ============ 娱乐板块主容器 ============
export const EntertainmentSection: React.FC = () => {
    const [activeGame, setActiveGame] = useState<GameType>(null);

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 pb-32">
            {/* 头部 */}
            <div className="bg-white dark:bg-slate-800 px-6 py-5 border-b border-slate-100 dark:border-slate-700 flex items-center gap-4 sticky top-0 z-10 shadow-sm">
                {activeGame && (
                    <button onClick={() => setActiveGame(null)} className="bg-slate-100 dark:bg-slate-700 p-3 rounded-2xl active:scale-90 transition-transform">
                        <span className="text-2xl">⬅</span>
                    </button>
                )}
                <div>
                    <h2 className="text-3xl font-black text-slate-800 dark:text-white">
                        {activeGame ? gameNames[activeGame] : '娱乐天地 🎮'}
                    </h2>
                    {!activeGame && <p className="text-slate-400 font-bold text-sm mt-1">脑力锻炼 · 快乐养老</p>}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                {!activeGame ? (
                    <div className="p-6 grid grid-cols-2 gap-5">
                        <GameCard title="2048 益智" icon="🔢" color="from-orange-400 to-amber-500" desc="滑动合并，挑战极限" onClick={() => setActiveGame('2048')} />
                        <GameCard title="井字棋" icon="❌" color="from-blue-400 to-indigo-500" desc="智力对弈，老少皆宜" onClick={() => setActiveGame('TicTacToe')} />
                        <GameCard title="古典五子棋" icon="☯️" color="from-slate-700 to-slate-900" desc="五子连珠，博弈智慧" onClick={() => setActiveGame('Gomoku')} />
                        <GameCard title="中国象棋" icon="帥" color="from-red-600 to-red-800" desc="楚河汉界，排兵布阵" onClick={() => setActiveGame('ChineseChess')} />
                        <GameCard title="斗地主" icon="🃏" color="from-emerald-600 to-emerald-800" desc="三人对战，出牌博弈" onClick={() => setActiveGame('Doudizhu')} />
                        <GameCard title="贪吃蛇" icon="🐍" color="from-emerald-400 to-teal-500" desc="越吃越长，步步惊心" onClick={() => setActiveGame('Snake')} />
                        <GameCard title="钢琴块" icon="🎹" color="from-purple-500 to-indigo-600" desc="点击琴块，抢分闯关" onClick={() => setActiveGame('PianoTiles')} />

                        <div className="col-span-2 bg-white dark:bg-slate-800 rounded-[35px] p-6 border border-slate-100 dark:border-slate-700 mt-2">
                            <h4 className="text-lg font-black text-slate-700 dark:text-white mb-3 flex items-center gap-2">💡 健康小提示</h4>
                            <p className="text-slate-500 dark:text-slate-400 font-bold leading-relaxed text-sm">
                                适度游戏能锻炼手眼协调能力和反应速度！建议每次游玩不超过 30 分钟，记得定时起立活动，保护视力健康。
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="p-4 flex flex-col items-center py-8">
                        {activeGame === '2048' && <Game2048 />}
                        {activeGame === 'TicTacToe' && <GameTicTacToe />}
                        {activeGame === 'Gomoku' && <GameGomoku />}
                        {activeGame === 'ChineseChess' && <GameChineseChess />}
                        {activeGame === 'Doudizhu' && <GameDoudizhu />}
                        {activeGame === 'Snake' && <GameSnake />}
                        {activeGame === 'PianoTiles' && <GamePianoTiles />}
                    </div>
                )}
            </div>
        </div>
    );
};

const gameNames: Record<string, string> = {
    '2048': '2048 益智方块',
    'TicTacToe': '井字棋',
    'Gomoku': '古典五子棋',
    'ChineseChess': '中国象棋',
    'Doudizhu': '斗地主',
    'Snake': '经典贪吃蛇',
    'PianoTiles': '钢琴块',
};

const GameCard: React.FC<{ title: string; icon: string; color: string; desc: string; onClick: () => void }> = ({ title, icon, color, desc, onClick }) => (
    <button onClick={onClick} className="bg-white dark:bg-slate-800 rounded-[35px] p-6 border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col items-center text-center active:scale-95 transition-all hover:shadow-xl">
        <div className={`w-20 h-20 bg-gradient-to-br ${color} rounded-[24px] flex items-center justify-center text-4xl mb-4 shadow-lg`}>
            {icon}
        </div>
        <h3 className="text-xl font-black text-slate-800 dark:text-white mb-1">{title}</h3>
        <p className="text-slate-400 font-bold text-xs leading-tight">{desc}</p>
    </button>
);

// =============================================
// 游戏 1: 2048 - 完整四方向移动逻辑
// =============================================
const TILE_COLORS: Record<number, string> = {
    0: 'bg-slate-100 dark:bg-slate-700',
    2: 'bg-amber-100 text-amber-900',
    4: 'bg-amber-200 text-amber-900',
    8: 'bg-orange-300 text-white',
    16: 'bg-orange-400 text-white',
    32: 'bg-orange-500 text-white',
    64: 'bg-red-400 text-white',
    128: 'bg-yellow-400 text-white',
    256: 'bg-yellow-500 text-white',
    512: 'bg-yellow-600 text-white',
    1024: 'bg-emerald-500 text-white',
    2048: 'bg-emerald-600 text-white',
};

const getTileColor = (val: number) => TILE_COLORS[val] || 'bg-purple-600 text-white';

const initBoard = () => {
    const g: number[][] = Array(4).fill(null).map(() => Array(4).fill(0));
    addTile(g); addTile(g);
    return g;
};

const addTile = (g: number[][]) => {
    const empty: [number, number][] = [];
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) if (g[r][c] === 0) empty.push([r, c]);
    if (!empty.length) return;
    const [r, c] = empty[Math.floor(Math.random() * empty.length)];
    g[r][c] = Math.random() < 0.9 ? 2 : 4;
};

const slideRow = (row: number[]): [number[], number] => {
    let filtered = row.filter(v => v !== 0);
    let score = 0;
    for (let i = 0; i < filtered.length - 1; i++) {
        if (filtered[i] === filtered[i + 1]) {
            filtered[i] *= 2;
            score += filtered[i];
            filtered.splice(i + 1, 1);
        }
    }
    while (filtered.length < 4) filtered.push(0);
    return [filtered, score];
};

const moveBoard = (grid: number[][], dir: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'): [number[][], number, boolean] => {
    let newGrid = grid.map(r => [...r]);
    let totalScore = 0;
    let moved = false;

    const rotateRight = (g: number[][]): number[][] =>
        g[0].map((_, i) => g.map(row => row[i]).reverse());
    const rotateLeft = (g: number[][]): number[][] =>
        g[0].map((_, i) => g.map(row => row[row.length - 1 - i]));

    if (dir === 'UP') newGrid = rotateRight(newGrid);
    if (dir === 'DOWN') newGrid = rotateLeft(newGrid);
    if (dir === 'RIGHT') newGrid = newGrid.map(r => [...r].reverse());

    for (let r = 0; r < 4; r++) {
        const [newRow, s] = slideRow(newGrid[r]);
        if (JSON.stringify(newRow) !== JSON.stringify(newGrid[r])) moved = true;
        newGrid[r] = newRow;
        totalScore += s;
    }

    if (dir === 'UP') newGrid = rotateLeft(newGrid);
    if (dir === 'DOWN') newGrid = rotateRight(newGrid);
    if (dir === 'RIGHT') newGrid = newGrid.map(r => [...r].reverse());

    return [newGrid, totalScore, moved];
};

const Game2048: React.FC = () => {
    const [grid, setGrid] = useState<number[][]>(initBoard);
    const [score, setScore] = useState(0);
    const [best, setBest] = useState(0);
    const [won, setWon] = useState(false);
    const [over, setOver] = useState(false);

    const checkOver = (g: number[][]): boolean => {
        for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
            if (g[r][c] === 0) return false;
            if (r < 3 && g[r][c] === g[r + 1][c]) return false;
            if (c < 3 && g[r][c] === g[r][c + 1]) return false;
        }
        return true;
    };

    const handleMove = useCallback((dir: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT') => {
        if (over) return;
        setGrid(prev => {
            const [newGrid, s, moved] = moveBoard(prev, dir);
            if (!moved) return prev;
            addTile(newGrid);
            setScore(sc => {
                const next = sc + s;
                setBest(b => Math.max(b, next));
                return next;
            });
            if (newGrid.some(r => r.includes(2048))) setWon(true);
            if (checkOver(newGrid)) setOver(true);
            return newGrid;
        });
    }, [over]);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            const map: Record<string, any> = { ArrowUp: 'UP', ArrowDown: 'DOWN', ArrowLeft: 'LEFT', ArrowRight: 'RIGHT' };
            if (map[e.key]) { e.preventDefault(); handleMove(map[e.key]); }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [handleMove]);

    const reset = () => { setGrid(initBoard()); setScore(0); setWon(false); setOver(false); };

    return (
        <div className="flex flex-col items-center w-full max-w-sm select-none">
            <div className="flex justify-between w-full mb-4 gap-3">
                <div className="flex-1 bg-slate-800 text-white px-4 py-3 rounded-2xl text-center">
                    <p className="text-xs text-slate-400 font-bold">分数</p>
                    <p className="text-2xl font-black">{score}</p>
                </div>
                <div className="flex-1 bg-amber-500 text-white px-4 py-3 rounded-2xl text-center">
                    <p className="text-xs text-amber-100 font-bold">最高</p>
                    <p className="text-2xl font-black">{best}</p>
                </div>
                <button onClick={reset} className="bg-emerald-500 text-white px-4 py-3 rounded-2xl font-black text-sm flex-1">新游戏</button>
            </div>

            {(won || over) && (
                <div className={`w-full text-center p-4 rounded-2xl mb-4 font-black text-xl ${won ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-600'}`}>
                    {won ? '🎉 你赢了！达到 2048！' : '😔 游戏结束！'}
                    <button onClick={reset} className="ml-3 underline text-base">再来</button>
                </div>
            )}

            <div className="bg-slate-300 dark:bg-slate-600 p-3 rounded-3xl shadow-inner grid grid-cols-4 gap-2 w-full aspect-square">
                {grid.flat().map((val, i) => (
                    <div key={i} className={`flex items-center justify-center rounded-xl font-black transition-all ${getTileColor(val)} ${val >= 1000 ? 'text-sm' : val >= 100 ? 'text-lg' : 'text-2xl'}`}>
                        {val !== 0 && val}
                    </div>
                ))}
            </div>

            <div className="mt-6 grid grid-cols-3 gap-3 w-48">
                <div />
                <button onClick={() => handleMove('UP')} className="w-14 h-14 bg-white dark:bg-slate-700 dark:text-white rounded-2xl text-2xl active:scale-90 shadow-md border border-slate-200 dark:border-slate-600">⬆</button>
                <div />
                <button onClick={() => handleMove('LEFT')} className="w-14 h-14 bg-white dark:bg-slate-700 dark:text-white rounded-2xl text-2xl active:scale-90 shadow-md border border-slate-200 dark:border-slate-600">⬅</button>
                <button onClick={() => handleMove('DOWN')} className="w-14 h-14 bg-white dark:bg-slate-700 dark:text-white rounded-2xl text-2xl active:scale-90 shadow-md border border-slate-200 dark:border-slate-600">⬇</button>
                <button onClick={() => handleMove('RIGHT')} className="w-14 h-14 bg-white dark:bg-slate-700 dark:text-white rounded-2xl text-2xl active:scale-90 shadow-md border border-slate-200 dark:border-slate-600">➡</button>
            </div>
            <p className="mt-4 text-slate-400 text-sm font-bold">也可使用键盘方向键控制</p>
        </div>
    );
};

// =============================================
// 游戏 2: 井字棋 - 含简单AI
// =============================================
const checkWinner = (b: (string | null)[]): string | null => {
    const lines = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
    for (const [a, bI, c] of lines) {
        if (b[a] && b[a] === b[bI] && b[a] === b[c]) return b[a];
    }
    return null;
};

const aiMove = (board: (string | null)[]): number => {
    // 优先获胜
    for (let i = 0; i < 9; i++) {
        if (!board[i]) {
            const test = [...board]; test[i] = '⭕';
            if (checkWinner(test)) return i;
        }
    }
    // 阻止玩家获胜
    for (let i = 0; i < 9; i++) {
        if (!board[i]) {
            const test = [...board]; test[i] = '❌';
            if (checkWinner(test)) return i;
        }
    }
    // 抢中心
    if (!board[4]) return 4;
    // 随机角
    const corners = [0, 2, 6, 8].filter(i => !board[i]);
    if (corners.length) return corners[Math.floor(Math.random() * corners.length)];
    // 随机边
    const empty = [0, 1, 2, 3, 4, 5, 6, 7, 8].filter(i => !board[i]);
    return empty[Math.floor(Math.random() * empty.length)];
};

const GameTicTacToe: React.FC = () => {
    const [board, setBoard] = useState<(string | null)[]>(Array(9).fill(null));
    const [xIsNext, setXIsNext] = useState(true);
    const [status, setStatus] = useState({ text: '你先走！(❌)', type: 'normal' });
    const [isAIThinking, setIsAIThinking] = useState(false);

    const winner = checkWinner(board);
    const isDraw = !winner && board.every(Boolean);

    const handleClick = (i: number) => {
        if (winner || board[i] || !xIsNext || isAIThinking) return;
        const next = [...board];
        next[i] = '❌';
        setBoard(next);
        setXIsNext(false);

        const w = checkWinner(next);
        if (w) { setStatus({ text: '🎉 你赢了！', type: 'win' }); return; }
        if (next.every(Boolean)) { setStatus({ text: '平局！势均力敌', type: 'draw' }); return; }

        setIsAIThinking(true);
        setStatus({ text: 'AI 思考中...', type: 'normal' });
        setTimeout(() => {
            const idx = aiMove(next);
            const next2 = [...next];
            next2[idx] = '⭕';
            setBoard(next2);
            setXIsNext(true);
            setIsAIThinking(false);
            const w2 = checkWinner(next2);
            if (w2) { setStatus({ text: '😢 AI 赢了！再来一局？', type: 'lose' }); }
            else if (next2.every(Boolean)) { setStatus({ text: '平局！势均力敌', type: 'draw' }); }
            else { setStatus({ text: '轮到你出手！(❌)', type: 'normal' }); }
        }, 500);
    };

    const reset = () => {
        setBoard(Array(9).fill(null));
        setXIsNext(true);
        setStatus({ text: '你先走！(❌)', type: 'normal' });
        setIsAIThinking(false);
    };

    return (
        <div className="flex flex-col items-center w-full max-w-xs">
            <div className={`mb-6 px-8 py-4 rounded-2xl font-black text-xl shadow-sm border text-center w-full ${status.type === 'win' ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700' :
                status.type === 'lose' ? 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700' :
                    status.type === 'draw' ? 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700' :
                        'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-100 dark:border-slate-700'
                }`}>
                {status.text}
            </div>

            <div className="grid grid-cols-3 gap-3 bg-slate-200 dark:bg-slate-600 p-3 rounded-3xl shadow-inner">
                {board.map((val, i) => (
                    <button
                        key={i}
                        onClick={() => handleClick(i)}
                        disabled={!!winner || !!val || !xIsNext || isAIThinking || isDraw}
                        className={`w-24 h-24 bg-white dark:bg-slate-700 rounded-2xl text-5xl flex items-center justify-center shadow-md transition-all border-b-4 border-slate-200 dark:border-slate-600 ${!val && xIsNext && !winner && !isDraw ? 'hover:bg-emerald-50 dark:hover:bg-emerald-900/30 active:scale-90' : ''}`}
                    >
                        {val}
                    </button>
                ))}
            </div>

            <button onClick={reset} className="mt-8 w-full bg-slate-800 dark:bg-slate-600 text-white py-4 rounded-2xl font-black text-lg shadow-lg active:scale-95">
                重新开局
            </button>
            <p className="mt-3 text-slate-400 text-sm font-bold">❌ = 你, ⭕ = AI 电脑</p>
        </div>
    );
};

// =============================================
// 游戏 3: 贪吃蛇 - 完整游戏循环
// =============================================
const GRID = 18;
type Pos = { x: number; y: number };

const randFood = (snake: Pos[]): Pos => {
    while (true) {
        const p = { x: Math.floor(Math.random() * GRID), y: Math.floor(Math.random() * GRID) };
        if (!snake.some(s => s.x === p.x && s.y === p.y)) return p;
    }
};

const GameSnake: React.FC = () => {
    const initState = () => ({
        snake: [{ x: 9, y: 9 }, { x: 8, y: 9 }, { x: 7, y: 9 }],
        food: { x: 4, y: 4 },
        goldenFood: null as Pos | null,
        goldenTimer: 0,
        dir: { x: 1, y: 0 },
        nextDir: { x: 1, y: 0 },
        gameOver: false,
        score: 0,
        started: false,
        level: 1,
    });

    const [state, setState] = useState(initState);
    const stateRef = useRef(state);
    stateRef.current = state;
    const timerRef = useRef<any>(null);
    const [showBoard, setShowBoard] = useState(false);
    const [lastScore, setLastScore] = useState<number | null>(null);

    const getSpeed = (score: number) => {
        // 150ms start, min 70ms
        return Math.max(70, 150 - Math.floor(score / 5) * 10);
    };

    const tick = useCallback(() => {
        const { snake, food, goldenFood, goldenTimer, nextDir, gameOver, score } = stateRef.current;
        if (gameOver) return;

        const head = { x: snake[0].x + nextDir.x, y: snake[0].y + nextDir.y };
        if (head.x < 0 || head.x >= GRID || head.y < 0 || head.y >= GRID ||
            snake.some(s => s.x === head.x && s.y === head.y)) {
            setState(s => { setLastScore(s.score); return { ...s, gameOver: true }; });
            return;
        }

        const ateNormal = head.x === food.x && head.y === food.y;
        const ateGolden = goldenFood && head.x === goldenFood.x && head.y === goldenFood.y;
        const newSnake = [head, ...snake];
        if (!ateNormal && !ateGolden) newSnake.pop();
        if (ateGolden && !ateNormal) newSnake.pop(); // golden gives +3 score but doesn't extend snake more

        const newScore = score + (ateNormal ? 10 : 0) + (ateGolden ? 30 : 0);
        const newGoldenTimer = ateGolden ? 0 : Math.max(0, goldenTimer - 1);

        // Randomly spawn golden food every ~20 ticks
        let newGoldenFood = ateGolden ? null : goldenFood;
        if (!newGoldenFood && Math.random() < 0.03) {
            newGoldenFood = randFood([...newSnake, food]);
            // auto-expire: handled via timer countdown
        }
        if (newGoldenTimer === 0 && !ateGolden) newGoldenFood = null;

        // Reroll golden timer on spawn
        const finalGoldenTimer = newGoldenFood && !goldenFood ? 150 : newGoldenTimer;

        setState(s => ({
            ...s,
            snake: newSnake,
            food: ateNormal ? randFood(newSnake) : food,
            goldenFood: finalGoldenTimer > 0 ? newGoldenFood : null,
            goldenTimer: finalGoldenTimer,
            score: newScore,
            level: Math.floor(newScore / 50) + 1,
            dir: nextDir,
        }));
    }, []);

    const start = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        const s = { ...initState(), started: true };
        setState(s);
        timerRef.current = setInterval(tick, getSpeed(0));
    };

    // Adjust speed when score changes
    useEffect(() => {
        if (state.started && !state.gameOver) {
            if (timerRef.current) clearInterval(timerRef.current);
            timerRef.current = setInterval(tick, getSpeed(state.score));
        }
    }, [Math.floor(state.score / 5)]);

    useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);
    useEffect(() => {
        if (state.gameOver && timerRef.current) clearInterval(timerRef.current);
    }, [state.gameOver]);

    const setDir = (d: Pos) => {
        setState(s => {
            if (s.dir.x === -d.x && s.dir.y === -d.y) return s;
            return { ...s, nextDir: d, started: true };
        });
    };

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            const map: Record<string, Pos> = {
                ArrowUp: { x: 0, y: -1 }, ArrowDown: { x: 0, y: 1 },
                ArrowLeft: { x: -1, y: 0 }, ArrowRight: { x: 1, y: 0 },
                w: { x: 0, y: -1 }, s: { x: 0, y: 1 }, a: { x: -1, y: 0 }, d: { x: 1, y: 0 },
            };
            if (map[e.key]) { e.preventDefault(); setDir(map[e.key]); }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    const cellSize = Math.floor(288 / GRID);

    return (
        <div className="flex flex-col items-center w-full max-w-xs select-none">
            {/* 头部信息 */}
            <div className="flex justify-between w-full mb-3 gap-2">
                <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white px-4 py-2.5 rounded-2xl font-black text-lg flex-1 text-center shadow-lg shadow-emerald-500/20">
                    <span className="text-xs font-bold opacity-70 block">得分</span>
                    {state.score}
                </div>
                <div className="bg-gradient-to-br from-purple-600 to-indigo-700 text-white px-4 py-2.5 rounded-2xl font-black text-lg text-center shadow-lg shadow-purple-500/20">
                    <span className="text-xs font-bold opacity-70 block">Lv</span>
                    {state.level}
                </div>
                <button onClick={start} className="bg-slate-800 dark:bg-slate-600 text-white px-4 py-2.5 rounded-2xl font-black text-sm active:scale-95">
                    {state.started ? '重开' : '开始'}
                </button>
            </div>

            {/* 状态提示 */}
            {state.gameOver && (
                <div className="w-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-300 text-center py-3 rounded-2xl font-black mb-3 text-lg">
                    😢 得分: {state.score}
                    <div className="mt-1.5 flex justify-center gap-4 text-sm">
                        <button onClick={start} className="underline">再来</button>
                        <button onClick={() => setShowBoard(true)} className="underline font-bold text-emerald-600 dark:text-emerald-400">排行榜</button>
                    </div>
                </div>
            )}
            {!state.started && !state.gameOver && (
                <div className="w-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 text-center py-2.5 rounded-2xl font-black mb-3 text-sm flex justify-between px-5">
                    <span>⬆⬇⬅➡ 方向键/WASD控制</span>
                    <button onClick={() => { setLastScore(null); setShowBoard(true); }} className="underline ml-2">排行榜</button>
                </div>
            )}

            {/* 棋盘 */}
            <div
                className="relative rounded-2xl overflow-hidden border-4 border-slate-700 shadow-2xl"
                style={{ width: GRID * cellSize, height: GRID * cellSize, background: '#0f1729' }}
            >
                {/* 背景格子 */}
                {Array.from({ length: GRID }, (_, y) =>
                    Array.from({ length: GRID }, (_, x) => (
                        <div key={`${x}-${y}`} className="absolute"
                            style={{ left: x * cellSize, top: y * cellSize, width: cellSize, height: cellSize,
                                background: (x + y) % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent' }} />
                    ))
                )}

                {/* 蛇身 */}
                {state.snake.map((s, i) => {
                    const ratio = i / state.snake.length;
                    const r = Math.round(34 + (14 - 34) * ratio);
                    const g = Math.round(197 + (165 - 197) * ratio);
                    const b = Math.round(94 + (233 - 94) * ratio);
                    return (
                        <div
                            key={i}
                            className={`absolute ${i === 0 ? 'z-20' : 'z-10'} transition-none`}
                            style={{
                                left: s.x * cellSize + 1,
                                top: s.y * cellSize + 1,
                                width: cellSize - 2,
                                height: cellSize - 2,
                                borderRadius: i === 0 ? '45%' : '30%',
                                background: `rgb(${r},${g},${b})`,
                                boxShadow: i === 0 ? '0 0 8px rgba(52,211,153,0.6)' : undefined,
                            }}
                        />
                    );
                })}

                {/* 普通食物 🍎 */}
                <div
                    className="absolute flex items-center justify-center z-20 animate-bounce"
                    style={{ left: state.food.x * cellSize, top: state.food.y * cellSize, width: cellSize, height: cellSize, fontSize: cellSize * 0.8 }}
                >🍎</div>

                {/* 金色食物 ⭐ */}
                {state.goldenFood && (
                    <div
                        className="absolute flex items-center justify-center z-30 animate-pulse"
                        style={{ left: state.goldenFood.x * cellSize, top: state.goldenFood.y * cellSize, width: cellSize, height: cellSize, fontSize: cellSize * 0.85, filter: 'drop-shadow(0 0 6px gold)' }}
                    >⭐</div>
                )}
            </div>

            {/* 方向键 */}
            <div className="mt-4 grid grid-cols-3 gap-2 w-44">
                <div /><button onClick={() => setDir({ x: 0, y: -1 })} className="w-13 h-13 bg-slate-800 text-white rounded-xl text-xl active:scale-90 shadow-md flex items-center justify-center p-3">⬆</button><div />
                <button onClick={() => setDir({ x: -1, y: 0 })} className="w-13 h-13 bg-slate-800 text-white rounded-xl text-xl active:scale-90 shadow-md flex items-center justify-center p-3">⬅</button>
                <button onClick={() => setDir({ x: 0, y: 1 })} className="w-13 h-13 bg-slate-800 text-white rounded-xl text-xl active:scale-90 shadow-md flex items-center justify-center p-3">⬇</button>
                <button onClick={() => setDir({ x: 1, y: 0 })} className="w-13 h-13 bg-slate-800 text-white rounded-xl text-xl active:scale-90 shadow-md flex items-center justify-center p-3">➡</button>
            </div>
            <p className="mt-2 text-slate-400 text-xs font-bold text-center">🍎 +10分  ⭐ +30分（限时出现）<br/>分数越高速度越快</p>
            <Leaderboard gameType="snake" show={showBoard} onClose={() => setShowBoard(false)} newScore={state.gameOver ? lastScore : null} />
        </div>
    );
};


// =============================================
// 游戏 4: 钢琴块 - 完全重写，基于 setInterval
// =============================================
interface PTile {
    id: number;
    col: number;   // 0-3
    topPct: number; // 0~100 百分比 top
    hit: boolean;
}

interface PState {
    tiles: PTile[];
    score: number;
    lives: number;
    gameOver: boolean;
    running: boolean;
    nextId: number;
    lastSpawn: number; // 上次生成砖块的时间戳
}

const PIANO_COLS = 4;
const TILE_H_PCT = 18; // 每块高度占容器百分比
const MOVE_PER_TICK = 1.8; // 每帧移动的百分比
const SPAWN_INTERVAL = 900; // ms

const createInitialPState = (): PState => ({
    tiles: [],
    score: 0,
    lives: 3,
    gameOver: false,
    running: false,
    nextId: 0,
    lastSpawn: 0,
});

const GamePianoTiles: React.FC = () => {
    const gsRef = useRef<PState>(createInitialPState());
    const timerRef = useRef<any>(null);
    const [renderKey, setRenderKey] = useState(0); // 强制重渲染
    const [showBoard, setShowBoard] = useState(false);
    const [lastScore, setLastScore] = useState<number | null>(null);

    const forceRender = () => setRenderKey(k => k + 1);

    const stopGame = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    };

    const tick = () => {
        const gs = gsRef.current;
        if (!gs.running || gs.gameOver) return;

        const now = Date.now();

        // 移动所有砖块
        let livesLost = 0;
        const newTiles: PTile[] = [];
        for (const t of gs.tiles) {
            if (t.hit) continue; // 已点击的移除
            const newTop = t.topPct + MOVE_PER_TICK;
            if (newTop > 100 + TILE_H_PCT) continue; // 超出底部完全消失

            if (newTop > 100 && !t.hit) {
                // 漏掉了
                livesLost++;
                continue;
            }
            newTiles.push({ ...t, topPct: newTop });
        }

        let newLives = gs.lives - livesLost;
        let newGameOver = newLives <= 0;

        // 生成新砖块
        if (now - gs.lastSpawn > SPAWN_INTERVAL) {
            const col = Math.floor(Math.random() * PIANO_COLS);
            newTiles.push({ id: gs.nextId, col, topPct: -TILE_H_PCT, hit: false });
            gs.nextId++;
            gs.lastSpawn = now;
        }

        gsRef.current = {
            ...gs,
            tiles: newTiles,
            lives: Math.max(0, newLives),
            gameOver: newGameOver,
            running: !newGameOver,
        };

        if (newGameOver) {
            setLastScore(gsRef.current.score);
            stopGame();
        }
        forceRender();
    };

    const startGame = () => {
        stopGame();
        gsRef.current = {
            ...createInitialPState(),
            running: true,
            lastSpawn: Date.now() - SPAWN_INTERVAL + 200,
        };
        timerRef.current = setInterval(tick, 50); // 20fps
        forceRender();
    };

    useEffect(() => () => stopGame(), []);

    const hitTile = (id: number) => {
        const gs = gsRef.current;
        if (!gs.running || gs.gameOver) return;
        const t = gs.tiles.find(x => x.id === id);
        if (!t || t.hit) return;

        // 只有砖块在底部 50% 才能点击（否则扣命）
        if (t.topPct < 40) {
            const gameOverNow = gs.lives - 1 <= 0;
            gsRef.current = { ...gs, lives: Math.max(0, gs.lives - 1), gameOver: gameOverNow };
            if (gameOverNow) {
                setLastScore(gsRef.current.score);
                stopGame();
            }
            forceRender();
            return;
        }

        gsRef.current = {
            ...gs,
            score: gs.score + 1,
            tiles: gs.tiles.map(x => x.id === id ? { ...x, hit: true } : x),
        };
        forceRender();
    };

    const gs = gsRef.current;
    const COL_COLORS = [
        'bg-white text-slate-900 active:bg-slate-200',
        'bg-white text-slate-900 active:bg-slate-200',
        'bg-white text-slate-900 active:bg-slate-200',
        'bg-white text-slate-900 active:bg-slate-200',
    ];

    return (
        <div className="flex flex-col items-center w-full max-w-xs select-none" key={renderKey}>
            {/* 头部信息 */}
            <div className="flex justify-between w-full mb-4 gap-3 items-center">
                <div className="bg-indigo-600 text-white px-5 py-3 rounded-2xl font-black text-xl flex-1 text-center">
                    得分: {gs.score}
                </div>
                <div className="flex gap-1 items-center">
                    {[0, 1, 2].map(i => (
                        <span key={i} className="text-xl">{i < gs.lives ? '❤️' : '🖤'}</span>
                    ))}
                </div>
            </div>

            {/* 游戏区域 */}
            <div
                className="relative overflow-hidden rounded-2xl border-4 border-slate-700 shadow-2xl bg-zinc-900"
                style={{ width: 288, height: 500 }}
            >
                {/* 列背景分割线 */}
                {[1, 2, 3].map(i => (
                    <div key={i} className="absolute top-0 bottom-0 w-px bg-white/10" style={{ left: i * 72 }} />
                ))}

                {/* 击打区域指示线 */}
                <div className="absolute w-full h-1 bg-indigo-400/40" style={{ top: '75%' }} />
                <div className="absolute left-0 right-0 text-center" style={{ top: '77%' }}>
                    <span className="text-white/30 text-xs font-bold">← 点击区 →</span>
                </div>

                {/* 砖块 */}
                {gs.tiles.filter(t => !t.hit).map(t => (
                    <button
                        key={t.id}
                        onMouseDown={() => hitTile(t.id)}
                        onTouchStart={(e) => { e.preventDefault(); hitTile(t.id); }}
                        className={`absolute rounded border border-white/10 transition-colors ${COL_COLORS[t.col]} ${t.topPct >= 40 ? 'cursor-pointer' : 'cursor-default opacity-60'}`}
                        style={{
                            left: t.col * 72 + 3,
                            top: `${t.topPct}%`,
                            width: 66,
                            height: `${TILE_H_PCT}%`,
                        }}
                    />
                ))}

                {/* 游戏开始/结束覆盖层 */}
                {(!gs.running || gs.gameOver) && (
                    <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-4">
                        {gs.gameOver ? (
                            <>
                                <span className="text-5xl">😢</span>
                                <p className="text-white text-3xl font-black">游戏结束!</p>
                                <p className="text-indigo-300 text-xl font-bold">最终得分: {gs.score}</p>
                            </>
                        ) : (
                            <>
                                <span className="text-5xl">🎹</span>
                                <p className="text-white text-2xl font-black text-center px-4">点击下落的白色方块得分！</p>
                                <p className="text-white/60 text-sm px-6 text-center">方块进入下方 60% 区域时才能点击，错过会扣❤️</p>
                            </>
                        )}
                        <div className="flex gap-4 mt-2">
                            <button onClick={startGame} className="bg-indigo-500 text-white px-8 py-3 rounded-2xl font-black active:scale-95 shadow-xl">
                                {gs.gameOver ? '再来一次' : '开始游戏'}
                            </button>
                            <button onClick={() => { setLastScore(gs.gameOver ? gs.score : null); setShowBoard(true); }} className="bg-slate-700 text-white px-6 py-3 rounded-2xl font-black active:scale-95 shadow-xl">
                                排行榜
                            </button>
                        </div>
                    </div>
                )}
            </div>
            <p className="mt-4 text-slate-400 dark:text-slate-500 text-sm font-bold text-center">
                方块落到<strong className="text-indigo-400">蓝线以下</strong>时点击，错过扣❤️ · 进入下方才可点击！
            </p>
            <Leaderboard gameType="piano_tiles" show={showBoard} onClose={() => setShowBoard(false)} newScore={gs.gameOver ? lastScore : null} />
        </div>
    );
};

// =============================================
// 游戏 5: 古典五子棋 - 含评分权重AI
// =============================================
const GOMOKU_SIZE = 12;

const checkGomokuWinner = (board: (string | null)[][]): string | null => {
    for (let r = 0; r < GOMOKU_SIZE; r++) {
        for (let c = 0; c < GOMOKU_SIZE; c++) {
            const player = board[r][c];
            if (!player) continue;
            // 检查右、下、右下、左下四个方向
            const dirs = [[0, 1], [1, 0], [1, 1], [1, -1]];
            for (const [dr, dc] of dirs) {
                let count = 1;
                for (let i = 1; i < 5; i++) {
                    const nr = r + dr * i, nc = c + dc * i;
                    if (nr >= 0 && nr < GOMOKU_SIZE && nc >= 0 && nc < GOMOKU_SIZE && board[nr][nc] === player) count++;
                    else break;
                }
                if (count >= 5) return player;
            }
        }
    }
    return null;
};

// 简易权重评分 AI
const gomokuAiMove = (board: (string | null)[][]): { r: number, c: number } => {
    let bestScore = -1;
    let moves: { r: number, c: number }[] = [];

    const evaluate = (r: number, c: number, p: string) => {
        let score = 0;
        const dirs = [[0, 1], [1, 0], [1, 1], [1, -1]];
        for (const [dr, dc] of dirs) {
            let count = 0;
            let block = 0;
            // 正向
            for (let i = 1; i < 5; i++) {
                const nr = r + dr * i, nc = c + dc * i;
                if (nr < 0 || nr >= GOMOKU_SIZE || nc < 0 || nc >= GOMOKU_SIZE) { block++; break; }
                if (board[nr][nc] === p) count++;
                else if (board[nr][nc] === null) break;
                else { block++; break; }
            }
            // 反向
            for (let i = 1; i < 5; i++) {
                const nr = r - dr * i, nc = c - dc * i;
                if (nr < 0 || nr >= GOMOKU_SIZE || nc < 0 || nc >= GOMOKU_SIZE) { block++; break; }
                if (board[nr][nc] === p) count++;
                else if (board[nr][nc] === null) break;
                else { block++; break; }
            }
            if (count >= 4) score += 10000;
            else if (count === 3) score += block === 0 ? 1000 : 100;
            else if (count === 2) score += block === 0 ? 100 : 10;
            else score += 1;
        }
        return score;
    };

    for (let r = 0; r < GOMOKU_SIZE; r++) {
        for (let c = 0; c < GOMOKU_SIZE; c++) {
            if (board[r][c]) continue;
            const attack = evaluate(r, c, '⭕');
            const defend = evaluate(r, c, '❌');
            const score = attack + defend * 1.2;
            if (score > bestScore) {
                bestScore = score;
                moves = [{ r, c }];
            } else if (score === bestScore) {
                moves.push({ r, c });
            }
        }
    }
    return moves[Math.floor(Math.random() * moves.length)];
};

const GameGomoku: React.FC = () => {
    const [board, setBoard] = useState<(string | null)[][]>(Array(GOMOKU_SIZE).fill(null).map(() => Array(GOMOKU_SIZE).fill(null)));
    const [isXNext, setIsXNext] = useState(true);
    const [winner, setWinner] = useState<string | null>(null);
    const [isThinking, setIsThinking] = useState(false);

    const handleMove = (r: number, c: number) => {
        if (board[r][c] || winner || !isXNext || isThinking) return;
        const newBoard = board.map(row => [...row]);
        newBoard[r][c] = '❌';
        setBoard(newBoard);
        
        const w = checkGomokuWinner(newBoard);
        if (w) { setWinner(w); return; }
        
        setIsXNext(false);
        setIsThinking(true);
        
        setTimeout(() => {
            const ai = gomokuAiMove(newBoard);
            const nextBoard = newBoard.map(row => [...row]);
            nextBoard[ai.r][ai.c] = '⭕';
            setBoard(nextBoard);
            const w2 = checkGomokuWinner(nextBoard);
            if (w2) setWinner(w2);
            setIsXNext(true);
            setIsThinking(false);
        }, 600);
    };

    const reset = () => {
        setBoard(Array(GOMOKU_SIZE).fill(null).map(() => Array(GOMOKU_SIZE).fill(null)));
        setIsXNext(true);
        setWinner(null);
        setIsThinking(false);
    };

    return (
        <div className="flex flex-col items-center w-full max-w-sm">
            <div className="mb-6 w-full flex justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                <div>
                    <p className="text-xs text-slate-400 font-black">状态</p>
                    <p className={`text-lg font-black ${winner ? 'text-emerald-500 animate-bounce' : 'text-slate-700 dark:text-white'}`}>
                        {winner ? (winner === '❌' ? '🎉 你赢了！' : '😢 电脑赢了！') : (isThinking ? '🧠 电脑思考中...' : '👤 轮到你了 (黑子)')}
                    </p>
                </div>
                <button onClick={reset} className="bg-slate-100 dark:bg-slate-700 px-4 py-2 rounded-xl font-bold text-sm active:scale-95">重置棋局</button>
            </div>

            <div className="bg-[#DEB887] p-1.5 md:p-3 rounded-xl shadow-2xl relative border-4 border-[#8B4513]">
                <div className="grid grid-cols-12 gap-0">
                    {board.map((row, r) => row.map((val, c) => (
                        <button
                            key={`${r}-${c}`}
                            onClick={() => handleMove(r, c)}
                            className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center relative border border-[#c5a07c]/50"
                        >
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="w-full h-px bg-[#8B4513]/30"></div>
                                <div className="h-full w-px bg-[#8B4513]/30 absolute"></div>
                            </div>
                            {val && (
                                <div className={`w-5 h-5 md:w-7 md:h-7 rounded-full shadow-lg z-10 transition-all duration-300 ${val === '❌' ? 'bg-zinc-900 scale-110' : 'bg-slate-50 border border-slate-200 scale-110'}`} />
                            )}
                        </button>
                    )))}
                </div>
            </div>
            <div className="mt-8 flex gap-8 items-center text-sm font-bold text-slate-400">
                <div className="flex items-center gap-2"><div className="w-4 h-4 bg-zinc-900 rounded-full"></div> 你 (黑子)</div>
                <div className="flex items-center gap-2"><div className="w-4 h-4 bg-slate-50 border border-slate-200 rounded-full"></div> 电脑 (白子)</div>
            </div>
        </div>
    );
};

// =============================================
// 游戏 6: 中国象棋 - 完整规则版
// =============================================
type ChessSide = 'RED' | 'BLACK';
type ChessPieceType = 'ju' | 'ma' | 'xiang' | 'shi' | 'jiang' | 'pao' | 'zu'; // 车马象士将炮卒

interface ChessPiece {
  id: number;
  type: ChessPieceType;
  side: ChessSide;
  r: number; // 0-9行
  c: number; // 0-8列
}

const PIECE_LABEL: Record<string, { RED: string; BLACK: string }> = {
  ju:    { RED: '俥', BLACK: '車' },
  ma:    { RED: '傌', BLACK: '馬' },
  xiang: { RED: '相', BLACK: '象' },
  shi:   { RED: '仕', BLACK: '士' },
  jiang: { RED: '帥', BLACK: '將' },
  pao:   { RED: '炮', BLACK: '砲' },
  zu:    { RED: '兵', BLACK: '卒' },
};

const INIT_CHESS: ChessPiece[] = [
  // 黑方 (行0-4)
  { id: 1, type: 'ju',    side: 'BLACK', r: 0, c: 0 },
  { id: 2, type: 'ma',    side: 'BLACK', r: 0, c: 1 },
  { id: 3, type: 'xiang', side: 'BLACK', r: 0, c: 2 },
  { id: 4, type: 'shi',   side: 'BLACK', r: 0, c: 3 },
  { id: 5, type: 'jiang', side: 'BLACK', r: 0, c: 4 },
  { id: 6, type: 'shi',   side: 'BLACK', r: 0, c: 5 },
  { id: 7, type: 'xiang', side: 'BLACK', r: 0, c: 6 },
  { id: 8, type: 'ma',    side: 'BLACK', r: 0, c: 7 },
  { id: 9, type: 'ju',    side: 'BLACK', r: 0, c: 8 },
  { id: 10, type: 'pao',  side: 'BLACK', r: 2, c: 1 },
  { id: 11, type: 'pao',  side: 'BLACK', r: 2, c: 7 },
  { id: 12, type: 'zu',   side: 'BLACK', r: 3, c: 0 },
  { id: 13, type: 'zu',   side: 'BLACK', r: 3, c: 2 },
  { id: 14, type: 'zu',   side: 'BLACK', r: 3, c: 4 },
  { id: 15, type: 'zu',   side: 'BLACK', r: 3, c: 6 },
  { id: 16, type: 'zu',   side: 'BLACK', r: 3, c: 8 },
  // 红方 (行9-5)
  { id: 17, type: 'ju',    side: 'RED', r: 9, c: 0 },
  { id: 18, type: 'ma',    side: 'RED', r: 9, c: 1 },
  { id: 19, type: 'xiang', side: 'RED', r: 9, c: 2 },
  { id: 20, type: 'shi',   side: 'RED', r: 9, c: 3 },
  { id: 21, type: 'jiang', side: 'RED', r: 9, c: 4 },
  { id: 22, type: 'shi',   side: 'RED', r: 9, c: 5 },
  { id: 23, type: 'xiang', side: 'RED', r: 9, c: 6 },
  { id: 24, type: 'ma',    side: 'RED', r: 9, c: 7 },
  { id: 25, type: 'ju',    side: 'RED', r: 9, c: 8 },
  { id: 26, type: 'pao',   side: 'RED', r: 7, c: 1 },
  { id: 27, type: 'pao',   side: 'RED', r: 7, c: 7 },
  { id: 28, type: 'zu',    side: 'RED', r: 6, c: 0 },
  { id: 29, type: 'zu',    side: 'RED', r: 6, c: 2 },
  { id: 30, type: 'zu',    side: 'RED', r: 6, c: 4 },
  { id: 31, type: 'zu',    side: 'RED', r: 6, c: 6 },
  { id: 32, type: 'zu',    side: 'RED', r: 6, c: 8 },
];

// ---- 走法核心规则引擎 ----
const inBoard = (r: number, c: number) => r >= 0 && r <= 9 && c >= 0 && c <= 8;

const getPieceAt = (pieces: ChessPiece[], r: number, c: number) =>
  pieces.find(p => p.r === r && p.c === c) || null;

// 车 - 直线无阻
const juMoves = (p: ChessPiece, pieces: ChessPiece[]) => {
  const moves: [number, number][] = [];
  for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
    let [nr, nc] = [p.r + dr, p.c + dc];
    while (inBoard(nr, nc)) {
      const hit = getPieceAt(pieces, nr, nc);
      if (hit) { if (hit.side !== p.side) moves.push([nr, nc]); break; }
      moves.push([nr, nc]);
      nr += dr; nc += dc;
    }
  }
  return moves;
};

// 马 - 日字，别脚检测
const maMoves = (p: ChessPiece, pieces: ChessPiece[]) => {
  const moves: [number, number][] = [];
  for (const [dr, dc, lr, lc] of [[-2,-1,-1,0],[-2,1,-1,0],[2,-1,1,0],[2,1,1,0],[-1,-2,0,-1],[-1,2,0,1],[1,-2,0,-1],[1,2,0,1]] as [number,number,number,number][]) {
    if (getPieceAt(pieces, p.r+lr, p.c+lc)) continue; // 别腿
    const [nr, nc] = [p.r+dr, p.c+dc];
    if (!inBoard(nr, nc)) continue;
    const hit = getPieceAt(pieces, nr, nc);
    if (!hit || hit.side !== p.side) moves.push([nr, nc]);
  }
  return moves;
};

// 象/相 - 田字，不过河，别象眼
const xiangMoves = (p: ChessPiece, pieces: ChessPiece[]) => {
  const moves: [number, number][] = [];
  for (const [dr, dc] of [[-2,-2],[-2,2],[2,-2],[2,2]]) {
    if (getPieceAt(pieces, p.r+dr/2, p.c+dc/2)) continue; // 别象眼
    const [nr, nc] = [p.r+dr, p.c+dc];
    if (!inBoard(nr, nc)) continue;
    // 不过河: 红方在 r>=5, 黑在 r<=4
    if (p.side === 'RED' && nr < 5) continue;
    if (p.side === 'BLACK' && nr > 4) continue;
    const hit = getPieceAt(pieces, nr, nc);
    if (!hit || hit.side !== p.side) moves.push([nr, nc]);
  }
  return moves;
};

// 士/仕 - 斜一格，不出九宫
const shiMoves = (p: ChessPiece, pieces: ChessPiece[]) => {
  const moves: [number, number][] = [];
  const palaceRows = p.side === 'RED' ? [7, 8, 9] : [0, 1, 2];
  const palaceCols = [3, 4, 5];
  for (const [dr, dc] of [[-1,-1],[-1,1],[1,-1],[1,1]]) {
    const [nr, nc] = [p.r+dr, p.c+dc];
    if (!palaceRows.includes(nr) || !palaceCols.includes(nc)) continue;
    const hit = getPieceAt(pieces, nr, nc);
    if (!hit || hit.side !== p.side) moves.push([nr, nc]);
  }
  return moves;
};

// 将/帥 - 一格，九宫内，不露对面
const jiangMoves = (p: ChessPiece, pieces: ChessPiece[]) => {
  const moves: [number, number][] = [];
  const palaceRows = p.side === 'RED' ? [7, 8, 9] : [0, 1, 2];
  const palaceCols = [3, 4, 5];
  for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
    const [nr, nc] = [p.r+dr, p.c+dc];
    if (!palaceRows.includes(nr) || !palaceCols.includes(nc)) continue;
    const hit = getPieceAt(pieces, nr, nc);
    if (!hit || hit.side !== p.side) moves.push([nr, nc]);
  }
  // 禁止将帅对面（飞将）
  const oppJiang = pieces.find(q => q.type === 'jiang' && q.side !== p.side);
  return moves.filter(([nr, nc]) => {
    if (!oppJiang || nc !== oppJiang.c) return true;
    // 检查 nr 到 oppJiang.r 之间是否有棋子
    const minR = Math.min(nr, oppJiang.r), maxR = Math.max(nr, oppJiang.r);
    for (let tr = minR + 1; tr < maxR; tr++) {
      if (getPieceAt(pieces, tr, nc)) return true; // 有遮挡，合法
    }
    return false; // 飞将，非法
  });
};

// 炮 - 直线，吃需隔一子
const paoMoves = (p: ChessPiece, pieces: ChessPiece[]) => {
  const moves: [number, number][] = [];
  for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
    let [nr, nc] = [p.r+dr, p.c+dc];
    let screen = false;
    while (inBoard(nr, nc)) {
      const hit = getPieceAt(pieces, nr, nc);
      if (!screen) {
        if (hit) screen = true;
        else moves.push([nr, nc]);
      } else {
        if (hit) { if (hit.side !== p.side) moves.push([nr, nc]); break; }
      }
      nr += dr; nc += dc;
    }
  }
  return moves;
};

// 兵/卒 - 前进，过河后左右
const zuMoves = (p: ChessPiece, pieces: ChessPiece[]) => {
  const moves: [number, number][] = [];
  const forward = p.side === 'RED' ? -1 : 1;
  const crossRiver = p.side === 'RED' ? p.r < 5 : p.r > 4;
  const dirs: [number, number][] = [[forward, 0]];
  if (crossRiver) { dirs.push([0, -1]); dirs.push([0, 1]); }
  for (const [dr, dc] of dirs) {
    const [nr, nc] = [p.r+dr, p.c+dc];
    if (!inBoard(nr, nc)) continue;
    const hit = getPieceAt(pieces, nr, nc);
    if (!hit || hit.side !== p.side) moves.push([nr, nc]);
  }
  return moves;
};

const getLegalMoves = (p: ChessPiece, pieces: ChessPiece[]): [number, number][] => {
  let raw: [number, number][] = [];
  switch (p.type) {
    case 'ju':    raw = juMoves(p, pieces); break;
    case 'ma':    raw = maMoves(p, pieces); break;
    case 'xiang': raw = xiangMoves(p, pieces); break;
    case 'shi':   raw = shiMoves(p, pieces); break;
    case 'jiang': raw = jiangMoves(p, pieces); break;
    case 'pao':   raw = paoMoves(p, pieces); break;
    case 'zu':    raw = zuMoves(p, pieces); break;
  }
  // 过滤走后令己方将帅被将军的走法
  return raw.filter(([nr, nc]) => {
    const next = pieces
      .filter(q => q.id !== p.id && !(q.r === nr && q.c === nc))
      .concat([{ ...p, r: nr, c: nc }]);
    return !isInCheck(p.side, next);
  });
};

// 检测某方将帅是否被将军
const isInCheck = (side: ChessSide, pieces: ChessPiece[]) => {
  const myJiang = pieces.find(p => p.type === 'jiang' && p.side === side);
  if (!myJiang) return true; // 将帅已没，被将
  const opp = side === 'RED' ? 'BLACK' : 'RED';
  return pieces.filter(p => p.side === opp).some(op => {
    let raw: [number, number][] = [];
    switch (op.type) {
      case 'ju': raw = juMoves(op, pieces); break;
      case 'ma': raw = maMoves(op, pieces); break;
      case 'pao': raw = paoMoves(op, pieces); break;
      case 'zu': raw = zuMoves(op, pieces); break;
      case 'xiang': raw = xiangMoves(op, pieces); break;
      case 'shi': raw = shiMoves(op, pieces); break;
      case 'jiang': raw = jiangMoves(op, pieces); break;
    }
    return raw.some(([r, c]) => r === myJiang.r && c === myJiang.c);
  });
};

// 简单AI - 随机从合法走法里选一步
const blackAiMove = (pieces: ChessPiece[]): { piece: ChessPiece; to: [number, number] } | null => {
  const blacks = pieces.filter(p => p.side === 'BLACK');
  const allMoves: { piece: ChessPiece; to: [number, number] }[] = [];
  for (const b of blacks) {
    for (const to of getLegalMoves(b, pieces)) {
      allMoves.push({ piece: b, to });
    }
  }
  if (allMoves.length === 0) return null;
  // 优先吃子
  const eating = allMoves.filter(m => getPieceAt(pieces, m.to[0], m.to[1]));
  const pool = eating.length > 0 ? eating : allMoves;
  return pool[Math.floor(Math.random() * pool.length)];
};

const GameChineseChess: React.FC = () => {
  const [pieces, setPieces] = useState<ChessPiece[]>(() => INIT_CHESS.map(p => ({ ...p })));
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [legalMoves, setLegalMoves] = useState<[number, number][]>([]);
  const [turn, setTurn] = useState<ChessSide>('RED');
  const [status, setStatus] = useState<string>('红方先行，点击选择棋子');
  const [isThinking, setIsThinking] = useState(false);
  const [winner, setWinner] = useState<ChessSide | null>(null);

  const reset = () => {
    setPieces(INIT_CHESS.map(p => ({ ...p })));
    setSelectedId(null);
    setLegalMoves([]);
    setTurn('RED');
    setStatus('红方先行，点击选择棋子');
    setIsThinking(false);
    setWinner(null);
  };

  const applyMove = (prevPieces: ChessPiece[], pid: number, tr: number, tc: number): ChessPiece[] => {
    return prevPieces
      .filter(p => !(p.r === tr && p.c === tc && p.id !== pid))
      .map(p => p.id === pid ? { ...p, r: tr, c: tc } : p);
  };

  const handleCellClick = (r: number, c: number) => {
    if (isThinking || winner) return;
    const pieceAt = pieces.find(p => p.r === r && p.c === c);

    if (selectedId === null) {
      if (pieceAt && pieceAt.side === turn) {
        const moves = getLegalMoves(pieceAt, pieces);
        setSelectedId(pieceAt.id);
        setLegalMoves(moves);
        setStatus(`已选中「${PIECE_LABEL[pieceAt.type][pieceAt.side]}」- 蓝点为合法落点`);
      }
    } else {
      // 点击己方棋子 -> 换选
      if (pieceAt && pieceAt.side === turn) {
        const moves = getLegalMoves(pieceAt, pieces);
        setSelectedId(pieceAt.id);
        setLegalMoves(moves);
        setStatus(`已选中「${PIECE_LABEL[pieceAt.type][pieceAt.side]}」- 蓝点为合法落点`);
        return;
      }
      // 判断是否是合法落点
      const isLegal = legalMoves.some(([lr, lc]) => lr === r && lc === c);
      if (!isLegal) {
        setSelectedId(null);
        setLegalMoves([]);
        setStatus('该位置不可落子，请重新选择');
        return;
      }
      // 执行红方落子
      const newPieces = applyMove(pieces, selectedId, r, c);
      setSelectedId(null);
      setLegalMoves([]);

      // 检查胜负
      const hasBlackJiang = newPieces.some(p => p.type === 'jiang' && p.side === 'BLACK');
      if (!hasBlackJiang) {
        setPieces(newPieces);
        setWinner('RED');
        setStatus('🎉 红方胜！');
        return;
      }

      const blackInCheck = isInCheck('BLACK', newPieces);
      setTurn('BLACK');
      setStatus(blackInCheck ? '⚠️ 黑方被将军！AI 思考中...' : '🤖 AI 思考中...');
      setIsThinking(true);
      setPieces(newPieces);

      // AI落子
      setTimeout(() => {
        const aiMove = blackAiMove(newPieces);
        if (!aiMove) {
          setWinner('RED');
          setStatus('🎉 红方胜（黑方无路可走）！');
          setIsThinking(false);
          return;
        }
        const afterAi = applyMove(newPieces, aiMove.piece.id, aiMove.to[0], aiMove.to[1]);
        const hasRedJiang = afterAi.some(p => p.type === 'jiang' && p.side === 'RED');
        setPieces(afterAi);
        if (!hasRedJiang) {
          setWinner('BLACK');
          setStatus('😢 黑方胜！');
        } else {
          const redInCheck = isInCheck('RED', afterAi);
          setStatus(redInCheck ? '⚠️ 红方被将军！请应将' : '🎮 轮到红方，点击选择棋子');
          setTurn('RED');
        }
        setIsThinking(false);
      }, 800);
    }
  };

  const CELL_SIZE = 38; // px per cell
  const BOARD_COLS = 9;
  const BOARD_ROWS = 10;

  return (
    <div className="flex flex-col items-center w-full max-w-[380px] select-none">
      {/* 状态栏 */}
      <div className="mb-3 w-full flex justify-between items-center bg-white dark:bg-slate-800 px-4 py-3 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
        <div className="flex-1 min-w-0 pr-3">
          <p className={`font-black text-sm leading-snug truncate ${turn === 'RED' && !winner ? 'text-red-600' : winner === 'RED' ? 'text-emerald-600' : 'text-slate-700 dark:text-slate-200'}`}>
            {status}
          </p>
        </div>
        <button onClick={reset} className="shrink-0 bg-slate-100 dark:bg-slate-700 px-3 py-1.5 rounded-xl text-xs font-black active:scale-95">重新摆盘</button>
      </div>

      {/* 棋盘容器（背景木纹色，用 SVG 画线） */}
      <div
        className="relative rounded-xl shadow-2xl border-4 border-[#7a3e0e] overflow-hidden"
        style={{ background: '#f5c78a', width: CELL_SIZE * (BOARD_COLS - 1) + 60, height: CELL_SIZE * (BOARD_ROWS - 1) + 60 }}
      >
        {/* SVG 棋盘线 */}
        <svg
          className="absolute top-0 left-0 pointer-events-none"
          style={{ width: '100%', height: '100%' }}
          viewBox={`0 0 ${CELL_SIZE * (BOARD_COLS-1) + 60} ${CELL_SIZE * (BOARD_ROWS-1) + 60}`}
        >
          {/* 竖线 */}
          {Array.from({ length: BOARD_COLS }, (_, c) => (
            <React.Fragment key={`v${c}`}>
              {/* 上半 */}
              <line x1={30 + c * CELL_SIZE} y1={30} x2={30 + c * CELL_SIZE} y2={30 + 4 * CELL_SIZE} stroke="#7a3e0e" strokeWidth="1.2"/>
              {/* 下半 */}
              <line x1={30 + c * CELL_SIZE} y1={30 + 5 * CELL_SIZE} x2={30 + c * CELL_SIZE} y2={30 + 9 * CELL_SIZE} stroke="#7a3e0e" strokeWidth="1.2"/>
            </React.Fragment>
          ))}
          {/* 横线 */}
          {Array.from({ length: BOARD_ROWS }, (_, r) => (
            <line key={`h${r}`} x1={30} y1={30 + r * CELL_SIZE} x2={30 + 8 * CELL_SIZE} y2={30 + r * CELL_SIZE} stroke="#7a3e0e" strokeWidth="1.2"/>
          ))}
          {/* 楚河汉界 */}
          <text x={30 + CELL_SIZE * 1.2} y={30 + 4.62 * CELL_SIZE} fill="#7a3e0e" fontSize="13" fontWeight="bold" opacity="0.7">楚　河</text>
          <text x={30 + CELL_SIZE * 5} y={30 + 4.62 * CELL_SIZE} fill="#7a3e0e" fontSize="13" fontWeight="bold" opacity="0.7">漢　界</text>
          {/* 将/帅九宫 斜线 */}
          <line x1={30+3*CELL_SIZE} y1={30} x2={30+5*CELL_SIZE} y2={30+2*CELL_SIZE} stroke="#7a3e0e" strokeWidth="1" opacity="0.6"/>
          <line x1={30+5*CELL_SIZE} y1={30} x2={30+3*CELL_SIZE} y2={30+2*CELL_SIZE} stroke="#7a3e0e" strokeWidth="1" opacity="0.6"/>
          <line x1={30+3*CELL_SIZE} y1={30+7*CELL_SIZE} x2={30+5*CELL_SIZE} y2={30+9*CELL_SIZE} stroke="#7a3e0e" strokeWidth="1" opacity="0.6"/>
          <line x1={30+5*CELL_SIZE} y1={30+7*CELL_SIZE} x2={30+3*CELL_SIZE} y2={30+9*CELL_SIZE} stroke="#7a3e0e" strokeWidth="1" opacity="0.6"/>
        </svg>

        {/* 可点击交叉点 */}
        {Array.from({ length: BOARD_ROWS }, (_, r) =>
          Array.from({ length: BOARD_COLS }, (_, c) => {
            const isLegal = legalMoves.some(([lr, lc]) => lr === r && lc === c);
            const p = pieces.find(p => p.r === r && p.c === c);
            const isSel = p && p.id === selectedId;
            return (
              <div
                key={`${r}-${c}`}
                onClick={() => handleCellClick(r, c)}
                className="absolute cursor-pointer flex items-center justify-center"
                style={{
                  left: 30 + c * CELL_SIZE - CELL_SIZE / 2,
                  top: 30 + r * CELL_SIZE - CELL_SIZE / 2,
                  width: CELL_SIZE,
                  height: CELL_SIZE,
                  zIndex: p ? 10 : 5,
                }}
              >
                {/* 合法落点蓝点 */}
                {isLegal && !p && (
                  <div className="w-4 h-4 rounded-full bg-blue-500/70 border border-blue-700/30 shadow animate-pulse" />
                )}
                {/* 棋子 */}
                {p && (
                  <div className={`
                    w-9 h-9 rounded-full border-2 flex items-center justify-center font-black text-base z-10 shadow-md transition-all duration-200 select-none
                    ${p.side === 'RED'
                      ? 'bg-red-50 border-red-700 text-red-700'
                      : 'bg-slate-50 border-slate-800 text-slate-900'}
                    ${isSel ? 'scale-110 ring-2 ring-blue-500 ring-offset-1 !bg-blue-50 shadow-blue-400/50 shadow-lg' : 'hover:scale-105'}
                    ${isLegal ? 'ring-2 ring-blue-400/60' : ''}
                  `}>
                    {PIECE_LABEL[p.type][p.side]}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* 图例 */}
      <div className="mt-4 flex gap-4 text-xs font-bold text-slate-500 bg-white/60 dark:bg-slate-800/60 px-5 py-2.5 rounded-2xl">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded-full bg-red-50 border-2 border-red-700"></div>
          <span>红方（你）</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded-full bg-slate-50 border-2 border-slate-800"></div>
          <span>黑方（AI）</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-blue-500/70"></div>
          <span>合法落点</span>
        </div>
      </div>
    </div>
  );
};

// =============================================
// 游戏 7: 斗地主
// =============================================
type DDZSuit = '♠' | '♥' | '♣' | '♦' | '';
type DDZValue = '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A' | '2' | '小王' | '大王';

interface Card {
  id: string;
  suit: DDZSuit;
  value: DDZValue;
  weight: number; 
  selected?: boolean;
}

const DDZ_WEIGHTS: Record<DDZValue, number> = {
  '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
  'J': 11, 'Q': 12, 'K': 13, 'A': 14, '2': 15,
  '小王': 20, '大王': 21
};

const createDeck = (): Card[] => {
  const suits: DDZSuit[] = ['♠', '♥', '♣', '♦'];
  const values: DDZValue[] = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2'];
  const deck: Card[] = [];
  let id = 0;
  for (const v of values) {
    for (const s of suits) {
      deck.push({ id: `card_${id++}`, suit: s, value: v, weight: DDZ_WEIGHTS[v] });
    }
  }
  deck.push({ id: `card_${id++}`, suit: '', value: '小王', weight: DDZ_WEIGHTS['小王'] });
  deck.push({ id: `card_${id++}`, suit: '', value: '大王', weight: DDZ_WEIGHTS['大王'] });
  return deck.sort(() => Math.random() - 0.5);
};

const sortHand = (cards: Card[]) => [...cards].sort((a, b) => b.weight - a.weight);

// 提取牌型特征
const getComboType = (cards: Card[]) => {
  if (cards.length === 0) return null;
  const sorted = sortHand(cards);
  const weights = sorted.map(c => c.weight);
  const counts: Record<number, number> = {};
  weights.forEach(w => counts[w] = (counts[w] || 0) + 1);
  const countVals = Object.values(counts);
  const uniqWeights = Object.keys(counts).map(Number).sort((a, b) => b - a);

  // 王炸
  if (cards.length === 2 && weights.includes(20) && weights.includes(21)) return { type: 'rocket', weight: 1000 };
  
  // 炸弹
  if (cards.length === 4 && countVals[0] === 4) return { type: 'bomb', weight: uniqWeights[0] };
  
  // 单牌
  if (cards.length === 1) return { type: 'single', weight: weights[0] };
  
  // 对子
  if (cards.length === 2 && countVals[0] === 2) return { type: 'pair', weight: weights[0] };
  
  // 三不带
  if (cards.length === 3 && countVals[0] === 3) return { type: 'three', weight: weights[0] };
  
  // 三带一
  if (cards.length === 4 && countVals.includes(3)) {
    const mainWeight = Number(Object.keys(counts).find(k => counts[Number(k)] === 3));
    return { type: 'three_one', weight: mainWeight };
  }
  
  // 三带二 (一对)
  if (cards.length === 5 && countVals.includes(3) && countVals.includes(2)) {
    const mainWeight = Number(Object.keys(counts).find(k => counts[Number(k)] === 3));
    return { type: 'three_two', weight: mainWeight };
  }
  
  // 顺子 (>=5张, 连续, 不含2和王)
  if (cards.length >= 5 && countVals.every(c => c === 1) && !uniqWeights.some(w => w >= 15)) {
    if (uniqWeights[0] - uniqWeights[uniqWeights.length - 1] === cards.length - 1) {
      return { type: 'straight', weight: uniqWeights[0], length: cards.length };
    }
  }
  
  // 连对 (>=3对 => >=6张, 连续, 不含2和王)
  if (cards.length >= 6 && cards.length % 2 === 0 && countVals.every(c => c === 2) && !uniqWeights.some(w => w >= 15)) {
    if (uniqWeights[0] - uniqWeights[uniqWeights.length - 1] === (cards.length / 2) - 1) {
      return { type: 'straight_pair', weight: uniqWeights[0], length: cards.length };
    }
  }
  
  // 飞机 (简化：不带翅膀)
  if (cards.length >= 6 && cards.length % 3 === 0 && countVals.every(c => c === 3) && !uniqWeights.some(w => w >= 15)) {
    if (uniqWeights[0] - uniqWeights[uniqWeights.length - 1] === (cards.length / 3) - 1) {
      return { type: 'airplane', weight: uniqWeights[0], length: cards.length };
    }
  }
  
  // 飞机带单牌 (这里只处理最基础的连续三张判定，复杂翅膀暂化简处理)
  // 如果三张连着的数量 * 4 == 总数量
  const threeCnts = Object.keys(counts).filter(k => counts[Number(k)] >= 3).map(Number).sort((a, b) => b - a);
  if (threeCnts.length >= 2 && !threeCnts.some(w => w >= 15)) {
    // 找最长的连续三张
    for (let i = 0; i < threeCnts.length - 1; i++) {
        let seq = 1;
        for (let j = i; j < threeCnts.length - 1; j++) {
            if (threeCnts[j] - threeCnts[j+1] === 1) seq++;
            else break;
        }
        if (seq * 4 === cards.length) {
            return { type: 'airplane_wing', weight: threeCnts[i], length: cards.length };
        }
        if (seq * 5 === cards.length) { // 飞机带对子
           // 检查剩下的是不是对子，这里为保证游戏流畅，做适当宽松验证
           return { type: 'airplane_pair', weight: threeCnts[i], length: cards.length };
        }
    }
  }
  
  // 四带二
  if (cards.length === 6 && countVals.includes(4)) {
    const mainWeight = Number(Object.keys(counts).find(k => counts[Number(k)] === 4));
    return { type: 'four_two', weight: mainWeight };
  }
  
  return null;
};

// 能否压牌
const canBeat = (playCards: Card[], lastPlay: { combo: any; cards: Card[] } | null) => {
  const combo = getComboType(playCards);
  if (!combo) return false;
  if (!lastPlay) return true; // 第一手或者别的都过牌了
  
  if (combo.type === 'rocket') return true;
  if (combo.type === 'bomb' && lastPlay.combo.type !== 'bomb' && lastPlay.combo.type !== 'rocket') return true;
  
  if (combo.type === lastPlay.combo.type) {
    if (combo.type === 'straight' || combo.type === 'straight_pair' || combo.type === 'airplane' || combo.type === 'airplane_wing') {
      return combo.length === lastPlay.combo.length && combo.weight > lastPlay.combo.weight;
    }
    return combo.weight > lastPlay.combo.weight && playCards.length === lastPlay.cards.length;
  }
  
  return false;
};

// 极简 AI 出牌策略：找到能打的最小组合
const findAIMove = (hand: Card[], lastPlay: { combo: any; cards: Card[] } | null): Card[] => {
  const sorted = sortHand(hand).reverse(); // 从小到大找
  
  // 没上家，随便出最小的单牌 (这里简单写，如果是地主最后一张可出大)
  if (!lastPlay) return [sorted[0]]; 

  // 如果必须压，尝试相同张数和类型
  // 简陋型：暴力组合搜索，这里为防卡顿只做有限穷举：找比当前大的单/对/三/炸弹
  if (lastPlay.combo.type === 'single') {
     const c = sorted.find(x => x.weight > lastPlay.combo.weight);
     if (c) return [c];
  } else if (lastPlay.combo.type === 'pair') {
     const counts: Record<number, Card[]> = {};
     sorted.forEach(c => { counts[c.weight] = counts[c.weight] || []; counts[c.weight].push(c); });
     for (const w of Object.keys(counts).map(Number).sort((a,b)=>a-b)) {
         if (w > lastPlay.combo.weight && counts[w].length >= 2) return counts[w].slice(0, 2);
     }
  } else if (lastPlay.combo.type === 'three' || lastPlay.combo.type === 'three_one') {
     const counts: Record<number, Card[]> = {};
     sorted.forEach(c => { counts[c.weight] = counts[c.weight] || []; counts[c.weight].push(c); });
     for (const w of Object.keys(counts).map(Number).sort((a,b)=>a-b)) {
         if (w > lastPlay.combo.weight && counts[w].length >= 3) {
             let play = counts[w].slice(0, 3);
             if (lastPlay.combo.type === 'three_one') {
                 // 随便找个不是这个w的单牌
                 const single = sorted.find(c => c.weight !== w);
                 if (single) play.push(single);
                 else continue; // 没零牌可带
             }
             return play;
         }
     }
  }

  // 被逼无奈，有炸弹出炸弹
  if (lastPlay.combo.type !== 'rocket') {
     const counts: Record<number, Card[]> = {};
     sorted.forEach(c => { counts[c.weight] = counts[c.weight] || []; counts[c.weight].push(c); });
     for (const w of Object.keys(counts).map(Number).sort((a,b)=>a-b)) {
         if (counts[w].length === 4 && (lastPlay.combo.type !== 'bomb' || w > lastPlay.combo.weight)) {
             return counts[w];
         }
     }
     if (sorted.some(c=>c.weight===20) && sorted.some(c=>c.weight===21)) {
         return sorted.filter(c => c.weight >= 20); // 王炸
     }
  }

  return []; // 不起
};

const GameCardView: React.FC<{ card: Card; onClick?: () => void; isHidden?: boolean; small?: boolean; className?: string }> = ({ card, onClick, isHidden, small, className = '' }) => {
  if (isHidden) {
      return (
         <div className={`relative bg-emerald-800 border-2 border-emerald-900 rounded-md shadow-md flex items-center justify-center ${small ? 'w-8 h-12' : 'w-16 h-24'} ${className}`}>
           <div className="w-full h-full border border-emerald-700 m-1 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-30 mix-blend-overlay"></div>
         </div>
      );
  }

  const isRed = card.suit === '♥' || card.suit === '♦' || card.value === '大王';
  return (
    <div 
      onClick={onClick}
      className={`relative bg-white flex flex-col items-center shadow-md border border-slate-200 cursor-pointer hover:shadow-xl transition-transform ${card.selected ? '-translate-y-4' : ''} ${small ? 'w-10 h-14 rounded p-0.5 text-[10px]' : 'w-16 h-24 md:w-20 md:h-28 rounded-md p-1 md:p-2 text-sm md:text-lg'} ${className}`}
    >
      <div className={`font-black self-start leading-none ${isRed ? 'text-red-600' : 'text-slate-800'}`}>
        {card.value}
      </div>
      <div className={`mt-[1px] self-start leading-none ${isRed ? 'text-red-600' : 'text-slate-800'}`}>
        {card.suit}
      </div>
      {/* 居中大图标 */}
      {card.suit && !small && (
         <div className={`absolute bottom-2 right-2 text-2xl md:text-4xl opacity-20 ${isRed ? 'text-red-500' : 'text-slate-500'}`}>
            {card.suit}
         </div>
      )}
    </div>
  );
};

const GameDoudizhu = () => {
    // 增加 dealing 状态（发牌动画中），landlord_anim 状态（地主翻底牌入列动画中）
    const [phase, setPhase] = useState<'init'|'ready'|'dealing'|'calling'|'landlord_anim'|'playing'|'end'>('init');
    const [players, setPlayers] = useState<Card[][]>([[], [], []]); // 0=User, 1=Right AI, 2=Left AI
    const [bottomCards, setBottomCards] = useState<Card[]>([]);
    const [landlord, setLandlord] = useState<number>(-1);
    const [turn, setTurn] = useState(-1);
    const [callScore, setCallScore] = useState(0);
    const [passCount, setPassCount] = useState(0);
    const [lastPlay, setLastPlay] = useState<{ player: number; combo: any; cards: Card[] } | null>(null);
    const [tableCards, setTableCards] = useState<{ player: number; cards: Card[] } | null>(null);
    const [winner, setWinner] = useState(-1);
    const [msgs, setMsgs] = useState<Record<number, string>>({}); 
    // 特效动效状态
    const [playEffect, setPlayEffect] = useState<{ type: string, combo: string } | null>(null);
    // 全屏横屏状态
    const [isFullscreen, setIsFullscreen] = useState(false);
    // 未发出的牌堆（用于发牌动画）
    const [deckToDeal, setDeckToDeal] = useState<Card[]>([]);

    const showMsg = (playerIdx: number, text: string) => {
        setMsgs(prev => ({ ...prev, [playerIdx]: text }));
        setTimeout(() => {
            setMsgs(prev => { const n = {...prev}; delete n[playerIdx]; return n; });
        }, 2000);
    };

    const triggerEffect = (comboType: string) => {
        const effectMap: Record<string, string> = {
            'bomb': '💥 炸弹 💥',
            'rocket': '🚀 王炸 🚀',
            'airplane': '✈️ 飞机 ✈️',
            'airplane_wing': '✈️ 飞机带翅膀',
            'straight': '🎢 顺子',
            'straight_pair': '🚂 连对'
        };
        if (effectMap[comboType]) {
            setPlayEffect({ type: comboType, combo: effectMap[comboType] });
            setTimeout(() => setPlayEffect(null), 1500);
        }
    };

    const prepareGame = () => {
        const deck = createDeck();
        setDeckToDeal(deck);
        setPlayers([[], [], []]);
        setBottomCards([]);
        setPhase('ready');
        setTurn(-1);
        setCallScore(0);
        setLandlord(-1);
        setLastPlay(null);
        setTableCards(null);
        setPassCount(0);
        setWinner(-1);
        setMsgs({});
    };

    const startDealing = () => {
        setPhase('dealing');
        let dealIndex = 0;
        const tempPlayers: Card[][] = [[], [], []];
        const deck = [...deckToDeal];
        
        const dealInterval = setInterval(() => {
            if (dealIndex >= 51) {
                clearInterval(dealInterval);
                setBottomCards(deck.slice(51, 54));
                // 发牌结束，整理手牌
                setPlayers([sortHand(tempPlayers[0]), sortHand(tempPlayers[1]), sortHand(tempPlayers[2])]);
                setPhase('calling');
                // 优化1：随机选一个人开始叫地主
                setTurn(Math.floor(Math.random() * 3));
                return;
            }
            const pIdx = dealIndex % 3;
            tempPlayers[pIdx].push(deck[dealIndex]);
            setPlayers([...tempPlayers]); // 触发重渲染显示发牌过程
            dealIndex++;
        }, 30); // 每 30ms 发一张牌
    };

    // 叫地主阶段逻辑 (玩家叫分)
    const handleCall = (score: number) => {
        if (score === 3) {
            becomeLandlord(0, 3);
        } else {
            setCallScore(score);
            if (score > 0) showMsg(0, `${score}分`);
            else showMsg(0, `不叫`);
            // AI 叫分模拟
            setTimeout(() => {
                let currentMax = score;
                let c1 = currentMax < 3 ? (Math.random() > 0.5 ? currentMax + 1 : 0) : 0;
                if (c1 > 0) { showMsg(1, `${c1}分`); currentMax = c1; } else { showMsg(1, `不叫`); }
                if (currentMax === 3) { becomeLandlord(1, 3); return; }

                setTimeout(() => {
                    let c2 = currentMax < 3 ? (Math.random() > 0.5 ? currentMax + 1 : 0) : 0;
                    if (c2 > 0) { showMsg(2, `${c2}分`); currentMax = c2; } else { showMsg(2, `不叫`); }
                    
                    if (currentMax === 0) {
                        // 都不叫，重开
                        alert("都不叫，重新洗牌发牌");
                        prepareGame();
                    } else {
                        // 确定地主
                        const ll = c2 === currentMax ? 2 : (c1 === currentMax ? 1 : 0);
                        becomeLandlord(ll, currentMax);
                    }
                }, 800);
            }, 800);
        }
    };

    const becomeLandlord = (playerIdx: number, score: number) => {
        setLandlord(playerIdx);
        setCallScore(score);
        showMsg(playerIdx, '抢地主！');
        setPhase('landlord_anim'); // 进入翻底牌动画状态
        
        setTimeout(() => {
             setPlayers(prev => {
                 const next = [...prev];
                 next[playerIdx] = sortHand([...next[playerIdx], ...bottomCards]);
                 return next;
             });
             setPhase('playing');
             setTurn(playerIdx);
        }, 1500); // 展示 1.5 秒底牌再入列
    };

    const toggleSelect = (cardId: string) => {
        setPlayers(prev => {
            const next = [...prev];
            next[0] = next[0].map(c => c.id === cardId ? { ...c, selected: !c.selected } : c);
            return next;
        });
    };

    const handlePlayCard = () => {
        const pHand = players[0];
        const selected = pHand.filter(c => c.selected);
        const combo = getComboType(selected);
        
        if (!combo) { alert('牌型不合法！'); return; }
        if (!canBeat(selected, passCount >= 2 ? null : lastPlay)) {
            alert('你出的牌不够大！'); return;
        }

        // 成功出牌
        executePlay(0, selected, combo);
    };

    const handlePass = () => {
        if (!lastPlay || passCount >= 2) { alert('你必须出牌！'); return; }
        showMsg(0, '不出');
        setPassCount(p => p + 1);
        setTurn(1);
    };

    const executePlay = (playerIdx: number, cards: Card[], combo: any) => {
        setPlayers(prev => {
            const next = [...prev];
            next[playerIdx] = next[playerIdx].filter(c => !cards.map(x=>x.id).includes(c.id));
            return next;
        });
        setLastPlay({ player: playerIdx, combo, cards });
        setTableCards({ player: playerIdx, cards });
        setPassCount(0);
        triggerEffect(combo.type);

        // Check win
        if (players[playerIdx].length - cards.length === 0) {
            setPhase('end');
            setWinner(playerIdx);
            return;
        }

        setTurn((playerIdx + 1) % 3);
    };

    // AI 逻辑
    useEffect(() => {
        if (phase === 'playing' && turn > 0 && winner === -1) {
            const timer = setTimeout(() => {
                const mustPlay = passCount >= 2 || !lastPlay;
                const hand = players[turn];
                const aiCards = findAIMove(hand, mustPlay ? null : lastPlay);
                
                if (aiCards.length > 0) {
                    const combo = getComboType(aiCards);
                    executePlay(turn, aiCards, combo);
                } else {
                    showMsg(turn, '不出');
                    setPassCount(p => p + 1);
                    setTurn((turn + 1) % 3);
                }
            }, 1200);
            return () => clearTimeout(timer);
        }
    }, [turn, phase]);

    // AI 自动叫地主检查
    useEffect(() => {
       if (phase === 'calling' && turn > 0 && callScore < 3) {
            // 这部分的 AI 首叫逻辑
            const timer = setTimeout(() => {
                let c = Math.random() > 0.5 ? callScore + 1 : 0;
                if (c > 3) c = 3;
                if (c > 0) { 
                    showMsg(turn, `${c}分`); 
                    if (c === 3) {
                         becomeLandlord(turn, 3);
                         return; // 中断后续
                    } else {
                         setCallScore(c);
                    }
                } else { 
                    showMsg(turn, `不叫`); 
                }
                setTurn((turn + 1) % 3);
            }, 1000);
            return () => clearTimeout(timer);
       }
    }, [turn, phase]);

    // 计算被挡住导致出牌重叠的 className
    const getCardSpacing = (totalCards: number) => {
         if (totalCards > 15) return 'mr-[-22px] md:mr-[-30px]';
         if (totalCards > 10) return 'mr-[-18px] md:mr-[-25px]';
         return 'mr-[-14px] md:mr-[-18px]';
    };

    const getHandSpacing = (totalCards: number) => {
         if (totalCards > 17) return 'mr-[-24px] md:mr-[-34px]';
         if (totalCards > 10) return 'mr-[-20px] md:mr-[-30px]';
         return 'mr-[-16px] md:mr-[-20px]';
    };

    if (phase === 'init') {
        return (
            <div className="flex flex-col items-center justify-center w-full max-w-2xl py-20 px-4 bg-emerald-900 rounded-3xl text-emerald-100 shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/pinstripe-light.png')] pointer-events-none"></div>
                <div className="text-6xl mb-6">🃏</div>
                <h2 className="text-4xl font-black mb-10 tracking-widest text-emerald-400 drop-shadow-lg">长青园斗地主</h2>
                <button 
                  onClick={prepareGame}
                  className="bg-emerald-500 hover:bg-emerald-400 text-emerald-950 px-10 py-4 rounded-full font-black text-2xl shadow-[0_4px_20px_rgba(16,185,129,0.5)] active:scale-95 transition-all w-full max-w-sm"
                >
                    进 入 游 戏
                </button>
            </div>
        );
    }

    const content = (
        <div className={`relative ${isFullscreen ? 'w-[100vh] h-[100vw] bg-black flex items-center justify-center' : 'w-full max-w-3xl flex flex-col items-center'}`}>
            <div 
               className={`flex flex-col items-center overflow-hidden shadow-2xl text-slate-100 font-sans border-4 ${isFullscreen ? 'border-none w-[100vh] h-[100vw] rotate-90 scale-100' : 'border-emerald-900/50 w-full rounded-3xl'} bg-emerald-700`}
            >
                {/* 顶栏控制和状态 */}
                <div className="w-full bg-emerald-950 px-4 md:px-6 py-2 flex justify-between items-center shadow-md relative z-30">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => setIsFullscreen(!isFullscreen)} 
                            className="text-white hover:text-emerald-400 font-black flex items-center gap-1 bg-white/10 px-3 py-1 rounded-lg"
                        >
                            {isFullscreen ? '❌ 退出全屏' : '🔲 开启全屏 (推荐)'}
                        </button>
                    </div>
                    
                    {/* 底牌展示区 */}
                    <div className="flex items-center">
                        <span className="font-bold text-xs text-emerald-300 mr-3 md:block hidden">底牌</span>
                        {bottomCards.length > 0 ? bottomCards.map((c, i) => (
                            <div key={i} className={i !== bottomCards.length - 1 ? 'mr-[-20px] md:mr-[-25px]' : ''}>
                                <GameCardView 
                                    card={c} 
                                    small 
                                    isHidden={phase === 'calling' || phase === 'ready' || phase === 'dealing'} 
                                />
                            </div>
                        )) : (
                            <div className="flex">
                                {[1,2,3].map(i => <div key={i} className="w-8 h-12 bg-emerald-800/50 border border-emerald-900 rounded-md mr-1 last:mr-0"></div>)}
                            </div>
                        )}
                    </div>
                    
                    <div className="font-black text-sm text-emerald-400">倍数: {callScore || 1}</div>
                </div>

                {/* 桌面互动区 */}
                <div className="relative w-full flex-1 min-h-[300px] md:min-h-[400px] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-600 to-emerald-800 p-4 shadow-inner">
                    {/* 桌面水印 */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
                        <span className="text-9xl font-black">赛</span>
                    </div>

                    {/* AI 2 (左上) */}
                    <div className="absolute top-8 left-4 flex flex-col items-center">
                        <div className="w-12 h-12 md:w-14 md:h-14 bg-white/20 rounded-full border-2 border-emerald-300 flex items-center justify-center text-xl md:text-2xl shadow-lg relative">
                            🤖
                            {landlord === 2 && <div className="absolute -top-3 -right-3 text-2xl drop-shadow-md">👑</div>}
                        </div>
                        <div className="mt-2 bg-black/40 px-3 py-1 rounded-full text-xs font-bold text-yellow-300">
                            牌数: {players[2].length}
                        </div>
                        {msgs[2] && <div className="absolute top-2 left-14 md:left-16 bg-white text-slate-800 px-3 py-1 rounded-xl shadow-lg font-bold whitespace-nowrap z-20 before:content-[''] before:absolute before:right-full before:top-2 before:border-4 before:border-transparent before:border-r-white">{msgs[2]}</div>}
                    </div>

                    {/* AI 1 (右上) */}
                    <div className="absolute top-8 right-4 flex flex-col items-center">
                        <div className="w-12 h-12 md:w-14 md:h-14 bg-white/20 rounded-full border-2 border-emerald-300 flex items-center justify-center text-xl md:text-2xl shadow-lg relative">
                            🤖
                            {landlord === 1 && <div className="absolute -top-3 -right-3 text-2xl drop-shadow-md">👑</div>}
                        </div>
                        <div className="mt-2 bg-black/40 px-3 py-1 rounded-full text-xs font-bold text-yellow-300">
                             牌数: {players[1].length}
                        </div>
                        {msgs[1] && <div className="absolute top-2 right-14 md:right-16 bg-white text-slate-800 px-3 py-1 rounded-xl shadow-lg font-bold whitespace-nowrap z-20 before:content-[''] before:absolute before:left-full before:top-2 before:border-4 before:border-transparent before:border-l-white">{msgs[1]}</div>}
                    </div>

                    {/* 桌面中央出牌区 */}
                    <div className="absolute inset-0 flex items-center justify-center pt-8 pointer-events-none z-10 overflow-hidden">
                        {(phase === 'ready' || phase === 'dealing') && (
                            <div className="flex flex-col items-center">
                                <div className="w-24 h-32 bg-emerald-800 rounded-xl border-4 border-emerald-900 shadow-2xl relative flex items-center justify-center mb-6">
                                     <div className="w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-30 mix-blend-overlay"></div>
                                     <span className="absolute text-emerald-950 font-black text-4xl">扑克</span>
                                </div>
                                {phase === 'ready' && (
                                    <button onClick={startDealing} className="pointer-events-auto bg-amber-500 hover:bg-amber-400 text-amber-950 px-8 py-3 rounded-full font-black text-xl shadow-lg active:scale-95 transition-all">
                                        开始洗牌发牌
                                    </button>
                                )}
                                {phase === 'dealing' && (
                                    <div className="text-yellow-300 font-bold animate-pulse text-lg">发牌中...</div>
                                )}
                            </div>
                        )}
                        
                        {phase !== 'ready' && phase !== 'dealing' && tableCards && (
                             <div className={`flex justify-center px-4 w-full`}>
                                 {tableCards.cards.map((c, i) => (
                                      <div key={c.id} style={{ zIndex: i }} className={i !== tableCards.cards.length - 1 ? getCardSpacing(tableCards.cards.length) : ''}>
                                          <GameCardView card={c} small />
                                      </div>
                                 ))}
                             </div>
                        )}
                    </div>

                    {/* 特效层 (覆盖全桌) */}
                    {playEffect && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50 animate-[ping_1.5s_cubic-bezier(0,0,0.2,1)_forwards]">
                            <div className="text-4xl md:text-6xl font-black text-yellow-300 drop-shadow-[0_0_20px_rgba(234,179,8,1)] stroke-red-600 stroke-2" style={{ WebkitTextStroke: '2px red' }}>
                                {playEffect.combo}
                            </div>
                        </div>
                    )}

                    {/* 自己 (下方中央消息) */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 min-h-8 z-20">
                        {msgs[0] && <div className="bg-white text-slate-800 px-4 py-1.5 rounded-full shadow-lg font-bold whitespace-nowrap">{msgs[0]}</div>}
                    </div>
                </div>

                {/* 操作控制区 */}
                <div className="w-full bg-emerald-800/90 px-2 py-3 md:py-4 flex justify-center gap-2 md:gap-4 min-h-[60px] md:min-h-[70px] z-30 relative shadow-[0_-5px_15px_rgba(0,0,0,0.2)]">
                    {phase === 'calling' && turn === 0 && (
                        <>
                            <button onClick={() => handleCall(0)} className="bg-slate-500 hover:bg-slate-400 text-white px-4 md:px-8 py-2 md:py-2.5 rounded-full font-bold md:font-black active:scale-95 shadow-md">不叫</button>
                            <button onClick={() => handleCall(1)} className="bg-emerald-500 hover:bg-emerald-400 text-white px-4 md:px-6 py-2 md:py-2.5 rounded-full font-bold md:font-black active:scale-95 shadow-md">1分</button>
                            <button onClick={() => handleCall(2)} className="bg-emerald-500 hover:bg-emerald-400 text-white px-4 md:px-6 py-2 md:py-2.5 rounded-full font-bold md:font-black active:scale-95 shadow-md">2分</button>
                            <button onClick={() => handleCall(3)} className="bg-amber-500 hover:bg-amber-400 text-amber-950 px-4 md:px-6 py-2 md:py-2.5 rounded-full font-bold md:font-black active:scale-95 shadow-[0_0_15px_rgba(245,158,11,0.5)]">3分(抢)</button>
                        </>
                    )}
                    {phase === 'calling' && turn !== 0 && (
                        <div className="text-yellow-300 font-bold flex items-center gap-2"><span className="animate-spin">⏳</span> 等待其他玩家叫地主...</div>
                    )}
                    {phase === 'playing' && turn === 0 && (
                         <>
                            <button onClick={handlePass} disabled={!lastPlay || passCount >= 2} className="bg-slate-500 hover:bg-slate-400 disabled:opacity-50 text-white px-6 md:px-10 py-2.5 md:py-3 rounded-full font-black text-lg md:text-xl active:scale-95 shadow-md">不出</button>
                            <button onClick={handlePlayCard} className="bg-amber-500 hover:bg-amber-400 text-amber-950 disabled:opacity-50 px-6 md:px-10 py-2.5 md:py-3 rounded-full font-black text-lg md:text-xl active:scale-95 shadow-[0_0_15px_rgba(245,158,11,0.5)] transform scale-105">出牌</button>
                         </>
                    )}
                    {phase === 'playing' && turn !== 0 && (
                         <div className="text-yellow-300 font-bold flex items-center gap-2"><span className="animate-spin">⏳</span> 等待 AI 出牌...</div>
                    )}
                    {phase === 'landlord_anim' && (
                         <div className="text-emerald-300 font-bold text-lg animate-pulse">🎉 确立地主，底牌归入...</div>
                    )}
                    {phase === 'end' && (
                         <div className="w-full flex items-center justify-between px-8">
                             <div className="text-xl md:text-2xl font-black text-amber-300 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
                                 {winner === 0 ? '🏆 恭喜大获全胜！' : `😢 玩家 ${winner === 1 ? '右侧🤖' : '左侧🤖'} 赢了本局！`}
                             </div>
                             <button onClick={prepareGame} className="bg-emerald-500 hover:bg-emerald-400 text-emerald-950 px-8 md:px-10 py-3 rounded-full font-black text-lg shadow-lg active:scale-95 transition-all outline outline-4 outline-emerald-300/30">再来一局</button>
                         </div>
                    )}
                </div>

                {/* 玩家手牌区 (优化卡牌过密被防挡出的情况) */}
                <div className="w-full bg-emerald-950 p-4 md:p-6 flex flex-col items-center relative min-h-[140px] md:min-h-[160px] z-20">
                   <div className="absolute top-2 left-4 flex flex-col items-center z-10">
                        <div className="w-12 h-12 bg-emerald-500/20 rounded-full border border-emerald-400 flex items-center justify-center text-xl shadow-sm relative">
                            🧑
                            {landlord === 0 && <div className="absolute -top-3 -right-2 text-2xl drop-shadow-md">👑</div>}
                        </div>
                    </div>

                   <div className={`flex justify-center w-full px-2 pl-6 pt-2 transition-all`}>
                        {players[0].map((c, idx) => (
                            <div key={c.id} style={{ zIndex: idx }} className={`transition-all duration-300 ease-out ${idx !== players[0].length - 1 ? getHandSpacing(players[0].length) : ''}`}>
                                <GameCardView card={c} onClick={() => phase === 'playing' && turn === 0 && toggleSelect(c.id)} />
                            </div>
                        ))}
                   </div>
                   {players[0].length === 0 && phase !== 'init' && phase !== 'ready' && <div className="text-slate-500 font-bold mt-4">手牌已出完</div>}
                </div>
            </div>
        </div>
    );

    if (isFullscreen) {
        return createPortal(
            <div className="fixed inset-0 z-[99999] bg-black flex items-center justify-center">
                {content}
            </div>,
            document.body
        );
    }

    return content;
};

