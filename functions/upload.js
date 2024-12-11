const { createClient } = require('@supabase/supabase-js');
const busboy = require('busboy');

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

    // 解析 multipart form-data
    const parseFormData = (event) => {
        return new Promise((resolve, reject) => {
            const fields = {};
            let fileBuffer = null;
            let fileName = '';

            const bb = busboy({ headers: event.headers });

            bb.on('file', (name, file, info) => {
                const chunks = [];
                fileName = info.filename;
                
                file.on('data', (data) => {
                    chunks.push(data);
                });

                file.on('end', () => {
                    fileBuffer = Buffer.concat(chunks);
                });
            });

            bb.on('field', (name, val) => {
                fields[name] = val;
            });

            bb.on('finish', () => {
                resolve({ fields, fileBuffer, fileName });
            });

            bb.on('error', (error) => {
                reject(error);
            });

            bb.write(Buffer.from(event.body, 'base64'));
            bb.end();
        });
    };

    try {
        const { fields, fileBuffer, fileName } = await parseFormData(event);
        
        if (!fileBuffer) {
            return {
                statusCode: 400,
                body: JSON.stringify({ 
                    success: false, 
                    message: '没有找到文件' 
                })
            };
        }

        // 上传文件到 Supabase Storage
        const fileExt = fileName.split('.').pop();
        const filePath = `public/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { data: fileData, error: uploadError } = await supabase
            .storage
            .from('photos')
            .upload(filePath, fileBuffer, {
                contentType: event.headers['content-type']
            });

        if (uploadError) throw uploadError;

        // 获取文件的公共URL
        const { data: { publicUrl } } = supabase
            .storage
            .from('photos')
            .getPublicUrl(filePath);

        // 保存记录到数据库
        const { data, error } = await supabase
            .from('photos')
            .insert([
                {
                    url: publicUrl,
                    description: fields.description,
                    category: fields.category
                }
            ]);

        if (error) throw error;

        return {
            statusCode: 200,
            body: JSON.stringify({ 
                success: true,
                data: { url: publicUrl }
            })
        };
    } catch (error) {
        console.error('Upload error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ 
                success: false, 
                message: error.message 
            })
        };
    }
}; 
