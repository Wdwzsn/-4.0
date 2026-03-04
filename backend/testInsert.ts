import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);

async function testInsert() {
    const mockData = {
        title: "Test Exercise",
        category: "太极拳",
        thumbnail: "https://example.com/thumb.jpg",
        video_url: "https://example.com/video.mp4",
        description: "Test description",
        article_body: "Test article",
        views: 0,
        likes: 0
    };

    console.log("Attempting insert...");
    const { data, error } = await supabase
        .from('exercises')
        .insert([mockData])
        .select()
        .single();

    if (error) {
        console.error("Insert failed:", error);
    } else {
        console.log("Insert success:", data);
        // Clean up
        await supabase.from('exercises').delete().eq('id', data.id);
    }
}

testInsert();
