"use client";

import { useParams } from "next/navigation";
import AbsenceNoticesPage from "@/components/main/absence-notices/AbsenceNoticesPage";

export default function AbsenceNoticeDetailRoute() {
  const params = useParams();
  const id = params?.id as string | undefined;

  return <AbsenceNoticesPage initialNoticeId={id} />;
}