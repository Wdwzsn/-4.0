import React, { useState, useEffect, useRef, useCallback } from 'react';
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
        snake: [{ x: 9, y: 9 }, { x: 8, y: 9 }],
        food: { x: 4, y: 4 },
        dir: { x: 1, y: 0 },
        gameOver: false,
        score: 0,
        started: false,
    });

    const [state, setState] = useState(initState);
    const stateRef = useRef(state);
    stateRef.current = state;
    const timerRef = useRef<any>(null);
    const [showBoard, setShowBoard] = useState(false);
    const [lastScore, setLastScore] = useState<number | null>(null);

    const tick = useCallback(() => {
        const { snake, food, dir, gameOver } = stateRef.current;
        if (gameOver) return;

        const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
        if (head.x < 0 || head.x >= GRID || head.y < 0 || head.y >= GRID || snake.some(s => s.x === head.x && s.y === head.y)) {
            setState(s => {
                setLastScore(s.score);
                return { ...s, gameOver: true };
            });
            return;
        }

        const ateFood = head.x === food.x && head.y === food.y;
        const newSnake = [head, ...snake];
        if (!ateFood) newSnake.pop();

        setState(s => ({
            ...s,
            snake: newSnake,
            food: ateFood ? randFood(newSnake) : food,
            score: ateFood ? s.score + 10 : s.score,
        }));
    }, []);

    const start = () => {
        const s = initState();
        s.started = true;
        setState(s);
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(tick, 200);
    };

    useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

    useEffect(() => {
        if (state.gameOver && timerRef.current) clearInterval(timerRef.current);
    }, [state.gameOver]);

    const setDir = (d: Pos) => {
        setState(s => {
            if (s.dir.x === -d.x && s.dir.y === -d.y) return s;
            return { ...s, dir: d, started: true };
        });
    };

    const cellSize = Math.floor(288 / GRID);

    return (
        <div className="flex flex-col items-center w-full max-w-xs select-none">
            <div className="flex justify-between w-full mb-4 gap-3">
                <div className="bg-slate-800 text-white px-5 py-3 rounded-2xl font-black text-xl flex-1 text-center">
                    得分: {state.score}
                </div>
                <button onClick={start} className="bg-emerald-500 text-white px-5 py-3 rounded-2xl font-black">
                    {state.started ? '重开' : '开始'}
                </button>
            </div>

            {state.gameOver && (
                <div className="w-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-300 text-center py-3 rounded-2xl font-black mb-4 text-lg">
                    😢 游戏结束！得分: {state.score}
                    <div className="mt-2 flex justify-center gap-4 text-sm">
                        <button onClick={start} className="underline">再来</button>
                        <button onClick={() => setShowBoard(true)} className="underline font-bold text-emerald-600 dark:text-emerald-400">查看排行榜</button>
                    </div>
                </div>
            )}

            {!state.started && !state.gameOver && (
                <div className="w-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 text-center py-3 rounded-2xl font-black mb-4 flex justify-between px-6">
                    <span>点击【开始】或方向键开始</span>
                    <button onClick={() => { setLastScore(null); setShowBoard(true); }} className="underline ml-2">排行榜</button>
                </div>
            )}

            <div
                className="relative bg-slate-100 dark:bg-slate-700 rounded-2xl overflow-hidden border-4 border-slate-300 dark:border-slate-600 shadow-xl"
                style={{ width: GRID * cellSize, height: GRID * cellSize }}
            >
                {/* 蛇 */}
                {state.snake.map((s, i) => (
                    <div
                        key={i}
                        className={`absolute rounded-sm transition-all ${i === 0 ? 'bg-emerald-600' : 'bg-emerald-400'}`}
                        style={{ left: s.x * cellSize + 1, top: s.y * cellSize + 1, width: cellSize - 2, height: cellSize - 2 }}
                    />
                ))}
                {/* 食物 */}
                <div
                    className="absolute bg-red-500 rounded-full animate-pulse"
                    style={{ left: state.food.x * cellSize + 2, top: state.food.y * cellSize + 2, width: cellSize - 4, height: cellSize - 4 }}
                />
            </div>

            <div className="mt-6 grid grid-cols-3 gap-3 w-48">
                <div />
                <button onClick={() => setDir({ x: 0, y: -1 })} className="w-14 h-14 bg-white dark:bg-slate-700 dark:text-white rounded-2xl text-2xl active:scale-90 shadow-md border border-slate-200 dark:border-slate-600">⬆</button>
                <div />
                <button onClick={() => setDir({ x: -1, y: 0 })} className="w-14 h-14 bg-white dark:bg-slate-700 dark:text-white rounded-2xl text-2xl active:scale-90 shadow-md border border-slate-200 dark:border-slate-600">⬅</button>
                <button onClick={() => setDir({ x: 0, y: 1 })} className="w-14 h-14 bg-white dark:bg-slate-700 dark:text-white rounded-2xl text-2xl active:scale-90 shadow-md border border-slate-200 dark:border-slate-600">⬇</button>
                <button onClick={() => setDir({ x: 1, y: 0 })} className="w-14 h-14 bg-white dark:bg-slate-700 dark:text-white rounded-2xl text-2xl active:scale-90 shadow-md border border-slate-200 dark:border-slate-600">➡</button>
            </div>
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
// 游戏 6: 中国象棋 - 沉浸式对弈版
// =============================================
type PieceSide = 'RED' | 'BLACK';
type PieceType = '将' | '士' | '象' | '马' | '车' | '炮' | '卒' | '帥' | '仕' | '相' | '傌' | '俥' | '炮' | '兵';

interface Piece {
  id: number;
  type: PieceType;
  side: PieceSide;
  r: number;
  c: number;
}

const INITIAL_PIECES: Piece[] = [
  // 黑方 (上)
  { id: 1, type: '车', side: 'BLACK', r: 0, c: 0 }, { id: 2, type: '马', side: 'BLACK', r: 0, c: 1 }, { id: 3, type: '象', side: 'BLACK', r: 0, c: 2 },
  { id: 4, type: '士', side: 'BLACK', r: 0, c: 3 }, { id: 5, type: '将', side: 'BLACK', r: 0, c: 4 }, { id: 6, type: '士', side: 'BLACK', r: 0, c: 5 },
  { id: 7, type: '象', side: 'BLACK', r: 0, c: 6 }, { id: 8, type: '马', side: 'BLACK', r: 0, c: 7 }, { id: 9, type: '车', side: 'BLACK', r: 0, c: 8 },
  { id: 10, type: '炮', side: 'BLACK', r: 2, c: 1 }, { id: 11, type: '炮', side: 'BLACK', r: 2, c: 7 },
  { id: 12, type: '卒', side: 'BLACK', r: 3, c: 0 }, { id: 13, type: '卒', side: 'BLACK', r: 3, c: 2 }, { id: 14, type: '卒', side: 'BLACK', r: 3, c: 4 },
  { id: 15, type: '卒', side: 'BLACK', r: 3, c: 6 }, { id: 16, type: '卒', side: 'BLACK', r: 3, c: 8 },
  // 红方 (下)
  { id: 17, type: '俥', side: 'RED', r: 9, c: 0 }, { id: 18, type: '傌', side: 'RED', r: 9, c: 1 }, { id: 19, type: '相', side: 'RED', r: 9, c: 2 },
  { id: 20, type: '仕', side: 'RED', r: 9, c: 3 }, { id: 21, type: '帥', side: 'RED', r: 9, c: 4 }, { id: 22, type: '仕', side: 'RED', r: 9, c: 5 },
  { id: 23, type: '相', side: 'RED', r: 9, c: 6 }, { id: 24, type: '傌', side: 'RED', r: 9, c: 7 }, { id: 25, type: '俥', side: 'RED', r: 9, c: 8 },
  { id: 26, type: '炮', side: 'RED', r: 7, c: 1 }, { id: 27, type: '炮', side: 'RED', r: 7, c: 7 },
  { id: 28, type: '兵', side: 'RED', r: 6, c: 0 }, { id: 29, type: '兵', side: 'RED', r: 6, c: 2 }, { id: 30, type: '兵', side: 'RED', r: 6, c: 4 },
  { id: 31, type: '兵', side: 'RED', r: 6, c: 6 }, { id: 32, type: '兵', side: 'RED', r: 6, c: 8 },
];

const GameChineseChess: React.FC = () => {
    const [pieces, setPieces] = useState<Piece[]>(INITIAL_PIECES);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [turn, setTurn] = useState<PieceSide>('RED');
    const [hint, setHint] = useState('红方先行，请点击选择棋子');

    const handleCellClick = (r: number, c: number) => {
        const pieceAtCell = pieces.find(p => p.r === r && p.c === c);

        if (selectedId === null) {
            // 选择棋子
            if (pieceAtCell && pieceAtCell.side === turn) {
                setSelectedId(pieceAtCell.id);
                setHint(`已选中 ${pieceAtCell.type}，请点击目标位置`);
            }
        } else {
            // 已选中，尝试移动
            const activePiece = pieces.find(p => p.id === selectedId)!;
            
            if (pieceAtCell && pieceAtCell.side === turn) {
                // 切换选择
                setSelectedId(pieceAtCell.id);
                return;
            }

            // 执行移动 (这里简化了规则校验，允许基础落子，增加游戏的流畅体验)
            // 如果目标位置有对方棋子，吃掉它
            setPieces(prev => {
                const filtered = prev.filter(p => p.r !== r || p.c !== c || p.id === selectedId);
                return filtered.map(p => p.id === selectedId ? { ...p, r, c } : p);
            });
            
            setSelectedId(null);
            const nextTurn = turn === 'RED' ? 'BLACK' : 'RED';
            setTurn(nextTurn);
            setHint(`${nextTurn === 'RED' ? '红方' : '黑方'}回合，请思考走位`);

            // 如果吃掉的是 将/帥，游戏结束
            if (pieceAtCell && (pieceAtCell.type === '将' || pieceAtCell.type === '帥')) {
                alert(`恭喜！${turn === 'RED' ? '红方' : '黑方'}赢得了比赛！`);
                setPieces(INITIAL_PIECES);
                setTurn('RED');
                setHint('红方先行，请点击选择棋子');
            }
        }
    };

    const reset = () => {
        setPieces(INITIAL_PIECES);
        setSelectedId(null);
        setTurn('RED');
        setHint('红方先行，请点击选择棋子');
    };

    return (
        <div className="flex flex-col items-center w-full max-w-sm select-none">
            <div className="mb-6 w-full flex justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-md border-b-4 border-slate-200">
                <div className="flex-1">
                    <p className="text-xs text-slate-400 font-black">当前进程</p>
                    <p className={`font-black ${turn === 'RED' ? 'text-red-600' : 'text-slate-800 dark:text-slate-200'}`}>
                        {hint}
                    </p>
                </div>
                <button onClick={reset} className="bg-slate-100 dark:bg-slate-700 px-4 py-2 rounded-xl text-xs font-black">重新摆盘</button>
            </div>

            <div className="relative bg-[#f4d0a0] p-2 md:p-4 rounded-lg shadow-2xl border-2 border-[#8b4513]">
                {/* 棋盘背景网格 */}
                <div className="grid grid-cols-8 grid-rows-9 border border-[#8b4513] bg-[#f4d0a0]">
                    {Array(9 * 10).fill(0).map((_, i) => {
                        const r = Math.floor(i / 9);
                        const c = i % 9;
                        const piece = pieces.find(p => p.r === r && p.c === c);
                        const isSelected = selectedId === piece?.id;

                        return (
                            <div 
                                key={i} 
                                onClick={() => handleCellClick(r, c)}
                                className={`w-8 h-8 md:w-10 md:h-10 border-[0.5px] border-[#8b4513]/20 flex items-center justify-center relative cursor-pointer`}
                            >
                                {/* 楚河汉界 */}
                                {r === 4 && c === 4 && (
                                    <div className="absolute inset-0 flex items-center justify-center whitespace-nowrap pointer-events-none text-[#8b4513]/40 font-black text-xs md:text-sm">
                                        楚 河  漢 界
                                    </div>
                                )}
                                
                                {piece && (
                                    <div className={`
                                        w-7 h-7 md:w-9 md:h-9 rounded-full border-2 flex items-center justify-center font-black text-sm md:text-lg z-10 transition-transform active:scale-90 shadow-md
                                        ${piece.side === 'RED' ? 'bg-[#f8e8c8] border-red-700 text-red-700' : 'bg-[#f8e8c8] border-zinc-800 text-zinc-800'}
                                        ${isSelected ? 'scale-110 !border-blue-500 shadow-blue-500/50 shadow-lg ring-2 ring-blue-500 ring-offset-2' : ''}
                                    `}>
                                        {piece.type}
                                    </div>
                                )}
                                
                                {/* 备选路径点提示 (如果是当前选中的合法展示，这里暂简化) */}
                                {isSelected && <div className="absolute w-2 h-2 bg-blue-400/50 rounded-full animate-ping"></div>}
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="mt-8 flex gap-6 text-xs md:text-sm font-bold text-slate-500 bg-white/50 dark:bg-slate-800/50 px-6 py-3 rounded-2xl">
                <div className="flex items-center gap-2">🔴 红方</div>
                <div className="flex items-center gap-2">⚫ 黑方</div>
                <div className="flex items-center gap-2">⚠️ 模拟对弈版</div>
            </div>
        </div>
    );
};

