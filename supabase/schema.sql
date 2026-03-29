-- ============================================
-- MathPath Supabase DB Schema
-- Supabase SQL Editor에서 실행하세요
-- ============================================

-- 1. 출판사
CREATE TABLE publishers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  logo_url TEXT,
  website_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. 과목
CREATE TABLE subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('common', 'general', 'career')),
  display_order INT NOT NULL
);

-- 3. 문제집
CREATE TABLE workbooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  publisher_id UUID REFERENCES publishers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  subtitle TEXT,
  book_type TEXT NOT NULL CHECK (book_type IN ('concept', 'type_basic', 'type_advanced', 'deep', 'past_exam')),
  difficulty_level INT NOT NULL CHECK (difficulty_level BETWEEN 1 AND 5),
  difficulty_sub TEXT CHECK (difficulty_sub IN ('low', 'mid', 'high')),
  problem_count INT,
  target_audience TEXT,
  cover_image_url TEXT,
  sample_images JSONB DEFAULT '[]',
  summary TEXT,
  description TEXT,
  pros JSONB DEFAULT '[]',
  cons JSONB DEFAULT '[]',
  recommended_for TEXT,
  purchase_url_kyobo TEXT,
  purchase_url_yes24 TEXT,
  tags JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  avg_rating NUMERIC(2,1) DEFAULT 0.0,
  review_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. 문제집-과목 매핑 (다대다)
CREATE TABLE workbook_subjects (
  workbook_id UUID REFERENCES workbooks(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  PRIMARY KEY (workbook_id, subject_id)
);

-- 5. 문제집 간 관계
CREATE TABLE workbook_relations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_workbook_id UUID REFERENCES workbooks(id) ON DELETE CASCADE,
  to_workbook_id UUID REFERENCES workbooks(id) ON DELETE CASCADE,
  relation_type TEXT NOT NULL CHECK (relation_type IN ('next_step', 'complement', 'alternative')),
  note TEXT,
  display_order INT DEFAULT 0
);

-- 6. 유튜브 리뷰 링크
CREATE TABLE workbook_youtube_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workbook_id UUID REFERENCES workbooks(id) ON DELETE CASCADE,
  youtube_url TEXT NOT NULL,
  channel_name TEXT,
  video_title TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. 추천 로드맵
CREATE TABLE roadmaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('grade', 'publisher')),
  publisher_id UUID REFERENCES publishers(id) ON DELETE SET NULL,
  target_start_level INT,
  target_end_level INT,
  display_order INT DEFAULT 0
);

-- 8. 로드맵 단계
CREATE TABLE roadmap_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roadmap_id UUID REFERENCES roadmaps(id) ON DELETE CASCADE,
  workbook_id UUID REFERENCES workbooks(id) ON DELETE CASCADE,
  step_order INT NOT NULL,
  is_optional BOOLEAN DEFAULT false,
  note TEXT
);

-- 9. 사용자 프로필 (Supabase Auth 연동)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  current_grade TEXT CHECK (current_grade IN ('high1', 'high2', 'high3', 'repeater')),
  current_level INT CHECK (current_level BETWEEN 1 AND 9),
  target_level INT CHECK (target_level BETWEEN 1 AND 9),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 10. 사용자 문제집 진행 상태
CREATE TABLE user_workbooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  workbook_id UUID REFERENCES workbooks(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed')),
  started_at DATE,
  completed_at DATE,
  days_spent INT GENERATED ALWAYS AS (
    CASE WHEN completed_at IS NOT NULL AND started_at IS NOT NULL
         THEN completed_at - started_at
         ELSE NULL END
  ) STORED,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, workbook_id)
);

-- 11. 문제집 리뷰
CREATE TABLE workbook_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workbook_id UUID REFERENCES workbooks(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  difficulty_felt TEXT CHECK (difficulty_felt IN ('easy', 'moderate', 'hard')),
  study_duration_days INT,
  title TEXT,
  content TEXT NOT NULL,
  pros TEXT,
  cons TEXT,
  recommend BOOLEAN DEFAULT true,
  likes_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(workbook_id, user_id)
);

-- 12. 리뷰 좋아요
CREATE TABLE review_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID REFERENCES workbook_reviews(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(review_id, user_id)
);

