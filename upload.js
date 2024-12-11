const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: '只允许 POST 请求' };
    }

    try {
        const { file, description, category } = JSON.parse(event.body);
        
        // 上传文件到 Supabase Storage
        const { data: fileData, error: fileError } = await supabase
            .storage
            .from('photos')
            .upload(`public/${Date.now()}-${file.name}`, file);

        if (fileError) throw fileError;

        // 保存记录到数据库
        const { data, error } = await supabase
            .from('photos')
            .insert([
                {
                    url: fileData.publicUrl,
                    description,
                    category
                }
            ]);

        if (error) throw error;

        return {
            statusCode: 200,
            body: JSON.stringify({ success: true })
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ 
                success: false, 
                message: error.message 
            })
        };
    }
}; 