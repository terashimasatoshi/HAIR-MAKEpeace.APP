-- customers テーブルに初回アンケート回答カラムを追加
ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS questionnaire JSONB DEFAULT NULL;

COMMENT ON COLUMN customers.questionnaire IS '初回カウンセリングアンケート回答（髪の悩み、スタイリング時間、施術中の過ごし方、美容師への要望、過去の不満）';
