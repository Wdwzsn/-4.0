import { supabase } from './src/config/supabase.js';

async function checkScores() {
    const { data, error } = await supabase.from('game_scores').select('*').limit(1);
    console.log("Error:", error);
    console.log("Data:", data);
}
checkScores();
