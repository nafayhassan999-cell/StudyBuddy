"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createGroup(groupData: {
  name: string;
  description?: string;
  category: string;
  privacy?: "public" | "private";
  max_members?: number;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const { data: group, error } = await supabase
    .from("groups")
    .insert({
      ...groupData,
      owner_id: user.id,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating group:", error);
    throw error;
  }

  // Add creator as first member
  await supabase
    .from("group_members")
    .insert({
      group_id: group.id,
      user_id: user.id,
      role: "owner",
    });

  revalidatePath("/groups");
  return group;
}

export async function joinGroup(groupId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const { data, error } = await supabase
    .from("group_members")
    .insert({
      group_id: groupId,
      user_id: user.id,
      role: "member",
    })
    .select()
    .single();

  if (error) {
    console.error("Error joining group:", error);
    throw error;
  }

  revalidatePath(`/groups/${groupId}`);
  revalidatePath("/groups");
  return data;
}

export async function leaveGroup(groupId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const { error } = await supabase
    .from("group_members")
    .delete()
    .eq("group_id", groupId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error leaving group:", error);
    throw error;
  }

  revalidatePath(`/groups/${groupId}`);
  revalidatePath("/groups");
  return true;
}

export async function getGroups(category?: string) {
  const supabase = await createClient();

  let query = supabase
    .from("groups")
    .select("*, owner:profiles!groups_owner_id_fkey(name, avatar_url)")
    .eq("privacy", "public")
    .order("created_at", { ascending: false });

  if (category) {
    query = query.eq("category", category);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching groups:", error);
    return [];
  }

  return data;
}

export async function getGroupById(groupId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("groups")
    .select(`
      *,
      owner:profiles!groups_owner_id_fkey(*),
      members:group_members(*, profile:profiles(*))
    `)
    .eq("id", groupId)
    .single();

  if (error) {
    console.error("Error fetching group:", error);
    return null;
  }

  return data;
}

export async function sendGroupMessage(groupId: string, content: string, type: string = "text") {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const { data, error } = await supabase
    .from("messages")
    .insert({
      sender_id: user.id,
      group_id: groupId,
      content,
      type,
    })
    .select()
    .single();

  if (error) {
    console.error("Error sending message:", error);
    throw error;
  }

  revalidatePath(`/groups/${groupId}`);
  return data;
}

export async function getGroupMessages(groupId: string, limit: number = 50) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("messages")
    .select("*, sender:profiles!messages_sender_id_fkey(name, avatar_url)")
    .eq("group_id", groupId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching messages:", error);
    return [];
  }

  return data.reverse(); // Reverse to show oldest first
}
