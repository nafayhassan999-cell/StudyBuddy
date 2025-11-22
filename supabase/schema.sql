-- StudyBuddy Supabase Database Schema
-- Run these SQL commands in Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)

-- ============================================================================
-- 1. PROFILES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subjects TEXT[] DEFAULT '{}',
  goal TEXT,
  interests TEXT[] DEFAULT '{}',
  grade_level TEXT,
  streak INT DEFAULT 0,
  total_points INT DEFAULT 0,
  avatar_url TEXT,
  bio TEXT,
  location TEXT,
  timezone TEXT DEFAULT 'UTC',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS profiles_user_id_idx ON profiles(user_id);
CREATE INDEX IF NOT EXISTS profiles_email_idx ON profiles(email);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 2. CONNECTIONS TABLE (Study Buddy Connections)
-- ============================================================================
CREATE TABLE IF NOT EXISTS connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE NOT NULL,
  to_user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(from_user_id, to_user_id)
);

CREATE INDEX IF NOT EXISTS connections_from_user_idx ON connections(from_user_id);
CREATE INDEX IF NOT EXISTS connections_to_user_idx ON connections(to_user_id);
CREATE INDEX IF NOT EXISTS connections_status_idx ON connections(status);

ALTER TABLE connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their connections"
  ON connections FOR SELECT
  USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

CREATE POLICY "Users can create connections"
  ON connections FOR INSERT
  WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "Users can update received connections"
  ON connections FOR UPDATE
  USING (auth.uid() = to_user_id);

CREATE POLICY "Users can delete their connections"
  ON connections FOR DELETE
  USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

-- ============================================================================
-- 3. GROUPS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  privacy TEXT DEFAULT 'public' CHECK (privacy IN ('public', 'private')),
  owner_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE NOT NULL,
  avatar_url TEXT,
  member_count INT DEFAULT 1,
  max_members INT DEFAULT 50,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS groups_owner_idx ON groups(owner_id);
CREATE INDEX IF NOT EXISTS groups_category_idx ON groups(category);
CREATE INDEX IF NOT EXISTS groups_privacy_idx ON groups(privacy);

ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public groups are viewable by everyone"
  ON groups FOR SELECT
  USING (privacy = 'public' OR owner_id = auth.uid());

CREATE POLICY "Users can create groups"
  ON groups FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Group owners can update their groups"
  ON groups FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Group owners can delete their groups"
  ON groups FOR DELETE
  USING (auth.uid() = owner_id);

-- ============================================================================
-- 4. GROUP_MEMBERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

CREATE INDEX IF NOT EXISTS group_members_group_idx ON group_members(group_id);
CREATE INDEX IF NOT EXISTS group_members_user_idx ON group_members(user_id);

ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Group members can view members"
  ON group_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_members.group_id
      AND gm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join groups"
  ON group_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave groups"
  ON group_members FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 5. MESSAGES TABLE (Direct & Group Messages)
-- ============================================================================
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE NOT NULL,
  recipient_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  type TEXT DEFAULT 'text' CHECK (type IN ('text', 'image', 'file', 'voice')),
  file_url TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CHECK ((recipient_id IS NOT NULL AND group_id IS NULL) OR (recipient_id IS NULL AND group_id IS NOT NULL))
);

CREATE INDEX IF NOT EXISTS messages_sender_idx ON messages(sender_id);
CREATE INDEX IF NOT EXISTS messages_recipient_idx ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS messages_group_idx ON messages(group_id);
CREATE INDEX IF NOT EXISTS messages_created_at_idx ON messages(created_at DESC);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their direct messages"
  ON messages FOR SELECT
  USING (
    auth.uid() = sender_id OR auth.uid() = recipient_id OR
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = messages.group_id
      AND gm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- ============================================================================
-- 6. STUDY_SESSIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS study_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  creator_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INT DEFAULT 60,
  location TEXT,
  type TEXT DEFAULT 'virtual' CHECK (type IN ('virtual', 'in-person')),
  max_participants INT DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS study_sessions_group_idx ON study_sessions(group_id);
CREATE INDEX IF NOT EXISTS study_sessions_scheduled_idx ON study_sessions(scheduled_at);

ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view study sessions"
  ON study_sessions FOR SELECT
  USING (true);

CREATE POLICY "Users can create study sessions"
  ON study_sessions FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

-- ============================================================================
-- 7. SESSION_PARTICIPANTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS session_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES study_sessions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'attended')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(session_id, user_id)
);

CREATE INDEX IF NOT EXISTS session_participants_session_idx ON session_participants(session_id);
CREATE INDEX IF NOT EXISTS session_participants_user_idx ON session_participants(user_id);

ALTER TABLE session_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view session participants"
  ON session_participants FOR SELECT
  USING (true);

