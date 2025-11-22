"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getProfile(userId?: string) {
  const supabase = await createClient();
  
  // If no userId provided, get current user's profile
  if (!userId) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    userId = user.id;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) {
    console.error("Error fetching profile:", error);
    return null;
  }

  return data;
}

export async function updateProfile(profileData: {
  name?: string;
  subjects?: string[];
  goal?: string;
  interests?: string[];
  grade_level?: string;
  bio?: string;
  location?: string;
  avatar_url?: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const { data, error } = await supabase
    .from("profiles")
    .upsert({
      user_id: user.id,
      ...profileData,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error("Error updating profile:", error);
    throw error;
  }

  revalidatePath("/profile");
  return data;
}

export async function updateStreak(increment: number = 1) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const { data, error } = await supabase.rpc("increment_streak", {
    user_id: user.id,
    amount: increment,
  });

  if (error) {
    console.error("Error updating streak:", error);
    throw error;
  }

  revalidatePath("/profile");
  revalidatePath("/leaderboard");
  return data;
}

export async function updatePoints(points: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("total_points")
    .eq("user_id", user.id)
    .single();

  const newTotal = (profile?.total_points || 0) + points;

  const { error } = await supabase
    .from("profiles")
    .update({ total_points: newTotal })
    .eq("user_id", user.id);

  if (error) {
    console.error("Error updating points:", error);
    throw error;
  }

  revalidatePath("/profile");
  revalidatePath("/leaderboard");
  return newTotal;
}

export async function searchProfiles(query: string, filters?: {
  subjects?: string[];
  grade_level?: string;
}) {
  const supabase = await createClient();

  let queryBuilder = supabase
    .from("profiles")
    .select("*")
    .ilike("name", `%${query}%`);

  if (filters?.subjects && filters.subjects.length > 0) {
    queryBuilder = queryBuilder.contains("subjects", filters.subjects);
  }

  if (filters?.grade_level) {
    queryBuilder = queryBuilder.eq("grade_level", filters.grade_level);
  }

  const { data, error } = await queryBuilder.limit(20);

  if (error) {
    console.error("Error searching profiles:", error);
    return [];
  }

  return data;
}
