"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function sendConnectionRequest(toUserId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const { data, error } = await supabase
    .from("connections")
    .insert({
      from_user_id: user.id,
      to_user_id: toUserId,
      status: "pending",
    })
    .select()
    .single();

  if (error) {
    console.error("Error sending connection request:", error);
    throw error;
  }

  revalidatePath("/requests");
  return data;
}

export async function acceptConnectionRequest(connectionId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const { data, error } = await supabase
    .from("connections")
    .update({ status: "accepted" })
    .eq("id", connectionId)
    .eq("to_user_id", user.id)
    .select()
    .single();

  if (error) {
    console.error("Error accepting connection:", error);
    throw error;
  }

  revalidatePath("/requests");
  revalidatePath("/dashboard");
  return data;
}

export async function declineConnectionRequest(connectionId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const { data, error } = await supabase
    .from("connections")
    .update({ status: "declined" })
    .eq("id", connectionId)
    .eq("to_user_id", user.id)
    .select()
    .single();

  if (error) {
    console.error("Error declining connection:", error);
    throw error;
  }

  revalidatePath("/requests");
  return data;
}

export async function getConnections(status: "pending" | "accepted" | "declined" = "accepted") {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from("connections")
    .select(`
      *,
      from_profile:profiles!connections_from_user_id_fkey(*),
      to_profile:profiles!connections_to_user_id_fkey(*)
    `)
    .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
    .eq("status", status);

  if (error) {
    console.error("Error fetching connections:", error);
    return [];
  }

  return data;
}

export async function removeConnection(connectionId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const { error } = await supabase
    .from("connections")
    .delete()
    .eq("id", connectionId)
    .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`);

  if (error) {
    console.error("Error removing connection:", error);
    throw error;
  }

  revalidatePath("/dashboard");
  return true;
}
