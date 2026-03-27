export interface MemberBasic {
  id: string;
  full_name: string;
  role: string;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  pinned: boolean;
  created_at: string;
  created_by: string | null;
  creator?: { full_name: string } | null;
}

export interface GroupMessage {
  id: string;
  sender_id: string | null;
  content: string;
  created_at: string;
  sender?: { full_name: string } | null;
}

export interface DirectMessage {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  read: boolean;
  created_at: string;
}
