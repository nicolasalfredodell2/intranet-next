"use client";

import { useParams } from "next/navigation";
import AbsenceNoticeDetail from "./AbsenceNoticeDetail";

export default function AbsenceNoticeDetailPage() {
  const params = useParams();
  const id = params?.id as string | undefined;

  return <AbsenceNoticeDetail id={id} />;
}