CREATE POLICY "Users can RSVP to sessions"
  ON session_participants FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their RSVP"
  ON session_participants FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 8. COURSES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  subject TEXT NOT NULL,
  difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  thumbnail_url TEXT,
  content JSONB, -- Store course structure, modules, lessons
  is_published BOOLEAN DEFAULT FALSE,
  enrolled_count INT DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0.0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS courses_creator_idx ON courses(creator_id);
CREATE INDEX IF NOT EXISTS courses_subject_idx ON courses(subject);
CREATE INDEX IF NOT EXISTS courses_published_idx ON courses(is_published);

ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published courses are viewable by everyone"
  ON courses FOR SELECT
  USING (is_published = TRUE OR creator_id = auth.uid());

CREATE POLICY "Users can create courses"
  ON courses FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Course creators can update their courses"
  ON courses FOR UPDATE
  USING (auth.uid() = creator_id);

-- ============================================================================
-- 9. COURSE_ENROLLMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS course_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE NOT NULL,
  progress INT DEFAULT 0, -- Percentage 0-100
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(course_id, user_id)
);

CREATE INDEX IF NOT EXISTS course_enrollments_course_idx ON course_enrollments(course_id);
CREATE INDEX IF NOT EXISTS course_enrollments_user_idx ON course_enrollments(user_id);

ALTER TABLE course_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their enrollments"
  ON course_enrollments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can enroll in courses"
  ON course_enrollments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their progress"
  ON course_enrollments FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 10. STUDY_PLANS TABLE (AI-Generated Study Plans)
-- ============================================================================
CREATE TABLE IF NOT EXISTS study_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  goal TEXT,
  duration_weeks INT DEFAULT 4,
  plan_data JSONB NOT NULL, -- AI-generated plan structure
  progress INT DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS study_plans_user_idx ON study_plans(user_id);

ALTER TABLE study_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their study plans"
  ON study_plans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create study plans"
  ON study_plans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their study plans"
  ON study_plans FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 11. EXAM_RESULTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS exam_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE NOT NULL,
  course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  score INT NOT NULL CHECK (score >= 0 AND score <= 100),
  total_questions INT NOT NULL,
  correct_answers INT NOT NULL,
  time_taken_seconds INT,
  exam_data JSONB, -- Questions, answers, explanations
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS exam_results_user_idx ON exam_results(user_id);
CREATE INDEX IF NOT EXISTS exam_results_course_idx ON exam_results(course_id);
CREATE INDEX IF NOT EXISTS exam_results_created_idx ON exam_results(created_at DESC);

ALTER TABLE exam_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their exam results"
  ON exam_results FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create exam results"
  ON exam_results FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 12. FILES TABLE (Storage references)
-- ============================================================================
CREATE TABLE IF NOT EXISTS files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uploader_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE NOT NULL,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_path TEXT NOT NULL, -- Path in Supabase Storage
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS files_uploader_idx ON files(uploader_id);
CREATE INDEX IF NOT EXISTS files_group_idx ON files(group_id);

ALTER TABLE files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view files in their groups"
  ON files FOR SELECT
  USING (
    uploader_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = files.group_id
      AND gm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can upload files"
  ON files FOR INSERT
  WITH CHECK (auth.uid() = uploader_id);

-- ============================================================================
-- 13. LEADERBOARD VIEW (Virtual table for performance)
-- ============================================================================
CREATE OR REPLACE VIEW leaderboard AS
SELECT
  p.id,
  p.user_id,
  p.name,
  p.avatar_url,
  p.total_points,
  p.streak,
  ROW_NUMBER() OVER (ORDER BY p.total_points DESC, p.streak DESC) AS rank
FROM profiles p
ORDER BY p.total_points DESC, p.streak DESC
LIMIT 100;

-- ============================================================================
-- 14. FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update trigger to relevant tables
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_connections_updated_at
  BEFORE UPDATE ON connections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_groups_updated_at
  BEFORE UPDATE ON groups
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to update group member count
CREATE OR REPLACE FUNCTION update_group_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE groups SET member_count = member_count + 1 WHERE id = NEW.group_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE groups SET member_count = member_count - 1 WHERE id = OLD.group_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER group_member_count_trigger
  AFTER INSERT OR DELETE ON group_members
  FOR EACH ROW
  EXECUTE FUNCTION update_group_member_count();

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on new auth user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 15. STORAGE BUCKETS (Run in Supabase Dashboard → Storage)
-- ============================================================================
-- Create these buckets in the Supabase Storage UI:
-- 1. 'avatars' - For user profile pictures
-- 2. 'group-files' - For group shared files
-- 3. 'course-thumbnails' - For course cover images
-- 4. 'notes' - For uploaded study materials

-- Storage policies (run after creating buckets):
-- For avatars bucket:
-- INSERT policy: Users can upload their own avatar
-- SELECT policy: Avatars are publicly accessible
-- UPDATE policy: Users can update their own avatar
-- DELETE policy: Users can delete their own avatar
