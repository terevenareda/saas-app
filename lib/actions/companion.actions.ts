'use server';

import {auth} from "@clerk/nextjs/server";
import {createSupabaseClient} from "@/lib/supabase";
import {revalidatePath} from "next/cache";

export const createCompanion = async (formData: CreateCompanion)=>{
    const {userId: author} = await auth();
    const supabase = createSupabaseClient();

    const {data, error} = await supabase
        .from('companions')
        .insert({...formData, author})
        .select();

    if (error || !data) throw new Error(error?.message || 'Failed to create companion');
    return data[0];
}

export const getAllCompanions = async({limit=10, page=1,subject,topic}: GetAllCompanions)=>{
    const supabase = createSupabaseClient();

    let query = supabase
        .from('companions')
        .select();

    if (subject && topic){
        query = query.ilike('subject',`%${subject}%`)
            .or(`topic.ilike.%${topic}%,name.ilike.%${topic}%`)
    } else if(subject){
        query = query.ilike('subject',`%${subject}%`)

    } else if(topic){
        query = query.or(`topic.ilike.%${topic}%,name.ilike.%${topic}%`)
    }

    query = query.range((page-1) * limit, page * limit-1);

    const {data : companions, error} = await query;
    if (error) throw new Error(error?.message || 'Failed to getAllCompanions');
    return companions;
}

export const getCompanion = async (id: string) => {
    const supabase = createSupabaseClient();

    const {data, error} =  await supabase
        .from('companions')
        .select()
        .eq('id', id)

    if(error) return console.log(error);
    return data[0];
}

export const addToSessionHistory = async(companionId: string) => {
    const {userId} = await auth();
    const supabase = createSupabaseClient();
    const {data, error} = await supabase
        .from('session_history')
        .insert({
            companion_id: companionId,
            user_id: userId,
        })

    if(error) throw new Error(error?.message || 'Failed to add to session history');
    return data;

}

export const getRecentSessions = async(limit=10) => {
    const supabase = createSupabaseClient();
    const {data, error} = await supabase
        .from('session_history')
        .select('companions:companion_id(*)')
        .order('created_at',{ascending: false})
        .limit(limit)

    if(error) throw new Error(error?.message || 'Failed to getRecentSessions');

    return data?.map(({companions}) => companions);
}

export const getUserSessions = async(userId: string,limit=10) => {
    const supabase = createSupabaseClient();
    const {data, error} = await supabase
        .from('session_history')
        .select('companions:companion_id(*)')
        .eq('user_id', userId)
        .order('created_at',{ascending: false})
        .limit(limit)

    if(error) throw new Error(error?.message || 'Failed to getRecentSessions');

    return data?.map(({companions}) => companions);
}

export const getUserCompanions = async(userId: string) => {
    const supabase = createSupabaseClient();
    const {data, error} = await supabase
        .from('companions')
        .select()
        .eq('author', userId)
        .order('is_bookmarked', { ascending: true })
        .order('created_at',{ascending: false})

    if(error) throw new Error(error?.message || 'Failed to get Companions');

    return data;
}

export const newCompanionPermissions = async() =>{
    const supabase = createSupabaseClient();
    const {userId, has} = await auth();

    let limit = 0;

    if (has({plan:'pro'})){
        return true;
    } else if(has({feature : "3_active_companions"})){
        limit=3;
    } else if(has({feature : "10_active_companions"})){
        limit=10;
    }

    const {data, error} = await supabase
        .from('companions')
        .select('id',{count: 'exact'})
        .eq('author',userId)

    if(error) throw new Error(error.message);

    const companionCount = data?.length;

    if(companionCount >= limit){
        return false;
    }
    else{
        return true;
    }
}

export async function toggleBookmark(companionId: string, newValue: boolean) {
    const supabase = createSupabaseClient();

    const { error } = await supabase
        .from("companions")
        .update({ is_bookmarked: newValue })
        .eq("id", companionId)

    if (error) {
        return { success: false, error: error.message };
    }

    revalidatePath("/companions");
    return { success: true };
}










