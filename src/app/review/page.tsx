import type { Metadata } from "next";
import { Review } from "@/components/Review";

export const metadata: Metadata = { title: "Review a plan · Countersign" };

export default function ReviewPage() {
  return <Review />;
}
