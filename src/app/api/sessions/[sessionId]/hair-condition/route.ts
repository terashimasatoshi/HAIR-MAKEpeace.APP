import { NextResponse } from 'next/server';
import { createServiceSupabaseClient } from '@/lib/supabase';

// 髪の状態を保存
export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const supabase = createServiceSupabaseClient();
    const body = await request.json();
    
    console.log('Saving hair condition for session:', sessionId);
    console.log('Data:', body);
    
    // 既存のレコードがあるか確認
    const { data: existing } = await supabase
      .from('hair_conditions')
      .select('id')
      .eq('session_id', sessionId)
      .eq('timing', body.timing || 'before')
      .single();

    let result;
    
    if (existing) {
      // 更新
      const { data, error } = await supabase
        .from('hair_conditions')
        .update({
          root_damage: body.rootDamage,
          middle_damage: body.middleDamage,
          ends_damage: body.endsDamage,
          root_curl: body.rootCurl,
          middle_curl: body.middleCurl,
          ends_curl: body.endsCurl,
          last_color: body.lastColor,
          bleach_count: body.bleachCount,
          bleach_last_date: body.bleachLastDate,
          has_straightening: body.hasStraightening,
          straightening_last_date: body.straighteningLastDate,
          shine_level: body.shineLevel,
          texture: body.texture,
          manageability: body.manageability,
        })
        .eq('id', existing.id)
        .select()
        .single();
      
      if (error) throw error;
      result = data;
    } else {
      // 新規作成
      const { data, error } = await supabase
        .from('hair_conditions')
        .insert({
          session_id: sessionId,
          timing: body.timing || 'before',
          root_damage: body.rootDamage,
          middle_damage: body.middleDamage,
          ends_damage: body.endsDamage,
          root_curl: body.rootCurl,
          middle_curl: body.middleCurl,
          ends_curl: body.endsCurl,
          last_color: body.lastColor,
          bleach_count: body.bleachCount,
          bleach_last_date: body.bleachLastDate,
          has_straightening: body.hasStraightening,
          straightening_last_date: body.straighteningLastDate,
          shine_level: body.shineLevel,
          texture: body.texture,
          manageability: body.manageability,
        })
        .select()
        .single();
      
      if (error) throw error;
      result = data;
    }

    console.log('Hair condition saved:', result);

    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    console.error('API error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// 髪の状態を取得
export async function GET(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const supabase = createServiceSupabaseClient();
    const { searchParams } = new URL(request.url);
    const timing = searchParams.get('timing') || 'before';
    
    const { data, error } = await supabase
      .from('hair_conditions')
      .select('*')
      .eq('session_id', sessionId)
      .eq('timing', timing)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return NextResponse.json(data || null);
  } catch (err) {
    console.error('API error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
