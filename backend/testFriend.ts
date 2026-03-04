import axios from 'axios';
import { supabase } from './src/config/supabase.js';

const testFriendRequest = async () => {
    try {
        const phoneA = '13888888881';
        const phoneB = '13888888882';

        // 1. 删除旧数据
        await supabase.from('users').delete().in('phone', [phoneA, phoneB]);

        // 2. 注册A
        const regA = await axios.post('http://localhost:3001/api/auth/register', {
            phone: phoneA, password: 'password', confirmPassword: 'password', name: 'UserA', gender: '男'
        });
        const tokenA = regA.data.data.token;

        // 3. 注册B
        await axios.post('http://localhost:3001/api/auth/register', {
            phone: phoneB, password: 'password', confirmPassword: 'password', name: 'UserB', gender: '女'
        });

        console.log('Got tokenA:', !!tokenA);
        console.log('Sending request from A to B:', phoneB);

        // 4. A向B发送请求
        const reqRes = await axios.post('http://localhost:3001/api/friends/request', {
            toPhone: phoneB
        }, {
            headers: { Authorization: `Bearer ${tokenA}` }
        });

        console.log('Request success:', reqRes.data);

        // 5. 再次发送验证重复请求处理
        try {
            await axios.post('http://localhost:3001/api/friends/request', {
                toPhone: phoneB
            }, {
                headers: { Authorization: `Bearer ${tokenA}` }
            });
        } catch (repeatErr: any) {
            console.log('Repeat request correctly failed:', repeatErr.response?.data);
        }

    } catch (e: any) {
        console.error('Test Error:', e.response?.data || e.message);
    }
}
testFriendRequest();
