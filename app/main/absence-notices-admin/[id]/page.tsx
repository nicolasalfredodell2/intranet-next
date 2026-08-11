"use client";

import { useParams } from "next/navigation";
import AbsenceNoticesAdminPage from "@/components/main/absence-notices-admin/AbsenceNoticesAdminPage";

export default function AbsenceNoticeAdminDetailRoute() {
  const params = useParams();
  const id = params?.id as string | undefined;

  return <AbsenceNoticesAdminPage initialNoticeId={id} />;
}
