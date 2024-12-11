const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') {
        return { 
            statusCode: 405, 
            body: JSON.stringify({ success: false, message: '只允许 POST 请求' })
        };
    }

    try {
        const { username, password } = JSON.parse(event.body);

        const { data: { user }, error } = await supabase.auth.signInWithPassword({
            email: username,
            password: password
        });

        if (error) throw error;

        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                user: user
            })
        };
    } catch (error) {
        return {
            statusCode: 401,
            body: JSON.stringify({
                success: false,
                message: '用户名或密码错误'
            })
        };
    }
};