-- ============================================
-- 인덱스
-- ============================================
CREATE INDEX idx_workbooks_publisher ON workbooks(publisher_id);
CREATE INDEX idx_workbooks_difficulty ON workbooks(difficulty_level);
CREATE INDEX idx_workbooks_book_type ON workbooks(book_type);
CREATE INDEX idx_workbook_subjects_workbook ON workbook_subjects(workbook_id);
CREATE INDEX idx_workbook_subjects_subject ON workbook_subjects(subject_id);
CREATE INDEX idx_workbook_relations_from ON workbook_relations(from_workbook_id);
CREATE INDEX idx_workbook_relations_to ON workbook_relations(to_workbook_id);
CREATE INDEX idx_user_workbooks_user ON user_workbooks(user_id);
CREATE INDEX idx_user_workbooks_workbook ON user_workbooks(workbook_id);
CREATE INDEX idx_workbook_reviews_workbook ON workbook_reviews(workbook_id);
CREATE INDEX idx_roadmap_steps_roadmap ON roadmap_steps(roadmap_id);

-- ============================================
-- RLS (Row Level Security) 정책
-- ============================================

-- 공개 읽기 테이블
ALTER TABLE publishers ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE workbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE workbook_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE workbook_relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE workbook_youtube_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE roadmaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE roadmap_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE workbook_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_workbooks ENABLE ROW LEVEL SECURITY;

-- 공개 읽기 정책
CREATE POLICY "공개 읽기" ON publishers FOR SELECT USING (true);
CREATE POLICY "공개 읽기" ON subjects FOR SELECT USING (true);
CREATE POLICY "공개 읽기" ON workbooks FOR SELECT USING (true);
CREATE POLICY "공개 읽기" ON workbook_subjects FOR SELECT USING (true);
CREATE POLICY "공개 읽기" ON workbook_relations FOR SELECT USING (true);
CREATE POLICY "공개 읽기" ON workbook_youtube_links FOR SELECT USING (true);
CREATE POLICY "공개 읽기" ON roadmaps FOR SELECT USING (true);
CREATE POLICY "공개 읽기" ON roadmap_steps FOR SELECT USING (true);
CREATE POLICY "공개 읽기" ON workbook_reviews FOR SELECT USING (true);
CREATE POLICY "공개 읽기" ON review_likes FOR SELECT USING (true);

-- 프로필: 본인만 읽기/수정
CREATE POLICY "본인 프로필 읽기" ON profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "본인 프로필 수정" ON profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "프로필 생성" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 사용자 문제집: 본인만 CRUD
CREATE POLICY "본인 문제집 읽기" ON user_workbooks
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "본인 문제집 생성" ON user_workbooks
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "본인 문제집 수정" ON user_workbooks
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "본인 문제집 삭제" ON user_workbooks
  FOR DELETE USING (auth.uid() = user_id);

-- 리뷰: 모두 읽기, 본인만 작성/수정/삭제
CREATE POLICY "본인 리뷰 작성" ON workbook_reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "본인 리뷰 수정" ON workbook_reviews
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "본인 리뷰 삭제" ON workbook_reviews
  FOR DELETE USING (auth.uid() = user_id);

-- 리뷰 좋아요: 모두 읽기, 본인만 작성/삭제
CREATE POLICY "본인 좋아요 작성" ON review_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "본인 좋아요 삭제" ON review_likes
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 트리거: 프로필 자동 생성 (회원가입 시)
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', '학생'),
    NEW.raw_user_meta_data ->> 'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 트리거: 리뷰 작성/삭제 시 workbooks.avg_rating, review_count 자동 업데이트
-- ============================================
CREATE OR REPLACE FUNCTION public.update_workbook_rating()
RETURNS TRIGGER AS $$
DECLARE
  target_workbook_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_workbook_id := OLD.workbook_id;
  ELSE
    target_workbook_id := NEW.workbook_id;
  END IF;

  UPDATE workbooks SET
    avg_rating = COALESCE((
      SELECT ROUND(AVG(rating)::numeric, 1)
      FROM workbook_reviews
      WHERE workbook_id = target_workbook_id
    ), 0),
    review_count = (
      SELECT COUNT(*)
      FROM workbook_reviews
      WHERE workbook_id = target_workbook_id
    )
  WHERE id = target_workbook_id;

  IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_review_change
  AFTER INSERT OR UPDATE OR DELETE ON workbook_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_workbook_rating();

-- ============================================
-- 트리거: 좋아요 시 review.likes_count 자동 업데이트
-- ============================================
CREATE OR REPLACE FUNCTION public.update_review_likes()
RETURNS TRIGGER AS $$
DECLARE
  target_review_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_review_id := OLD.review_id;
  ELSE
    target_review_id := NEW.review_id;
  END IF;

  UPDATE workbook_reviews SET
    likes_count = (
      SELECT COUNT(*)
      FROM review_likes
      WHERE review_id = target_review_id
    )
  WHERE id = target_review_id;

  IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_like_change
  AFTER INSERT OR DELETE ON review_likes
  FOR EACH ROW EXECUTE FUNCTION public.update_review_likes();
