-- counseling_sessions テーブルに status カラムを追加
-- 既存のレコードは 'completed' として扱う（過去データは完了済み）
ALTER TABLE counseling_sessions
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'in_progress';

-- 既存レコードを completed に更新
UPDATE counseling_sessions SET status = 'completed' WHERE status = 'in_progress' OR status IS NULL;

-- コメント追加
COMMENT ON COLUMN counseling_sessions.status IS 'セッション状態: in_progress（進行中）, completed（完了）';
