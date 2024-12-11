const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

exports.handler = async function(event, context) {
    try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) throw error;

        return {
            statusCode: 200,
            body: JSON.stringify({
                logged_in: !!session,
                user: session?.user || null
            })
        };
    } catch (error) {
        return {
            statusCode: 200,
            body: JSON.stringify({
                logged_in: false,
                error: error.message
            })
        };
    }
};
