async function testRegister() {
    try {
        const res = await fetch('http://localhost:3001/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                phone: '13999999999',
                password: 'password123',
                confirmPassword: 'password123',
                name: 'TestUser123'
            })
        });
        const data = await res.json();
        console.log('Response:', data);
    } catch (err) {
        console.error('Error:', err);
    }
}

testRegister();
